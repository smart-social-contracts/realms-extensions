import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const SRC = dirname(fileURLToPath(import.meta.url));
const LOCALES = join(SRC, '..', '..', 'frontend', 'i18n', 'locales', 'extensions', 'budget_manager');
const LANGUAGES = ['en', 'es', 'ca-valencia', 'de', 'fr', 'it', 'zh-CN'];

const load = (locale: string): Record<string, string> => JSON.parse(readFileSync(join(LOCALES, `${locale}.json`), 'utf8'));
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('the translations', () => {
	const english = load('en');

	it('exist in the seven languages the realms speak, and in no other', () => {
		assert.deepEqual(readdirSync(LOCALES).sort(), LANGUAGES.map((l) => `${l}.json`).sort());
	});

	for (const locale of LANGUAGES.filter((l) => l !== 'en')) {
		it(`of ${locale} have the keys of English and its placeholders, and no text left empty`, () => {
			const own = load(locale);
			assert.deepEqual(Object.keys(own).sort(), Object.keys(english).sort());
			for (const [key, text] of Object.entries(own)) {
				assert.ok(text.trim(), `${locale}.${key} is empty`);
				assert.deepEqual(placeholders(text), placeholders(english[key]), `${locale}.${key}`);
			}
		});
	}

	it('are the texts the page asks for: every key it asks for exists, and every key is asked for', () => {
		const sources = readdirSync(SRC)
			.filter((file) => (file.endsWith('.svelte') || file.endsWith('.ts')) && !file.endsWith('.test.ts'))
			.map((file) => readFileSync(join(SRC, file), 'utf8'))
			.join('\n');
		const asked = new Set([...sources.matchAll(/\bt\('([a-z_]+)'/g)].map((m) => m[1]));
		assert.deepEqual([...asked].filter((key) => !(key in english)), [], 'asked for, not in English');
		assert.deepEqual(Object.keys(english).filter((key) => !asked.has(key)), [], 'in English, never asked for');
	});
});
