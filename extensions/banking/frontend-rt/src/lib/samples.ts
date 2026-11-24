// Sample orders for the tests and the schema check. Every IBAN here is a published documentation example (SIX's
// implementation guidelines and QR-bill samples, the SWIFT IBAN registry) or, for PostFinance, made so that it cannot
// be a real account (below), and every name and address is made up: no real person's or company's bank details.

import type { CollectionOrder } from './collection.ts';
import { invoiceReference } from './references.ts';
import type { PaymentOrder } from './order.ts';

const SOFTWARE = { name: 'Realms Banking', version: '0.1.0' };

/** A Swiss realm paying every SPS payment type: domestic CHF and EUR, a QR-bill, SEPA, abroad, and salaries. */
export const SWISS_ORDER: PaymentOrder = {
	messageId: 'BK-20261124-0001',
	createdAt: '2026-11-24T13:05:00+00:00',
	executionDate: '2026-11-27',
	software: SOFTWARE,
	debtor: {
		name: 'Example Realm Association',
		iban: 'CH93 0076 2011 6238 5295 7',
		address: { street: 'Musterstrasse', building: '1', postCode: '3000', town: 'Bern', country: 'CH' },
	},
	lines: [
		{
			id: 'BK-20261124-0001-01',
			payee: {
				name: 'Ada Example',
				iban: 'CH5604835012345678009',
				address: { street: 'Beispielweg', building: '7', postCode: '8000', town: 'Zürich', country: 'CH' },
			},
			amount: 420_000,
			currency: 'CHF',
			salary: true,
			note: 'Salary November 2026',
		},
		{
			id: 'BK-20261124-0001-02',
			payee: { name: 'Bruno Sample', iban: 'CH5800791123000889012', address: { town: 'Basel', country: 'CH' } },
			amount: 385_050,
			currency: 'CHF',
			salary: true,
			note: 'Salary November 2026',
		},
		{
			id: 'BK-20261124-0001-03',
			payee: {
				name: 'Example Printing Ltd',
				iban: 'CH44 3199 9123 0008 8901 2',
				address: { street: 'Industrieweg', building: '12', postCode: '2500', town: 'Biel/Bienne', country: 'CH' },
			},
			amount: 125_000,
			currency: 'CHF',
			// The QR reference of SIX's QR-bill sample.
			reference: { kind: 'QRR', value: '21 00000 00003 13947 14300 09017' },
		},
		{
			id: 'BK-20261124-0001-04',
			payee: { name: 'Café Exemple Sàrl', iban: 'CH9300762011623852957', address: { town: 'Lausanne', country: 'CH' } },
			amount: 9_990,
			currency: 'EUR',
			reference: { kind: 'SCOR', value: 'RF18 5390 0754 7034' },
		},
		{
			id: 'BK-20261124-0001-05',
			payee: {
				name: 'Beispiel Verlag GmbH',
				iban: 'DE89 3704 0044 0532 0130 00',
				address: { street: 'Beispielstraße', building: '3', postCode: '10115', town: 'Berlin', country: 'DE' },
			},
			amount: 250_000,
			currency: 'EUR',
			note: 'Invoice 2026-118',
		},
		{
			id: 'BK-20261124-0001-06',
			payee: {
				name: 'Example Consulting Ltd',
				iban: 'GB29 NWBK 6016 1331 9268 19',
				bic: 'NWBKGB2L',
				address: { street: 'Example Road', building: '5', postCode: 'EC1A 1BB', town: 'London', country: 'GB' },
			},
			amount: 75_000,
			currency: 'USD',
			note: 'Advisory fee Q4',
		},
	],
};

/** A realm in the euro area paying suppliers and two salaries by SEPA. */
export const SEPA_ORDER: PaymentOrder = {
	messageId: 'BK-20261124-0002',
	createdAt: '2026-11-24T13:10:00+00:00',
	executionDate: '2026-11-27',
	software: SOFTWARE,
	debtor: {
		name: 'Example Realm e.V.',
		iban: 'DE89370400440532013000',
		address: { town: 'Berlin', country: 'DE' },
	},
	lines: [
		{
			id: 'BK-20261124-0002-01',
			payee: { name: 'Zoë Exemple-Lefèvre', iban: 'FR1420041010050500013M02606', address: { town: 'Paris', country: 'FR' } },
			amount: 310_000,
			currency: 'EUR',
			salary: true,
			note: 'Salary November 2026',
		},
		{
			id: 'BK-20261124-0002-02',
			payee: { name: 'Jürgen Muster', iban: 'AT611904300234573201', address: { town: 'Wien', country: 'AT' } },
			amount: 295_000,
			currency: 'EUR',
			salary: true,
			note: 'Salary November 2026',
		},
		{
			id: 'BK-20261124-0002-03',
			payee: { name: 'Voorbeeld & Zonen B.V.', iban: 'NL91ABNA0417164300', bic: 'ABNANL2A', address: { town: 'Utrecht', country: 'NL' } },
			amount: 48_015,
			currency: 'EUR',
			reference: { kind: 'SCOR', value: 'RF18539007547034' },
		},
	],
};

/** A realm in the euro area collecting two fees by SEPA direct debit. DE98ZZZ09999999999 is the Bundesbank's
 * published test creditor identifier. */
export const SEPA_DD_ORDER: CollectionOrder = {
	messageId: 'BK-20261124-0003',
	createdAt: '2026-11-24T13:20:00+00:00',
	collectionDate: '2026-12-04',
	software: SOFTWARE,
	creditor: { name: 'Example Realm e.V.', iban: 'DE89370400440532013000', address: { town: 'Berlin', country: 'DE' } },
	creditorId: 'DE98ZZZ09999999999',
	lines: [
		{
			id: 'BK-20261124-0003-01',
			payer: { name: 'Zoë Exemple-Lefèvre', iban: 'FR1420041010050500013M02606', address: { town: 'Paris', country: 'FR' },
				mandate: { id: 'REALM-MANDATE-0001', signedOn: '2026-01-15' } },
			amount: 12_000,
			currency: 'EUR',
			sequence: 'RCUR',
			reference: { kind: 'SCOR', value: invoiceReference('INV-21') },
		},
		{
			id: 'BK-20261124-0003-02',
			payer: { name: 'Jürgen Muster', iban: 'AT611904300234573201', address: { town: 'Wien', country: 'AT' },
				mandate: { id: 'REALM-MANDATE-0002', signedOn: '2026-11-02' } },
			amount: 4_550,
			currency: 'EUR',
			sequence: 'OOFF',
			note: 'Residence fee 2026',
		},
	],
};

/** A Swiss realm collecting by PostFinance's CH-DD. PostFinance IBANs carry a postal account whose last digit checks
 * the others (modulo 10, recursive); these carry a wrong one on purpose (99-000011-3, 99-000022-2, 99-000033-6), so
 * they pass the IBAN check but are no account anyone holds. The RS-PID is made up, with valid check digits. */
export const CHDD_ORDER: CollectionOrder = {
	messageId: 'BK-20261124-0004',
	createdAt: '2026-11-24T13:25:00+00:00',
	collectionDate: '2026-12-04',
	software: SOFTWARE,
	creditor: { name: 'Example Realm Association', iban: 'CH8509000000990000113', address: { town: 'Bern', country: 'CH' } },
	creditorId: '41100123450000007',
	lines: [
		{
			id: 'BK-20261124-0004-01',
			payer: { name: 'Ada Example', iban: 'CH5209000000990000222', address: { street: 'Beispielweg', building: '7', postCode: '8000', town: 'Zürich', country: 'CH' } },
			amount: 15_000,
			currency: 'CHF',
			sequence: 'RCUR',
			reference: { kind: 'SCOR', value: invoiceReference('INV-31') },
		},
		{
			id: 'BK-20261124-0004-02',
			payer: { name: 'Bruno Sample', iban: 'CH7809000000990000336', address: { town: 'Basel', country: 'CH' } },
			amount: 8_000,
			currency: 'CHF',
			sequence: 'OOFF',
			note: 'Waste fee 2026',
		},
	],
};
