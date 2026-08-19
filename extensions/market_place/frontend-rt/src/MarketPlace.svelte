<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount } from 'svelte';

	let { ctx }: { ctx: any } = $props();

	type Tab = 'browse' | 'purchased' | 'publish' | 'earnings';
	let tab = $state<Tab>('browse');

	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');
	let success = $state('');

	let extensions: any[] = $state([]);
	let stats: any = $state(null);
	let purchases: any[] = $state([]);
	let searchQuery = $state('');

	let isDeveloper = $state(false);
	let checkingLicense = $state(true);
	let purchasingLicense = $state(false);

	let devExtensions: any[] = $state([]);
	let devStats: any = $state(null);

	let showPublishForm = $state(false);
	let submitting = $state(false);
	let withdrawing = $state(false);

	let showPurchaseModal = $state(false);
	let selectedExtension: any = $state(null);
	let purchasing = $state(false);

	let formData = $state({
		extension_id: '',
		name: '',
		description: '',
		version: '1.0.0',
		price_icp: 0,
		download_url: '',
		icon: 'layers',
		categories: '' as string,
	});

	const categoryOptions = [
		{ value: 'public_services', label: 'Public Services' },
		{ value: 'finances', label: 'Finances' },
		{ value: 'governance', label: 'Governance' },
		{ value: 'other', label: 'Other' },
	];

	const iconOptions = [
		{ value: 'layers', label: 'Layers' },
		{ value: 'wallet', label: 'Wallet' },
		{ value: 'chart', label: 'Chart' },
		{ value: 'shield', label: 'Shield' },
		{ value: 'user', label: 'User' },
		{ value: 'bell', label: 'Bell' },
		{ value: 'cog', label: 'Settings' },
	];

	let purchasedIds = $derived(new Set(purchases.map((p: any) => p.extension_id || p.id)));

	function formatICP(e8s: number | bigint): string {
		const v = typeof e8s === 'bigint' ? Number(e8s) : e8s;
		if (v === 0) return 'Free';
		return `${(v / 100_000_000).toFixed(2)} ICP`;
	}

	function formatICPLong(e8s: number | bigint): string {
		const v = typeof e8s === 'bigint' ? Number(e8s) : e8s;
		return `${(v / 100_000_000).toFixed(4)} ICP`;
	}

	function formatDownloads(count: number | bigint): string {
		const v = typeof count === 'bigint' ? Number(count) : count;
		if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
		return v.toString();
	}

	function formatDate(timestamp: number): string {
		if (!timestamp) return '-';
		const date = new Date(timestamp / 1_000_000);
		return date.toLocaleDateString();
	}

	function parseCategories(cats: string): string[] {
		try { return JSON.parse(cats || '[]'); } catch { return []; }
	}

	function categoryLabel(cat: string): string {
		return categoryOptions.find((c) => c.value === cat)?.label || cat;
	}

	function clearError() { error = ''; success = ''; }

	async function loadBrowse() {
		loading = true;
		clearError();
		try {
			const [listRes, statsRes] = await Promise.all([
				ctx.backend.list_extensions(),
				ctx.backend.marketplace_stats().catch(() => null),
			]);

			const raw = typeof listRes === 'string' ? JSON.parse(listRes) : listRes;
			const list = raw?.listings ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
			extensions = list.map((e: any) => ({
				...e,
				price_e8s: Number(e.price_e8s ?? 0),
				downloads: Number(e.downloads ?? 0),
			}));

			if (statsRes) {
				const s = typeof statsRes === 'string' ? JSON.parse(statsRes) : statsRes;
				stats = {
					total_extensions: Number(s.total_extensions ?? 0),
					total_developers: Number(s.total_developers ?? 0),
					total_purchases: Number(s.total_purchases ?? 0),
				};
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

	async function handleSearch() {
		if (!searchQuery.trim()) { await loadBrowse(); return; }
		loading = true;
		clearError();
		try {
			const res = await ctx.backend.search_marketplace(searchQuery.trim());
			const raw = typeof res === 'string' ? JSON.parse(res) : res;
			const list = raw?.listings ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
			extensions = list.map((e: any) => ({
				...e,
				price_e8s: Number(e.price_e8s ?? 0),
				downloads: Number(e.downloads ?? 0),
			}));
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

	async function loadPurchases() {
		loading = true;
		clearError();
		try {
			const res = await ctx.backend.get_my_purchases();
			const raw = typeof res === 'string' ? JSON.parse(res) : res;
			purchases = (raw?.data ?? (Array.isArray(raw) ? raw : [])).map((p: any) => ({
				...p,
				price_paid_e8s: Number(p.price_paid_e8s ?? 0),
				purchased_at: Number(p.purchased_at ?? 0),
			}));
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

	async function openPurchaseModal(ext: any) {
		selectedExtension = ext;
		showPurchaseModal = true;
		purchasing = false;
		clearError();
	}

	async function confirmPurchase() {
		if (!selectedExtension) return;
		purchasing = true;
		clearError();
		try {
			const res = await ctx.backend.buy_extension(selectedExtension.extension_id || selectedExtension.id || selectedExtension.name);
			const raw = typeof res === 'string' ? JSON.parse(res) : res;
			if (raw?.Err) { error = raw.Err; }
			else {
				showPurchaseModal = false;
				selectedExtension = null;
				await loadBrowse();
				await loadPurchases();
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
			purchasing = false;
		}
	}

	async function checkLicense() {
		checkingLicense = true;
		try {
			const res = await ctx.backend.check_developer_license();
			const raw = typeof res === 'string' ? JSON.parse(res) : res;
			if (raw?.Ok) {
				isDeveloper = raw.Ok.is_active !== false;
			} else if (typeof raw === 'boolean') {
				isDeveloper = raw;
			} else {
				isDeveloper = false;
			}
		} catch {
			isDeveloper = false;
		} finally {
			checkingLicense = false;
		}
	}

	async function handleBecomeDeveloper() {
		purchasingLicense = true;
		clearError();
		try {
			const res = await ctx.backend.purchase_developer_license();
			const raw = typeof res === 'string' ? JSON.parse(res) : res;
			if (raw?.Err) { error = raw.Err; }
			else {
				isDeveloper = true;
				await checkLicense();
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
			purchasingLicense = false;
		}
	}

	async function loadDevStats() {
		loading = true;
		clearError();
		try {
			const res = await ctx.backend.get_my_developer_stats();
			const raw = typeof res === 'string' ? JSON.parse(res) : res;
			if (raw?.Ok) {
				devStats = {
					total_extensions: Number(raw.Ok.total_extensions ?? 0),
					total_downloads: Number(raw.Ok.total_downloads ?? 0),
					total_sales: Number(raw.Ok.total_sales ?? 0),
					total_revenue_e8s: Number(raw.Ok.total_revenue_e8s ?? 0),
					pending_payout_e8s: Number(raw.Ok.pending_payout_e8s ?? 0),
				};
			} else if (raw && !raw.Err) {
				devStats = {
					total_extensions: Number(raw.total_extensions ?? 0),
					total_downloads: Number(raw.total_downloads ?? 0),
					total_sales: Number(raw.total_sales ?? 0),
					total_revenue_e8s: Number(raw.total_revenue_e8s ?? 0),
					pending_payout_e8s: Number(raw.pending_payout_e8s ?? 0),
				};
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

	function resetForm() {
		formData = {
			extension_id: '', name: '', description: '', version: '1.0.0',
			price_icp: 0, download_url: '', icon: 'layers', categories: '',
		};
	}

	async function handlePublish() {
		submitting = true;
		clearError();
		try {
			const price_e8s = Math.floor(formData.price_icp * 100_000_000);
			const payload = JSON.stringify({
				extension_id: formData.extension_id,
				name: formData.name,
				description: formData.description,
				version: formData.version,
				price_e8s,
				download_url: formData.download_url,
				icon: formData.icon,
				categories: formData.categories ? formData.categories.split(',').map((c) => c.trim()) : [],
			});
			const res = await ctx.backend.publish_extension(payload);
			const raw = typeof res === 'string' ? JSON.parse(res) : res;
			if (raw?.Err) { error = raw.Err; }
			else {
				showPublishForm = false;
				resetForm();
				success = 'Extension published successfully!';
				await loadBrowse();
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
			submitting = false;
		}
	}

	async function handleUnpublish(extId: string) {
		clearError();
		try {
			const res = await ctx.backend.unpublish_extension(extId);
			const raw = typeof res === 'string' ? JSON.parse(res) : res;
			if (raw?.Err) { error = raw.Err; }
			else {
				success = 'Extension unpublished.';
				await loadBrowse();
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
		}
	}

	async function handleWithdraw() {
		withdrawing = true;
		clearError();
		try {
			const res = await ctx.backend.request_payout();
			const raw = typeof res === 'string' ? JSON.parse(res) : res;
			if (raw?.Err) { error = raw.Err; }
			else {
				success = 'Payout requested successfully!';
				await loadDevStats();
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
			withdrawing = false;
		}
	}

	function switchTab(t: Tab) {
		tab = t;
		clearError();
	}

	onMount(async () => {
		await Promise.all([loadBrowse(), loadPurchases(), checkLicense()]);
	});

	$effect(() => {
		if (tab === 'earnings' && isDeveloper && !devStats) {
			loadDevStats();
		}
	});

	const tabs: { id: Tab; label: string; icon: string; devOnly?: boolean }[] = [
		{ id: 'browse', label: 'Browse', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
		{ id: 'purchased', label: 'Purchased', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
		{ id: 'publish', label: 'Publish', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
		{ id: 'earnings', label: 'Earnings', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', devOnly: true },
	];

	let visibleTabs = $derived(
		isDeveloper ? tabs : tabs.filter((t) => !t.devOnly),
	);
</script>

<div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Marketplace</h1>
		<p class="text-gray-500 dark:text-gray-400 mt-1">{extensionDescription}</p>
	</div>

	<!-- Alerts -->
	{#if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error}
		<div class="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
			<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			<span class="flex-1">{error}</span>
			<button onclick={() => error = ''} class="text-red-500 hover:text-red-700">&times;</button>
		</div>
	{/if}
	{#if success}
		<div class="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
			<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			<span class="flex-1">{success}</span>
			<button onclick={() => success = ''} class="text-green-500 hover:text-green-700">&times;</button>
		</div>
	{/if}

	<!-- Tabs -->
	<div class="border-b border-gray-200 dark:border-gray-700">
		<nav class="flex gap-1 -mb-px">
			{#each visibleTabs as t}
				{@const active = tab === t.id}
				<button
					onclick={() => switchTab(t.id)}
					class="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors {active
						? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
						: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={t.icon}/>
					</svg>
					{#if t.id === 'publish' && !isDeveloper && !checkingLicense}
						Become Developer
					{:else}
						{t.label}
					{/if}
				</button>
			{/each}
		</nav>
	</div>

	<!-- Tab Content -->
	<div class="min-h-[400px]">

		<!-- ======================== BROWSE TAB ======================== -->
		{#if tab === 'browse'}
			<div class="space-y-6">
				<!-- Search -->
				<div class="flex gap-3">
					<div class="flex-1 relative">
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
						<input
							type="text"
							bind:value={searchQuery}
							onkeydown={(e) => e.key === 'Enter' && handleSearch()}
							placeholder="Search extensions..."
							class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
						/>
					</div>
					<button onclick={handleSearch} class="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors">
						Search
					</button>
				</div>

				<!-- Stats -->
				{#if stats}
					<div class="grid grid-cols-3 gap-4">
						{#each [
							{ label: 'Extensions', value: stats.total_extensions },
							{ label: 'Developers', value: stats.total_developers },
							{ label: 'Purchases', value: stats.total_purchases },
						] as card}
							<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
								<p class="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
								<p class="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Grid -->
				{#if loading}
					<div class="flex items-center justify-center py-16">
						<svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span class="ml-3 text-gray-500">Loading marketplace...</span>
					</div>
				{:else if extensions.length === 0}
					<div class="text-center py-16">
						<svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
						<p class="text-gray-500 dark:text-gray-400">No extensions available</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
						{#each extensions as ext (ext.extension_id || ext.id || ext.name)}
							{@const extId = ext.extension_id || ext.id || ext.name}
							{@const owned = purchasedIds.has(extId)}
							{@const isFree = Number(ext.price_e8s) === 0}
							<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col">
								<div class="flex justify-between items-start mb-3">
									<div class="flex items-center gap-3">
										<div class="w-11 h-11 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xl">
											{ext.icon === 'wallet' ? '💰' : ext.icon === 'chart' ? '📊' : ext.icon === 'shield' ? '🛡' : ext.icon === 'user' ? '👤' : ext.icon === 'bell' ? '🔔' : ext.icon === 'cog' ? '⚙' : '📦'}
										</div>
										<div>
											<h3 class="font-semibold text-gray-900 dark:text-white capitalize">{(ext.name || extId).replace(/_/g, ' ')}</h3>
											<p class="text-xs text-gray-500 dark:text-gray-400">v{ext.version || '1.0'}</p>
										</div>
									</div>
									<span class="px-2.5 py-0.5 rounded-full text-xs font-medium {isFree ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}">
										{formatICP(ext.price_e8s)}
									</span>
								</div>

								{#if ext.description}
									<p class="text-sm text-gray-600 dark:text-gray-400 mb-3 flex-grow line-clamp-2">{ext.description}</p>
								{:else}
									<div class="flex-grow"></div>
								{/if}

								{#if parseCategories(ext.categories).length > 0}
									<div class="flex flex-wrap gap-1 mb-3">
										{#each parseCategories(ext.categories) as cat}
											<span class="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{categoryLabel(cat)}</span>
										{/each}
									</div>
								{/if}

								<div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
									<span>{formatDownloads(ext.downloads)} downloads</span>
									{#if ext.developer}
										<span class="truncate max-w-[100px]" title={ext.developer}>{ext.developer.slice(0, 8)}...</span>
									{/if}
								</div>

								{#if owned}
									<button disabled class="w-full py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium cursor-default">
										Purchased
									</button>
								{:else}
									<button
										onclick={() => openPurchaseModal(ext)}
										class="w-full py-2 rounded-lg text-sm font-medium transition-colors {isFree
											? 'bg-gray-800 hover:bg-gray-900 text-white'
											: 'bg-indigo-600 hover:bg-indigo-700 text-white'}"
									>
										{isFree ? 'Install' : 'Purchase'}
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

		<!-- ======================== PURCHASED TAB ======================== -->
		{:else if tab === 'purchased'}
			<div class="space-y-6">
				<div>
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white">My Purchases</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Extensions you've acquired</p>
				</div>

				{#if loading}
					<div class="flex items-center justify-center py-16">
						<svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					</div>
				{:else if purchases.length === 0}
					<div class="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
						<svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
						<p class="text-gray-500 dark:text-gray-400 mb-4">No purchases yet</p>
						<button onclick={() => switchTab('browse')} class="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors">
							Browse Marketplace
						</button>
					</div>
				{:else}
					<div class="space-y-3">
						{#each purchases as p (p.purchase_id || p.extension_id || p.id)}
							<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between">
								<div class="flex items-center gap-4">
									<div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
										<svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
									</div>
									<div>
										<h3 class="font-semibold text-gray-900 dark:text-white capitalize">{(p.name || p.extension_id || p.id).replace(/_/g, ' ')}</h3>
										<p class="text-sm text-gray-500 dark:text-gray-400">Purchased {formatDate(p.purchased_at)}</p>
									</div>
								</div>
								<div class="flex items-center gap-3">
									<span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
										{formatICP(p.price_paid_e8s)}
									</span>
									{#if p.version}
										<span class="text-xs text-gray-500">v{p.version}</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

		<!-- ======================== PUBLISH TAB ======================== -->
		{:else if tab === 'publish'}
			{#if checkingLicense}
				<div class="flex items-center justify-center py-16">
					<svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<span class="ml-3 text-gray-500">Checking developer license...</span>
				</div>

			{:else if !isDeveloper}
				<!-- Become Developer -->
				<div class="text-center py-16">
					<div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
						<svg class="w-10 h-10 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
					</div>
					<h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Become a Developer</h3>
					<p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
						Get a developer license to publish and sell extensions on the marketplace.
					</p>
					<p class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
						100 ICP <span class="text-sm font-normal text-gray-500">/ year</span>
					</p>
					<button
						onclick={handleBecomeDeveloper}
						disabled={purchasingLicense}
						class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
					>
						{#if purchasingLicense}
							<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						{/if}
						Get Developer License
					</button>
				</div>

			{:else}
				<!-- Developer Publish Panel -->
				<div class="space-y-6">
					<div class="flex justify-between items-center">
						<div>
							<h2 class="text-xl font-semibold text-gray-900 dark:text-white">My Extensions</h2>
							<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your published extensions</p>
						</div>
						<button
							onclick={() => { showPublishForm = true; resetForm(); clearError(); }}
							class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
							New Extension
						</button>
					</div>

					<!-- Publish Form -->
					{#if showPublishForm}
						<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-5">Publish Extension</h3>
							<form onsubmit={(e) => { e.preventDefault(); handlePublish(); }} class="space-y-4">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label for="pub-ext-id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extension ID</label>
										<input id="pub-ext-id" type="text" bind:value={formData.extension_id} placeholder="my_extension" required
											class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"/>
									</div>
									<div>
										<label for="pub-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
										<input id="pub-name" type="text" bind:value={formData.name} placeholder="My Extension" required
											class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"/>
									</div>
								</div>

								<div>
									<label for="pub-desc" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
									<textarea id="pub-desc" bind:value={formData.description} placeholder="Describe your extension..." rows={3} required
										class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"></textarea>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div>
										<label for="pub-version" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version</label>
										<input id="pub-version" type="text" bind:value={formData.version} placeholder="1.0.0"
											class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"/>
									</div>
									<div>
										<label for="pub-price" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (ICP)</label>
										<input id="pub-price" type="number" step="0.01" min="0" bind:value={formData.price_icp}
											class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"/>
									</div>
									<div>
										<label for="pub-icon" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
										<select id="pub-icon" bind:value={formData.icon}
											class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
											{#each iconOptions as opt}
												<option value={opt.value}>{opt.label}</option>
											{/each}
										</select>
									</div>
								</div>

								<div>
									<label for="pub-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Download URL</label>
									<input id="pub-url" type="text" bind:value={formData.download_url} placeholder="https://..." required
										class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"/>
								</div>

								<div>
									<label for="pub-cat" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
									<select id="pub-cat" bind:value={formData.categories}
										class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
										<option value="">Select a category</option>
										{#each categoryOptions as opt}
											<option value={opt.value}>{opt.label}</option>
										{/each}
									</select>
								</div>

								<div class="flex justify-end gap-3 pt-2">
									<button type="button" onclick={() => showPublishForm = false}
										class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
										Cancel
									</button>
									<button type="submit" disabled={submitting}
										class="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
										{#if submitting}
											<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
										{/if}
										Publish
									</button>
								</div>
							</form>
						</div>
					{/if}

					<!-- Developer Extensions List -->
					{#if extensions.length === 0 && !showPublishForm}
						<div class="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
							<p class="text-gray-500 dark:text-gray-400">No published extensions yet</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each extensions as ext (ext.extension_id || ext.id || ext.name)}
								{@const extId = ext.extension_id || ext.id || ext.name}
								{@const isFree = Number(ext.price_e8s) === 0}
								<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between">
									<div class="flex items-center gap-4">
										<div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xl">📦</div>
										<div>
											<h3 class="font-semibold text-gray-900 dark:text-white">{ext.name || extId}</h3>
											<p class="text-sm text-gray-500 dark:text-gray-400">v{ext.version || '1.0'}</p>
										</div>
									</div>
									<div class="flex items-center gap-3">
										<span class="px-2.5 py-0.5 rounded-full text-xs font-medium {isFree ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}">
											{formatICP(ext.price_e8s)}
										</span>
										<span class="text-sm text-gray-500">{ext.downloads ?? 0} downloads</span>
										<button onclick={() => handleUnpublish(extId)}
											class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Unpublish">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

		<!-- ======================== EARNINGS TAB ======================== -->
		{:else if tab === 'earnings'}
			<div class="space-y-6">
				<div>
					<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Earnings</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Your developer revenue and payout info</p>
				</div>

				{#if loading}
					<div class="flex items-center justify-center py-16">
						<svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					</div>
				{:else if devStats}
					<!-- Stats Grid -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{#each [
							{ label: 'Extensions', value: devStats.total_extensions, bg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400', emoji: '📦' },
							{ label: 'Downloads', value: devStats.total_downloads, bg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400', emoji: '📈' },
							{ label: 'Sales', value: devStats.total_sales, bg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400', emoji: '🛒' },
							{ label: 'Total Revenue', value: formatICPLong(devStats.total_revenue_e8s), bg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', emoji: '💰' },
						] as card}
							<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center">
								<div class="w-12 h-12 {card.bg} rounded-full flex items-center justify-center mx-auto mb-3">
									<span class="text-2xl">{card.emoji}</span>
								</div>
								<p class="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
								<p class="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
							</div>
						{/each}
					</div>

					<!-- Payout Card -->
					<div class="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
						<div class="flex items-center justify-between flex-wrap gap-4">
							<div>
								<p class="text-gray-300 text-sm mb-1">Pending Balance</p>
								<p class="text-4xl font-bold">{formatICPLong(devStats.pending_payout_e8s)}</p>
								<p class="text-gray-400 text-xs mt-2">Revenue is subject to platform commission</p>
							</div>
							<button
								onclick={handleWithdraw}
								disabled={withdrawing || devStats.pending_payout_e8s === 0}
								class="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
							>
								{#if withdrawing}
									<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
								{:else}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
								{/if}
								Withdraw
							</button>
						</div>
					</div>
				{:else}
					<div class="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
						<p class="text-gray-500 dark:text-gray-400">No earnings data available</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- ======================== PURCHASE MODAL ======================== -->
{#if showPurchaseModal && selectedExtension}
	{@const isFree = Number(selectedExtension.price_e8s) === 0}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4" onclick={() => { showPurchaseModal = false; selectedExtension = null; }}
		onkeydown={(e) => e.key === 'Escape' && (() => { showPurchaseModal = false; selectedExtension = null; })()}>
		<div class="absolute inset-0 bg-black/50"></div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6" onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}>
			<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
				{isFree ? 'Confirm Install' : 'Confirm Purchase'}
			</h3>

			<div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
				<h4 class="font-semibold text-gray-900 dark:text-white capitalize">
					{(selectedExtension.name || selectedExtension.extension_id || '').replace(/_/g, ' ')}
				</h4>
				{#if selectedExtension.description}
					<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedExtension.description}</p>
				{/if}
			</div>

			<div class="flex justify-between items-center py-4 border-t border-b border-gray-200 dark:border-gray-700 mb-4">
				<span class="text-gray-600 dark:text-gray-400">Price</span>
				<span class="text-2xl font-bold text-gray-900 dark:text-white">{formatICP(selectedExtension.price_e8s)}</span>
			</div>

			{#if !isFree}
				<p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Payment will be deducted from your ICP balance.</p>
			{/if}

			<div class="flex justify-end gap-3">
				<button onclick={() => { showPurchaseModal = false; selectedExtension = null; }}
					disabled={purchasing}
					class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
					Cancel
				</button>
				<button onclick={confirmPurchase} disabled={purchasing}
					class="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
					{#if purchasing}
						<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					{/if}
					{isFree ? 'Install' : 'Purchase'}
				</button>
			</div>
		</div>
	</div>
{/if}
