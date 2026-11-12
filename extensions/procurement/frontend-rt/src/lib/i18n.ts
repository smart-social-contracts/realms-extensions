import { createSubscriber } from 'svelte/reactivity';
import { version as extensionVersion } from '../../../manifest.json';
import en from '../../../frontend/i18n/locales/extensions/procurement/en.json';
import { createExtensionI18n } from '../../../../_shared/frontend/extension-i18n';

const i18n = createExtensionI18n({
	extensionId: 'procurement',
	version: extensionVersion,
	fallback: en as Record<string, string>,
});

// A text read through t() is tracked by whatever renders it, so the page changes in place when the translations
// load late or the locale changes: a form someone is filling in is not rebuilt for it.
let notify = () => {};
const track = createSubscriber((update) => {
	notify = update;
	return () => {
		notify = () => {};
	};
});

export function t(key: string, vars?: Record<string, string | number>): string {
	track();
	return i18n.t(key, vars);
}

export async function loadExtensionI18n(locale: string): Promise<void> {
	await i18n.load(locale);
	notify();
}
