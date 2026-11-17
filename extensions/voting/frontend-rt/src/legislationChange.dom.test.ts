// An install proposal shows what it changes (realms-gos#493, docs/codices/layered-codex.md §7): the change list its action
// pins, read from its address and checked against the checksum, the chapters it sets next to the ones the realm runs,
// and the analysis report, which the realm has not checked. These tests mount the real page on a small fake realm.
import { createHash, webcrypto } from 'node:crypto';
import { mount, unmount } from 'svelte';
import { writable } from 'svelte/store';
import { afterEach, expect, test, vi } from 'vitest';
import en from '../../frontend/i18n/locales/extensions/voting/en.json';
import Voting from './Voting.svelte';

const hexOf = (text: string) => createHash('sha256').update(text).digest('hex');

const CHANGE_LIST_URL = 'https://raw.example.org/commit/change.json';
const REPORT_URL = 'https://raw.example.org/commit/report.md';
const TAX_URL = 'https://raw.example.org/commit/tax.py';
const OLD_TAX = 'class Tax:\n    bonus = 0\n';
const NEW_TAX = 'class Tax:\n    bonus = 5\n';
const REPORT = '# Analysis\n\nNewly allowed: urban IBI between 1.10 % and 1.24 % for capitals.\n';
const RUNNING = 'sha256:4be1';

const changeList = (over: Record<string, unknown> = {}) => ({
	kind: 'realms-gos/legislation-change',
	format: 1,
	realm: 'eu/es/vc/46250-valencia',
	replaces: RUNNING,
	set: [{ chapter: 'eu/es/vc/46250-valencia/tax', url: TAX_URL, mirrors: [], sha256: hexOf(NEW_TAX), size: NEW_TAX.length }],
	remove: [],
	release: null,
	report: { url: REPORT_URL, sha256: hexOf(REPORT) },
	summary: { es: 'IBI 2027: bonificación por familia numerosa', en: 'IBI 2027: large-family bonus' },
	...over,
});

const proposal = (action: unknown, status = 'voting') => ({
	id: 'P-7',
	title: 'IBI 2027',
	description: 'The bonus',
	proposer: 'alice',
	status,
	opens_at: 1,
	deadline: 4_102_444_800,
	action,
	tally: { yes: 0, no: 0, abstain: 0, eligible: 3, veto: [] },
});

const codeAction = (text: string) => ({ op: 'codex_install', args: { url: CHANGE_LIST_URL, checksum: `sha256:${hexOf(text)}` } });

let target: HTMLElement;
let page: ReturnType<typeof mount>;
/** The addresses the page asked, and the operations it read. */
let fetched: string[];
let reads: [string, any][];

const settle = () => new Promise((resolve) => setTimeout(resolve, 150));
const text = (testid: string) => target.querySelector(`[data-testid="${testid}"]`)?.textContent?.replace(/\s+/g, ' ').trim() ?? null;

interface World {
	proposal: Record<string, unknown>;
	/** What each address serves; one not listed is a 404. */
	files: Record<string, string>;
	running?: Record<string, { sha256: string }> | null;
	locale?: string;
	/** The realm does not answer ``codex_status``: what it runs is unknown. */
	unreadable?: boolean;
	/** What ``codex_status`` says of the sync sources: the releases each could install, a step back marked. */
	sources?: unknown[];
	/** What ``proposal_get`` says of how the proposal's release stands against the one the realm runs. */
	releaseChange?: Record<string, unknown> | null;
	/** What shows the change has been read: the report, a failure or a release (none: nothing is shown for the proposal). */
	ready?: string | null;
}

/** Mounts the page on a realm that holds ``world.proposal``, and opens it from its address. */
async function open({
	proposal,
	files,
	running = { 'eu/es/vc/46250-valencia/tax': { sha256: `sha256:${hexOf(OLD_TAX)}` } },
	locale = 'en',
	unreadable = false,
	sources = [],
	releaseChange = null,
	ready = '[data-testid="report"], [data-testid="change-failure"], [data-testid="release-install"]',
}: World) {
	fetched = [];
	reads = [];
	window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia; // jsdom has none
	vi.stubGlobal('crypto', webcrypto);
	vi.stubGlobal('fetch', async (url: string) => {
		fetched.push(url);
		if (url.includes('/i18n/')) return { ok: true, json: async () => en };
		return url in files ? new Response(files[url]) : new Response('', { status: 404 });
	});
	history.pushState(null, '', '/extensions/voting/proposals/7');
	const replies: Record<string, (args: any) => unknown> = {
		proposal_list: () => ({ ok: true, proposals: [], next: null }),
		proposal_get: () => {
			const { tally, ...row } = proposal;
			return { ok: true, proposal: row, tally, eligible: 3, votes: [], next: null, ...(releaseChange ? { release_change: releaseChange } : {}) };
		},
		department_list: () => ({ ok: true, departments: [{ id: 'Realm', is_root: true }] }),
		realm_info: () => ({ ok: true, realm: { timezone: 'Europe/Madrid' } }),
		codex_status: () =>
			unreadable ? { ok: false } : { ok: true, codex: running ? { id: RUNNING, chapters: running } : null, sync_sources: sources },
		legislation_chapter: ({ chapter }) => ({ ok: true, text: chapter === `sha256:${hexOf(OLD_TAX)}` ? OLD_TAX : '' }),
	};
	const ctx = {
		read: async (op: string, args: any) => (reads.push([op, args]), replies[op]?.(args) ?? { ok: false }),
		run: async () => ({ ok: false }),
		principal: writable('carla'),
		locale: writable(locale),
	};
	target = document.body.appendChild(document.createElement('div'));
	page = mount(Voting, { target, props: { ctx } });
	if (ready) await vi.waitFor(() => expect(target.querySelector(ready)).not.toBeNull(), { timeout: 3000 });
	await settle(); // the report, and a page that has nothing to show for the proposal
}

function closePage() {
	unmount(page);
	target.remove();
}

afterEach(() => {
	closePage();
	vi.unstubAllGlobals();
});

test('shows the summary, the chapters next to the running codex and the report, labelled as not checked by the realm', async () => {
	const list = JSON.stringify(changeList());
	await open({ proposal: proposal(codeAction(list)), files: { [CHANGE_LIST_URL]: list, [REPORT_URL]: REPORT } });
	expect(text('change-summary')).toBe('IBI 2027: large-family bonus');
	expect(text('change-chapters')).toMatch(/^eu\/es\/vc\/46250-valencia\/tax Changed \d+ bytes Show changes$/);
	expect(text('report-label')).toBe(en.report_label);
	expect(text('report-label')).toMatch(/^Not checked by the realm\./);
	expect(text('report-text')).toBe('# Analysis Newly allowed: urban IBI between 1.10 % and 1.24 % for capitals.');
	expect(text('change-stale')).toBeNull();
	// The chapter's own text is read when it is asked for, not before.
	expect(fetched).not.toContain(TAX_URL);
});

test('is in the language of the member when the change list has a summary in it', async () => {
	const list = JSON.stringify(changeList());
	await open({ proposal: proposal(codeAction(list)), files: { [CHANGE_LIST_URL]: list, [REPORT_URL]: REPORT }, locale: 'es' });
	expect(text('change-summary')).toBe('IBI 2027: bonificación por familia numerosa');
});

test('says a chapter the running codex lacks is new, and one it has unchanged is the same', async () => {
	const list = JSON.stringify(changeList());
	await open({
		proposal: proposal(codeAction(list)),
		files: { [CHANGE_LIST_URL]: list, [REPORT_URL]: REPORT },
		running: { 'eu/es/vc/46250-valencia/tax': { sha256: `sha256:${hexOf(NEW_TAX)}` } },
	});
	expect(text('change-chapters')).toMatch(/Unchanged/);
	unmount(page);
	target.remove();
	await open({ proposal: proposal(codeAction(list)), files: { [CHANGE_LIST_URL]: list, [REPORT_URL]: REPORT }, running: null });
	expect(text('change-chapters')).toMatch(/New/);
});

test('says nothing of how a chapter differs, and offers no diff, when what the realm runs is unknown', async () => {
	const list = JSON.stringify(changeList());
	await open({ proposal: proposal(codeAction(list)), files: { [CHANGE_LIST_URL]: list, [REPORT_URL]: REPORT }, unreadable: true });
	expect(text('change-chapters')).toMatch(/^eu\/es\/vc\/46250-valencia\/tax \d+ bytes$/);
	expect(text('change-stale')).toBeNull();
});

test('warns that a change list made for another codex would be refused as stale, while the proposal can still run', async () => {
	const list = JSON.stringify(changeList({ replaces: 'sha256:0000' }));
	await open({ proposal: proposal(codeAction(list)), files: { [CHANGE_LIST_URL]: list, [REPORT_URL]: REPORT } });
	expect(text('change-stale')).toBe(
		'The change list was made for codex sha256:0000, but the realm now runs sha256:4be1: the install would be refused as stale.',
	);
	unmount(page);
	target.remove();
	await open({ proposal: proposal(codeAction(list), 'executed'), files: { [CHANGE_LIST_URL]: list, [REPORT_URL]: REPORT } });
	expect(text('change-stale')).toBeNull();
});

test('shows no change list that is not the one the proposal pins', async () => {
	const list = JSON.stringify(changeList());
	await open({ proposal: proposal(codeAction(list)), files: { [CHANGE_LIST_URL]: list.replace('2027', '2028') } });
	expect(text('change-failure')).toBe('The change list cannot be shown: The file at the address is not the one the proposal pins.');
	expect(text('change-summary')).toBeNull();
});

test('says so when the change list cannot be reached', async () => {
	const list = JSON.stringify(changeList());
	await open({ proposal: proposal(codeAction(list)), files: {} });
	expect(text('change-failure')).toBe("The change list cannot be shown: The address could not be read from this browser. The realm's pages read only from some hosts.");
});

test('does not show a report that is not the file the change list names', async () => {
	const list = JSON.stringify(changeList());
	await open({ proposal: proposal(codeAction(list)), files: { [CHANGE_LIST_URL]: list, [REPORT_URL]: REPORT + 'Nothing to worry about.' } });
	expect(text('report-text')).toBeNull();
	expect(text('report')).toContain('The report cannot be shown: The file at the address is not the one the proposal pins.');
});

test('says when the proposal attached no report, and shows no summary it was not given', async () => {
	const list = JSON.stringify(changeList({ report: undefined, summary: {} }));
	await open({ proposal: proposal(codeAction(list)), files: { [CHANGE_LIST_URL]: list } });
	expect(text('report')).toContain('The proposal has no analysis report.');
	expect(text('legislation-change')).toContain('The change list gives no summary.');
});

test('names the chapters a change list removes', async () => {
	const list = JSON.stringify(changeList({ set: [], remove: ['eu/es/vc/46250-valencia/water'] }));
	await open({ proposal: proposal(codeAction(list)), files: { [CHANGE_LIST_URL]: list, [REPORT_URL]: REPORT } });
	expect(text('change-removes')).toBe('eu/es/vc/46250-valencia/water');
});

test('says what the install of a release does: the realm builds its change list when it runs', async () => {
	await open({ proposal: proposal({ op: 'codex_install', args: { source: 'eu/es', version: '2.4.0' } }), files: {} });
	expect(text('release-install')).toBe(
		'Installs release 2.4.0 of eu/es whole. The realm builds the change list from the record of the sync source that vouches for it when the install runs.',
	);
	expect(fetched.filter((url) => !url.includes('/i18n/'))).toEqual([]);
});

const RELEASE = { op: 'codex_install', args: { source: 'eu/es', version: '2.4.0' } };
const RUNS_2_6 = { 'eu/es/tax': { sha256: 'sha256:aa', source: 'eu/es', version: '2.6.0' } };
const SPAIN = (installable: unknown[]) => [{ source: 'ryjl3', name: 'Spain', layer: 'eu/es', compliance: 'compliant', installable, notes: [] }];

test('names the release of that layer the realm runs now next to the install of a release', async () => {
	await open({ proposal: proposal(RELEASE), files: {}, running: RUNS_2_6, sources: SPAIN([]) });
	expect(text('release-runs')).toBe('The realm runs eu/es 2.6.0 now.');
	expect(text('release-step-back')).toBeNull(); // no source says it is a step back
});

test('says so when the sync source marks the release a step back: it must not read to a voter as a plain install', async () => {
	const installable = [{ source: 'eu/es', version: '2.4.0', effective_from: 1, step_back: true }];
	await open({ proposal: proposal(RELEASE), files: {}, running: RUNS_2_6, sources: SPAIN(installable) });
	expect(text('release-step-back')).toBe(
		'This takes the realm back: eu/es 2.4.0 is older than 2.6.0, the release the realm runs now.',
	);
	expect(text('release-install')).toMatch(/^Installs release 2\.4\.0 of eu\/es whole\./); // what it does is still said
});

const CHANGE = (order: string, extra: Record<string, unknown> = {}) => ({
	source: 'eu/es',
	version: '2.4.0',
	runs: '2.6.0',
	published: 5,
	runs_published: 20,
	order,
	step_back: order === 'older',
	...extra,
});

test('marks an older release a member filed by hand, which no source offers: the realm says it takes the realm back', async () => {
	// No sync source lists it as installable (only newer releases are), so only the proposal's own comparison says so.
	await open({ proposal: proposal(RELEASE), files: {}, running: RUNS_2_6, sources: SPAIN([]), releaseChange: CHANGE('older') });
	expect(text('release-step-back')).toBe(
		'This takes the realm back: eu/es 2.4.0 is older than 2.6.0, the release the realm runs now.',
	);
	expect(text('release-runs')).toBe('The realm runs eu/es 2.6.0 now.');
	expect(text('release-unplaced')).toBeNull();
});

test('says it cannot tell, without a mark, when the release was published with what the realm runs or its time is not known', async () => {
	for (const [at, order] of ['tied', 'unknown'].entries()) {
		if (at) closePage(); // the page of the case before
		await open({ proposal: proposal(RELEASE), files: {}, running: RUNS_2_6, sources: SPAIN([]), releaseChange: CHANGE(order) });
		expect(text('release-step-back')).toBeNull();
		expect(text('release-unplaced')).toBe('The realm cannot tell whether eu/es 2.4.0 is older than 2.6.0, the release it runs now.');
	}
});

test('says nothing more of a newer release, or of the one the realm runs now', async () => {
	for (const [at, order] of ['newer', 'same'].entries()) {
		if (at) closePage();
		await open({ proposal: proposal(RELEASE), files: {}, running: RUNS_2_6, sources: SPAIN([]), releaseChange: CHANGE(order) });
		expect(text('release-step-back')).toBeNull();
		expect(text('release-unplaced')).toBeNull();
	}
});

test('is a step back when either the realm or a sync source says so, the safer rule: the sources\' mark stands when the realm says nothing, or newer', async () => {
	const marked = [{ source: 'eu/es', version: '2.4.0', effective_from: 1, step_back: true }];
	// a realm before the comparison: the sources' mark is all there is
	await open({ proposal: proposal(RELEASE), files: {}, running: RUNS_2_6, sources: SPAIN(marked), releaseChange: null });
	expect(text('release-step-back')).not.toBeNull();
	closePage();
	// the realm says the release is newer, a source marks it a step back: the warning is shown (either is enough)
	await open({ proposal: proposal(RELEASE), files: {}, running: RUNS_2_6, sources: SPAIN(marked), releaseChange: CHANGE('newer') });
	expect(text('release-step-back')).not.toBeNull();
	expect(text('release-unplaced')).toBeNull();
});

test('describes an action that names a release and a change list as the release, which is what the realm runs', async () => {
	// Filed before the realm refused the shape: it runs as the release, so a voter reads the release, not the change list.
	const list = JSON.stringify(changeList());
	const both = { op: 'codex_install', args: { source: 'eu/es', version: '2.4.0', url: CHANGE_LIST_URL, checksum: `sha256:${hexOf(list)}` } };
	await open({
		proposal: proposal(both),
		files: { [CHANGE_LIST_URL]: list, [REPORT_URL]: REPORT },
		running: RUNS_2_6,
		sources: SPAIN([]),
		releaseChange: CHANGE('older'),
	});
	expect(text('release-install')).toMatch(/^Installs release 2\.4\.0 of eu\/es whole\./);
	expect(text('release-step-back')).toBe('This takes the realm back: eu/es 2.4.0 is older than 2.6.0, the release the realm runs now.');
	expect(text('change-summary')).toBeNull(); // no change list is shown: the realm never reads it
	expect(fetched).not.toContain(CHANGE_LIST_URL);
});

test('marks only the release the source went back to, not another release of the layer', async () => {
	const installable = [{ source: 'eu/es', version: '2.4.0', effective_from: 1, step_back: true }];
	const other = { op: 'codex_install', args: { source: 'eu/es', version: '2.5.0' } };
	await open({ proposal: proposal(other), files: {}, running: RUNS_2_6, sources: SPAIN(installable) });
	expect(text('release-step-back')).toBeNull();
	expect(text('release-runs')).toBe('The realm runs eu/es 2.6.0 now.');
});

test('says what it can of an install of a release when the realm does not answer codex_status', async () => {
	await open({ proposal: proposal(RELEASE), files: {}, unreadable: true });
	expect(text('release-install')).toMatch(/^Installs release 2\.4\.0 of eu\/es whole\./);
	expect(text('release-runs')).toBeNull();
	expect(text('release-step-back')).toBeNull();
});

test('does not describe a package whose manifest is null as a release: the realm names a release only without a manifest key', async () => {
	// {source, version, manifest: null} is a package for the realm (the key is there), not a release: the page must not say
	// "Installs release 2.4.0 of eu/es" of what the realm will not install as one.
	const nullManifest = { op: 'codex_install', args: { source: 'eu/es', version: '2.4.0', manifest: null } };
	await open({ proposal: proposal(nullManifest), files: {}, running: RUNS_2_6, sources: SPAIN([]), ready: null });
	expect(text('release-install')).toBeNull();
	expect(text('release-step-back')).toBeNull();
	expect(text('legislation-change')).toBeNull(); // no change list, no release: the package block of the page
	expect(target.textContent).toContain('2.4.0');
	closePage();
	// the same with a manifest that is an empty string, and with a real release for contrast
	await open({ proposal: proposal({ ...nullManifest, args: { ...nullManifest.args, manifest: '' } }), files: {}, ready: null });
	expect(text('release-install')).toBeNull();
	closePage();
	await open({ proposal: proposal(RELEASE), files: {}, running: RUNS_2_6, sources: SPAIN([]) });
	expect(text('release-install')).not.toBeNull();
});

test('leaves an install of a codex package as it was', async () => {
	await open({ proposal: proposal({ op: 'codex_install', args: { codex: 'agora', version: '1.2.0' } }), files: {}, ready: null });
	expect(text('legislation-change')).toBeNull();
	expect(target.textContent).toContain('agora');
	expect(target.textContent).toContain('1.2.0');
});
