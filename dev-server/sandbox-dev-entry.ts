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
const modalBackdrop = document.getElementById('modal-backdrop')!;
const modalTitle = document.getElementById('modal-title')!;
const modalBody = document.getElementById('modal-body')!;
const modalActions = document.getElementById('modal-actions')!;
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;

devLabel.textContent = `sandboxed · ${__EXT_ID__}`;

let hostTheme: 'light' | 'dark' = 'light';

type ModalAction = { id: string; label: string; tone?: string };
type ModalPayload = { title: string; body: string; actions: ModalAction[] };

type QueuedModal = {
	payload: ModalPayload;
	resolve: (result: { actionId: string }) => void;
};

const modalQueue: QueuedModal[] = [];
let modalOpen = false;

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

function showModal(payload: ModalPayload): Promise<{ actionId: string }> {
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
		void showModal({
			title: notifyTitle(level),
			body: message,
			actions: [{ id: 'close', label: 'Close', tone: level === 'error' ? 'secondary' : 'primary' }],
		});
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
