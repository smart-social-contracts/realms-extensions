<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';

	let { ctx }: { ctx: any } = $props();

	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');

	// Config from backend
	let billingServiceUrl = $state('');
	let realmCanisterId = $state('');
	let registryCanisterId = $state('');
	let upgradeCostCredits = $state(5);

	// Version state
	let currentVersion = $state('');
	let latestVersion = $state('');
	let upgradeAvailable = $state(false);
	let upgradeLoading = $state(false);
	let upgradeError = $state('');
	let upgradeSuccess = $state('');

	// Credits state
	let creditBalance = $state(0);
	let totalPurchased = $state(0);
	let totalSpent = $state(0);

	// Transactions
	let transactions: any[] = $state([]);
	let transactionsLoading = $state(false);

	// Top-up
	let activeTab = $state<'card' | 'crypto'>('card');
	let topUpAmount = $state(10);
	let topUpLoading = $state(false);
	let topUpError = $state('');

	async function loadAll() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			// Load extension config
			const configResult = await ctx.callSync('get_config');
			const config = configResult?.data ?? configResult;
			billingServiceUrl = config?.billing_service_url || '';
			realmCanisterId = config?.realm_canister_id || '';
			registryCanisterId = config?.registry_canister_id || '';
			upgradeCostCredits = config?.upgrade_cost_credits || 5;
			currentVersion = config?.current_version || '';

			// Load version info
			try {
				const raw = await ctx.backend.get_available_upgrade('');
				const result = JSON.parse(raw);
				if (result.success) {
					currentVersion = result.current_version || currentVersion;
					latestVersion = result.latest_version || '';
					upgradeAvailable = result.upgrade_available || false;
				}
			} catch (e: any) {
				console.warn('Could not check upgrade availability:', e.message);
			}

			// Load credits
			try {
				const raw = await ctx.backend.get_realm_credits('');
				const result = JSON.parse(raw);
				if (result.success && result.credits) {
					creditBalance = result.credits.balance || 0;
					totalPurchased = result.credits.total_purchased || 0;
					totalSpent = result.credits.total_spent || 0;
				}
			} catch (e: any) {
				console.warn('Could not fetch realm credits:', e.message);
			}

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

	async function loadTransactions() {
		transactionsLoading = true;
		try {
			const result = await ctx.callAsync('get_transactions', { limit: 20 });
			const txData = result?.data ?? result;
			transactions = txData?.transactions || [];
		} catch (e: any) {
			console.warn('Could not fetch transactions:', e.message);
			transactions = [];
		} finally {
			transactionsLoading = false;
		}
	}

	async function handleUpgrade() {
		upgradeLoading = true;
		upgradeError = '';
		upgradeSuccess = '';
		try {
			const raw = await ctx.backend.request_upgrade('');
			const result = JSON.parse(raw);
			if (result.success) {
				const jobId = result.job_id || '';
				upgradeSuccess = `Upgrade to ${result.target_version || 'latest'} initiated (job: ${jobId})`;
				upgradeAvailable = false;
			} else {
				upgradeError = result.error || 'Upgrade request failed';
			}
		} catch (e: any) {
			upgradeError = e.message || 'Failed to request upgrade';
		} finally {
			upgradeLoading = false;
		}
	}

	async function handleTopUp() {
		if (!billingServiceUrl || topUpAmount < 1 || topUpAmount > 50) return;
		topUpLoading = true;
		topUpError = '';
		try {
			const response = await fetch(`${billingServiceUrl}/checkout/create-session`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					principal_id: realmCanisterId,
					amount: topUpAmount,
				}),
			});
			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.detail || 'Failed to create checkout session');
			}
			const data = await response.json();
			window.location.href = data.checkout_url;
		} catch (e: any) {
			topUpError = e.message || 'Top-up failed';
		} finally {
			topUpLoading = false;
		}
	}

	function formatDate(timestamp: number): string {
		if (!timestamp) return '—';
		return new Date(timestamp * 1000).toLocaleDateString(undefined, {
			year: 'numeric', month: 'short', day: 'numeric',
			hour: '2-digit', minute: '2-digit',
		});
	}

	function txTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			topup: 'Top-up',
			spend: 'Spent',
			hold: 'Hold',
		};
		return labels[type] || type;
	}

	function txTypeColor(type: string): string {
		if (type === 'topup') return 'text-green-600 dark:text-green-400';
		if (type === 'spend' || type === 'hold') return 'text-red-600 dark:text-red-400';
		return 'text-gray-600 dark:text-gray-400';
	}

	$effect(() => {
		loadAll();
	});
</script>

<div class="p-6 max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
				<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
				</svg>
			</div>
			<div>
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Managed Services</h1>
				<p class="text-sm text-gray-500 dark:text-gray-400">{extensionDescription}</p>
			</div>
		</div>
		<button
			onclick={loadAll}
			disabled={loading}
			class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{#if loading}
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
				</svg>
			{:else}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			{/if}
			Refresh
		</button>
	</div>

	<!-- Loading -->
	{#if loading && !currentVersion && !creditBalance}
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
			<svg class="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
			<p class="text-gray-500 dark:text-gray-400">Loading managed services...</p>
		</div>

	{:else if accessDeniedOp && !currentVersion}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error && !currentVersion}
		<div class="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
			<p class="text-red-700 dark:text-red-300 font-medium">Error: {error}</p>
			<button
				onclick={loadAll}
				class="mt-4 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
			>
				Retry
			</button>
		</div>

	{:else}
		<!-- Overview Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
				<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current Version</p>
				<p class="text-xl font-bold text-gray-900 dark:text-white mt-1 font-mono">
					{currentVersion || 'Unknown'}
				</p>
			</div>
			<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
				<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Latest Available</p>
				<p class="text-xl font-bold mt-1 font-mono {upgradeAvailable ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}">
					{latestVersion || 'None published'}
				</p>
				{#if upgradeAvailable}
					<span class="inline-flex items-center mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
						Update available
					</span>
				{/if}
			</div>
			<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
				<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Realm Credits</p>
				<p class="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
					{creditBalance}
				</p>
				{#if creditBalance < upgradeCostCredits}
					<span class="inline-flex items-center mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
						Need {upgradeCostCredits} for upgrade
					</span>
				{:else}
					<span class="text-xs text-gray-400 dark:text-gray-500 mt-1">
						{upgradeCostCredits} per upgrade
					</span>
				{/if}
			</div>
		</div>

		<!-- Upgrade Action -->
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
			<div class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
				<h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Realm Upgrade</h2>
			</div>
			<div class="p-5">
				{#if upgradeAvailable && creditBalance >= upgradeCostCredits}
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm text-gray-700 dark:text-gray-300">
								Upgrade from <span class="font-mono font-semibold">{currentVersion}</span> to <span class="font-mono font-semibold text-green-600 dark:text-green-400">{latestVersion}</span>
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cost: {upgradeCostCredits} credits. Both backend and frontend will be upgraded.</p>
						</div>
						<button
							onclick={handleUpgrade}
							disabled={upgradeLoading}
							class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if upgradeLoading}
								<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
								</svg>
								Upgrading...
							{:else}
								Upgrade to {latestVersion}
							{/if}
						</button>
					</div>
				{:else if upgradeAvailable && creditBalance < upgradeCostCredits}
					<div class="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
						<svg class="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
						<div>
							<p class="text-sm font-medium text-amber-800 dark:text-amber-200">Insufficient credits</p>
							<p class="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
								You have {creditBalance} credits but need {upgradeCostCredits} to upgrade. Use the top-up section below to purchase more.
							</p>
						</div>
					</div>
				{:else if !upgradeAvailable && latestVersion}
					<div class="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
						<svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<p class="text-sm text-green-700 dark:text-green-300">Your realm is up to date.</p>
					</div>
				{:else}
					<p class="text-sm text-gray-500 dark:text-gray-400">No version information available from the registry.</p>
				{/if}

				{#if upgradeError}
					<div class="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
						<p class="text-sm text-red-700 dark:text-red-300">{upgradeError}</p>
					</div>
				{/if}
				{#if upgradeSuccess}
					<div class="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
						<p class="text-sm text-green-700 dark:text-green-300">{upgradeSuccess}</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Top Up Credits -->
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
			<div class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
				<h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Top Up Credits</h2>
			</div>

			<!-- Tabs -->
			<div class="flex border-b border-gray-200 dark:border-gray-700">
				<button
					onclick={() => activeTab = 'card'}
					class="flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors {activeTab === 'card'
						? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
						: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
				>
					Credit Card
				</button>
				<button
					onclick={() => activeTab = 'crypto'}
					class="flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors {activeTab === 'crypto'
						? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
						: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
				>
					Crypto (ckBTC / ckUSDC)
				</button>
			</div>

			<div class="p-5">
				{#if activeTab === 'card'}
					<div class="space-y-4">
						<div>
							<label for="topup-slider" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Credits to purchase ({topUpAmount} credits = ${topUpAmount})
							</label>
							<input
								id="topup-slider"
								type="range"
								min="1"
								max="50"
								bind:value={topUpAmount}
								class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
							/>
							<div class="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
								<span>1 credit</span>
								<span>50 credits</span>
							</div>
						</div>

						<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
							<div>
								<p class="text-sm font-medium text-gray-700 dark:text-gray-300">{topUpAmount} credits</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">$1 per credit</p>
							</div>
							<p class="text-lg font-bold text-gray-900 dark:text-white">${topUpAmount}.00</p>
						</div>

						<button
							onclick={handleTopUp}
							disabled={topUpLoading || !billingServiceUrl}
							class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if topUpLoading}
								<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
								</svg>
								Redirecting to payment...
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
								</svg>
								Purchase with Credit Card
							{/if}
						</button>

						{#if topUpError}
							<div class="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
								<p class="text-sm text-red-700 dark:text-red-300">{topUpError}</p>
							</div>
						{/if}

						{#if !billingServiceUrl}
							<p class="text-xs text-amber-600 dark:text-amber-400">Billing service not configured. Contact your realm administrator.</p>
						{/if}
					</div>

				{:else}
					<!-- Crypto tab -->
					<div class="space-y-4">
						<div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
							<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Transfer Tokens to Purchase Credits</h3>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								You can purchase credits for this realm by transferring ckBTC, ckUSDC, or other supported tokens to the registry canister.
							</p>

							<div class="space-y-2">
								<div>
									<p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Realm Canister ID (credit account)</p>
									<div class="flex items-center gap-2 mt-1">
										<code class="text-sm font-mono bg-white dark:bg-gray-800 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 flex-1 overflow-x-auto">
											{realmCanisterId || 'Loading...'}
										</code>
										{#if realmCanisterId}
											<button
												onclick={() => navigator.clipboard.writeText(realmCanisterId)}
												class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
												title="Copy to clipboard"
											>
												<svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
												</svg>
											</button>
										{/if}
									</div>
								</div>

								{#if registryCanisterId}
									<div>
										<p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Registry Canister ID</p>
										<div class="flex items-center gap-2 mt-1">
											<code class="text-sm font-mono bg-white dark:bg-gray-800 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 flex-1 overflow-x-auto">
												{registryCanisterId}
											</code>
											<button
												onclick={() => navigator.clipboard.writeText(registryCanisterId)}
												class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
												title="Copy to clipboard"
											>
												<svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
												</svg>
											</button>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<div class="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
							<h4 class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">How it works</h4>
							<ol class="text-sm text-blue-700 dark:text-blue-300 space-y-1.5 list-decimal list-inside">
								<li>Transfer ckBTC or ckUSDC to the registry canister</li>
								<li>Include the realm canister ID in the transfer memo</li>
								<li>Credits will be allocated to the realm's account</li>
							</ol>
						</div>

						<div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
							<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CLI Alternative</h4>
							<p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
								Operators can also add credits via the Realms CLI:
							</p>
							<code class="block text-xs font-mono bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 overflow-x-auto">
								realms registry billing add-credits --principal {realmCanisterId || '<realm_canister_id>'} --amount 10
							</code>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Transaction History -->
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
			<div class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-5 py-3 flex items-center justify-between">
				<h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Transaction History</h2>
				{#if transactions.length > 0}
					<span class="text-xs text-gray-400 dark:text-gray-500">{transactions.length} transactions</span>
				{/if}
			</div>

			{#if transactionsLoading && transactions.length === 0}
				<div class="p-6 text-center">
					<svg class="w-5 h-5 animate-spin text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
					<p class="text-sm text-gray-400 dark:text-gray-500">Loading transactions...</p>
				</div>
			{:else if transactions.length === 0}
				<div class="p-6 text-center">
					<p class="text-sm text-gray-400 dark:text-gray-500">No transactions yet.</p>
				</div>
			{:else}
				<div class="divide-y divide-gray-100 dark:divide-gray-700">
					{#each transactions as tx}
						<div class="px-5 py-3 flex items-center justify-between">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full {tx.transaction_type === 'topup'
										? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
										: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}">
										{txTypeLabel(tx.transaction_type)}
									</span>
									<span class="text-sm text-gray-700 dark:text-gray-300 truncate">{tx.description || '—'}</span>
								</div>
								<p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(tx.timestamp)}</p>
							</div>
							<div class="text-right ml-4 flex-shrink-0">
								<p class="text-sm font-semibold {txTypeColor(tx.transaction_type)}">
									{tx.transaction_type === 'topup' ? '+' : '-'}{tx.amount}
								</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Realm Info Footer -->
		{#if realmCanisterId}
			<div class="text-center">
				<p class="text-xs text-gray-400 dark:text-gray-500">
					Realm canister: <span class="font-mono">{realmCanisterId}</span>
				</p>
			</div>
		{/if}
	{/if}
</div>
