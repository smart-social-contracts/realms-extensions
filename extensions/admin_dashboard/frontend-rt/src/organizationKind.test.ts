import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { KINDS, kindOf, kindText } from './organizationKind.ts';

const LOCALES = '../../frontend/i18n/locales/extensions/admin_dashboard';
const strings = (locale: string): Record<string, string> =>
	JSON.parse(readFileSync(new URL(`${LOCALES}/${locale}.json`, import.meta.url), 'utf8'));
const translator = (locale: string) => {
	const dict = { ...strings('en'), ...strings(locale) };
	return (key: string) => dict[key] ?? key;
};

describe('kindOf', () => {
	it('reads the kind a row states', () => {
		assert.equal(kindOf({ id: 'Harbour Party', kind: 'party' }), 'party');
		assert.equal(kindOf({ kind: ' union ' }), 'union');
	});

	it('reads none for a row that states none', () => {
		for (const row of [{}, { kind: null }, { kind: '' }, { kind: 4 }, null, undefined]) assert.equal(kindOf(row), '', JSON.stringify(row));
	});
});

describe('kindText', () => {
	const english = translator('en');

	it('names each of the five kinds', () => {
		assert.deepEqual(
			KINDS.map((kind) => kindText(kind, english)),
			['Company', 'Party', 'Union', 'Association', 'Other'],
		);
	});

	it('reads a row without a kind as unknown, which is not "other"', () => {
		assert.equal(kindText('', english), 'Unknown');
		assert.notEqual(kindText('', english), kindText('other', english));
	});

	it('shows a word the page does not know as it is', () => {
		assert.equal(kindText('cooperative', english), 'cooperative');
	});
});

describe('the strings in every language', () => {
	const english = strings('en');
	const locales = ['es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia'];
	const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

	it('have the keys and the placeholders of English', () => {
		for (const locale of locales) {
			const other = strings(locale);
			assert.deepEqual(Object.keys(other).sort(), Object.keys(english).sort(), locale);
			for (const key of Object.keys(english)) {
				assert.deepEqual(placeholders(other[key]), placeholders(english[key]), `${locale} ${key}`);
			}
		}
	});

	it('name every kind in every language, each differently', () => {
		for (const locale of ['en', ...locales]) {
			const names = [...KINDS, ''].map((kind) => kindText(kind, translator(locale)));
			assert.equal(new Set(names).size, names.length, `${locale}: ${names}`);
			for (const name of names) assert.ok(name && !/[{}]/.test(name) && !name.startsWith('org_kind_'), `${locale}: ${name}`);
		}
	});
});
