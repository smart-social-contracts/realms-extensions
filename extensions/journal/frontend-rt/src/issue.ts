/** An issue of the journal as the realm serves it (`journal_issue`), and how the issue and its entries are referred to. */

export interface Entry {
	id: string;
	/** UTC seconds: when the realm learned of it. */
	at: number;
	kind: string;
	details: Record<string, any>;
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
