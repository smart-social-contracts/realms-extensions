import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatById } from './formats.ts';
import type { PaymentOrder } from './order.ts';
import { SWISS_ORDER } from './samples.ts';
import { spsGroups, spsPaymentType } from './sps.ts';
import { find, findAll, parse, textAt } from './xml.ts';

const sps = formatById('sps-2025');

function withLine(change: Partial<PaymentOrder['lines'][0]>, index = 0): PaymentOrder {
	return { ...SWISS_ORDER, lines: SWISS_ORDER.lines.map((l, i) => (i === index ? { ...l, ...change } : l)) };
}

describe('SPS payment types', () => {
	it('sorts each sample line into D, S or X', () => {
		assert.deepEqual(SWISS_ORDER.lines.map(spsPaymentType), ['D', 'D', 'D', 'D', 'S', 'X']);
	});

	it('groups by type, currency and salary, salaries with SALA, in the order lines come', () => {
		const groups = spsGroups(SWISS_ORDER);
		assert.deepEqual(groups.map((g) => g.lines.map((l) => l.id.slice(-2))), [['01', '02'], ['03'], ['04'], ['05'], ['06']]);
		assert.deepEqual(groups.map((g) => g.categoryPurpose ?? ''), ['SALA', '', '', '', '']);
		assert.deepEqual(groups.map((g) => g.serviceLevel ?? ''), ['', '', '', 'SEPA', '']);
		assert.deepEqual(groups.map((g) => g.chargeBearer ?? ''), ['', '', '', 'SLEV', 'SHAR']);
	});
});

describe('the SPS file', () => {
	it('has no problems for the sample and is the same bytes every time', () => {
		assert.deepEqual(sps.problems(SWISS_ORDER), []);
		assert.equal(sps.write(SWISS_ORDER), sps.write(structuredClone(SWISS_ORDER)));
	});

	it('carries the realm payment id as EndToEndId, and the totals', () => {
		const doc = parse(sps.write(SWISS_ORDER));
		const header = find(doc, 'CstmrCdtTrfInitn/GrpHdr');
		assert.equal(textAt(header, 'NbOfTxs'), '6');
		assert.equal(textAt(header, 'CtrlSum'), '12650.4');
		const ids = findAll(doc, 'CstmrCdtTrfInitn/PmtInf').flatMap((g) =>
			findAll(g, 'CdtTrfTxInf').map((tx) => textAt(tx, 'PmtId/EndToEndId')),
		);
		assert.deepEqual(ids, SWISS_ORDER.lines.map((l) => l.id));
		const salary = findAll(doc, 'CstmrCdtTrfInitn/PmtInf')[0];
		assert.equal(textAt(salary, 'PmtTpInf/CtgyPurp/Cd'), 'SALA');
		assert.equal(textAt(salary, 'BtchBookg'), 'true');
		assert.equal(textAt(salary, 'CtrlSum'), '8050.5');
	});

	it('writes a QR-bill payment with its QR reference and the debtor bank by its IID', () => {
		const doc = parse(sps.write(SWISS_ORDER));
		const groups = findAll(doc, 'CstmrCdtTrfInitn/PmtInf');
		const qr = find(groups[1], 'CdtTrfTxInf');
		assert.equal(textAt(qr, 'RmtInf/Strd/CdtrRefInf/Tp/CdOrPrtry/Prtry'), 'QRR');
		assert.equal(textAt(qr, 'RmtInf/Strd/CdtrRefInf/Ref'), '210000000003139471430009017');
		assert.equal(textAt(groups[0], 'DbtrAgt/FinInstnId/ClrSysMmbId/MmbId'), '00762');
	});
});

describe('SPS problems', () => {
	it('names the line that cannot be paid, and why', () => {
		const cases: [PaymentOrder, RegExp][] = [
			[withLine({ reference: undefined }, 2), /QR-IBAN carries the QR-bill's QR reference/],
			[withLine({ reference: { kind: 'QRR', value: '210000000003139471430009017' } }, 0), /only paid to a QR-IBAN/],
			[withLine({ payee: { ...SWISS_ORDER.lines[5].payee, bic: undefined } }, 5), /needs the payee bank's BIC/],
			[withLine({ payee: { ...SWISS_ORDER.lines[0].payee, name: 'Ада Example' } }), /cannot be sent/],
			[withLine({ amount: 0 }), /more than zero/],
			[withLine({ id: SWISS_ORDER.lines[1].id }), /used twice/],
			[withLine({ payee: { ...SWISS_ORDER.lines[0].payee, iban: 'CH9300762011623852958' } }), /check digits/],
			[withLine({ payee: { ...SWISS_ORDER.lines[0].payee, address: undefined } }), /needs at least a town and a two-letter country/],
		];
		for (const [order, message] of cases) {
			const problems = sps.problems(order);
			assert.ok(problems.some((p) => message.test(p.message)), `${message}: ${JSON.stringify(problems)}`);
		}
	});

	it('refuses to pay from a QR-IBAN or from an account outside Switzerland', () => {
		const fromQr = { ...SWISS_ORDER, debtor: { ...SWISS_ORDER.debtor, iban: 'CH4431999123000889012' } };
		assert.ok(sps.problems(fromQr).some((p) => /QR-IBAN, which only receives/.test(p.message)));
		const fromDe = { ...SWISS_ORDER, debtor: { ...SWISS_ORDER.debtor, iban: 'DE89370400440532013000' } };
		assert.ok(sps.problems(fromDe).some((p) => /Swiss or Liechtenstein account/.test(p.message)));
	});
});
