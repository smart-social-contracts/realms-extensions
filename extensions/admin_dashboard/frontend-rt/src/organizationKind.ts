/**
 * What an organization is (ggg I-ORG-9, ggg.did:222 OrganizationKind): one of the five the realm accepts, `other` being
 * any organization that is none of the four. The realm stores the word the organization chose and does not check it
 * beyond that (realms-gos `ggg/identity/organization.py` KINDS), and `organization_list` filters by it on the realm's side.
 */

export const KINDS = ['company', 'party', 'union', 'association', 'other'] as const;

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** The kind a row states, or '' for a row that states none (an organization registered before kinds existed). */
export function kindOf(row: unknown): string {
	const kind = (row as { kind?: unknown } | null)?.kind;
	return typeof kind === 'string' ? kind.trim() : '';
}

/** The kind in the reader's language; a row with no kind reads as unknown, and a word the page does not know as it is. */
export function kindText(kind: string, t: Translate): string {
	if (!kind) return t('org_kind_unknown');
	return (KINDS as readonly string[]).includes(kind) ? t(`org_kind_${kind}`) : kind;
}
