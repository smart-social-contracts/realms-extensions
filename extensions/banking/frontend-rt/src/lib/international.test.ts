// Accounts without IBANs and the generic ISO 20022 file (CGI-MP). Every bank code and account number is made up so
// that no bank has it (see samples.ts).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cgiProblems } from './cgi.ts';
import { abaRouting, bsb, canadianRouting, countryOf, ifsc, localScheme, usesIban } from './countries.ts';
import { defaultPaymentFormat, formatById } from './formats.ts';
import { readOrderFile } from './review.ts';
import { WORLD_ORDER } from './samples.ts';

describe('bank codes', () => {
	it('checks an ABA routing number by its weighted sum', () => {
		assert.equal(abaRouting('981234568'), '981234568');
		assert.equal(abaRouting('9812-3456-8'), '981234568');
		assert.equal(abaRouting('981234567'), null);
		assert.equal(abaRouting('98123456'), null);
	});
	it('reads a Canadian routing number from the cheque form or the electronic one', () => {
		assert.equal(canadianRouting('12345-999'), '099912345');
		assert.equal(canadianRouting('099912345'), '099912345');
		assert.equal(canadianRouting('199912345'), null);
	});
	it('takes a BSB of six digits and an IFSC of four letters, a zero and six', () => {
		assert.equal(bsb('000-123'), '000123');
		assert.equal(bsb('0001234'), null);
		assert.equal(ifsc('exmp0001234'), 'EXMP0001234');
		assert.equal(ifsc('EXMP1001234'), null);
	});
	it('knows which countries number accounts by IBAN', () => {
		assert.ok(usesIban('CH') && usesIban('DE') && usesIban('GB') && usesIban('BR'));
		assert.ok(!usesIban('US') && !usesIban('JP'));
		assert.equal(localScheme('US')?.system, 'USABA');
		assert.equal(localScheme('JP'), null);
		assert.equal(countryOf('in').currency, 'INR');
	});
});

describe('the default file of a country', () => {
	it('is its own standard at home, SEPA for euros from a SEPA country, else the generic ISO file', () => {
		assert.equal(defaultPaymentFormat('CH', 'CHF'), 'sps-2025');
		assert.equal(defaultPaymentFormat('CH', 'USD'), 'sps-2025');
		assert.equal(defaultPaymentFormat('DE', 'EUR'), 'sepa-2025');
		assert.equal(defaultPaymentFormat('SE', 'EUR'), 'sepa-2025');
		assert.equal(defaultPaymentFormat('SE', 'SEK'), 'iso-cgi');
		assert.equal(defaultPaymentFormat('US', 'USD'), 'iso-cgi');
		assert.equal(defaultPaymentFormat('DE', 'USD'), 'iso-cgi');
	});
});

describe('the generic ISO file', () => {
	const cgi = formatById('iso-cgi');

	it('pays accounts with and without IBANs, in their currencies', () => {
		assert.deepEqual(cgi.problems(WORLD_ORDER), []);
		const xml = cgi.write(WORLD_ORDER);
		assert.match(xml, /<Othr>\s*<Id>4400123456<\/Id>/);
		assert.match(xml, /<Cd>USABA<\/Cd>\s*<\/ClrSysId>\s*<MmbId>987654320<\/MmbId>/);
		assert.match(xml, /<MmbId>099912345<\/MmbId>/, 'the Canadian transit in its electronic form');
		assert.match(xml, /<IBAN>GB29NWBK60161331926819<\/IBAN>/);
		assert.equal((xml.match(/<PmtInf>/g) ?? []).length, 5, 'one group per currency, salaries apart');
		assert.match(xml, /<Cd>NURG<\/Cd>/);
		assert.match(xml, /<ChrgBr>SHAR<\/ChrgBr>/);
	});

	it('is read back line by line for the second signatory', () => {
		const read = readOrderFile(cgi.write(WORLD_ORDER));
		assert.equal(read.lines.length, 5);
		assert.equal(read.lines[0].iban, '4400123456');
		assert.equal(read.lines[0].bic, 'USABA 987654320');
		assert.equal(read.lines[4].iban, 'GB29NWBK60161331926819');
		assert.equal(read.account.iban, '000123456789');
	});

	it("refuses an account that does not follow its country's scheme, or a bank it cannot name", () => {
		const [us, ca] = WORLD_ORDER.lines;
		const order = (lines: typeof WORLD_ORDER.lines, debtor = WORLD_ORDER.debtor) => ({ ...WORLD_ORDER, debtor, lines });
		const messages = (o: typeof WORLD_ORDER) => cgiProblems(o).map((p) => p.message).join(' | ');
		assert.match(messages(order([{ ...us, payee: { ...us.payee, local: { ...us.payee.local!, code: '981234567' } } }])), /Routing number \(ABA\) is not valid/);
		assert.match(messages(order([{ ...ca, payee: { ...ca.payee, local: { ...ca.payee.local!, system: 'USABA' } } }])), /needs the Transit and institution/);
		assert.match(messages(order([{ ...us, payee: { ...us.payee, address: { town: 'Tokyo', country: 'JP' }, local: { number: '1234567' } } }])), /BIC is needed/);
		assert.match(messages(order([us], { ...WORLD_ORDER.debtor, iban: 'CH9300762011623852957', local: undefined, address: { town: 'Bern', country: 'CH' } })), /paying account's bank needs its BIC/);
	});

	it('is not how SEPA or Swiss files pay an account without IBAN', () => {
		const sepa = formatById('sepa-2025').problems({ ...WORLD_ORDER, lines: [WORLD_ORDER.lines[0]] }).map((p) => p.message);
		assert.ok(sepa.some((m) => /SEPA country/.test(m)));
	});
});
