/**
 * Mount an extension's screen in its sandboxed iframe, with the `ctx` an in-page screen was given.
 *
 * The screen reaches the realm only through its own backend: `ctx.read(fn, args)` runs a backend function as a
 * query (the realm's `extension_read`, free, read operations only) and `ctx.run(fn, args)` as an update
 * (`extension_call`). A backend written by realms-gos `scripts/extension_backend.py` has one function per declared
 * operation, by the operation's name, so `ctx.read('treasury_view')` reads the treasury as it did in the page. Each
 * resolves to the function's result, a realm reply `{ ok, ... }`, and never throws: a call the realm or the bridge
 * refuses resolves to `{ ok: false, error }`.
 *
 * The rest of `ctx` is the host's, through the bridge: `notify`, `navigate`, `openModal`, and the member's
 * `principal`, `locale` and `isAuthenticated` as stores. `userProfiles` is read from the backend's `me` when the
 * extension declares it. The frame follows the host's theme and colour, and reports its height.
 */
import { mount, type Component } from 'svelte';
import { writable, type Readable } from 'svelte/store';
import { createExtensionClient, type ExtensionClient } from '@realmsgos/extension-bridge';

export type Reply = { ok: boolean; error?: string; [key: string]: any };

export interface SandboxContext {
	extensionId: string;
	read: (fn: string, args?: Record<string, unknown>) => Promise<Reply>;
	run: (fn: string, args?: Record<string, unknown>) => Promise<Reply>;
	notify: (level: 'info' | 'success' | 'error', message: string) => void;
	navigate: (path: string) => void;
	openModal: ExtensionClient['openModal'];
	principal: Readable<string>;
	locale: Readable<string>;
	isAuthenticated: Readable<boolean>;
	userProfiles: Readable<string[]>;
	theme: { cn: (...classes: unknown[]) => string };
	config: Record<string, unknown>;
	client: ExtensionClient;
}

async function settle(call: Promise<unknown>, fn: string): Promise<Reply> {
	try {
		const out = await call;
		if (out && typeof out === 'object' && 'ok' in (out as object)) return out as Reply;
		return { ok: true, result: out };
	} catch (e) {
		const err = e as { message?: string; code?: string };
		const reply: Reply = { ok: false, error: err?.message ?? `${fn} failed` };
		if (err?.code === 'denied') reply.denied = true;
		return reply;
	}
}

function profilesFrom(client: ExtensionClient): Readable<string[]> {
	const store = writable<string[]>([], (set) => {
		void settle(client.read('me'), 'me').then((me) => {
			const profiles = me.ok ? me.user?.profiles : null;
			if (Array.isArray(profiles)) set(profiles.map(String));
		});
	});
	return { subscribe: store.subscribe };
}

export async function mountSandboxed(
	Screen: Component<{ ctx: SandboxContext }>,
	target: HTMLElement = document.getElementById('app')!,
): Promise<SandboxContext> {
	const client = await createExtensionClient();
	const principal = writable('');
	const locale = writable('en');
	const isAuthenticated = writable(false);
	client.onStateChange((state) => {
		principal.set(state.principal || '');
		isAuthenticated.set(!!state.principal);
		locale.set(state.locale || 'en');
		document.documentElement.classList.toggle('dark', state.theme === 'dark');
		document.documentElement.dataset.theme = state.theme;
	});
	const ctx: SandboxContext = {
		extensionId: client.extensionId,
		read: (fn, args = {}) => settle(client.read(fn, args), fn),
		run: (fn, args = {}) => settle(client.run(fn, args), fn),
		notify: (level, message) => client.notify(level, message),
		navigate: (path) => client.navigate(path),
		openModal: (options) => client.openModal(options),
		principal: { subscribe: principal.subscribe },
		locale: { subscribe: locale.subscribe },
		isAuthenticated: { subscribe: isAuthenticated.subscribe },
		userProfiles: profilesFrom(client),
		theme: { cn: (...classes) => classes.filter(Boolean).join(' ') },
		config: {},
		client,
	};
	mount(Screen, { target, props: { ctx } });
	const report = () => client.reportHeight(Math.ceil(document.documentElement.scrollHeight));
	new ResizeObserver(report).observe(document.body);
	report();
	return ctx;
}
