/** Keep in lockstep with src/realm_frontend/src/lib/i18n/realmLocales.ts. */
export const LOCALE_CATALOG = [
	{ id: 'en', name: 'English' },
	{ id: 'es', name: 'Español' },
	{ id: 'de', name: 'Deutsch' },
	{ id: 'fr', name: 'Français' },
	{ id: 'it', name: 'Italiano' },
	{ id: 'zh-CN', name: '中文 (简体)' },
	{ id: 'ca-valencia', name: 'Valencià' },
] as const;

export const DEFAULT_LANGUAGE = 'en';

const CATALOG_ID_SET = new Set<string>(LOCALE_CATALOG.map((item) => item.id));

export function localeLabel(id: string): string {
	return LOCALE_CATALOG.find((item) => item.id === id)?.name ?? id;
}

export function coerceEnabledLanguages(
	languages: unknown,
	primaryLanguage: unknown,
): { languages: string[]; primary: string } {
	const parsed = Array.isArray(languages)
		? languages.filter((item): item is string => typeof item === 'string' && CATALOG_ID_SET.has(item.trim()))
		: [];
	const enabled = parsed.length > 0 ? parsed : [DEFAULT_LANGUAGE];
	const primary =
		typeof primaryLanguage === 'string' && enabled.includes(primaryLanguage.trim())
			? primaryLanguage.trim()
			: enabled[0];
	return { languages: enabled, primary };
}
