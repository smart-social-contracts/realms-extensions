/**
 * Shared dev entry point for all runtime extensions.
 *
 * Reads the extension's index.ts mount function, creates a real
 * RealmExtensionContext backed by the test canister, and mounts.
 *
 * The extension ID is passed via the __EXT_ID__ define replacement
 * injected by the CLI launcher.
 */
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './realm_backend.did.js';

declare const __EXT_ID__: string;
declare const __BACKEND_CANISTER_ID__: string;
declare const __FILE_REGISTRY_CANISTER_ID__: string;
declare const __DEV_LOCALE__: string;

function resolveDevLocale(): string {
	const fromQuery = new URLSearchParams(window.location.search).get('locale');
	if (fromQuery && fromQuery.trim()) return fromQuery.trim();
	return (typeof __DEV_LOCALE__ === 'string' && __DEV_LOCALE__.trim()) || 'en';
}

type ModalAction = { id: string; label: string; tone?: string };
type ModalPayload = { title: string; body: string; actions: ModalAction[] };

const modalBackdrop = document.getElementById('modal-backdrop')!;
const modalTitle = document.getElementById('modal-title')!;
const modalBody = document.getElementById('modal-body')!;
const modalActions = document.getElementById('modal-actions')!;

type QueuedModal = {
	payload: ModalPayload;
	resolve: (result: { actionId: string }) => void;
};

const modalQueue: QueuedModal[] = [];
let modalOpen = false;

function actionButtonClass(tone?: string): string {
	if (tone === 'danger') {
		return 'rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700';
	}
	if (tone === 'secondary') {
		return 'rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50';
	}
	return 'rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700';
}

function drainModalQueue() {
	if (modalOpen || modalQueue.length === 0) return;
	const { payload, resolve } = modalQueue.shift()!;
	modalOpen = true;
	modalTitle.textContent = payload.title;
	modalBody.textContent = payload.body;
	modalActions.innerHTML = '';
	for (const action of payload.actions) {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.textContent = action.label;
		btn.className = actionButtonClass(action.tone);
		btn.addEventListener('click', () => {
			modalBackdrop.classList.add('hidden');
			modalBackdrop.classList.remove('flex');
			modalOpen = false;
			resolve({ actionId: action.id });
			drainModalQueue();
		});
		modalActions.appendChild(btn);
	}
	modalBackdrop.classList.remove('hidden');
	modalBackdrop.classList.add('flex');
}

function enqueueModal(payload: ModalPayload): Promise<{ actionId: string }> {
	return new Promise((resolve) => {
		modalQueue.push({ payload, resolve });
		drainModalQueue();
	});
}

function notifyTitle(level: 'info' | 'success' | 'error'): string {
	if (level === 'error') return 'Something went wrong';
	if (level === 'info') return 'Notice';
	return 'Done';
}

function readableOf<T>(value: T) {
	const subs = new Set<(v: T) => void>();
	return {
		subscribe(fn: (v: T) => void) {
			fn(value);
			subs.add(fn);
			return () => subs.delete(fn);
		},
		set(v: T) {
			value = v;
			subs.forEach((fn) => fn(v));
		},
	};
}

async function main() {
	const agent = new HttpAgent({ verifyQuerySignatures: false });
	const backend = Actor.createActor(idlFactory, {
		agent,
		canisterId: __BACKEND_CANISTER_ID__,
	});

	const ctx = {
		extensionId: __EXT_ID__,
		version: 'dev',
		backend,

		async callSync(fn: string, args?: Record<string, unknown>) {
			const raw = await (backend as any).extension_sync_call(
				__EXT_ID__, fn, JSON.stringify(args || {}),
			);
			const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (res?.success === false) throw new Error(res.response ?? 'extension_sync_call failed');
			if (!res?.response) return res;
			try { return JSON.parse(res.response); } catch { return res.response; }
		},
		async callAsync(fn: string, args?: Record<string, unknown>) {
			const raw = await (backend as any).extension_async_call(
				__EXT_ID__, fn, JSON.stringify(args || {}),
			);
			const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (res?.success === false) throw new Error(res.response ?? 'extension_async_call failed');
			if (!res?.response) return res;
			try { return JSON.parse(res.response); } catch { return res.response; }
		},

		principal: readableOf(''),
		isAuthenticated: readableOf(false),
		userProfiles: readableOf([] as string[]),

		realmInfo: readableOf({
			name: '',
			welcomeMessage: '',
			manifesto: '',
			registries: [],
			quarters: [],
			isQuarter: false,
			parentRealmCanisterId: '',
			loading: true,
			error: null,
		}),

		config: {
			ckbtc_ledger_canister_id: '',
			ckbtc_indexer_canister_id: '',
			token_backend_canister_id: '',
			canisterId: __BACKEND_CANISTER_ID__,
			fileRegistryCanisterId: __FILE_REGISTRY_CANISTER_ID__,
		},

		navigate: async (path: string) => {
			console.log('[dev] navigate:', path);
		},

		notify(level: 'info' | 'success' | 'error', message: string) {
			void enqueueModal({
				title: notifyTitle(level),
				body: message,
				actions: [{ id: 'close', label: 'Close', tone: level === 'error' ? 'secondary' : 'primary' }],
			});
		},

		openModal(payload: ModalPayload) {
			return enqueueModal(payload);
		},

		t: readableOf((key: string) => key),
		locale: readableOf(resolveDevLocale()),

		notifications: {
			items: readableOf([]),
			unreadCount: readableOf(0),
			load: async () => {},
			markAsRead: async () => {},
		},

		theme: {
			cn: (...classes: (string | undefined | null | false)[]) =>
				classes.filter(Boolean).join(' '),
		},

		ui: {
			AccessDenied: null as any,
			accessDeniedOperation: () => null,
			MonacoEditor: null as any,
			MonacoDiffEditor: null as any,
		},

		host: {
			focus: readableOf(null),
			setFocus: () => {},
			dispatch: (action: { type: string }) => {
				console.log('[dev] host.dispatch:', action);
			},
			pendingPrompt: readableOf(null),
		},
	};

	const mountModule = await import(/* @vite-ignore */ `/__ext_index__`);
	const mount = mountModule.default;
	const target = document.getElementById('ext-mount')!;
	document.getElementById('dev-label')!.textContent = `dev · ${__EXT_ID__}`;
	mount(target, ctx);
}

main().catch(console.error);
