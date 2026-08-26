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

	function readSidebarCollapsed(): boolean {
		try {
			return sessionStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
		} catch {
			return false;
		}
	}

	function persistSidebarCollapsed(collapsed: boolean) {
		try {
			sessionStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
		} catch {
			/* sessionStorage unavailable */
		}
	}

	let sidebarCollapsed = $state(readSidebarCollapsed());

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
		persistSidebarCollapsed(sidebarCollapsed);
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

	onMount(() => {
		void loadCodexes();
	});

	onDestroy(() => {
		clearTimeout(urlSyncTimer);
		ctx.host?.setFocus?.(null);
	});
</script>

{#snippet showSidebarButton()}
	<button
		class="btn-icon"
		onclick={toggleSidebar}
		title="Show file list"
		aria-label="Show file list"
		aria-expanded={!sidebarCollapsed}
		aria-controls="codex-sidebar"
	>
		<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
			/>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 4v16" />
		</svg>
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
		<aside class="codex-sidebar" class:collapsed={sidebarCollapsed} id="codex-sidebar">
			<div class="sidebar-header">
				<div>
					<h1 class="title">Codex Viewer</h1>
					<p class="subtitle">{extensionDescription}</p>
				</div>
				<div class="sidebar-header-actions">
					<button
						class="btn-icon"
						onclick={toggleSidebar}
						title="Hide file list"
						aria-label="Hide file list"
						aria-expanded={!sidebarCollapsed}
						aria-controls="codex-sidebar"
					>
						<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</button>
					<button class="btn-icon" onclick={loadCodexes} disabled={loading} title="Refresh">
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

		<main class="codex-editor-pane">
			{#if sidebarCollapsed && !selectedCodex}
				<div class="editor-toolbar">
					<div class="toolbar-left">
						{@render showSidebarButton()}
					</div>
				</div>
			{/if}
			{#if selectedCodex}
				<div class="editor-toolbar">
					<div class="toolbar-left">
						{#if sidebarCollapsed}
							{@render showSidebarButton()}
						{/if}
						<h2 class="editor-title">{selectedCodex.name || getCodexId(selectedCodex)}</h2>
						<span class="badge badge-lang">{MONACO_LANGUAGE}</span>
						{#if selectedCodex.version}
							<span class="badge badge-version">v{selectedCodex.version}</span>
						{/if}
					</div>
					<div class="toolbar-actions">
						<button class="btn-action" onclick={copyCode}>
							{copied ? 'Copied' : 'Copy'}
						</button>
						<button class="btn-action" onclick={copyLink} title="Copy link to this codex or selection">
							{linkCopied ? 'Link copied' : 'Copy link'}
						</button>
						{#if aiAssistantEnabled}
						<button class="btn-action btn-explain" onclick={explainWithAI}>
							{explainButtonLabel}
						</button>
						{/if}
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
							/>
						{/key}
					{:else}
						<div class="monaco-loading">No code available for this codex.</div>
					{/if}
				</div>
			{:else if !loading}
				<div class="editor-empty">
					<svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
						/>
					</svg>
					<p>Select a codex from the list to view its source</p>
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

	.codex-sidebar.collapsed {
		display: none;
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
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 16px;
		border-bottom: 1px solid #e5e7eb;
		background: #fff;
		flex-shrink: 0;
	}

	.toolbar-left {
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
		gap: 8px;
		flex-shrink: 0;
	}

	.btn-action {
		padding: 5px 12px;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 6px;
		border: 1px solid #d1d5db;
		background: #fff;
		color: #374151;
		cursor: pointer;
	}

	.btn-action:hover {
		background: #f9fafb;
	}

	.btn-explain {
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		border-color: transparent;
		color: #fff;
	}

	.btn-explain:hover {
		opacity: 0.92;
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
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #9ca3af;
		gap: 12px;
	}

	.empty-icon {
		width: 48px;
		height: 48px;
	}
</style>
