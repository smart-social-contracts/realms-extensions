import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	HOST_LANGUAGE_CATALOG,
	addRealmLanguage,
	emptyRealmLanguages,
	languageLabel,
	localesAvailableToAdd,
	parseRealmLanguages,
	realmLanguagesConfig,
	removeRealmLanguage,
	setPrimaryLanguage,
	validateRealmLanguages,
} from './languages.ts';

describe('host catalog', () => {
	it('includes the host packs plus Valencià, and no Catalan pack', () => {
		const ids = HOST_LANGUAGE_CATALOG.map((l) => l.id);
		assert.deepEqual(ids, ['en', 'es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia']);
		assert.equal(languageLabel('ca-valencia'), 'Valencià');
		assert.ok(!ids.includes('ca'));
		assert.ok(!HOST_LANGUAGE_CATALOG.some((l) => /catal/i.test(l.name)));
	});
});

describe('parseRealmLanguages', () => {
	it('uses empty defaults when the host fields are missing', () => {
		assert.deepEqual(parseRealmLanguages(undefined), emptyRealmLanguages());
		assert.deepEqual(parseRealmLanguages({}), emptyRealmLanguages());
		assert.deepEqual(parseRealmLanguages({ name: 'Realm' }), emptyRealmLanguages());
	});

	it('reads languages + primary_language from the host payload', () => {
		assert.deepEqual(
			parseRealmLanguages({
				languages: ['es', 'ca-valencia', 'en'],
				primary_language: 'ca-valencia',
			}),
			{ languages: ['es', 'ca-valencia', 'en'], primary_language: 'ca-valencia' },
		);
	});

	it('accepts comma-separated host strings and camelCase aliases', () => {
		assert.deepEqual(
			parseRealmLanguages({ languages: 'en, es', primaryLanguage: 'es' }),
			{ languages: ['en', 'es'], primary_language: 'es' },
		);
	});

	it('drops unknown locales and keeps primary in the remaining list', () => {
		assert.deepEqual(
			parseRealmLanguages({
				languages: ['en', 'ca', 'Català', 'es'],
				primary_language: 'ca',
			}),
			{ languages: ['en', 'es'], primary_language: 'en' },
		);
	});
});

describe('primary ∈ list', () => {
	it('rejects a primary that is not enabled', () => {
		const missing = validateRealmLanguages({
			languages: ['en', 'es'],
			primary_language: 'fr',
		});
		assert.equal(missing.ok, false);
		if (!missing.ok) {
			assert.match(missing.error, /primary language must stay in the enabled list/i);
		}

		const emptyList = validateRealmLanguages({
			languages: [],
			primary_language: 'en',
		});
		assert.equal(emptyList.ok, false);
	});

	it('accepts empty defaults and a primary that is in the list', () => {
		assert.equal(validateRealmLanguages(emptyRealmLanguages()).ok, true);
		assert.equal(
			validateRealmLanguages({ languages: ['en', 'ca-valencia'], primary_language: 'ca-valencia' }).ok,
			true,
		);
	});

	it('cannot set primary to a locale outside the enabled list', () => {
		const result = setPrimaryLanguage(
			{ languages: ['en', 'es'], primary_language: 'en' },
			'de',
		);
		assert.equal(result.ok, false);
		if (!result.ok) {
			assert.match(result.error, /primary language must stay in the enabled list/i);
		}
	});

	it('cannot remove the primary while other locales remain', () => {
		const result = removeRealmLanguage(
			{ languages: ['en', 'es'], primary_language: 'en' },
			'en',
		);
		assert.equal(result.ok, false);
		if (!result.ok) {
			assert.match(result.error, /set a different primary/i);
		}
	});

	it('clears primary when the last enabled locale is removed', () => {
		const result = removeRealmLanguage(
			{ languages: ['en'], primary_language: 'en' },
			'en',
		);
		assert.deepEqual(result, { ok: true, state: emptyRealmLanguages() });
	});
});

describe('add / remove / config', () => {
	it('makes the first added locale the primary', () => {
		const first = addRealmLanguage(emptyRealmLanguages(), 'ca-valencia');
		assert.deepEqual(first, {
			ok: true,
			state: { languages: ['ca-valencia'], primary_language: 'ca-valencia' },
		});
		const second = addRealmLanguage(first.ok ? first.state : emptyRealmLanguages(), 'en');
		assert.deepEqual(second, {
			ok: true,
			state: { languages: ['ca-valencia', 'en'], primary_language: 'ca-valencia' },
		});
	});

	it('rejects locales outside the host catalog', () => {
		const result = addRealmLanguage(emptyRealmLanguages(), 'ca');
		assert.equal(result.ok, false);
	});

	it('serializes the host update_realm_config field names', () => {
		const state = { languages: ['en', 'es'], primary_language: 'es' };
		assert.deepEqual(realmLanguagesConfig(state), {
			languages: ['en', 'es'],
			primary_language: 'es',
		});
		assert.throws(
			() => realmLanguagesConfig({ languages: ['en'], primary_language: 'es' }),
			/primary language must stay in the enabled list/i,
		);
	});

	it('lists remaining catalog locales for the add control', () => {
		const left = localesAvailableToAdd(['en', 'ca-valencia']).map((l) => l.id);
		assert.deepEqual(left, ['es', 'de', 'fr', 'it', 'zh-CN']);
	});
});
