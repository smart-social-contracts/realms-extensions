import { version as extensionVersion } from '../../../manifest.json';
import en from '../../i18n/locales/extensions/member_dashboard/en.json';

type Dict = Record<string, string>;

const FALLBACK = en as Dict;
let dict: Dict = { ...FALLBACK };

export function interpolate(template: string, vars: Record<string, string | number> = {}): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) =>
		vars[key] != null ? String(vars[key]) : `{${key}}`,
	);
}

export function t(key: string, vars?: Record<string, string | number>): string {
	const template = dict[key] ?? FALLBACK[key] ?? key;
	return vars ? interpolate(template, vars) : template;
}

function unwrap(raw: unknown): Dict | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const o = raw as Record<string, unknown>;
	const nested = o.extensions;
	if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
		const inner = (nested as Record<string, unknown>).member_dashboard;
		if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
			return inner as Dict;
		}
	}
	return o as Dict;
}

export async function loadExtensionI18n(locale: string): Promise<void> {
	const loc = (locale || 'en').trim() || 'en';
	const urls = [`/ext/member_dashboard/${extensionVersion}/frontend/i18n/${loc}.json`];
	if (loc !== 'en') {
		urls.push(`/ext/member_dashboard/${extensionVersion}/frontend/i18n/en.json`);
	}
	for (const url of urls) {
		try {
			const res = await fetch(url);
			if (!res.ok) continue;
			const inner = unwrap(await res.json());
			if (inner) {
				dict = { ...FALLBACK, ...inner };
				return;
			}
		} catch {
			/* try next locale file */
		}
	}
	dict = { ...FALLBACK };
}
