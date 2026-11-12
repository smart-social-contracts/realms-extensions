/**
 * The signature of an issue as the sheet shows it: what the canister signed, whether it is this sheet's issue, and the
 * address and QR code that check it. The sheet only shows the signature; it does not check it, and the realm's page is no
 * place to: the page that verifies is served from somewhere else (`VERIFY_URL`).
 */

import qrcode from 'qrcode-generator';
import type { Entry, Issue } from './issue.ts';

/**
 * Where the page that verifies a signed document is published (realms-gos, docs/verify/index.html). A placeholder until
 * the organization publishes it: the address and the QR code on the sheet are built on it.
 */
export const VERIFY_URL = 'https://smart-social-contracts.github.io/realms-gos/verify/';

/** The address that checks the document with the verification `code` of the realm `canisterId` on the verify page. */
export function verificationUrl(canisterId: string, code: string): string {
	return `${VERIFY_URL}?canister=${encodeURIComponent(canisterId)}&code=${encodeURIComponent(code)}`;
}

/** What a signed issue says in its text. */
export interface Signed {
	realm: string;
	kind: string;
	subject: string;
	body: { entries: Entry[] };
	key: { algorithm: string; name: string; path: string; public_key: string };
}

/** The signed text of an issue, or null when it is not the text of a signed issue. */
export function signedText(canonical: string): Signed | null {
	try {
		const signed = JSON.parse(canonical);
		return signed?.kind === 'journal' && Array.isArray(signed.body?.entries) && signed.key ? signed : null;
	} catch {
		return null;
	}
}

function sameJson(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	const keys = Object.keys(a);
	return keys.length === Object.keys(b).length && keys.every((key) => sameJson((a as any)[key], (b as any)[key]));
}

/**
 * The signed text of the issue's proof when it is this issue's: signed by the canister that issues the journal, for this
 * day, over the entries this sheet shows. Anything else (a proof of another day, of another canister, or over entries the
 * realm no longer serves as they were) is null, and the sheet says so instead of showing a signature that is not
 * this issue's. `canisterId` is empty when the sheet does not know the issuer.
 */
export function signedOf(issue: Issue, canisterId: string): Signed | null {
	const signed = issue.proof ? signedText(issue.proof.canonical) : null;
	const ours =
		signed &&
		(!canisterId || signed.realm === canisterId) &&
		signed.subject === issue.day &&
		sameJson(signed.body.entries, issue.entries);
	return ours ? signed : null;
}

/** The QR code of `text` as an SVG with its quiet zone, in dark modules on white. */
export function qrSvg(text: string): string {
	const qr = qrcode(0, 'M');
	qr.addData(text);
	qr.make();
	const size = qr.getModuleCount();
	const quiet = 4;
	let path = '';
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			if (!qr.isDark(row, col)) continue;
			const start = col;
			while (col + 1 < size && qr.isDark(row, col + 1)) col++;
			path += `M${start + quiet} ${row + quiet}h${col - start + 1}v1h-${col - start + 1}z`;
		}
	}
	const side = size + 2 * quiet;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" shape-rendering="crispEdges" aria-hidden="true">` +
		`<rect width="${side}" height="${side}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`
	);
}
