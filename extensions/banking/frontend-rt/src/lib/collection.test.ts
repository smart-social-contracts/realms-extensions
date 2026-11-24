import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isRsPid, isSepaCreditorId, type CollectionOrder } from './collection.ts';
import { collectionFormatById } from './formats.ts';
import { invoiceReference } from './references.ts';
import { CHDD_ORDER, SEPA_DD_ORDER } from './samples.ts';
import { find, findAll, parse, textAt } from './xml.ts';

const sdd = collectionFormatById('sepa-dd-2025');
const chdd = collectionFormatById('ch-dd');

function withLine(order: CollectionOrder, change: Partial<CollectionOrder['lines'][0]>, index = 0): CollectionOrder {
	return { ...order, lines: order.lines.map((l, i) => (i === index ? { ...l, ...change } : l)) };
}

describe('identifiers', () => {
	it("checks a SEPA creditor identifier's digits and PostFinance's RS-PID", () => {
		assert.equal(isSepaCreditorId('DE98ZZZ09999999999'), true);
		assert.equal(isSepaCreditorId('DE97ZZZ09999999999'), false);
		assert.equal(isRsPid('41100123450000007'), true);
		assert.equal(isRsPid('41100123450000008'), false);
	});
});

describe('SEPA Direct Debit Core', () => {
	it('has no problems for the sample and is the same bytes every time', () => {
		assert.deepEqual(sdd.problems(SEPA_DD_ORDER), []);
		assert.equal(sdd.write(SEPA_DD_ORDER), sdd.write(structuredClone(SEPA_DD_ORDER)));
	});

	it('groups by sequence type and names each mandate and the creditor identifier', () => {
		const groups = findAll(parse(sdd.write(SEPA_DD_ORDER)), 'CstmrDrctDbtInitn/PmtInf');
		assert.deepEqual(groups.map((g) => textAt(g, 'PmtTpInf/SeqTp')), ['RCUR', 'OOFF']);
		assert.deepEqual(groups.map((g) => textAt(g, 'PmtTpInf/LclInstrm/Cd')), ['CORE', 'CORE']);
		assert.equal(textAt(groups[0], 'CdtrSchmeId/Id/PrvtId/Othr/Id'), 'DE98ZZZ09999999999');
		const tx = find(groups[0], 'DrctDbtTxInf');
		assert.equal(textAt(tx, 'DrctDbtTx/MndtRltdInf/MndtId'), 'REALM-MANDATE-0001');
		assert.equal(textAt(tx, 'DrctDbtTx/MndtRltdInf/DtOfSgntr'), '2026-01-15');
		assert.equal(textAt(tx, 'PmtId/EndToEndId'), 'BK-20261124-0003-01');
		assert.equal(textAt(tx, 'Dbtr/Nm'), 'Zoe Exemple-Lefevre');
	});

	it('refuses a payer without a mandate, a mandate signed after the collection, CHF and a bad creditor id', () => {
		const payer = SEPA_DD_ORDER.lines[0].payer;
		const cases: [CollectionOrder, RegExp][] = [
			[withLine(SEPA_DD_ORDER, { payer: { ...payer, mandate: undefined } }), /no SEPA mandate/],
			[withLine(SEPA_DD_ORDER, { payer: { ...payer, mandate: { id: 'M1', signedOn: '2027-01-01' } } }), /signed on a day/],
			[withLine(SEPA_DD_ORDER, { currency: 'CHF' }), /in EUR/],
			[{ ...SEPA_DD_ORDER, creditorId: 'DE00ZZZ09999999999' }, /creditor identifier/],
			[withLine(SEPA_DD_ORDER, { payer: { ...payer, address: undefined } }), /needs at least a town/],
		];
		for (const [order, message] of cases) {
			const problems = sdd.problems(order);
			assert.ok(problems.some((p) => message.test(p.message)), `${message}: ${JSON.stringify(problems)}`);
		}
	});
});

describe('PostFinance CH-DD', () => {
	it('has no problems for the sample and is the same bytes every time', () => {
		assert.deepEqual(chdd.problems(CHDD_ORDER), []);
		assert.equal(chdd.write(CHDD_ORDER), chdd.write(structuredClone(CHDD_ORDER)));
	});

	it('writes the CH-DD codes, the RS-PID, PostFinance as both banks, and the reference as text', () => {
		const doc = parse(chdd.write(CHDD_ORDER));
		assert.equal(doc.attrs.xmlns, 'http://www.six-interbank-clearing.com/de/pain.008.001.02.ch.03.xsd');
		const group = find(doc, 'CstmrDrctDbtInitn/PmtInf');
		assert.equal(textAt(group, 'PmtTpInf/SvcLvl/Prtry'), 'CHDD');
		assert.equal(textAt(group, 'PmtTpInf/LclInstrm/Prtry'), 'DDCOR1');
		assert.equal(textAt(group, 'CdtrSchmeId/Id/PrvtId/Othr/Id'), '41100123450000007');
		assert.equal(textAt(group, 'CdtrAgt/FinInstnId/ClrSysMmbId/MmbId'), '09000');
		const tx = find(group, 'DrctDbtTxInf');
		assert.equal(textAt(tx, 'RmtInf/Ustrd'), invoiceReference('INV-31'));
		assert.equal(textAt(tx, 'Dbtr/PstlAdr/StrtNm'), 'Beispielweg 7');
	});

	it('refuses an account outside PostFinance, a first collection and a bad RS-PID', () => {
		const payer = CHDD_ORDER.lines[0].payer;
		const cases: [CollectionOrder, RegExp][] = [
			[withLine(CHDD_ORDER, { payer: { ...payer, iban: 'CH9300762011623852957' } }), /PostFinance account only/],
			[withLine(CHDD_ORDER, { sequence: 'FRST' }), /no first or final/],
			[{ ...CHDD_ORDER, creditorId: '41100123450000008' }, /RS-PID/],
			[withLine(CHDD_ORDER, { currency: 'USD' }), /CHF or EUR/],
		];
		for (const [order, message] of cases) {
			const problems = chdd.problems(order);
			assert.ok(problems.some((p) => message.test(p.message)), `${message}: ${JSON.stringify(problems)}`);
		}
	});
});
