import { version as extensionVersion } from '../../../manifest.json';
import en from '../../../frontend/i18n/locales/extensions/public_dashboard/en.json';
import { createExtensionI18n } from '../../../../_shared/frontend/extension-i18n';

const i18n = createExtensionI18n({
	extensionId: 'public_dashboard',
	version: extensionVersion,
	fallback: en as Record<string, string>,
});

export const t = i18n.t;
export const loadExtensionI18n = i18n.load;
