import assert from 'node:assert/strict';
import { it } from 'node:test';
import { collectionFormatById, formatById } from './formats.ts';
import { readOrderFile } from './review.ts';
import { CHDD_ORDER, SEPA_DD_ORDER, SEPA_ORDER, SWISS_ORDER } from './samples.ts';

it('reads back every payment of a written file, as the bank will see it', () => {
	const summary = readOrderFile(formatById('sps-2025').write(SWISS_ORDER));
	assert.equal(summary.messageId, 'BK-20261124-0001');
	assert.equal(summary.count, 6);
	assert.deepEqual(summary.lines.map((l) => [l.id, l.amount, l.currency, l.salary]).slice(0, 2), [
		['BK-20261124-0001-01', '4200.00', 'CHF', true],
		['BK-20261124-0001-02', '3850.50', 'CHF', true],
	]);
	assert.equal(summary.lines[2].reference, '210000000003139471430009017');
	assert.equal(summary.lines[4].sepa, true);
});

it('shows the names a SEPA file carries after conversion', () => {
	const summary = readOrderFile(formatById('sepa-2025').write(SEPA_ORDER));
	assert.equal(summary.lines[0].name, 'Zoe Exemple-Lefevre');
	assert.equal(summary.lines[2].name, 'Voorbeeld + Zonen B.V.');
});

it('reads back whom a collection debits, under which mandate, and the account it collects into', () => {
	const sepa = readOrderFile(collectionFormatById('sepa-dd-2025').write(SEPA_DD_ORDER));
	assert.equal(sepa.kind, 'collection');
	assert.equal(sepa.account.iban, 'DE89370400440532013000');
	assert.deepEqual(sepa.lines.map((l) => [l.name, l.amount, l.mandate, l.sequence, l.executionDate]), [
		['Zoe Exemple-Lefevre', '120.00', 'REALM-MANDATE-0001', 'RCUR', '2026-12-04'],
		['Jurgen Muster', '45.50', 'REALM-MANDATE-0002', 'OOFF', '2026-12-04'],
	]);
	const chdd = readOrderFile(collectionFormatById('ch-dd').write(CHDD_ORDER));
	assert.deepEqual(chdd.lines.map((l) => [l.iban, l.amount, l.currency]), [['CH5209000000990000222', '150.00', 'CHF'], ['CH7809000000990000336', '80.00', 'CHF']]);
});
