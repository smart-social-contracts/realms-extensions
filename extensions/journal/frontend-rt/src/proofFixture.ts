/** A signed issue as the tests make one: the text the canister signs, built from the issue, and a proof around it. */

import type { Issue } from './issue.ts';

export const CANISTER = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
export const CODE = 'ABCD-EFGH-JKLM-NPQR';
export const PUBLIC_KEY = 'ab'.repeat(32);
export const DIGEST = 'cd'.repeat(32);
export const SIGNATURE = 'ef'.repeat(64);

/** The text the canister signs for `issue`, with `over` replacing parts of it. */
export function canonicalOf(issue: Issue, over: Record<string, unknown> = {}): string {
	return JSON.stringify({
		v: 1,
		kind: 'journal',
		realm: CANISTER,
		subject: issue.day,
		body: { number: issue.number, timezone: issue.timezone, entries: issue.entries },
		prev: null,
		signed_at: 1_790_000_000,
		key: { algorithm: 'ed25519', name: 'key_1', path: 'realms:journal', public_key: PUBLIC_KEY },
		...over,
	});
}

/** `issue` as the realm serves it once signed: a batch of one, unless `proof` says otherwise. */
export function signed(issue: Issue, proof: Record<string, unknown> = {}, over: Record<string, unknown> = {}): Issue {
	return {
		...issue,
		status: 'signed',
		proof: { canonical: canonicalOf(issue, over), digest: DIGEST, root: DIGEST, path: [], signature: SIGNATURE, code: CODE, ...proof },
	};
}
