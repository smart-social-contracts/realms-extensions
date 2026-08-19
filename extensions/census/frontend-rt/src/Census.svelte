<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import InvitationManager from './InvitationManager.svelte';

	let { ctx }: { ctx: any } = $props();

	const cn = ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' '));

	let userCount: number | null = $state(null);
	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');

	async function loadUserCount() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const result = await ctx.callSync('get_user_count');
			if (result?.success) {
				userCount = result.data?.user_count ?? 0;
			} else {
				error = result?.error || 'Failed to load user count';
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
		loadUserCount();
	});
</script>

<div class="w-full px-4 max-w-none">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Census</h1>
			<p class="text-gray-600 mt-1">{extensionDescription}</p>
		</div>
		<button
			onclick={loadUserCount}
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

	<!-- User count stat -->
	<div class="mb-6">
		<div class="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
			<div class="flex items-center gap-4">
				<div class="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
					<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
				</div>
				<div>
					<div class="text-xs text-gray-500 uppercase tracking-wide font-medium">Registered Users</div>
					{#if loading}
						<div class="flex items-center gap-2 mt-1">
							<div class="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
							<span class="text-sm text-gray-400">Loading…</span>
						</div>
					{:else}
						<div class="text-3xl font-bold text-gray-900 mt-1">{userCount ?? 0}</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Invitations section -->
	<InvitationManager {ctx} />
</div>
