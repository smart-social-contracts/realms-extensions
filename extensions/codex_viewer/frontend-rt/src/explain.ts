/**
 * What the Explain button asks the assistant.
 *
 * The chapter on screen is legislation, so the question says where it stands in the stack: a chapter the realm runs
 * *runs here*, and a chapter from a layer above is what the running one *builds on*. Never "overridden" — which rule
 * wins is settled member by member, and the Legislation tab answers that, not this question (see layers.ts).
 *
 * English, like the tree's own marks ("runs here", "builds on"), which this wording follows.
 *
 * No DOM: `explain.test.ts` runs on node.
 */

/** Where a chapter stands for the realm reading it. */
export type Standing =
	/** The realm runs it: the deepest chapter of its domain. */
	| 'runs'
	/** The realm runs a deeper chapter that builds on this one. */
	| 'builds_on'
	/** It belongs to a layer this realm does not run; it is read where that layer publishes it. */
	| 'not_run'
	/** A codex of the earlier kind that the realm installed once and does not run now. */
	| 'earlier';

/** How many citations the question names before it stops: a question, not a bibliography. */
export const MOST_CITATIONS = 3;

/**
 * How much of one citation the question carries. A citation is written in the chapter
 * (`legislation="Ley 58/2003 Art. 8"`), so its length is the chapter author's to choose; the question is the
 * user's own voice in the assistant's input, and the portal cuts the whole message at 2,000 characters. Without
 * a cap here one long citation would push the question's own ending out.
 */
export const MOST_CITATION_CHARS = 80;

/**
 * The legislation a chapter cites, from the `legislation="…"` arguments of its rules, in the order they appear and
 * without repeats. A chapter that cites nothing gives an empty list.
 */
export function citedLegislation(code: string, most: number = MOST_CITATIONS): string[] {
	const cited: string[] = [];
	for (const match of String(code || '').matchAll(/legislation\s*=\s*(['"])(.*?)\1/g)) {
		const text = shorten(match[2].trim());
		if (text && !cited.includes(text)) cited.push(text);
		if (cited.length >= most) break;
	}
	return cited;
}

/** One citation, as the question carries it: one line, and no longer than `MOST_CITATION_CHARS`. */
function shorten(citation: string): string {
	const line = citation.replace(/\s+/g, ' ').trim();
	return line.length > MOST_CITATION_CHARS ? `${line.slice(0, MOST_CITATION_CHARS - 1)}…` : line;
}

/** What the question says about where the chapter stands. `runsFile` is the chapter that builds on this one. */
function standingText(standing: Standing, runsFile?: string): string {
	if (standing === 'builds_on') {
		return runsFile ? `what ${runsFile} builds on` : 'what a deeper chapter builds on';
	}
	if (standing === 'not_run') return 'a layer this realm does not run';
	if (standing === 'earlier') return 'an earlier codex this realm no longer runs';
	return 'runs here';
}

export interface ExplainQuestion {
	/** The chapter's file name, such as `eu/data_protection.py`. */
	file: string;
	/** The layer that publishes it, such as `eu`. */
	layer: string;
	standing: Standing;
	/** The chapter that builds on this one, when `standing` is `builds_on`. */
	runsFile?: string;
	/** The legislation the chapter cites, as `citedLegislation` found it. */
	legislation?: string[];
	/** The lines selected, when a passage is selected rather than the whole chapter. */
	range?: { startLine: number; endLine: number } | null;
	/** A calendar is dates, not rules, so it is not asked what it allows. */
	language?: 'python' | 'json';
}

/**
 * The question itself, e.g.
 * "Explain eu/data_protection.py (layer eu, runs here; cites GDPR Art. 5-6): what it allows, what it forbids, and why."
 */
export function explainQuestion(q: ExplainQuestion): string {
	const lines = q.range
		? q.range.startLine === q.range.endLine
			? `line ${q.range.startLine} of ${q.file}`
			: `lines ${q.range.startLine}-${q.range.endLine} of ${q.file}`
		: q.file;
	const standing = standingText(q.standing, q.runsFile);
	// A codex of the earlier kind has no layers, so it has nothing to say about one.
	const about: string[] = [q.layer ? `layer ${q.layer}, ${standing}` : standing];
	const cited = (q.legislation ?? []).filter(Boolean);
	if (cited.length) about.push(`cites ${cited.join(', ')}`);

	const subject = q.range ? (q.range.startLine === q.range.endLine ? 'it' : 'they') : 'it';
	const asked =
		q.language === 'json'
			? `what dates ${subject} set${subject === 'it' ? 's' : ''} and what they are for`
			: subject === 'they'
				? 'what they allow, what they forbid, and why'
				: 'what it allows, what it forbids, and why';

	return `Explain ${lines} (${about.join('; ')}): ${asked}.`;
}
