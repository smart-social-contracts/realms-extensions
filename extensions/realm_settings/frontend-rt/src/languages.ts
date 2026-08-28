/** Realm language list + primary (companion to realms #361 / issue #25). */

export const HOST_LANGUAGE_CATALOG = [
	{ id: 'en', name: 'English' },
	{ id: 'es', name: 'Español' },
	{ id: 'de', name: 'Deutsch' },
	{ id: 'fr', name: 'Français' },
	{ id: 'it', name: 'Italiano' },
	{ id: 'zh-CN', name: '中文 (简体)' },
	{ id: 'ca-valencia', name: 'Valencià' },
] as const;

export type HostLocaleId = (typeof HOST_LANGUAGE_CATALOG)[number]['id'];

export type RealmLanguages = {
	languages: string[];
	primary_language: string;
};

export type LanguageResult =
	| { ok: true; state: RealmLanguages }
	| { ok: false; error: string };

const CATALOG_IDS = new Set<string>(HOST_LANGUAGE_CATALOG.map((l) => l.id));
const CATALOG_LABELS = new Map<string, string>(
	HOST_LANGUAGE_CATALOG.map((l) => [l.id, l.name]),
);

export function isHostLocale(id: string): id is HostLocaleId {
	return CATALOG_IDS.has(id);
}

export function languageLabel(id: string): string {
	return CATALOG_LABELS.get(id) ?? id;
}

export function localesAvailableToAdd(enabled: readonly string[]): typeof HOST_LANGUAGE_CATALOG[number][] {
	const have = new Set(enabled);
	return HOST_LANGUAGE_CATALOG.filter((l) => !have.has(l.id));
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function tokenizeLocales(value: unknown): string[] {
	if (value == null || value === '') return [];
	if (Array.isArray(value)) {
		return value.flatMap((item) => tokenizeLocales(item));
	}
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (!trimmed) return [];
		if (trimmed.startsWith('[')) {
			try {
				return tokenizeLocales(JSON.parse(trimmed));
			} catch {
				/* fall through to delimiter split */
			}
		}
		return trimmed.split(/[,;\s]+/).map((part) => part.trim()).filter(Boolean);
	}
	return [];
}

function uniqueCatalogLocales(ids: readonly string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const id of ids) {
		if (!isHostLocale(id) || seen.has(id)) continue;
		seen.add(id);
		out.push(id);
	}
	return out;
}

/** Normalize host/status/realmInfo payloads. Unknown locales are dropped. */
export function parseRealmLanguages(source: unknown): RealmLanguages {
	const obj = asRecord(source);
	const languages = uniqueCatalogLocales(
		tokenizeLocales(obj?.languages ?? obj?.locales),
	);
	const rawPrimary = obj?.primary_language ?? obj?.primaryLanguage ?? '';
	const primary = typeof rawPrimary === 'string' ? rawPrimary.trim() : '';
	return {
		languages,
		primary_language: languages.includes(primary) ? primary : (languages[0] ?? ''),
	};
}

export function emptyRealmLanguages(): RealmLanguages {
	return { languages: [], primary_language: '' };
}

export function validateRealmLanguages(state: RealmLanguages): { ok: true } | { ok: false; error: string } {
	const languages = uniqueCatalogLocales(state.languages);
	if (languages.length !== state.languages.length) {
		return { ok: false, error: 'Languages must be unique entries from the host catalog.' };
	}
	if (state.languages.some((id) => !isHostLocale(id))) {
		return { ok: false, error: 'Languages must be chosen from the host catalog.' };
	}
	const primary = (state.primary_language || '').trim();
	if (languages.length === 0) {
		if (primary) {
			return { ok: false, error: 'Primary language must stay in the enabled list.' };
		}
		return { ok: true };
	}
	if (!primary || !languages.includes(primary)) {
		return { ok: false, error: 'Primary language must stay in the enabled list.' };
	}
	return { ok: true };
}

export function addRealmLanguage(state: RealmLanguages, locale: string): LanguageResult {
	if (!isHostLocale(locale)) {
		return { ok: false, error: 'That language is not in the host catalog.' };
	}
	if (state.languages.includes(locale)) {
		return { ok: true, state: { ...state, languages: [...state.languages] } };
	}
	const languages = [...state.languages, locale];
	const primary_language = state.primary_language || locale;
	const next = { languages, primary_language };
	const check = validateRealmLanguages(next);
	return check.ok ? { ok: true, state: next } : check;
}

export function removeRealmLanguage(state: RealmLanguages, locale: string): LanguageResult {
	if (!state.languages.includes(locale)) {
		return { ok: true, state: { languages: [...state.languages], primary_language: state.primary_language } };
	}
	if (locale === state.primary_language && state.languages.length > 1) {
		return { ok: false, error: 'Set a different primary language before removing this one.' };
	}
	const languages = state.languages.filter((id) => id !== locale);
	const next = {
		languages,
		primary_language: languages.includes(state.primary_language) ? state.primary_language : (languages[0] ?? ''),
	};
	const check = validateRealmLanguages(next);
	return check.ok ? { ok: true, state: next } : check;
}

export function setPrimaryLanguage(state: RealmLanguages, locale: string): LanguageResult {
	if (!state.languages.includes(locale)) {
		return { ok: false, error: 'Primary language must stay in the enabled list.' };
	}
	return { ok: true, state: { languages: [...state.languages], primary_language: locale } };
}

/** Payload keys persisted by host `update_realm_config` (realms #361). */
export function realmLanguagesConfig(state: RealmLanguages): RealmLanguages {
	const check = validateRealmLanguages(state);
	if (!check.ok) {
		throw new Error(check.error);
	}
	return {
		languages: [...state.languages],
		primary_language: state.primary_language,
	};
}
