/**
 * Mock realm host for sandboxed extension development.
 *
 * Embeds the extension in a sandboxed iframe and runs createBridgeServer
 * with manifest-driven capabilities and entry_access enforcement.
 */
import { createBridgeServer, type HostState } from '@realmsgos/extension-bridge';

declare const __EXT_ID__: string;
declare const __EXT_IFRAME_URL__: string;
declare const __MANIFEST__: {
	runtime: string;
	sdk_version?: string;
	capabilities?: string[];
	entry_access?: { functions?: Record<string, string> };
};

const iframe = document.getElementById('ext-iframe') as HTMLIFrameElement;
const devLabel = document.getElementById('dev-label')!;
const bridgeLog = document.getElementById('bridge-log')!;
const navigateLog = document.getElementById('navigate-log')!;
const toastRoot = document.getElementById('toast-root')!;
const modalBackdrop = document.getElementById('modal-backdrop')!;
const modalTitle = document.getElementById('modal-title')!;
const modalBody = document.getElementById('modal-body')!;
const modalActions = document.getElementById('modal-actions')!;
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;

devLabel.textContent = `sandboxed · ${__EXT_ID__}`;

let hostTheme: 'light' | 'dark' = 'light';

const mockState = (): HostState => ({
	principal: 'aaaaa-aa-dev-mock-principal',
	locale: 'en',
	theme: hostTheme,
	realmInfo: {
		name: 'Dev Realm (mock)',
		welcomeMessage: 'Sandboxed extension dev host',
		manifesto: '',
		isQuarter: false,
		parentRealmCanisterId: '',
	},
});

function appendLog(list: HTMLElement, text: string) {
	const li = document.createElement('li');
	li.textContent = text;
	list.prepend(li);
	while (list.children.length > 50) {
		list.removeChild(list.lastChild!);
	}
}

function showToast(level: 'info' | 'success' | 'error', message: string) {
	const el = document.createElement('div');
	const colors = {
		info: 'bg-blue-600',
		success: 'bg-green-600',
		error: 'bg-red-600',
	};
	el.className = `pointer-events-auto rounded-lg px-4 py-2 text-sm text-white shadow-lg ${colors[level]}`;
	el.textContent = `[${level}] ${message}`;
	toastRoot.appendChild(el);
	setTimeout(() => el.remove(), 4000);
}

function showModal(payload: {
	title: string;
	body: string;
	actions: Array<{ id: string; label: string; tone?: string }>;
}): Promise<{ actionId: string }> {
	return new Promise((resolve) => {
		modalTitle.textContent = payload.title;
		modalBody.textContent = payload.body;
		modalActions.innerHTML = '';

		for (const action of payload.actions) {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.textContent = action.label;
			btn.className =
				action.tone === 'danger'
					? 'rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700'
					: action.tone === 'secondary'
						? 'rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
						: 'rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700';
			btn.addEventListener('click', () => {
				modalBackdrop.classList.add('hidden');
				modalBackdrop.classList.remove('flex');
				resolve({ actionId: action.id });
			});
			modalActions.appendChild(btn);
		}

		modalBackdrop.classList.remove('hidden');
		modalBackdrop.classList.add('flex');
	});
}

iframe.src = __EXT_IFRAME_URL__;

const server = createBridgeServer(iframe, {
	extensionId: __EXT_ID__,
	requiredSdkVersion: __MANIFEST__.sdk_version ?? '1',
	capabilities: __MANIFEST__.capabilities ?? [],
	entryAccessFunctions: __MANIFEST__.entry_access?.functions,
	getState: mockState,
	onHandshakeComplete: () => appendLog(bridgeLog, 'handshake complete'),
	onHandshakeFailed: (reason) => appendLog(bridgeLog, `handshake failed: ${reason}`),
	onCallExtension: async (fn, args) => {
		appendLog(bridgeLog, `call_extension(${fn}, ${JSON.stringify(args)})`);
		if (fn === 'greet') {
			const name = typeof args.name === 'string' ? args.name : 'World';
			return { message: `Hello, ${name}!` };
		}
		throw new Error(`Unknown function: ${fn}`);
	},
	onNavigate: (path) => {
		appendLog(navigateLog, path);
		appendLog(bridgeLog, `navigate(${path})`);
	},
	onNotify: (level, message) => {
		appendLog(bridgeLog, `notify(${level}, ${message})`);
		showToast(level, message);
	},
	onOpenModal: async (payload) => {
		appendLog(bridgeLog, `open_modal(${payload.title})`);
		return showModal(payload);
	},
	onResize: (height) => {
		iframe.style.height = `${Math.max(height, 200)}px`;
	},
});

themeSelect.value = hostTheme;
themeSelect.addEventListener('change', () => {
	hostTheme = themeSelect.value as 'light' | 'dark';
	document.documentElement.classList.toggle('dark', hostTheme === 'dark');
	server.pushState(mockState());
});

window.addEventListener('beforeunload', () => server.destroy());
