import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayOf, momentOf } from './dates.ts';
import { describe, shortId } from './entries.ts';
import { texts } from './testTexts.ts';

const t = texts('en');
const clock = { day: (seconds: number) => dayOf(seconds, 'UTC', 'en'), moment: (seconds: number) => momentOf(seconds, 'UTC', 'en') };
const AT = Date.UTC(2026, 10, 9, 10, 30) / 1000;
const ID = 'sha256:4be1a2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f';
const install = {
	id: 'E-1',
	at: AT,
	kind: 'codex_installed',
	details: { codex: ID, layers: [{ source: 'eu/es', versions: ['2.4.0'] }, { source: 'eu/es/vc', versions: [] }], proposal: 'P-12', activates_at: 0 },
};
const found = {
	id: 'E-2',
	at: AT,
	kind: 'release_found',
	details: { source: 'eu/es', version: '2.4.0', effective_from: Date.UTC(2027, 0, 1) / 1000 },
};
const VOTE = { yes: 4, no: 1, abstain: 0, eligible: 7 };

test('an install says what the realm now runs, from when, and by which proposal', () => {
	const entry = describe(install, t, clock);
	assert.equal(entry.section, 'legislation');
	assert.equal(entry.title, 'New legislation in force');
	assert.deepEqual(entry.facts.slice(0, 2), [
		'The realm now runs new legislation: eu/es 2.4.0, eu/es/vc.',
		'It is in force from November 9, 2026 at 10:30.',
	]);
	assert.equal(entry.facts[2], 'Decided by proposal P-12.');
	assert.deepEqual(entry.codices, [{ label: 'Codex', id: ID }]);
	assert.deepEqual(entry.links, [
		{ label: 'Proposal P-12', path: '/extensions/voting/proposals/P-12' },
		{ label: 'The codex', path: `/extensions/codex_viewer?codex=${encodeURIComponent(ID)}` },
	]);
});

test('an install staged for a time is in force from that time, not from the time of its entry', () => {
	const staged = { ...install, details: { ...install.details, activates_at: Date.UTC(2026, 10, 9, 9, 0) / 1000 } };
	assert.equal(describe(staged, t, clock).facts[1], 'It is in force from November 9, 2026 at 09:00.');
});

test('the result of the vote is told when the realm kept it, and the proposal alone when it did not', () => {
	const voted = describe({ ...install, details: { ...install.details, vote: VOTE } }, t, clock);
	assert.equal(voted.facts[3], 'Vote: for 4, against 1, abstentions 0; eligible voters 7.');
	assert.equal(describe(install, t, clock).facts.length, 3);
	assert.equal(describe({ ...install, details: { ...install.details, vote: { yes: 4 } } }, t, clock).facts.length, 3);
});

test('an install nobody proposed names no decision and links no proposal', () => {
	const direct = describe({ ...install, details: { ...install.details, proposal: '' } }, t, clock);
	assert.deepEqual(direct.facts, ['The realm now runs new legislation: eu/es 2.4.0, eu/es/vc.', 'It is in force from November 9, 2026 at 10:30.']);
	assert.deepEqual(direct.links.map((link) => link.label), ['The codex']);
});

test('an entry whose details the personal-data rules left out is still an entry that says what happened', () => {
	const bare = describe({ ...install, details: {} }, t, clock);
	assert.deepEqual(bare.facts, ['The realm now runs new legislation.', 'It is in force from November 9, 2026 at 10:30.']);
	assert.deepEqual([bare.codices, bare.links], [[], []]);
	assert.deepEqual(describe({ ...found, details: {} }, t, clock).facts, ['The realm learned of a release of legislation.']);
});

test('a revert says which codex the realm went back to and which it left, and who decided it', () => {
	const revert = { ...install, kind: 'codex_reverted', details: { codex: 'sha256:ab', reverted: 'sha256:cd', layers: install.details.layers, proposal: 'P-13', vote: VOTE } };
	const entry = describe(revert, t, clock);
	assert.equal(entry.title, 'Return to earlier legislation');
	assert.deepEqual(entry.facts, [
		'The realm went back to earlier legislation: eu/es 2.4.0, eu/es/vc.',
		'Decided by proposal P-13.',
		'Vote: for 4, against 1, abstentions 0; eligible voters 7.',
	]);
	assert.deepEqual(entry.codices, [
		{ label: 'Codex restored', id: 'sha256:ab' },
		{ label: 'Codex replaced', id: 'sha256:cd' },
	]);
	assert.deepEqual(describe({ ...revert, details: { codex: 'a', reverted: 'b', layers: [] } }, t, clock).facts, ['The realm went back to earlier legislation.']);
	assert.equal(describe(revert, texts('zh-CN'), clock).facts[0], '本领域已恢复先前的立法：eu/es 2.4.0, eu/es/vc。');
});

test('a release the check found and one the realm published say which release and from when it is in force', () => {
	const entry = describe(found, t, clock);
	assert.equal(entry.title, 'Release of legislation found');
	assert.deepEqual(entry.facts, ['The realm learned of a release of legislation from eu/es: version 2.4.0, in force from January 1, 2027.']);
	assert.deepEqual(entry.links, [{ label: "The realm's legislation", path: '/extensions/codex_viewer' }]);
	const published = describe({ ...found, kind: 'release_published' }, t, clock);
	assert.equal(published.title, 'Release of legislation published');
	assert.deepEqual(published.facts, ['The realm published a release of its legislation: eu/es version 2.4.0, in force from January 1, 2027.']);
	assert.deepEqual(describe({ ...found, kind: 'release_published', details: { source: 'eu/es' } }, t, clock).facts, [
		'The realm published a release of its legislation.',
	]);
});

test('an entry that could not be recorded is a notice that says which change it misses, whatever the change', () => {
	const missed = (details: Record<string, any>) => describe({ ...install, kind: 'not_recorded', details }, t, clock);
	assert.equal(missed({ kind: 'codex_installed', codex: 'sha256:ab' }).section, 'notices');
	assert.equal(missed({ kind: 'codex_installed', codex: 'sha256:ab' }).title, 'Entry not recorded');
	assert.deepEqual(missed({ kind: 'codex_reverted', codex: 'test@1.0.0', reverted: 'test@1.1.0' }).facts, [
		'An entry could not be recorded: the revert from the codex test@1.1.0 back to the codex test@1.0.0.',
	]);
	assert.deepEqual(missed({ kind: 'codex_installed', codex: 'sha256:ab' }).facts, ['An entry could not be recorded: the install of the codex sha256:ab.']);
	assert.deepEqual(missed({ kind: 'release_found', source: 'eu/es', version: '2.4.0' }).facts, [
		'An entry could not be recorded: the release 2.4.0 of eu/es, found by a check.',
	]);
	assert.deepEqual(missed({ kind: 'release_published', source: 'eu/es', version: '2.4.0' }).facts, [
		'An entry could not be recorded: the publication of the release 2.4.0 of eu/es.',
	]);
	assert.deepEqual(missed({ kind: 'something_new' }).facts, ['An entry could not be recorded: a change (something_new).']);
});

test('a kind this version does not know is still shown, as a notice', () => {
	const entry = describe({ ...install, kind: 'something_new' }, t, clock);
	assert.deepEqual([entry.section, entry.title, entry.facts], ['notices', 'Change recorded', ['A change was recorded (something_new).']]);
});

test('a codex id is short on the screen and any other id is left as it is', () => {
	assert.equal(shortId(ID), 'sha256:4be1a2c3…');
	assert.equal(shortId('test@1.0.0'), 'test@1.0.0');
	assert.equal(shortId('sha256:ab'), 'sha256:ab');
});
