import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	creditorReferenceOf,
	invoiceOfReference,
	invoiceQrr,
	invoiceReference,
	isCreditorReference,
	isQrr,
	qrrOf,
} from './references.ts';

describe('QR reference', () => {
	it("checks SIX's QR-bill sample and refuses a changed digit", () => {
		assert.equal(isQrr('21 00000 00003 13947 14300 09017'), true);
		assert.equal(isQrr('210000000003139471430009018'), false);
	});

	it('pads a number to 26 digits and adds its check digit', () => {
		const ref = qrrOf('12');
		assert.equal(ref.length, 27);
		assert.equal(isQrr(ref), true);
	});
});

describe('creditor reference (ISO 11649)', () => {
	it('checks the standard example', () => {
		assert.equal(isCreditorReference('RF18 5390 0754 7034'), true);
		assert.equal(isCreditorReference('RF19 5390 0754 7034'), false);
	});

	it('makes a reference that checks', () => {
		assert.equal(isCreditorReference(creditorReferenceOf('INV7')), true);
		assert.throws(() => creditorReferenceOf('INV-7'));
	});
});

describe('invoice references', () => {
	it('come back to the invoice they were made from', () => {
		assert.equal(invoiceOfReference(invoiceReference('INV-7')), 'INV-7');
		assert.equal(invoiceOfReference(invoiceQrr('INV-12')!), 'INV-12');
	});

	it('name no invoice when the reference is not one of the realm', () => {
		assert.equal(invoiceOfReference('RF18539007547034'), null);
		assert.equal(invoiceOfReference('Donation'), null);
	});
});
