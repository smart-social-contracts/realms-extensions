<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount, onDestroy } from 'svelte';
	import MonacoPane, { type LineRange, type SelectionInfo } from './MonacoPane.svelte';

	let { ctx }: { ctx: any } = $props();

	let aiAssistantEnabled = $derived(ctx.config?.aiAssistantEnabled !== false);

	interface Codex {
		_id: string;
		id?: string;
		name: string;
		description?: string;
		code_preview?: string;
		code?: string;
		source?: string;
		version?: string;
		created_at?: number | null;
		updated_at?: number | null;
	}

	const MONACO_THEME = 'vs';
	const MONACO_LANGUAGE = 'python';
	const EXTENSION_ID = 'codex_viewer';
	const SIDEBAR_COLLAPSED_KEY = 'codex-viewer-sidebar-collapsed';
	const WORD_WRAP_KEY = 'codex-viewer-word-wrap';
	const MINIMAP_KEY = 'codex-viewer-minimap';
	const NARROW_VIEWPORT = '(max-width: 720px)';

	function isNarrowViewport(): boolean {
		if (typeof window === 'undefined') return false;
		return window.matchMedia(NARROW_VIEWPORT).matches;
	}

	function readSessionFlag(key: string): boolean | null {
		try {
			const value = sessionStorage.getItem(key);
			if (value === '1') return true;
			if (value === '0') return false;
			return null;
		} catch {
			return null;
		}
	}

	function persistSessionFlag(key: string, value: boolean) {
		try {
			sessionStorage.setItem(key, value ? '1' : '0');
		} catch {
			/* sessionStorage unavailable */
		}
	}

	function readSidebarCollapsed(): boolean {
		return readSessionFlag(SIDEBAR_COLLAPSED_KEY) === true;
	}

	function persistSidebarCollapsed(collapsed: boolean) {
		persistSessionFlag(SIDEBAR_COLLAPSED_KEY, collapsed);
	}

	let codexes: Codex[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');
	let searchTerm = $state('');
	let selectedCodex: Codex | null = $state(null);
	let detailLoading = $state(false);
	let copied = $state(false);
	let linkCopied = $state(false);
	let currentSelection: SelectionInfo | null = $state(null);
	let initialRange: LineRange | null = $state(null);
	let pendingExplainOnLoad = $state(false);
	let urlSyncTimer: ReturnType<typeof setTimeout> | undefined;
	let sidebarCollapsed = $state(readSidebarCollapsed());
	const narrowDefault = isNarrowViewport();
	let wordWrap = $state(readSessionFlag(WORD_WRAP_KEY) ?? narrowDefault);
	let minimapEnabled = $state(readSessionFlag(MINIMAP_KEY) ?? !narrowDefault);

	let filteredCodexes = $derived(
		searchTerm.trim()
			? codexes.filter((c) => {
					const term = searchTerm.toLowerCase();
					return (
						(c.name ?? '').toLowerCase().includes(term) ||
						(c.description ?? '').toLowerCase().includes(term)
					);
				})
			: codexes,
	);

	let editorCode = $derived(
		selectedCodex
			? unescapeCode(selectedCodex.code || selectedCodex.source || selectedCodex.code_preview)
			: '',
	);

	let explainButtonLabel = $derived(
		currentSelection?.text?.trim() ? 'Explain selection' : 'Explain codex',
	);

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	function getCodexId(codex: Codex): string {
		return codex._id || codex.id || codex.name || '';
	}

	function parseLinesParam(lines: string | null): LineRange | null {
		if (!lines) return null;
		const match = lines.match(/^(\d+)(?:-(\d+))?$/);
		if (!match) return null;
		const start = parseInt(match[1], 10);
		const end = match[2] ? parseInt(match[2], 10) : start;
		if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
		return {
			startLine: Math.min(start, end),
			endLine: Math.max(start, end),
		};
	}

	function buildFocusUri(codexId: string, range?: LineRange | null): string {
		const base = `realms://${EXTENSION_ID}/codex/${encodeURIComponent(codexId)}`;
		if (!range) return base;
		if (range.startLine === range.endLine) {
			return `${base}?lines=${range.startLine}`;
		}
		return `${base}?lines=${range.startLine}-${range.endLine}`;
	}

	function buildShareUrl(codexId: string, range?: LineRange | null): string {
		const params = new URLSearchParams({ codex: codexId });
		if (range) {
			params.set(
				'lines',
				range.startLine === range.endLine
					? String(range.startLine)
					: `${range.startLine}-${range.endLine}`,
			);
		}
		return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
	}

	function buildFocusLabel(codex: Codex, range?: LineRange | null): string {
		const name = codex.name || getCodexId(codex);
		if (!range) return name;
		if (range.startLine === range.endLine) return `${name}, line ${range.startLine}`;
		return `${name}, lines ${range.startLine}–${range.endLine}`;
	}

	function publishFocus(codex: Codex, selection: SelectionInfo | null) {
		const codexId = getCodexId(codex);
		const range = selection
			? { startLine: selection.startLine, endLine: selection.endLine }
			: null;
		ctx.host?.setFocus?.({
			source: EXTENSION_ID,
			uri: buildFocusUri(codexId, range),
			label: buildFocusLabel(codex, range),
			snapshot:
				selection?.text?.trim()
					? {
							languageId: MONACO_LANGUAGE,
							range: {
								startLine: selection.startLine,
								endLine: selection.endLine,
							},
							text: selection.text,
						}
					: undefined,
		});
	}

	function syncUrlFromState(codex: Codex, selection: SelectionInfo | null) {
		if (typeof window === 'undefined') return;
		const codexId = getCodexId(codex);
		const range = selection
			? { startLine: selection.startLine, endLine: selection.endLine }
			: null;
		const next = buildShareUrl(codexId, range);
		if (next !== window.location.href) {
			history.replaceState(null, '', next);
		}
	}

	function scheduleUrlSync() {
		clearTimeout(urlSyncTimer);
		urlSyncTimer = setTimeout(() => {
			if (selectedCodex) {
				syncUrlFromState(selectedCodex, currentSelection);
			}
		}, 300);
	}

	function handleSelectionChange(selection: SelectionInfo | null) {
		currentSelection = selection;
		if (selectedCodex) {
			publishFocus(selectedCodex, selection);
			scheduleUrlSync();
		}
	}

	async function applyUrlState() {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		const codexParam = params.get('codex');
		const linesParam = params.get('lines');
		pendingExplainOnLoad = params.get('explain') === '1';
		initialRange = parseLinesParam(linesParam);

		if (!codexParam || codexes.length === 0) return;

		const match =
			codexes.find((c) => getCodexId(c) === codexParam) ??
			codexes.find((c) => c.name === codexParam);
		if (match) {
			await selectCodex(match, { skipUrlSync: true });
		}
	}

	async function loadCodexes() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const res = await callExt('get_all_codexes');
			codexes = res?.codexes ?? res?.data ?? (Array.isArray(res) ? res : []);
			await applyUrlState();
			if (!selectedCodex && codexes.length > 0) {
				await selectCodex(codexes[0]);
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			loading = false;
		}
	}

	async function selectCodex(
		codex: Codex,
		opts: { skipUrlSync?: boolean; preserveRange?: boolean } = {},
	) {
		if (selectedCodex && getCodexId(selectedCodex) === getCodexId(codex) && selectedCodex.code) {
			if (!opts.preserveRange) {
				currentSelection = null;
				if (!opts.skipUrlSync) initialRange = null;
			}
			publishFocus(codex, currentSelection);
			if (!opts.skipUrlSync) syncUrlFromState(codex, currentSelection);
			return;
		}

		detailLoading = true;
		error = '';
		accessDeniedOp = '';
		if (!opts.preserveRange) {
			currentSelection = null;
			if (!opts.skipUrlSync) initialRange = null;
		}

		try {
			const codexId = getCodexId(codex);
			const res = await callExt('get_codex_details', { codex_id: codexId });
			const detail = res?.codex ?? res?.data ?? res;
			if (detail && typeof detail === 'object' && (detail.code || detail.name)) {
				selectedCodex = detail;
			} else {
				selectedCodex = codex;
			}
		} catch {
			selectedCodex = codex;
		} finally {
			detailLoading = false;
			publishFocus(selectedCodex, currentSelection);
			if (!opts.skipUrlSync) syncUrlFromState(selectedCodex, currentSelection);
			maybeTriggerExplainOnLoad();
		}
	}

	function maybeTriggerExplainOnLoad() {
		if (!pendingExplainOnLoad || !aiAssistantEnabled) return;
		pendingExplainOnLoad = false;
		ctx.host?.dispatch?.({ type: 'assistant.prompt', autoSend: true });
	}

	function unescapeCode(code: string | undefined | null): string {
		if (!code) return '';
		return code
			.replace(/\\n/g, '\n')
			.replace(/\\t/g, '\t')
			.replace(/\\"/g, '"')
			.replace(/\\\\/g, '\\');
	}

	function isSelected(codex: Codex): boolean {
		return selectedCodex != null && getCodexId(selectedCodex) === getCodexId(codex);
	}

	async function copyCode() {
		if (!editorCode) return;
		try {
			await navigator.clipboard.writeText(editorCode);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			/* clipboard unavailable */
		}
	}

	async function copyLink() {
		if (!selectedCodex) return;
		const url = buildShareUrl(
			getCodexId(selectedCodex),
			currentSelection
				? {
						startLine: currentSelection.startLine,
						endLine: currentSelection.endLine,
					}
				: null,
		);
		try {
			await navigator.clipboard.writeText(url);
			linkCopied = true;
			setTimeout(() => {
				linkCopied = false;
			}, 2000);
		} catch {
			ctx.host?.dispatch?.({ type: 'clipboard.write', text: url });
		}
	}

	function explainWithAI() {
		if (!selectedCodex || !aiAssistantEnabled) return;
		ctx.host?.dispatch?.({ type: 'assistant.prompt', autoSend: true });
	}

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
		persistSidebarCollapsed(sidebarCollapsed);
	}

	function toggleWordWrap() {
		wordWrap = !wordWrap;
		persistSessionFlag(WORD_WRAP_KEY, wordWrap);
	}

	function toggleMinimap() {
		minimapEnabled = !minimapEnabled;
		persistSessionFlag(MINIMAP_KEY, minimapEnabled);
	}

	function setAssistantFabHidden(hidden: boolean) {
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('codex-viewer-hide-assistant-fab', hidden);
		}
		ctx.host?.dispatch?.({ type: hidden ? 'assistant.hideFab' : 'assistant.showFab' });
	}

	onMount(() => {
		setAssistantFabHidden(true);
		void loadCodexes();
	});

	onDestroy(() => {
		clearTimeout(urlSyncTimer);
		ctx.host?.setFocus?.(null);
		setAssistantFabHidden(false);
	});
</script>

{#snippet sidebarToggle()}
	<button
		type="button"
		class="btn-icon"
		onclick={toggleSidebar}
		title={sidebarCollapsed ? 'Show file list' : 'Hide file list'}
		aria-label={sidebarCollapsed ? 'Show file list' : 'Hide file list'}
		aria-expanded={!sidebarCollapsed}
		aria-controls="codex-file-list"
	>
		{#if sidebarCollapsed}
			<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 10h16M4 14h16M4 18h16"
				/>
			</svg>
		{:else}
			<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 19l-7-7 7-7"
				/>
			</svg>
		{/if}
	</button>
{/snippet}

<div class="codex-workspace">
	{#if accessDeniedOp}
		<div class="codex-denied">
			{#if ctx.ui?.AccessDenied}
				<p class="access-denied-msg">You need additional permissions to view this page.</p>
			{:else}
				<p>You need additional permissions to view this page.</p>
			{/if}
		</div>
	{:else if error}
		<div class="codex-denied">
			<div class="error-banner">{error}</div>
		</div>
	{:else}
		{#if !sidebarCollapsed}
		<aside class="codex-sidebar" id="codex-file-list">
			<div class="sidebar-header">
				<div>
					<h1 class="title">Codex Viewer</h1>
					<p class="subtitle">{extensionDescription}</p>
				</div>
				<div class="sidebar-header-actions">
					{@render sidebarToggle()}
					<button class="btn-icon" type="button" onclick={loadCodexes} disabled={loading} title="Refresh">
						<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
					</button>
				</div>
			</div>

			<div class="search-box">
				<svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Search codexes…"
					class="search-input"
				/>
			</div>

			<div class="stats">
				{codexes.length} total
				{#if searchTerm && filteredCodexes.length !== codexes.length}
					· {filteredCodexes.length} matching
				{/if}
			</div>

			<div class="codex-list">
				{#if loading}
					<div class="list-loading">Loading codexes…</div>
				{:else if filteredCodexes.length === 0}
					<div class="list-empty">
						{searchTerm ? 'No codexes match your search' : 'No codexes found'}
					</div>
				{:else}
					{#each filteredCodexes as codex (getCodexId(codex))}
						<button
							class="codex-item"
							class:selected={isSelected(codex)}
							onclick={() => selectCodex(codex)}
						>
							<span class="codex-item-name">{codex.name}</span>
							{#if codex.description}
								<span class="codex-item-desc">{codex.description}</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</aside>
		{/if}

		<main class="codex-editor-pane">
			{#if selectedCodex}
				<div class="editor-toolbar">
					<div class="toolbar-title-row">
						<h2 class="editor-title">{selectedCodex.name || getCodexId(selectedCodex)}</h2>
						<span class="badge badge-lang">{MONACO_LANGUAGE}</span>
						{#if selectedCodex.version}
							<span class="badge badge-version">v{selectedCodex.version}</span>
						{/if}
					</div>
					<div class="toolbar-actions">
						{#if sidebarCollapsed}
							{@render sidebarToggle()}
						{/if}
						<button
							type="button"
							class="btn-action"
							onclick={copyCode}
							title={copied ? 'Copied' : 'Copy'}
							aria-label={copied ? 'Copied' : 'Copy'}
						>
							{#if copied}
								<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{:else}
								<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
							{/if}
							<span class="btn-label">{copied ? 'Copied' : 'Copy'}</span>
						</button>
						<button
							type="button"
							class="btn-action"
							onclick={copyLink}
							title={linkCopied ? 'Link copied' : 'Copy link to this codex or selection'}
							aria-label={linkCopied ? 'Link copied' : 'Copy link'}
						>
							{#if linkCopied}
								<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{:else}
								<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
									/>
								</svg>
							{/if}
							<span class="btn-label">{linkCopied ? 'Link copied' : 'Copy link'}</span>
						</button>
						{#if aiAssistantEnabled}
							<button
								type="button"
								class="btn-action btn-explain"
								onclick={explainWithAI}
								title={explainButtonLabel}
								aria-label={explainButtonLabel}
							>
								<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
									/>
								</svg>
								<span class="btn-label">{explainButtonLabel}</span>
							</button>
						{/if}
						<button
							type="button"
							class="btn-action"
							class:is-on={wordWrap}
							onclick={toggleWordWrap}
							title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
							aria-label={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
							aria-pressed={wordWrap}
						>
							<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 6h16M4 12h10a4 4 0 010 8H8m0 0l3-3m-3 3l3 3"
								/>
							</svg>
							<span class="btn-label">Wrap</span>
						</button>
						<button
							type="button"
							class="btn-action"
							class:is-on={minimapEnabled}
							onclick={toggleMinimap}
							title={minimapEnabled ? 'Hide minimap' : 'Show minimap'}
							aria-label={minimapEnabled ? 'Hide minimap' : 'Show minimap'}
							aria-pressed={minimapEnabled}
						>
							<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
								/>
							</svg>
							<span class="btn-label">Minimap</span>
						</button>
					</div>
				</div>

				{#if selectedCodex.description}
					<p class="editor-description">{selectedCodex.description}</p>
				{/if}

				<div class="monaco-wrap">
					{#if detailLoading}
						<div class="monaco-loading">Loading code…</div>
					{:else if editorCode}
						{#key getCodexId(selectedCodex)}
							<MonacoPane
								code={editorCode}
								language={MONACO_LANGUAGE}
								theme={MONACO_THEME}
								readOnly={true}
								initialRange={initialRange}
								onSelectionChange={handleSelectionChange}
								wordWrap={wordWrap}
								minimapEnabled={minimapEnabled}
							/>
						{/key}
					{:else}
						<div class="monaco-loading">No code available for this codex.</div>
					{/if}
				</div>
			{:else}
				<div class="editor-empty">
					{#if sidebarCollapsed}
						<div class="editor-empty-toggle">
							{@render sidebarToggle()}
						</div>
					{/if}
					{#if !loading}
						<svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
							/>
						</svg>
						<p>Select a codex from the list to view its source</p>
					{/if}
				</div>
			{/if}
		</main>
	{/if}
</div>

<style>
	.codex-workspace {
		display: flex;
		height: 100%;
		min-height: 0;
		overflow: hidden;
		background: #fff;
		border-top: 1px solid #e5e7eb;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.codex-denied {
		padding: 24px;
		width: 100%;
	}

	.error-banner {
		padding: 12px 16px;
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #b91c1c;
		border-radius: 8px;
		font-size: 0.875rem;
	}

	/* Sidebar */
	.codex-sidebar {
		width: 280px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		border-right: 1px solid #e5e7eb;
		background: #fafafa;
		min-height: 0;
	}

	.sidebar-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 8px;
		padding: 16px 16px 12px;
		border-bottom: 1px solid #e5e7eb;
	}

	.sidebar-header-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.title {
		font-size: 1rem;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.subtitle {
		font-size: 0.75rem;
		color: #6b7280;
		margin: 2px 0 0;
	}

	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: #fff;
		color: #374151;
		cursor: pointer;
		flex-shrink: 0;
	}

	.btn-icon:hover:not(:disabled) {
		background: #f3f4f6;
	}

	.btn-icon:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.icon {
		width: 16px;
		height: 16px;
	}

	.search-box {
		position: relative;
		padding: 12px 16px 0;
	}

	.search-icon {
		position: absolute;
		left: 28px;
		top: calc(50% + 6px);
		transform: translateY(-50%);
		width: 16px;
		height: 16px;
		color: #9ca3af;
	}

	.search-input {
		width: 100%;
		padding: 7px 10px 7px 34px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.8125rem;
		outline: none;
		background: #fff;
	}

	.search-input:focus {
		border-color: #6366f1;
		box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12);
	}

	.stats {
		padding: 8px 16px;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.codex-list {
		flex: 1;
		overflow-y: auto;
		padding: 4px 8px 12px;
		min-height: 0;
	}

	.list-loading,
	.list-empty {
		padding: 16px;
		font-size: 0.8125rem;
		color: #9ca3af;
		text-align: center;
	}

	.codex-item {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		width: 100%;
		padding: 10px 12px;
		margin-bottom: 2px;
		border: none;
		border-radius: 6px;
		background: transparent;
		cursor: pointer;
		text-align: left;
		transition: background 0.12s;
	}

	.codex-item:hover {
		background: #f3f4f6;
	}

	.codex-item.selected {
		background: #eef2ff;
		box-shadow: inset 3px 0 0 #6366f1;
	}

	.codex-item-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	.codex-item-desc {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	/* Editor pane */
	.codex-editor-pane {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
	}

	.editor-toolbar {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 8px;
		padding: 10px 16px;
		border-bottom: 1px solid #e5e7eb;
		background: #fff;
		flex-shrink: 0;
		container-type: inline-size;
		container-name: editor-toolbar;
	}

	.toolbar-title-row {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.editor-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.badge {
		display: inline-block;
		padding: 1px 7px;
		font-size: 0.6875rem;
		font-weight: 500;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.badge-lang {
		background: #dbeafe;
		color: #1e40af;
		text-transform: capitalize;
	}

	.badge-version {
		background: #dcfce7;
		color: #166534;
	}

	.toolbar-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}

	.btn-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 5px 12px;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 6px;
		border: 1px solid #d1d5db;
		background: #fff;
		color: #374151;
		cursor: pointer;
		flex-shrink: 0;
	}

	.btn-action:hover {
		background: #f9fafb;
	}

	.btn-action.is-on {
		background: #eef2ff;
		border-color: #6366f1;
		color: #4338ca;
	}

	.btn-explain {
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		border-color: transparent;
		color: #fff;
	}

	.btn-explain:hover {
		opacity: 0.92;
	}

	@media (max-width: 720px) {
		.badge-lang {
			display: none;
		}

		.btn-label {
			display: none;
		}

		.btn-action {
			width: 32px;
			height: 32px;
			padding: 0;
		}

		.editor-toolbar {
			padding: 10px 12px;
		}
	}

	@container editor-toolbar (max-width: 560px) {
		.btn-label {
			display: none;
		}

		.btn-action {
			width: 32px;
			height: 32px;
			padding: 0;
		}
	}

	:global(html.codex-viewer-hide-assistant-fab .assistant-fab) {
		display: none !important;
	}

	.editor-description {
		padding: 8px 16px;
		margin: 0;
		font-size: 0.8125rem;
		color: #6b7280;
		border-bottom: 1px solid #f3f4f6;
		flex-shrink: 0;
	}

	.monaco-wrap {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.monaco-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #9ca3af;
		font-size: 0.875rem;
	}

	.editor-empty {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #9ca3af;
		gap: 12px;
	}

	.editor-empty-toggle {
		position: absolute;
		top: 10px;
		left: 16px;
	}

	.empty-icon {
		width: 48px;
		height: 48px;
	}
</style>
