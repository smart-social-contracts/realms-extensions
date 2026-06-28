<script lang="ts">
	import { onMount, tick } from 'svelte';

	let { ctx }: { ctx: any } = $props();

	const FILE_REGISTRY_NETWORK: Record<string, string> = {
		'vi64l-3aaaa-aaaae-qj4va-cai': 'demo',
		'uq2mu-kaaaa-aaaah-avqcq-cai': 'test',
		'iebdk-kqaaa-aaaau-agoxq-cai': 'staging',
	};

	function resolveGeisterNetwork(): string {
		const fromConfig = ctx.config?.network;
		if (fromConfig && fromConfig !== 'ic') return fromConfig;
		const ids = (globalThis as { __CANISTER_IDS?: { network?: string; file_registry?: string } })
			.__CANISTER_IDS;
		if (ids?.network && ids.network !== 'ic') return ids.network;
		const fileRegistry =
			ctx.config?.fileRegistryCanisterId || ids?.file_registry || '';
		if (fileRegistry && FILE_REGISTRY_NETWORK[fileRegistry]) {
			return FILE_REGISTRY_NETWORK[fileRegistry];
		}
		return window.location.hostname.includes('icp0.io') ? 'test' : 'staging';
	}

	interface ChatMessage {
		text: string;
		isUser: boolean;
		thinking?: string;
	}

	interface AssistantPersona {
		id: string;
		name: string;
		emoji: string;
		description: string;
		type: string;
	}

	let messages: ChatMessage[] = $state([]);
	let newMessage = $state('');
	let isLoading = $state(false);
	let loadingStatus = $state('');
	let streamHasContent = $state(false);
	let backendAwake = $state(
		typeof sessionStorage !== 'undefined' &&
			sessionStorage.getItem('llm-chat-backend-awake') === '1',
	);
	let error = $state('');
	let messagesContainer: HTMLElement | undefined = $state();
	let suggestions: string[] = $state([]);
	let isLoadingSuggestions = $state(false);
	let textareaElement: HTMLTextAreaElement | undefined = $state();

	let availableAssistants: AssistantPersona[] = $state([]);
	let selectedAssistant: AssistantPersona | null = $state(null);
	let isLoadingAssistants = $state(false);
	let copiedIndex: number | null = $state(null);
	let chatRootElement: HTMLDivElement | undefined = $state();
	let chatHeight = $state('100%');

	let pendingExplainCodexId: string | null = $state(null);
	let isExplainMode = $state(false);
	let currentFocus: {
		uri: string;
		label?: string;
		snapshot?: { languageId: string; range: { startLine: number; endLine: number }; text: string };
	} | null = $state(null);
	let lastPendingPromptId = $state(0);

	let unsubPendingPrompt: (() => void) | undefined;
	let unsubFocus: (() => void) | undefined;

	// Conversation history
	interface Conversation {
		conversation_id: string;
		title: string;
		persona: string;
		message_count: number;
		updated_at: string;
	}
	let conversationId: string | null = $state(null);
	let conversations: Conversation[] = $state([]);
	let showHistory = $state(false);
	let isLoadingHistory = $state(false);

	const PRODUCTION_API_HOST = 'https://geister-api.realmsgos.dev/';
	const CHAT_REQUEST_TIMEOUT_MS = 360_000;
	let API_URL = `${PRODUCTION_API_HOST}api/ask`;
	let SUGGESTIONS_API_URL = `${PRODUCTION_API_HOST}suggestions`;
	let ASSISTANTS_API_URL = `${PRODUCTION_API_HOST}api/personas/assistants`;
	let CONVERSATIONS_API_URL = `${PRODUCTION_API_HOST}api/conversations`;

	function extractCodexIdFromUri(uri: string | undefined): string | null {
		if (!uri) return null;
		const match = uri.match(/^realms:\/\/codex_viewer\/codex\/([^?]+)/);
		if (!match) return null;
		try {
			return decodeURIComponent(match[1]);
		} catch {
			return match[1];
		}
	}

	function extractProposalIdFromUri(uri: string | undefined): string | null {
		if (!uri) return null;
		const match = uri.match(/^realms:\/\/voting\/proposal\/([^?#]+)/);
		if (!match) return null;
		try {
			return decodeURIComponent(match[1]);
		} catch {
			return match[1];
		}
	}

	function applyPendingPrompt(prompt: { message: string; autoSend: boolean; id: number } | null) {
		if (!prompt || prompt.id === lastPendingPromptId) return;
		lastPendingPromptId = prompt.id;
		newMessage = prompt.message;
		isExplainMode = true;
		if (prompt.autoSend) {
			setTimeout(() => void sendMessage(), 150);
		} else {
			void tick().then(autoResizeTextarea);
		}
	}

	function explainCurrentFocus() {
		const proposalId = extractProposalIdFromUri(currentFocus?.uri);
		if (proposalId) {
			ctx.host?.dispatch?.({
				type: 'assistant.prompt',
				message:
					'Explain this proposal — its purpose, governance impact, and the main code or policy changes.',
				autoSend: true,
			});
			return;
		}
		ctx.host?.dispatch?.({ type: 'assistant.prompt', autoSend: true });
	}

	function subscribeHostBridge() {
		unsubPendingPrompt = ctx.host?.pendingPrompt?.subscribe?.(applyPendingPrompt);
		unsubFocus = ctx.host?.focus?.subscribe?.((focus: typeof currentFocus) => {
			currentFocus = focus;
		});
	}

	function classifyChatError(err: unknown, httpStatus?: number): string {
		if (httpStatus === 503 && err instanceof Error && err.message) {
			const msg = err.message.toLowerCase();
			if (
				msg.includes('pod') ||
				msg.includes('llm backend') ||
				msg.includes('ollama') ||
				msg.includes('waking up') ||
				msg.includes('still starting')
			) {
				return 'The AI assistant is still waking up. Please try again in a few minutes.';
			}
			return err.message;
		}
		if (httpStatus === 502 || httpStatus === 530) {
			return 'The AI backend is temporarily offline. Please try again in a few minutes.';
		}
		if (httpStatus === 504 || httpStatus === 524) {
			return 'The request timed out before the server could respond. Please try again.';
		}
		if (httpStatus && httpStatus >= 500) {
			return 'Server error. Please try again later.';
		}
		if (err instanceof DOMException && err.name === 'TimeoutError') {
			return 'The request timed out before the server could respond. Please try again.';
		}
		if (err instanceof Error && err.name === 'AbortError') {
			return 'The request timed out before the server could respond. Please try again.';
		}
		if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
			return 'Could not reach the AI service. Check your network or try again shortly.';
		}
		if (err instanceof Error && err.message.includes('HTTP error')) {
			return classifyChatError(err, Number(err.message.match(/Status:\s*(\d+)/)?.[1]));
		}
		return 'Failed to get a response. Please try again.';
	}

	function isLlmBackendError(text: string): boolean {
		const normalized = text.toLowerCase();
		return (
			normalized.includes('llm backend') ||
			normalized.includes('cannot reach ollama') ||
			normalized.includes('ollama at')
		);
	}

	function markBackendAwake() {
		backendAwake = true;
		try {
			sessionStorage.setItem('llm-chat-backend-awake', '1');
		} catch {}
	}

	function markBackendAsleep() {
		backendAwake = false;
		try {
			sessionStorage.removeItem('llm-chat-backend-awake');
		} catch {}
	}

	function isWakingUpError(message: string): boolean {
		const normalized = message.toLowerCase();
		return normalized.includes('waking up') || normalized.includes('still starting');
	}

	function resetStreamingState() {
		loadingStatus = '';
		streamHasContent = false;
	}

	function upsertStreamingAssistant(text: string, thinking: string) {
		// Only hide the loading indicator once visible answer text arrives.
		// Thinking-only chunks should not count as streamed content.
		if (text.trim()) {
			streamHasContent = true;
			loadingStatus = '';
		}
		const payload: ChatMessage = {
			text,
			isUser: false,
			...(thinking.trim() ? { thinking } : {}),
		};
		const last = messages[messages.length - 1];
		if (!last || last.isUser) {
			messages = [...messages, payload];
		} else {
			messages = messages.map((msg, index) =>
				index === messages.length - 1 ? { ...msg, ...payload } : msg,
			);
		}
		void tick().then(scrollToBottom);
	}

	function handleStreamEvent(parsed: Record<string, unknown>, state: { text: string; thinking: string }) {
		const eventType = typeof parsed.type === 'string' ? parsed.type : parsed.text ? 'text' : '';
		const chunk = typeof parsed.text === 'string' ? parsed.text : '';

		if (eventType === 'status' && chunk) {
			markBackendAwake();
			loadingStatus = chunk;
			return;
		}
		if (eventType === 'thinking' && chunk) {
			markBackendAwake();
			state.thinking += chunk;
			upsertStreamingAssistant(state.text, state.thinking);
			return;
		}
		if (chunk) {
			markBackendAwake();
			state.text += chunk;
			upsertStreamingAssistant(state.text, state.thinking);
		}
	}

	let REALM_CANISTER_ID = '';
	let userPrincipal = '';

	let unsubPrincipal: (() => void) | undefined;
	let unsubAuth: (() => void) | undefined;
	let isAuthenticated = $state(false);

	// Whether this instance is mounted in the sidebar panel or on the full extension page
	// ctx is a prop object that doesn't change; reading sidebarPanel once at mount is intentional.
	// eslint-disable-next-line svelte/reactivity
	const isSidebarPanel = !!(ctx as any).sidebarPanel;

	// Persisted user preferences
	const PREFS_KEY = 'llm_chat_prefs';
	function loadPrefs() {
		try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch { return {}; }
	}
	function savePrefs(p: Record<string, any>) {
		try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {}
	}

	const _prefs = loadPrefs();
	let prefDefaultAssistant: string = $state(_prefs.defaultAssistant || '');
	let prefShowSuggestions: boolean = $state(_prefs.showSuggestions !== false);
	let prefSharePageContext: boolean = $state(_prefs.sharePageContext !== false);

	$effect(() => {
		savePrefs({ defaultAssistant: prefDefaultAssistant, showSuggestions: prefShowSuggestions, sharePageContext: prefSharePageContext });
	});

	// Settings page state
	let apiStatus: 'unknown' | 'online' | 'offline' = $state('unknown');
	let clearingHistory = $state(false);
	let historyCleared = $state(false);

	async function checkApiStatus() {
		try {
			const res = await fetch(`${PRODUCTION_API_HOST}api/personas/assistants`, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
			apiStatus = res.ok ? 'online' : 'offline';
		} catch { apiStatus = 'offline'; }
	}

	async function clearAllHistory() {
		if (!userPrincipal || !isAuthenticated) return;
		clearingHistory = true;
		try {
			await fetchConversations();
			await Promise.all(conversations.map(c =>
				fetch(`${CONVERSATIONS_API_URL}/${c.conversation_id}`, { method: 'DELETE' })
			));
			conversations = [];
			messages = [];
			conversationId = null;
			historyCleared = true;
			setTimeout(() => { historyCleared = false; }, 2000);
		} catch {}
		finally { clearingHistory = false; }
	}

	onMount(async () => {
		const runtimeBackend =
			(globalThis as { __CANISTER_IDS?: { realm_backend?: string } }).__CANISTER_IDS
				?.realm_backend || '';
		const configBackend = ctx.config?.canisterId || '';
		// Prefer runtime canister_ids.js over build-time declarations passed by the host.
		REALM_CANISTER_ID = runtimeBackend || configBackend;
		unsubPrincipal = ctx.principal?.subscribe?.((v: string) => {
			userPrincipal = v || '';
		});
		unsubAuth = ctx.isAuthenticated?.subscribe?.((v: boolean) => {
			isAuthenticated = v;
		});

		// Full-page chat: size from visualViewport so the keyboard doesn't clip the input.
		// Sidebar panel: fill the host panel via CSS (100%) — the panel handles viewport sizing.
		if (!isSidebarPanel) {
			const vv = window.visualViewport;
			if (vv) {
				const updateHeight = () => {
					const top = chatRootElement?.getBoundingClientRect().top ?? vv.offsetTop;
					const available = Math.max(Math.round(vv.height - top), 200);
					chatHeight = `${available}px`;
				};
				await tick();
				updateHeight();
				vv.addEventListener('resize', updateHeight);
				vv.addEventListener('scroll', updateHeight);
				window.addEventListener('resize', updateHeight);
				(window as any).__chatVpCleanup = () => {
					vv.removeEventListener('resize', updateHeight);
					vv.removeEventListener('scroll', updateHeight);
					window.removeEventListener('resize', updateHeight);
				};
			}
		}

		handleExplainParam();
		subscribeHostBridge();
		await fetchAssistants();
		// Apply saved default assistant preference
		if (prefDefaultAssistant && availableAssistants.length > 0) {
			const match = availableAssistants.find(a => a.id === prefDefaultAssistant);
			if (match) selectedAssistant = match;
		}
		if (!isExplainMode && prefShowSuggestions) {
			await fetchSuggestions();
		}
		if (!isSidebarPanel) {
			checkApiStatus();
			if (isAuthenticated) await fetchConversations();
		}
	});

	function handleExplainParam() {
		try {
			const params = new URLSearchParams(window.location.search);
			const explain = params.get('explain');
			if (!explain) return;

			const [objType, objId] = explain.split(':');
			if (objType === 'codex' && objId) {
				isExplainMode = true;
			ctx.backend
				.extension_sync_call('codex_viewer', 'get_codex_details', JSON.stringify({ codex_id: objId }))
					.then((response: any) => {
						if (response.success) {
							const data =
								typeof response.response === 'string'
									? JSON.parse(response.response)
									: response.response;
							const codexName = data.codex?.name || `codex_${objId}`;
							const codexLink = `/extensions/codex_viewer/${objId}`;
							pendingExplainCodexId = objId;
							newMessage = `Please explain this codex: [${codexName}](${codexLink})`;
							setTimeout(() => sendMessage(), 300);
						}
					})
					.catch((err: any) => {
						console.error('Failed to fetch codex for explanation:', err);
						isExplainMode = false;
					});
			} else if (objType === 'financial_statements') {
				isExplainMode = true;
				const context = params.get('context') || '';
				newMessage = `Please explain the following financial statements of this realm in plain language. Highlight key insights, any concerns, and the overall financial health:\n\n${context}`;
				setTimeout(() => sendMessage(), 300);
			}
		} catch (err) {
			console.error('Error handling explain param:', err);
		}
	}

	$effect(() => {
		messages;
		tick().then(scrollToBottom);
	});

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	async function fetchAssistants(): Promise<void> {
		if (isLoadingAssistants) return;
		isLoadingAssistants = true;
		try {
			const response = await fetch(ASSISTANTS_API_URL, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const data = await response.json();
			if (data.assistants && Array.isArray(data.assistants)) {
				availableAssistants = data.assistants;
				if (availableAssistants.length > 0 && !selectedAssistant) {
					selectedAssistant = availableAssistants[0];
				}
			}
		} catch (err) {
			console.error('Error fetching assistants:', err);
		} finally {
			isLoadingAssistants = false;
		}
	}

	async function fetchSuggestions(): Promise<void> {
		if (isLoadingSuggestions) return;
		isLoadingSuggestions = true;
		try {
			const params = new URLSearchParams({
				user_principal: userPrincipal || '',
				realm_principal: REALM_CANISTER_ID || '',
				persona: selectedAssistant?.id || 'ashoka',
			});
			const response = await fetch(`${SUGGESTIONS_API_URL}?${params.toString()}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const data = await response.json();
			if (data.suggestions && Array.isArray(data.suggestions)) {
				suggestions = data.suggestions;
			}
		} catch (err) {
			console.error('Error fetching suggestions:', err);
		} finally {
			isLoadingSuggestions = false;
		}
	}

	async function sendMessage(): Promise<void> {
		if (!newMessage.trim()) return;

		error = '';
		messages = [...messages, { text: newMessage, isUser: true }];
		const messageToSend = newMessage;
		newMessage = '';
		isLoading = true;
		resetStreamingState();
		loadingStatus = backendAwake ? 'Thinking…' : '';

		try {
			await ensureConversation();
			const geisterNetwork = resolveGeisterNetwork();

			const payload: Record<string, any> = {
				question: messageToSend,
				realm_principal: REALM_CANISTER_ID,
				user_principal: userPrincipal,
				stream: true,
				verbosity: 1,
				persona: selectedAssistant?.id || 'ashoka',
				network: geisterNetwork,
				...(conversationId ? { conversation_id: conversationId } : {}),
			};

			if (pendingExplainCodexId) {
				payload.explain_codex_id = pendingExplainCodexId;
				pendingExplainCodexId = null;
			} else {
				const codexId = extractCodexIdFromUri(currentFocus?.uri);
				if (codexId) payload.explain_codex_id = codexId;
			}

			const proposalId = extractProposalIdFromUri(currentFocus?.uri);
			if (proposalId) {
				payload.explain_proposal_id = proposalId;
				payload.page_context = {
					pathname: typeof window !== 'undefined' ? window.location.pathname : '',
					extensionId: 'voting',
					title: currentFocus?.label || 'Proposal',
					proposalId,
				};
			}

			if (currentFocus) {
				payload.focus = {
					uri: currentFocus.uri,
					label: currentFocus.label,
				};
			}

			const response = await fetch(API_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
				body: JSON.stringify(payload),
				signal: AbortSignal.timeout(CHAT_REQUEST_TIMEOUT_MS),
			});

			if (!response.ok) {
				let detail = '';
				try {
					const body = await response.json();
					detail = typeof body?.error === 'string' ? body.error : '';
				} catch {
					// ignore non-JSON error bodies
				}
				if (detail) {
					throw Object.assign(new Error(detail), { httpStatus: response.status });
				}
				throw Object.assign(new Error(`HTTP error! Status: ${response.status}`), {
					httpStatus: response.status,
				});
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('Response body is not readable');

			const decoder = new TextDecoder();
			const streamState = { text: '', thinking: '' };

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					const lines = chunk.split('\n');
					for (const line of lines) {
						if (line.startsWith('data: ')) {
							const pl = line.slice(6);
							if (pl === '[DONE]') continue;
							try {
								handleStreamEvent(JSON.parse(pl), streamState);
							} catch {
								streamState.text += pl;
								upsertStreamingAssistant(streamState.text, streamState.thinking);
							}
						} else if (line.trim() && !line.startsWith(':')) {
							streamState.text += line;
							upsertStreamingAssistant(streamState.text, streamState.thinking);
						}
					}
				}
			} finally {
				reader.releaseLock();
			}

			const accumulatedText = streamState.text;
			const accumulatedThinking = streamState.thinking;

			if (!accumulatedText.trim()) {
				if (messages.length > 0 && !messages[messages.length - 1].isUser) {
					messages = messages.map((msg, index) =>
						index === messages.length - 1
							? { ...msg, text: 'No response from LLM' }
							: msg,
					);
				} else {
					messages = [...messages, { text: 'No response from LLM', isUser: false }];
				}
			} else if (isLlmBackendError(accumulatedText)) {
				error = 'The AI backend is temporarily offline. Please try again in a few minutes.';
				markBackendAsleep();
			} else if (accumulatedText.trim()) {
				markBackendAwake();
			}

			isLoading = false;
			resetStreamingState();
			isExplainMode = false;
			await fetchSuggestions();
		} catch (err: any) {
			console.error('Error calling LLM:', err);
			error = classifyChatError(err, err?.httpStatus);
			if (isWakingUpError(error)) {
				markBackendAsleep();
			}
			if (messages.length > 0 && !messages[messages.length - 1].isUser) {
				messages = messages.slice(0, -1);
			}
		} finally {
			isLoading = false;
			resetStreamingState();
			isExplainMode = false;
		}
	}

	function dismissError() {
		error = '';
	}

	async function fetchConversations(): Promise<void> {
		if (!userPrincipal || !isAuthenticated) return;
		isLoadingHistory = true;
		try {
			const params = new URLSearchParams({ user_principal: userPrincipal, realm_principal: REALM_CANISTER_ID });
			const res = await fetch(`${CONVERSATIONS_API_URL}?${params}`, { headers: { 'Content-Type': 'application/json' } });
			if (!res.ok) return;
			const data = await res.json();
			conversations = (data.conversations || []).sort((a: Conversation, b: Conversation) =>
				new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
			);
		} catch {}
		finally { isLoadingHistory = false; }
	}

	async function loadConversation(conv: Conversation): Promise<void> {
		showHistory = false;
		messages = [];
		conversationId = conv.conversation_id;
		// Set matching assistant if known
		const match = availableAssistants.find(a => a.id === conv.persona);
		if (match) selectedAssistant = match;
		try {
			const res = await fetch(`${CONVERSATIONS_API_URL}/${conv.conversation_id}/messages`, { headers: { 'Content-Type': 'application/json' } });
			if (!res.ok) return;
			const data = await res.json();
			messages = normalizeHistoryMessages(data.messages || []);
			if (messages.some((m) => !m.isUser)) {
				markBackendAwake();
			}
			await tick();
			scrollToBottom();
		} catch {}
	}

	async function startNewConversation(): Promise<void> {
		showHistory = false;
		messages = [];
		conversationId = null;
		error = '';
		suggestions = [];
		await fetchSuggestions();
	}

	async function deleteConversation(id: string, e: Event): Promise<void> {
		e.stopPropagation();
		try {
			await fetch(`${CONVERSATIONS_API_URL}/${id}`, { method: 'DELETE' });
			conversations = conversations.filter(c => c.conversation_id !== id);
			if (conversationId === id) { messages = []; conversationId = null; }
		} catch {}
	}

	async function openHistory(): Promise<void> {
		showHistory = true;
		await fetchConversations();
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - d.getTime();
		const diffDays = Math.floor(diffMs / 86400000);
		if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
		return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
	}

	async function ensureConversation(): Promise<void> {
		if (conversationId || !userPrincipal || !isAuthenticated) return;
		try {
			const res = await fetch(CONVERSATIONS_API_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ user_principal: userPrincipal, realm_principal: REALM_CANISTER_ID, persona: selectedAssistant?.id || 'ashoka' })
			});
			if (res.ok) {
				const data = await res.json();
				conversationId = data.conversation_id || null;
			}
		} catch {}
	}

	function copyText(text: string, index: number) {
		const markCopied = () => {
			copiedIndex = index;
			setTimeout(() => { copiedIndex = null; }, 1500);
		};
		const fallback = () => {
			const ta = document.createElement('textarea');
			ta.value = text;
			ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
			document.body.appendChild(ta);
			ta.focus();
			ta.select();
			try { document.execCommand('copy'); markCopied(); } catch {}
			document.body.removeChild(ta);
		};
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text).then(markCopied).catch(fallback);
		} else {
			fallback();
		}
	}

	function normalizeHistoryMessages(raw: unknown[]): ChatMessage[] {
		const out: ChatMessage[] = [];
		for (const m of raw) {
			if (!m || typeof m !== 'object') continue;
			const row = m as Record<string, unknown>;
			// New shape: { role, content }
			if (row.role && row.content != null) {
				out.push({
					text: String(row.content),
					isUser: row.role === 'user',
				});
				continue;
			}
			// Geister API shape: { question, response } per stored turn
			if (row.question != null && String(row.question).trim()) {
				out.push({ text: String(row.question), isUser: true });
			}
			if (row.response != null && String(row.response).trim()) {
				out.push({ text: String(row.response), isUser: false });
			}
		}
		return out;
	}

	function renderMarkdown(text: string): string {
		if (!text) return '';
		let html = text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		html = html
			.replace(/```([^`]*?)```/gs, '<pre class="bg-gray-100 dark:bg-gray-900 rounded-md p-3 my-2 overflow-x-auto text-xs font-mono"><code>$1</code></pre>')
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
			.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800">$1</a>')
			.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
			.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>')
			.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-3 mb-1">$1</h1>')
			.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
			.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
			.replace(/\n{2,}/g, '<br/><br/>')
			.replace(/\n/g, '<br/>');

		return html;
	}

	function autoResizeTextarea(): void {
		if (textareaElement) {
			textareaElement.style.height = 'auto';
			const newHeight = Math.max(40, Math.min(textareaElement.scrollHeight, 120));
			textareaElement.style.height = newHeight + 'px';
		}
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
		setTimeout(autoResizeTextarea, 0);
	}

	function handleSuggestionClick(suggestion: string): void {
		newMessage = suggestion;
		sendMessage();
	}

	function selectAssistant(assistant: AssistantPersona) {
		selectedAssistant = assistant;
		messages = [];
		fetchSuggestions();
	}

	$effect(() => {
		return () => {
			unsubPrincipal?.();
			unsubAuth?.();
			unsubPendingPrompt?.();
			unsubFocus?.();
			(window as any).__chatVpCleanup?.();
		};
	});
</script>

{#if !isSidebarPanel}
<!-- ═══════════════════════════════════════════════════ SETTINGS PAGE ══ -->
<div class="settings-page">
	<h1 class="settings-title">AI Assistant — Settings</h1>

	<!-- Default assistant -->
	<section class="settings-section">
		<h2 class="settings-section-title">Default assistant</h2>
		<p class="settings-section-desc">Which persona opens when you start a new conversation.</p>
		{#if availableAssistants.length > 0}
			<div class="settings-assistant-grid">
				{#each availableAssistants as a}
					<button
						class="settings-assistant-btn {prefDefaultAssistant === a.id || (!prefDefaultAssistant && availableAssistants[0].id === a.id) ? 'selected' : ''}"
						onclick={() => prefDefaultAssistant = a.id}
					>
						<span class="settings-assistant-emoji">{a.emoji}</span>
						<span class="settings-assistant-name">{a.name}</span>
					</button>
				{/each}
			</div>
		{:else}
			<p class="settings-section-desc">Loading assistants…</p>
		{/if}
	</section>

	<!-- Preferences -->
	<section class="settings-section">
		<h2 class="settings-section-title">Preferences</h2>
		<div class="settings-toggle">
			<div class="settings-toggle-info">
				<span class="settings-toggle-label">Show suggestion chips</span>
				<span class="settings-toggle-desc">Display quick-reply suggestions after each response.</span>
			</div>
			<button class="settings-switch {prefShowSuggestions ? 'on' : ''}" role="switch" aria-checked={prefShowSuggestions} onclick={() => prefShowSuggestions = !prefShowSuggestions} aria-label="Show suggestion chips"></button>
		</div>
		<div class="settings-toggle">
			<div class="settings-toggle-info">
				<span class="settings-toggle-label">Share page context</span>
				<span class="settings-toggle-desc">Send the current page you're viewing as context to the assistant.</span>
			</div>
			<button class="settings-switch {prefSharePageContext ? 'on' : ''}" role="switch" aria-checked={prefSharePageContext} onclick={() => prefSharePageContext = !prefSharePageContext} aria-label="Share page context"></button>
		</div>
	</section>

	<!-- Conversation history -->
	{#if isAuthenticated}
	<section class="settings-section">
		<h2 class="settings-section-title">Conversation history</h2>
		{#if conversations.length > 0}
			<div class="settings-history-list">
				{#each conversations as conv}
					<div class="settings-history-item">
						<div class="settings-history-body">
							<div class="settings-history-title">{conv.title}</div>
							<div class="settings-history-meta">{formatDate(conv.updated_at)} · {conv.message_count} message{conv.message_count === 1 ? '' : 's'}</div>
						</div>
						<button class="settings-history-delete" onclick={(e) => deleteConversation(conv.conversation_id, e)} title="Delete">
							<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<p class="settings-section-desc">{isLoadingHistory ? 'Loading…' : 'No conversations yet.'}</p>
		{/if}
		<button class="settings-danger-btn" onclick={clearAllHistory} disabled={clearingHistory || conversations.length === 0}>
			{#if historyCleared}✓ History cleared{:else if clearingHistory}Clearing…{:else}Clear all history{/if}
		</button>
	</section>
	{/if}

	<!-- About / status -->
	<section class="settings-section">
		<h2 class="settings-section-title">About</h2>
		<div class="settings-about-row">
			<span class="settings-about-label">Extension version</span>
			<span class="settings-about-value">1.0.1</span>
		</div>
		<div class="settings-about-row">
			<span class="settings-about-label">API status</span>
			<span class="settings-api-status {apiStatus}">
				{#if apiStatus === 'online'}● Online{:else if apiStatus === 'offline'}● Offline{:else}Checking…{/if}
			</span>
		</div>
		<button class="settings-link-btn" onclick={checkApiStatus}>Check again</button>
	</section>
</div>

{:else}
<!-- ══════════════════════════════════════════════════════ CHAT PANEL ══ -->
<div
	class="llm-chat-root"
	class:sidebar-panel={isSidebarPanel}
	bind:this={chatRootElement}
	style={isSidebarPanel ? undefined : `height: ${chatHeight}`}
>
	<!-- Top toolbar: new chat + history (authenticated users only) -->
	{#if isAuthenticated}
		<div class="chat-toolbar">
			<button class="toolbar-btn" onclick={startNewConversation} title="New conversation">
				<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
				<span>New chat</span>
			</button>
			<button class="toolbar-btn {showHistory ? 'active' : ''}" onclick={showHistory ? () => showHistory = false : openHistory} title="Conversation history">
				<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 6.5V10l2.5 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
				<span>History</span>
			</button>
		</div>
	{/if}

	<!-- Document focus chip (sidebar) -->
	{#if isSidebarPanel && currentFocus?.label}
		<div class="focus-chip">
			<span class="focus-chip-label" title={currentFocus.uri}>{currentFocus.label}</span>
			<button class="focus-chip-btn" onclick={explainCurrentFocus} title="Explain current selection">
				Explain this
			</button>
		</div>
	{/if}

	<!-- Assistant Selector -->
	{#if availableAssistants.length > 1}
		<div class="assistant-selector">
			{#each availableAssistants as assistant}
				<button
					class="assistant-btn {selectedAssistant?.id === assistant.id ? 'active' : ''}"
					onclick={() => selectAssistant(assistant)}
					title={assistant.description}
				>
					<span class="text-lg">{assistant.emoji}</span>
					<span class="text-sm font-medium">{assistant.name}</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- History panel -->
	{#if showHistory}
		<div class="history-panel">
			{#if isLoadingHistory}
				<div class="history-loading">Loading conversations…</div>
			{:else if conversations.length === 0}
				<div class="history-empty">No past conversations yet. Start chatting!</div>
			{:else}
				{#each conversations as conv}
					<div class="history-item" onclick={() => loadConversation(conv)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && loadConversation(conv)}>
						<div class="history-item-body">
							<div class="history-title">{conv.title}</div>
							<div class="history-meta">{formatDate(conv.updated_at)} · {conv.message_count} msg{conv.message_count === 1 ? '' : 's'}</div>
						</div>
						<button class="history-delete" onclick={(e) => deleteConversation(conv.conversation_id, e)} title="Delete">
							<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4h10M6 4V3h4v1M5 4v8h6V4H5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
						</button>
					</div>
				{/each}
			{/if}
		</div>
	{/if}

	<!-- Messages area (scrollable) -->
	<div
		bind:this={messagesContainer}
		class="messages-area"
		style={showHistory ? 'display:none' : ''}
	>
		{#if messages.length === 0 && !isExplainMode}
		<div class="welcome-message">
			<div class="assistant-content markdown-content">
				{#if isAuthenticated}
					<p>Welcome back! I'm your AI assistant. Ask me anything about this realm — governance, proposals, codices, or general questions.</p>
				{:else}
					<p>Hello! I'm the realm's AI assistant. Feel free to ask me about this realm, its governance structure, or anything you'd like to know.</p>
				{/if}
			</div>
		</div>
	{:else}
		{#each messages as message, i}
			{#if message.isUser}
				<div class="message-row user-row">
					<div class="user-message-wrap">
						<button class="copy-btn" onclick={() => copyText(message.text, i)} title="Copy">
							{#if copiedIndex === i}
								<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l3.5 3.5L13 4.5" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
							{:else}
								<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
							{/if}
						</button>
						<div class="bubble user-bubble">
							{message.text}
						</div>
					</div>
				</div>
			{:else}
				<div class="message-row assistant-row">
					<div class="assistant-message-wrap">
						<div class="assistant-content markdown-content">
							{#if message.thinking}
								<details class="thinking-block">
									<summary>Reasoning</summary>
									<div class="thinking-text">{message.thinking}</div>
								</details>
							{/if}
							{#if message.text}
								{@html renderMarkdown(message.text)}
							{/if}
						</div>
						<button class="copy-btn copy-btn--assistant" onclick={() => copyText(message.text, i)} title="Copy">
							{#if copiedIndex === i}
								<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l3.5 3.5L13 4.5" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
							{:else}
								<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
							{/if}
						</button>
					</div>
				</div>
			{/if}
		{/each}

		{#if isLoading && (!streamHasContent || loadingStatus)}
			<div class="message-row assistant-row">
				<div class="assistant-content">
					{#if !streamHasContent}
						{#if isExplainMode}
							<p class="explain-wait">
								Analyzing codex… if the GPU was idle, the backend may need up to 5 minutes to start.
							</p>
						{:else if !backendAwake && !loadingStatus}
							<p class="explain-wait">Awakening the AI assistant. This may take a few minutes.</p>
						{/if}
					{/if}
					{#if loadingStatus}
						<p class="stream-status">{loadingStatus}</p>
					{/if}
					{#if !streamHasContent && !loadingStatus && backendAwake && !isExplainMode}
						<div class="typing-animation">
							<span></span>
							<span></span>
							<span></span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

			{#if error}
				<div class="error-banner">
					<span>{error}</span>
					<button class="error-dismiss" onclick={dismissError} title="Dismiss">&times;</button>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Input section (always visible at bottom) -->
	<div class="input-section">
		{#if prefShowSuggestions && (suggestions.length > 0 || isLoadingSuggestions)}
			<div class="suggestions">
				{#if isLoadingSuggestions}
					<span class="suggestion-loading">Loading suggestions...</span>
				{:else}
					{#each suggestions as suggestion}
						<button
							class="suggestion-chip"
							onclick={() => handleSuggestionClick(suggestion)}
						>
							{suggestion}
						</button>
					{/each}
				{/if}
			</div>
		{/if}

		<div class="input-row">
			<textarea
				bind:this={textareaElement}
				class="chat-input"
				placeholder="Type a message..."
				rows="1"
				bind:value={newMessage}
				onkeydown={handleKeydown}
				oninput={() => autoResizeTextarea()}
			></textarea>
			<button
				class="send-btn"
				disabled={isLoading || !newMessage.trim()}
				onclick={() => sendMessage()}
				title="Send message (Enter)"
			>
				{#if isLoading}
					<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
				{:else}
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
					</svg>
				{/if}
			</button>
		</div>
	</div>
</div>
{/if}

<style>
	.llm-chat-root {
		display: flex;
		flex-direction: column;
		/* Full-page: height via inline style + visualViewport. Sidebar: fill host panel. */
		max-height: 100%;
		min-height: 300px;
		overflow: hidden;
		background: transparent;
		/* Prevent the component itself from scrolling — only messages-area scrolls */
		overscroll-behavior: none;
		/* Flush to the top of the sidebar panel — no stray gap */
		margin-top: 0;
		padding-top: 0;
	}

	.llm-chat-root.sidebar-panel {
		height: 100%;
		min-height: 0;
		flex: 1;
	}

	/* Top toolbar */
	.chat-toolbar {
		display: flex;
		gap: 6px;
		padding: 6px 14px;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
	}

	.toolbar-btn {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 10px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		background: #f9fafb;
		color: #4b5563;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.toolbar-btn svg {
		width: 15px;
		height: 15px;
		flex-shrink: 0;
	}

	.toolbar-btn:hover {
		background: #eef2ff;
		border-color: #c7d2fe;
		color: #4338ca;
	}

	.toolbar-btn.active {
		background: #eef2ff;
		border-color: #6366f1;
		color: #4338ca;
	}

	/* History panel */
	.history-panel {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 8px 14px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.history-loading,
	.history-empty {
		padding: 24px 0;
		text-align: center;
		color: #9ca3af;
		font-size: 13px;
	}

	.history-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid #f3f4f6;
		background: #fafafa;
		cursor: pointer;
		transition: background 0.12s ease, border-color 0.12s ease;
	}

	.history-item:hover {
		background: #eef2ff;
		border-color: #c7d2fe;
	}

	.history-item-body {
		flex: 1;
		min-width: 0;
	}

	.history-title {
		font-size: 13px;
		font-weight: 500;
		color: #1f2937;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.history-meta {
		font-size: 11px;
		color: #9ca3af;
		margin-top: 2px;
	}

	.history-delete {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		background: transparent;
		color: #d1d5db;
		cursor: pointer;
		border-radius: 6px;
		padding: 4px;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.history-delete svg {
		width: 14px;
		height: 14px;
	}

	.history-delete:hover {
		color: #ef4444;
		background: #fef2f2;
	}

	/* Document focus chip */
	.focus-chip {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border-bottom: 1px solid #e5e7eb;
		background: #f8fafc;
		flex-shrink: 0;
	}

	.focus-chip-label {
		flex: 1;
		min-width: 0;
		font-size: 12px;
		color: #4b5563;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.focus-chip-btn {
		flex-shrink: 0;
		padding: 4px 10px;
		font-size: 12px;
		font-weight: 500;
		border-radius: 9999px;
		border: 1px solid #c7d2fe;
		background: #eef2ff;
		color: #4338ca;
		cursor: pointer;
	}

	.focus-chip-btn:hover {
		background: #e0e7ff;
	}

	/* Assistant selector */
	.assistant-selector {
		display: flex;
		gap: 8px;
		padding: 10px 0;
		border-bottom: 1px solid #e5e7eb;
		flex-shrink: 0;
		overflow-x: auto;
	}

	.assistant-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		background: #fff;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.assistant-btn:hover {
		background: #f3f4f6;
		border-color: #d1d5db;
	}

	.assistant-btn.active {
		border-color: #6366f1;
		background: #eef2ff;
		color: #4338ca;
	}

	/* Messages area */
	.messages-area {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 8px 14px 16px;
		background: transparent;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	/* Welcome message */
	.welcome-message {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin-top: 4px;
	}

	/* Message rows */
	.message-row {
		display: flex;
		gap: 10px;
		max-width: 100%;
	}

	.user-row {
		justify-content: flex-end;
	}

	.assistant-row {
		justify-content: flex-start;
		align-items: flex-start;
	}

	/* Avatar */
	.avatar {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #fff;
		border: 2px solid #e5e7eb;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.avatar.small {
		width: 32px;
		height: 32px;
		font-size: 16px;
	}

	/* User message wrapper (bubble + copy) */
	.user-message-wrap {
		display: flex;
		align-items: flex-end;
		gap: 6px;
		max-width: 80%;
	}

	/* Assistant message wrapper (content + copy) */
	.assistant-message-wrap {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
		gap: 4px;
	}

	/* Copy button */
	.copy-btn {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		border-radius: 6px;
		padding: 4px;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.copy-btn:hover {
		color: #4f46e5;
		background: #eef2ff;
	}

	.copy-btn svg {
		width: 14px;
		height: 14px;
	}

	.copy-btn--assistant {
		align-self: flex-start;
		margin-left: 2px;
	}

	/* Bubbles */
	.bubble {
		padding: 10px 14px;
		border-radius: 16px;
		line-height: 1.5;
		font-size: 14px;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.user-bubble {
		background: #4f46e5;
		color: #fff;
		border-bottom-right-radius: 4px;
		box-shadow: 0 1px 3px rgba(79, 70, 229, 0.3);
		white-space: pre-wrap;
	}

	/* Assistant content — no bubble, full width */
	.assistant-content {
		flex: 1;
		min-width: 0;
		line-height: 1.6;
		font-size: 14px;
		color: #1f2937;
		word-wrap: break-word;
		overflow-wrap: break-word;
		padding: 2px 0;
	}

	/* Markdown content inside assistant messages */
	.markdown-content :global(h1),
	.markdown-content :global(h2),
	.markdown-content :global(h3) {
		margin-top: 12px;
		margin-bottom: 4px;
		font-weight: 600;
	}
	.markdown-content :global(h1) { font-size: 1.125rem; }
	.markdown-content :global(h2) { font-size: 1rem; }
	.markdown-content :global(h3) { font-size: 0.9375rem; }

	.markdown-content :global(li) {
		margin-left: 16px;
		margin-bottom: 2px;
	}

	.markdown-content :global(pre) {
		margin: 8px 0;
		border-radius: 6px;
	}

	.markdown-content :global(strong) {
		font-weight: 600;
	}

	.markdown-content :global(a) {
		color: #4f46e5;
		text-decoration: underline;
	}

	/* Error banner */
	.error-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 8px 14px;
		border-radius: 8px;
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		font-size: 13px;
	}

	.error-dismiss {
		background: none;
		border: none;
		font-size: 18px;
		cursor: pointer;
		color: #991b1b;
		padding: 0 4px;
		line-height: 1;
		opacity: 0.7;
	}

	.error-dismiss:hover {
		opacity: 1;
	}

	.explain-wait {
		margin: 0 0 6px;
		font-size: 12px;
		color: #6b7280;
	}

	.stream-status {
		margin: 0;
		font-size: 13px;
		color: #4b5563;
		font-style: italic;
		animation: status-pulse 1.6s ease-in-out infinite;
	}

	@keyframes status-pulse {
		0%, 100% { opacity: 0.55; }
		50% { opacity: 1; }
	}

	.thinking-block {
		margin: 0 0 10px;
		padding: 8px 10px;
		border-radius: 8px;
		background: #f5f3ff;
		border: 1px solid #ddd6fe;
		font-size: 12px;
	}

	.thinking-block summary {
		cursor: pointer;
		font-weight: 600;
		color: #6d28d9;
		user-select: none;
		list-style: none;
	}

	.thinking-block summary::-webkit-details-marker {
		display: none;
	}

	.thinking-block summary::before {
		content: '▸ ';
		display: inline-block;
		transition: transform 0.15s ease;
	}

	.thinking-block[open] summary::before {
		transform: rotate(90deg);
	}

	.thinking-text {
		margin-top: 8px;
		color: #4c1d95;
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
		max-height: 240px;
		overflow-y: auto;
	}

	/* Typing animation */
	.typing-animation {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 0;
	}

	.typing-animation span {
		width: 7px;
		height: 7px;
		background-color: #9ca3af;
		border-radius: 50%;
		animation: typing 1.4s infinite ease-in-out;
	}

	.typing-animation span:nth-child(1) { animation-delay: 0s; }
	.typing-animation span:nth-child(2) { animation-delay: 0.2s; }
	.typing-animation span:nth-child(3) { animation-delay: 0.4s; }

	@keyframes typing {
		0%, 60%, 100% {
			transform: translateY(0);
			opacity: 0.4;
		}
		30% {
			transform: translateY(-6px);
			opacity: 1;
		}
	}

	/* Input section */
	.input-section {
		flex-shrink: 0;
		padding: 10px 14px;
		padding-bottom: max(10px, env(safe-area-inset-bottom, 0px));
		border-top: 1px solid #e5e7eb;
		background: #fff;
	}

	.suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 10px;
		justify-content: center;
	}

	.suggestion-loading {
		font-size: 12px;
		color: #9ca3af;
	}

	.suggestion-chip {
		padding: 5px 12px;
		font-size: 12px;
		border-radius: 16px;
		border: 1px solid #e5e7eb;
		background: #f9fafb;
		color: #4b5563;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.suggestion-chip:hover {
		background: #eef2ff;
		border-color: #c7d2fe;
		color: #4338ca;
	}

	.input-row {
		display: flex;
		gap: 8px;
		align-items: flex-end;
	}

	.chat-input {
		flex: 1;
		resize: none;
		padding: 10px 14px;
		border-radius: 12px;
		border: 1px solid #d1d5db;
		font-size: 16px; /* 16px prevents iOS auto-zoom on focus */
		line-height: 1.4;
		min-height: 42px;
		max-height: 120px;
		overflow-y: auto;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
		outline: none;
		touch-action: manipulation;
	}

	.chat-input:focus {
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
	}

	.chat-input::placeholder {
		color: #9ca3af;
	}

	.send-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 42px;
		border-radius: 12px;
		border: none;
		background: #4f46e5;
		color: #fff;
		cursor: pointer;
		transition: background 0.15s ease, opacity 0.15s ease;
		flex-shrink: 0;
	}

	.send-btn:hover:not(:disabled) {
		background: #4338ca;
	}

	.send-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ══════════════════════ Settings page ══════════════════════ */
	.settings-page {
		max-width: 680px;
		margin: 0 auto;
		padding: 36px 24px 60px;
		font-family: inherit;
		color: #111;
	}

	.settings-title {
		font-size: 1.35rem;
		font-weight: 700;
		margin: 0 0 32px;
		color: #111;
	}

	.settings-section {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 20px 22px;
		margin-bottom: 18px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.settings-section-title {
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		margin: 0;
	}

	.settings-section-desc {
		font-size: 0.875rem;
		color: #6b7280;
		margin: -8px 0 0;
	}

	/* Default assistant grid */
	.settings-assistant-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.settings-assistant-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
		padding: 10px 16px;
		border: 1.5px solid #e5e7eb;
		border-radius: 10px;
		background: #f9fafb;
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
		min-width: 80px;
	}

	.settings-assistant-btn.selected {
		border-color: #4f46e5;
		background: #eef2ff;
	}

	.settings-assistant-emoji {
		font-size: 1.5rem;
	}

	.settings-assistant-name {
		font-size: 0.8rem;
		font-weight: 500;
		color: #374151;
	}

	/* Toggle rows */
	.settings-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		cursor: pointer;
	}

	.settings-toggle-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.settings-toggle-label {
		font-size: 0.9rem;
		font-weight: 500;
		color: #111;
	}

	.settings-toggle-desc {
		font-size: 0.8rem;
		color: #6b7280;
	}

	.settings-switch {
		flex-shrink: 0;
		width: 40px;
		height: 22px;
		border-radius: 11px;
		background: #d1d5db;
		border: none;
		position: relative;
		cursor: pointer;
		transition: background 0.2s;
		outline: none;
		padding: 0;
	}

	.settings-switch::after {
		content: '';
		position: absolute;
		top: 3px;
		left: 3px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 1px 3px rgba(0,0,0,0.2);
		transition: transform 0.2s;
	}

	.settings-switch.on {
		background: #4f46e5;
	}

	.settings-switch.on::after {
		transform: translateX(18px);
	}

	/* History list */
	.settings-history-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-height: 260px;
		overflow-y: auto;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 6px;
	}

	.settings-history-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 7px;
		background: #f9fafb;
	}

	.settings-history-body {
		flex: 1;
		min-width: 0;
	}

	.settings-history-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: #111;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.settings-history-meta {
		font-size: 0.75rem;
		color: #9ca3af;
		margin-top: 2px;
	}

	.settings-history-delete {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 6px;
		color: #9ca3af;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
	}

	.settings-history-delete:hover {
		background: #fee2e2;
		color: #dc2626;
	}

	.settings-danger-btn {
		align-self: flex-start;
		padding: 7px 14px;
		border: 1.5px solid #fca5a5;
		border-radius: 8px;
		background: #fff;
		color: #dc2626;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.settings-danger-btn:hover:not(:disabled) {
		background: #fee2e2;
	}

	.settings-danger-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* About */
	.settings-about-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.settings-about-label {
		color: #6b7280;
	}

	.settings-about-value {
		font-weight: 500;
		color: #111;
	}

	.settings-api-status {
		font-size: 0.85rem;
		font-weight: 500;
	}

	.settings-api-status.online { color: #16a34a; }
	.settings-api-status.offline { color: #dc2626; }
	.settings-api-status.unknown { color: #9ca3af; }

	.settings-link-btn {
		align-self: flex-start;
		padding: 6px 12px;
		border: 1px solid #e5e7eb;
		border-radius: 7px;
		background: #f9fafb;
		color: #4f46e5;
		font-size: 0.8rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	.settings-link-btn:hover {
		background: #eef2ff;
	}
</style>
