import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import { collectionFormatById, formatById } from './formats.ts';
import { motionOfFile } from './realm.ts';
import type { Doc, Register } from './realm.ts';
import { SEPA_DD_ORDER, SWISS_ORDER } from './samples.ts';
import { checkFile, committedAs, factsOfFile } from './upload.ts';

// The sample order, written by the Banking extension's SPS writer, stands in for a file an ERP made.
const file = formatById('sps-2025').write(SWISS_ORDER);
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const register: Register = { account: SWISS_ORDER.debtor, payees: [] };
const doc = (id: string, facts: Record<string, unknown>): Doc => ({ id, kind: 'banking.order', at: 1, author: '', facts });

describe('a file from the ERP', () => {
	it('passes the checks and gives the facts the realm keeps: ids, amounts and groups only', () => {
		const check = checkFile(file, register, [], sha(file));
		assert.deepEqual([check.problems, check.warnings], [[], []]);
		assert.equal(check.message, 'pain.001.001.09');
		const facts = factsOfFile(check, sha(file));
		assert.equal(facts.source, 'erp');
		assert.equal(facts.kind, 'payment');
		assert.deepEqual(facts.lines[0], ['BK-20261124-0001-01', 420000, 'CHF', 'BK-20261124-0001-1', '', true]);
		assert.ok(!JSON.stringify(facts).includes('Ada'), 'no name in the facts');
	});

	it('reads a direct debit file the same way', () => {
		const dd = collectionFormatById('sepa-dd-2025').write(SEPA_DD_ORDER);
		const check = checkFile(dd, null, [], sha(dd));
		assert.deepEqual(check.problems, []);
		assert.equal(factsOfFile(check, sha(dd)).kind, 'collection');
		assert.equal(check.message, 'pain.008.001.08');
	});

	it('stops a file whose sum, count or IBAN is wrong, or that the bank has seen', () => {
		const cases: [string, Doc[], RegExp][] = [
			[file.replace('<CtrlSum>12650.4</CtrlSum>', '<CtrlSum>12650.5</CtrlSum>'), [], /control sum 12650.5 is not the sum/],
			[file.replace('<NbOfTxs>6</NbOfTxs>', '<NbOfTxs>7</NbOfTxs>'), [], /says 7 payments but holds 6/],
			[file.replace('CH5604835012345678009', 'CH5604835012345678008'), [], /Ada Example's IBAN: the check digits/],
			[file, [doc('DOC-4', { message_id: 'BK-20261124-0001', file_sha256: 'other' })], /already DOC-4: a bank refuses a message id twice/],
			[file, [doc('DOC-5', { message_id: 'X', file_sha256: sha(file) })], /This exact file is already DOC-5/],
			['<Document><Other/></Document>', [], /not a pain.001 or pain.008/],
		];
		for (const [text, orders, message] of cases) {
			const problems = checkFile(text, register, orders, sha(text)).problems;
			assert.ok(problems.some((p) => message.test(p.message)), `${message}: ${JSON.stringify(problems)}`);
		}
	});

	it("refuses a known payee paid to another IBAN, and only counts payees the register doesn't know", () => {
		const known: Register = { account: SWISS_ORDER.debtor, payees: [{ id: 'P1', name: 'Ada Example', iban: 'CH58 0079 1123 0008 8901 2' }] };
		const check = checkFile(file, known, [], sha(file));
		assert.ok(check.problems.some((p) => /Ada Example is in the realm's register with IBAN CH5800791123000889012, but the file pays CH5604835012345678009/.test(p.message)));
		const same: Register = { account: SWISS_ORDER.debtor, payees: [{ id: 'P1', name: 'ada  example', iban: 'CH5604835012345678009' }] };
		const ok = checkFile(file, same, [], sha(file));
		assert.deepEqual([ok.problems, ok.known], [[], 1]);
		assert.equal(checkFile(file, register, [], sha(file)).known, 0, 'payees only in the ERP are no problem');
	});

	it("warns when the file pays from another account than the realm's", () => {
		const other: Register = { account: { ...SWISS_ORDER.debtor, iban: 'CH5800791123000889012' }, payees: [] };
		assert.match(checkFile(file, other, [], sha(file)).warnings[0], /not the realm's account in the register/);
	});

	it('finds the committed order a file is, by its hash', () => {
		const orders = [doc('DOC-7', { file_sha256: sha(file) })];
		assert.equal(committedAs(orders, sha(file))?.id, 'DOC-7');
		assert.equal(committedAs(orders, sha(file + ' ')), undefined);
	});

	it('puts ids, amounts and the hash to the vote, never a name or an IBAN', () => {
		const facts = factsOfFile(checkFile(file, register, [], sha(file)), sha(file));
		const { title, description } = motionOfFile(facts);
		assert.equal(title, 'Approve payment file BK-20261124-0001: 6 payments, CHF 9,300.50 + EUR 2,599.90 + USD 750.00');
		assert.match(description, new RegExp(`sha256 is ${sha(file)}`));
		for (const personal of ['Ada', 'CH56', 'Printing']) assert.ok(!description.includes(personal), personal);
	});
});
