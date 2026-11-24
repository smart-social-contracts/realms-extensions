// Reading the sample camt.053 and camt.054 (tests/fixtures) and matching them against the sample Swiss order.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { parseStatements } from './camt.ts';
import { formatById, sentBatch } from './formats.ts';
import { matchStatement, reportOf } from './match.ts';
import { SWISS_ORDER } from './samples.ts';

const fixture = (name: string) => readFileSync(new URL(`../../../tests/fixtures/${name}`, import.meta.url), 'utf8');
const sent = [sentBatch(SWISS_ORDER, formatById('sps-2025'))];

describe('camt.053', () => {
	const [statement] = parseStatements(fixture('camt053-sample.xml'));

	it('reads the account and every entry', () => {
		assert.equal(statement.kind, 'camt.053');
		assert.equal(statement.account.iban, 'CH9300762011623852957');
		assert.deepEqual(statement.entries.map((e) => [e.direction, e.amount]), [['out', 805050], ['out', 125000], ['in', 15000], ['in', 4200]]);
		assert.deepEqual(statement.entries[0].batch, { messageId: 'BK-20261124-0001', paymentGroupId: 'BK-20261124-0001-1', count: 2 });
	});

	it('matches the salary group as one booking, the QR-bill payment by its id, an invoice by its QR reference', () => {
		const matches = matchStatement(statement, sent);
		assert.deepEqual(matches.map((m) => m.kind), ['group_booked', 'paid', 'incoming', 'review']);
		const group = matches[0];
		assert.ok(group.kind === 'group_booked');
		assert.deepEqual(group.lines, ['BK-20261124-0001-01', 'BK-20261124-0001-02']);
		assert.ok(matches[1].kind === 'paid' && matches[1].line === 'BK-20261124-0001-03');
		assert.ok(matches[2].kind === 'incoming' && matches[2].invoice === 'INV-12');
		assert.ok(matches[3].kind === 'review' && matches[3].reason === 'a payment without a reference');
	});

	it("keeps no name or account in the realm's record of the import", () => {
		const report = JSON.stringify(reportOf(statement, matchStatement(statement, sent)));
		for (const personal of ['Clara', 'Dario', 'Printing', 'CH5604835012345678009', 'festival']) {
			assert.ok(!report.includes(personal), personal);
		}
		assert.match(report, /"to_review":1/);
	});

	it('puts a group whose total differs on the review list', () => {
		const short = [{ ...sent[0], lines: sent[0].lines.map((l, i) => (i === 0 ? { ...l, amount: l.amount + 1 } : l)) }];
		const matches = matchStatement(statement, short);
		assert.ok(matches[0].kind === 'review' && /different total/.test(matches[0].reason));
	});
});

describe('camt.054', () => {
	const [notification] = parseStatements(fixture('camt054-sample.xml'));

	it('matches a payment by its ordered EUR amount, a returned payment, and an invoice by its RF reference', () => {
		const matches = matchStatement(notification, sent);
		assert.deepEqual(matches.map((m) => m.kind), ['paid', 'returned', 'incoming']);
		assert.ok(matches[0].kind === 'paid' && matches[0].currency === 'EUR' && matches[0].amount === 250000);
		assert.ok(matches[1].kind === 'returned' && matches[1].line === 'BK-20261124-0001-06');
		assert.ok(matches[2].kind === 'incoming' && matches[2].invoice === 'INV-7');
	});
});

it('refuses a file that is no statement', () => {
	assert.throws(() => parseStatements('<Document><CstmrCdtTrfInitn/></Document>'), /not a camt/);
});
