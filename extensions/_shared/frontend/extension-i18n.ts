type Dict = Record<string, string>;

export function interpolate(template: string, vars: Record<string, string | number> = {}): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) =>
		vars[key] != null ? String(vars[key]) : `{${key}}`,
	);
}

function unwrap(raw: unknown, extensionId: string): Dict | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const o = raw as Record<string, unknown>;
	const nested = o.extensions;
	if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
		const inner = (nested as Record<string, unknown>)[extensionId];
		if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
			return inner as Dict;
		}
	}
	return o as Dict;
}

export function createExtensionI18n(opts: {
	extensionId: string;
	version: string;
	fallback: Record<string, string>;
}): {
	t: (key: string, vars?: Record<string, string | number>) => string;
	load: (locale: string) => Promise<void>;
} {
	const FALLBACK = { ...opts.fallback };
	let dict: Dict = { ...FALLBACK };
	const { extensionId, version } = opts;

	function t(key: string, vars?: Record<string, string | number>): string {
		const template = dict[key] ?? FALLBACK[key] ?? key;
		return vars ? interpolate(template, vars) : template;
	}

	async function load(locale: string): Promise<void> {
		const loc = (locale || 'en').trim() || 'en';
		const urls = [`/ext/${extensionId}/${version}/frontend/i18n/${loc}.json`];
		if (loc !== 'en') {
			urls.push(`/ext/${extensionId}/${version}/frontend/i18n/en.json`);
		}
		for (const url of urls) {
			try {
				const res = await fetch(url);
				if (!res.ok) continue;
				const inner = unwrap(await res.json(), extensionId);
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

	return { t, load };
}
