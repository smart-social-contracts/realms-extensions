<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';

	let { ctx }: { ctx: any } = $props();

	let data: any = $state(null);
	let loading = $state(true);
	let error = $state('');

	async function fetchRealms() {
		loading = true;
		error = '';
		try {
			const info = await ctx.read('realm_info');
			if (!info.ok) {
				error = info.error;
				return;
			}
			data = { local_realm: info.realm };
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		fetchRealms();
	});
</script>

<div class="w-full py-6">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Realms Network</h1>
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{extensionDescription}</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-3 text-gray-500">Loading realms network...</span>
		</div>
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
				Listing the other realms of the network is not supported by this realm version.
			</p>
			<button
				class="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
				onclick={fetchRealms}
			>
				Refresh
			</button>
		</div>
	{/if}
</div>
