import assert from 'node:assert/strict';
import { it } from 'node:test';
import { formatById } from './formats.ts';
import { readPain001 } from './review.ts';
import { SEPA_ORDER, SWISS_ORDER } from './samples.ts';

it('reads back every payment of a written file, as the bank will see it', () => {
	const summary = readPain001(formatById('sps-2025').write(SWISS_ORDER));
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
	const summary = readPain001(formatById('sepa-2025').write(SEPA_ORDER));
	assert.equal(summary.lines[0].name, 'Zoe Exemple-Lefevre');
	assert.equal(summary.lines[2].name, 'Voorbeeld + Zonen B.V.');
});
