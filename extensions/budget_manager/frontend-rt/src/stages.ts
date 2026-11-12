/**
 * The stages an expense line's money moves through (ggg I-FIN-9): planned, then reserved for a spending not yet
 * committed, committed to a third party and not yet charged, actual (charged), and what is still available.
 */

export interface BudgetLine {
	id: string;
	fund: string;
	period: string;
	category: string;
	kind: string;
	status: string;
	planned: number;
	reserved: number;
	committed: number;
	actual: number;
}

export interface Stages {
	planned: number;
	reserved: number;
	committed: number;
	actual: number;
	available: number;
}

export type StageName = 'actual' | 'committed' | 'reserved' | 'available';

// The lines that cap spending, as the realm reads them: adopted ones and ones extended from the period before.
const IN_FORCE = ['adopted', 'extended'];
// Lines still being made: nothing can be reserved, committed or charged to them yet.
const NOT_IN_FORCE = ['draft', 'proposed'];

/** An expense line the realm holds money stages on. An extended line holds none (it starts at zero) but is charged. */
export function hasStages(line: BudgetLine): boolean {
	return line.kind === 'expense' && IN_FORCE.includes(line.status);
}

/** An expense line that is drafted or proposed: it shows what it plans and nothing else. */
export function isPending(line: BudgetLine): boolean {
	return line.kind === 'expense' && NOT_IN_FORCE.includes(line.status);
}

export function stagesOf(lines: Pick<BudgetLine, 'planned' | 'reserved' | 'committed' | 'actual'>[]): Stages {
	const total = { planned: 0, reserved: 0, committed: 0, actual: 0 };
	for (const line of lines) {
		total.planned += line.planned;
		total.reserved += line.reserved;
		total.committed += line.committed;
		total.actual += line.actual;
	}
	return { ...total, available: total.planned - total.reserved - total.committed - total.actual };
}

export interface FundLines {
	fund: string;
	lines: (BudgetLine & Stages)[];
	totals: Stages;
}

/** The lines that hold stages, by fund (the realm's budget is one chapter per fund), each with its stages and its totals. */
export function byFund(lines: BudgetLine[]): FundLines[] {
	const funds = new Map<string, BudgetLine[]>();
	for (const line of lines.filter(hasStages)) funds.set(line.fund, [...(funds.get(line.fund) ?? []), line]);
	return [...funds.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([fund, own]) => ({
			fund,
			lines: own
				.sort((a, b) => a.category.localeCompare(b.category))
				.map((line) => ({ ...line, ...stagesOf([line]) })),
			totals: stagesOf(own),
		}));
}

/**
 * The widths, in percent, of the four parts of a stacked bar, in the order they are drawn: what is charged, committed,
 * reserved and still available, of what is planned. They add up to 100, and the bar is empty when no money is planned.
 * The realm never lets a line hold more than it plans; the bar still stays inside its frame if a reply says otherwise.
 */
export function bar(stages: Stages): { stage: StageName; percent: number }[] {
	if (stages.planned <= 0) return [];
	const spent = stages.actual + stages.committed + stages.reserved;
	const whole = Math.max(stages.planned, spent);
	const amounts: Record<StageName, number> = {
		actual: stages.actual,
		committed: stages.committed,
		reserved: stages.reserved,
		available: Math.max(stages.planned - spent, 0),
	};
	return (Object.keys(amounts) as StageName[]).map((stage) => ({
		stage,
		percent: (Math.max(amounts[stage], 0) / whole) * 100,
	}));
}
