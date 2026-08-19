<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';

	let { ctx }: { ctx: any } = $props();

	let data: any = $state(null);
	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');

	interface RealmInfo {
		id: string;
		name: string;
		url: string;
		backend_url: string;
		logo: string;
		users_count: number;
		created_at: number;
		frontend_canister_id: string;
		is_self: boolean;
	}

	async function fetchRealms() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const syncResponse: any = await ctx.callSync('get_mundus_realms');
			data = syncResponse?.data ?? syncResponse;
			if (data?.registries?.length > 0) {
				try {
					const asyncResponse: any = await ctx.callAsync('fetch_realms_from_registry');
					const liveData = asyncResponse?.data ?? asyncResponse;
					if (liveData?.realms?.length > 0) {
						data = { ...data, realms: liveData.realms, errors: liveData.errors };
					}
				} catch {}
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

	$effect(() => {
		fetchRealms();
	});

	function realmUrl(realm: RealmInfo): string {
		if (realm.url) return realm.url;
		if (realm.frontend_canister_id) return `https://${realm.frontend_canister_id}.icp0.io`;
		return '';
	}

	function realmLogoUrl(realm: RealmInfo): string {
		if (!realm.logo) return '';
		if (realm.logo.startsWith('http')) return realm.logo;
		const base = realmUrl(realm);
		if (base) return `${base}/custom/${realm.logo}`;
		return '';
	}

	function formatDate(ts: number): string {
		if (!ts) return '';
		return new Date(ts * 1000).toLocaleDateString();
	}

	function otherRealms(realms: RealmInfo[]): RealmInfo[] {
		return (realms || []).filter((r) => !r.is_self);
	}
</script>

<div class="p-6 max-w-4xl mx-auto">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Realms Network</h1>
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{extensionDescription}</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-3 text-gray-500">Loading realms network...</span>
		</div>
	{:else if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error}
		<div class="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
			<p class="text-sm text-red-700 dark:text-red-300">{error}</p>
			<button
				class="mt-2 text-sm text-red-600 underline hover:no-underline"
				onclick={fetchRealms}
			>
				Retry
			</button>
		</div>
	{:else if data}
		{#if data.local_realm}
			<div class="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
						<svg class="w-5 h-5 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<p class="font-semibold text-blue-900 dark:text-blue-100">
							{data.local_realm.name}
						</p>
						<p class="text-xs text-blue-600 dark:text-blue-300">
							This realm &middot; {data.local_realm.status} &middot; {data.local_realm.network || 'unknown'} network
						</p>
					</div>
				</div>
			</div>
		{/if}

		<div class="mb-4 flex items-center justify-between">
			<p class="text-sm text-gray-500 dark:text-gray-400">
				{otherRealms(data.realms).length} other realm{otherRealms(data.realms).length !== 1 ? 's' : ''} in mundus
				{#if data.registries?.length > 0}
					with registry <span class="font-mono text-[11px]">{data.registries[0].principal_id}</span>
				{/if}
			</p>
			<button
				class="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
				onclick={fetchRealms}
			>
				Refresh
			</button>
		</div>

		{#if otherRealms(data.realms).length > 0}
			<div class="grid gap-4">
				{#each otherRealms(data.realms) as realm (realm.id)}
					<div class="relative rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 transition-shadow hover:shadow-md">
						<div class="flex items-start gap-4">
							<div class="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
								{#if realmLogoUrl(realm)}
									<img src={realmLogoUrl(realm)} alt="" class="w-full h-full object-cover" />
								{:else}
									<svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
									</svg>
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
										{realm.name || realm.id}
									</h3>
								</div>
								<div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
									{#if realm.users_count}
										<span class="flex items-center gap-1">
											<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
											</svg>
											{realm.users_count.toLocaleString()} users
										</span>
									{/if}
									{#if realm.created_at}
										<span>Since {formatDate(realm.created_at)}</span>
									{/if}
									{#if realm.id}
										<span class="font-mono text-[10px] opacity-60 truncate max-w-[140px]">{realm.id}</span>
									{/if}
								</div>
							</div>
							{#if realmUrl(realm)}
								<a
									href={realmUrl(realm)}
									target="_blank"
									rel="noopener"
									class="flex-shrink-0 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
								>
									Visit
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
									</svg>
								</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-12">
				<svg class="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
				</svg>
				<p class="mt-3 text-gray-500 dark:text-gray-400">No other realms found in this mundus</p>
			</div>
		{/if}

		{#if data.errors && data.errors.length > 0}
			<div class="mt-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 border border-yellow-200 dark:border-yellow-800">
				<p class="text-xs font-medium text-yellow-700 dark:text-yellow-300">
					Some registries could not be reached:
				</p>
				{#each data.errors as err}
					<p class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{err}</p>
				{/each}
			</div>
		{/if}
	{/if}
</div>
