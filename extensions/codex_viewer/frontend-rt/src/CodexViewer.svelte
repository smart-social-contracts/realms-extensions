<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount, onDestroy } from 'svelte';
	import MonacoPane, { type LineRange, type SelectionInfo } from './MonacoPane.svelte';
	import { isLayered } from './legislation';
	import {
		emptyState,
		sourceEntries,
		type HistoryRow,
		type SourceEntry,
	} from './source';
	import {
		ancestry,
		domainLabel,
		heldChapters,
		inheritsAnything,
		ownLayer,
		stackOf,
		treeFor,
		type DomainChapter,
		type DomainRow,
		type Layer,
	} from './layers';
	import {
		codicesFrom,
		publishedChapter,
		publishedRelease,
		releaseChapters,
		type PublishedRelease,
	} from './published';
	import { chapterFile, chapterLanguage } from './source';

	let { ctx }: { ctx: any } = $props();

	let aiAssistantEnabled = $derived(ctx.config?.aiAssistantEnabled !== false);

	/** A file of the list, once its text has been read. */
	interface Codex extends SourceEntry {
		code?: string;
		/** A chapter of the tree: which layer publishes it, which domain it defines, and where its text is kept. */
		layer?: string;
		domain?: string;
		held?: 'realm' | 'published';
		/** A published chapter's release, which pins its commit and its digest. */
		release?: PublishedRelease;
	}

	const MONACO_THEME = 'vs';
	const EXTENSION_ID = 'codex_viewer';
	const SIDEBAR_COLLAPSED_KEY = 'codex-viewer-sidebar-collapsed';
	const WORD_WRAP_KEY = 'codex-viewer-word-wrap';
	const MINIMAP_KEY = 'codex-viewer-minimap';
	const NARROW_VIEWPORT = '(max-width: 720px)';
	const REGISTRY_TIMEOUT_MS = 20_000;
	const MAX_HISTORY_PAGES = 20;

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

	let codexes = $state<Codex[]>([]);
	/** The codex in force, kept so that the stack and the tree can be built from it. */
	let activeCodex = $state<unknown>(null);
	let stack = $state<Layer[]>([]);
	/** The layer of the stack being looked at: the deepest by default, which is what governs here. */
	let selectedLayer = $state('');
	/** Whether the tree keeps what the chosen layer inherits, or only the chapters that layer itself publishes. */
	let inherited = $state(true);
	/** The domains whose chain of earlier layers is unfolded. */
	let openDomains = $state<string[]>([]);
	/** A layer the realm does not run, once its published release has been read; null while it is being read. */
	const publishedByLayer = new Map<string, PublishedRelease | null>();
	let publishedChapters = $state<Codex[]>([]);
	/** Layers whose published source could not be read: shown in the stack, not as an error. */
	let publishedUnreachable = $state<string[]>([]);
	/** A chapter that was fetched and did not match the digest its release pins. That is an error, and it is shown. */
	let publishedError = $state('');
	let loading = $state(true);
	/** The `?codex=` of the link the page was opened with, until a chapter of that id is found. */
	let wantedCodex = $state('');
	let unavailable = $state(false);
	let searchTerm = $state('');
	let selectedCodex = $state<Codex | null>(null);
	let detailLoading = $state(false);
	let copied = $state(false);
	let linkCopied = $state(false);
	let currentSelection = $state<SelectionInfo | null>(null);
	let initialRange = $state<LineRange | null>(null);
	const sourceCache = new Map<string, string>();
	let registryId: string = $derived(ctx.config?.fileRegistryCanisterId || '');
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

	/** Everything the tree can show: what the realm holds, and what the layers above publish. */
	let allChapters = $derived([...codexes, ...publishedChapters] as DomainChapter[]);
	let tree = $derived(
		isLayered(activeCodex) && selectedLayer ? treeFor(allChapters, selectedLayer, inherited, stack) : [],
	);
	let visibleTree = $derived(
		searchTerm.trim()
			? tree.filter((row) => row.domain.toLowerCase().includes(searchTerm.trim().toLowerCase()))
			: tree,
	);
	let canInherit = $derived(inheritsAnything(selectedLayer, stack));
	/** Where a layer the realm does not run is read from, named so that the stack can say whose text it shows. */
	let publishedFrom = $derived(
		ctx.config?.codices === false ? '' : `${codicesFrom(ctx.config).repo}@${codicesFrom(ctx.config).ref}`,
	);

	let editorCode = $derived(selectedCodex?.code ?? '');

	let explainButtonLabel = $derived(
		currentSelection?.text?.trim() ? 'Explain selection' : 'Explain codex',
	);

	/** A realm read operation's reply, or null when it fails or is not available to the caller. */
	async function read(name: string, args: Record<string, unknown> = {}): Promise<any> {
		try {
			const reply = await ctx.read(name, args);
			if (reply?.ok) return reply;
			console.warn(`${name}:`, reply?.error);
		} catch (e) {
			console.warn(`${name} failed:`, e);
		}
		return null;
	}

	// Same URL scheme the host uses to load extension bundles from the file registry.
	function registryBaseUrl(canisterId: string): string {
		const host = window.location.host;
		if (host.includes('localhost') || host.includes('127.0.0.1')) {
			return `http://${canisterId}.localhost:${host.split(':')[1] ?? '4943'}`;
		}
		return `https://${canisterId}.icp0.io`;
	}

	/** A file of a published codex package as text, or null when it cannot be fetched. */
	async function registryFile(codex: Codex, path: string): Promise<string | null> {
		if (!registryId || !codex.package || !codex.version) return null;
		const url = `${registryBaseUrl(registryId)}/ext/${encodeURIComponent(codex.package)}/${encodeURIComponent(codex.version)}/${path}`;
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), REGISTRY_TIMEOUT_MS);
		try {
			const resp = await fetch(url, { signal: controller.signal });
			return resp.ok ? await resp.text() : null;
		} catch (e) {
			console.warn(`${path} of ${codex.id}:`, e);
			return null;
		} finally {
			clearTimeout(timer);
		}
	}

	/**
	 * A chapter's text as the realm holds it. `legislation_chapter` is a public read (api/links.py): the checksum
	 * pins the text, so it is as public as the legislation it holds.
	 */
	async function chapterSource(codex: Codex): Promise<string | null> {
		if (!codex.checksum) return null;
		const reply = await read('legislation_chapter', { chapter: codex.checksum });
		return typeof reply?.text === 'string' ? reply.text : null;
	}

	/** The published text of a chapter of a layer the realm does not run, checked against the digest it is pinned by. */
	async function publishedSource(codex: Codex): Promise<string | null> {
		if (!codex.release || !codex.layer || !codex.domain) return null;
		try {
			return await publishedChapter(codex.layer, codex.domain, codex.release, codicesFrom(ctx.config));
		} catch (e: any) {
			publishedError = `${codex.id}: ${e?.message ?? e}`;
			console.warn(`published ${codex.id}:`, e);
			return null;
		}
	}

	/** The text of one file of the list, by where its kind keeps it. */
	async function sourceOf(codex: Codex): Promise<string | null> {
		if (codex.kind !== 'chapter') return await registryFile(codex, 'backend/hooks.py');
		return codex.held === 'published' ? await publishedSource(codex) : await chapterSource(codex);
	}

	/**
	 * The chapters a layer publishes, for a layer the realm does not run. The release pins each chapter's commit and
	 * its digest; `published.ts` checks the digest before any text is shown. Nothing here is what governs this realm,
	 * and every entry it makes is marked `published` so the page can say so.
	 */
	async function loadPublished(layer: string) {
		if (publishedByLayer.has(layer)) return;
		// A host that does not want the page reaching outside the realm sets `codices: false`. Nothing can then be
		// read of a layer the realm does not run, which is what the stack says: not that it is there to be read.
		if (ctx.config?.codices === false) {
			publishedUnreachable = [...new Set([...publishedUnreachable, layer])];
			return;
		}
		publishedByLayer.set(layer, null);
		try {
			const release = await publishedRelease(layer, codicesFrom(ctx.config));
			publishedByLayer.set(layer, release);
			if (!release) return;
			const made: Codex[] = Object.keys(releaseChapters(release)).map((domain) => ({
				id: `${layer}/${domain}`,
				name: chapterFile(`${layer}/${domain}`),
				kind: 'chapter' as const,
				language: chapterLanguage(`${layer}/${domain}`),
				layer,
				domain,
				held: 'published' as const,
				version: release.version,
				release,
			}));
			publishedChapters = [...publishedChapters.filter((c) => c.layer !== layer), ...made];
		} catch (e: any) {
			// Being out of reach is not an error: the realm's own legislation is unaffected, and the stack says so.
			publishedUnreachable = [...new Set([...publishedUnreachable, layer])];
			console.warn(`published source of ${layer}:`, e);
		}
	}

	/**
	 * Every layer at or above the one chosen that the realm does not run; their text comes from where they publish.
	 * What is above comes from the stack, so a sibling sync source counts (`layers.ts`).
	 */
	async function loadPublishedFor(layer: string) {
		const at = stack.findIndex((entry) => entry.id === layer);
		const wanted = inherited ? (at < 0 ? ancestry(layer) : stack.slice(0, at + 1).map((e) => e.id)) : [layer];
		const missing = stack.filter((entry) => !entry.installed && wanted.includes(entry.id));
		await Promise.all(missing.map((entry) => loadPublished(entry.id)));
	}

	/** Name and description from each package's manifest.json; best effort, the list works without them. */
	async function enrichFromManifests(list: Codex[]) {
		await Promise.all(
			list.filter((c) => c.kind === 'package').map(async (codex) => {
				const text = await registryFile(codex, 'manifest.json');
				if (!text) return;
				try {
					const manifest = JSON.parse(text);
					const patch: Partial<Codex> = {};
					if (typeof manifest?.name === 'string' && manifest.name) patch.name = manifest.name;
					if (typeof manifest?.description === 'string') patch.description = manifest.description;
					codexes = codexes.map((c) => (c.id === codex.id ? { ...c, ...patch } : c));
					if (selectedCodex?.id === codex.id) selectedCodex = { ...selectedCodex, ...patch };
				} catch {
					/* not a JSON manifest */
				}
			}),
		);
	}

	function getCodexId(codex: Codex): string {
		return codex.id || codex.name || '';
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
		// The view is part of the link: the same URL opens the same layer, read the same way.
		if (selectedLayer) params.set('layer', selectedLayer);
		if (selectedLayer && !inherited) params.set('inherited', '0');
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
							languageId: codex.language,
							range: {
								startLine: selection.startLine,
								endLine: selection.endLine,
							},
							text: selection.text,
						}
					: undefined,
		});
	}

	function syncUrlFromState(codex: Codex | null, selection: SelectionInfo | null) {
		if (typeof window === 'undefined' || !codex) return;
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

	/** The view the link asks for: which layer, read which way, which lines, and which chapter (`wantedCodex`). */
	function readUrlState() {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		const layerParam = params.get('layer');
		if (layerParam && stack.some((entry) => entry.id === layerParam)) selectedLayer = layerParam;
		// At the top of the stack there is nothing to inherit, and the checkbox is disabled: the link cannot leave
		// it unchecked over a tree that is the whole layer anyway.
		if (params.get('inherited') === '0' && inheritsAnything(selectedLayer, stack)) inherited = false;
		pendingExplainOnLoad = params.get('explain') === '1';
		initialRange = parseLinesParam(params.get('lines'));
		wantedCodex = params.get('codex') ?? '';
	}

	/**
	 * Open the chapter the link names, if it is among the chapters known by now. A published layer's chapters arrive
	 * after the realm's own, so a link to one of them resolves on the second call, once `allChapters` holds it: until
	 * then `wantedCodex` stays set, and matching against the realm's chapters alone would open a different layer's
	 * chapter of the same domain.
	 */
	async function openWantedCodex(): Promise<boolean> {
		if (!wantedCodex) return false;
		const want = wantedCodex;
		const all = allChapters as Codex[];
		const match =
			all.find((c) => getCodexId(c) === want) ??
			all.find((c) => c.package === want && c.status === 'active') ??
			all.find((c) => c.name === want);
		if (!match) return false;
		wantedCodex = '';
		await selectCodex(match, { skipUrlSync: true });
		return true;
	}

	/** Read the published layers of the layer chosen, and then open what the link wanted of them. */
	async function settlePublished() {
		await loadPublishedFor(selectedLayer);
		await openWantedCodex();
		if (!selectedCodex) {
			const first = tree[0]?.runs;
			if (first) await selectCodex(first as Codex);
		}
	}

	async function loadCodexes() {
		loading = true;
		unavailable = false;
		try {
			const rows: HistoryRow[] = [];
			let active: unknown = null;
			let from: number | null = 1;
			for (let i = 0; from && i < MAX_HISTORY_PAGES; i++) {
				const status = await read('codex_status', { from, count: 100 });
				if (!status) {
					unavailable = i === 0;
					break;
				}
				if (i === 0) {
					active = status.codex ?? null;
					// A layered codex is its own file list; the history's earlier codices hold no file to read.
					if (isLayered(active)) break;
					if (status.codex) rows.push(status.codex as HistoryRow);
				}
				rows.push(...((status.history ?? []) as HistoryRow[]));
				from = typeof status.next === 'number' ? status.next : null;
			}
			activeCodex = active;
			if (isLayered(active)) {
				stack = stackOf(active);
				codexes = heldChapters(active) as Codex[];
				// The realm's own layer is the one that governs here: that is what the tab opens on.
				selectedLayer = ownLayer(active) || (stack.length ? stack[stack.length - 1].id : '');
				readUrlState();
				// Not awaited. The realm holds its own legislation and it is ready now; a published layer comes from
				// outside the realm, and a host that never answers must not keep the realm's own chapters off the
				// page. The request is bounded as well, but the tree does not wait for it either way.
				void settlePublished();
				await openWantedCodex();
			} else {
				stack = [];
				selectedLayer = '';
				codexes = sourceEntries(active, rows);
				void enrichFromManifests(codexes);
				readUrlState();
				await openWantedCodex();
			}
			// A link to a published chapter is still pending: `settlePublished` opens it, or falls back to the tree.
			if (!selectedCodex && !wantedCodex) {
				const first = isLayered(active) ? tree[0]?.runs : codexes[0];
				if (first) await selectCodex(first as Codex);
			}
		} finally {
			loading = false;
		}
	}

	async function selectCodex(
		codex: Codex,
		opts: { skipUrlSync?: boolean; preserveRange?: boolean } = {},
	) {
		if (selectedCodex && getCodexId(selectedCodex) === getCodexId(codex) && selectedCodex.code != null) {
			if (!opts.preserveRange) {
				currentSelection = null;
				if (!opts.skipUrlSync) initialRange = null;
			}
			publishFocus(codex, currentSelection);
			if (!opts.skipUrlSync) syncUrlFromState(codex, currentSelection);
			return;
		}

		detailLoading = true;
		// The banner belongs to the chapter it names, and that chapter is no longer the one being read.
		publishedError = '';
		if (!opts.preserveRange) {
			currentSelection = null;
			if (!opts.skipUrlSync) initialRange = null;
		}
		selectedCodex = codex;

		const cacheKey = codex.checksum ?? codex.id;
		let code = sourceCache.get(cacheKey);
		if (code === undefined) {
			code = (await sourceOf(codex)) ?? '';
			if (code) sourceCache.set(cacheKey, code);
		}
		if (selectedCodex?.id !== codex.id) return;
		const current: Codex = { ...selectedCodex, code };
		selectedCodex = current;
		detailLoading = false;
		publishFocus(current, currentSelection);
		if (!opts.skipUrlSync) syncUrlFromState(current, currentSelection);
		maybeTriggerExplainOnLoad();
	}

	function maybeTriggerExplainOnLoad() {
		if (!pendingExplainOnLoad || !aiAssistantEnabled) return;
		pendingExplainOnLoad = false;
		ctx.host?.dispatch?.({ type: 'assistant.prompt', autoSend: true });
	}

	/** Look at another layer of the stack: what it inherits is read where it is published, if the realm lacks it. */
	async function chooseLayer(layer: string) {
		selectedLayer = layer;
		if (!inheritsAnything(layer, stack)) inherited = true;
		publishedError = '';
		await loadPublishedFor(layer);
		syncUrlFromState(selectedCodex, currentSelection);
	}

	async function toggleInherited(on: boolean) {
		inherited = on;
		publishedError = '';
		await loadPublishedFor(selectedLayer);
		syncUrlFromState(selectedCodex, currentSelection);
	}

	function toggleDomain(domain: string) {
		openDomains = openDomains.includes(domain)
			? openDomains.filter((d) => d !== domain)
			: [...openDomains, domain];
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

			{#if stack.length}
				<div class="layer-stack" data-testid="layer-stack">
					<div class="layer-stack-title">Layers</div>
					{#each stack as layer (layer.id)}
						<button
							type="button"
							class="layer-item"
							class:selected={selectedLayer === layer.id}
							class:not-installed={!layer.installed}
							onclick={() => chooseLayer(layer.id)}
							style={`padding-left: ${8 + layer.depth * 10}px`}
							title={layer.installed
								? `${layer.id}: this realm runs this layer`
								: publishedFrom
									? `${layer.id}: published, not installed on this realm. Its text is read from ` +
										`${publishedFrom} and checked against the digest that release pins; no realm vouches for it`
									: `${layer.id}: not installed on this realm, and its published source is turned off here`}
						>
							<span class="layer-name">{layer.name}</span>
							{#if layer.installed}
								<span class="layer-mark runs">runs here</span>
							{:else if publishedUnreachable.includes(layer.id)}
								<span class="layer-mark unreachable">source unavailable</span>
							{:else}
								<span class="layer-mark published">published</span>
							{/if}
							{#if layer.version}<span class="layer-version">v{layer.version}</span>{/if}
						</button>
					{/each}
					<label class="layer-inherited" title={canInherit
						? 'Off: only the chapters this layer itself publishes'
						: 'The outermost layer inherits nothing'}>
						<input
							type="checkbox"
							checked={inherited}
							disabled={!canInherit}
							onchange={(e) => toggleInherited(e.currentTarget.checked)}
						/>
						<span>Include inherited legislation</span>
					</label>
				</div>
			{/if}

			<div class="stats">
				{#if stack.length}
					{visibleTree.length}
					{visibleTree.length === 1 ? 'domain' : 'domains'}
					{#if !inherited}· this layer alone{/if}
				{:else}
					{codexes.length} total
					{#if searchTerm && filteredCodexes.length !== codexes.length}
						· {filteredCodexes.length} matching
					{/if}
				{/if}
			</div>

			{#if publishedError}
				<div class="published-error" data-testid="published-error">
					{publishedError}
				</div>
			{/if}

			<div class="codex-list">
				{#if loading}
					<div class="list-loading">Loading codexes…</div>
				{:else if stack.length}
					{#if visibleTree.length === 0}
						<div class="list-empty">
							{searchTerm ? 'No domains match your search' : 'This layer publishes no chapters.'}
						</div>
					{:else}
						{#each visibleTree as row (row.domain)}
							<div class="domain" class:open={openDomains.includes(row.domain)}>
								<div class="domain-row">
									{#if row.builds_on.length}
										<button
											type="button"
											class="domain-fold"
											aria-expanded={openDomains.includes(row.domain)}
											aria-label={`What ${row.domain} builds on`}
											onclick={() => toggleDomain(row.domain)}
										>
											{openDomains.includes(row.domain) ? '▾' : '▸'}
										</button>
									{:else}
										<span class="domain-fold empty"></span>
									{/if}
									<button
										class="codex-item domain-main"
										class:selected={isSelected(row.runs as Codex)}
										onclick={() => selectCodex(row.runs as Codex)}
									>
										<span class="codex-item-name">{domainLabel(row.domain)}</span>
										<span class="domain-layer">{(row.runs as Codex).layer}</span>
										{#if (row.runs as Codex).held === 'published'}
											<span class="domain-mark published">published</span>
										{/if}
									</button>
								</div>
								{#if openDomains.includes(row.domain)}
									<div class="domain-chain">
										<div class="domain-chain-title">builds on</div>
										{#each row.builds_on as earlier (earlier.id)}
											<button
												class="codex-item chain-item"
												class:selected={isSelected(earlier as Codex)}
												onclick={() => selectCodex(earlier as Codex)}
											>
												<span class="codex-item-name">{earlier.name}</span>
												<span class="domain-layer">{earlier.layer}</span>
												{#if earlier.held === 'published'}
													<span class="domain-mark published">published</span>
												{/if}
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				{:else if filteredCodexes.length === 0}
					<div class="list-empty">
						{#if unavailable}
							Codex information is not available to you.
						{:else}
							{searchTerm ? 'No codexes match your search' : 'No codexes found'}
						{/if}
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
						<span class="badge badge-lang">{selectedCodex.language}</span>
						{#if selectedCodex.version}
							<span class="badge badge-version">v{selectedCodex.version}</span>
						{/if}
						{#if selectedCodex.status}
							<span class="badge badge-status">{selectedCodex.status}</span>
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
								language={selectedCodex.language}
								theme={MONACO_THEME}
								readOnly={true}
								initialRange={initialRange}
								onSelectionChange={handleSelectionChange}
								wordWrap={wordWrap}
								minimapEnabled={minimapEnabled}
							/>
						{/key}
					{:else}
						<div class="monaco-loading">
							{emptyState(selectedCodex, !!registryId)}
						</div>
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

	.layer-stack {
		padding: 10px 12px;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.layer-stack-title {
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #6b7280;
		margin-bottom: 4px;
	}

	.layer-item {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		padding: 5px 8px;
		border: 1px solid transparent;
		border-radius: 6px;
		background: none;
		cursor: pointer;
		text-align: left;
		font: inherit;
		color: #111827;
	}

	.layer-item:hover { background: #f3f4f6; }

	.layer-item.selected {
		background: #eef2ff;
		border-color: #c7d2fe;
		font-weight: 600;
	}

	.layer-item.not-installed .layer-name { color: #6b7280; }

	.layer-name { font-size: 0.8125rem; }

	.layer-mark {
		font-size: 0.625rem;
		padding: 1px 5px;
		border-radius: 999px;
		font-weight: 500;
	}

	.layer-mark.runs { background: #dcfce7; color: #166534; }
	.layer-mark.published { background: #f3f4f6; color: #4b5563; }
	.layer-mark.unreachable { background: #fef3c7; color: #92400e; }
	.layer-version { font-size: 0.6875rem; color: #6b7280; margin-left: auto; }

	.layer-inherited {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
		font-size: 0.75rem;
		color: #374151;
		cursor: pointer;
	}

	.layer-inherited input:disabled + span { color: #9ca3af; }

	.published-error {
		margin: 0 12px 8px;
		padding: 6px 8px;
		border-radius: 6px;
		background: #fef2f2;
		color: #991b1b;
		font-size: 0.75rem;
	}

	.domain-row { display: flex; align-items: stretch; }

	.domain-fold {
		width: 20px;
		border: none;
		background: none;
		cursor: pointer;
		color: #6b7280;
		font-size: 0.6875rem;
		padding: 0;
	}

	.domain-fold.empty { cursor: default; }
	.domain-main { flex: 1; }
	.domain-layer { font-size: 0.6875rem; color: #6b7280; }

	.domain-mark.published {
		font-size: 0.625rem;
		padding: 1px 5px;
		border-radius: 999px;
		background: #f3f4f6;
		color: #4b5563;
	}

	.domain-chain { padding: 2px 0 6px 20px; }

	.domain-chain-title {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9ca3af;
		padding: 2px 10px;
	}

	.chain-item { opacity: 0.85; }

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

	.badge-status {
		background: #f3f4f6;
		color: #374151;
		text-transform: capitalize;
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
