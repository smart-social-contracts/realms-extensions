/**
 * What the Source tab lists and where each entry's text comes from. Two layouts, because a realm runs one kind of
 * codex or the other (docs/codices/layered-codex.md §9.1):
 *
 * - a **layered** codex is chapter files across layers, held by the realm itself. Each is read with the realm's
 *   `legislation_chapter`, by the checksum `codex_status` gives for it.
 * - a **legacy** codex is one package in the file registry, read over HTTPS as `ext/<package>/<version>/backend/hooks.py`.
 *
 * No DOM: `source.test.ts` runs on node.
 */

import { isLayered, type Chapter, type LayeredCodex } from './legislation.ts';

/** A layer's `calendar.json` is kept as the chapter `<source>/calendar` (core/change_list.py `CALENDAR`). */
export const CALENDAR = 'calendar';

export type SourceKind = 'chapter' | 'package';

/** One entry of the file list, and what it takes to read its text. */
export interface SourceEntry {
	/** Stable key for the list and the `?codex=` link: a chapter id, or a legacy codex's `<package>@<version>`. */
	id: string;
	/** What the list shows: `eu/es/procedure.py`, or the package name. */
	name: string;
	kind: SourceKind;
	/** The editor's syntax: a chapter is Python, a calendar is JSON. */
	language: 'python' | 'json';
	description?: string;
	status?: string;
	version?: string;
	installed_at?: number | null;
	/** `chapter`: the checksum to read with `legislation_chapter`. */
	checksum?: string;
	/** `package`: the file registry's `ext/<package>/<version>/`. */
	package?: string;
}

/** A row of `codex_status`'s install history. */
export interface HistoryRow {
	id?: string;
	version?: string;
	status?: string;
	installed_at?: number | null;
}

/** The file name of a chapter id: `eu/es/procedure` → `eu/es/procedure.py`, a calendar → `eu/es/calendar.json`. */
export function chapterFile(chapter: string): string {
	return chapter.endsWith(`/${CALENDAR}`) ? `${chapter}.json` : `${chapter}.py`;
}

/** A calendar is JSON, every other chapter is Python. */
export function chapterLanguage(chapter: string): 'python' | 'json' {
	return chapter.endsWith(`/${CALENDAR}`) ? 'json' : 'python';
}

/**
 * The chapters of a layered codex, by the order its layers run in (top to bottom, the realm's own last), and by
 * chapter id within a layer. A chapter whose layer is not listed in `layers` goes last, so nothing is ever dropped.
 */
export function chapterEntries(codex: LayeredCodex): SourceEntry[] {
	const order = new Map(codex.layers.map((source, at) => [source, at]));
	const place = (entry: Chapter) => order.get(entry.source) ?? order.size;
	return Object.entries(codex.chapters ?? {})
		.sort(([a, x], [b, y]) => place(x) - place(y) || a.localeCompare(b))
		.map(([chapter, entry]) => ({
			id: chapter,
			name: chapterFile(chapter),
			kind: 'chapter' as const,
			language: chapterLanguage(chapter),
			status: codex.status,
			version: entry.version || undefined,
			installed_at: codex.installed_at,
			checksum: entry.sha256,
		}));
}

/** A legacy codex of the install history: its package and version come from its id, `<package>@<version>`. */
export function packageEntry(row: HistoryRow): SourceEntry | null {
	const id = String(row.id ?? '');
	if (!id) return null;
	const at = id.lastIndexOf('@');
	const name = at > 0 ? id.slice(0, at) : id;
	return {
		id,
		name,
		kind: 'package',
		language: 'python',
		package: name,
		status: row.status,
		version: row.version || (at > 0 ? id.slice(at + 1) : undefined),
		installed_at: row.installed_at ?? null,
	};
}

/** Legacy codices, the active one first, then the most recently installed; each id once. */
export function packageEntries(rows: HistoryRow[]): SourceEntry[] {
	const byId = new Map<string, SourceEntry>();
	for (const row of rows) {
		const entry = packageEntry(row);
		if (entry && !byId.has(entry.id)) byId.set(entry.id, entry);
	}
	return [...byId.values()].sort(
		(a, b) =>
			Number(b.status === 'active') - Number(a.status === 'active') ||
			Number(b.installed_at ?? 0) - Number(a.installed_at ?? 0),
	);
}

/**
 * What the tab lists for a realm whose active codex is `codex` and whose install history is `rows`.
 *
 * Under a layered codex the list is the running legislation's files. The history's earlier codices are left out:
 * `codex_status` gives chapters for the active codex alone (api/codex.py), so there is no file of theirs to read.
 * The Legislation tab is where the history and the revert live.
 */
export function sourceEntries(codex: unknown, rows: HistoryRow[]): SourceEntry[] {
	return isLayered(codex) ? chapterEntries(codex) : packageEntries(rows);
}

/** Why the editor has no text, in the words of the case it is (the file list is not empty, this one entry is). */
export function emptyState(entry: SourceEntry | null, hasRegistry: boolean): string {
	if (!entry) return 'Select a file to read it.';
	if (entry.kind === 'chapter') {
		return `The realm has no text stored for ${entry.name}.`;
	}
	return hasRegistry
		? `No code available for ${entry.name} in the file registry.`
		: 'This realm has no file registry configured, so the source of a codex package cannot be loaded.';
}
