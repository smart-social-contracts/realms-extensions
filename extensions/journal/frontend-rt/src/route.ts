/** Where the journal page is, from the path after /extensions/journal: nothing (today), a day, or a day's print route. */

export interface Route {
	/** `YYYY-MM-DD`, or null for today's issue. */
	day: string | null;
	/** The print route shows the issue as paper, with the button that prints it. */
	print: boolean;
}

const BASE = /^(.*\/extensions\/journal)(?:\/|$)/;
const REST = /^(\d{4}-\d{2}-\d{2})(\/print)?\/?$/;

/** The path the journal is mounted at, `/extensions/journal` or the same under a prefix (a realm served under a slug). */
export function basePath(pathname: string): string {
	return BASE.exec(pathname)?.[1] ?? '/extensions/journal';
}

/** Where the realm is served from: nothing, or the prefix before `/extensions/journal` (`/r/<slug>`). */
export function realmPrefix(pathname: string): string {
	return basePath(pathname).slice(0, -'/extensions/journal'.length);
}

export function parseRoute(pathname: string): Route {
	const rest = pathname.slice(basePath(pathname).length).replace(/^\//, '');
	const match = REST.exec(rest);
	return match ? { day: match[1], print: Boolean(match[2]) } : { day: null, print: false };
}

export function pathFor(base: string, route: Route): string {
	if (!route.day) return base;
	return route.print ? `${base}/${route.day}/print` : `${base}/${route.day}`;
}

/** The day `delta` days from `day` (both `YYYY-MM-DD`); days are counted on the calendar, so no clock change matters. */
export function shiftDay(day: string, delta: number): string {
	const moved = new Date(Date.parse(`${day}T00:00:00Z`) + delta * 86_400_000);
	return moved.toISOString().slice(0, 10);
}
