<script lang="ts">
	import { onMount } from 'svelte';

	let { ctx, addToast }: { ctx: any; addToast?: (msg: string, type?: 'success' | 'error') => void } = $props();

	const cn = $derived(
		ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' ')),
	);

	interface Quarter {
		name: string;
		canister_id: string;
		population: number;
		status: string;
		index?: number;
		is_capital?: boolean;
	}

	interface ScaleStatus {
		auto_scale_enabled: boolean;
		scale_in_flight: boolean;
		scale_requested_at: string;
		network: string;
		n: number;
		threshold: number;
		populations: number[];
		should_scale: boolean;
	}

	let loading = $state(true);
	let error = $state('');
	let quarters: Quarter[] = $state([]);
	let policy: ScaleStatus | null = $state(null);
	let toggling = $state(false);
	let provisioning = $state(false);

	const maxPopulation = $derived(
		policy && policy.populations.length ? Math.max(...policy.populations) : 0,
	);
	const fillPct = $derived(
		policy && policy.threshold > 0
			? Math.min(100, Math.round((maxPopulation / policy.threshold) * 100))
			: 0,
	);
	const isFederation = $derived(quarters.length > 1);

	function notify(msg: string, type: 'success' | 'error' = 'success') {
		if (addToast) addToast(msg, type);
	}

	function parseExtResponse(raw: any) {
		const env = typeof raw === 'string' ? JSON.parse(raw) : raw;
		return env?.response
			? typeof env.response === 'string'
				? JSON.parse(env.response)
				: env.response
			: env;
	}

	async function load() {
		loading = true;
		error = '';
		try {
			const [statusRaw, scaleRaw] = await Promise.all([
				ctx.backend.status(),
				ctx.backend.get_scale_status(),
			]);
			if (statusRaw?.success && statusRaw?.data?.status) {
				quarters = (statusRaw.data.status.quarters || []) as Quarter[];
			}
			const scale = typeof scaleRaw === 'string' ? JSON.parse(scaleRaw) : scaleRaw;
			if (scale?.success) {
				policy = scale as ScaleStatus;
			} else {
				error = scale?.error || 'Failed to load scale status';
			}
		} catch (e: any) {
			error = e?.message || String(e);
		} finally {
			loading = false;
		}
	}

	async function toggleAutoScale() {
		if (!policy) return;
		const next = !policy.auto_scale_enabled;
		toggling = true;
		try {
			const raw = await ctx.backend.extension_sync_call(
				'realm_settings',
				'set_quarter_policy',
				JSON.stringify({ auto_scale_enabled: next }),
			);
			const res = parseExtResponse(raw);
			if (res?.success) {
				policy = { ...policy, auto_scale_enabled: next };
				notify(`Auto-scaling ${next ? 'enabled' : 'disabled'}`);
			} else {
				notify(res?.error || 'Failed to update policy', 'error');
			}
		} catch (e: any) {
			notify(e?.message || String(e), 'error');
		} finally {
			toggling = false;
		}
	}

	async function provisionNow() {
		provisioning = true;
		try {
			const raw = await ctx.backend.process_quarter_scaling();
			const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (res?.success) {
				const status = res.status || 'done';
				notify(
					status === 'provisioned'
						? `Provisioned quarter #${res.index} (${res.canister_id})`
						: `Scale status: ${status}`,
				);
				await load();
			} else {
				notify(res?.error || 'Provisioning failed', 'error');
			}
		} catch (e: any) {
			notify(e?.message || String(e), 'error');
		} finally {
			provisioning = false;
		}
	}

	onMount(load);
</script>

<div class="bg-white shadow-sm rounded-lg p-6 mb-6">
	<div class="flex items-start justify-between gap-3 mb-1">
		<h2 class="text-lg font-semibold text-gray-900">Quarters & Auto-Scaling</h2>
		<button
			onclick={load}
			class="text-sm text-blue-600 hover:underline disabled:text-gray-400"
			disabled={loading}
		>Refresh</button>
	</div>
	<p class="text-sm text-gray-500 mb-5">
		Horizontal scaling across quarters. New users are sharded into a fresh quarter once the
		fullest quarter reaches the threshold below.
	</p>

	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full"></div>
		</div>
	{:else if error}
		<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
	{:else}
		<!-- Scale policy -->
		{#if policy}
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
				<div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
					<div class="text-xs text-gray-500 mb-1">Capacity (N)</div>
					<div class="text-lg font-bold text-gray-900">{policy.n.toLocaleString()}</div>
					<div class="text-[11px] text-gray-400">network: {policy.network || 'ic'}</div>
				</div>
				<div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
					<div class="text-xs text-gray-500 mb-1">Scale threshold (90%)</div>
					<div class="text-lg font-bold text-gray-900">{policy.threshold.toLocaleString()}</div>
				</div>
				<div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
					<div class="text-xs text-gray-500 mb-1">Fullest quarter</div>
					<div class="text-lg font-bold text-gray-900">{maxPopulation.toLocaleString()}</div>
				</div>
				<div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
					<div class="text-xs text-gray-500 mb-1">Status</div>
					<div class={cn('text-sm font-bold', policy.scale_in_flight ? 'text-amber-600' : policy.should_scale ? 'text-orange-600' : 'text-green-600')}>
						{policy.scale_in_flight ? 'Scaling queued' : policy.should_scale ? 'Threshold reached' : 'Healthy'}
					</div>
				</div>
			</div>

			<!-- Progress toward threshold -->
			<div class="mb-4">
				<div class="flex justify-between text-xs text-gray-500 mb-1">
					<span>Load toward next shard</span>
					<span>{maxPopulation.toLocaleString()} / {policy.threshold.toLocaleString()}</span>
				</div>
				<div class="h-2 rounded-full bg-gray-200 overflow-hidden">
					<div
						class={cn('h-full rounded-full transition-all', fillPct >= 90 ? 'bg-orange-500' : 'bg-blue-500')}
						style="width: {fillPct}%"
					></div>
				</div>
			</div>

			<!-- Controls -->
			<div class="flex flex-wrap items-center gap-4 py-3 border-t border-gray-100">
				<label class="relative inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						class="sr-only peer"
						checked={policy.auto_scale_enabled}
						disabled={toggling}
						onchange={toggleAutoScale}
					/>
					<div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
					<span class="ml-3 text-sm font-medium text-gray-700">Auto-scaling {policy.auto_scale_enabled ? 'enabled' : 'disabled'}</span>
				</label>

				<button
					onclick={provisionNow}
					disabled={provisioning || !policy.scale_in_flight}
					title={policy.scale_in_flight ? 'Provision the queued quarter now' : 'No scale request pending'}
					class="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
				>
					{#if provisioning}
						<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
					{/if}
					Provision queued quarter
				</button>
			</div>
		{/if}

		<!-- Roster -->
		<div class="mt-4">
			<h3 class="text-sm font-semibold text-gray-700 mb-2">
				Quarters {#if isFederation}<span class="text-gray-400 font-normal">({quarters.length})</span>{/if}
			</h3>
			{#if quarters.length === 0}
				<p class="text-sm text-gray-500">No quarter data available.</p>
			{:else}
				<div class="overflow-x-auto rounded-lg border border-gray-200">
					<table class="min-w-full text-sm">
						<thead class="bg-gray-50 text-gray-500">
							<tr>
								<th class="text-left font-medium px-3 py-2">#</th>
								<th class="text-left font-medium px-3 py-2">Name</th>
								<th class="text-left font-medium px-3 py-2">Canister</th>
								<th class="text-right font-medium px-3 py-2">Population</th>
								<th class="text-left font-medium px-3 py-2">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each quarters as q (q.canister_id)}
								<tr class={cn(q.is_capital && 'bg-blue-50/40')}>
									<td class="px-3 py-2 text-gray-700">{q.index ?? 0}</td>
									<td class="px-3 py-2 font-medium text-gray-900">
										{q.name}{#if q.is_capital}<span class="ml-1 text-[10px] uppercase tracking-wide text-blue-600">capital</span>{/if}
									</td>
									<td class="px-3 py-2 font-mono text-xs text-gray-500">{q.canister_id}</td>
									<td class="px-3 py-2 text-right text-gray-700">{q.population.toLocaleString()}</td>
									<td class="px-3 py-2 text-gray-600">{q.status}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
			{#if !isFederation}
				<p class="mt-2 text-xs text-gray-500">
					Single realm — no sub-quarters yet. New members are assigned here until a quarter is provisioned.
				</p>
			{:else}
				<p class="mt-2 text-xs text-gray-500">
					Tip: use the quarter selector in the top bar to inspect a specific quarter. Manage the
					federation from the Capital.
				</p>
			{/if}
		</div>
	{/if}
</div>
