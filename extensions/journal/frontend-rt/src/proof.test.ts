import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Issue } from './issue.ts';
import { CANISTER, CODE, canonicalOf, signed } from './proofFixture.ts';
import { VERIFY_URL, qrSvg, signedOf, signedText, verificationUrl } from './proof.ts';

const entry = { id: 'E-1', at: 1_790_000_000, kind: 'codex_installed', details: { codex: 'sha256:ab', proposal: 'P-1' } };
const issue: Issue = { realm: 'Agora', day: '2026-11-09', number: 3, first_day: '2026-11-07', today: '2026-11-10', timezone: 'UTC', entries: [entry] };

test('the address that verifies an issue names the canister and the code on the verify page', () => {
	assert.equal(verificationUrl(CANISTER, CODE), `${VERIFY_URL}?canister=${CANISTER}&code=${CODE}`);
	assert.equal(verificationUrl('a b', 'x&y'), `${VERIFY_URL}?canister=a%20b&code=x%26y`);
	assert.match(VERIFY_URL, /^https:\/\/.+\/$/);
});

test('the signed text is read, and what is not a signed issue is not', () => {
	assert.equal(signedText(canonicalOf(issue))?.subject, '2026-11-09');
	assert.equal(signedText('{'), null);
	assert.equal(signedText('[]'), null);
	assert.equal(signedText(canonicalOf(issue, { kind: 'certificate' })), null);
	assert.equal(signedText(canonicalOf(issue, { body: {} })), null);
	assert.equal(signedText(canonicalOf(issue, { key: null })), null);
});

test('a proof is the issue\'s own when its canister, its day and its entries are the sheet\'s', () => {
	assert.ok(signedOf(signed(issue), CANISTER));
	assert.ok(signedOf(signed(issue), '')); // an issuer the sheet does not know: the text names it
	assert.equal(signedOf(issue, CANISTER), null); // no proof
});

test('a proof of another canister, another day or other entries is not the issue\'s', () => {
	assert.equal(signedOf(signed(issue), 'aaaaa-aa'), null);
	assert.equal(signedOf(signed(issue, {}, { subject: '2026-11-08' }), CANISTER), null);
	const altered = { ...issue, entries: [{ ...entry, kind: 'codex_reverted' }] };
	assert.equal(signedOf({ ...altered, proof: signed(issue).proof }, CANISTER), null);
	const dropped = { ...issue, entries: [] };
	assert.equal(signedOf({ ...dropped, proof: signed(issue).proof }, CANISTER), null);
	assert.equal(signedOf({ ...issue, proof: { ...signed(issue).proof!, canonical: 'not json' } }, CANISTER), null);
});

test('the order of an entry\'s fields does not matter, its values do', () => {
	const reordered = { details: { proposal: 'P-1', codex: 'sha256:ab' }, kind: 'codex_installed', at: 1_790_000_000, id: 'E-1' };
	assert.ok(signedOf({ ...issue, entries: [reordered as any], proof: signed(issue).proof }, CANISTER));
	const other = { ...reordered, details: { proposal: 'P-2', codex: 'sha256:ab' } };
	assert.equal(signedOf({ ...issue, entries: [other as any], proof: signed(issue).proof }, CANISTER), null);
});

test('the QR code is an SVG of dark modules with a quiet zone of four, and the same text gives the same code', () => {
	const url = verificationUrl(CANISTER, CODE);
	const svg = qrSvg(url);
	const side = Number(/viewBox="0 0 (\d+) \1"/.exec(svg)?.[1]);
	assert.ok((side - 8 - 17) % 4 === 0 && side > 8 + 21, `a QR code of a whole version, not ${side} modules`);
	assert.match(svg, /<path d="M\d+ \d+h\d+v1h-\d+z/);
	assert.equal(qrSvg(url), svg);
	assert.notEqual(qrSvg(verificationUrl(CANISTER, 'AAAA-AAAA-AAAA-AAAA')), svg);
	assert.doesNotMatch(svg, /<script|href=/);
});
