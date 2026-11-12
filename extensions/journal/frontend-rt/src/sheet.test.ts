import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { dayOf, longDate, momentOf, timeOfDay, utcOffset } from './dates.ts';
import { entryReference, issueReference, type Issue } from './issue.ts';
import { escapeHtml, sheetHtml, type Issuer } from './sheet.ts';
import { CODE, DIGEST, PUBLIC_KEY, SIGNATURE, signed } from '../tests/proofFixture.ts';
import { VERIFY_URL, verificationUrl } from './proof.ts';
import { LOCALES, texts } from './testTexts.ts';

const t = texts('en');
const CANISTER = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
const ISSUER: Issuer = { logoUrl: '/custom/logo.png', canisterId: CANISTER, prefix: '' };
const empty: Issue = { realm: 'Agora', day: '2026-11-09', number: 3, first_day: '2026-11-07', today: '2026-11-09', timezone: 'UTC', entries: [] };
const AT = Date.UTC(2026, 10, 9, 10, 30) / 1000;
const ID = 'sha256:4be1a2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f';
const install = {
	id: 'E-1',
	at: AT,
	kind: 'codex_installed',
	details: {
		codex: ID,
		layers: [{ source: 'eu/es', versions: ['2.4.0'] }, { source: 'eu/es/vc', versions: [] }],
		proposal: 'P-12',
		vote: { yes: 4, no: 1, abstain: 0, eligible: 7 },
		activates_at: 0,
	},
};
const found = {
	id: 'E-2',
	at: AT + 60,
	kind: 'release_found',
	details: { source: 'eu/es', version: '2.4.0', effective_from: Date.UTC(2027, 0, 1) / 1000 },
};
const missed = { id: 'E-3', at: AT + 120, kind: 'not_recorded', details: { kind: 'codex_installed', codex: 'sha256:ab' } };
const revert = { id: 'E-4', at: AT + 180, kind: 'codex_reverted', details: { codex: 'sha256:ab', reverted: ID, layers: [], proposal: '' } };
const sheet = (issue: Issue, issuer = ISSUER, locale = 'en') => sheetHtml(issue, issuer, texts(locale), locale);
const madrid = { ...empty, timezone: 'Europe/Madrid' };

test('an issue with no entries is still an issue: its masthead, its day and a line that says so', () => {
	const html = sheet(empty);
	assert.match(html, /<h1>Official Journal of Agora<\/h1>/);
	assert.match(html, /<p class="number">No\. 3<\/p>/);
	assert.match(html, /<time class="day" datetime="2026-11-09">Monday, November 9, 2026<\/time>/);
	assert.match(html, /No entries were published on this day\./);
	assert.match(html, /Entries: 0/);
	assert.doesNotMatch(html, /<article|<h2 class="section-title"/);
});

test('the masthead has the realm\'s logo when it has one, and its identity small beneath the title', () => {
	assert.match(sheet(empty), /<img src="\/custom\/logo\.png" alt="">/);
	assert.doesNotMatch(sheet(empty, { ...ISSUER, logoUrl: '' }), /<img/);
	assert.match(sheet(empty), new RegExp(`<p class="identity mono">Realm identity: ${CANISTER}</p>`));
	assert.doesNotMatch(sheet(empty, { ...ISSUER, canisterId: '' }), /Realm identity/);
});

test('times are the realm\'s official time, named with their offset, and UTC is a note', () => {
	assert.equal(timeOfDay(AT, 'Europe/Madrid'), '11:30');
	assert.equal(timeOfDay(Date.UTC(2026, 6, 1, 10, 30) / 1000, 'Europe/Madrid'), '12:30');
	assert.equal(utcOffset('2026-11-09', 'Europe/Madrid'), 'UTC+01:00');
	assert.equal(utcOffset('2026-07-01', 'Europe/Madrid'), 'UTC+02:00');
	assert.equal(utcOffset('2026-11-09', 'Asia/Kolkata'), 'UTC+05:30');
	assert.equal(utcOffset('2026-11-09', 'Europe/London'), 'UTC');
	const html = sheet({ ...madrid, entries: [install] });
	assert.match(html, /<time datetime="2026-11-09T10:30:00\.000Z" title="10:30 UTC">11:30<\/time>/);
	assert.match(html, /Times in the realm&#39;s official time: Europe\/Madrid \(UTC\+01:00\)\./);
	assert.doesNotMatch(html, /Times are in UTC/);
});

test('a realm that has not set its zone says its times are in UTC, and why', () => {
	assert.match(sheet(empty), /Times are in UTC: the realm has not set its time zone\./);
	assert.doesNotMatch(sheet(empty), /official time/);
});

test('entries are grouped in sections, numbered I, II in the order they are printed, and an empty section is left out', () => {
	const html = sheet({ ...empty, entries: [missed, install, found, revert] });
	const headings = [...html.matchAll(/<h2 class="section-title"[^>]*>([^<]*)<\/h2>/g)].map((match) => match[1]);
	assert.deepEqual(headings, ['I. Legislation', 'II. Notices']);
	assert.ok(html.indexOf('I. Legislation') < html.indexOf('New legislation in force'));
	assert.ok(html.indexOf('New legislation in force') < html.indexOf('II. Notices'));
	assert.ok(html.indexOf('II. Notices') < html.indexOf('Entry not recorded'));
	const only = sheet({ ...empty, entries: [missed] });
	assert.deepEqual([...only.matchAll(/<h2 class="section-title"[^>]*>([^<]*)<\/h2>/g)].map((match) => match[1]), ['I. Notices']);
});

test('every entry has a reference of the issue and its place in it, whatever its section', () => {
	const issue = { ...empty, entries: [missed, install, found] };
	assert.equal(issueReference(issue), '2026/3');
	assert.equal(entryReference(issue, 2), '2026/3-2');
	const html = sheet(issue);
	const refs = [...html.matchAll(/<p class="ref">([^ ]+) ·/g)].map((match) => match[1]);
	assert.deepEqual(refs, ['2026/3-2', '2026/3-3', '2026/3-1']); // legislation first, then the notice: the numbers are the order recorded
});

test('an entry is a title, the facts as a short formal text, the codex and the pages that tell more', () => {
	const html = sheet({ ...empty, entries: [install] });
	assert.match(html, /<h3>New legislation in force<\/h3>/);
	assert.match(
		html,
		/<p class="facts">The realm now runs new legislation: eu\/es 2\.4\.0, eu\/es\/vc\. It is in force from November 9, 2026 at 10:30\. Decided by proposal P-12\. Vote: for 4, against 1, abstentions 0; eligible voters 7\.<\/p>/,
	);
	assert.ok(html.includes(`<abbr class="short" title="${ID}">sha256:4be1a2c3…</abbr><span class="full">${ID}</span>`));
	assert.match(html, /<a href="\/extensions\/voting\/proposals\/P-12">Proposal P-12<\/a>/);
	assert.match(html, /<a href="\/extensions\/codex_viewer\?codex=sha256%3A4be1a2c3/);
});

test('a quarter\'s sheet, which is its capital\'s issue, has no links to the quarter\'s own proposals and codices', () => {
	const html = sheet({ ...empty, entries: [install, found] }, { ...ISSUER, prefix: null });
	assert.doesNotMatch(html, /<a |<p class="links">/);
	assert.match(html, /Decided by proposal P-12\./); // what it says is still said
});

test('the links keep the path a realm is served under', () => {
	const html = sheet({ ...empty, entries: [install, found] }, { ...ISSUER, prefix: '/r/agora' });
	assert.match(html, /href="\/r\/agora\/extensions\/voting\/proposals\/P-12"/);
	assert.match(html, /href="\/r\/agora\/extensions\/codex_viewer"/);
});

test('the sheet is a document for A4 with the issue and the page number in the foot of every page, and links only on screen', () => {
	const html = sheet({ ...empty, entries: [install] });
	assert.match(html, /@page \{ size: A4; margin: 16mm 18mm 20mm;/);
	assert.match(html, /@bottom-left \{ content: "Official Journal of Agora · 2026\/3";/);
	assert.match(html, /@bottom-right \{ content: "Page " counter\(page\) " of " counter\(pages\);/);
	assert.match(html, /@media print \{[\s\S]*\.links \{ display: none; \}/);
	assert.match(html, /<footer class="colophon"><span>Official Journal of Agora · 2026\/3<\/span><span>Entries: 1<\/span><\/footer>/);
});

test('the headings are in order: the title, the sections, the entries', () => {
	const html = sheet({ ...empty, entries: [install, missed] });
	const levels = [...html.matchAll(/<h([1-6])[ >]/g)].map((match) => Number(match[1]));
	assert.deepEqual(levels, [1, 2, 3, 2, 3, 2]); // ... and the signature's title last
});

test('the place of the signature and its verification is on the sheet, marked and hidden, with a field for each part', () => {
	const html = sheet({ ...empty, entries: [install] });
	assert.match(html, /<section class="authentication" data-slot="signature" hidden /); // shown when the signing work fills it
	assert.match(html, /<h2 id="authentication-title">Signature and verification<\/h2>/);
	for (const field of ['issue_hash', 'signature', 'key_id', 'verification_code', 'verification_url', 'verification_qr']) {
		assert.match(html, new RegExp(`data-field="${field}"`), field);
	}
	assert.match(sheet(empty), /data-slot="signature"/); // an empty day is signed too
});

// ---- the signature: shown when the issue carries one that is its own, else a line that says what the issue is

const ONE = { ...empty, entries: [install] };
const slot = (html: string) => /<section class="authentication"[^>]*>[\s\S]*?<\/section>/.exec(html)![0];
const field = (html: string, name: string) => new RegExp(`data-field="${name}">([\\s\\S]*?)</dd>`).exec(html)?.[1];

test('a signed issue shows its signature box: the hash, the signature, the key, the code and the address, with a QR code', () => {
	const html = sheet(signed(ONE));
	assert.doesNotMatch(slot(html), /^<section[^>]* hidden/);
	assert.equal(field(html, 'issue_hash'), DIGEST);
	assert.equal(field(html, 'signature'), SIGNATURE);
	assert.equal(field(html, 'key_id'), `${PUBLIC_KEY} (key_1, realms:journal)`);
	assert.equal(field(html, 'verification_code'), CODE);
	const url = verificationUrl(CANISTER, CODE);
	assert.equal(field(html, 'verification_url'), `<a href="${url.replace(/&/g, '&amp;')}">${url.replace(/&/g, '&amp;')}</a>`);
	assert.match(slot(html), /data-field="verification_qr" aria-hidden="true"><svg [\s\S]*<\/svg><\/div>/);
	assert.match(slot(html), /<p class="how">Scan the code, or open the address and enter the verification code/);
	assert.doesNotMatch(html, /class="signature-note/);
});

test('the address names the canister of the proof and starts with the verify page\'s', () => {
	assert.ok(field(sheet(signed(ONE)), 'verification_url')!.includes(`${VERIFY_URL}?canister=${CANISTER}&amp;code=${CODE}`));
});

test('an issuer the sheet does not know has no signature shown: the sheet cannot say whose it is', () => {
	const html = sheet(signed(ONE), { ...ISSUER, canisterId: '' });
	assert.match(html, /<p class="signature-note mismatch" role="alert">/);
	assert.match(slot(html), /^<section[^>]* hidden/);
	assert.ok(!html.includes(CODE));
});

test('the code on the sheet is the digest\'s, whatever code the realm sends', () => {
	assert.equal(field(sheet(signed(ONE)), 'verification_code'), CODE);
	assert.match(sheet(signed(ONE, { code: 'AAAA-AAAA-AAAA-AAAA' })), /signature-note mismatch/); // not the issue's: not shown
});

test('an issue signed with others shows the root of their batch, and one signed alone does not', () => {
	const alone = sheet(signed(ONE));
	assert.doesNotMatch(alone, /data-field="batch_root"/);
	const batch = signed(ONE, { path: [['r', 'aa'.repeat(32)]], root: '12'.repeat(32) });
	assert.equal(field(sheet(batch), 'batch_root'), '12'.repeat(32));
	assert.match(sheet(batch), /<dt>Root of its batch<\/dt>/);
});

test('the signature of an empty day is shown too', () => {
	assert.doesNotMatch(slot(sheet(signed(empty))), /^<section[^>]* hidden/);
});

test('the day\'s open issue says it is provisional, and a closed one not yet signed says so, with no signature box', () => {
	for (const [status, text] of [['provisional', /Provisional issue: the realm signs it once its day has closed\./], ['unsigned', /Not signed yet: the realm signs each issue/]] as const) {
		const html = sheet({ ...ONE, status });
		assert.match(html, text);
		assert.match(slot(html), /^<section[^>]* hidden/);
		assert.doesNotMatch(html, /<svg/);
	}
});

test('a realm that does not sign says nothing of a signature, and the slot stays hidden', () => {
	const html = sheet(ONE);
	assert.doesNotMatch(html, /class="signature-note/);
	assert.match(slot(html), /^<section[^>]* hidden/);
});

test('a signature that is not this issue\'s is not shown: not of another day, another canister, or other entries', () => {
	const wrong = [
		signed(ONE, {}, { subject: '2026-11-08' }),
		signed(ONE, {}, { realm: 'aaaaa-aa' }),
		{ ...signed(ONE), entries: [{ ...install, kind: 'codex_reverted' }] },
		{ ...signed(ONE), entries: [] },
	];
	for (const issue of wrong) {
		const html = sheet(issue);
		assert.match(html, /<p class="signature-note mismatch" role="alert">The signature the realm gives for this issue does not match/);
		assert.match(slot(html), /^<section[^>]* hidden/);
		assert.ok(!html.includes(CODE) && !html.includes(SIGNATURE) && !html.includes('<svg'));
	}
});

test('what the realm says in a proof cannot add markup to the sheet, and a proof not in its form is not shown at all', () => {
	const hostile = '"><script>alert(1)</script>';
	for (const proof of [{ digest: hostile }, { signature: hostile }, { root: hostile }, { code: hostile }, { path: [['r', hostile]] }]) {
		const html = sheet(signed(ONE, proof));
		assert.doesNotMatch(html, /<script>|alert\(1\)/);
		assert.match(html, /signature-note mismatch/);
		assert.match(slot(html), /^<section[^>]* hidden/);
	}
	const key = sheet(signed(ONE, {}, { key: { algorithm: 'ed25519', name: hostile, path: hostile, public_key: hostile } }));
	assert.doesNotMatch(key, /<script>|alert\(1\)/);
	assert.match(key, /signature-note mismatch/);
});

test('a signed sheet reads and prints: the box is not cut across pages and its address prints as text', () => {
	const html = sheet(signed(ONE));
	assert.match(html, /\.authentication \{[^}]*break-inside: avoid/);
	assert.match(html, /@media print \{[\s\S]*a \{ color: inherit; text-decoration: none; \}/);
	assert.match(html, /\.qr svg \{[^}]*width: 100%/);
});

test('text from the realm cannot add markup or style to the sheet', () => {
	const hostile = '"><script>alert(1)</script></style><b>x</b>';
	const issue = { ...empty, realm: hostile, entries: [{ ...install, kind: '<b>x</b>', details: { proposal: hostile } }, { ...install, details: { codex: hostile, proposal: hostile } }] };
	const html = sheet(issue, { logoUrl: hostile, canisterId: hostile, prefix: '' });
	assert.doesNotMatch(html, /<script>|<b>x/);
	assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
	assert.equal(html.match(/<\/style>/g)?.length, 1); // the sheet's own, none from the realm's name in the page footer
	assert.ok(html.includes('content: "Official Journal of \\">\\3c script>alert(1)\\3c /script>\\3c /style>')); // `<` is escaped, in CSS
});

test('a line break in the realm\'s name cannot end the string of the page footer either', () => {
	const html = sheet({ ...empty, realm: 'A\fB\r\nC' });
	assert.match(html, /content: "Official Journal of A B {2}C · 2026\/3";/);
});

test('the realm\'s name cannot end the string of the page footer', () => {
	const html = sheet({ ...empty, realm: 'A"; } body { display: none } /*' });
	assert.match(html, /content: "Official Journal of A\\"; \} body \{ display: none \} \/\* · 2026\/3";/);
});

test('Chinese reaches the sheet whole, in the page, the date and the entries', () => {
	const zh = texts('zh-CN');
	const html = sheetHtml({ ...empty, realm: '瓦伦西亚', entries: [install, found] }, { ...ISSUER, logoUrl: '' }, zh, 'zh-CN');
	assert.match(html, /<meta charset="utf-8">/);
	assert.match(html, /<h1>瓦伦西亚官方公报<\/h1>/);
	assert.match(html, /第 3 期/);
	assert.match(html, /2026年11月9日星期一/);
	assert.match(html, /本领域现已适用新的立法：eu\/es 2\.4\.0, eu\/es\/vc。/);
	assert.match(html, /本领域获悉 eu\/es 的立法发布了新版本：版本 2\.4\.0，自 2027年1月1日 起生效。/);
	assert.match(html, /@bottom-right \{ content: "第 " counter\(page\) " 页，共 " counter\(pages\) " 页";/);
	assert.equal(longDate('2026-11-09', 'zh-CN'), '2026年11月9日星期一');
});

test('the day of a release is the day in the realm\'s zone, written in the reader\'s language', () => {
	const evening = Date.UTC(2026, 11, 31, 23, 30) / 1000; // already the 1st in Madrid
	assert.equal(dayOf(evening, 'UTC', 'en'), 'December 31, 2026');
	assert.equal(dayOf(evening, 'Europe/Madrid', 'es'), '1 de enero de 2027');
	assert.equal(momentOf(evening, 'Europe/Madrid', 'es'), '1 de enero de 2027, 00:30');
	const html = sheet({ ...madrid, entries: [{ ...found, details: { ...found.details, effective_from: evening } }] }, ISSUER, 'es');
	assert.match(html, /en vigor desde el 1 de enero de 2027\./);
});

const LANGUAGES = ['en', 'es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia'];

test('a signed sheet in any language has no text of another and no placeholder left', () => {
	const english = JSON.parse(readFileSync(new URL('en.json', LOCALES), 'utf8'));
	for (const locale of LANGUAGES) {
		const words = JSON.parse(readFileSync(new URL(`${locale}.json`, LOCALES), 'utf8'));
		const batch = sheet(signed(ONE, { path: [['r', 'aa'.repeat(32)]] }), ISSUER, locale);
		assert.doesNotMatch(batch, /\{\w+\}/, `${locale}: a placeholder is left`);
		for (const key of ['signature_title', 'signature_how', 'signature_batch_root', 'signature_issue_hash']) {
			assert.ok(batch.includes(escapeHtml(words[key])), `${locale}: ${key}`);
		}
		for (const [status, key] of [['provisional', 'signature_provisional'], ['unsigned', 'signature_unsigned']] as const) {
			assert.ok(sheet({ ...ONE, status }, ISSUER, locale).includes(escapeHtml(words[key])), `${locale}: ${key}`);
		}
		assert.ok(sheet({ ...signed(ONE), entries: [] }, ISSUER, locale).includes(escapeHtml(words.signature_mismatch)), `${locale}: mismatch`);
		if (locale !== 'en') {
			for (const key of ['signature_how', 'signature_batch_root', 'signature_provisional', 'signature_unsigned', 'signature_mismatch']) {
				assert.notEqual(words[key], english[key], `${locale}: ${key} is not translated`);
			}
		}
	}
});

test('every language has the same texts as English', () => {
	const english = Object.keys(JSON.parse(readFileSync(new URL('en.json', LOCALES), 'utf8'))).sort();
	for (const locale of LANGUAGES.slice(1)) {
		const words = JSON.parse(readFileSync(new URL(`${locale}.json`, LOCALES), 'utf8'));
		assert.deepEqual(Object.keys(words).sort(), english, locale);
	}
});

test('a sheet in any language has no text of another: no key shown for a text, no placeholder left, no English', () => {
	const issue = { ...madrid, entries: [install, found, { ...found, kind: 'release_published' }, revert, missed, { ...install, kind: 'something_new' }] };
	const english = JSON.parse(readFileSync(new URL('en.json', LOCALES), 'utf8'));
	const keys = Object.keys(english);
	for (const locale of LANGUAGES) {
		const html = sheet(issue, ISSUER, locale);
		const words = JSON.parse(readFileSync(new URL(`${locale}.json`, LOCALES), 'utf8'));
		assert.doesNotMatch(html, /\{\w+\}/, `${locale}: a placeholder is left`);
		assert.doesNotMatch(html, new RegExp(`>(${keys.join('|')})<`), `${locale}: a key is shown`);
		assert.ok(html.includes(words.section_legislation) && html.includes(words.signature_title), locale);
		if (locale !== 'en') {
			for (const key of ['title_codex_installed', 'fact_in_force', 'section_notices', 'signature_title']) {
				assert.notEqual(words[key], english[key], `${locale}: ${key} is not translated`);
			}
		}
	}
});
