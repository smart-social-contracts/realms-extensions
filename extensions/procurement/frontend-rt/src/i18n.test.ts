import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const LOCALES = new URL('../../frontend/i18n/locales/extensions/procurement/', import.meta.url);
const SOURCES = ['Procurement.svelte', 'Contracts.svelte', 'ContractPage.svelte', 'AmendmentForm.svelte', 'contracts.ts', 'lots.ts'];
const WANTED = ['en', 'es', 'ca-valencia', 'de', 'fr', 'it', 'zh-CN'];

const words = (locale: string): Record<string, string> => JSON.parse(readFileSync(new URL(`${locale}.json`, LOCALES), 'utf8'));
const holes = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
const code = SOURCES.map((name) => readFileSync(new URL(name, import.meta.url), 'utf8')).join('\n');

describe('the translations of the procurement screens', () => {
	const english = words('en');

	it('exist in the seven languages and nothing else', () => {
		assert.deepEqual(readdirSync(LOCALES).sort(), WANTED.map((locale) => `${locale}.json`).sort());
	});

	for (const locale of WANTED.filter((locale) => locale !== 'en')) {
		it(`${locale} has every text of the English, with the same placeholders`, () => {
			const own = words(locale);
			assert.deepEqual(Object.keys(own), Object.keys(english));
			for (const key of Object.keys(english)) {
				assert.ok(own[key].trim(), `${locale}: ${key} is empty`);
				assert.deepEqual(holes(own[key]), holes(english[key]), `${locale}: ${key} has other placeholders`);
			}
		});
	}

	it('hold every text the screens ask for', () => {
		const asked = [...code.matchAll(/\bt\('([a-z_]+)'/g)].map((match) => match[1]);
		assert.deepEqual(asked.filter((key) => !(key in english)), []);
	});

	it('hold no text the screens do not use', () => {
		// A text chosen by a variable (a status, a term) is named by its prefix in a template literal.
		const families = [...code.matchAll(/\bt\(`([a-z_]+_)\$\{/g)].map((match) => match[1]);
		const unused = Object.keys(english).filter(
			(key) => !code.includes(`'${key}'`) && !families.some((family) => key.startsWith(family)),
		);
		assert.deepEqual(unused, []);
	});
});
