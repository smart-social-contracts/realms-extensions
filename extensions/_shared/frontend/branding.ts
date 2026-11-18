/** Same-origin branding files written to the realm frontend asset canister. */
export const CUSTOM_LOGO = '/custom/logo.png';
export const CUSTOM_BACKGROUND = '/custom/background.png';
/**
 * The covers the shell ships, shown by a realm that has none of its own: the moving picture first, then the still
 * (the only one a shell older than the moving picture has).
 */
export const DEFAULT_BACKGROUNDS = ['/images/background.svg', '/images/background.png'] as const;

/** The first of ``urls`` that loads as an image, or '' when none does. */
export function firstLoadableImage(urls: readonly string[]): Promise<string> {
	return new Promise((resolve) => {
		const tryAt = (i: number) => {
			if (i >= urls.length || typeof Image === 'undefined') return resolve('');
			const probe = new Image();
			probe.onload = () => resolve(urls[i]);
			probe.onerror = () => tryAt(i + 1);
			probe.src = urls[i];
		};
		tryAt(0);
	});
}

export const BRANDING_DATA_URL_MAX_BYTES = 1_572_864;
/** Binary file cap so the data URL stays under the canister bound. */
export const BRANDING_FILE_MAX_BYTES = 1_100_000;

export function resolvePublicAssetUrl(
	saved: string | null | undefined,
	fallback: string,
): string {
	const value = typeof saved === 'string' ? saved.trim() : '';
	return value || fallback;
}

export function isValidHexColor(value: string): boolean {
	return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function snapshotEquals(a: unknown, b: unknown): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}
