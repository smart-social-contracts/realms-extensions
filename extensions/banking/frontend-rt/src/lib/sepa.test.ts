import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatById } from './formats.ts';
import { SEPA_ORDER, SWISS_ORDER } from './samples.ts';
import { sepaText } from './sepa.ts';
import { find, findAll, parse, textAt } from './xml.ts';

const sepa = formatById('sepa-2025');

describe('sepaText', () => {
	it("converts names to the EPC's basic Latin set", () => {
		assert.equal(sepaText('Zoë Exemple-Lefèvre'), 'Zoe Exemple-Lefevre');
		assert.equal(sepaText('Jürgen Muster'), 'Jurgen Muster');
		assert.equal(sepaText('Straße & Söhne'), 'Strasse + Sohne');
		assert.equal(sepaText('Ада'), '');
	});
});

describe('the SEPA file', () => {
	it('has no problems for the sample and is the same bytes every time', () => {
		assert.deepEqual(sepa.problems(SEPA_ORDER), []);
		assert.equal(sepa.write(SEPA_ORDER), sepa.write(structuredClone(SEPA_ORDER)));
	});

	it('says SEPA and SLEV on every group, SALA on the salaries, and writes the converted names', () => {
		const doc = parse(sepa.write(SEPA_ORDER));
		const groups = findAll(doc, 'CstmrCdtTrfInitn/PmtInf');
		assert.deepEqual(groups.map((g) => textAt(g, 'PmtTpInf/SvcLvl/Cd')), ['SEPA', 'SEPA']);
		assert.deepEqual(groups.map((g) => textAt(g, 'ChrgBr')), ['SLEV', 'SLEV']);
		assert.deepEqual(groups.map((g) => textAt(g, 'PmtTpInf/CtgyPurp/Cd')), ['SALA', '']);
		assert.equal(textAt(find(groups[0], 'CdtTrfTxInf'), 'Cdtr/Nm'), 'Zoe Exemple-Lefevre');
		assert.equal(textAt(groups[0], 'DbtrAgt/FinInstnId/Othr/Id'), 'NOTPROVIDED');
		assert.equal(textAt(find(groups[1], 'CdtTrfTxInf'), 'CdtrAgt/FinInstnId/BICFI'), 'ABNANL2A');
	});
});

describe('SEPA problems', () => {
	it('refuses what is not a SEPA credit transfer', () => {
		const messages = sepa.problems(SWISS_ORDER).map((p) => p.message);
		assert.ok(messages.includes('A SEPA credit transfer is in EUR'));
		assert.ok(messages.includes('A SEPA payment cannot carry a QR reference'));
		const usd = { ...SEPA_ORDER, lines: [{ ...SEPA_ORDER.lines[0], payee: { ...SEPA_ORDER.lines[0].payee, iban: 'AE070331234567890123456' } }] };
		assert.ok(sepa.problems(usd).some((p) => /not in a SEPA country/.test(p.message)));
		const both = { ...SEPA_ORDER, lines: [{ ...SEPA_ORDER.lines[2], note: 'and a note' }] };
		assert.ok(sepa.problems(both).some((p) => /either a creditor reference or a note/.test(p.message)));
	});
});
