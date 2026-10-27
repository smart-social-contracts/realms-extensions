<script lang="ts">
	import { onMount } from 'svelte';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';
	import { opCaller, proposalOf, refusalText, refusedPermission } from './ops';

	let { ctx, addToast }: { ctx: any; addToast?: (msg: string, type?: 'success' | 'error') => void } = $props();

	let narrow = $state(isNarrowViewport());
	$effect(() => subscribeNarrowViewport((value) => { narrow = value; }));

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
		network: string;
		n: number;
		threshold: number;
		populations: number[];
		should_scale: boolean;
	}

	const call = opCaller(ctx);

	let loading = $state(true);
	let quarters: Quarter[] = $state([]);
	let policy = $state<ScaleStatus | null>(null);
	let toggling = $state(false);

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

	function count(value: unknown): number {
		const n = Number(value);
		return Number.isFinite(n) ? n : 0;
	}

	async function load() {
		loading = true;
		const [directory, scale, info] = await Promise.all([
			call(false, 'quarter_directory'),
			call(false, 'scale_status'),
			call(false, 'realm_info'),
		]);
		if (directory.ok && Array.isArray(directory.quarters)) {
			quarters = directory.quarters.map((q: any) => ({
				name: String(q?.name || q?.id || ''),
				canister_id: String(q?.id ?? ''),
				population: count(q?.population),
				status: String(q?.status ?? ''),
				index: count(q?.index),
				is_capital: q?.capital === true,
			}));
		} else if (directory.ok === false && refusedPermission(directory) === null) {
			console.warn('quarter_directory:', directory.error);
		}
		if (scale.ok) {
			const pops = scale.populations && typeof scale.populations === 'object' ? Object.values(scale.populations) : [];
			policy = {
				auto_scale_enabled: scale.enabled === true,
				scale_in_flight: scale.in_flight === true,
				network: String(info.ok ? info.realm?.network ?? '' : ''),
				n: count(scale.capacity),
				threshold: count(scale.scale_at),
				populations: pops.map(count),
				should_scale: scale.wanted === true,
			};
		} else {
			policy = null;
			if (refusedPermission(scale) === null) console.warn('scale_status:', scale.error);
		}
		loading = false;
	}

	async function toggleAutoScale(event: Event) {
		if (!policy) return;
		const box = event.currentTarget as HTMLInputElement;
		const next = !policy.auto_scale_enabled;
		toggling = true;
		const res = await call(true, 'quarter_configure', { auto_scale_enabled: next });
		const proposal = proposalOf(res);
		if (proposal) {
			box.checked = !next;
			notify(`Submitted as proposal ${proposal}`);
		} else if (res.ok) {
			policy = { ...policy, auto_scale_enabled: next };
			notify(`Auto-scaling ${next ? 'enabled' : 'disabled'}`);
		} else {
			box.checked = !next;
			notify(refusalText(res, 'Auto-scaling was not changed'), 'error');
		}
		toggling = false;
	}

	onMount(() => {
		load();
	});
</script>

<div class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
	<div class="flex flex-col gap-2 mb-1">
		<h2 class="text-lg font-semibold text-gray-900">Quarters & Auto-Scaling</h2>
		<button
			type="button"
			onclick={() => load()}
			class="self-start p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:text-gray-400"
			disabled={loading}
			title="Refresh"
			aria-label="Refresh"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
		</button>
	</div>
	<p class="text-sm text-gray-500 mb-5">
		Horizontal scaling across quarters. New users are sharded into a fresh quarter once the
		fullest quarter reaches the threshold below.
	</p>

	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full"></div>
		</div>
	{:else}
		<!-- Scale policy -->
		{#if policy}
			{#if narrow}
				<div class="grid grid-cols-2 mb-4 border-y border-gray-200">
					<div class="px-3 py-2 border-b border-r border-gray-200">
						<div class="text-xs text-gray-500">Capacity (N)</div>
						<div class="text-lg font-bold text-gray-900">{policy.n.toLocaleString()}</div>
						<div class="text-[11px] text-gray-400">network: {policy.network || 'ic'}</div>
					</div>
					<div class="px-3 py-2 border-b border-gray-200">
						<div class="text-xs text-gray-500">Scale threshold (90%)</div>
						<div class="text-lg font-bold text-gray-900">{policy.threshold.toLocaleString()}</div>
					</div>
					<div class="px-3 py-2 border-r border-gray-200">
						<div class="text-xs text-gray-500">Fullest quarter</div>
						<div class="text-lg font-bold text-gray-900">{maxPopulation.toLocaleString()}</div>
					</div>
					<div class="px-3 py-2">
						<div class="text-xs text-gray-500">Status</div>
						<div class={cn('text-sm font-bold', policy.scale_in_flight ? 'text-amber-600' : policy.should_scale ? 'text-orange-600' : 'text-green-600')}>
							{policy.scale_in_flight ? 'Scaling queued' : policy.should_scale ? 'Threshold reached' : 'Healthy'}
						</div>
					</div>
				</div>
			{:else}
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
			{/if}

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
			<div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 py-3 border-t border-gray-100">
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
				<p class="sm:ml-auto text-xs text-gray-500">
					New quarters are provisioned by the platform once a scale is queued.
				</p>
			</div>
		{/if}

		<!-- Roster -->
		<div class="mt-4">
			<h3 class="text-sm font-semibold text-gray-700 mb-2">
				Quarters {#if isFederation}<span class="text-gray-400 font-normal">({quarters.length})</span>{/if}
			</h3>
			{#if quarters.length === 0}
				<p class="text-sm text-gray-500">No quarter data available.</p>
			{:else if narrow}
				<div class="divide-y divide-gray-200 border-y border-gray-200">
					{#each quarters as q (q.canister_id)}
						<article class={cn('py-3', q.is_capital && 'bg-blue-50/40')}>
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0">
									<div class="font-medium text-gray-900">
										{q.name}{#if q.is_capital}<span class="ml-1 text-[10px] uppercase tracking-wide text-blue-600">capital</span>{/if}
									</div>
									<div class="mt-0.5 font-mono text-xs text-gray-500 break-all">{q.canister_id}</div>
								</div>
								<span class="shrink-0 text-xs text-gray-500">#{q.index ?? 0}</span>
							</div>
							<div class="mt-1 flex items-center justify-between text-xs text-gray-600">
								<span>{q.population.toLocaleString()} members</span>
								<span>{q.status}</span>
							</div>
						</article>
					{/each}
				</div>
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
