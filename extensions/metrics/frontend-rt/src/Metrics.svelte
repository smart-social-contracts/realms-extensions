<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { exportCsv } from '../../../_shared/frontend/csv-export';

	let { ctx }: { ctx: Record<string, any> } = $props();

	const cn = ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' '));

	let tab = $state<'accounting' | 'records' | 'visualizations'>('accounting');

let budgets: any[] = $state([]);
let ledgerEntries: any[] = $state([]);
let funds: any[] = $state([]);
let fiscalPeriods: any[] = $state([]);
let tokens: any[] = $state([]);
let realms: any[] = $state([]);
let loading = $state(true);
let error = $state('');
let accessDeniedOp = $state('');

	const categoryColors: Record<string, string> = {
		cash: '#1E40AF', receivable: '#1D4ED8', equipment: '#2563EB', land: '#3B82F6',
		bond: '#60A5FA', payable: '#1D4ED8', deferred_revenue: '#2563EB', fund_balance: '#1E40AF',
		tax: '#1E40AF', fee: '#1D4ED8', grant: '#2563EB', personnel: '#3B82F6',
		supplies: '#60A5FA', services: '#1D4ED8', debt: '#2563EB', capital: '#1E40AF',
		operating: '#93C5FD', general: '#1E40AF', special_revenue: '#2563EB', capital_projects: '#60A5FA',
	};

	const BATCH_SIZE = 50;

	async function loadPaginated(entity: string, limit = 100, order = 'desc') {
		const allItems: any[] = [];
		let page = 0;
		let totalPages = 1;

		while (page < totalPages && allItems.length < limit) {
			const batchLimit = Math.min(BATCH_SIZE, limit - allItems.length);
			const raw = await ctx.backend.get_objects_paginated(entity, page, batchLimit, order);
			const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

			if (parsed?.success && parsed?.data?.objectsListPaginated) {
				const batch = parsed.data.objectsListPaginated.objects.map((s: string) => JSON.parse(s));
				allItems.push(...batch);
				const pag = parsed.data.objectsListPaginated.pagination;
				totalPages = Number(pag?.total_pages ?? 1);
				if (batch.length < batchLimit) break;
			} else {
				const fallback = parsed?.data ?? (Array.isArray(parsed) ? parsed : []);
				allItems.push(...fallback);
				break;
			}
			page++;
		}

		return allItems;
	}

	async function loadData() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const [b, l, f, fp, t, r] = await Promise.all([
				loadPaginated('Budget', 100, 'asc'),
				loadPaginated('LedgerEntry', 1000, 'desc'),
				loadPaginated('Fund', 100, 'asc'),
				loadPaginated('FiscalPeriod', 100, 'desc'),
				loadPaginated('Token', 100, 'asc'),
				loadPaginated('Realm', 10, 'asc'),
			]);
			budgets = b;
			ledgerEntries = l;
			funds = f;
			fiscalPeriods = fp;
			tokens = t;
			realms = r;
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

	$effect(() => { void loadData(); });

	// The realm is the source of truth; an empty value there means no treasury
	// ledger has resolved yet, so nothing is shown rather than a guessed symbol.
	// The enabled token is consulted only when the realm itself is unreadable.
	let accountingSymbol = $derived.by(() => {
		if (realms.length > 0) {
			return (realms[0]?.accounting_currency || '').toString().trim();
		}
		const enabled = tokens.find(
			(t) => t.enabled === true || t.enabled === 'true' || t._prop_enabled === 'true'
		);
		return enabled ? (enabled.symbol || enabled.name || '').toString().trim() : '';
	});

	let ledgerCurrencies = $derived.by(() => {
		const found: string[] = [];
		for (const e of ledgerEntries) {
			const c = (e.currency || '').toString().trim();
			if (c && !found.includes(c)) found.push(c);
		}
		return found.sort();
	});

	let ledgerCurrencyMixed = $derived.by(() => {
		const currencies = ledgerCurrencies;
		if (currencies.length > 1) return true;
		if (currencies.length === 1 && accountingSymbol && currencies[0] !== accountingSymbol) return true;
		return false;
	});

	let tokenDecimalsByCurrency = $derived.by(() => {
		const map: Record<string, number> = {};
		for (const t of tokens) {
			const symbol = (t.symbol || t.name || '').toString().trim();
			if (!symbol) continue;
			let decimals = 8;
			if (t.decimals != null) {
				const parsed = Number(t.decimals);
				if (!isNaN(parsed) && parsed >= 0) decimals = parsed;
			}
			map[symbol] = decimals;
			if (t.name && t.name !== symbol) map[t.name] = decimals;
		}
		return map;
	});

	function toHumanAmount(amount: number, currency: string): number {
		if (amount == null || isNaN(Number(amount))) return 0;
		const decimals = tokenDecimalsByCurrency[(currency || '').toString().trim()] ?? 8;
		return Number(amount) / (10 ** decimals);
	}

	function fmt(n: any): string {
		if (n == null) return '—';
		const num = Number(n);
		if (isNaN(num)) return String(n);
		return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function fmtCompact(amount: number): string {
		if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
		if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
		return amount.toLocaleString();
	}

	function formatCategory(cat: string): string {
		return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
	}

	// --- Financial statement computations ---
	let balanceSheet = $derived.by(() => {
		const assets: Record<string, number> = {};
		const liabilities: Record<string, number> = {};
		const equity: Record<string, number> = {};
		for (const e of ledgerEntries) {
			const cat = e.category || 'other';
			const d = toHumanAmount(e.debit || 0, e.currency);
			const c = toHumanAmount(e.credit || 0, e.currency);
			switch (e.entry_type) {
				case 'asset': assets[cat] = (assets[cat] || 0) + d - c; break;
				case 'liability': liabilities[cat] = (liabilities[cat] || 0) + c - d; break;
				case 'equity': equity[cat] = (equity[cat] || 0) + c - d; break;
			}
		}
		const totalAssets = Object.values(assets).reduce((a, b) => a + b, 0);
		const totalLiabilities = Object.values(liabilities).reduce((a, b) => a + b, 0);
		const totalEquity = Object.values(equity).reduce((a, b) => a + b, 0);
		return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, netPosition: totalAssets - totalLiabilities };
	});

	let incomeStatement = $derived.by(() => {
		const revenues: Record<string, number> = {};
		const expenses: Record<string, number> = {};
		for (const e of ledgerEntries) {
			const cat = e.category || 'other';
			if (e.entry_type === 'revenue') revenues[cat] = (revenues[cat] || 0) + toHumanAmount(e.credit || 0, e.currency) - toHumanAmount(e.debit || 0, e.currency);
			else if (e.entry_type === 'expense') expenses[cat] = (expenses[cat] || 0) + toHumanAmount(e.debit || 0, e.currency) - toHumanAmount(e.credit || 0, e.currency);
		}
		const totalRevenues = Object.values(revenues).reduce((a, b) => a + b, 0);
		const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
		return { revenues, expenses, totalRevenues, totalExpenses, netIncome: totalRevenues - totalExpenses };
	});

	let cashFlow = $derived.by(() => {
		let operating = 0, investing = 0, financing = 0;
		for (const e of ledgerEntries.filter(e => e.category === 'cash')) {
			const amt = toHumanAmount((e.debit || 0) - (e.credit || 0), e.currency);
			const tags = e.tags || '';
			if (tags.includes('investing') || tags.includes('capital')) investing += amt;
			else if (tags.includes('financing') || tags.includes('bond')) financing += amt;
			else operating += amt;
		}
		return { operating, investing, financing, netChange: operating + investing + financing };
	});

	// --- Visualization data ---
	let taxAllocationData = $derived(
		budgets
			.filter(b => b.budget_type === 'expense' && (b.actual_amount || 0) > 0)
			.map((b, i) => ({
				label: b.name || b.category || 'Other',
				amount: b.actual_amount || 0,
				color: categoryColors[b.category] || `hsl(217, 91%, ${30 + i * 10}%)`,
			}))
	);

	let assetPortfolioData = $derived.by(() => {
		const balances: Record<string, { name: string; balance: number; color: string }> = {};
		for (const f of funds) {
			balances[f.code] = { name: f.name || f.code, balance: 0, color: categoryColors[f.fund_type] || '#3B82F6' };
		}
		for (const e of ledgerEntries) {
			if (e.fund && e.category === 'cash') {
				const code = typeof e.fund === 'string' ? e.fund : e.fund.code;
				if (balances[code]) balances[code].balance += toHumanAmount((e.debit || 0) - (e.credit || 0), e.currency);
			}
		}
		return Object.entries(balances).filter(([, v]) => v.balance > 0).map(([k, v]) => ({ symbol: k, ...v }));
	});

	let taxContributionData = $derived.by(() => {
		const contribs: Record<string, { name: string; type: string; contribution: number; color: string }> = {};
		for (const e of ledgerEntries.filter(e => e.entry_type === 'revenue' && (e.credit || 0) > 0)) {
			const name = e.description || e.category || 'Other';
			if (!contribs[name]) {
				contribs[name] = {
					name,
					type: e.category === 'tax' ? 'citizen' : 'organization',
					contribution: 0,
					color: e.category === 'tax' ? '#3B82F6' : '#10B981',
				};
			}
			contribs[name].contribution += toHumanAmount(e.credit || 0, e.currency);
		}
		return Object.values(contribs);
	});

	let cashFlowBreakdown = $derived.by(() => {
		const revByCat: Record<string, number> = {};
		const expByCat: Record<string, number> = {};
		for (const e of ledgerEntries) {
			if (e.entry_type === 'revenue' && (e.credit || 0) > 0) {
				const cat = e.category || 'other';
				revByCat[cat] = (revByCat[cat] || 0) + toHumanAmount(e.credit || 0, e.currency);
			} else if (e.entry_type === 'expense' && (e.debit || 0) > 0) {
				const cat = e.category || 'other';
				expByCat[cat] = (expByCat[cat] || 0) + toHumanAmount(e.debit || 0, e.currency);
			}
		}
		const income = Object.entries(revByCat).map(([cat, amt]) => ({ category: formatCategory(cat), amount: amt }));
		const expenses = Object.entries(expByCat).map(([cat, amt]) => ({ category: formatCategory(cat), amount: amt }));
		const totalIncome = income.reduce((s, i) => s + i.amount, 0);
		const totalExpenses = expenses.reduce((s, i) => s + i.amount, 0);
		return { income, expenses, totalIncome, totalExpenses, net: totalIncome - totalExpenses };
	});

	function barWidth(value: number, max: number): string {
		if (max <= 0) return '0%';
		return `${Math.min(100, (value / max) * 100).toFixed(1)}%`;
	}

	// --- Records tab ---
	const ENTITY_TYPES = ['LedgerEntry', 'Budget', 'Fund', 'FiscalPeriod'] as const;
	const PAGE_SIZE = 50;

	let recEntity = $state<string>('LedgerEntry');
	let recPage = $state(0);
	let recItems: any[] = $state([]);
	let recTotalPages = $state(0);
	let recTotalItems = $state(0);
	let recLoading = $state(false);
	let recError = $state('');
	let recColumns: string[] = $state([]);

	let csvBusy = $state(false);
	let csvProgress = $state('');

	async function loadRecordsPage() {
		recLoading = true;
		recError = '';
		try {
			const raw = await ctx.backend.get_objects_paginated(recEntity, recPage, PAGE_SIZE, 'desc');
			const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (parsed?.success && parsed?.data?.objectsListPaginated) {
				const objs = parsed.data.objectsListPaginated.objects.map((s: string) => JSON.parse(s));
				const pag = parsed.data.objectsListPaginated.pagination;
				recItems = objs;
				recTotalItems = Number(pag?.total_items_count ?? 0);
				recTotalPages = Number(pag?.total_pages ?? 1);
				if (objs.length > 0) {
					recColumns = Object.keys(objs[0]).filter(k => !k.startsWith('_'));
				}
			} else {
				recItems = [];
				recTotalItems = 0;
				recTotalPages = 0;
				recColumns = [];
			}
		} catch (e: any) {
			recError = e?.message || String(e);
		} finally {
			recLoading = false;
		}
	}

	function recGoTo(page: number) {
		recPage = page;
		loadRecordsPage();
	}

	function recChangeEntity(entity: string) {
		recEntity = entity;
		recPage = 0;
		loadRecordsPage();
	}

	async function downloadCsv() {
		csvBusy = true;
		csvProgress = 'Starting...';
		try {
			const count = await exportCsv({
				backend: ctx.backend,
				entity: recEntity,
				pageSize: PAGE_SIZE,
				order: 'desc',
				onProgress: (msg) => { csvProgress = msg; },
			});
			if (count === 0) csvProgress = 'No data to export.';
		} catch (e: any) {
			csvProgress = 'Error: ' + (e?.message || String(e));
		} finally {
			csvBusy = false;
		}
	}

	let recTabInitialized = false;
	$effect(() => {
		if (tab === 'records' && !recTabInitialized) {
			recTabInitialized = true;
			loadRecordsPage();
		}
	});
</script>

<div class="w-full max-w-5xl mx-auto px-4 py-6 font-sans">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{extensionDescription}</p>
	</div>

	<!-- Tab Navigation -->
	<div class="mb-6 border-b border-gray-200 dark:border-gray-700">
		<nav class="flex space-x-8">
			<button
				onclick={() => tab = 'accounting'}
				class={cn(
					'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
					tab === 'accounting'
						? 'border-blue-500 text-blue-600 dark:text-blue-400'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
				)}
			>📊 Accounting</button>
			<button
				onclick={() => tab = 'visualizations'}
				class={cn(
					'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
					tab === 'visualizations'
						? 'border-blue-500 text-blue-600 dark:text-blue-400'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
				)}
			>📈 Visualizations</button>
			<button
				onclick={() => tab = 'records'}
				class={cn(
					'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
					tab === 'records'
						? 'border-blue-500 text-blue-600 dark:text-blue-400'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
				)}
			>📋 Records</button>
			<button
				onclick={loadData}
				disabled={loading}
				class="ml-auto py-3 px-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 disabled:opacity-50"
			>↻ Refresh</button>
		</nav>
	</div>

	{#if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 mb-6">{error}</div>
	{/if}

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="mt-3 text-gray-500 dark:text-gray-400">Loading metrics…</span>
		</div>

	{:else if tab === 'accounting'}
		<!-- ===== ACCOUNTING TAB ===== -->

		{#if ledgerEntries.length === 0 && funds.length === 0 && budgets.length === 0}
			<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
				<p class="text-gray-700 dark:text-gray-300 font-medium">No accounting data available yet.</p>
				<p class="text-gray-500 dark:text-gray-400 text-sm mt-2">Financial data will appear here once transactions are recorded.</p>
			</div>
		{:else}
			{#snippet statementCurrencyNote()}
				{#if ledgerCurrencyMixed}
					<span class="text-xs text-amber-700 dark:text-amber-400/90 font-normal">
						Entries span {ledgerCurrencies.join(', ')}
					</span>
				{:else if accountingSymbol}
					<span class="text-sm font-normal text-gray-500 dark:text-gray-400">({accountingSymbol})</span>
				{/if}
			{/snippet}

			<!-- Summary Cards -->
			<div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
				<span class="text-xs text-gray-500 dark:text-gray-400">Summary</span>
				{@render statementCurrencyNote()}
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				<div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
					<div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Assets</div>
					<div class="text-2xl font-bold text-gray-800 dark:text-white">{fmtCompact(balanceSheet.totalAssets)}</div>
				</div>
				<div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
					<div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Liabilities</div>
					<div class="text-2xl font-bold text-gray-600 dark:text-gray-300">{fmtCompact(balanceSheet.totalLiabilities)}</div>
				</div>
				<div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
					<div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Net Position</div>
					<div class="text-2xl font-bold text-gray-800 dark:text-white">{fmtCompact(balanceSheet.netPosition)}</div>
				</div>
				<div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
					<div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Net Income</div>
					<div class={cn('text-2xl font-bold', incomeStatement.netIncome >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
						{incomeStatement.netIncome >= 0 ? '+' : ''}{fmtCompact(incomeStatement.netIncome)}
					</div>
				</div>
			</div>

			<!-- Balance Sheet -->
			<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
				<div class="bg-gray-50 dark:bg-gray-750 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
						<h3 class="text-lg font-semibold text-gray-800 dark:text-white">📋 Balance Sheet</h3>
						{@render statementCurrencyNote()}
					</div>
				</div>
				<div class="p-6">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div>
							<h4 class="font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center">
								<span class="w-3 h-3 bg-blue-800 dark:bg-blue-500 rounded-full mr-2"></span> Assets
							</h4>
							<div class="space-y-2">
								{#each Object.entries(balanceSheet.assets) as [cat, amt]}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">{formatCategory(cat)}</span>
										<span class="font-medium text-gray-800 dark:text-gray-200">{fmtCompact(amt as number)}</span>
									</div>
								{/each}
								<div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-semibold">
									<span class="text-gray-700 dark:text-gray-300">Total Assets</span>
									<span class="text-blue-800 dark:text-blue-400">{fmtCompact(balanceSheet.totalAssets)}</span>
								</div>
							</div>
						</div>
						<div>
							<h4 class="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center">
								<span class="w-3 h-3 bg-red-500 rounded-full mr-2"></span> Liabilities
							</h4>
							<div class="space-y-2">
								{#each Object.entries(balanceSheet.liabilities) as [cat, amt]}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">{formatCategory(cat)}</span>
										<span class="font-medium text-gray-800 dark:text-gray-200">{fmtCompact(amt as number)}</span>
									</div>
								{/each}
								<div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-semibold">
									<span class="text-gray-700 dark:text-gray-300">Total Liabilities</span>
									<span class="text-red-600 dark:text-red-400">{fmtCompact(balanceSheet.totalLiabilities)}</span>
								</div>
							</div>
						</div>
						<div>
							<h4 class="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center">
								<span class="w-3 h-3 bg-blue-400 rounded-full mr-2"></span> Fund Balance
							</h4>
							<div class="space-y-2">
								{#each Object.entries(balanceSheet.equity) as [cat, amt]}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">{formatCategory(cat)}</span>
										<span class="font-medium text-gray-800 dark:text-gray-200">{fmtCompact(amt as number)}</span>
									</div>
								{/each}
								<div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-semibold">
									<span class="text-gray-700 dark:text-gray-300">Net Position</span>
									<span class="text-blue-800 dark:text-blue-400">{fmtCompact(balanceSheet.netPosition)}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Income Statement -->
			<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
				<div class="bg-gray-50 dark:bg-gray-750 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
						<h3 class="text-lg font-semibold text-gray-800 dark:text-white">📈 Income Statement</h3>
						{@render statementCurrencyNote()}
					</div>
				</div>
				<div class="p-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h4 class="font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center">
								<span class="w-3 h-3 bg-blue-800 dark:bg-blue-500 rounded-full mr-2"></span> Revenues
							</h4>
							<div class="space-y-2">
								{#each Object.entries(incomeStatement.revenues) as [cat, amt]}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">{formatCategory(cat)}</span>
										<span class="font-medium text-blue-700 dark:text-blue-400">+{fmtCompact(amt as number)}</span>
									</div>
								{/each}
								<div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-semibold">
									<span class="text-gray-700 dark:text-gray-300">Total Revenues</span>
									<span class="text-blue-800 dark:text-blue-400">{fmtCompact(incomeStatement.totalRevenues)}</span>
								</div>
							</div>
						</div>
						<div>
							<h4 class="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center">
								<span class="w-3 h-3 bg-red-500 rounded-full mr-2"></span> Expenses
							</h4>
							<div class="space-y-2">
								{#each Object.entries(incomeStatement.expenses) as [cat, amt]}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">{formatCategory(cat)}</span>
										<span class="font-medium text-red-500 dark:text-red-400">-{fmtCompact(amt as number)}</span>
									</div>
								{/each}
								<div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-semibold">
									<span class="text-gray-700 dark:text-gray-300">Total Expenses</span>
									<span class="text-red-600 dark:text-red-400">{fmtCompact(incomeStatement.totalExpenses)}</span>
								</div>
							</div>
						</div>
					</div>
					<div class="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
						<div class="flex justify-between items-center">
							<span class="font-semibold text-blue-700 dark:text-blue-300">
								Net Income ({incomeStatement.netIncome >= 0 ? 'Surplus' : 'Deficit'})
							</span>
							<span class={cn('text-xl font-bold', incomeStatement.netIncome >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-red-600 dark:text-red-400')}>
								{incomeStatement.netIncome >= 0 ? '+' : ''}{fmtCompact(incomeStatement.netIncome)}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Cash Flow Statement -->
			<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
				<div class="bg-gray-50 dark:bg-gray-750 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
						<h3 class="text-lg font-semibold text-gray-800 dark:text-white">💰 Cash Flow Statement</h3>
						{@render statementCurrencyNote()}
					</div>
				</div>
				<div class="p-6 space-y-4">
					{#each [
						{ label: 'Operating Activities', sub: 'Day-to-day operations', value: cashFlow.operating },
						{ label: 'Investing Activities', sub: 'Capital expenditures', value: cashFlow.investing },
						{ label: 'Financing Activities', sub: 'Bonds and debt', value: cashFlow.financing },
					] as item}
						<div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
							<div>
								<span class="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
								<p class="text-xs text-gray-500 dark:text-gray-400">{item.sub}</p>
							</div>
							<span class={cn('text-lg font-semibold', item.value >= 0 ? 'text-blue-800 dark:text-blue-400' : 'text-red-600 dark:text-red-400')}>
								{item.value >= 0 ? '+' : ''}{fmtCompact(item.value)}
							</span>
						</div>
					{/each}
					<div class="border-t dark:border-gray-600 pt-4 flex justify-between items-center">
						<span class="font-semibold text-gray-800 dark:text-gray-200">Net Change in Cash</span>
						<span class={cn('text-xl font-bold', cashFlow.netChange >= 0 ? 'text-blue-800 dark:text-blue-400' : 'text-red-600 dark:text-red-400')}>
							{cashFlow.netChange >= 0 ? '+' : ''}{fmtCompact(cashFlow.netChange)}
						</span>
					</div>
				</div>
			</div>

			<!-- Funds Overview -->
			{#if funds.length > 0}
				<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
					<div class="bg-gray-50 dark:bg-gray-750 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
						<h3 class="text-lg font-semibold text-gray-800 dark:text-white">🏦 Funds Overview</h3>
					</div>
					<div class="p-6">
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each funds as fund}
								<div class="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600">
									<div class="flex items-center justify-between mb-2">
										<span class="font-semibold text-gray-800 dark:text-gray-200">{fund.name || fund.code}</span>
										<span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">{fund.fund_type || 'general'}</span>
									</div>
									<p class="text-sm text-gray-600 dark:text-gray-400">{fund.description || 'No description'}</p>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Budget Performance -->
			{#if budgets.length > 0}
				<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
					<div class="bg-gray-50 dark:bg-gray-750 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
							<h3 class="text-lg font-semibold text-gray-800 dark:text-white">📊 Budget Performance</h3>
							{@render statementCurrencyNote()}
						</div>
					</div>
					<div class="p-6 overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-gray-200 dark:border-gray-600">
									<th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Category</th>
									<th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
										Planned{#if accountingSymbol && !ledgerCurrencyMixed}<span class="font-normal text-gray-500 dark:text-gray-400"> ({accountingSymbol})</span>{/if}
									</th>
									<th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
										Actual{#if accountingSymbol && !ledgerCurrencyMixed}<span class="font-normal text-gray-500 dark:text-gray-400"> ({accountingSymbol})</span>{/if}
									</th>
									<th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
										Variance{#if accountingSymbol && !ledgerCurrencyMixed}<span class="font-normal text-gray-500 dark:text-gray-400"> ({accountingSymbol})</span>{/if}
									</th>
									<th class="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
								</tr>
							</thead>
							<tbody>
								{#each budgets as budget}
									{@const variance = (budget.actual_amount || 0) - (budget.planned_amount || 0)}
									{@const variancePercent = budget.planned_amount ? ((variance / budget.planned_amount) * 100).toFixed(1) : '0'}
									<tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
										<td class="py-3 px-4">
											<div class="font-medium text-gray-800 dark:text-gray-200">{budget.name || budget.category}</div>
											<div class="text-xs text-gray-500 dark:text-gray-400">{budget.budget_type || 'expense'}</div>
										</td>
										<td class="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{fmtCompact(budget.planned_amount || 0)}</td>
										<td class="py-3 px-4 text-right text-gray-800 dark:text-gray-200 font-medium">{fmtCompact(budget.actual_amount || 0)}</td>
										<td class={cn('py-3 px-4 text-right', variance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-500 dark:text-red-400')}>
											{variance >= 0 ? '+' : ''}{fmtCompact(variance)} ({variancePercent}%)
										</td>
										<td class="py-3 px-4 text-center">
											<span class={cn(
												'px-2 py-1 text-xs rounded-full',
												budget.status === 'adopted' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
												budget.status === 'draft' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
												'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
											)}>
												{budget.status || 'draft'}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			<div class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
				{ledgerEntries.length} ledger entries · {funds.length} funds · {budgets.length} budgets
			</div>
		{/if}

	{:else if tab === 'records'}
		<!-- ===== RECORDS TAB ===== -->
		<div class="mb-4 flex flex-wrap items-center gap-4">
			<div class="flex items-center gap-2">
				<label for="entity-select" class="text-sm font-medium text-gray-700 dark:text-gray-300">Entity</label>
				<select
					id="entity-select"
					onchange={(e) => recChangeEntity((e.target as HTMLSelectElement).value)}
					class="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
				>
					{#each ENTITY_TYPES as et}
						<option value={et} selected={et === recEntity}>{et}</option>
					{/each}
				</select>
			</div>
			<button
				onclick={downloadCsv}
				disabled={csvBusy}
				class="px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>{csvBusy ? csvProgress : 'Download CSV'}</button>
			{#if csvProgress && !csvBusy}
				<span class="text-sm text-gray-500 dark:text-gray-400">{csvProgress}</span>
			{/if}
			<span class="ml-auto text-sm text-gray-500 dark:text-gray-400">{recTotalItems} total records</span>
		</div>

		{#if recError}
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 mb-4">{recError}</div>
		{/if}

		{#if recLoading}
			<div class="flex flex-col items-center justify-center py-12">
				<div class="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
				<span class="mt-3 text-gray-500 dark:text-gray-400 text-sm">Loading page {recPage + 1}...</span>
			</div>
		{:else if recItems.length === 0}
			<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
				<p class="text-gray-700 dark:text-gray-300 font-medium">No {recEntity} records found.</p>
			</div>
		{:else}
			<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-750">
								{#each recColumns as col}
									<th class="text-left py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{col}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each recItems as row, i}
								<tr class={cn('border-b border-gray-100 dark:border-gray-700', i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750')}>
									{#each recColumns as col}
										<td class="py-2 px-3 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-xs truncate" title={typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}>
											{#if typeof row[col] === 'object' && row[col] !== null}
												<span class="text-xs text-gray-500 dark:text-gray-400">{JSON.stringify(row[col])}</span>
											{:else if typeof row[col] === 'number'}
												{fmt(row[col])}
											{:else}
												{row[col] ?? '—'}
											{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Pagination controls -->
			<div class="flex items-center justify-center gap-2">
				<button
					onclick={() => recGoTo(0)}
					disabled={recPage === 0}
					class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
				>First</button>
				<button
					onclick={() => recGoTo(recPage - 1)}
					disabled={recPage === 0}
					class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
				>Prev</button>
				<span class="text-sm text-gray-600 dark:text-gray-400 px-2">Page {recPage + 1} of {recTotalPages}</span>
				<button
					onclick={() => recGoTo(recPage + 1)}
					disabled={recPage >= recTotalPages - 1}
					class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
				>Next</button>
				<button
					onclick={() => recGoTo(recTotalPages - 1)}
					disabled={recPage >= recTotalPages - 1}
					class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
				>Last</button>
			</div>
		{/if}

	{:else if tab === 'visualizations'}
		<!-- ===== VISUALIZATIONS TAB ===== -->

		{#if ledgerEntries.length === 0 && budgets.length === 0}
			<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
				<p class="text-gray-700 dark:text-gray-300 font-medium">No data available for visualizations.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<!-- Tax Allocation (bar chart) -->
				<div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
					<h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">📊 Tax Allocation Breakdown</h4>
					{#if taxAllocationData.length === 0}
						<p class="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No expense budgets with actual amounts</p>
					{:else}
						{@const maxAlloc = Math.max(...taxAllocationData.map(d => d.amount))}
						<div class="space-y-3">
							{#each taxAllocationData as item}
								<div>
									<div class="flex justify-between text-sm mb-1">
										<span class="text-gray-700 dark:text-gray-300">{item.label}</span>
										<span class="font-medium text-gray-800 dark:text-gray-200">{fmtCompact(item.amount)}</span>
									</div>
									<div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4">
										<div class="h-4 rounded-full transition-all" style="width: {barWidth(item.amount, maxAlloc)}; background: {item.color}"></div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Asset Portfolio (bar chart) -->
				<div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
					<h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">💰 Asset Portfolio</h4>
					{#if assetPortfolioData.length === 0}
						<p class="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No fund balance data</p>
					{:else}
						{@const maxPortfolio = Math.max(...assetPortfolioData.map(d => d.balance))}
						{@const totalPortfolio = assetPortfolioData.reduce((s, d) => s + d.balance, 0)}
						<div class="text-center mb-4">
							<span class="text-2xl font-bold text-gray-800 dark:text-white">{fmtCompact(totalPortfolio)}</span>
							<span class="text-sm text-gray-500 dark:text-gray-400 ml-1">total</span>
						</div>
						<div class="space-y-3">
							{#each assetPortfolioData as item}
								<div>
									<div class="flex justify-between text-sm mb-1">
										<span class="text-gray-700 dark:text-gray-300">{item.name} ({item.symbol})</span>
										<span class="font-medium text-gray-800 dark:text-gray-200">{fmtCompact(item.balance)}</span>
									</div>
									<div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4">
										<div class="h-4 rounded-full transition-all" style="width: {barWidth(item.balance, maxPortfolio)}; background: {item.color}"></div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Tax Contribution (data table) -->
			<div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
				<h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">🌳 Tax Contribution Analysis</h4>
				{#if taxContributionData.length === 0}
					<p class="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No revenue contribution data</p>
				{:else}
					{@const maxContrib = Math.max(...taxContributionData.map(d => d.contribution))}
					<div class="space-y-3">
						{#each taxContributionData.sort((a, b) => b.contribution - a.contribution) as item}
							<div>
								<div class="flex justify-between text-sm mb-1">
									<span class="text-gray-700 dark:text-gray-300 flex items-center gap-2">
										{item.name}
										<span class={cn(
											'text-xs px-1.5 py-0.5 rounded',
											item.type === 'citizen' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
										)}>{item.type}</span>
									</span>
									<span class="font-medium text-gray-800 dark:text-gray-200">{fmtCompact(item.contribution)}</span>
								</div>
								<div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
									<div class="h-3 rounded-full transition-all" style="width: {barWidth(item.contribution, maxContrib)}; background: {item.color}"></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Cash Flow Breakdown -->
			<div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
				<h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">💰 Cash Flow Breakdown</h4>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="bg-white dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
						<div class="flex items-center justify-between mb-3">
							<span class="text-sm font-medium text-blue-700 dark:text-blue-400">📈 Income</span>
							<span class="text-lg font-bold text-blue-800 dark:text-blue-300">+{fmtCompact(cashFlowBreakdown.totalIncome)}</span>
						</div>
						<div class="space-y-1 text-xs">
							{#each cashFlowBreakdown.income as item}
								<div class="flex justify-between text-gray-600 dark:text-gray-400">
									<span>{item.category}</span>
									<span>{fmtCompact(item.amount)}</span>
								</div>
							{/each}
						</div>
					</div>
					<div class="bg-white dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
						<div class="flex items-center justify-between mb-3">
							<span class="text-sm font-medium text-red-600 dark:text-red-400">📉 Expenses</span>
							<span class="text-lg font-bold text-red-500 dark:text-red-400">-{fmtCompact(cashFlowBreakdown.totalExpenses)}</span>
						</div>
						<div class="space-y-1 text-xs">
							{#each cashFlowBreakdown.expenses as item}
								<div class="flex justify-between text-gray-600 dark:text-gray-400">
									<span>{item.category}</span>
									<span>{fmtCompact(item.amount)}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
				<div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-blue-700 dark:text-blue-300">💰 Net Flow</span>
						<span class={cn('text-lg font-bold', cashFlowBreakdown.net >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-red-600 dark:text-red-400')}>
							{cashFlowBreakdown.net >= 0 ? '+' : ''}{fmtCompact(cashFlowBreakdown.net)}
						</span>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
