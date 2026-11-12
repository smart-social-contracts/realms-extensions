import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	MAX_SCANS,
	MAX_TAGS,
	MAX_TAG_LENGTH,
	SCAN_ROWS,
	addTag,
	knownTags,
	normalizeTag,
	removeTag,
	searchTagged,
	tagProblem,
	tagsOf,
	type Read,
} from './tags.ts';

describe('normalizeTag', () => {
	it('trims what the realm refuses at either end, and sends NFC', () => {
		assert.equal(normalizeTag('  parks \t'), 'parks');
		// "é" typed as e + a combining accent is one code point in NFC; the realm compares exactly.
		assert.equal(normalizeTag('café'), 'café');
	});

	it('keeps the case: "Parks" and "parks" are two tags', () => {
		assert.equal(normalizeTag('Parks'), 'Parks');
	});
});

describe('tagProblem', () => {
	it('accepts 1 to 64 code points, not UTF-16 units', () => {
		assert.equal(tagProblem('a'), null);
		assert.equal(tagProblem('a'.repeat(MAX_TAG_LENGTH)), null);
		assert.equal(tagProblem('a'.repeat(MAX_TAG_LENGTH + 1)), 'too_long');
		// 64 emoji are 128 UTF-16 units and 64 code points: the realm counts code points.
		assert.equal(tagProblem('🌳'.repeat(MAX_TAG_LENGTH)), null);
		assert.equal(tagProblem('🌳'.repeat(MAX_TAG_LENGTH + 1)), 'too_long');
	});

	it('refuses nothing and control characters, as the realm does', () => {
		assert.equal(tagProblem(''), 'empty');
		assert.equal(tagProblem('a\u0000b'), 'control');
		assert.equal(tagProblem('a\nb'), 'control');
		assert.equal(tagProblem('a\u007fb'), 'control');
		assert.equal(tagProblem('a\u0085b'), 'control');
		assert.equal(tagProblem('a\u009fb'), 'control');
		assert.equal(tagProblem('a b'), null);
	});

	it('allows any other character: spaces inside, punctuation, other scripts', () => {
		for (const tag of ['district 3', 'a,b', '#parks', 'València', '公园', 'Straße']) assert.equal(tagProblem(tag), null, tag);
	});
});

describe('addTag', () => {
	it('adds the normalised tag at the end', () => {
		assert.deepEqual(addTag(['parks'], '  district-3 '), { ok: true, tags: ['parks', 'district-3'] });
	});

	it('refuses a tag it has already, exactly: another case is another tag', () => {
		assert.deepEqual(addTag(['parks'], 'parks'), { ok: false, reason: 'duplicate' });
		assert.deepEqual(addTag(['parks'], 'Parks'), { ok: true, tags: ['parks', 'Parks'] });
	});

	it('refuses the 17th tag, and says what is wrong with a tag before it says the list is full', () => {
		const full = Array.from({ length: MAX_TAGS }, (_, i) => `t${i}`);
		assert.deepEqual(addTag(full, 'one more'), { ok: false, reason: 'full' });
		assert.deepEqual(addTag(full, ''), { ok: false, reason: 'empty' });
		assert.deepEqual(addTag(full, 't0'), { ok: false, reason: 'duplicate' });
	});

	it('takes a smaller limit, for the filter', () => {
		assert.deepEqual(addTag(['a', 'b'], 'c', 2), { ok: false, reason: 'full' });
	});
});

describe('removeTag', () => {
	it('removes the tag named, exactly', () => {
		assert.deepEqual(removeTag(['a', 'A', 'b'], 'a'), ['A', 'b']);
	});
});

describe('tagsOf and knownTags', () => {
	it('read the tags of a row, none for a row without a list of text', () => {
		assert.deepEqual(tagsOf({ tags: ['a', 'b'] }), ['a', 'b']);
		assert.deepEqual(tagsOf({ tags: ['a', 3, null] }), ['a']);
		assert.deepEqual(tagsOf({ tags: 'a' }), []);
		assert.deepEqual(tagsOf({}), []);
		assert.deepEqual(tagsOf(null), []);
	});

	it('list the tags of the loaded proposals once each, sorted', () => {
		assert.deepEqual(knownTags([{ tags: ['parks', 'district-3'] }, { tags: ['parks'] }, {}, { tags: ['bikes'] }]), [
			'bikes',
			'district-3',
			'parks',
		]);
	});
});

/**
 * A realm that holds proposals P-1 to P-``total`` and answers `proposal_list` as realms-gos does
 * (api/proposals.py:820-831): it reads ``count`` rows from ``from``, sends back those among them that carry a tag
 * asked for, and `next` is the row after the page (null at the end).
 */
function realm(total: number, tagged: (n: number) => string[], seen: Record<string, any>[] = []): Read {
	return async (name, args) => {
		assert.equal(name, 'proposal_list');
		seen.push(args);
		const from = args.from as number;
		const count = args.count as number;
		const wanted = args.tags as string[];
		const proposals = [];
		for (let n = from; n < from + count && n <= total; n++) {
			if (tagged(n).some((tag) => wanted.includes(tag))) proposals.push({ id: `P-${n}`, tags: tagged(n) });
		}
		return { ok: true, proposals, next: from + count <= total ? from + count : null };
	};
}

describe('searchTagged', () => {
	it('asks the realm for the tags, a page of rows at a time, and stops at a screenful', async () => {
		const seen: Record<string, any>[] = [];
		const read = realm(100, (n) => (n % 2 ? ['odd'] : []), seen);
		const found = await searchTagged(read, { tags: ['odd'], from: 1, want: 10 });
		assert.equal(seen.length, 1);
		assert.deepEqual(seen[0], { from: 1, count: SCAN_ROWS, tags: ['odd'] });
		assert.equal(found?.proposals.length, 10);
		assert.deepEqual(found?.proposals.map((p) => p.id).slice(0, 3), ['P-1', 'P-3', 'P-5']);
	});

	it('continues right after the last proposal it shows, so none of the ones cut off is skipped', async () => {
		const read = realm(100, () => ['all']);
		const first = await searchTagged(read, { tags: ['all'], from: 1, want: 10 });
		assert.equal(first?.next, 11);
		const second = await searchTagged(read, { tags: ['all'], from: first!.next!, want: 10 });
		assert.deepEqual(second?.proposals.map((p) => p.id), Array.from({ length: 10 }, (_, i) => `P-${11 + i}`));
	});

	it('names the status when one is chosen', async () => {
		const seen: Record<string, any>[] = [];
		await searchTagged(realm(10, () => ['a'], seen), { tags: ['a'], status: 'voting', from: 1, want: 5 });
		assert.equal(seen[0].status, 'voting');
	});

	it('follows the realm to the end when the tag is rare, and says nothing is left', async () => {
		const read = realm(3_600, (n) => (n === 3_000 ? ['rare'] : []));
		const found = await searchTagged(read, { tags: ['rare'], from: 1, want: 30 });
		assert.deepEqual(found?.proposals.map((p) => p.id), ['P-3000']);
		assert.equal(found?.next, null);
		assert.equal(found?.capped, false);
	});

	it('finds nothing for a tag no proposal carries, and says nothing is left', async () => {
		const found = await searchTagged(realm(3_600, () => []), { tags: ['none'], from: 1, want: 30 });
		assert.deepEqual(found, { proposals: [], next: null, searched: 3_500, capped: false });
	});

	it('stops at its limit of calls and says how many rows it read, so the page can offer to go on', async () => {
		const seen: Record<string, any>[] = [];
		const read = realm(100_000, () => [], seen);
		const found = await searchTagged(read, { tags: ['none'], from: 1, want: 30 });
		assert.equal(seen.length, MAX_SCANS);
		assert.equal(found?.searched, MAX_SCANS * SCAN_ROWS);
		assert.equal(found?.next, MAX_SCANS * SCAN_ROWS + 1);
		assert.equal(found?.capped, true);
		const more = await searchTagged(read, { tags: ['none'], from: found!.next!, want: 30 });
		assert.equal(more?.next, 2 * MAX_SCANS * SCAN_ROWS + 1);
	});

	it('reads a year of the JGL\'s ~3,600 proposals in 8 calls at worst, within one screenful\'s limit', async () => {
		const seen: Record<string, any>[] = [];
		const found = await searchTagged(realm(3_600, () => [], seen), { tags: ['none'], from: 1, want: 30 });
		assert.equal(seen.length, Math.ceil(3_600 / SCAN_ROWS));
		assert.equal(found?.capped, false);
		assert.ok(seen.length < MAX_SCANS);
	});

	it('stops making calls, and answers none, once it is stale', async () => {
		const seen: Record<string, any>[] = [];
		let stale = false;
		const read = realm(100_000, () => [], seen);
		const watching: Read = async (name, args) => {
			const reply = await read(name, args);
			if (seen.length === 3) stale = true; // the filter changes while the third call is out
			return reply;
		};
		assert.equal(await searchTagged(watching, { tags: ['none'], from: 1, want: 30, stale: () => stale }), null);
		assert.equal(seen.length, 3);
		assert.equal(await searchTagged(read, { tags: ['none'], from: 1, want: 30, stale: () => true }), null);
		assert.equal(seen.length, 3, 'a search already stale makes no call');
	});

	it('shows a screenful and no more of a page whose ids are not P-<n>, and leaves the rest of it out', async () => {
		const odd: Read = async () => ({ ok: true, proposals: Array.from({ length: 500 }, (_, i) => ({ id: `x${i}`, tags: ['a'] })), next: 501 });
		const found = await searchTagged(odd, { tags: ['a'], from: 1, want: 30 });
		assert.equal(found?.proposals.length, 30);
		assert.equal(found?.next, 501);
	});

	it('is null when the realm refuses the first call, and keeps what it found when a later one is refused', async () => {
		assert.equal(await searchTagged(async () => null, { tags: ['a'], from: 1, want: 5 }), null);
		let calls = 0;
		const flaky: Read = async (name, args) => {
			calls++;
			return calls === 1 ? { ok: true, proposals: [{ id: 'P-2', tags: ['a'] }], next: 501 } : null;
		};
		const found = await searchTagged(flaky, { tags: ['a'], from: 1, want: 5 });
		assert.deepEqual(found?.proposals, [{ id: 'P-2', tags: ['a'] }]);
		assert.equal(found?.next, 501);
		assert.equal(found?.capped, true);
	});
});
