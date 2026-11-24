// Bills as Swiss QR-bills. Example IBANs only (SIX's QR-bill samples); made-up names.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SwissQRBill } from 'swissqrbill/svg';
import { billProblems, qrDataOf, referenceOfBill, type Bill } from './bill.ts';
import { invoiceOfReference, isCreditorReference, isQrr } from './references.ts';
import type { Account } from './order.ts';
// The library's own encoder of the Swiss QR Code text, which its public entry points do not export.
const { generateQRData } = await import(new URL('../../node_modules/swissqrbill/lib/esm/shared/qr-code.js', import.meta.url).href);

const realm: Account = {
	name: 'Example Realm Association', iban: 'CH58 0079 1123 0008 8901 2',
	address: { street: 'Musterstrasse', building: '1', postCode: '3000', town: 'Bern', country: 'CH' },
};
const qrRealm: Account = { ...realm, iban: 'CH44 3199 9123 0008 8901 2' };
const bill: Bill = {
	id: 'BILL-1', currency: 'CHF', amount: 15_000, message: 'Waste fee 2026', dueDate: '2026-12-31', invoice: 'INV-31',
	payer: { name: 'Ada Example', address: { street: 'Beispielweg', building: '7', postCode: '8000', town: 'Zürich', country: 'CH' } },
};

describe('a bill', () => {
	it('takes an RF reference on an ordinary IBAN and a QR reference on a QR-IBAN, both naming it', () => {
		const rf = referenceOfBill(bill, realm.iban);
		assert.equal(rf.kind, 'SCOR');
		assert.ok(isCreditorReference(rf.value));
		const qr = referenceOfBill(bill, qrRealm.iban);
		assert.equal(qr.kind, 'QRR');
		assert.ok(isQrr(qr.value));
		assert.deepEqual([invoiceOfReference(rf.value), invoiceOfReference(qr.value)], ['BILL-1', 'BILL-1']);
	});

	it('is written into the Swiss QR Code as SIX specifies it', () => {
		const lines = generateQRData(qrDataOf(bill, realm)).split('\n');
		assert.deepEqual(lines.slice(0, 11), ['SPC', '0200', '1', 'CH5800791123000889012', 'S', 'Example Realm Association', 'Musterstrasse', '1', '3000', 'Bern', 'CH']);
		assert.deepEqual(lines.slice(18, 27), ['150.00', 'CHF', 'S', 'Ada Example', 'Beispielweg', '7', '8000', 'Zürich', 'CH']);
		assert.deepEqual(lines.slice(27), ['SCOR', referenceOfBill(bill, realm.iban).value, 'Waste fee 2026, due 2026-12-31', 'EPD']);
	});

	it('leaves the amount and the payer open when the bill does', () => {
		const lines = generateQRData(qrDataOf({ id: 'BILL-2', currency: 'EUR' }, qrRealm)).split('\n');
		assert.deepEqual([lines[18], lines[19], lines[20]], ['', 'EUR', '']);
		assert.equal(lines[27], 'QRR');
	});

	it('draws the payment part and the receipt', () => {
		const svg = new SwissQRBill(qrDataOf(bill, realm), { language: 'EN' }).toString();
		assert.match(svg, /^<svg /);
		assert.match(svg, /Payment part/);
		assert.match(svg, /Receipt/);
	});

	it('refuses what a QR-bill cannot carry', () => {
		const cases: [Bill, Account | null, RegExp][] = [
			[bill, { ...realm, iban: 'DE89370400440532013000' }, /Swiss or Liechtenstein account/],
			[bill, null, /not in the register/],
			[{ ...bill, payer: { name: 'Bruno Sample', address: { town: 'Basel', country: 'CH' } } }, realm, /payer's address needs a post code/],
			[{ ...bill, amount: 0 }, realm, /between 0.01/],
			[{ ...bill, id: 'INV-1' }, realm, /BILL- and a number/],
		];
		for (const [b, creditor, message] of cases) {
			const problems = billProblems(b, creditor);
			assert.ok(problems.some((p) => message.test(p.message)), `${message}: ${JSON.stringify(problems)}`);
		}
		assert.deepEqual(billProblems(bill, realm), []);
	});
});
