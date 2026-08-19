<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import Sankey from './Sankey.svelte';
	import Timeline from './Timeline.svelte';

	let { ctx }: { ctx: any } = $props();

	const cn = $derived(
		ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' ')),
	);

	interface Toast {
		id: number;
		type: 'success' | 'error';
		text: string;
	}

	let toasts: Toast[] = $state([]);
	let toastCounter = 0;

	function addToast(message: string, type: 'success' | 'error' = 'success') {
		const id = ++toastCounter;
		toasts = [...toasts, { id, text: message, type }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 4000);
	}

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	// --- Vote confirmation (same flow as access_manager) ---
	let voteConfirm: {
		summary: string;
		governedBy: string;
		governedPolicy: string;
		policyReason: string;
		run: () => Promise<void>;
	} | null = $state(null);
	let voteConfirmBusy = $state(false);

	async function callGated(
		fn: string,
		params: Record<string, unknown>,
		handle: (res: any) => void | Promise<void>,
	) {
		const res = await callExt(fn, params);
		if (res?.success && res.data?.requires_confirmation) {
			voteConfirm = {
				summary: res.data.summary || '',
				governedBy: res.data.governed_by || '',
				governedPolicy: res.data.governed_policy || res.data.policy || '',
				policyReason: res.data.policy_reason || '',
				run: async () => {
					voteConfirmBusy = true;
					try {
						const confirmed = await callExt(fn, { ...params, confirm: true });
						await handle(confirmed);
						voteConfirm = null;
					} catch (e: any) {
						addToast(e?.message || 'Error', 'error');
					} finally {
						voteConfirmBusy = false;
					}
				},
			};
			return;
		}
		await handle(res);
	}

	// --- Data ---
	let overview: any = $state.raw(null);
	let flows: any = $state.raw(null);
	let status: any = $state.raw(null);
	let budgets: any = $state.raw(null);
	let timeline: any = $state.raw(null);
	let timelineLoading = $state(false);
	let loading = $state(true);
	let periodLoading = $state(false);
	let selectedPeriod = $state('');

	type Tab = 'flow' | 'timeline' | 'allocation' | 'budgets' | 'settings';
	let activeTab: Tab = $state('flow');

	const decimals = $derived(overview?.decimals ?? 8);
	const currency = $derived(overview?.currency ?? '');

	function fmt(raw: number): string {
		const v = (raw ?? 0) / 10 ** decimals;
		const s = v.toLocaleString(undefined, { maximumFractionDigits: 4 });
		return `${s} ${currency}`;
	}

	async function loadOverview() {
		const res = await callExt('get_treasury_overview');
		if (!res?.success) {
			addToast(res?.error || 'Failed to load treasury overview', 'error');
			return;
		}
		overview = res.data;
		if (!selectedPeriod) selectedPeriod = res.data.current_period || '';
		syncSettingsDraft();
	}

	async function loadPeriod() {
		if (!selectedPeriod) return;
		periodLoading = true;
		try {
			const [flowRes, statusRes, budgetRes] = await Promise.all([
				callExt('get_allocation_flows', { period: selectedPeriod }),
				callExt('get_allocation_status', { period: selectedPeriod }),
				callExt('get_budgets', { period: selectedPeriod }),
			]);
			flows = flowRes?.success ? flowRes.data : null;
			status = statusRes?.success ? statusRes.data : null;
			budgets = budgetRes?.success ? budgetRes.data : null;
			if (!flowRes?.success) addToast(flowRes?.error || 'Failed to load flows', 'error');
		} finally {
			periodLoading = false;
		}
	}

	async function loadTimeline() {
		timelineLoading = true;
		try {
			const res = await callExt('get_epoch_timeline', { before: 24, after: 24 });
			if (res?.success) timeline = res.data;
			else addToast(res?.error || 'Failed to load timeline', 'error');
		} finally {
			timelineLoading = false;
		}
	}

	async function loadAll() {
		loading = true;
		try {
			await Promise.all([loadOverview(), loadTimeline()]);
			await loadPeriod();
			resetRuleDraft();
		} finally {
			loading = false;
		}
	}

	void loadAll();

	function selectPeriod(id: string) {
		selectedPeriod = id;
		void loadPeriod();
	}

	async function onTimelineSelect(id: string) {
		selectPeriod(id);
	}

	// --- Allocation rule editor ---
	interface RuleRow {
		fund: string;
		percent: string;
	}
	let ruleRows: RuleRow[] = $state([]);
	let ruleBusy = $state(false);
	let allocateBusy = $state(false);

	const ruleTotal = $derived(ruleRows.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0));

	const targetFunds = $derived(
		(overview?.funds ?? []).filter((f: any) => f.code !== overview?.source_fund),
	);

	function resetRuleDraft() {
		const current = overview?.rule?.rules ?? [];
		ruleRows = current.map((r: any) => ({
			fund: r.fund,
			percent: String((r.percent_bp ?? 0) / 100),
		}));
		if (ruleRows.length === 0) ruleRows = [{ fund: '', percent: '' }];
	}

	function addRuleRow() {
		ruleRows = [...ruleRows, { fund: '', percent: '' }];
	}

	function removeRuleRow(i: number) {
		ruleRows = ruleRows.filter((_, idx) => idx !== i);
	}

	async function saveRule() {
		const rules = ruleRows
			.filter((r) => r.fund && parseFloat(r.percent) > 0)
			.map((r) => ({ fund: r.fund, percent_bp: Math.round(parseFloat(r.percent) * 100) }));
		if (rules.length === 0) {
			addToast('Add at least one fund with a percentage', 'error');
			return;
		}
		if (ruleTotal > 100) {
			addToast('Percentages exceed 100%', 'error');
			return;
		}
		ruleBusy = true;
		try {
			await callGated('set_allocation_rule', { rules }, async (res) => {
				if (!res?.success) {
					addToast(res?.error || 'Failed to save rule', 'error');
					return;
				}
				if (res.data?.applied === 'proposal') {
					addToast(`Proposal ${res.data.proposal_id} created — a vote is required`);
				} else {
					addToast('Allocation rule adopted');
					await loadAll();
				}
			});
		} finally {
			ruleBusy = false;
		}
	}

	async function allocateNow() {
		allocateBusy = true;
		try {
			await callGated('run_allocation', { period: selectedPeriod }, async (res) => {
				if (!res?.success) {
					addToast(res?.error || 'Allocation failed', 'error');
					return;
				}
				if (res.data?.applied === 'proposal') {
					addToast(`Proposal ${res.data.proposal_id} created — a vote is required`);
				} else if (res.data?.allocated_now === 0) {
					addToast(res.data?.message || 'Nothing left to allocate');
				} else {
					addToast(`Allocated ${fmt(res.data.allocated_now)} across ${res.data.allocations?.length ?? 0} fund(s)`);
					await loadPeriod();
				}
			});
		} finally {
			allocateBusy = false;
		}
	}

	// --- Settings ---
	let testMode = $state(false);
	ctx.realmInfo?.subscribe?.((info: { testMode?: boolean }) => {
		testMode = !!info?.testMode;
	});

	let epochDraft = $state('monthly');
	let anchorDraft = $state('1');
	let epochMinutesDraft = $state('60');
	let autoAllocateDraft = $state(true);
	let epochBusy = $state(false);
	let scheduleBusy = $state(false);

	function syncSettingsDraft() {
		if (!overview) return;
		epochDraft = overview.epoch_length || 'monthly';
		anchorDraft = String(overview.anchor_month || 1);
		epochMinutesDraft = String(overview.epoch_minutes || 60);
		autoAllocateDraft = !!overview.auto_allocate;
	}

	async function saveEpoch() {
		epochBusy = true;
		try {
			const params: Record<string, unknown> = {
				epoch_length: epochDraft,
				anchor_month: parseInt(anchorDraft) || 1,
			};
			if (epochDraft === 'minutes') {
				params.epoch_minutes = parseInt(epochMinutesDraft) || 0;
			}
			await callGated(
				'set_epoch_config',
				params,
				async (res) => {
					if (!res?.success) {
						addToast(res?.error || 'Failed to change epoch', 'error');
						return;
					}
					if (res.data?.applied === 'proposal') {
						addToast(`Proposal ${res.data.proposal_id} created — a vote is required`);
					} else {
						const label =
							epochDraft === 'minutes'
								? `${epochMinutesDraft} minutes`
								: epochDraft;
						addToast(`Epoch length set to ${label}`);
						await loadAll();
					}
				},
			);
		} finally {
			epochBusy = false;
		}
	}

	async function setSchedule(enabled: boolean) {
		scheduleBusy = true;
		try {
			await callGated(
				'set_treasury_schedule',
				enabled ? { enabled: true, auto_allocate: autoAllocateDraft } : { enabled: false },
				async (res) => {
					if (!res?.success) {
						addToast(res?.error || 'Failed to change schedule', 'error');
						return;
					}
					if (res.data?.applied === 'proposal') {
						addToast(`Proposal ${res.data.proposal_id} created — a vote is required`);
					} else {
						addToast(enabled ? 'Treasury schedule enabled' : 'Treasury schedule disabled');
						await loadOverview();
					}
				},
			);
		} finally {
			scheduleBusy = false;
		}
	}

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'flow', label: 'Flow' },
		{ id: 'timeline', label: 'Timeline' },
		{ id: 'allocation', label: 'Allocation' },
		{ id: 'budgets', label: 'Budgets' },
		{ id: 'settings', label: 'Settings' },
	];
</script>

<div class="p-6 max-w-6xl mx-auto">
	<!-- Header -->
	<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
		<div>
			<h1 class="text-xl font-semibold text-gray-900">Budget management</h1>
			<p class="text-sm text-gray-500">{extensionDescription}</p>
		</div>
		<div class="flex items-center gap-2">
			{#if overview}
				<span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
					epoch: {overview.epoch_length}
				</span>
				<span
					class={cn(
						'px-2 py-1 text-xs rounded-full',
						overview.schedule_active
							? 'bg-green-50 text-green-700'
							: 'bg-gray-100 text-gray-500',
					)}
				>
					{overview.schedule_active ? 'automatic' : 'manual'}
				</span>
			{/if}
			<select
				value={selectedPeriod}
				onchange={(e) => selectPeriod((e.target as HTMLSelectElement).value)}
				class="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-gray-400"
			>
				{#each [...(overview?.periods ?? [])].reverse() as p (p.id)}
					<option value={p.id}>{p.id}{p.status === 'open' ? ' (open)' : ''}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
		</div>
	{:else}
		<!-- Summary cards -->
		{#if status}
			<div class="grid grid-cols-3 gap-3 mb-4">
				<div class="p-3 bg-white border border-gray-200 rounded-xl">
					<div class="text-xs text-gray-500">Recognized revenue</div>
					<div class="text-lg font-semibold text-gray-900">{fmt(status.pool)}</div>
				</div>
				<div class="p-3 bg-white border border-gray-200 rounded-xl">
					<div class="text-xs text-gray-500">Allocated</div>
					<div class="text-lg font-semibold text-emerald-700">{fmt(status.allocated)}</div>
				</div>
				<div class="p-3 bg-white border border-gray-200 rounded-xl">
					<div class="text-xs text-gray-500">Unallocated reserve</div>
					<div class="text-lg font-semibold text-amber-700">{fmt(status.unallocated)}</div>
				</div>
			</div>
		{/if}

		<!-- Tabs -->
		<div class="flex gap-1 mb-4 border-b border-gray-200">
			{#each tabs as tab (tab.id)}
				<button
					onclick={() => (activeTab = tab.id)}
					class={cn(
						'px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors',
						activeTab === tab.id
							? 'border-gray-900 text-gray-900'
							: 'border-transparent text-gray-500 hover:text-gray-700',
					)}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		{#if periodLoading && activeTab !== 'timeline'}
			<div class="flex items-center justify-center py-12">
				<div class="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
			</div>
		{:else if activeTab === 'timeline'}
			<div class="p-4 bg-white border border-gray-200 rounded-xl">
				{#if timelineLoading && !timeline}
					<div class="flex items-center justify-center py-12">
						<div class="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
					</div>
				{:else if timeline}
					<Timeline
						epochs={timeline.epochs ?? []}
						nowTs={timeline.now_ts ?? 0}
						selected={selectedPeriod}
						format={fmt}
						onselect={onTimelineSelect}
					/>
					{#if selectedPeriod && status}
						<div class="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-sm">
							<div>
								<div class="text-xs text-gray-500">Selected · {selectedPeriod}</div>
								<div class="font-medium text-gray-900">{fmt(status.pool)}</div>
								<div class="text-xs text-gray-400">recognized</div>
							</div>
							<div>
								<div class="text-xs text-gray-500">Allocated</div>
								<div class="font-medium text-emerald-700">{fmt(status.allocated)}</div>
							</div>
							<div>
								<div class="text-xs text-gray-500">Reserve</div>
								<div class="font-medium text-amber-700">{fmt(status.unallocated)}</div>
							</div>
						</div>
					{/if}
				{:else}
					<div class="py-12 text-center text-sm text-gray-400">No timeline data</div>
				{/if}
			</div>
		{:else if activeTab === 'flow'}
			<div class="p-4 bg-white border border-gray-200 rounded-xl">
				{#if flows}
					<Sankey nodes={flows.nodes} links={flows.links} format={fmt} />
				{:else}
					<div class="py-12 text-center text-sm text-gray-400">No flow data</div>
				{/if}
			</div>
		{:else if activeTab === 'allocation'}
			<div class="grid md:grid-cols-2 gap-4">
				<!-- Revenue mix -->
				<div class="p-4 bg-white border border-gray-200 rounded-xl">
					<h2 class="text-sm font-semibold text-gray-700 mb-3">
						Revenue this epoch — {overview?.source_fund}
					</h2>
					{#if status && Object.keys(status.revenue_by_category ?? {}).length > 0}
						<ul class="divide-y divide-gray-100">
							{#each Object.entries(status.revenue_by_category) as [category, amount] (category)}
								<li class="flex justify-between py-2 text-sm">
									<span class="text-gray-600 capitalize">{category.replace(/_/g, ' ')}</span>
									<span class="font-medium text-gray-900">{fmt(amount as number)}</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-sm text-gray-400 py-4">No revenue recognized in this epoch yet.</p>
					{/if}
					<button
						onclick={allocateNow}
						disabled={allocateBusy || !overview?.rule}
						class="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
					>
						{#if allocateBusy}
							<div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						{/if}
						Allocate now
					</button>
					{#if !overview?.rule}
						<p class="mt-2 text-xs text-amber-600">Adopt an allocation rule first.</p>
					{/if}
				</div>

				<!-- Rule editor -->
				<div class="p-4 bg-white border border-gray-200 rounded-xl">
					<div class="flex items-center justify-between mb-3">
						<h2 class="text-sm font-semibold text-gray-700">Allocation rule</h2>
						{#if overview?.rule}
							<span class="text-xs text-gray-400">{overview.rule.id}</span>
						{/if}
					</div>
					<div class="space-y-2">
						{#each ruleRows as row, i (i)}
							<div class="flex items-center gap-2">
								<select
									bind:value={row.fund}
									class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
								>
									<option value="">— fund —</option>
									{#each targetFunds as f (f.code)}
										<option value={f.code}>
											{f.code}{f.department ? ` (${f.department})` : ''}
										</option>
									{/each}
								</select>
								<input
									type="number"
									min="0"
									max="100"
									step="0.01"
									bind:value={row.percent}
									placeholder="%"
									class="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
								/>
								<button
									onclick={() => removeRuleRow(i)}
									class="p-1.5 text-gray-400 hover:text-red-500"
									aria-label="Remove line"
								>
									&times;
								</button>
							</div>
						{/each}
					</div>
					<div class="flex items-center justify-between mt-3">
						<button onclick={addRuleRow} class="text-xs text-gray-600 hover:text-gray-900">
							+ Add fund
						</button>
						<span
							class={cn(
								'text-xs font-medium',
								ruleTotal > 100 ? 'text-red-600' : 'text-gray-600',
							)}
						>
							total {ruleTotal.toFixed(2)}% — reserve {(100 - ruleTotal).toFixed(2)}%
						</span>
					</div>
					<div class="flex gap-2 mt-4">
						<button
							onclick={saveRule}
							disabled={ruleBusy || ruleTotal > 100}
							class="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
						>
							{#if ruleBusy}
								<div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							{/if}
							Adopt rule
						</button>
						<button
							onclick={resetRuleDraft}
							class="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
						>
							Reset
						</button>
					</div>
					<p class="mt-2 text-xs text-gray-400">
						Governed by {overview?.governed_by} ({overview?.governed_policy}) — changes may
						require a vote.
					</p>
				</div>
			</div>
		{:else if activeTab === 'budgets'}
			<div class="p-4 bg-white border border-gray-200 rounded-xl">
				<h2 class="text-sm font-semibold text-gray-700 mb-3">
					Planned vs actual — {selectedPeriod}
				</h2>
				{#if (budgets?.budgets ?? []).length > 0}
					<table class="w-full text-sm">
						<thead>
							<tr class="text-left text-xs text-gray-500 border-b border-gray-200">
								<th class="py-2 pr-3">Fund</th>
								<th class="py-2 pr-3">Category</th>
								<th class="py-2 pr-3 text-right">Planned</th>
								<th class="py-2 pr-3 text-right">Actual</th>
								<th class="py-2 text-right">Variance</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each budgets.budgets as b (b.id)}
								<tr>
									<td class="py-2 pr-3 font-medium text-gray-900">{b.fund}</td>
									<td class="py-2 pr-3 text-gray-600 capitalize">{b.category.replace(/_/g, ' ')}</td>
									<td class="py-2 pr-3 text-right text-gray-700">{fmt(b.planned)}</td>
									<td class="py-2 pr-3 text-right text-gray-700">{fmt(b.actual)}</td>
									<td
										class={cn(
											'py-2 text-right font-medium',
											b.variance >= 0 ? 'text-emerald-700' : 'text-red-600',
										)}
									>
										{b.variance >= 0 ? '+' : ''}{fmt(b.variance)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p class="text-sm text-gray-400 py-4">No budgets recorded for this epoch.</p>
				{/if}
			</div>
		{:else if activeTab === 'settings'}
			<div class="grid md:grid-cols-2 gap-4">
				<!-- Epoch config -->
				<div class="p-4 bg-white border border-gray-200 rounded-xl">
					<h2 class="text-sm font-semibold text-gray-700 mb-3">Calendar epochs</h2>
					<label class="block text-xs text-gray-500 mb-1" for="epoch-length">Epoch length</label>
					<select
						id="epoch-length"
						bind:value={epochDraft}
						class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white mb-3"
					>
						<option value="weekly">Weekly</option>
						<option value="biweekly">Bi-weekly</option>
						<option value="monthly">Monthly</option>
						<option value="quarterly">Quarterly</option>
						<option value="semiannual">Semiannual</option>
						<option value="annual">Annual</option>
						{#if testMode || overview?.test_mode}
							<option value="minutes">Custom (minutes, test mode)</option>
						{/if}
					</select>
					{#if epochDraft === 'minutes'}
						<label class="block text-xs text-gray-500 mb-1" for="epoch-minutes">
							Epoch length in minutes
						</label>
						<input
							id="epoch-minutes"
							type="number"
							min="1"
							max="10080"
							bind:value={epochMinutesDraft}
							class="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded-lg mb-3"
						/>
					{/if}
					{#if epochDraft === 'annual'}
						<label class="block text-xs text-gray-500 mb-1" for="anchor-month">
							Fiscal year starts in month
						</label>
						<input
							id="anchor-month"
							type="number"
							min="1"
							max="12"
							bind:value={anchorDraft}
							class="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-lg mb-3"
						/>
					{/if}
					<button
						onclick={saveEpoch}
						disabled={epochBusy}
						class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
					>
						{#if epochBusy}
							<div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						{/if}
						Apply epoch config
					</button>
					<p class="mt-2 text-xs text-gray-400">
						{#if epochDraft === 'minutes'}
							Minute-based epochs roll automatically and are only available while test mode is
							active.
						{:else}
							Epochs stay calendar-aligned; a length change takes effect when the current epoch
							ends.
						{/if}
					</p>
				</div>

				<!-- Schedule -->
				<div class="p-4 bg-white border border-gray-200 rounded-xl">
					<h2 class="text-sm font-semibold text-gray-700 mb-3">Automatic treasury</h2>
					<div class="flex items-center justify-between py-2">
						<div class="text-sm text-gray-600">
							Daily sweep of unmatched deposits
							{#if overview?.schedule_active}
								<span class="ml-2 px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full">on</span>
							{:else}
								<span class="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">off</span>
							{/if}
						</div>
					</div>
					<label class="flex items-center gap-2 py-2 text-sm text-gray-600">
						<input type="checkbox" bind:checked={autoAllocateDraft} class="rounded border-gray-300" />
						Also allocate automatically when an epoch closes
					</label>
					<button
						onclick={() => setSchedule(!overview?.schedule_active)}
						disabled={scheduleBusy}
						class={cn(
							'mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg disabled:opacity-50',
							overview?.schedule_active
								? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
								: 'bg-gray-900 text-white hover:bg-gray-800',
						)}
					>
						{#if scheduleBusy}
							<div
								class={cn(
									'w-3 h-3 border-2 border-t-transparent rounded-full animate-spin',
									overview?.schedule_active ? 'border-gray-400' : 'border-white',
								)}
							></div>
						{/if}
						{overview?.schedule_active ? 'Disable' : 'Enable'}
					</button>
					<p class="mt-2 text-xs text-gray-400">
						Governed by {overview?.governed_by} ({overview?.governed_policy}). Disabling is
						always immediate.
					</p>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Vote confirmation modal -->
	{#if voteConfirm}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
			<div class="w-full max-w-md bg-white rounded-xl shadow-xl p-5">
				<h3 class="text-base font-semibold text-gray-900 mb-1">A vote is required</h3>
				<p class="text-sm text-gray-600 mb-3">{voteConfirm.summary}</p>
				<div class="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 mb-4">
					<p class="mb-1">
						<span class="font-medium text-gray-700">Governed by:</span>
						{voteConfirm.governedBy} ({voteConfirm.governedPolicy})
					</p>
					<p>{voteConfirm.policyReason}</p>
				</div>
				<div class="flex gap-2 justify-end">
					<button
						onclick={() => (voteConfirm = null)}
						disabled={voteConfirmBusy}
						class="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						onclick={() => voteConfirm?.run()}
						disabled={voteConfirmBusy}
						class="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
					>
						{#if voteConfirmBusy}
							<div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						{/if}
						Create proposal
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Toasts -->
	<div class="fixed bottom-4 right-4 z-50 space-y-2">
		{#each toasts as toast (toast.id)}
			<div
				class={cn(
					'px-4 py-2.5 rounded-lg shadow-lg text-sm text-white',
					toast.type === 'success' ? 'bg-gray-900' : 'bg-red-600',
				)}
			>
				{toast.text}
			</div>
		{/each}
	</div>
</div>
