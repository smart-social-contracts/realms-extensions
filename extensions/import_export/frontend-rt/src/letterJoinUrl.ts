/** Portal join URL for registration letters. Built in the browser; never invent gos.earth. */

export type LetterJoinLocation = {
	origin: string;
	slug: string | null;
	via: 'portal' | 'fallback';
};

export type LetterJoinWindow = {
	location?: {
		origin?: string;
		href?: string;
		pathname?: string;
		search?: string;
		ancestorOrigins?: ArrayLike<string>;
	};
	document?: { referrer?: string };
};

const CANISTER_HOST = /(\.icp0\.io|\.ic0\.app|\.raw\.icp0\.io)$/i;

export function parseRealmSlugFromPath(pathname: string): string | null {
	const match = String(pathname || '').match(/^\/r\/([^/]+)/);
	if (!match?.[1]) return null;
	try {
		return decodeURIComponent(match[1]);
	} catch {
		return match[1];
	}
}

export function isRawCanisterHost(hostname: string): boolean {
	const host = String(hostname || '').toLowerCase();
	if (CANISTER_HOST.test(host)) return true;
	// dfx local: <canister-id>.localhost
	if (host.endsWith('.localhost') && host !== 'localhost') return true;
	return false;
}

function originOf(raw: string): URL | null {
	const text = String(raw || '').trim();
	if (!text) return null;
	try {
		const url = new URL(text);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		return url;
	} catch {
		return null;
	}
}

function listLike(value: ArrayLike<string> | undefined): string[] {
	if (!value) return [];
	return Array.from(value).map(String).filter(Boolean);
}

export function configuredPortalUrl(
	globalObj: { __CANISTER_IDS?: { portal_url?: string } } = globalThis as {
		__CANISTER_IDS?: { portal_url?: string };
	},
): string {
	return String(globalObj.__CANISTER_IDS?.portal_url || '').trim();
}

export function resolveLetterJoinLocation(
	input: {
		origin?: string;
		href?: string;
		pathname?: string;
		search?: string;
		referrer?: string;
		ancestorOrigins?: string[];
		portalUrl?: string;
	},
): LetterJoinLocation {
	let origin = String(input.origin || '').replace(/\/+$/, '');
	let pathname = String(input.pathname || '');
	let search = String(input.search || '');
	if (input.href) {
		const page = originOf(input.href);
		if (page) {
			origin = origin || page.origin;
			pathname = pathname || page.pathname;
			search = search || page.search;
		}
	}

	const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
	const pathSlug = parseRealmSlugFromPath(pathname);
	const querySlug = (params.get('slug') || '').trim() || null;
	const embedded = params.get('portal') === '1';

	let pageHost = '';
	try {
		pageHost = origin ? new URL(origin).hostname : '';
	} catch {
		pageHost = '';
	}

	if (pathSlug && origin && !isRawCanisterHost(pageHost)) {
		return { origin, slug: pathSlug, via: 'portal' };
	}

	const parentCandidates = [...(input.ancestorOrigins || []), input.referrer || ''];
	for (const raw of parentCandidates) {
		const parent = originOf(raw);
		if (!parent || isRawCanisterHost(parent.hostname)) continue;
		const slug = parseRealmSlugFromPath(parent.pathname) || querySlug || pathSlug;
		if (slug) {
			return { origin: parent.origin, slug, via: 'portal' };
		}
	}

	// iframe embed: we know there is a portal, but cannot read parent.location.
	// Use host-provided portal_url only in that case — never as a CLI fallback.
	if (embedded && querySlug) {
		const configured = originOf(input.portalUrl || '');
		if (configured && !isRawCanisterHost(configured.hostname)) {
			return { origin: configured.origin, slug: querySlug, via: 'portal' };
		}
	}

	return { origin, slug: null, via: 'fallback' };
}

export function resolveLetterJoinLocationFromWindow(
	win: LetterJoinWindow = globalThis as LetterJoinWindow,
	portalUrl = configuredPortalUrl(),
): LetterJoinLocation {
	const loc = win.location || {};
	return resolveLetterJoinLocation({
		origin: loc.origin,
		href: loc.href,
		pathname: loc.pathname,
		search: loc.search,
		referrer: win.document?.referrer,
		ancestorOrigins: listLike(loc.ancestorOrigins),
		portalUrl,
	});
}

export function buildLetterJoinUrl(code: string, loc: LetterJoinLocation): string {
	const origin = String(loc.origin || '').replace(/\/+$/, '');
	const q = `code=${encodeURIComponent(code)}`;
	if (loc.via === 'portal' && loc.slug) {
		return `${origin}/r/${encodeURIComponent(loc.slug)}/join?${q}`;
	}
	return origin ? `${origin}/join?${q}` : `/join?${q}`;
}

export function letterJoinUrlFromWindow(
	code: string,
	win: LetterJoinWindow = globalThis as LetterJoinWindow,
	portalUrl = configuredPortalUrl(),
): string {
	return buildLetterJoinUrl(code, resolveLetterJoinLocationFromWindow(win, portalUrl));
}
