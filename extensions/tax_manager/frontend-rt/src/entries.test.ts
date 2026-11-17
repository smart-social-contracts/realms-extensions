import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toEntry, toTax, type Tax, type TaxEntry } from './entries.ts';

const PROPERTY: TaxEntry = {
	code: 'property',
	kind: 'tax',
	subject: 'Land',
	facts: {
		unit_value: 100,
		due_days: 100,
		brackets: [
			{ up_to: 50_000, rate: 400_000 },
			{ up_to: null, rate: 800_000 },
		],
	},
};
const RESIDENCE: TaxEntry = {
	code: 'residence',
	kind: 'fee',
	subject: 'User',
	amount: 5,
	facts: { label: 'Residence', exempt_profiles: ['exempt'] },
};
const REVENUE: TaxEntry = { code: 'revenue', kind: 'tax', subject: 'Declaration', rate: 2_000_000, facts: {} };

describe('the tax entry form', () => {
	it('shows an entry as the tax the editor edits: the subject as its base, the charge as its method', () => {
		assert.deepEqual(toTax(RESIDENCE), {
			code: 'residence',
			kind: 'fee',
			base: 'flat',
			method: 'fixed',
			amount: 5,
			label: 'Residence',
			exempt_profiles: ['exempt'],
			extra: {},
		});
		const land = toTax(PROPERTY);
		assert.deepEqual([land.base, land.method, land.unit_value, land.due_days], ['land_area', 'progressive', 100, 100]);
		assert.deepEqual(land.brackets, PROPERTY.facts.brackets);
		const declared = toTax(REVENUE);
		assert.deepEqual([declared.base, declared.method, declared.rate], ['declared', 'proportional', 2_000_000]);
	});

	it('gives back the entry it was shown: brackets in the facts, one way to charge', () => {
		for (const entry of [PROPERTY, RESIDENCE, REVENUE]) assert.deepEqual(toEntry(toTax(entry)), entry);
	});

	it('moves a tax the admin changed to the method and the base chosen, and drops what no longer applies', () => {
		const tax: Tax = { ...toTax(PROPERTY), base: 'declared', method: 'proportional', rate: 1_000_000 };
		const entry = toEntry(tax);
		assert.equal(entry.subject, 'Declaration');
		assert.equal(entry.rate, 1_000_000);
		assert.equal('amount' in entry, false);
		assert.equal('brackets' in entry.facts, false);
		assert.equal(entry.facts.due_days, 100);
	});

	it('keeps a subject and the facts the editor has no field for, so editing one tax changes nothing else', () => {
		const codex: TaxEntry = {
			code: 'ibi',
			kind: 'surcharge',
			subject: 'Organization',
			rate: 5_000_000,
			facts: { capital: true, label: 'IBI' },
		};
		const tax = toTax(codex);
		assert.equal(tax.base, 'Organization');
		assert.deepEqual(tax.extra, { capital: true });
		assert.deepEqual(toEntry({ ...tax, label: 'Property' }), { ...codex, facts: { capital: true, label: 'Property' } });
	});
});
