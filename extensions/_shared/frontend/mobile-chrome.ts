/**
 * Shared small-screen chrome helpers for system extensions.
 *
 * Contract (realms-extensions#20): on a narrow viewport, content wins the
 * width; view prefs are persisted toggles; actions are icon-only.
 *
 * Codex Viewer 1.0.8 is the reference and keeps its own copy of these
 * helpers so that release is not rewritten.
 */

export const NARROW_VIEWPORT = '(max-width: 720px)';

export function isNarrowViewport(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia(NARROW_VIEWPORT).matches;
}

export function subscribeNarrowViewport(onChange: (narrow: boolean) => void): () => void {
	if (typeof window === 'undefined') return () => {};
	const mq = window.matchMedia(NARROW_VIEWPORT);
	const handler = () => onChange(mq.matches);
	handler();
	mq.addEventListener('change', handler);
	return () => mq.removeEventListener('change', handler);
}

export function readSessionFlag(key: string): boolean | null {
	try {
		const value = sessionStorage.getItem(key);
		if (value === '1') return true;
		if (value === '0') return false;
		return null;
	} catch {
		return null;
	}
}

export function persistSessionFlag(key: string, value: boolean): void {
	try {
		sessionStorage.setItem(key, value ? '1' : '0');
	} catch {
		/* sessionStorage unavailable */
	}
}
