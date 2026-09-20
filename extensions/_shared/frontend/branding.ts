/** Same-origin branding files written to the realm frontend asset canister. */
export const CUSTOM_LOGO = '/custom/logo.png';
export const CUSTOM_BACKGROUND = '/custom/background.png';

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
