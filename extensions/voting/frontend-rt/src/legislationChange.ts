/**
 * An install proposal's change list (docs/codices/layered-codex.md §7) as the voting page shows it: read from the
 * address the proposal pins, checked against its checksum, and compared with the codex the realm runs. No DOM: the
 * tests run on node.
 */

export interface ChapterEntry {
	/** `<source id>/<domain>`, or `<source id>/calendar`. */
	chapter: string;
	urls: string[];
	/** `sha256:<64 hex digits>`, the form the realm stores a chapter under. */
	sha256: string;
	size: number | null;
}

export interface ReportRef {
	url: string;
	/** 64 hex digits. */
	sha256: string;
}

export interface ChangeList {
	realm: string;
	replaces: string | null;
	set: ChapterEntry[];
	remove: string[];
	release: { source: string; version: string } | null;
	summary: Record<string, string>;
	report: ReportRef | null;
}

export const MAX_CHANGE_LIST = 64 * 1024;
export const MAX_CHAPTER = 256 * 1024;
export const MAX_REPORT = 1024 * 1024;

const HEX_64 = /^[0-9a-f]{64}$/;

const isText = (value: unknown): value is string => typeof value === 'string';
const isHttps = (value: unknown): value is string => isText(value) && value.startsWith('https://');

/**
 * The change list in `text`. It shows what the realm will read, so it asks no more than the realm does of what it
 * shows, and the `report`, which the realm never reads, is kept only when it is well formed.
 */
export function readChangeList(text: string): ChangeList {
	const data = JSON.parse(text);
	if (!data || typeof data !== 'object' || data.kind !== 'realms-gos/legislation-change' || data.format !== 1) {
		throw new Error('not a change list');
	}
	const entries: any[] = Array.isArray(data.set) ? data.set : [];
	const report = data.report;
	return {
		realm: isText(data.realm) ? data.realm : '',
		replaces: isText(data.replaces) ? data.replaces : null,
		set: entries.map((entry) => ({
			chapter: String(entry.chapter),
			urls: [entry.url, ...(Array.isArray(entry.mirrors) ? entry.mirrors : [])].filter(isText),
			sha256: `sha256:${entry.sha256}`,
			size: typeof entry.size === 'number' ? entry.size : null,
		})),
		remove: Array.isArray(data.remove) ? data.remove.filter(isText) : [],
		release: data.release && isText(data.release.source) && isText(data.release.version) ? data.release : null,
		summary: data.summary && typeof data.summary === 'object' ? data.summary : {},
		report: report && isHttps(report.url) && isText(report.sha256) && HEX_64.test(report.sha256) ? report : null,
	};
}

/** The summary in the viewer's language (`es-ES` reads `es`), else English, else the first one given. */
export function summaryFor(summary: Record<string, string>, locale: string): { language: string; text: string } | null {
	const languages = Object.keys(summary);
	const wanted = [locale, locale.split('-')[0], 'en'];
	const language = wanted.find((tag) => tag in summary) ?? languages[0];
	return language ? { language, text: summary[language] } : null;
}

/** How a chapter of the change list compares with the one the running codex has under the same id. */
export type Difference = 'new' | 'changed' | 'same';

export function differenceOf(entry: ChapterEntry, running: Record<string, { sha256: string }>): Difference {
	const current = running[entry.chapter];
	if (!current) return 'new';
	return current.sha256 === entry.sha256 ? 'same' : 'changed';
}

export type Fetched =
	| { ok: true; text: string }
	| { ok: false; reason: 'not_https' | 'unreachable' | 'too_large' | 'wrong_bytes' | 'not_text' };

/** The bytes of `response`, or null once they pass `limit`: nothing the proposer points at is read without a bound. */
async function readCapped(response: Response, limit: number): Promise<Uint8Array | null> {
	const reader = response.body?.getReader();
	if (!reader) {
		const all = new Uint8Array(await response.arrayBuffer());
		return all.length <= limit ? all : null;
	}
	const parts: Uint8Array[] = [];
	let length = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		length += value.length;
		if (length > limit) {
			await reader.cancel();
			return null;
		}
		parts.push(value);
	}
	const bytes = new Uint8Array(length);
	let at = 0;
	for (const part of parts) {
		bytes.set(part, at);
		at += part.length;
	}
	return bytes;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
	const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
	return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * The text at `url` if it is at most `limit` bytes of UTF-8 whose SHA-256 is `sha256` (64 hex digits): a copy of what
 * the proposal pins, whoever serves it.
 */
export async function fetchPinned(url: string, sha256: string, limit: number, fetcher: typeof fetch = fetch): Promise<Fetched> {
	if (!isHttps(url)) return { ok: false, reason: 'not_https' };
	let bytes: Uint8Array | null;
	try {
		const response = await fetcher(url);
		if (!response.ok) return { ok: false, reason: 'unreachable' };
		bytes = await readCapped(response, limit);
	} catch {
		return { ok: false, reason: 'unreachable' };
	}
	if (!bytes) return { ok: false, reason: 'too_large' };
	if ((await sha256Hex(bytes)) !== sha256) return { ok: false, reason: 'wrong_bytes' };
	try {
		return { ok: true, text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
	} catch {
		return { ok: false, reason: 'not_text' };
	}
}

/** The first address (the URL, then its mirrors) that serves the pinned bytes, as the realm tries them. */
export async function fetchFirstPinned(urls: string[], sha256: string, limit: number, fetcher: typeof fetch = fetch): Promise<Fetched> {
	let last: Fetched = { ok: false, reason: 'unreachable' };
	for (const url of urls) {
		last = await fetchPinned(url, sha256, limit, fetcher);
		if (last.ok) return last;
	}
	return last;
}
