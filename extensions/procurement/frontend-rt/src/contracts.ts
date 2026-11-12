/** What the contract pages read from the realm (ggg I-GOV-16, I-PRC-5, I-PRC-6) and the arithmetic they do on it. */

import { formatInZone, resolveLocalTime } from '../../../_shared/frontend/realm-time.ts';
import { toBaseUnits } from '../../../_shared/frontend/units.ts';

export interface PeriodAmount {
	period: string;
	amount: number;
}

/** The terms of a contract that an amendment may change. */
export interface Terms {
	value: number;
	split: PeriodAmount[];
	starts_at: number;
	ends_at: number;
}

export type TermName = keyof Terms;

export type FrameworkHolder = { External: string } | { Realm: string };

export interface Framework {
	holder: FrameworkHolder;
	reference: string;
	winners: string[];
}

export interface Contract {
	id: string;
	title: string;
	parties: string[];
	mandate: string | null;
	kind: string;
	procedure: string;
	tender: string;
	lot: string;
	value: number;
	symbol: string;
	status: string;
	starts_at: number;
	ends_at: number;
	split: PeriodAmount[];
	framework: Framework | null;
}

export interface Amendment {
	id: string;
	contract: string;
	before: Terms;
	after: Terms;
	/** The proposal that carried it; empty when the governing department decided directly. */
	proposal: string;
	at: number;
}

/** What `contract_get` says besides the contract and its amendments: what an amendment of it is held to. */
export interface AmendmentRule {
	/** The least the value may be amended to. */
	paid: number;
	governed_by: string;
	needs_vote: boolean;
	budgets: BudgetLine[];
}

export interface BudgetLine {
	id: string;
	fund: string;
	period: string;
	category: string;
}

export interface External {
	id: string;
	name: string;
	kind: string;
}

/** What the contract pages know of the realm besides the contract. */
export interface RealmFacts {
	/** The realm's official time zone. */
	zone: string;
	/** The realm's accounting currency and its decimals. */
	currency: string;
	decimals: number;
	externals: External[];
	/** The realms this one is linked to, by capital. */
	realms: Record<string, string>;
}

/** The decimals of an amount in `symbol`: the realm knows them for its accounting currency. */
export function decimalsFor(symbol: string, facts: RealmFacts): number {
	return symbol === facts.currency ? facts.decimals : 0;
}

export function isCallOff(contract: Contract): boolean {
	return contract.framework !== null && contract.framework !== undefined;
}

/** The contracts a list shows: all of them, or only the call-offs under a framework agreement. */
export function visibleContracts(contracts: Contract[], onlyCallOffs: boolean): Contract[] {
	return onlyCallOffs ? contracts.filter(isCallOff) : contracts;
}

const ORGANIZATION = 'Organization:';

/** The colours of a contract's status, as the requests' stages have theirs. */
export function statusClass(status: string): string {
	const classes: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-700',
		active: 'bg-green-100 text-green-800',
		fulfilled: 'bg-emerald-100 text-emerald-800',
		terminated: 'bg-red-50 text-red-700',
		disputed: 'bg-yellow-100 text-yellow-800',
	};
	return classes[status] ?? 'bg-gray-100 text-gray-700';
}

/** The parties of a contract that are organizations (its suppliers), by id, which is the organization's name: the other
 *  side of a contract is the realm's. */
export function suppliers(contract: Contract): string[] {
	return (contract.parties ?? []).filter((party) => party.startsWith(ORGANIZATION)).map((party) => party.slice(ORGANIZATION.length));
}

// ---- money and time --------------------------------------------------------------------------------------------------

/** An amount as the realm shows money (as the budget page does): in the currency's decimals, with its symbol. */
export function money(amount: number, symbol: string, decimals: number, locale?: string): string {
	const shown = (amount / 10 ** decimals).toLocaleString(locale, { maximumFractionDigits: decimals });
	return symbol ? `${shown} ${symbol}` : shown;
}

/** `YYYY-MM-DD` of a time in the realm's zone; the empty text for a contract that has no such date. */
export function dayIn(epoch: number, zone: string): string {
	return epoch ? formatInZone(epoch, zone).slice(0, 10) : '';
}

/** The first instant of a day (`YYYY-MM-DD`) in the realm's zone; a day whose midnight the clocks skip starts an hour later. */
export function dayStart(day: string, zone: string): number | null {
	for (const hour of ['00', '01']) {
		const at = resolveLocalTime(`${day}T${hour}:00`, zone);
		if (at.kind === 'ok') return at.epoch;
		if (at.kind === 'twice') return at.first;
	}
	return null;
}

// ---- amendments ------------------------------------------------------------------------------------------------------

export interface TermChange {
	term: TermName;
	before: Terms[TermName];
	after: Terms[TermName];
}

const TERMS: TermName[] = ['value', 'split', 'starts_at', 'ends_at'];

/** The terms an amendment changed, in the order a contract lists them. */
export function termChanges(before: Terms, after: Terms): TermChange[] {
	return TERMS.filter((term) => JSON.stringify(before[term]) !== JSON.stringify(after[term])).map((term) => ({
		term,
		before: before[term],
		after: after[term],
	}));
}

/** The terms of a contract as an amendment would change them. */
export function termsOf(contract: Contract): Terms {
	return { value: contract.value, split: contract.split ?? [], starts_at: contract.starts_at, ends_at: contract.ends_at };
}

/** `FY2026 30,000 · FY2027 20,000`. */
export function splitText(split: PeriodAmount[], symbol: string, decimals: number, locale?: string): string {
	return split.map((p) => `${p.period} ${money(p.amount, symbol, decimals, locale)}`).join(' · ');
}

export function splitTotal(split: PeriodAmount[]): number {
	return split.reduce((sum, p) => sum + p.amount, 0);
}

/** What a person typed into the amendment form: money as text, days as `YYYY-MM-DD` or nothing. */
export interface AmendmentInput {
	value: string;
	split: { period: string; amount: string }[];
	starts: string;
	ends: string;
}

/** Why a form cannot be filed: it asks for no change, or an amount, a period or a day is not one. */
export type AmendmentProblem = 'nothing_changed' | 'bad_value' | 'bad_split_amount' | 'bad_split_period' | 'bad_day';

export type Amending = { args: Record<string, unknown>; problem?: undefined } | { args?: undefined; problem: AmendmentProblem };

/**
 * The arguments of `contract_amend` for a form: only the terms it changes, since a term left out keeps the contract's.
 * The realm checks the rest (the paid floor, the split adding up to the value, a contract that has ended).
 */
export function amendment(current: Terms, input: AmendmentInput, decimals: number, zone: string): Amending {
	const args: Record<string, unknown> = {};

	const value = toBaseUnits(input.value, decimals);
	if (value === null) return { problem: 'bad_value' };
	if (value !== current.value) args.value = value;

	const split: PeriodAmount[] = [];
	for (const row of input.split) {
		const amount = toBaseUnits(row.amount, decimals);
		if (!row.period.trim()) return { problem: 'bad_split_period' };
		if (amount === null) return { problem: 'bad_split_amount' };
		split.push({ period: row.period.trim(), amount });
	}
	if (JSON.stringify(split) !== JSON.stringify(current.split)) args.split = split;

	for (const [term, day] of [['starts_at', input.starts], ['ends_at', input.ends]] as const) {
		if (day === dayIn(current[term], zone)) continue;
		if (!day) {
			// A contract may lose its end, never its start.
			if (term === 'ends_at') args.ends_at = 0;
			continue;
		}
		const at = dayStart(day, zone);
		if (at === null) return { problem: 'bad_day' };
		args[term] = at;
	}

	return Object.keys(args).length ? { args } : { problem: 'nothing_changed' };
}

/** Where a proposal is read, in the voting extension, from the path the realm is served at (a prefix such as `/r/<slug>`). */
export function proposalPath(proposal: string, pathname: string): string {
	const prefix = /^(.*)\/extensions\/procurement(?:\/|$)/.exec(pathname)?.[1] ?? '';
	return `${prefix}/extensions/voting/proposals/${encodeURIComponent(proposal)}`;
}

// ---- framework agreements --------------------------------------------------------------------------------------------

/** Who holds a framework agreement: an outside body of this realm, or another realm, by name when the realm knows it. */
export interface Holder {
	kind: 'external' | 'realm';
	/** The External's id, or the realm's capital. */
	id: string;
	/** What the realm calls it; null for a realm it knows no name of. */
	name: string | null;
	/** What kind of body an External is (an authority, a journal...). */
	body: string;
}

/** `externals` are the realm's outside bodies; `realms` maps a capital to the name of a realm this one is linked to. */
export function holderOf(framework: Framework, externals: External[], realms: Record<string, string>): Holder {
	if ('External' in framework.holder) {
		const id = framework.holder.External;
		const known = externals.find((e) => e.id === id);
		return { kind: 'external', id, name: known?.name || null, body: known?.kind ?? '' };
	}
	const id = framework.holder.Realm;
	return { kind: 'realm', id, name: realms[id] || null, body: '' };
}

/** The realms this one is linked to, by capital, from `realm_info`'s sync sources. */
export function linkedRealms(syncSources: { source?: Record<string, unknown>; name?: string }[]): Record<string, string> {
	const names: Record<string, string> = {};
	for (const link of syncSources) {
		const capital = link.source?.Realm;
		if (typeof capital === 'string' && link.name) names[capital] = link.name;
	}
	return names;
}

export function shortId(id: string): string {
	return id.length <= 14 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}
