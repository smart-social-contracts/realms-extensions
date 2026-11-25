/** One quarter of the realm, as the page lists it. */
export type Quarter = { population?: number | string | null };

/** What the realm's `realm_numbers` read answers: its proposals and its votes. */
export type Numbers = { proposals?: number; votes?: number } | null;

/**
 * The realm's status as the page shows it: its stage, whether registration is open, its members (the populations of its
 * quarters added up), the quarters, and the realm's own count of proposals and votes. A realm that has no
 * `realm_numbers` read (an older one) answers none, so those two stay undefined and the page shows no count, rather
 * than the zero it printed when the page never asked (realms-extensions#119).
 */
export function realmStatus(realm: any, quarters: Quarter[], numbers: Numbers) {
	return {
		realm_stage: realm?.status,
		open_registration: realm?.open_registration,
		users_count: quarters.reduce((sum, q) => sum + Number(q.population || 0), 0),
		proposals_count: numbers?.proposals,
		votes_count: numbers?.votes,
		quarters,
	};
}
