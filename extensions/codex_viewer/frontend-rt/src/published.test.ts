import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	CODICES,
	chapterUrl,
	codicesFrom,
	digestOf,
	newestRelease,
	publishedChapter,
	releaseChapters,
	releasesUrl,
	type PublishedRelease,
} from './published.ts';

const release = (over: Partial<PublishedRelease> = {}): PublishedRelease => ({
	version: '2.6.0',
	published: '2026-11-10',
	effective_from: '2027-01-01',
	commit: 'b47a994d1111111111111111111111111111eeee',
	chapters: { tax: 'sha256:tax', procedure: 'sha256:proc' },
	calendar: 'sha256:cal',
	...over,
});

describe('where published source is read from', () => {
	it("reads a layer's releases at the configured ref", () => {
		assert.equal(
			releasesUrl('eu/es'),
			`${CODICES.base}/${CODICES.repo}/${CODICES.ref}/legislation/eu/es/releases.json`,
		);
	});

	it("reads a chapter at its release's own commit, never at a moving ref", () => {
		const url = chapterUrl('eu/es', 'tax', 'abc123');
		assert.equal(url, `${CODICES.base}/${CODICES.repo}/abc123/legislation/eu/es/tax.py`);
		assert.ok(!url.includes(CODICES.ref));
	});

	it('reads a calendar as the json file it is', () => {
		assert.ok(chapterUrl('eu/es', 'calendar', 'abc123').endsWith('/legislation/eu/es/calendar.json'));
	});

	it('takes the source from the host, field by field, and keeps the rest', () => {
		const where = codicesFrom({ codices: { ref: 'main', base: 'https://mirror.example/' } });
		assert.equal(where.ref, 'main');
		assert.equal(where.base, 'https://mirror.example');
		assert.equal(where.repo, CODICES.repo);
	});

	it('falls back to the built-in source when the host says nothing', () => {
		assert.deepEqual(codicesFrom(undefined), CODICES);
		assert.deepEqual(codicesFrom({ codices: { ref: '' } }), CODICES);
	});
});

describe('which release a layer shows', () => {
	it('takes the one published last, not the greatest effective date', () => {
		const older = release({ version: '2.5.0', effective_from: '2030-01-01' });
		const newer = release({ version: '2.6.0', effective_from: '2027-01-01' });
		assert.equal(newestRelease([older, newer])?.version, '2.6.0');
	});

	it('has no release to show for a layer that has published none', () => {
		assert.equal(newestRelease([]), null);
		assert.equal(newestRelease(undefined as any), null);
	});

	it("counts the calendar among a release's chapters", () => {
		assert.deepEqual(Object.keys(releaseChapters(release())).sort(), ['calendar', 'procedure', 'tax']);
		assert.deepEqual(Object.keys(releaseChapters(release({ calendar: undefined }))).sort(), [
			'procedure',
			'tax',
		]);
	});
});

describe('what is shown is what was published', () => {
	const TEXT = 'TAX = 1\n';

	/** The fetch of one URL, so the digest is the only thing under test. */
	function fetching(body: string, ok = true) {
		return async () => ({ ok, status: ok ? 200 : 404, text: async () => body }) as any;
	}

	it('gives the text when its digest is the one the release pins', async () => {
		const sum = await digestOf(TEXT);
		const original = globalThis.fetch;
		globalThis.fetch = fetching(TEXT);
		try {
			const text = await publishedChapter('eu/es', 'tax', release({ chapters: { tax: sum } }));
			assert.equal(text, TEXT);
		} finally {
			globalThis.fetch = original;
		}
	});

	it('refuses text whose digest is not the one pinned, rather than showing it', async () => {
		const original = globalThis.fetch;
		globalThis.fetch = fetching('TAX = 2\n');
		try {
			const sum = await digestOf(TEXT);
			await assert.rejects(
				() => publishedChapter('eu/es', 'tax', release({ chapters: { tax: sum } })),
				/is not the published/,
			);
		} finally {
			globalThis.fetch = original;
		}
	});

	it('refuses a domain the release does not publish, without fetching anything', async () => {
		const original = globalThis.fetch;
		let asked = false;
		globalThis.fetch = (async () => {
			asked = true;
			return { ok: true, status: 200, text: async () => '' } as any;
		}) as any;
		try {
			await assert.rejects(() => publishedChapter('eu/es', 'nothing', release()), /publishes no nothing/);
			assert.equal(asked, false);
		} finally {
			globalThis.fetch = original;
		}
	});

	it('writes a digest the way a release writes it', async () => {
		// echo -n '' | sha256sum
		assert.equal(
			await digestOf(''),
			'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
		);
	});
});
