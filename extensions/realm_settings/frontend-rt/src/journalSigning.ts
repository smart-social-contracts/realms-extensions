/** How the realm signs its official journal (realms-gos `Realm.journal_signing`, docs/codices/journal-signature.md). */

export const JOURNAL_SIGNING = ['on_request', 'daily'] as const;
export type JournalSigning = (typeof JOURNAL_SIGNING)[number];

/** The setting as the realm reports it. A realm that says nothing (a release before the setting) signs on request. */
export function journalSigningOf(value: unknown): JournalSigning {
	return value === 'daily' ? 'daily' : 'on_request';
}
