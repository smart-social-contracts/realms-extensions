import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bar, byFund, hasStages, isPending, slotOf, stagesOf, type BudgetLine } from './stages.ts';

// ggg's example: Roads FY2026, capital: planned 300,000, reserved 40,000, committed 90,000, actual 120,500.
const line = (over: Partial<BudgetLine> = {}): BudgetLine => ({
	id: 'B-1',
	fund: 'ROADS',
	period: 'FY2026',
	category: 'capital',
	kind: 'expense',
	status: 'adopted',
	planned: 300_000,
	reserved: 40_000,
	committed: 90_000,
	actual: 120_500,
	...over,
});

describe('the stages of a line', () => {
	it('leave what is available after reserved, committed and charged money', () => {
		assert.equal(stagesOf([line()]).available, 49_500);
	});

	it('add up over lines, funds and the budget', () => {
		const total = stagesOf([line(), line({ id: 'B-2', planned: 10_000, reserved: 0, committed: 0, actual: 2_000 })]);
		assert.deepEqual(total, { planned: 310_000, reserved: 40_000, committed: 90_000, actual: 122_500, available: 57_500 });
	});

	it('are held by the expense lines in force and by no other', () => {
		assert.equal(hasStages(line()), true);
		assert.equal(hasStages(line({ status: 'extended', reserved: 0, committed: 0 })), true);
		assert.equal(hasStages(line({ kind: 'revenue' })), false);
		assert.equal(hasStages(line({ status: 'draft' })), false);
		assert.equal(hasStages(line({ status: 'proposed' })), false);
	});

	it('are not held by a line still being drafted or proposed: only the expense ones are listed as pending', () => {
		assert.equal(isPending(line({ status: 'draft' })), true);
		assert.equal(isPending(line({ status: 'proposed' })), true);
		assert.equal(isPending(line({ status: 'draft', kind: 'revenue' })), false);
		assert.equal(isPending(line()), false);
	});
});

describe('the slot of a line', () => {
	it('names the fund, period and category the versions of a line share', () => {
		assert.equal(slotOf(line()), 'ROADS:FY2026:capital');
		assert.equal(slotOf(line({ id: 'B-9', status: 'amended' })), slotOf(line()));
	});
});

describe('byFund', () => {
	it('groups the lines that hold stages by fund, in order, with the totals of each', () => {
		const funds = byFund([
			line({ id: 'B-3', fund: 'WELFARE', category: 'care', planned: 1_000, reserved: 0, committed: 0, actual: 0 }),
			line({ id: 'B-2', category: 'upkeep', planned: 50_000, reserved: 0, committed: 0, actual: 10_000 }),
			line(),
			line({ id: 'B-4', category: 'taxes', kind: 'revenue', planned: 999_999 }),
			line({ id: 'B-5', category: 'plan', status: 'proposed' }),
		]);
		assert.deepEqual(funds.map((f) => f.fund), ['ROADS', 'WELFARE']);
		assert.deepEqual(funds[0].lines.map((l) => l.id), ['B-1', 'B-2']); // capital, upkeep
		assert.equal(funds[0].lines[0].available, 49_500);
		assert.deepEqual(funds[0].totals, { planned: 350_000, reserved: 40_000, committed: 90_000, actual: 130_500, available: 89_500 });
		assert.equal(funds[1].totals.available, 1_000);
	});

	it('is empty when no line holds stages', () => {
		assert.deepEqual(byFund([]), []);
		assert.deepEqual(byFund([line({ kind: 'revenue' })]), []);
	});
});

describe('the bar of a line', () => {
	const percents = (stages: Parameters<typeof bar>[0]) => bar(stages).map((p) => [p.stage, Math.round(p.percent * 100) / 100]);

	it('shows charged, committed, reserved and available money as shares of what is planned', () => {
		assert.deepEqual(percents(stagesOf([line()])), [
			['actual', 40.17],
			['committed', 30],
			['reserved', 13.33],
			['available', 16.5],
		]);
	});

	it('adds up to the whole bar', () => {
		const total = bar(stagesOf([line()])).reduce((sum, part) => sum + part.percent, 0);
		assert.ok(Math.abs(total - 100) < 1e-9);
	});

	it('is empty when no money is planned', () => {
		assert.deepEqual(bar(stagesOf([line({ planned: 0, reserved: 0, committed: 0, actual: 0 })])), []);
	});

	it('stays inside its frame even when a reply holds more than is planned', () => {
		const total = bar(stagesOf([line({ planned: 100_000 })])).reduce((sum, part) => sum + part.percent, 0);
		assert.ok(Math.abs(total - 100) < 1e-9);
		assert.equal(bar(stagesOf([line({ planned: 100_000 })])).find((p) => p.stage === 'available')?.percent, 0);
	});
});
