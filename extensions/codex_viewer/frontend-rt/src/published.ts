/**
 * The published source of a layer the realm does not run.
 *
 * A layer the realm runs is read from the realm: it holds each chapter's text and reports the checksum that pins it.
 * A layer above it may not be installed here at all — Spain runs `eu/es` and not `eu` — and the realm then holds
 * nothing of it. Its text comes from where the layer is published instead.
 *
 * What is fetched is **not what governs this realm**. It is the published text of a layer this realm does not run,
 * and the page says so wherever it shows one. Two things keep it honest:
 *
 *  - a layer's `releases.json` pins every chapter of a release by `sha256`, and each release names the `commit` it was
 *    cut from, so a chapter is fetched at an immutable commit and checked against that digest before it is shown;
 *  - a digest that does not match is an error, never a silent fallback;
 *  - the commit and the domain names a release gives have to be a commit and domain ids, by the realm's own rules
 *    (`is_commit` in `legislation_layout.py`, `domain_id` in `codex.py`), so that "an immutable commit" is true of
 *    what is fetched: a release that fails either is treated as unpublished rather than fetched from.
 *
 * The ref that `releases.json` itself is read from is the one thing not pinned, so it is configuration, not a constant
 * buried here: `ctx.config.codices` overrides `CODICES`. `legislation/` is not on the codices repository's `main`
 * yet — it lives on `feat/layered-codex`, like the verify page — so the default names that branch, and becomes `main`
 * (better, a tag) when the codices release lands there.
 *
 * No DOM beyond `fetch` and `crypto.subtle`: `published.test.ts` runs on node.
 */

/** Where a layer's published source is read from. */
export interface Codices {
	/** The raw file host, no trailing slash. */
	base: string;
	/** `owner/repository`. */
	repo: string;
	/** The ref `releases.json` is read from. Chapters are read at the release's own commit, never at this ref. */
	ref: string;
	/** The directory the layers live under. */
	root: string;
}

/** How long a request for a published file is given before it is abandoned, as `registryFile` bounds its own. */
export const CODICES_TIMEOUT_MS = 10_000;

export const CODICES: Codices = {
	base: 'https://raw.githubusercontent.com',
	repo: 'smart-social-contracts/realms-codices',
	ref: 'feat/layered-codex',
	root: 'legislation',
};

/** One release of a layer, as `releases.json` lists it. */
export interface PublishedRelease {
	version: string;
	published: string;
	effective_from: string;
	commit: string;
	chapters: Record<string, string>;
	calendar?: string;
	notes?: Record<string, string>;
}

const HEX = /^[0-9a-f]{40}$/;
/** A git commit as the realm's `is_commit` defines it: 40 hex digits, so that no name, option or path passes. */
export function isCommit(value: unknown): boolean {
	return typeof value === 'string' && HEX.test(value);
}

const DOMAIN = /^[a-z][a-z0-9_]*$/;
/** A domain id as the realm's `domain_id` defines it: lowercase letters, digits and `_`, starting with a letter. */
export function isDomain(value: unknown): boolean {
	return typeof value === 'string' && DOMAIN.test(value);
}

export function releasesUrl(layer: string, where: Codices = CODICES): string {
	return `${where.base}/${where.repo}/${where.ref}/${where.root}/${layer}/releases.json`;
}

/** A chapter's file at the commit its release was cut from: `tax` → `…/<commit>/legislation/eu/es/tax.py`. */
export function chapterUrl(layer: string, domain: string, commit: string, where: Codices = CODICES): string {
	const file = domain === 'calendar' ? 'calendar.json' : `${domain}.py`;
	return `${where.base}/${where.repo}/${commit}/${where.root}/${layer}/${file}`;
}

/**
 * The release to show of what a layer has published: the one published last. `releases.json` is in publishing order
 * and effective dates are not monotonic, so the last entry is the newest release, never the greatest date.
 */
export function newestRelease(releases: PublishedRelease[]): PublishedRelease | null {
	if (!Array.isArray(releases) || !releases.length) return null;
	const release = releases[releases.length - 1];
	// Everything else rests on the commit being a commit: it is what makes the fetch immutable and the digest worth
	// checking. A release that does not name one publishes nothing readable.
	return release && isCommit(release.commit) ? release : null;
}

/** The chapters of a release, by domain, with the digest that pins each: the calendar is a chapter named `calendar`. */
export function releaseChapters(release: PublishedRelease): Record<string, string> {
	const all = { ...(release.chapters ?? {}), ...(release.calendar ? { calendar: release.calendar } : {}) };
	// A domain name becomes a path segment, so only a real domain id is kept: `../../other/repo/main/x` is not one.
	return Object.fromEntries(Object.entries(all).filter(([domain]) => isDomain(domain)));
}

/** `sha256:<hex>` of some bytes, the way a chapter's digest is written. */
export async function digestBytes(bytes: ArrayBuffer | Uint8Array): Promise<string> {
	const sum = await crypto.subtle.digest('SHA-256', bytes);
	const hex = [...new Uint8Array(sum)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
	return `sha256:${hex}`;
}

/** `sha256:<hex>` of a string's UTF-8 bytes. */
export async function digestOf(text: string): Promise<string> {
	return await digestBytes(new TextEncoder().encode(text));
}

/**
 * A published file's bytes. Bounded: a host that never answers must not leave the page waiting on it, so the request
 * is abandoned after `CODICES_TIMEOUT_MS` the way `registryFile` abandons its own.
 */
async function bytes(url: string): Promise<ArrayBuffer> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), CODICES_TIMEOUT_MS);
	try {
		const reply = await fetch(url, { headers: { accept: 'text/plain' }, signal: controller.signal });
		if (!reply.ok) throw new Error(`${reply.status} for ${url}`);
		return await reply.arrayBuffer();
	} finally {
		clearTimeout(timer);
	}
}

async function body(url: string): Promise<string> {
	return new TextDecoder().decode(await bytes(url));
}

/** What a layer publishes: its newest release and the digest of each of its chapters. */
export async function publishedRelease(layer: string, where: Codices = CODICES): Promise<PublishedRelease | null> {
	return newestRelease(JSON.parse(await body(releasesUrl(layer, where))));
}

/**
 * What was served for a chapter is not the text its release pins. A failure of its own, so that a caller can tell it
 * from a chapter that could not be read at all, which says nothing against the text.
 */
export class DigestMismatch extends Error {
	name = 'DigestMismatch';
}

/**
 * The text of one published chapter, fetched at its release's commit and checked against the digest that release
 * pins it by. A digest that does not match throws `DigestMismatch`: it is the only thing standing in for the realm's
 * own pinning.
 */
export async function publishedChapter(
	layer: string,
	domain: string,
	release: PublishedRelease,
	where: Codices = CODICES,
): Promise<string> {
	const want = releaseChapters(release)[domain];
	if (!want) throw new Error(`${layer} ${release.version} publishes no ${domain}`);
	// The digest is of the file's bytes at the release's commit (`legislation_layout.py`), so the bytes are what is
	// hashed: decoding first drops a byte-order mark and replaces anything invalid, and would hash something else.
	const raw = await bytes(chapterUrl(layer, domain, release.commit, where));
	const got = await digestBytes(raw);
	if (got !== want) throw new DigestMismatch(`${got} is not the published ${want}`);
	return new TextDecoder().decode(raw);
}

/** The configured source, from the host's `ctx.config.codices`, falling back to `CODICES` field by field. */
export function codicesFrom(config: any): Codices {
	const over = (config ?? {}).codices ?? {};
	return {
		base: typeof over.base === 'string' && over.base ? over.base.replace(/\/$/, '') : CODICES.base,
		repo: typeof over.repo === 'string' && over.repo ? over.repo : CODICES.repo,
		ref: typeof over.ref === 'string' && over.ref ? over.ref : CODICES.ref,
		root: typeof over.root === 'string' && over.root ? over.root : CODICES.root,
	};
}
