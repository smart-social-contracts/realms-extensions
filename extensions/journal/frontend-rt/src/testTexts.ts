/** The journal's own translations as the tests read them, so that the tests check the words of the file and not a copy. */

import { readFileSync } from 'node:fs';
import { interpolate } from '../../../_shared/frontend/extension-i18n.ts';
import type { Text } from './issue.ts';

export const LOCALES = new URL('../../frontend/i18n/locales/extensions/journal/', import.meta.url);

export function texts(locale: string): Text {
	const words: Record<string, string> = JSON.parse(readFileSync(new URL(`${locale}.json`, LOCALES), 'utf8'));
	return (key, vars) => interpolate(words[key] ?? key, vars);
}
