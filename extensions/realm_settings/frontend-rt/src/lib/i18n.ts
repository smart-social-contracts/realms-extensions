import { version as extensionVersion } from '../../../manifest.json';
import en from '../../../frontend/i18n/locales/extensions/realm_settings/en.json';
import { createExtensionI18n } from '../../../../_shared/frontend/extension-i18n';

const i18n = createExtensionI18n({
	extensionId: 'realm_settings',
	version: extensionVersion,
	fallback: en as Record<string, string>,
});

export const t = i18n.t;
export const loadExtensionI18n = i18n.load;
