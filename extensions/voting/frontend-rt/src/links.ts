/** The links a proposal carries, fixed when it is filed (ggg I-GOV-10). The realm refuses any other combination. */

export const MAX_LINKS = 16;

export type LinkKind = 'replaces' | 'relates_to';
export type Link = { kind: LinkKind; proposal: string };

/** The fields of a proposal that decide whether it can be replaced, and its title to pick it by. */
export type Replaceable = { id: string; title?: string; proposer: string; status: string; replaced_by?: string };

export type Added = { ok: true; links: Link[] } | { ok: false; reason: 'full' | 'duplicate' };

/** "P-7" as "#7"; anything else as it is. */
export function displayId(id: string): string {
	const match = /^P-(\d+)$/i.exec(id.trim());
	return match ? `#${parseInt(match[1], 10)}` : id;
}

/** The proposal id a person typed: "7", "#7", "p-7" and "P-7" all name P-7; null for anything else. */
export function parseProposalRef(text: string): string | null {
	const match = /^(?:#|p-)?(\d+)$/i.exec(text.trim());
	return match ? `P-${parseInt(match[1], 10)}` : null;
}

/**
 * The proposals ``me`` may replace: their own withdrawn ones that no proposal replaces yet and that are not
 * linked already (a proposal is named once).
 */
export function replaceable(candidates: Replaceable[], me: string, links: Link[]): Replaceable[] {
	const linked = new Set(links.map((link) => link.proposal));
	return candidates.filter(
		(p) => p.proposer === me && p.status === 'withdrawn' && !p.replaced_by && !linked.has(p.id),
	);
}

/** ``links`` with ``link`` added, unless the proposal has 16 links or already names that proposal. */
export function addLink(links: Link[], link: Link): Added {
	if (links.length >= MAX_LINKS) return { ok: false, reason: 'full' };
	if (links.some((existing) => existing.proposal === link.proposal)) return { ok: false, reason: 'duplicate' };
	return { ok: true, links: [...links, link] };
}

export function removeLink(links: Link[], proposal: string): Link[] {
	return links.filter((link) => link.proposal !== proposal);
}
