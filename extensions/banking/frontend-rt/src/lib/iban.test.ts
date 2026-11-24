import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ibanProblem, isQrIban, printIban } from './iban.ts';

describe('ibanProblem', () => {
	it('accepts the published example IBANs, with or without spaces', () => {
		for (const iban of ['CH93 0076 2011 6238 5295 7', 'DE89370400440532013000', 'GB29NWBK60161331926819', 'fr1420041010050500013m02606']) {
			assert.equal(ibanProblem(iban), null, iban);
		}
	});

	it('refuses a mistyped character, a wrong length and an unknown country', () => {
		assert.match(ibanProblem('CH9300762011623852958')!, /check digits/);
		assert.match(ibanProblem('CH930076201162385295')!, /21 characters/);
		assert.match(ibanProblem('US12345678')!, /not a country/);
		assert.match(ibanProblem('not an iban')!, /two letters/);
	});
});

describe('isQrIban', () => {
	it('knows a QR-IBAN by its institution id 30000-31999', () => {
		assert.equal(isQrIban('CH4431999123000889012'), true);
		assert.equal(isQrIban('CH9300762011623852957'), false);
		assert.equal(isQrIban('DE89370400440532013000'), false);
	});
});

it('prints an IBAN in groups of four', () => {
	assert.equal(printIban('CH9300762011623852957'), 'CH93 0076 2011 6238 5295 7');
});
