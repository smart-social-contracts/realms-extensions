import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
	can,
	complianceOf,
	failureRows,
	installProposal,
	isLayered,
	layerRows,
	parseInterval,
	rowOrigin,
	shortId,
	valueText,
	type LayeredCodex,
	type ViewRow,
} from './legislation.ts';
import { interpolate } from '../../../_shared/frontend/extension-i18n.ts';

const codex: LayeredCodex = {
	id: 'sha256:3f1c9a7be2d04c11',
	status: 'active',
	layers: ['eu/es', 'eu/es/vc', 'eu/es/vc/46250-valencia'],
	chapters: {
		'eu/es/tax': { source: 'eu/es', version: '2.4.0', sha256: 'sha256:aa', vouched_by: 'rrkah-fqaaa-aaaaa-aaaaq-cai', route: 'capital' },
		'eu/es/procedure': { source: 'eu/es', version: '2.4.0', sha256: 'sha256:bb', vouched_by: 'rrkah-fqaaa-aaaaa-aaaaq-cai', route: 'capital' },
		'eu/es/vc/tax': { source: 'eu/es/vc', version: '1.1.0', sha256: 'sha256:cc', vouched_by: 'rrkah-fqaaa-aaaaa-aaaaq-cai', route: 'https' },
		'eu/es/vc/46250-valencia/tax': { source: 'eu/es/vc/46250-valencia', version: '', sha256: 'sha256:dd', vouched_by: '', route: 'https' },
	},
	previous: 'sha256:0123456789abcdef',
	installed_at: 1_800_000_000,
	activates_at: null,
	proposal: 'P-12',
};

describe('who may act', () => {
	it('lets a holder of the permission, or of all, act', () => {
		assert.equal(can(['proposal.create'], 'proposal.create'), true);
		assert.equal(can(['all'], 'codex.revert_fast'), true);
		assert.equal(can(['proposal.create', 'self.join'], 'codex.revert_fast'), false);
		assert.equal(can([], 'realm.configure'), false);
	});
});

describe('what the realm runs', () => {
	it('tells a layered codex from a legacy one and from none', () => {
		assert.equal(isLayered(codex), true);
		assert.equal(isLayered({ id: 'agora@1.0.0', version: '1.0.0' }), false);
		assert.equal(isLayered(null), false);
	});

	it('shortens a checksum and leaves a short id alone', () => {
		assert.equal(shortId(codex.id), 'sha256:3f1c9a7b…');
		assert.equal(shortId('agora@1.0.0'), 'agora@1.0.0');
	});

	it('groups the chapters by layer, in the order of the layers', () => {
		assert.deepEqual(layerRows(codex), [
			{ source: 'eu/es', version: '2.4.0', domains: ['procedure', 'tax'], vouchedBy: ['rrkah-fqaaa-aaaaa-aaaaq-cai'] },
			{ source: 'eu/es/vc', version: '1.1.0', domains: ['tax'], vouchedBy: ['rrkah-fqaaa-aaaaa-aaaaq-cai'] },
			{ source: 'eu/es/vc/46250-valencia', version: '', domains: ['tax'], vouchedBy: [] },
		]);
	});

	it('shows a layer with a calendar only', () => {
		const withCalendar = { ...codex, layers: ['eu'], chapters: { 'eu/calendar': { ...codex.chapters['eu/es/tax'], source: 'eu' } } };
		assert.deepEqual(layerRows(withCalendar)[0].domains, ['calendar']);
	});
});

describe('compliance', () => {
	it('reads each flag the realm gives', () => {
		assert.deepEqual(complianceOf('compliant'), { state: 'compliant', since: null, stale: [] });
		assert.deepEqual(complianceOf('unknown'), { state: 'unknown', since: null, stale: [] });
		assert.deepEqual(complianceOf({ NonCompliant: { since: 1_800_000_000, stale: ['eu/es'] } }), {
			state: 'non_compliant',
			since: 1_800_000_000,
			stale: ['eu/es'],
		});
	});

	it('reads a flag it does not know as unknown', () => {
		assert.equal(complianceOf({} as never).state, 'unknown');
	});
});

describe('failures', () => {
	it('lists every failing method, the latest first', () => {
		const rows = failureRows({
			'eu/es/tax': { compute_tax_assess: { count: 3, error: 'boom', at: 100 } },
			'eu/es/procedure': { check_proposal_create: { count: 1, error: 'bad', at: 200 }, on_user_join: { count: 2, error: 'worse', at: 100 } },
		});
		assert.deepEqual(
			rows.map((row) => `${row.file} ${row.method}`),
			['eu/es/procedure check_proposal_create', 'eu/es/procedure on_user_join', 'eu/es/tax compute_tax_assess'],
		);
		assert.equal(rows[2].count, 3);
	});

	it('lists none when nothing fails', () => {
		assert.deepEqual(failureRows({}), []);
	});
});

describe('the flattened view', () => {
	const row = (over: Partial<ViewRow>): ViewRow => ({ name: 'ibi_bonus', kind: 'helper', mark: null, layers: [], ...over });

	it('says which layer applies and which it overrides', () => {
		const overridden = row({
			layers: [
				{ source: 'eu/es', legislation: 'TRLRHL Art. 74' },
				{ source: 'eu/es/vc/46250-valencia', legislation: null },
			],
		});
		assert.deepEqual(rowOrigin(overridden), {
			applies: 'eu/es/vc/46250-valencia',
			overrides: ['eu/es'],
			legislation: null,
		});
	});

	it('names every layer of an extension, which all run', () => {
		const extension = row({
			mark: 'extension',
			layers: [
				{ source: 'eu', legislation: 'GDPR' },
				{ source: 'eu/es', legislation: 'LOPDGDD' },
			],
		});
		assert.deepEqual(rowOrigin(extension), { applies: 'eu + eu/es', overrides: [], legislation: 'LOPDGDD' });
	});

	it('writes a setting\'s value as one line', () => {
		assert.equal(valueText(1240000), '1240000');
		assert.equal(valueText(true), 'true');
		assert.equal(valueText('es'), 'es');
		assert.equal(valueText([1, 2]), '[1,2]');
		assert.equal(valueText(null), '—');
	});
});

describe('the check interval', () => {
	it('takes whole hours from 1 to 168', () => {
		assert.equal(parseInterval('24'), 24);
		assert.equal(parseInterval(' 1 '), 1);
		assert.equal(parseInterval('168'), 168);
	});

	it('refuses what the realm would refuse', () => {
		for (const text of ['', '0', '169', '-1', '1.5', '1h', 'abc']) assert.equal(parseInterval(text), null, text);
	});
});

const LOCALES = new URL('../../frontend/i18n/locales/extensions/codex_viewer/', import.meta.url);
const strings = (locale: string): Record<string, string> => JSON.parse(readFileSync(new URL(`${locale}.json`, LOCALES), 'utf8'));
const english = strings('en');
const OTHERS = ['es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia'];

describe('the strings of the page', () => {
	it('say what "Propose install" files, in the language of the filer', () => {
		const t = (key: string, vars?: Record<string, string | number>) => interpolate(english[key] ?? key, vars);
		const filed = installProposal(t, { source: 'eu/es', version: '2.4.0', effective_from: 1_800_000_000 });
		assert.equal(filed.title, 'Install eu/es 2.4.0');
		assert.match(filed.description, /release 2\.4\.0 of eu\/es whole/);
	});

	it('have every key of English, with its placeholders, in every language', () => {
		const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
		for (const locale of OTHERS) {
			const other = strings(locale);
			assert.deepEqual(Object.keys(other).sort(), Object.keys(english).sort(), locale);
			for (const key of Object.keys(english)) {
				assert.deepEqual(placeholders(other[key]), placeholders(english[key]), `${locale} ${key}`);
			}
		}
	});

	it('include every text the components ask for', () => {
		const sources = readdirSync(new URL('.', import.meta.url))
			.filter((file) => file.endsWith('.svelte') && file !== 'CodexViewer.svelte')
			.map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
			.concat(readFileSync(new URL('legislation.ts', import.meta.url), 'utf8'));
		const asked = new Set<string>();
		for (const source of sources) {
			for (const [, key] of source.matchAll(/\bt\('([a-z_]+)'/g)) asked.add(key);
		}
		// Keys built from a state: t(`job_${status}`), t(`step_${step}`), t(`compliance_${state}`), t(`mark_${mark}`).
		for (const status of ['running', 'paused', 'failed', 'done']) asked.add(`job_${status}`);
		for (const step of ['fetch_change_list', 'check_change_list', 'fetch_chapters', 'check_sources', 'build', 'switch', 'wait']) asked.add(`step_${step}`);
		for (const state of ['compliant', 'non_compliant', 'unknown']) asked.add(`compliance_${state}`);
		for (const mark of ['fixed', 'extension', 'overridable']) asked.add(`mark_${mark}`);
		const missing = [...asked].filter((key) => !(key in english));
		assert.deepEqual(missing, []);
		const unused = Object.keys(english).filter((key) => !asked.has(key));
		assert.deepEqual(unused, [], 'a string no component asks for');
	});
});
