/** An issue of the journal as the realm serves it (`journal_issue`), and how the issue and its entries are referred to. */

export interface Entry {
	id: string;
	/** UTC seconds: when the realm learned of it. */
	at: number;
	kind: string;
	details: Record<string, any>;
}

/** What the realm's canister signed and the signature on it, as `journal_issue` serves it (realms-gos,
 * docs/codices/journal-signature.md). */
export interface Proof {
	/** The signed text: JSON that names the canister, the kind of document, the day, the issue's entries, the digest of the
	 * issue before it and the key. */
	canonical: string;
	/** SHA-256 of the text, hex. */
	digest: string;
	/** What the signature covers, hex: the digest itself, or the root of the tree of the issues signed together with it. */
	root: string;
	/** The steps from the digest up to the root, `[side, sibling digest]`: none when the issue was signed alone. */
	path: [string, string][];
	/** Ed25519, hex. */
	signature: string;
	/** The verification code, `XXXX-XXXX-XXXX-XXXX`. */
	code: string;
}

export interface Issue {
	/** The name of the realm that issues it: on a quarter, the capital's. */
	realm: string;
	day: string;
	number: number;
	first_day: string;
	today: string;
	timezone: string;
	entries: Entry[];
	/** `provisional` (today's: it can be signed once the day has closed), `signed` or `unsigned` (closed, and nobody has asked
	 * the realm to sign it). A realm that does not sign says nothing. */
	status?: 'provisional' | 'signed' | 'unsigned';
	/** Present when the issue is signed. */
	proof?: Proof;
}

export type Text = (key: string, vars?: Record<string, string | number>) => string;

/** "2026/3": the year of the issue's day and its number. */
export function issueReference(issue: Issue): string {
	return `${issue.day.slice(0, 4)}/${issue.number}`;
}

/** "2026/3-2": the second entry of the issue, counted in the order they were recorded. Entries are never changed or
 * removed, so the reference of an entry of a past issue stays the same. */
export function entryReference(issue: Issue, position: number): string {
	return `${issueReference(issue)}-${position}`;
}
