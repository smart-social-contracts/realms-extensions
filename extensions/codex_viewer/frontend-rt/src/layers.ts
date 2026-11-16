/**
 * The layer stack and the domain tree of the Source tab.
 *
 * A realm's legislation is layers, outermost first, each one adding to or extending the one above it
 * (docs/codices/layered-codex.md §3.3). A layer's id says where it sits: `eu/es` is Spain's layer under the EU's, and
 * its ancestors are `eu` and `eu/es` itself. A chapter id is `<layer>/<domain>`, so `eu/es/tax` is Spain's tax chapter.
 *
 * The tab shows the stack, and under it the chapters of the layer chosen, by domain:
 *
 * - **inherited** (the default): every domain the stack defines down to the layer chosen, each shown by the deepest
 *   chapter that defines it — what governs. A domain that several layers define keeps the others under it, as the
 *   chain the deepest one builds on.
 * - **this layer alone**: only the chapters the chosen layer itself publishes — what this layer contributes.
 *
 * A chapter extends the one above (`class Tax(above("tax"))`), so both are live and which rule wins is settled member
 * by member: the Legislation tab's flattened views answer that. Here the deepest chapter *runs*, and the ones above it
 * are what it *builds on*. Nothing in this file says "overridden".
 *
 * No DOM: `layers.test.ts` runs on node.
 */

import { isLayered, type Chapter, type LayeredCodex } from './legislation.ts';
import { CALENDAR, chapterFile, chapterLanguage, type SourceEntry } from './source.ts';

/** A layer of the stack, outermost first. */
export interface Layer {
	/** The layer's source id, such as `eu/es`. */
	id: string;
	/** Its last segment, what the stack shows: `es`. The outermost layer shows its whole id. */
	name: string;
	/** Whether the realm runs this layer: its chapters are held by the realm and pinned by their checksums. */
	installed: boolean;
	/** The version the realm runs, when it runs one. A realm's own layer has none (`paths.py`). */
	version?: string;
}

/** One chapter of a domain: which layer publishes it, and where its text comes from. */
export interface DomainChapter extends SourceEntry {
	/** The layer that publishes this chapter. */
	layer: string;
	/** The domain it defines, such as `tax`. */
	domain: string;
	/** Held by the realm (pinned by its checksum), or read from the layer's published source. */
	held: 'realm' | 'published';
}

/** A domain of the tree: the chapter that runs, and the ones it builds on, deepest first. */
export interface DomainRow {
	domain: string;
	/** The chapter that governs: the deepest layer's, within the layer chosen. */
	runs: DomainChapter;
	/** What `runs` builds on, from just above it upwards. Empty where only one layer defines the domain. */
	builds_on: DomainChapter[];
}

/** Every ancestor of a layer id, outermost first, the layer itself last: `eu/es/vc` → `eu`, `eu/es`, `eu/es/vc`. */
export function ancestry(layer: string): string[] {
	const parts = String(layer || '')
		.split('/')
		.filter(Boolean);
	return parts.map((_, at) => parts.slice(0, at + 1).join('/'));
}

/** The domain a chapter id defines, under the layer that publishes it: `eu/es/tax` under `eu/es` → `tax`. */
export function domainOf(chapter: string, layer: string): string {
	return chapter.startsWith(`${layer}/`) ? chapter.slice(layer.length + 1) : chapter;
}

/**
 * The stack to show for a codex: the ancestry of its deepest layer, so that a layer the realm does not run is still
 * a place you can look. Each is marked with whether the realm runs it.
 */
export function stackOf(codex: unknown): Layer[] {
	if (!isLayered(codex)) return [];
	const running = (codex as LayeredCodex).layers ?? [];
	const deepest = [...running].sort((a, b) => ancestry(b).length - ancestry(a).length)[0] ?? '';
	const versions = new Map<string, string>();
	for (const entry of Object.values((codex as LayeredCodex).chapters ?? {})) {
		if (entry.version) versions.set(entry.source, entry.version);
	}
	return ancestry(deepest).map((id, at, all) => ({
		id,
		name: at === 0 ? id : id.slice(all[at - 1].length + 1),
		installed: running.includes(id),
		version: versions.get(id) || undefined,
	}));
}

/** The chapters the realm holds, as the tree's entries: pinned by the checksum `codex_status` gives for each. */
export function heldChapters(codex: unknown): DomainChapter[] {
	if (!isLayered(codex)) return [];
	const chapters = (codex as LayeredCodex).chapters ?? {};
	return Object.entries(chapters).map(([id, entry]: [string, Chapter]) => ({
		id,
		name: chapterFile(id),
		kind: 'chapter' as const,
		language: chapterLanguage(id),
		layer: entry.source,
		domain: domainOf(id, entry.source),
		held: 'realm' as const,
		status: (codex as LayeredCodex).status,
		version: entry.version || undefined,
		installed_at: (codex as LayeredCodex).installed_at,
		checksum: entry.sha256,
	}));
}

/**
 * The tree for a layer of the stack.
 *
 * `chapters` is everything known, the realm's and the published ones together. `inherited` keeps the whole stack down
 * to `layer`; without it only `layer`'s own chapters are kept. Domains are ordered by name, and within a domain the
 * deepest layer runs.
 */
export function treeFor(chapters: DomainChapter[], layer: string, inherited: boolean): DomainRow[] {
	const path = ancestry(layer);
	const depth = new Map(path.map((id, at) => [id, at]));
	const kept = chapters.filter((entry) => (inherited ? depth.has(entry.layer) : entry.layer === layer));
	const byDomain = new Map<string, DomainChapter[]>();
	for (const entry of kept) {
		byDomain.set(entry.domain, [...(byDomain.get(entry.domain) ?? []), entry]);
	}
	return [...byDomain.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([domain, entries]) => {
			const deepest = [...entries].sort((x, y) => (depth.get(y.layer) ?? -1) - (depth.get(x.layer) ?? -1));
			return { domain, runs: deepest[0], builds_on: deepest.slice(1) };
		});
}

/** Whether the checkbox can do anything: the outermost layer inherits nothing. */
export function inheritsAnything(layer: string): boolean {
	return ancestry(layer).length > 1;
}

/** What a domain row shows as its own name: a calendar is not legislation of a domain, it is the layer's calendar. */
export function domainLabel(domain: string): string {
	return domain === CALENDAR ? `${CALENDAR} (dates)` : domain;
}
