import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	CODICES,
	DigestMismatch,
	chapterUrl,
	codicesFrom,
	digestBytes,
	digestOf,
	isCommit,
	isDomain,
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

	it("reads releases from the codices repository's main, not the branch legislation/ was developed on", () => {
		// `feat/layered-codex` was deleted after codices#30 merged it: a default naming it 404s, and every layer the
		// realm does not run shows "source unavailable".
		assert.equal(CODICES.ref, 'main');
		assert.equal(
			releasesUrl('eu'),
			'https://raw.githubusercontent.com/smart-social-contracts/realms-codices/main/legislation/eu/releases.json',
		);
	});

	it('takes the source from the host, field by field, and keeps the rest', () => {
		const where = codicesFrom({ codices: { ref: 'v2.6.0', base: 'https://mirror.example/' } });
		assert.equal(where.ref, 'v2.6.0');
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

	/** The fetch of one URL, serving bytes the way the host does, so the digest is the only thing under test. */
	function fetching(body: string | Uint8Array, ok = true) {
		const raw = typeof body === 'string' ? new TextEncoder().encode(body) : body;
		return async () => ({
			ok,
			status: ok ? 200 : 404,
			arrayBuffer: async () => raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
			text: async () => new TextDecoder().decode(raw),
		}) as any;
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
				(e: unknown) => e instanceof DigestMismatch && /is not the published/.test(e.message),
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
			return { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(0) } as any;
		}) as any;
		try {
			await assert.rejects(() => publishedChapter('eu/es', 'nothing', release()), /publishes no nothing/);
			assert.equal(asked, false);
		} finally {
			globalThis.fetch = original;
		}
	});

	it('hashes the bytes it was served, not what decoding them makes', async () => {
		// A file that opens with a UTF-8 byte-order mark. `reply.text()` drops it, so hashing the decoded string
		// would refuse a file whose bytes are exactly the ones the release pins.
		const raw = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(TEXT)]);
		const sum = await digestBytes(raw);
		assert.notEqual(sum, await digestOf(TEXT));
		const original = globalThis.fetch;
		globalThis.fetch = fetching(raw);
		try {
			// Accepted, where hashing the decoded string would have refused it; the mark itself is not shown,
			// because decoding drops it, which is what the editor wants.
			const text = await publishedChapter('eu/es', 'tax', release({ chapters: { tax: sum } }));
			assert.equal(text, TEXT);
		} finally {
			globalThis.fetch = original;
		}
	});

	it('gives the request a signal, so a host that never answers is abandoned', async () => {
		const original = globalThis.fetch;
		let signal: unknown = null;
		globalThis.fetch = (async (_url: string, init: any) => {
			signal = init?.signal;
			return { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(0) } as any;
		}) as any;
		try {
			await publishedChapter('eu/es', 'tax', release({ chapters: { tax: await digestOf('') } }));
			assert.ok(signal instanceof AbortSignal, 'the fetch is given an AbortSignal');
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

describe('what a release has to say to be read from', () => {
	it('takes a commit to be the 40 hex digits the realm takes, and nothing else', () => {
		assert.equal(isCommit('b47a994d1111111111111111111111111111eeee'), true);
		assert.equal(isCommit('main'), false);
		assert.equal(isCommit('../../evil-owner/evil-repo/main'), false);
		assert.equal(isCommit('B47A994D1111111111111111111111111111EEEE'), false);
		assert.equal(isCommit('b47a994d'), false);
		assert.equal(isCommit(undefined), false);
	});

	it('publishes nothing from a release whose commit is not a commit', () => {
		// The commit is what makes the fetch immutable. Without one there is nothing worth checking a digest against.
		assert.equal(newestRelease([release({ commit: 'main' })]), null);
		assert.equal(newestRelease([release({ commit: '../../evil-owner/evil-repo/main' })]), null);
		assert.equal(newestRelease([release()])?.version, '2.6.0');
	});

	it('takes a domain to be the domain id the realm takes, and keeps only those', () => {
		assert.equal(isDomain('data_protection'), true);
		assert.equal(isDomain('tax'), true);
		assert.equal(isDomain('../../../../../other/repo/main/x'), false);
		assert.equal(isDomain('Tax'), false);
		assert.equal(isDomain('2tax'), false);
		assert.deepEqual(
			Object.keys(
				releaseChapters(
					release({ chapters: { tax: 'sha256:a', '../../../other/repo/main/x': 'sha256:b' } }),
				),
			),
			['tax', 'calendar'],
		);
	});
});
