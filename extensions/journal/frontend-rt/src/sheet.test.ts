import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { interpolate } from '../../../_shared/frontend/extension-i18n.ts';
import { entryText, longDate, sheetHtml, timeOfDay, type Issue } from './sheet.ts';

const LOCALES = new URL('../../frontend/i18n/locales/extensions/journal/', import.meta.url);

function texts(locale: string) {
	const words: Record<string, string> = JSON.parse(readFileSync(new URL(`${locale}.json`, LOCALES), 'utf8'));
	return (key: string, vars?: Record<string, string | number>) => interpolate(words[key] ?? key, vars);
}

const t = texts('en');
const LOGO = '/custom/logo.png';
const empty: Issue = { realm: 'Agora', day: '2026-11-09', number: 3, first_day: '2026-11-07', today: '2026-11-09', timezone: 'UTC', entries: [] };
const install = {
	id: 'E-1',
	at: Date.UTC(2026, 10, 9, 10, 30) / 1000,
	kind: 'codex_installed',
	details: { layers: [{ source: 'eu/es', versions: ['2.4.0'] }, { source: 'eu/es/vc', versions: [] }] },
};

test('an issue with no entries is still an issue: its number, its day and a line that says so', () => {
	const html = sheetHtml(empty, LOGO, t, 'en');
	assert.match(html, /Official journal of Agora/);
	assert.match(html, /No\. 3 · Monday, November 9, 2026/);
	assert.match(html, /No news or changes were recorded on this day\./);
	assert.match(html, /Entries: 0/);
});

test('an entry shows its time in the realm\'s zone, across a summer-time change', () => {
	assert.equal(timeOfDay(install.at, 'Europe/Madrid'), '11:30');
	assert.equal(timeOfDay(Date.UTC(2026, 6, 1, 10, 30) / 1000, 'Europe/Madrid'), '12:30');
	const html = sheetHtml({ ...empty, timezone: 'Europe/Madrid', entries: [install] }, LOGO, t, 'en');
	assert.match(html, /<time datetime="2026-11-09T10:30:00\.000Z">11:30<\/time>/);
	assert.match(html, /Times are in Europe\/Madrid\./);
});

test('an install says what the realm now runs, and a kind this version does not know is still shown', () => {
	assert.equal(entryText(install, t), 'The realm now runs new legislation: eu/es 2.4.0, eu/es/vc.');
	assert.equal(entryText({ ...install, details: {} }, t), 'The realm now runs new legislation.');
	assert.equal(entryText({ ...install, kind: 'something_new' }, t), 'A change was recorded (something_new).');
});

test('a revert says the realm went back to earlier legislation, with no layers for a legacy codex', () => {
	const revert = { ...install, kind: 'codex_reverted', details: { ...install.details, codex: 'sha256:ab', reverted: 'sha256:cd' } };
	assert.equal(entryText(revert, t), 'The realm went back to earlier legislation: eu/es 2.4.0, eu/es/vc.');
	assert.equal(entryText({ ...revert, details: { layers: [] } }, t), 'The realm went back to earlier legislation.');
	assert.equal(entryText(revert, texts('zh-CN')), '本领域已恢复先前的立法：eu/es 2.4.0, eu/es/vc。');
});

test('the realm\'s logo is on the sheet when it has one and not when it has none', () => {
	assert.match(sheetHtml(empty, LOGO, t, 'en'), /<img src="\/custom\/logo\.png" alt="">/);
	assert.doesNotMatch(sheetHtml(empty, '', t, 'en'), /<img/);
});

test('text from the realm cannot add markup to the sheet', () => {
	const issue = { ...empty, realm: '<script>alert(1)</script>', entries: [{ ...install, kind: '<b>x</b>', details: {} }] };
	const html = sheetHtml(issue, '"><script>alert(2)</script>', t, 'en');
	assert.doesNotMatch(html, /<script>|<b>x/);
	assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('Chinese reaches the sheet whole, in the page and in the date', () => {
	const zh = texts('zh-CN');
	const html = sheetHtml({ ...empty, realm: '瓦伦西亚', entries: [install] }, '', zh, 'zh-CN');
	assert.match(html, /<meta charset="utf-8">/);
	assert.match(html, /瓦伦西亚官方公报/);
	assert.match(html, /第 3 期 · 2026年11月9日星期一/);
	assert.match(html, /本领域现已适用新的立法：eu\/es 2\.4\.0, eu\/es\/vc。/);
	assert.equal(longDate('2026-11-09', 'zh-CN'), '2026年11月9日星期一');
});

test('every language has the same texts as English', () => {
	const english = Object.keys(JSON.parse(readFileSync(new URL('en.json', LOCALES), 'utf8'))).sort();
	for (const locale of ['es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia']) {
		const words = JSON.parse(readFileSync(new URL(`${locale}.json`, LOCALES), 'utf8'));
		assert.deepEqual(Object.keys(words).sort(), english, locale);
	}
});
