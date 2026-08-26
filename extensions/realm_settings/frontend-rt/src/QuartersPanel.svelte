<script lang="ts">
	import { onMount } from 'svelte';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

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
		scale_requested_at: string;
		network: string;
		n: number;
		threshold: number;
		populations: number[];
		should_scale: boolean;
	}

	interface BootstrapStatus {
		status: string;
		cursor: number;
		total: number;
		done: string[];
		failed: { id: string; error: string }[];
		current: string | null;
	}

	type ProvisionPhase = 'calling' | 'waiting' | 'created' | 'stuck' | 'failed';

	interface ProvisionJob {
		phase: ProvisionPhase;
		message: string;
		canisterId?: string;
	}

	let loading = $state(true);
	let error = $state('');
	let quarters: Quarter[] = $state([]);
	let policy: ScaleStatus | null = $state(null);
	let bootstrap: BootstrapStatus | null = $state(null);
	let toggling = $state(false);
	let provisioning = $state(false);
	let requesting = $state(false);
	let provisionJob: ProvisionJob | null = $state(null);
	let bootstrapTimer: ReturnType<typeof setTimeout> | null = null;
	let pollTimer: ReturnType<typeof setTimeout> | null = null;
	let hangTimer: ReturnType<typeof setTimeout> | null = null;

	const bootstrapPct = $derived(
		bootstrap && bootstrap.total > 0
			? Math.min(100, Math.round((bootstrap.cursor / bootstrap.total) * 100))
			: 0,
	);
	// Active while the viewed quarter is still installing its codex/extensions.
	const bootstrapActive = $derived(
		!!bootstrap && (bootstrap.status === 'bootstrapping' || bootstrap.status === 'pending'),
	);

	const maxPopulation = $derived(
		policy && policy.populations.length ? Math.max(...policy.populations) : 0,
	);
	const fillPct = $derived(
		policy && policy.threshold > 0
			? Math.min(100, Math.round((maxPopulation / policy.threshold) * 100))
			: 0,
	);
	const isFederation = $derived(quarters.length > 1);

	const provisionBannerClass = $derived(
		!provisionJob
			? ''
			: provisionJob.phase === 'created'
				? 'border-green-200 bg-green-50/50'
				: provisionJob.phase === 'calling' || provisionJob.phase === 'waiting'
					? 'border-indigo-200 bg-indigo-50/50'
					: provisionJob.phase === 'stuck'
						? 'border-amber-200 bg-amber-50/50'
						: 'border-red-200 bg-red-50/50',
	);

	const provisionBannerTextClass = $derived(
		!provisionJob
			? ''
			: provisionJob.phase === 'created'
				? 'text-green-900'
				: provisionJob.phase === 'calling' || provisionJob.phase === 'waiting'
					? 'text-indigo-900'
					: provisionJob.phase === 'stuck'
						? 'text-amber-900'
						: 'text-red-800',
	);

	const provisionShowSpinner = $derived(
		provisionJob?.phase === 'calling' || provisionJob?.phase === 'waiting',
	);

	const provisionShowRetry = $derived(
		provisionJob?.phase === 'stuck' ||
			(provisionJob?.phase === 'failed' && !!policy?.scale_in_flight),
	);

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

	function clearProvisionTimers() {
		if (pollTimer) {
			clearTimeout(pollTimer);
			pollTimer = null;
		}
		if (hangTimer) {
			clearTimeout(hangTimer);
			hangTimer = null;
		}
	}

	function quartersContainsCanister(id: string): boolean {
		return quarters.some((q) => q.canister_id === id);
	}

	function findQuarterByCanister(id: string): Quarter | undefined {
		return quarters.find((q) => q.canister_id === id);
	}

	function findNewQuarter(beforeIds: Set<string>): Quarter | undefined {
		return quarters.find((q) => !beforeIds.has(q.canister_id));
	}

	function delay(ms: number): Promise<void> {
		return new Promise((resolve) => {
			pollTimer = setTimeout(() => {
				pollTimer = null;
				resolve();
			}, ms);
		});
	}

	async function pollUntilQuarterAppears(canisterId: string): Promise<boolean> {
		const POLL_INTERVAL = 2000;
		const POLL_TIMEOUT = 30000;
		const deadline = Date.now() + POLL_TIMEOUT;

		while (Date.now() < deadline) {
			await delay(POLL_INTERVAL);
			await load({ silent: true });
			if (quartersContainsCanister(canisterId)) return true;
		}

		return false;
	}

	async function pollUntilNewQuarter(beforeIds: Set<string>): Promise<Quarter | null> {
		const POLL_INTERVAL = 2000;
		const POLL_TIMEOUT = 30000;
		const deadline = Date.now() + POLL_TIMEOUT;

		await load({ silent: true });
		let newQ = findNewQuarter(beforeIds);
		if (newQ) return newQ;

		while (Date.now() < deadline) {
			await delay(POLL_INTERVAL);
			await load({ silent: true });
			newQ = findNewQuarter(beforeIds);
			if (newQ) return newQ;
		}

		return null;
	}

	function markProvisionCreated(canisterId: string) {
		const q = findQuarterByCanister(canisterId);
		provisionJob = {
			phase: 'created',
			message: q ? `Created — ${q.name} (${canisterId})` : `Created (${canisterId})`,
			canisterId,
		};
		notify(q ? `Provisioned quarter ${q.name}` : 'Provisioned new quarter');
	}

	async function load(options?: { silent?: boolean }) {
		const silent = options?.silent ?? false;
		if (!silent) {
			loading = true;
			error = '';
		}
		try {
			const [statusRaw, scaleRaw] = await Promise.all([
				ctx.backend.status(),
				ctx.backend.get_scale_status(),
				loadBootstrap(),
			]);
			if (statusRaw?.success && statusRaw?.data?.status) {
				quarters = (statusRaw.data.status.quarters || []) as Quarter[];
			}
			const scale = typeof scaleRaw === 'string' ? JSON.parse(scaleRaw) : scaleRaw;
			if (scale?.success) {
				policy = scale as ScaleStatus;
			} else if (!silent) {
				error = scale?.error || 'Failed to load scale status';
			}
			scheduleBootstrapPoll();
		} catch (e: any) {
			if (!silent) {
				error = e?.message || String(e);
			}
		} finally {
			if (!silent) {
				loading = false;
			}
		}
	}

	async function loadBootstrap() {
		// Self-bootstrap progress of the *currently viewed* realm/quarter. The
		// capital reports "none"; a freshly provisioned quarter (selected via the
		// top-bar switcher) reports its codex/extension install progress.
		if (typeof ctx.backend.get_bootstrap_status !== 'function') {
			bootstrap = null;
			return;
		}
		try {
			const raw = await ctx.backend.get_bootstrap_status();
			const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
			bootstrap = res?.success && res.status && res.status !== 'none' ? (res as BootstrapStatus) : null;
		} catch {
			bootstrap = null;
		}
	}

	function scheduleBootstrapPoll() {
		if (bootstrapTimer) clearTimeout(bootstrapTimer);
		bootstrapTimer = null;
		if (!bootstrapActive) return;
		bootstrapTimer = setTimeout(async () => {
			await loadBootstrap();
			scheduleBootstrapPoll();
		}, 5000);
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

	async function requestScale() {
		requesting = true;
		try {
			const raw = await ctx.backend.extension_sync_call(
				'realm_settings',
				'request_quarter_scale',
				'{}',
			);
			const res = parseExtResponse(raw);
			if (res?.success) {
				notify('Scale requested — provision the queued quarter when ready');
				await load();
			} else {
				notify(res?.error || 'Failed to request scale', 'error');
			}
		} catch (e: any) {
			notify(e?.message || String(e), 'error');
		} finally {
			requesting = false;
		}
	}

	async function provisionNow() {
		provisioning = true;
		clearProvisionTimers();

		const beforeIds = new Set(quarters.map((q) => q.canister_id));

		provisionJob = {
			phase: 'calling',
			message: 'Provisioning quarter…',
		};

		hangTimer = setTimeout(() => {
			if (provisionJob?.phase === 'calling') {
				provisionJob = {
					phase: 'stuck',
					message: 'Still waiting — you can retry or Refresh.',
					canisterId: provisionJob.canisterId,
				};
			}
		}, 20000);

		try {
			const raw = await ctx.backend.process_quarter_scaling();
			const res = typeof raw === 'string' ? JSON.parse(raw) : raw;

			if (res?.success && res.status === 'provisioned') {
				let canisterId: string | undefined = res.canister_id;

				if (!canisterId) {
					await load({ silent: true });
					canisterId = findNewQuarter(beforeIds)?.canister_id;
				}

				provisionJob = {
					phase: 'waiting',
					message: 'Waiting for quarter to appear…',
					canisterId,
				};

				if (canisterId) {
					await load({ silent: true });
					if (quartersContainsCanister(canisterId)) {
						markProvisionCreated(canisterId);
					} else {
						const found = await pollUntilQuarterAppears(canisterId);
						if (found) {
							markProvisionCreated(canisterId);
						} else {
							provisionJob = {
								phase: 'stuck',
								message: 'Still waiting — you can retry or Refresh.',
								canisterId,
							};
						}
					}
				} else {
					const newQ = await pollUntilNewQuarter(beforeIds);
					if (newQ) {
						markProvisionCreated(newQ.canister_id);
					} else {
						provisionJob = {
							phase: 'stuck',
							message: 'Still waiting — you can retry or Refresh.',
						};
					}
				}
			} else if (res?.success && res.status === 'idle') {
				provisionJob = {
					phase: 'failed',
					message: 'Nothing queued',
				};
			} else if (res?.success) {
				provisionJob = {
					phase: 'failed',
					message: res.error || `Unexpected status: ${res.status}`,
				};
			} else {
				provisionJob = {
					phase: 'failed',
					message: res?.error || 'Provisioning failed',
				};
			}
		} catch (e: any) {
			provisionJob = {
				phase: 'failed',
				message: e?.message || String(e),
			};
		} finally {
			if (hangTimer) {
				clearTimeout(hangTimer);
				hangTimer = null;
			}
			provisioning = false;
		}
	}

	onMount(() => {
		load();
		return () => {
			if (bootstrapTimer) clearTimeout(bootstrapTimer);
			clearProvisionTimers();
		};
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
	{:else if error}
		<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
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

				<div class="flex flex-col sm:flex-row sm:ml-auto items-stretch sm:items-center gap-2">
					{#if !policy.scale_in_flight}
						<button
							onclick={requestScale}
							disabled={requesting}
							title={policy.should_scale ? 'Queue a new quarter (threshold reached)' : 'Force a new quarter even though the threshold is not reached'}
							class={cn(
								'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed',
								policy.should_scale
									? 'bg-orange-600 text-white hover:bg-orange-700'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
							)}
						>
							{#if requesting}
								<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
							{/if}
							Request scale now
						</button>
					{/if}
					<button
						onclick={provisionNow}
						disabled={provisioning || !policy.scale_in_flight}
						title={policy.scale_in_flight ? 'Provision the queued quarter now' : 'No scale request pending'}
						class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
					>
						{#if provisioning}
							<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
						{/if}
						Provision queued quarter
					</button>
				</div>
			</div>
		{/if}

		<!-- Quarter self-bootstrap progress (for the currently viewed quarter) -->
		{#if bootstrap}
			<div class="mb-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
				<div class="flex items-center justify-between mb-2">
					<h3 class="text-sm font-semibold text-indigo-900">
						Quarter bootstrap
						<span class="ml-1 text-xs font-normal text-indigo-500">
							{bootstrapActive ? 'installing…' : bootstrap.status}
						</span>
					</h3>
					<span class="text-xs text-indigo-700">{bootstrap.cursor} / {bootstrap.total}</span>
				</div>
				<div class="h-2 rounded-full bg-indigo-100 overflow-hidden mb-2">
					<div
						class={cn(
							'h-full rounded-full transition-all',
							bootstrap.failed.length ? 'bg-amber-500' : bootstrapActive ? 'bg-indigo-500' : 'bg-green-500',
						)}
						style="width: {bootstrapPct}%"
					></div>
				</div>
				<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-700">
					{#if bootstrap.current}
						<span>Installing: <span class="font-mono">{bootstrap.current}</span></span>
					{/if}
					<span>{bootstrap.done.length} installed</span>
					{#if bootstrap.failed.length}
						<span class="text-amber-700">{bootstrap.failed.length} failed</span>
					{/if}
					{#if bootstrapActive}
						<span class="ml-auto inline-flex items-center gap-1 text-indigo-500">
							<span class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
							auto-refreshing
						</span>
					{/if}
				</div>
				{#if bootstrap.failed.length}
					<ul class="mt-2 space-y-0.5 text-xs text-amber-800">
						{#each bootstrap.failed as f (f.id)}
							<li><span class="font-mono">{f.id}</span>: {f.error}</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}

		<!-- Provision job status -->
		{#if provisionJob}
			<div class={cn('mb-4 rounded-lg border p-4', provisionBannerClass)}>
				<div class="flex flex-wrap items-center gap-3">
					{#if provisionShowSpinner}
						<span class="inline-flex items-center gap-2 text-sm font-medium {provisionBannerTextClass}">
							<span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
							{provisionJob.message}
						</span>
					{:else}
						<span class="text-sm font-medium {provisionBannerTextClass}">{provisionJob.message}</span>
					{/if}
					{#if provisionShowRetry}
						<button
							onclick={provisionNow}
							disabled={provisioning}
							class="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-current hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed {provisionBannerTextClass}"
						>
							{#if provisioning}
								<span class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
							{/if}
							Retry
						</button>
					{/if}
				</div>
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
						<article
							class={cn(
								'py-3',
								q.is_capital && 'bg-blue-50/40',
								provisionJob?.canisterId === q.canister_id &&
									'bg-green-50',
							)}
						>
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
								<tr
									class={cn(
										q.is_capital && 'bg-blue-50/40',
										provisionJob?.canisterId === q.canister_id &&
											'bg-green-50 ring-2 ring-green-300 ring-inset',
									)}
								>
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
