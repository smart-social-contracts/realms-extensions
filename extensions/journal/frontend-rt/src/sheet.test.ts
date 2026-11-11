import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { interpolate } from '../../../_shared/frontend/extension-i18n.ts';
import { dayOf, entryText, longDate, sheetHtml, timeOfDay, type Issue } from './sheet.ts';

const LOCALES = new URL('../../frontend/i18n/locales/extensions/journal/', import.meta.url);

function texts(locale: string) {
	const words: Record<string, string> = JSON.parse(readFileSync(new URL(`${locale}.json`, LOCALES), 'utf8'));
	return (key: string, vars?: Record<string, string | number>) => interpolate(words[key] ?? key, vars);
}

const t = texts('en');
const day = (seconds: number) => dayOf(seconds, 'UTC', 'en');
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
	assert.equal(entryText(install, t, day), 'The realm now runs new legislation: eu/es 2.4.0, eu/es/vc.');
	assert.equal(entryText({ ...install, details: {} }, t, day), 'The realm now runs new legislation.');
	assert.equal(entryText({ ...install, kind: 'something_new' }, t, day), 'A change was recorded (something_new).');
});

test('an entry that could not be recorded says which change it misses, whatever the change', () => {
	const missed = (details: Record<string, any>) => entryText({ ...install, kind: 'not_recorded', details }, t, day);
	assert.equal(
		missed({ kind: 'codex_reverted', codex: 'test@1.0.0', reverted: 'test@1.1.0' }),
		'An entry could not be recorded: the revert from the codex test@1.1.0 back to the codex test@1.0.0.',
	);
	assert.equal(missed({ kind: 'codex_installed', codex: 'sha256:ab' }), 'An entry could not be recorded: the install of the codex sha256:ab.');
	assert.equal(missed({ kind: 'something_new' }), 'An entry could not be recorded: a change (something_new).');
});

test('a revert says the realm went back to earlier legislation, with no layers for a legacy codex', () => {
	const revert = { ...install, kind: 'codex_reverted', details: { ...install.details, codex: 'sha256:ab', reverted: 'sha256:cd' } };
	assert.equal(entryText(revert, t, day), 'The realm went back to earlier legislation: eu/es 2.4.0, eu/es/vc.');
	assert.equal(entryText({ ...revert, details: { layers: [] } }, t, day), 'The realm went back to earlier legislation.');
	assert.equal(entryText(revert, texts('zh-CN'), day), '本领域已恢复先前的立法：eu/es 2.4.0, eu/es/vc。');
});

const found = {
	id: 'E-2',
	at: Date.UTC(2026, 10, 9, 10, 30) / 1000,
	kind: 'release_found',
	details: { source: 'eu/es', version: '2.4.0', effective_from: Date.UTC(2027, 0, 1) / 1000 },
};

test('a release the check found and one the realm published say which release and from when it is in force', () => {
	assert.equal(entryText(found, t, day), 'The realm learned of a release of legislation from eu/es: version 2.4.0, in force from January 1, 2027.');
	assert.equal(
		entryText({ ...found, kind: 'release_published' }, t, day),
		'The realm published a release of its legislation: eu/es version 2.4.0, in force from January 1, 2027.',
	);
	assert.equal(entryText({ ...found, details: {} }, t, day), 'The realm learned of a release of legislation.');
	assert.equal(
		entryText({ ...found, kind: 'release_published', details: { source: 'eu/es' } }, t, day),
		'The realm published a release of its legislation.',
	);
});

test('the date of a release is the day in the realm\'s zone, and the sheet writes it in the reader\'s language', () => {
	const evening = Date.UTC(2026, 11, 31, 23, 30) / 1000; // already the 1st in Madrid
	assert.equal(dayOf(evening, 'UTC', 'en'), 'December 31, 2026');
	assert.equal(dayOf(evening, 'Europe/Madrid', 'es'), '1 de enero de 2027');
	const html = sheetHtml({ ...empty, timezone: 'Europe/Madrid', entries: [{ ...found, details: { ...found.details, effective_from: evening } }] }, '', texts('es'), 'es');
	assert.match(html, /en vigor desde el 1 de enero de 2027\./);
});

test('an entry that could not be recorded names the release it misses', () => {
	const missed = (kind: string) => entryText({ ...found, kind: 'not_recorded', details: { kind, source: 'eu/es', version: '2.4.0' } }, t, day);
	assert.equal(missed('release_found'), 'An entry could not be recorded: the release 2.4.0 of eu/es, found by a check.');
	assert.equal(missed('release_published'), 'An entry could not be recorded: the publication of the release 2.4.0 of eu/es.');
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
	assert.equal(
		entryText(found, zh, (seconds) => dayOf(seconds, 'Asia/Shanghai', 'zh-CN')),
		'本领域获悉 eu/es 的立法发布了新版本：版本 2.4.0，自 2027年1月1日 起生效。',
	);
	assert.equal(longDate('2026-11-09', 'zh-CN'), '2026年11月9日星期一');
});

test('every language has the same texts as English', () => {
	const english = Object.keys(JSON.parse(readFileSync(new URL('en.json', LOCALES), 'utf8'))).sort();
	for (const locale of ['es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia']) {
		const words = JSON.parse(readFileSync(new URL(`${locale}.json`, LOCALES), 'utf8'));
		assert.deepEqual(Object.keys(words).sort(), english, locale);
	}
});
