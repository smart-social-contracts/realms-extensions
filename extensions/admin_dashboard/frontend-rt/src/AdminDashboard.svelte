<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';

	let { ctx }: { ctx: any } = $props();

	const cn = ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' '));

	interface EntityType {
		value: string;
		label: string;
		className: string;
	}

	interface Toast {
		id: number;
		type: 'success' | 'error';
		text: string;
	}

	const entityIcons: Record<string, string> = {
		Balance: '💵', Call: '📞', Codex: '📚', Contract: '📝', Dispute: '⚖️',
		Human: '🧑', Identity: '🆔', Instrument: '💰', Invoice: '🧾', Land: '🏞️',
		License: '📃', Mandate: '📜', Member: '👥', Notification: '🔔',
		Organization: '🏢', PaymentAccount: '💳', Permission: '🔐', Proposal: '🗳️',
		Realm: '🏛️', Registry: '📋', Service: '⚙️', Task: '📋',
		TaskExecution: '▶️', TaskSchedule: '⏰', TaskStep: '📌', Token: '🪙',
		Trade: '🤝', Transfer: '🔄', Treasury: '🏦', User: '👤',
		UserProfile: '📋', Vote: '✅', Zone: '🗺️',
	};

	let entityTypes: EntityType[] = $state([]);
	let selectedType = $state('');
	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');
	let toasts: Toast[] = $state([]);
	let toastCounter = $state(0);

	// Browse
	let items: any[] = $state([]);
	let objLoading = $state(false);
	let expandedItem: number | null = $state(null);
	let currentPage = $state(0);
	let pageSize = 10;
	let totalItems = $state(0);
	let totalPages = $state(0);

	// Delete
	let deletingId: string | null = $state(null);
	let confirmDeleteItem: any | null = $state(null);

	function addToast(message: string, type: 'success' | 'error' = 'success') {
		const id = ++toastCounter;
		toasts = [...toasts, { id, text: message, type }];
		setTimeout(() => {
			toasts = toasts.filter(t => t.id !== id);
		}, 4000);
	}

	function getIcon(className: string): string {
		return entityIcons[className] || '📊';
	}

	function formatLabel(className: string): string {
		return className.replace(/([A-Z])/g, ' $1').trim();
	}

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	function parseEntities(response: any): { objects: any[]; pagination: any } {
		if (response?.success && response?.data?.objectsListPaginated) {
			const paginated = response.data.objectsListPaginated;
			const objects = (paginated.objects || []).map((s: any) => {
				try { return typeof s === 'string' ? JSON.parse(s) : s; } catch { return s; }
			});
			return { objects, pagination: paginated.pagination };
		}
		if (response?.data && Array.isArray(response.data)) {
			return { objects: response.data, pagination: null };
		}
		return { objects: [], pagination: null };
	}

	async function loadEntityTypes() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const res = await callExt('get_entity_types');
			const classes = res?.data ?? (Array.isArray(res) ? res : []);
			entityTypes = classes.map((className: string) => ({
				value: className,
				label: `${getIcon(className)} ${formatLabel(className)}`,
				className,
			}));
			if (entityTypes.length > 0 && !selectedType) {
				selectedType = entityTypes[0].value;
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
			entityTypes = [{ value: 'User', label: '👤 User', className: 'User' }];
			if (!selectedType) selectedType = 'User';
		} finally {
			loading = false;
		}
	}

	// ── Browse ──

	async function loadData() {
		objLoading = true;
		expandedItem = null;
		try {
			const raw = await ctx.backend.get_objects_paginated(selectedType, currentPage, pageSize, 'desc');
			const resp = typeof raw === 'string' ? JSON.parse(raw) : raw;
			const { objects, pagination } = parseEntities(resp);
			items = objects;
			if (pagination) {
				totalItems = Number(pagination.total_items || 0);
				totalPages = Number(pagination.total_pages || 0);
			} else {
				totalItems = objects.length;
				totalPages = 1;
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
			items = [];
		} finally {
			objLoading = false;
		}
	}

	function toggleExpand(index: number) {
		expandedItem = expandedItem === index ? null : index;
	}

	function copyJSON(item: any) {
		navigator.clipboard.writeText(JSON.stringify(item, null, 2));
		addToast('JSON copied to clipboard');
	}

	function goToPage(page: number) {
		currentPage = page;
		loadData();
	}

	// ── Delete ──

	function requestDelete(item: any) {
		confirmDeleteItem = item;
	}

	function cancelDelete() {
		confirmDeleteItem = null;
	}

	async function executeDelete() {
		if (!confirmDeleteItem) return;
		const item = confirmDeleteItem;
		const entityType = item._type || selectedType;
		const entityId = item._id || item.id;
		confirmDeleteItem = null;
		deletingId = String(entityId);

		try {
			const result = await callExt('delete_entity', {
				entity_type: entityType,
				entity_id: String(entityId),
			});
			if (result?.success) {
				items = items.filter(i => !((i._id || i.id) === entityId && (i._type || selectedType) === entityType));
				totalItems = Math.max(0, totalItems - 1);
				addToast(`Deleted ${entityType}#${entityId}`);
			} else {
				addToast(result?.error || 'Delete failed', 'error');
			}
		} catch (e: any) {
			addToast(`Delete error: ${e?.message}`, 'error');
		} finally {
			deletingId = null;
		}
	}

	$effect(() => {
		loadEntityTypes();
	});
</script>

<!-- Toast notifications -->
{#if toasts.length > 0}
	<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
		{#each toasts as toast (toast.id)}
			<div class={cn(
				'px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all',
				toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
			)}>
				{toast.text}
			</div>
		{/each}
	</div>
{/if}

<!-- Delete confirmation modal -->
{#if confirmDeleteItem}
	<div class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
		<div class="bg-white rounded-xl shadow-xl p-6 max-w-md mx-4">
			<h3 class="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
			<p class="text-gray-600 mb-4">
				Are you sure you want to delete <strong>{confirmDeleteItem._type || selectedType}#{confirmDeleteItem._id || confirmDeleteItem.id}</strong>?
				{#if confirmDeleteItem.name}
					<br><span class="text-gray-500">({confirmDeleteItem.name})</span>
				{/if}
			</p>
			<p class="text-red-600 text-sm mb-4">This action cannot be undone.</p>
			<div class="flex justify-end gap-3">
				<button
					onclick={cancelDelete}
					class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
				>Cancel</button>
				<button
					onclick={executeDelete}
					class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
				>Delete</button>
			</div>
		</div>
	</div>
{/if}

<div class="w-full px-4 max-w-none">
	<!-- Header -->
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Data Explorer</h1>
			<p class="text-gray-600 mt-1">{extensionDescription}</p>
		</div>
		<button
			onclick={() => loadEntityTypes()}
			disabled={loading}
			class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
			title="Refresh"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
		</button>
	</div>

	{#if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error}
		<div class="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
			{error}
			<button onclick={() => error = ''} class="ml-2 text-red-600 hover:text-red-800 font-bold">&times;</button>
		</div>
	{/if}

	<!-- Entity type selector -->
	<div class="mb-4 bg-white shadow-sm rounded-lg p-4">
		<div class="flex items-center gap-4 flex-wrap">
			<label for="entity-type-select" class="font-medium text-gray-700">Entity Type:</label>
			{#if loading}
				<div class="flex items-center gap-2 text-gray-400 text-sm">
					<div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
					Loading types…
				</div>
			{:else}
				<select
					id="entity-type-select"
					bind:value={selectedType}
					class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
				>
					{#each entityTypes as type}
						<option value={type.value}>{type.label}</option>
					{/each}
				</select>
			{/if}
		</div>
	</div>

	<div class="mb-4 flex items-center gap-4">
			<button
				onclick={loadData}
				disabled={objLoading}
				class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
			>{objLoading ? 'Loading…' : 'Load Data'}</button>
			<div class="ml-auto text-gray-600 text-sm">
				{#if items.length > 0}
					Showing {items.length} of {totalItems} items
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
					<p class="text-gray-500 text-lg">No items loaded. Select an entity type and click "Load Data".</p>
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
											{item._type || selectedType} #{item._id || item.id || index + 1}
										</button>
										{#if item.name}
											<span class="text-gray-700 truncate">- {item.name}</span>
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
									<button
										onclick={() => requestDelete(item)}
										disabled={deletingId === String(item._id || item.id)}
										class="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors disabled:opacity-50"
										title="Delete entity"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
													{typeof value === 'object' ? JSON.stringify(value) : String(value)}
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
				{#if totalPages > 1}
					<div class="border-t border-gray-200 p-4 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<button
								onclick={() => goToPage(0)}
								disabled={currentPage === 0}
								class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
							>First</button>
							<button
								onclick={() => goToPage(currentPage - 1)}
								disabled={currentPage === 0}
								class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
							>Prev</button>
						</div>
						<span class="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</span>
						<div class="flex items-center gap-2">
							<button
								onclick={() => goToPage(currentPage + 1)}
								disabled={currentPage >= totalPages - 1}
								class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
							>Next</button>
							<button
								onclick={() => goToPage(totalPages - 1)}
								disabled={currentPage >= totalPages - 1}
								class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
							>Last</button>
						</div>
					</div>
				{/if}
			{/if}
		</div>
</div>
