import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
	differenceOf,
	fetchFirstPinned,
	fetchPinned,
	isStepBack,
	readChangeList,
	runningRelease,
	summaryFor,
	type ChapterEntry,
} from './legislationChange.ts';

const hexOf = (text: string) => createHash('sha256').update(text).digest('hex');

const TAX = 'class Tax:\n    """Año Nuevo"""\n';
const CHANGE_LIST = {
	kind: 'realms-gos/legislation-change',
	format: 1,
	realm: 'eu/es/vc/46250-valencia',
	replaces: 'sha256:4be1',
	set: [
		{
			chapter: 'eu/es/vc/46250-valencia/tax',
			url: 'https://raw.example.org/commit/tax.py',
			mirrors: ['https://mirror.example.org/tax.py'],
			sha256: hexOf(TAX),
			size: 412,
		},
	],
	remove: ['eu/es/vc/46250-valencia/water'],
	release: null,
	report: { url: 'https://raw.example.org/commit/report.md', sha256: hexOf('# Report') },
	summary: { 'ca-valencia': 'IBI 2027: bonificació', es: 'IBI 2027: bonificación', en: 'IBI 2027: bonus' },
};

/** A fetch that answers each address from a table; an address not in it is a 404. */
const serving =
	(files: Record<string, string | Error>): typeof fetch =>
	async (url) => {
		const body = files[String(url)];
		if (body instanceof Error) throw body;
		return body === undefined ? new Response('', { status: 404 }) : new Response(body);
	};

describe('reading a change list', () => {
	it('gives what the realm reads of it, the chapters\' checksums in the realm\'s own form', () => {
		const list = readChangeList(JSON.stringify(CHANGE_LIST));
		assert.equal(list.realm, 'eu/es/vc/46250-valencia');
		assert.equal(list.replaces, 'sha256:4be1');
		assert.deepEqual(list.set, [
			{
				chapter: 'eu/es/vc/46250-valencia/tax',
				urls: ['https://raw.example.org/commit/tax.py', 'https://mirror.example.org/tax.py'],
				sha256: `sha256:${hexOf(TAX)}`,
				size: 412,
			},
		]);
		assert.deepEqual(list.remove, ['eu/es/vc/46250-valencia/water']);
		assert.deepEqual(list.report, CHANGE_LIST.report);
	});

	it('refuses what is not a change list', () => {
		assert.throws(() => readChangeList('[]'));
		assert.throws(() => readChangeList('{"kind": "something else", "format": 1}'));
		assert.throws(() => readChangeList(JSON.stringify({ ...CHANGE_LIST, format: 2 })));
		assert.throws(() => readChangeList('not json'));
	});

	it('shows a release\'s chapter that has no address, the realm serves it by checksum', () => {
		const list = readChangeList(
			JSON.stringify({
				...CHANGE_LIST,
				release: { source: 'eu/es', version: '2.4.0' },
				set: [{ chapter: 'eu/es/tax', sha256: hexOf('x') }],
			}),
		);
		assert.deepEqual(list.set[0].urls, []);
		assert.equal(list.set[0].size, null);
		assert.deepEqual(list.release, { source: 'eu/es', version: '2.4.0' });
	});

	it('keeps a report only when it is well formed, since the realm never reads it', () => {
		for (const report of [
			{ url: 'http://raw.example.org/report.md', sha256: hexOf('x') },
			{ url: 'https://raw.example.org/report.md', sha256: 'abc' },
			{ url: 'https://raw.example.org/report.md', sha256: hexOf('x').toUpperCase() },
			{ url: 7, sha256: hexOf('x') },
			'report.md',
		]) {
			assert.equal(readChangeList(JSON.stringify({ ...CHANGE_LIST, report })).report, null, JSON.stringify(report));
		}
		assert.equal(readChangeList(JSON.stringify({ ...CHANGE_LIST, report: undefined })).report, null);
	});

	it('refuses a key repeated in any object, as the realm does, and no other repeat', () => {
		const text = JSON.stringify(CHANGE_LIST);
		assert.throws(() => readChangeList(text.replace('"realm":', '"realm":"x","realm":')), /repeats the key realm/);
		assert.throws(() => readChangeList(text.replace('"chapter":', '"chapter":"x","chapter":')), /repeats the key chapter/);
		assert.throws(() => readChangeList(text.replace('"summary":{', '"summary":{"es":"otro",')), /repeats the key es/);
		// The same key in two objects, in two elements of a list, or as a value, text that looks like JSON: fine.
		const twice = { ...CHANGE_LIST, set: [CHANGE_LIST.set[0], { ...CHANGE_LIST.set[0], chapter: 'eu/es/vc/46250-valencia/tax2' }] };
		assert.doesNotThrow(() => readChangeList(JSON.stringify(twice)));
		const tricky = { ...CHANGE_LIST, summary: { en: '{"a": 1, "a": 2} and "realm": ,' } };
		assert.equal(readChangeList(JSON.stringify(tricky)).summary.en, '{"a": 1, "a": 2} and "realm": ,');
	});

	it('reads a change list with no summary, no removals and no chapters', () => {
		const list = readChangeList(JSON.stringify({ kind: CHANGE_LIST.kind, format: 1, realm: 'x', release: { source: 'a', version: '1' } }));
		assert.deepEqual([list.set, list.remove, list.summary, list.replaces], [[], [], {}, null]);
	});
});

describe('the summary', () => {
	const summary = CHANGE_LIST.summary;

	it('is in the viewer\'s language, or its base language', () => {
		assert.deepEqual(summaryFor(summary, 'es'), { language: 'es', text: 'IBI 2027: bonificación' });
		assert.deepEqual(summaryFor(summary, 'es-ES'), { language: 'es', text: 'IBI 2027: bonificación' });
		assert.equal(summaryFor(summary, 'ca-valencia')?.language, 'ca-valencia');
	});

	it('falls back to English, then to the first one given, then to none', () => {
		assert.equal(summaryFor(summary, 'de')?.language, 'en');
		assert.deepEqual(summaryFor({ fr: 'Résumé' }, 'de'), { language: 'fr', text: 'Résumé' });
		assert.equal(summaryFor({}, 'en'), null);
	});
});

describe('comparing a chapter with the running codex', () => {
	const entry = (sha256: string): ChapterEntry => ({ chapter: 'eu/es/tax', urls: [], sha256, size: null });
	const running = { 'eu/es/tax': { sha256: 'sha256:aa' } };

	it('is new, changed or the same', () => {
		assert.equal(differenceOf(entry('sha256:aa'), running), 'same');
		assert.equal(differenceOf(entry('sha256:bb'), running), 'changed');
		assert.equal(differenceOf(entry('sha256:aa'), {}), 'new');
	});
});

describe('fetching what a proposal pins', () => {
	const url = 'https://raw.example.org/commit/tax.py';

	it('gives the text whose checksum is pinned', async () => {
		assert.deepEqual(await fetchPinned(url, hexOf(TAX), 1024, serving({ [url]: TAX })), { ok: true, text: TAX });
	});

	it('refuses other bytes at the address, however plausible', async () => {
		assert.deepEqual(await fetchPinned(url, hexOf(TAX), 1024, serving({ [url]: TAX + '# changed\n' })), { ok: false, reason: 'wrong_bytes' });
	});

	it('refuses an address that is not https without asking it', async () => {
		let asked = false;
		const fetcher: typeof fetch = async () => ((asked = true), new Response(TAX));
		assert.deepEqual(await fetchPinned('http://raw.example.org/tax.py', hexOf(TAX), 1024, fetcher), { ok: false, reason: 'not_https' });
		assert.equal(asked, false);
	});

	it('stops reading a body that passes the limit', async () => {
		const big = 'x'.repeat(2048);
		assert.deepEqual(await fetchPinned(url, hexOf(big), 1024, serving({ [url]: big })), { ok: false, reason: 'too_large' });
		assert.deepEqual(await fetchPinned(url, hexOf(big), 2048, serving({ [url]: big })), { ok: true, text: big });
	});

	it('says an address it cannot reach is unreachable, whether it fails, refuses or is not found', async () => {
		const unreachable = { ok: false, reason: 'unreachable' };
		assert.deepEqual(await fetchPinned(url, hexOf(TAX), 1024, serving({ [url]: new Error('blocked by CORS') })), unreachable);
		assert.deepEqual(await fetchPinned(url, hexOf(TAX), 1024, serving({})), unreachable);
	});

	it('refuses bytes that are not UTF-8, though their checksum is pinned', async () => {
		const bytes = new Uint8Array([0xff, 0xfe, 0x41]);
		const pinned = createHash('sha256').update(bytes).digest('hex');
		const fetcher: typeof fetch = async () => new Response(bytes);
		assert.deepEqual(await fetchPinned(url, pinned, 1024, fetcher), { ok: false, reason: 'not_text' });
	});

	it('tries the mirrors in order, as the realm does, and gives the first that matches', async () => {
		const mirror = 'https://mirror.example.org/tax.py';
		const urls = [url, mirror, 'https://other.example.org/tax.py'];
		assert.deepEqual(await fetchFirstPinned(urls, hexOf(TAX), 1024, serving({ [url]: 'tampered', [mirror]: TAX })), { ok: true, text: TAX });
		assert.deepEqual(await fetchFirstPinned(urls, hexOf(TAX), 1024, serving({ [url]: 'tampered' })), { ok: false, reason: 'unreachable' });
		assert.deepEqual(await fetchFirstPinned([], hexOf(TAX), 1024, serving({})), { ok: false, reason: 'unreachable' });
	});
});

describe('the release of a layer the realm runs, and a step back', () => {
	const chapters = {
		'eu/es/tax': { source: 'eu/es', version: '2.6.0' },
		'eu/es/procedure': { source: 'eu/es', version: '2.6.0' },
		'eu/es/vc/46250-valencia/tax': { source: 'eu/es/vc/46250-valencia', version: '' },
	};

	it('is the version the layer\'s chapters carry, and nothing for a layer the realm does not run', () => {
		assert.equal(runningRelease(chapters, 'eu/es'), '2.6.0');
		assert.equal(runningRelease(chapters, 'eu'), '');
		assert.equal(runningRelease(chapters, 'eu/es/vc/46250-valencia'), ''); // the realm's own layer has no version
		assert.equal(runningRelease(undefined, 'eu/es'), '');
		assert.equal(runningRelease(null, 'eu/es'), '');
	});

	it('is a step back only where a sync source marks that very release so', () => {
		const release = { source: 'eu/es', version: '2.4.0' };
		const marked = [{ installable: [{ source: 'eu/es', version: '2.4.0', step_back: true }] }];
		assert.equal(isStepBack(marked, release), true);
		assert.equal(isStepBack([{ installable: [{ source: 'eu/es', version: '2.4.0' }] }], release), false); // plain
		assert.equal(isStepBack([{ installable: [{ source: 'eu/es', version: '2.4.0', step_back: false }] }], release), false);
		assert.equal(isStepBack(marked, { source: 'eu/es', version: '2.5.0' }), false); // another release of the layer
		assert.equal(isStepBack(marked, { source: 'eu', version: '2.4.0' }), false); // another layer
		assert.equal(isStepBack([{}, ...marked], release), true); // a source that lists nothing
		assert.equal(isStepBack([], release), false);
		assert.equal(isStepBack(undefined, release), false); // a realm that does not say
	});
});

describe('the strings of the component', () => {
	const english: Record<string, string> = JSON.parse(
		readFileSync(new URL('../../frontend/i18n/locales/extensions/voting/en.json', import.meta.url), 'utf8'),
	);

	it('are all in English', () => {
		const source = readFileSync(new URL('./LegislationChange.svelte', import.meta.url), 'utf8');
		const asked = new Set([...source.matchAll(/\bt\('([a-z_]+)'/g)].map(([, key]) => key));
		// Built from a state: t(`fetch_${reason}`) and t(`chapter_${difference}`).
		for (const reason of ['not_https', 'unreachable', 'too_large', 'wrong_bytes', 'not_text']) asked.add(`fetch_${reason}`);
		for (const difference of ['new', 'changed', 'same']) asked.add(`chapter_${difference}`);
		assert.deepEqual([...asked].filter((key) => !(key in english)), []);
	});
});
