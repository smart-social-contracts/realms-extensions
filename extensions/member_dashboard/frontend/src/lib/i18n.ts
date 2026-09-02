import { version as extensionVersion } from '../../../manifest.json';
import en from '../../i18n/locales/extensions/member_dashboard/en.json';
import { createExtensionI18n, interpolate } from '../../../../_shared/frontend/extension-i18n';

const i18n = createExtensionI18n({
	extensionId: 'member_dashboard',
	version: extensionVersion,
	fallback: en as Record<string, string>,
});

export { interpolate };
export const t = i18n.t;
export const loadExtensionI18n = i18n.load;
