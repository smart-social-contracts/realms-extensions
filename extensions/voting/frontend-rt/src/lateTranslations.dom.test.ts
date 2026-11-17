// The translations can arrive after the person has started using the page (a slow connection, a locale
// switch). The texts must change in place: a page that starts over closes the vote being read and loses what
// was typed (realms-extensions#46). These tests mount the real page on a small fake realm.
import { mount, unmount } from 'svelte';
import { writable } from 'svelte/store';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import en from '../../frontend/i18n/locales/extensions/voting/en.json';
import es from '../../frontend/i18n/locales/extensions/voting/es.json';
import Voting from './Voting.svelte';

const proposal = {
	id: '1',
	title: 'Plant trees',
	description: 'In the park',
	proposer: 'alice',
	status: 'voting',
	opens_at: 1,
	deadline: 4102444800,
};
const replies: Record<string, unknown> = {
	proposal_list: { ok: true, proposals: [proposal], next: null },
	proposal_get: { ok: true, proposal, tally: { yes: 0, no: 0, abstain: 0 }, eligible: 3, votes: [] },
};

let target: HTMLElement;
let page: ReturnType<typeof mount>;
let locale: ReturnType<typeof writable<string>>;

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));
const button = (name: string) =>
	[...target.querySelectorAll('button')].find((b) => b.textContent?.trim() === name) as HTMLButtonElement;

beforeEach(async () => {
	// jsdom has no matchMedia, which the page asks for the width of the screen.
	window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
	// The texts of each language, the way the realm serves them.
	vi.stubGlobal('fetch', async (url: string) => ({
		ok: true,
		json: async () => (url.endsWith('/es.json') ? es : en),
	}));
	locale = writable('en');
	const ctx = {
		read: async (op: string) => replies[op] ?? { ok: false },
		run: async () => ({ ok: false }),
		principal: writable('bob'),
		locale,
	};
	target = document.body.appendChild(document.createElement('div'));
	page = mount(Voting, { target, props: { ctx } });
	await settle();
});

afterEach(() => {
	unmount(page);
	target.remove();
	vi.unstubAllGlobals();
});

test('the vote being read stays open, in the new language', async () => {
	button('View').click();
	await settle();
	const back = button('Back to proposals');
	expect(back).toBeTruthy();
	expect(button(en.vote_yes)).toBeTruthy();

	locale.set('es');
	await settle();

	expect(back.isConnected).toBe(true);
	expect(button('Back to proposals')).toBe(back);
	expect(button(es.vote_yes)).toBeTruthy();
	expect(button(en.vote_yes)).toBeUndefined();
});

test('what was typed in the form stays, in the new language', async () => {
	button(en.submit_proposal).click();
	await settle();
	const title = target.querySelector<HTMLInputElement>('#rt-title')!;
	title.value = 'Plant more trees';
	title.dispatchEvent(new Event('input', { bubbles: true }));

	locale.set('es');
	await settle();

	expect(title.isConnected).toBe(true);
	expect(target.querySelector<HTMLInputElement>('#rt-title')).toBe(title);
	expect(title.value).toBe('Plant more trees');
	expect(button(es.submit_proposal)).toBeTruthy();
});
