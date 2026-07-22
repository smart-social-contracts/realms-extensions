<script lang="ts">
	let { ctx }: { ctx: any } = $props();

	const cn = ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' '));

	type TabId = 'balance' | 'transactions' | 'transfer' | 'lookup' | 'admin';

	interface TokenInfo {
		ledger: string;
		indexer: string;
		decimals: number;
		symbol: string;
		name: string;
	}

	interface VaultSettings {
		maxRefreshAgeMs: number;
	}

	const DEFAULT_MAX_REFRESH_AGE_MS = 60 * 60 * 1000; // 1 hour
	const SETTINGS_KEY = 'vault_settings';
	const LAST_REFRESH_KEY = 'vault_last_refresh';

	let activeTab = $state<TabId>('balance');
	let loading = $state(false);
	let error = $state('');
	let accessDeniedOp = $state('');

	let currentPrincipal = $state('');
	let vaultPrincipal = $state('');

	let ledgerCanisters = $state<Record<string, TokenInfo>>({});
	let selectedTokens = $state<Record<string, boolean>>({});
	let tokenBalances = $state<Record<string, number>>({});
	let tokensLoaded = $state(false);

	let balance = $state(0);
	let balanceObject = $state<any>(null);
	let allBalances = $state<any[]>([]);
	let balancePagination = $state<any>(null);
	let userTokenBalances = $state<Record<string, number>>({});

	let transactions = $state<any[]>([]);
	let transferPagination = $state<any>(null);
	let currentPage = $state(0);
	const pageSize = 10;

	let vaultBalanceLoading = $state(false);
	let lastRefreshTime = $state<Date | null>(null);
	let copiedText = $state('');

	let settings = $state<VaultSettings>(loadVaultSettings());
	let settingsInputMinutes = $state(Math.round(loadVaultSettings().maxRefreshAgeMs / 60000));

	let transferToken = $state('');
	let transferTo = $state('');
	let transferAmount = $state(0);
	let transferToSubaccount = $state('');
	let transferFromSubaccount = $state('');

	let lookupMode = $state<'user' | 'invoice' | 'raw'>('user');
	let lookupPrincipal = $state('');
	let lookupInvoiceId = $state('');
	let lookupRawHex = $state('');
	let lookupResult = $state<{ label: string; subaccount_hex: string; balances: Record<string, number> } | null>(null);
	let lookupLoading = $state(false);

	let tokenSymbols = $derived(Object.keys(ledgerCanisters));
	let anyTokenSelected = $derived(Object.values(selectedTokens).some(Boolean));

	function parseRaw(raw: any): any {
		return typeof raw === 'string' ? JSON.parse(raw) : raw;
	}

	/** Vault extension endpoints return `{ success, data: { ...payload } }`. */
	function unwrapExtensionPayload(raw: any): any {
		if (raw && typeof raw === 'object' && raw.success === true && raw.data != null) {
			return raw.data;
		}
		return raw;
	}

	function walletTokenName(displayKey: string): string {
		return ledgerCanisters[displayKey]?.name ?? displayKey;
	}

	function loadVaultSettings(): VaultSettings {
		try {
			const raw = localStorage.getItem(SETTINGS_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (typeof parsed.maxRefreshAgeMs === 'number' && parsed.maxRefreshAgeMs > 0) {
					return { maxRefreshAgeMs: parsed.maxRefreshAgeMs };
				}
			}
		} catch {
			// ignore
		}
		return { maxRefreshAgeMs: DEFAULT_MAX_REFRESH_AGE_MS };
	}

	function saveVaultSettings(settings: VaultSettings) {
		try {
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
		} catch {
			// ignore
		}
	}

	function updateSettingsFromInput() {
		const minutes = Math.max(1, Math.round(settingsInputMinutes || 1));
		settings = { maxRefreshAgeMs: minutes * 60000 };
		saveVaultSettings(settings);
	}

	function loadLastRefresh(): { timestamp: number; balances: Record<string, number> } | null {
		try {
			const raw = localStorage.getItem(LAST_REFRESH_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed.timestamp === 'number' && parsed.balances) {
					return { timestamp: parsed.timestamp, balances: parsed.balances };
				}
			}
		} catch {
			// ignore
		}
		return null;
	}

	function saveLastRefresh(timestamp: number, balances: Record<string, number>) {
		try {
			localStorage.setItem(LAST_REFRESH_KEY, JSON.stringify({ timestamp, balances }));
		} catch {
			// ignore
		}
	}

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedText = text;
			setTimeout(() => (copiedText = ''), 2000);
		} catch {}
	}

	function timeAgo(date: Date): string {
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return `${Math.floor(hours / 24)}d ago`;
	}

	function parseTimestamp(timestamp: string | number): Date {
		const ts = String(timestamp);
		if (ts.includes('T') || ts.includes('-') || ts.includes(':')) return new Date(ts);
		try {
			return new Date(Number(BigInt(ts) / BigInt(1000000)));
		} catch {
			return new Date();
		}
	}

	function formatTokenAmount(raw: number, decimals: number): string {
		return (raw / Math.pow(10, decimals)).toFixed(decimals);
	}

	function shortPrincipal(p: string, n = 20): string {
		return p.length > n ? `${p.substring(0, n)}…` : p;
	}

	// ── Data loading ─────────────────────────────────────────

	async function loadTokens() {
		try {
			const resp = unwrapExtensionPayload(await ctx.callSync('get_active_tokens', {}));
			const tokens = resp?.ActiveTokens || [];
			const canisters: Record<string, TokenInfo> = {};
			const sel: Record<string, boolean> = {};
			const bals: Record<string, number> = {};

			for (const token of tokens) {
				const symbol = token.symbol || token.name;
				const ledger = token.ledger_canister_id ?? token.ledger ?? '';
				const indexer = token.indexer_canister_id ?? token.indexer ?? '';
				if (symbol) {
					canisters[symbol] = {
						ledger,
						indexer,
						decimals: token.decimals || 8,
						symbol,
						name: token.name,
					};
					sel[symbol] = true;
					bals[symbol] = 0;
				}
			}

			ledgerCanisters = canisters;
			selectedTokens = sel;
			tokenBalances = bals;

			// Restore last known vault balances so the UI is not blank on load
			const last = loadLastRefresh();
			if (last && last.balances) {
				for (const key of Object.keys(canisters)) {
					if (key in last.balances) {
						bals[key] = last.balances[key];
					}
				}
				tokenBalances = bals;
				lastRefreshTime = new Date(last.timestamp);
			}

			const syms = Object.keys(canisters);
			if (syms.length > 0 && !transferToken) transferToken = syms[0];
			tokensLoaded = true;
		} catch (e: any) {
			console.error('Failed to load tokens:', e);
		}
	}

	async function loadBalance() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			if (!currentPrincipal) {
				currentPrincipal = ctx.principal || '';
			}
			const raw = await ctx.backend.get_objects_paginated('WalletBalance', 0, 100, 'asc');
			const resp = parseRaw(raw);
			if (resp?.success && resp?.data?.objectsListPaginated) {
				const data = resp.data.objectsListPaginated;
				balancePagination = data.pagination;
				allBalances = data.objects.map((s: string) => JSON.parse(s));
				balanceObject = allBalances.find(
					(b: any) => b.principal === currentPrincipal || b.id === currentPrincipal || b._id === currentPrincipal,
				);
				balance = balanceObject ? balanceObject.amount || 0 : 0;

				// Per-token user balances (may be empty if the user has no balances)
				const perToken: Record<string, number> = {};
				for (const b of allBalances) {
					if (b.principal === currentPrincipal || b.id === currentPrincipal || b._id === currentPrincipal) {
						if (b.token) {
							perToken[b.token] = b.amount || 0;
						}
					}
				}
				userTokenBalances = perToken;
			} else {
				balance = 0;
				balanceObject = null;
				userTokenBalances = {};
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

	async function loadTransactions(page: number = currentPage) {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			if (!vaultPrincipal) {
				try {
					if (typeof ctx.backend.get_canister_id === 'function') {
						const r = await ctx.backend.get_canister_id();
						vaultPrincipal = r || '';
					}
				} catch {
					vaultPrincipal = '';
				}
			}
			const raw = await ctx.backend.get_objects_paginated('WalletTransfer', page, pageSize, 'desc');
			const resp = parseRaw(raw);
			if (resp?.success && resp?.data?.objectsListPaginated) {
				const data = resp.data.objectsListPaginated;
				transferPagination = data.pagination;
				transactions = data.objects.map((s: string) => JSON.parse(s));
			} else {
				transactions = [];
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

	async function loadVaultBalance(displayKey: string) {
		try {
			const data = unwrapExtensionPayload(
				await ctx.callSync('get_vault_balance', { token: walletTokenName(displayKey) }),
			);
			if (data?.Balance) {
				tokenBalances[displayKey] = data.Balance.amount || 0;
				tokenBalances = { ...tokenBalances };
				vaultPrincipal = data.Balance.principal_id || vaultPrincipal;
			}
		} catch (e: any) {
			console.error(`Failed to load vault balance for ${displayKey}:`, e);
		}
	}

	function displayKeyForTokenName(tokenName: string): string | undefined {
		return tokenSymbols.find((s) => ledgerCanisters[s]?.name === tokenName);
	}

	function applyRefreshBalances(perToken: Record<string, any>) {
		for (const [tokenName, tokenData] of Object.entries(perToken)) {
			const key = displayKeyForTokenName(tokenName) || tokenName;
			if (ledgerCanisters[key]) {
				tokenBalances[key] = (tokenData as any)?.balance || 0;
			}
		}
		tokenBalances = { ...tokenBalances };
	}

	async function loadVaultPrincipal() {
		try {
			if (typeof ctx.backend.get_canister_id === 'function') {
				vaultPrincipal = (await ctx.backend.get_canister_id()) || vaultPrincipal;
			}
		} catch {
			// keep existing value
		}
	}

	async function loadAllVaultBalances() {
		await Promise.all(
			tokenSymbols
				.filter((token) => selectedTokens[token])
				.map((token) => loadVaultBalance(token)),
		);
	}

	// ── Mutations ────────────────────────────────────────────

	async function refreshVaultBalance(displayKey: string) {
		vaultBalanceLoading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const data = unwrapExtensionPayload(
				await ctx.callAsync('refresh_vault_balance', { token: walletTokenName(displayKey) }),
			);
			if (data?.Balance) {
				tokenBalances[displayKey] = data.Balance.amount || 0;
				tokenBalances = { ...tokenBalances };
				lastRefreshTime = new Date();
			} else {
				error = 'Failed to refresh vault balance';
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
			vaultBalanceLoading = false;
		}
	}

	async function refreshAllVaultBalances() {
		vaultBalanceLoading = true;
		await loadAllVaultBalances();
		vaultBalanceLoading = false;
		lastRefreshTime = new Date();
	}

	async function refreshVault() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const refreshData = unwrapExtensionPayload(await ctx.callAsync('refresh', {}));
			if (refreshData?.TransactionSummary == null) {
				error = 'Failed to sync vault transactions';
				return;
			}
			applyRefreshBalances(refreshData.TransactionSummary.per_token || {});
			await loadVaultPrincipal();
			lastRefreshTime = new Date();
			saveLastRefresh(lastRefreshTime.getTime(), tokenBalances);
			await Promise.all([loadBalance(), loadTransactions(0)]);
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

	async function performTransfer() {
		if (!transferTo || transferAmount <= 0) {
			error = 'Please enter valid recipient and amount';
			return;
		}
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const args: any = { to_principal: transferTo, amount: transferAmount };
			if (transferToSubaccount.trim()) args.to_subaccount = transferToSubaccount.trim();
			if (transferFromSubaccount.trim()) args.from_subaccount = transferFromSubaccount.trim();
			if (transferToken) args.token = walletTokenName(transferToken);

			unwrapExtensionPayload(await ctx.callAsync('transfer', args));
			transferTo = '';
			transferAmount = 0;
			transferToSubaccount = '';
			transferFromSubaccount = '';
			await loadBalance();
			await loadTransactions();
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

	async function lookupSubaccountBalance() {
		lookupLoading = true;
		lookupResult = null;
		error = '';
		accessDeniedOp = '';
		try {
			const lookupArgs: any = {};
			if (lookupMode === 'user' && lookupPrincipal.trim()) {
				lookupArgs.principal = lookupPrincipal.trim();
			} else if (lookupMode === 'invoice' && lookupInvoiceId.trim()) {
				lookupArgs.invoice_id = lookupInvoiceId.trim();
			} else if (lookupMode === 'raw' && lookupRawHex.trim()) {
				lookupArgs.subaccount_hex = lookupRawHex.trim();
			} else {
				error = 'Please enter a value to look up';
				lookupLoading = false;
				return;
			}

			const data = unwrapExtensionPayload(await ctx.callAsync('lookup_balance', lookupArgs));
			if (data?.LookupBalance) {
				lookupResult = data.LookupBalance;
			} else {
				error = 'Lookup failed';
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
			lookupLoading = false;
		}
	}

	// ── Pagination ───────────────────────────────────────────

	async function goToPage(page: number) {
		currentPage = page;
		await loadTransactions(page);
	}

	function paginationPages(total: number, current: number): (number | '...')[] {
		if (total <= 7) return Array.from({ length: total }, (_, i) => i);
		const pages: (number | '...')[] = [0];
		if (current > 3) pages.push('...');
		for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) pages.push(i);
		if (current < total - 4) pages.push('...');
		pages.push(total - 1);
		return pages;
	}

	// ── Tabs definition ──────────────────────────────────────

	const tabs: { id: TabId; label: string }[] = [
		{ id: 'balance', label: 'Balances' },
		{ id: 'transactions', label: 'Transactions' },
		{ id: 'transfer', label: 'Transfer' },
		{ id: 'lookup', label: 'Lookup' },
		{ id: 'admin', label: 'Admin' },
	];

	// ── Spinner SVG ──────────────────────────────────────────

	const spinnerSvg = `<svg class="inline-block w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>`;

	// ── Init ─────────────────────────────────────────────────

	$effect(() => {
		(async () => {
			await loadTokens();
			const settings = loadVaultSettings();
			const last = loadLastRefresh();
			const now = Date.now();
			const shouldRefresh = !last || (now - last.timestamp) > settings.maxRefreshAgeMs;

			if (shouldRefresh) {
				await refreshVault();
			} else {
				// Still load user-specific and transaction data in the background
				await Promise.all([loadBalance(), loadTransactions(0)]);
			}
		})();
	});
</script>

<div class={cn('max-w-4xl mx-auto p-6 space-y-6')}>
	<!-- Header -->
	<div class={cn('flex justify-between items-center')}>
		<h1 class={cn('text-2xl font-bold text-gray-900 dark:text-gray-100')}>Vault</h1>
		<button
			onclick={refreshVault}
			disabled={loading || vaultBalanceLoading}
			class={cn(
				'px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg',
				'hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed',
				'inline-flex items-center gap-2 transition-colors',
			)}
		>
			{#if loading || vaultBalanceLoading}
				{@html spinnerSvg}
			{/if}
			{loading || vaultBalanceLoading ? 'Refreshing…' : 'Refresh'}
		</button>
	</div>

	<!-- Vault Balances Card -->
	{#if tokensLoaded}
		<div class={cn('bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5')}>
			<h3 class={cn('text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3')}>Vault Balances</h3>
			<div class={cn('space-y-2')}>
				{#each tokenSymbols as token}
					{#if selectedTokens[token]}
						<div class={cn('flex items-center justify-between bg-white/60 dark:bg-gray-800/40 rounded-lg p-3')}>
							<span class={cn('text-base font-semibold text-indigo-900 dark:text-indigo-200')}>{ledgerCanisters[token].symbol}</span>
							<div class={cn('text-right')}>
								<div class={cn('text-xl font-bold text-indigo-900 dark:text-indigo-100')}>
									{formatTokenAmount(tokenBalances[token] || 0, ledgerCanisters[token].decimals)}
								</div>
								<div class={cn('text-xs text-indigo-600 dark:text-indigo-400')}>
									{(tokenBalances[token] || 0).toLocaleString()} units
								</div>
							</div>
						</div>
					{/if}
				{/each}
				{#if !anyTokenSelected}
					<p class={cn('text-sm text-gray-500 italic')}>Select at least one token to view balances</p>
				{/if}
			</div>
			<p class={cn('mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium')}>
				On-chain ledger balances for the vault canister
			</p>
		</div>
	{/if}

	<!-- Vault Info -->
	<div class={cn('bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2')}>
		<div class={cn('flex items-center gap-2')}>
			<span class={cn('text-sm font-medium text-gray-600 dark:text-gray-400')}>Vault Principal:</span>
			<button
				onclick={() => copyToClipboard(vaultPrincipal)}
				class={cn('font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:underline')}
			>
				{vaultPrincipal || 'Loading…'}
			</button>
			{#if copiedText === vaultPrincipal && vaultPrincipal}
				<span class={cn('text-xs text-green-600 dark:text-green-400')}>Copied!</span>
			{/if}
		</div>
		{#if lastRefreshTime}
			<div>
				<span class={cn('text-sm font-medium text-gray-600 dark:text-gray-400')}>Last Refresh:</span>
				<span class={cn('ml-2 text-sm text-gray-700 dark:text-gray-300')}>
					{lastRefreshTime.toLocaleString()} ({timeAgo(lastRefreshTime)})
				</span>
			</div>
		{/if}
	</div>

	<!-- Token Selector -->
	{#if tokensLoaded && tokenSymbols.length > 0}
		<div class={cn('bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4')}>
			<h3 class={cn('text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2')}>Active Tokens</h3>
			<div class={cn('flex flex-wrap gap-4')}>
				{#each tokenSymbols as token}
					<label class={cn('flex items-center gap-2 cursor-pointer')}>
						<input
							type="checkbox"
							checked={selectedTokens[token]}
							onchange={() => { selectedTokens[token] = !selectedTokens[token]; selectedTokens = { ...selectedTokens }; }}
							class={cn('w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500')}
						/>
						<span class={cn('text-sm font-medium text-gray-700 dark:text-gray-300')}>{ledgerCanisters[token].symbol}</span>
					</label>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Ledger Canisters Info -->
	{#if tokensLoaded && anyTokenSelected}
		<div class={cn('bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4')}>
			<h3 class={cn('text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2')}>Ledger Canisters</h3>
			<div class={cn('space-y-2')}>
				{#each tokenSymbols as token}
					{#if selectedTokens[token]}
						<div class={cn('border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 last:pb-0')}>
							<div class={cn('text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1')}>{ledgerCanisters[token].symbol}</div>
							<div class={cn('flex items-center justify-between text-xs')}>
								<span class={cn('text-gray-600 dark:text-gray-400')}>Ledger:</span>
								<button onclick={() => copyToClipboard(ledgerCanisters[token].ledger)} class={cn('font-mono text-indigo-600 dark:text-indigo-400 hover:underline')}>
									{ledgerCanisters[token].ledger}
								</button>
							</div>
							<div class={cn('flex items-center justify-between text-xs mt-1')}>
								<span class={cn('text-gray-600 dark:text-gray-400')}>Indexer:</span>
								<button onclick={() => copyToClipboard(ledgerCanisters[token].indexer)} class={cn('font-mono text-indigo-600 dark:text-indigo-400 hover:underline')}>
									{ledgerCanisters[token].indexer}
								</button>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<!-- Error -->
	{#if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error}
		<div class={cn('p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300')}>
			{error}
		</div>
	{/if}

	<!-- Tabs -->
	<nav class={cn('flex border-b border-gray-200 dark:border-gray-700')}>
		{#each tabs as t}
			<button
				onclick={() => { activeTab = t.id; }}
				class={cn(
					'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
					activeTab === t.id
						? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
						: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
				)}
			>
				{t.label}
			</button>
		{/each}
	</nav>

	<!-- Tab Content -->
	<div>
		<!-- ═══ Balance Tab ═══ -->
		{#if activeTab === 'balance'}
			<div class={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6')}>
				<h2 class={cn('text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2')}>Your Balance</h2>
				<p class={cn('text-sm text-gray-500 dark:text-gray-400 mb-4')}>
					Personal balance for the logged-in principal. The vault canister balance is shown at the top.
				</p>
				<div class={cn('space-y-3')}>
					{#each tokenSymbols as token}
						{#if selectedTokens[token]}
							{@const userBal = userTokenBalances[token] ?? 0}
							<div class={cn('flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg')}>
								<span class={cn('text-base font-semibold text-gray-700 dark:text-gray-300')}>{ledgerCanisters[token].symbol}</span>
								<div class={cn('text-right')}>
									<div class={cn('text-xl font-bold text-indigo-600 dark:text-indigo-400')}>
										{formatTokenAmount(userBal, ledgerCanisters[token].decimals)}
									</div>
									<div class={cn('text-xs text-gray-500 dark:text-gray-400')}>{userBal.toLocaleString()} units</div>
								</div>
							</div>
						{/if}
					{/each}
					{#if !anyTokenSelected}
						<p class={cn('text-sm text-gray-500 italic')}>Select at least one token to view balances</p>
					{/if}
				</div>
				{#if balanceObject}
					<div class={cn('mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg')}>
						<p class={cn('text-sm text-gray-600 dark:text-gray-400')}>
							<span class={cn('font-medium')}>Principal:</span>
							<span class={cn('font-mono text-xs ml-1')}>{balanceObject._id || balanceObject.id}</span>
						</p>
					</div>
				{/if}
			</div>

		<!-- ═══ Transactions Tab ═══ -->
		{:else if activeTab === 'transactions'}
			<div class={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden')}>
				<h2 class={cn('text-lg font-semibold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100')}>
					Transaction History
				</h2>
				<div class={cn('overflow-x-auto')}>
					<table class={cn('w-full text-sm')}>
						<thead class={cn('bg-gray-50 dark:bg-gray-700/50')}>
							<tr>
								<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase')}>ID</th>
								<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase')}>Token</th>
								<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase')}>From</th>
								<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase')}>To</th>
								<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase')}>Amount</th>
								<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase')}>When</th>
								<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase')}>Type</th>
							</tr>
						</thead>
						<tbody class={cn('divide-y divide-gray-100 dark:divide-gray-700')}>
							{#each transactions as tx (tx._id || tx.tx_id || Math.random())}
								<tr class={cn('hover:bg-gray-50 dark:hover:bg-gray-700/30')}>
									<td class={cn('px-4 py-3 text-gray-700 dark:text-gray-300')}>{tx.tx_id || tx._id}</td>
									<td class={cn('px-4 py-3')}>
										<span class={cn('px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded text-xs font-medium')}>
											{tx.token || '—'}
										</span>
									</td>
									<td class={cn('px-4 py-3 font-mono text-xs')}>
										{#if tx.principal_from}
											<button
												onclick={() => copyToClipboard(tx.principal_from)}
												class={cn('text-indigo-600 dark:text-indigo-400 hover:underline text-left')}
											>
												{shortPrincipal(tx.principal_from)}
											</button>
											{#if copiedText === tx.principal_from}
												<span class={cn('ml-1 text-xs text-green-600')}>✓</span>
											{/if}
										{:else}
											<span class={cn('text-gray-400')}>N/A</span>
										{/if}
									</td>
									<td class={cn('px-4 py-3 font-mono text-xs')}>
										{#if tx.principal_to}
											<button
												onclick={() => copyToClipboard(tx.principal_to)}
												class={cn('text-indigo-600 dark:text-indigo-400 hover:underline text-left')}
											>
												{shortPrincipal(tx.principal_to)}
											</button>
											{#if copiedText === tx.principal_to}
												<span class={cn('ml-1 text-xs text-green-600')}>✓</span>
											{/if}
										{:else}
											<span class={cn('text-gray-400')}>N/A</span>
										{/if}
									</td>
									<td class={cn('px-4 py-3 text-gray-700 dark:text-gray-300')}>{(tx.amount || 0).toLocaleString()}</td>
									<td class={cn('px-4 py-3')}>
										{#if tx.timestamp}
											{@const txDate = parseTimestamp(tx.timestamp)}
											<button
												onclick={() => copyToClipboard(txDate.toLocaleString())}
												class={cn('text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left')}
											>
												{timeAgo(txDate)}
											</button>
										{:else}
											<span class={cn('text-gray-400')}>N/A</span>
										{/if}
									</td>
									<td class={cn('px-4 py-3')}>
										<span class={cn('px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded text-xs')}>
											{tx.kind || 'transfer'}
										</span>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="7" class={cn('px-4 py-8 text-center text-gray-500 dark:text-gray-400')}>No transactions found</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if transferPagination && Number(transferPagination.total_pages) > 1}
					<div class={cn('p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between')}>
						<span class={cn('text-xs text-gray-500 dark:text-gray-400')}>
							{transactions.length} of {transferPagination.total_items_count} (Page {currentPage + 1} / {transferPagination.total_pages})
						</span>
						<div class={cn('flex items-center gap-1')}>
							<button
								onclick={() => goToPage(currentPage - 1)}
								disabled={currentPage === 0}
								class={cn('px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed')}
							>
								Prev
							</button>
							{#each paginationPages(Number(transferPagination.total_pages), currentPage) as p}
								{#if p === '...'}
									<span class={cn('px-1.5 text-xs text-gray-400')}>…</span>
								{:else}
									<button
										onclick={() => goToPage(p as number)}
										class={cn(
											'px-2.5 py-1 text-xs border rounded',
											currentPage === p
												? 'bg-indigo-600 text-white border-indigo-600'
												: 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
										)}
									>
										{(p as number) + 1}
									</button>
								{/if}
							{/each}
							<button
								onclick={() => goToPage(currentPage + 1)}
								disabled={currentPage >= Number(transferPagination.total_pages) - 1}
								class={cn('px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed')}
							>
								Next
							</button>
						</div>
					</div>
				{/if}
			</div>

		<!-- ═══ Transfer Tab ═══ -->
		{:else if activeTab === 'transfer'}
			<div class={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6')}>
				<h2 class={cn('text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4')}>Transfer Tokens (Admin Only)</h2>
				<form onsubmit={(e) => { e.preventDefault(); performTransfer(); }} class={cn('space-y-4')}>
					<div>
						<label for="v-token" class={cn('block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5')}>Token</label>
						<select
							id="v-token"
							bind:value={transferToken}
							class={cn('w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40')}
						>
							{#each tokenSymbols as token}
								<option value={token}>{ledgerCanisters[token].symbol}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="v-to" class={cn('block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5')}>Recipient Principal</label>
						<input
							id="v-to"
							type="text"
							bind:value={transferTo}
							placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
							class={cn('w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40')}
						/>
					</div>
					<div>
						<label for="v-amount" class={cn('block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5')}>
							Amount ({ledgerCanisters[transferToken]?.symbol || transferToken || ''} units)
						</label>
						<input
							id="v-amount"
							type="number"
							bind:value={transferAmount}
							placeholder="100000000"
							class={cn('w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40')}
						/>
					</div>
					<div>
						<label for="v-to-sub" class={cn('block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5')}>
							To Subaccount (optional, 64-char hex)
						</label>
						<input
							id="v-to-sub"
							type="text"
							bind:value={transferToSubaccount}
							placeholder="0000000000000000000000000000000000000000000000000000000000000000"
							class={cn('w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40')}
						/>
					</div>
					<div>
						<label for="v-from-sub" class={cn('block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5')}>
							From Subaccount (optional, 64-char hex)
						</label>
						<input
							id="v-from-sub"
							type="text"
							bind:value={transferFromSubaccount}
							placeholder="0000000000000000000000000000000000000000000000000000000000000000"
							class={cn('w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40')}
						/>
					</div>
					<button
						type="submit"
						disabled={loading || !transferTo || transferAmount <= 0}
						class={cn(
							'w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg',
							'hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
						)}
					>
						{loading ? 'Processing…' : 'Transfer'}
					</button>
				</form>
			</div>

		<!-- ═══ Lookup Tab ═══ -->
		{:else if activeTab === 'lookup'}
			<div class={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6')}>
				<h2 class={cn('text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2')}>Subaccount Lookup</h2>
				<p class={cn('text-sm text-gray-500 dark:text-gray-400 mb-4')}>
					Look up token balances for a user (by principal) or an invoice (by ID).
					The subaccount is derived using the <code class={cn('bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs')}>usr_</code> /
					<code class={cn('bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs')}>inv_</code> prefix convention.
				</p>

				<div class={cn('flex gap-2 mb-4')}>
					{#each [{ id: 'user', label: 'User (usr_)' }, { id: 'invoice', label: 'Invoice (inv_)' }, { id: 'raw', label: 'Raw Hex' }] as mode}
						<button
							onclick={() => { lookupMode = mode.id as any; lookupResult = null; }}
							class={cn(
								'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
								lookupMode === mode.id
									? 'bg-indigo-600 text-white'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
							)}
						>
							{mode.label}
						</button>
					{/each}
				</div>

				<form onsubmit={(e) => { e.preventDefault(); lookupSubaccountBalance(); }} class={cn('flex gap-2 mb-4')}>
					{#if lookupMode === 'user'}
						<input type="text" bind:value={lookupPrincipal} placeholder="Enter principal ID"
							class={cn('flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40')} />
					{:else if lookupMode === 'invoice'}
						<input type="text" bind:value={lookupInvoiceId} placeholder="Enter invoice ID"
							class={cn('flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40')} />
					{:else}
						<input type="text" bind:value={lookupRawHex} placeholder="Enter 64-char hex subaccount"
							class={cn('flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40')} />
					{/if}
					<button
						type="submit"
						disabled={lookupLoading}
						class={cn('px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2')}
					>
						{#if lookupLoading}{@html spinnerSvg}{/if}
						{lookupLoading ? 'Looking up…' : 'Lookup'}
					</button>
				</form>

				{#if lookupResult}
					<div class={cn('bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3')}>
						<div class={cn('flex items-center justify-between')}>
							<div>
								<span class={cn('text-sm font-medium text-gray-600 dark:text-gray-400')}>Account:</span>
								<span class={cn('ml-2 text-sm font-semibold text-gray-800 dark:text-gray-200')}>{lookupResult.label}</span>
							</div>
							<button
								onclick={() => copyToClipboard(lookupResult?.subaccount_hex || '')}
								class={cn('text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono')}
							>
								{lookupResult.subaccount_hex.substring(0, 16)}…
							</button>
						</div>
						<div class={cn('space-y-2')}>
							{#each Object.entries(lookupResult.balances) as [token, bal]}
								{@const decimals = ledgerCanisters[token]?.decimals || 8}
								<div class={cn('flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3')}>
									<span class={cn('text-sm font-semibold text-gray-700 dark:text-gray-300')}>{token}</span>
									<div class={cn('text-right')}>
										<div class={cn('text-lg font-bold', Number(bal) > 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-400')}>
											{formatTokenAmount(Number(bal), decimals)}
										</div>
										<div class={cn('text-xs text-gray-500 dark:text-gray-400')}>{Number(bal).toLocaleString()} units</div>
									</div>
								</div>
							{/each}
						</div>
						{#if Object.values(lookupResult.balances).every((b) => Number(b) === 0)}
							<p class={cn('text-sm text-gray-500 italic')}>No balances found for this subaccount.</p>
						{/if}
					</div>
				{/if}
			</div>

		<!-- ═══ Admin Tab ═══ -->
		{:else if activeTab === 'admin'}
			<div class={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6')}>
				<h2 class={cn('text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4')}>Vault Admin</h2>

				<div class={cn('mb-4')}>
					<button
						onclick={refreshVault}
						disabled={loading}
						class={cn('px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2')}
					>
						{#if loading}{@html spinnerSvg}{/if}
						{loading ? 'Refreshing…' : 'Full Vault Refresh'}
					</button>
				</div>

				<div class={cn('mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700')}>
					<h3 class={cn('text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2')}>Auto-refresh settings</h3>
					<p class={cn('text-xs text-gray-500 dark:text-gray-400 mb-3')}>
						The Vault will only run an expensive full refresh on load if the last refresh is older than this threshold.
					</p>
					<div class={cn('flex items-center gap-3')}>
						<label for="v-refresh-age" class={cn('text-sm text-gray-700 dark:text-gray-300')}>Max refresh age:</label>
						<input
							id="v-refresh-age"
							type="number"
							min="1"
							bind:value={settingsInputMinutes}
							class={cn('w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100')}
						/>
						<span class={cn('text-sm text-gray-500 dark:text-gray-400')}>minutes</span>
						<button
							onclick={updateSettingsFromInput}
							class={cn('px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/60')}
						>
							Save
						</button>
					</div>
				</div>

				<div class={cn('space-y-6')}>
					<div>
						<h3 class={cn('font-semibold text-gray-700 dark:text-gray-300 mb-2')}>All Balances in System ({allBalances.length})</h3>
						{#if allBalances.length > 0}
							<div class={cn('space-y-2 max-h-80 overflow-auto')}>
								{#each allBalances as bal}
									<div class={cn('p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg')}>
										<div class={cn('font-mono text-xs text-gray-600 dark:text-gray-400 mb-1')}>
											Principal: {bal.principal || bal._id || bal.id}
										</div>
										<div class={cn('text-sm font-semibold text-gray-800 dark:text-gray-200')}>
											{(bal.amount || 0).toLocaleString()} units
										</div>
										{#if bal.token}
											<div class={cn('text-xs text-gray-500 dark:text-gray-400 mt-1')}>Token: {bal.token}</div>
										{/if}
									</div>
								{/each}
							</div>
						{:else}
							<p class={cn('text-gray-500 dark:text-gray-400 text-sm')}>No balances found in system</p>
						{/if}
					</div>

					<div>
						<h3 class={cn('font-semibold text-gray-700 dark:text-gray-300 mb-2')}>All Transfers in System</h3>
						{#if transferPagination}
							<p class={cn('text-sm text-gray-600 dark:text-gray-400')}>
								Total transfers: {transferPagination.total_items_count}
							</p>
						{:else}
							<p class={cn('text-gray-500 dark:text-gray-400 text-sm')}>No transfer data available</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
