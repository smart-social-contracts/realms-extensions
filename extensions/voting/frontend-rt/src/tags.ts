/**
 * The tags a proposal carries: the realm's own words for grouping proposals (ggg I-GOV-15, ggg.did:336).
 *
 * The limits mirror what the realm enforces, realms-gos `src/realm_backend/api/proposals.py` at feat/layered-codex
 * 249dc1d4: `MAX_TAGS` and `MAX_TAG` (line 23), `checked_tags` (lines 89-102: each tag 1 to 64 code points, named once,
 * no control character and no whitespace at either end) and `proposal_list` (lines 820-831: at most 16 tags to filter
 * by; it reads a page of rows first and filters that page, so a filtered page can be short or empty).
 * The realm exposes no read of these limits: when it changes them, change them here.
 */

export const MAX_TAGS = 16;
export const MAX_TAG_LENGTH = 64;

/** The most rows `proposal_list` reads in one call (`PAGE_MAX` of the realm's core/db.py). */
export const SCAN_ROWS = 500;
/** The calls one search makes for a screenful of tagged proposals, before it stops and says how far it got. */
export const MAX_SCANS = 10;

export type TagProblem = 'empty' | 'too_long' | 'control' | 'duplicate' | 'full';
export type Added = { ok: true; tags: string[] } | { ok: false; reason: TagProblem };

/** A tag as the realm compares it, which is exactly: the realm never normalises, so a client sends NFC (I-GOV-15). */
export function normalizeTag(text: string): string {
	return text.trim().normalize('NFC');
}

/** The refusal the realm would give ``tag`` (already normalised), or null; its length counts code points, as the realm's does. */
export function tagProblem(tag: string): Exclude<TagProblem, 'duplicate' | 'full'> | null {
	if (!tag) return 'empty';
	if ([...tag].length > MAX_TAG_LENGTH) return 'too_long';
	if (/[\u0000-\u001f\u007f-\u009f]/.test(tag)) return 'control';
	return null;
}

/** ``tags`` with what was typed added, unless it is not a tag, is one already, or the proposal has 16. */
export function addTag(tags: string[], typed: string, max = MAX_TAGS): Added {
	const tag = normalizeTag(typed);
	const problem = tagProblem(tag);
	if (problem) return { ok: false, reason: problem };
	if (tags.includes(tag)) return { ok: false, reason: 'duplicate' };
	if (tags.length >= max) return { ok: false, reason: 'full' };
	return { ok: true, tags: [...tags, tag] };
}

export function removeTag(tags: string[], tag: string): string[] {
	return tags.filter((existing) => existing !== tag);
}

/** The tags of a row the realm sent (a proposal, slim or in full); none for a row that has no list of text. */
export function tagsOf(row: unknown): string[] {
	const tags = (row as { tags?: unknown } | null)?.tags;
	return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === 'string') : [];
}

/** The tags the loaded proposals carry, once each: what the filter can offer, as the realm lists none. */
export function knownTags(rows: unknown[]): string[] {
	return [...new Set(rows.flatMap(tagsOf))].sort((a, b) => a.localeCompare(b));
}

export type Read = (name: string, args: Record<string, unknown>) => Promise<any>;

export type TagSearch = {
	/** The proposal rows that carry one of the tags, in the shape of `proposal_list`'s reply. */
	proposals: any[];
	/** Where the next search starts, or null when the realm has no more rows. */
	next: number | null;
	/** The rows the realm read through for these (an exact count only when ``next`` is not null). */
	searched: number;
	/** True when the search stopped at its limit of calls with less than a screenful found, and more rows remain. */
	capped: boolean;
};

/** The number in a proposal id (``P-7``), which is also where the realm continues from: its row id. */
function rowNumber(row: any): number | null {
	const match = /^P-(\d+)$/i.exec(String(row?.id ?? ''));
	return match ? parseInt(match[1], 10) : null;
}

/**
 * Up to ``want`` proposals that carry at least one of ``tags``, read from row ``from`` on. The realm filters a page
 * of ``SCAN_ROWS`` rows at a time and sends back only the matches, so a rare tag takes several calls: this makes at
 * most ``MAX_SCANS`` of them for one screenful, then stops and says how far it got, rather than reading a year of
 * proposals behind a spinner. Null when the realm refuses the first call, or when ``stale`` says the search is not wanted any
 * more (the filter changed): it is asked before each call and after each reply, so an old search stops making calls.
 */
export async function searchTagged(
	read: Read,
	opts: { tags: string[]; status?: string; from: number; want: number; scan?: number; maxScans?: number; stale?: () => boolean },
): Promise<TagSearch | null> {
	const scan = opts.scan ?? SCAN_ROWS;
	const maxScans = opts.maxScans ?? MAX_SCANS;
	const found: any[] = [];
	let from: number | null = opts.from;
	let searched = 0;
	for (let calls = 0; from != null && calls < maxScans && found.length < opts.want; calls++) {
		const args: Record<string, unknown> = { from, count: scan, tags: opts.tags };
		if (opts.status) args.status = opts.status;
		if (opts.stale?.()) return null;
		const reply = await read('proposal_list', args);
		if (opts.stale?.()) return null;
		if (!reply) {
			// A refusal after the first call keeps what was found, and the next search starts here again.
			if (calls === 0) return null;
			break;
		}
		found.push(...(Array.isArray(reply.proposals) ? reply.proposals : []));
		const next = Number(reply.next);
		from = reply.next != null && Number.isFinite(next) ? next : null;
		if (from != null) searched += scan;
	}
	// A page of 500 rows can hold more matches than a screenful: show a screenful and continue right after the last
	// one shown, so the ones cut off come next. The realm's ids are `P-<n>`; for one that is not, there is no row to
	// continue from, and the rest of the page is left out rather than read in full (500 `proposal_get` for one screen).
	if (found.length > opts.want) {
		const last = rowNumber(found[opts.want - 1]);
		found.length = opts.want;
		if (last != null) from = last + 1;
	}
	return { proposals: found, next: from, searched, capped: from != null && found.length < opts.want };
}
