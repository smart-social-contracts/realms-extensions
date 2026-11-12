import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JOURNAL_SIGNING, journalSigningOf } from './journalSigning.ts';

const LOCALES = new URL('../../frontend/i18n/locales/extensions/realm_settings/', import.meta.url);
const LANGUAGES = ['en', 'es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia'];
const words = (locale: string): Record<string, string> => JSON.parse(readFileSync(new URL(`${locale}.json`, LOCALES), 'utf8'));

test('the setting is the realm\'s word when it is a mode, and on request when the realm says nothing or something else', () => {
	assert.equal(journalSigningOf('daily'), 'daily');
	assert.equal(journalSigningOf('on_request'), 'on_request');
	for (const unknown of [undefined, null, '', 'yearly', 1, true]) assert.equal(journalSigningOf(unknown), 'on_request');
});

test('every language says what the setting is and what each mode costs, in words of its own', () => {
	const english = words('en');
	const keys = [
		'section_journal_signing',
		'section_journal_signing_desc',
		'journal_signing',
		'journal_signing_applies_now',
		'journal_signing_needs_vote',
		...JOURNAL_SIGNING.flatMap((mode) => [`journal_signing_${mode}`, `journal_signing_${mode}_note`]),
	];
	for (const locale of LANGUAGES) {
		const said = words(locale);
		for (const key of keys) {
			assert.ok(said[key], `${locale}: ${key} is missing`);
			if (locale !== 'en') assert.notEqual(said[key], english[key], `${locale}: ${key} is not translated`);
		}
		assert.match(said.journal_signing_needs_vote, /\{department\}.*\{policy\}/, `${locale}: the vote text names the department and the policy`);
	}
});
