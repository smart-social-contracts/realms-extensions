<script lang="ts">
	import { untrack } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';
	import AccessDenied from '../../../_shared/frontend-rt/AccessDenied.svelte';
	import { loadExtensionI18n, t } from './lib/i18n';
	import { KINDS, kindOf, kindText } from './organizationKind';

	let { ctx }: { ctx: any } = $props();

	$effect(() => {
		const localeStore = ctx?.locale;
		if (!localeStore?.subscribe) {
			void loadExtensionI18n('en');
			return;
		}
		return localeStore.subscribe((locale: string | null | undefined) => void loadExtensionI18n(locale || 'en'));
	});

	/** One page of rows, or the realm's reason for refusing it. */
	type Page = { rows: any[]; next: number | null; scanned?: number } | string;

	interface EntityType {
		value: string;
		label: string;
		className: string;
		load: (from: number | null) => Promise<Page>;
	}

	const entityIcons: Record<string, string> = {
		Department: '🗂️', Dispute: '⚖️', Event: '🕒', Fund: '🏦', Invite: '✉️',
		Land: '🏞️', LedgerEntry: '📒', License: '📃', NFTToken: '🖼️',
		Organization: '🏢', Proposal: '🗳️', Realm: '🏛️', Task: '📋', Tender: '📣',
		Token: '🪙', User: '👤',
	};

	const ACCESS_REFUSAL = /^\S+ needs (\S+)$/;
	const pageSize = 10;
	// The rows the realm reads through per call (its most) when a filter makes most of them not match: a page of 10 would find
	// a rare kind a hop at a time.
	const filteredCount = 500;
	const MAX_HOPS = 20;

	let selectedType = $state('User');
	// The kind the organisations are listed by; the realm does the filtering (`organization_list` takes a `kind`).
	let kindFilter = $state('');
	let accessDeniedOp: string | null = $state(null);
	let unavailable = $state(false);

	function addToast(message: string, type: 'success' | 'warning' = 'success') {
		if (typeof ctx.notify === 'function') {
			ctx.notify(type, message);
			return;
		}
		console.warn('[extension]', type, message);
	}
	let items: any[] = $state([]);
	let objLoading = $state(false);
	let expandedItem: number | null = $state(null);
	let currentPage = $state(0);
	let nextCursor: number | null = $state(null);
	// The rows the realm read through for the page shown: what "none of this kind" can claim when the realm has more.
	let searched = $state(0);
	// cursors[i] is the `from` of page i (null: the operation's default start).
	let cursors: (number | null)[] = [null];
	let requestSeq = 0;

	function getIcon(className: string): string {
		return entityIcons[className] || '📊';
	}

	function formatLabel(className: string): string {
		return className.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
	}

	/** A realm read operation's reply; failures come back as `{ ok: false, error }` rather than throwing. */
	async function read(name: string, args: Record<string, unknown> = {}): Promise<any> {
		try {
			const reply = await ctx.read(name, args);
			if (reply?.ok) return reply;
			return { ok: false, error: String(reply?.error ?? '') };
		} catch (e: any) {
			return { ok: false, error: String(e?.message ?? e) };
		}
	}

	/**
	 * A paginated list operation whose rows are under `key`; `filters` are the arguments that narrow it, and `perCall` the rows
	 * it reads through, both read at each call. The realm filters a page of rows after reading it, so a page can hold fewer
	 * rows than `perCall`, or none, while more follow (`next`): `scanned` is what the call read through.
	 */
	function listed(op: string, key: string, filters: () => Record<string, unknown> = () => ({}), perCall: () => number = () => pageSize) {
		return async (from: number | null): Promise<Page> => {
			const count = perCall();
			const reply = await read(op, { ...(from != null ? { from } : {}), count, ...filters() });
			if (!reply.ok) return reply.error;
			return { rows: Array.isArray(reply[key]) ? reply[key] : [], next: reply.next ?? null, scanned: count };
		};
	}

	async function loadFunds(from: number | null): Promise<Page> {
		const reply = await read('treasury_view', { from: from ?? 1, count: pageSize });
		if (!reply.ok) return reply.error;
		const funds = reply.funds && typeof reply.funds === 'object' ? reply.funds : {};
		return { rows: Object.entries(funds).map(([id, balances]) => ({ id, balances })), next: reply.next ?? null };
	}

	function registeredTokens(key: 'tokens' | 'nft_tokens') {
		return async (): Promise<Page> => {
			const reply = await read('treasury_view', { count: 1 });
			if (!reply.ok) return reply.error;
			return { rows: Array.isArray(reply[key]) ? reply[key] : [], next: null };
		};
	}

	async function loadRealm(): Promise<Page> {
		const [info, status] = await Promise.all([read('realm_info'), read('status')]);
		if (!info.ok && !status.ok) return info.error;
		const row = {
			...(info.ok ? info.realm : {}),
			...(status.ok
				? { status: status.status, version: status.version, canister: status.canister, operations: status.operations }
				: {}),
		};
		return { rows: [row], next: null };
	}

	function entity(className: string, load: EntityType['load']): EntityType {
		return { value: className, label: `${getIcon(className)} ${formatLabel(className)}`, className, load };
	}

	const entityTypes: EntityType[] = [
		entity('Department', listed('department_list', 'departments')),
		entity('Dispute', listed('dispute_list_all', 'disputes')),
		entity('Event', listed('events', 'events')),
		entity('Fund', loadFunds),
		entity('Invite', listed('invite_list', 'invites')),
		entity('Land', listed('land_list', 'lands')),
		entity('LedgerEntry', listed('ledger_view', 'entries')),
		entity('License', listed('license_list', 'licenses')),
		entity('NFTToken', registeredTokens('nft_tokens')),
		entity(
			'Organization',
			listed('organization_list', 'organizations', () => (kindFilter ? { kind: kindFilter } : {}), () => (kindFilter ? filteredCount : pageSize)),
		),
		entity('Proposal', listed('proposal_list', 'proposals')),
		entity('Realm', loadRealm),
		entity('Task', listed('task_list', 'tasks')),
		entity('Tender', listed('tender_list', 'tenders')),
		entity('Token', registeredTokens('tokens')),
		entity('User', listed('user_list', 'users')),
	];

	function titleOf(item: any): string {
		for (const key of ['name', 'title', 'nickname', 'op', 'description']) {
			if (typeof item?.[key] === 'string' && item[key]) return item[key];
		}
		return '';
	}

	function shown(value: unknown): string {
		if (value == null || value === '') return '—';
		return typeof value === 'object' ? JSON.stringify(value) : String(value);
	}

	// ── Browse ──

	async function loadData(pageIndex = 0) {
		const type = entityTypes.find((t) => t.value === selectedType);
		if (!type) return;
		const seq = ++requestSeq;
		objLoading = true;
		expandedItem = null;
		accessDeniedOp = null;
		unavailable = false;

		let page = await type.load(cursors[pageIndex] ?? null);
		let readThrough = typeof page === 'string' ? 0 : (page.scanned ?? 0);
		// Id-range pages can come back empty (deleted rows, or none of the rows had the kind asked for): follow `next` to the next rows.
		for (let hops = 0; typeof page !== 'string' && page.rows.length === 0 && page.next != null && hops < MAX_HOPS; hops++) {
			page = await type.load(page.next);
			if (typeof page !== 'string') readThrough += page.scanned ?? 0;
		}
		if (seq !== requestSeq) return;

		if (typeof page === 'string') {
			console.warn(`[admin_dashboard] ${type.value}:`, page);
			const needs = page.match(ACCESS_REFUSAL);
			if (needs || page === 'sign in first') accessDeniedOp = needs?.[1] ?? '';
			else unavailable = true;
			items = [];
			nextCursor = null;
		} else {
			items = page.rows;
			nextCursor = page.next;
			searched = readThrough;
			currentPage = pageIndex;
			cursors = [...cursors.slice(0, pageIndex + 1), page.next];
		}
		objLoading = false;
	}

	function toggleExpand(index: number) {
		expandedItem = expandedItem === index ? null : index;
	}

	async function copyJSON(item: any) {
		try {
			await navigator.clipboard.writeText(JSON.stringify(item, null, 2));
			addToast('JSON copied to clipboard');
		} catch {
			addToast('Copying is not available in this browser', 'warning');
		}
	}

	function goToPage(page: number) {
		loadData(page);
	}

	$effect(() => {
		selectedType;
		kindFilter;
		untrack(() => {
			cursors = [null];
			currentPage = 0;
			loadData(0);
		});
	});
</script>

<div class="w-full px-4 max-w-none">
	<!-- Header -->
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Data Explorer</h1>
			<p class="text-gray-600 mt-1">{extensionDescription}</p>
		</div>
		<button
			onclick={() => loadData(currentPage)}
			disabled={objLoading}
			class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
			title="Refresh"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
		</button>
	</div>

	{#if accessDeniedOp !== null}
		<AccessDenied operation={accessDeniedOp} />
	{/if}

	<!-- Entity type selector -->
	<div class="mb-4 bg-white shadow-sm rounded-lg p-4">
		<div class="flex items-center gap-4 flex-wrap">
			<label for="entity-type-select" class="font-medium text-gray-700">Entity Type:</label>
			<select
				id="entity-type-select"
				bind:value={selectedType}
				class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
			>
				{#each entityTypes as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
			{#if selectedType === 'Organization'}
				<label for="org-kind-select" class="font-medium text-gray-700">{t('org_kind_label')}:</label>
				<select
					id="org-kind-select"
					bind:value={kindFilter}
					class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
				>
					<option value="">{t('org_kind_all')}</option>
					{#each KINDS as kind}
						<option value={kind}>{kindText(kind, t)}</option>
					{/each}
				</select>
			{/if}
		</div>
		{#if selectedType === 'Organization'}
			<p class="mt-3 text-xs text-gray-500">{t('org_kind_hint')}</p>
		{/if}
		<p class="mt-3 text-xs text-gray-500">
			Records are read-only here. Only record types the realm offers a list for are shown.
		</p>
	</div>

	<div class="mb-4 flex items-center gap-4">
			<button
				onclick={() => loadData(0)}
				disabled={objLoading}
				class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
			>{objLoading ? 'Loading…' : 'Load Data'}</button>
			<div class="ml-auto text-gray-600 text-sm">
				{#if items.length > 0}
					Showing {items.length} {items.length === 1 ? 'item' : 'items'}{nextCursor != null ? ' (more on the next page)' : ''}
				{/if}
			</div>
		</div>

		<div class="bg-white shadow-sm rounded-lg">
			{#if objLoading}
				<div class="text-center py-10 p-6">
					<div class="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
					<p class="mt-2 text-gray-600">Loading data…</p>
				</div>
			{:else if items.length === 0}
				<div class="text-center py-10 p-6">
					<p class="text-gray-500 text-lg">
						{#if accessDeniedOp !== null}
							Nothing to show.
						{:else if unavailable}
							This list isn't available right now.
						{:else if selectedType === 'Organization' && kindFilter && nextCursor != null}
							{t('org_kind_searched', { count: searched })}
						{:else if selectedType === 'Organization' && kindFilter}
							{t('org_kind_none')}
						{:else}
							No items found.
						{/if}
					</p>
					{#if selectedType === 'Organization' && kindFilter && nextCursor != null}
						<button
							onclick={() => goToPage(currentPage + 1)}
							class="mt-4 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
							data-testid="org-kind-search-further"
						>{t('org_kind_search_further')}</button>
					{/if}
				</div>
			{:else}
				<div class="divide-y divide-gray-200">
					{#each items as item, index}
						<div class="p-4 hover:bg-gray-50 transition">
							<div class="flex items-center justify-between">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-3">
										<button
											onclick={() => toggleExpand(index)}
											class="text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
										>
											{expandedItem === index ? '▼' : '▶'}
											{selectedType} #{item.id || currentPage * pageSize + index + 1}
										</button>
										{#if titleOf(item)}
											<span class="text-gray-700 truncate">- {titleOf(item)}</span>
										{/if}
										{#if selectedType === 'Organization'}
											<span
												class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap {kindOf(item) ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}"
												title={kindOf(item) ? undefined : t('org_kind_unknown_title')}
												data-testid="org-kind"
											>{kindText(kindOf(item), t)}</span>
										{/if}
									</div>
								</div>

								<div class="flex items-center gap-1 ml-2 shrink-0">
									<button
										onclick={() => copyJSON(item)}
										class="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded transition-colors"
										title="Copy JSON"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
										</svg>
									</button>
								</div>
							</div>

							{#if expandedItem === index}
								<div class="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
									<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
										{#each Object.entries(item) as [key, value]}
											<div class="min-w-0">
												<span class="font-semibold text-gray-700">{key}:</span>
												<span class="text-gray-600 ml-2 break-all">
													{shown(value)}
												</span>
											</div>
										{/each}
									</div>
									<div class="mt-3 pt-3 border-t border-gray-200">
										<details>
											<summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Raw JSON</summary>
											<pre class="mt-2 p-3 bg-white rounded border border-gray-200 text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap break-all">{JSON.stringify(item, null, 2)}</pre>
										</details>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Pagination Controls -->
				{#if currentPage > 0 || nextCursor != null}
					<div class="border-t border-gray-200 p-4 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<button
								onclick={() => goToPage(0)}
								disabled={currentPage === 0 || objLoading}
								class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
							>First</button>
							<button
								onclick={() => goToPage(currentPage - 1)}
								disabled={currentPage === 0 || objLoading}
								class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
							>Prev</button>
						</div>
						<span class="text-sm text-gray-600">Page {currentPage + 1}</span>
						<div class="flex items-center gap-2">
							<button
								onclick={() => goToPage(currentPage + 1)}
								disabled={nextCursor == null || objLoading}
								class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
							>Next</button>
						</div>
					</div>
				{/if}
			{/if}
		</div>
</div>
