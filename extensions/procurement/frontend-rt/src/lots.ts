/** The lots of a tender (ggg I-PRC-5): a tender with lots is awarded one lot at a time, each with a contract of its own. */

import { toBaseUnits } from '../../../_shared/frontend/units.ts';

export interface Lot {
	id: string;
	title: string;
	estimated_value: number | null;
	status: 'open' | 'awarded' | 'void';
	/** The awarded bid. */
	winner: string | null;
	/** The contract made from it. */
	contract: string | null;
}

export interface LotBid {
	id: string;
	vendor: string;
	/** The lot it prices; empty on a tender that has none. */
	lot: string;
	sealed: boolean;
	score?: number | null;
}

export function bidsOfLot(bids: LotBid[], lot: Lot): LotBid[] {
	return bids.filter((bid) => bid.lot === lot.id);
}

/** The bid that won a lot, once it is awarded. */
export function winningBid(bids: LotBid[], lot: Lot): LotBid | undefined {
	return lot.winner ? bids.find((bid) => bid.id === lot.winner) : undefined;
}

/** The lots that still wait for an award, or for being left without one. */
export function openLots(lots: Lot[]): Lot[] {
	return lots.filter((lot) => lot.status === 'open');
}

/** A lot as typed into the form that creates a tender: its budget as text. */
export interface LotInput {
	id: string;
	title: string;
	budget: string;
}

export type LotsProblem = 'incomplete' | 'budget';

export type Lots = { lots: { id: string; title: string; estimated_value?: number }[]; problem?: undefined } | { lots?: undefined; problem: LotsProblem };

/** The `lots` of `tender_create` for the rows of a form; a row left entirely empty is no lot. The realm checks the rest. */
export function lotsOf(rows: LotInput[], decimals: number): Lots {
	const lots: { id: string; title: string; estimated_value?: number }[] = [];
	for (const row of rows) {
		const id = row.id.trim();
		const title = row.title.trim();
		const budget = row.budget.trim();
		if (!id && !title && !budget) continue;
		if (!id || !title) return { problem: 'incomplete' };
		if (!budget) {
			lots.push({ id, title });
			continue;
		}
		const estimated = toBaseUnits(budget, decimals);
		if (estimated === null) return { problem: 'budget' };
		lots.push({ id, title, estimated_value: estimated });
	}
	return { lots };
}
