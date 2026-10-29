<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';

	let { ctx }: { ctx: any } = $props();

	const UNSUPPORTED = 'Not supported by this realm version';
	const billingServiceUrl = 'https://billing.realmsgos.dev';

	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');

	let realmCanisterId = $state('');
	let currentVersion = $state('');

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
			const res = await ctx.read('status');
			if (!res.ok) throw new Error(res.error);
			currentVersion = res.version;
			realmCanisterId = res.canister;
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

	$effect(() => {
		loadAll();
	});
</script>

<div class="w-full py-6 space-y-6">
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
	{#if loading && !currentVersion}
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
				<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">{UNSUPPORTED}</p>
			</div>
			<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
				<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Realm Credits</p>
				<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">{UNSUPPORTED}</p>
			</div>
		</div>

		<!-- Upgrade Action -->
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
			<div class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
				<h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Realm Upgrade</h2>
			</div>
			<div class="p-5">
				<p class="text-sm text-gray-500 dark:text-gray-400">
					Checking for and requesting upgrades is not supported by this realm version.
				</p>
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
			</div>

			<div class="p-6 text-center">
				<p class="text-sm text-gray-400 dark:text-gray-500">{UNSUPPORTED}.</p>
			</div>
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
