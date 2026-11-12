import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Issue } from './issue.ts';
import { CANISTER, CODE, DIGEST, SIGNATURE, canonicalOf, signed } from './proofFixture.ts';
import { VERIFY_URL, codeOf, qrSvg, signedOf, signedText, verificationUrl } from './proof.ts';

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
	assert.equal(signedOf(signed(issue), ''), null); // an issuer the sheet does not know: it cannot say whose the signature is
	assert.equal(signedOf(issue, CANISTER), null); // no proof
});

test('a proof of another canister, another day, another number or other entries is not the issue\'s', () => {
	assert.equal(signedOf(signed(issue, {}, { body: { number: 4, timezone: 'UTC', entries: [entry] } }), CANISTER), null);
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

test('the verification code is the first 80 bits of the digest in base32, as the canister makes it', () => {
	assert.equal(codeOf('6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d'), 'NY2A-XHH7-WN5J-RHFF'); // sha256 of one zero byte
	assert.equal(codeOf(DIGEST), CODE);
	assert.equal(codeOf('00'.repeat(32)), 'AAAA-AAAA-AAAA-AAAA');
	assert.equal(codeOf('ff'.repeat(32)), '7777-7777-7777-7777');
	assert.equal(codeOf('xyz'), null);
	assert.equal(codeOf('ab'.repeat(31)), null);
});

test('the code is the digest\'s, not the one the realm sends: another code, or no code, is not the issue\'s', () => {
	assert.equal(signedOf(signed(issue, { code: 'AAAA-AAAA-AAAA-AAAA' }), CANISTER), null);
	assert.equal(signedOf(signed(issue, { code: CODE.toLowerCase() }), CANISTER), null);
	assert.equal(signedOf(signed(issue, { code: undefined }), CANISTER), null);
});

test('every value of the proof is in its form: hex of the right length, a path of sides and digests, the key of the journal', () => {
	for (const proof of [
		{ digest: 'cd'.repeat(31) },
		{ root: 'zz'.repeat(32) },
		{ signature: SIGNATURE.slice(2) },
		{ path: 'no' },
		{ path: [['x', 'aa'.repeat(32)]] },
		{ path: [['l', 'aa']] },
	]) {
		assert.equal(signedOf(signed(issue, proof), CANISTER), null, JSON.stringify(proof));
	}
	const key = { algorithm: 'ed25519', name: 'key_1', path: 'realms:journal', public_key: 'ab'.repeat(32) };
	for (const wrong of [{ algorithm: 'rsa' }, { name: 'key 1' }, { name: '<b>' }, { path: 'realms:certificate' }, { public_key: 'ab' }]) {
		assert.equal(signedOf(signed(issue, {}, { key: { ...key, ...wrong } }), CANISTER), null, JSON.stringify(wrong));
	}
	assert.ok(signedOf(signed(issue, { path: [['l', 'aa'.repeat(32)], ['r', 'bb'.repeat(32)]], root: 'ee'.repeat(32) }), CANISTER));
});

test('only the fields the sheet renders are compared: an entry\'s id, time, kind and details', () => {
	const more = { ...issue, entries: [{ ...entry, note: 'a field the sheet does not render' } as any] };
	assert.ok(signedOf({ ...more, proof: signed(issue).proof }, CANISTER));
	for (const changed of [{ id: 'E-2' }, { at: entry.at + 1 }, { kind: 'codex_reverted' }, { details: { ...entry.details, proposal: 'P-2' } }]) {
		assert.equal(signedOf({ ...issue, entries: [{ ...entry, ...changed }], proof: signed(issue).proof }, CANISTER), null, JSON.stringify(changed));
	}
});

// The text of a signed issue as CPython writes it (json.dumps(doc, sort_keys=True, separators=(',', ':'), ensure_ascii=True)),
// which is what the canister signs: every character above "~" is an escape, a pair for one above U+FFFF.
const WRITTEN_BY_PYTHON = String.raw`{"body":{"entries":[{"at":1794000000,"details":{"codex":"sha256:\u00e9\u4e2d\ud83d\ude00","proposal":"P-12"},"id":"E-1","kind":"codex_installed"}],"number":3,"timezone":"Europe/Madrid"},"key":{"algorithm":"ed25519","name":"key_1","path":"realms:journal","public_key":"abababababababababababababababababababababababababababababababab"},"kind":"journal","prev":null,"realm":"rrkah-fqaaa-aaaaa-aaaaq-cai","signed_at":1794009601,"subject":"2026-11-09","v":1}`;

test('a text written with ASCII escapes reads back as the characters it was made of, and is the issue\'s', () => {
	assert.ok([...WRITTEN_BY_PYTHON].every((ch) => ch <= '~'));
	assert.ok(WRITTEN_BY_PYTHON.includes('\\u00e9\\u4e2d\\ud83d\\ude00'));
	const entry = { id: 'E-1', at: 1794000000, kind: 'codex_installed', details: { codex: 'sha256:é中😀', proposal: 'P-12' } };
	const ours: Issue = { realm: 'Agora', day: '2026-11-09', number: 3, first_day: '2026-11-07', today: '2026-11-10', timezone: 'Europe/Madrid', entries: [entry] };
	const proof = { canonical: WRITTEN_BY_PYTHON, digest: DIGEST, root: DIGEST, path: [], signature: SIGNATURE, code: CODE };
	assert.ok(signedOf({ ...ours, proof }, CANISTER));
	const altered = { ...entry, details: { ...entry.details, codex: 'sha256:e中😀' } };
	assert.equal(signedOf({ ...ours, entries: [altered], proof }, CANISTER), null);
});
