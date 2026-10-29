<script lang="ts">
	import { onDestroy } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';
	import Sankey from './Sankey.svelte';
	import Timeline from './Timeline.svelte';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	let { ctx }: { ctx: any } = $props();

	const cn = $derived(
		ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' ')),
	);

	function addToast(message: string, type: 'success' | 'error' = 'success') {
		const level = type === 'error' ? 'error' : 'success';
		if (typeof ctx.notify === 'function') {
			ctx.notify(level, message);
			return;
		}
		console.warn('[extension]', level, message);
	}

	async function read(name: string, args: Record<string, unknown> = {}) {
		const res = await ctx.read(name, args);
		if (!res.ok) throw new Error(res.error);
		return res;
	}

	async function pages(name: string, args: Record<string, unknown>, key: string): Promise<any[]> {
		const out: any[] = [];
		let from: number | null = 1;
		while (from) {
			const res = await read(name, { ...args, from, count: 500 });
			out.push(...res[key]);
			from = res.next;
		}
		return out;
	}

	const rows = (entity: string) => pages('realm_export', { entity }, 'rows');

	interface Governor {
		name: string;
		policy: string;
		direct: boolean;
	}

	async function governor(department: string): Promise<Governor> {
		const p = (await read('department_get', { department })).department.policy ?? {};
		const m = p.m ?? 1;
		const n = p.n ?? 1;
		const quorum = p.quorum_percent ?? 0;
		const veto = p.veto ?? [];
		const extras = [quorum ? `quorum ${quorum}%` : '', veto.length ? 'veto' : ''].filter(Boolean);
		return {
			name: department,
			policy: extras.length ? `${m}/${n} (${extras.join(', ')})` : `${m}/${n}`,
			direct: m <= 1 && n <= 1 && !quorum && !veto.length,
		};
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

	/** Run ``act`` at once under a direct policy; otherwise only once the user confirms that it opens a vote. */
	async function governed(gov: Governor, summary: string, act: () => Promise<void>) {
		if (gov.direct) {
			await act();
			return;
		}
		voteConfirm = {
			summary,
			governedBy: gov.name,
			governedPolicy: gov.policy,
			policyReason: `Treasury actions are governed by ${gov.name}'s policy (${gov.policy}); a vote is required before this change can apply.`,
			run: async () => {
				voteConfirmBusy = true;
				try {
					await act();
					voteConfirm = null;
				} catch (e: any) {
					addToast(e?.message || 'Error', 'error');
				} finally {
					voteConfirmBusy = false;
				}
			},
		};
	}

	/** The reply of a governed operation: false after an error or when it opened a vote instead of applying. */
	function applied(res: any, failure: string, later = ''): boolean {
		if (!res.ok) {
			addToast(res.error || failure, 'error');
			return false;
		}
		if (res.requires_vote) {
			addToast(`Proposal ${res.proposal} created — a vote is required${later}`);
			return false;
		}
		return true;
	}

	// --- Data ---
	let overview: any = $state.raw(null);
	let flows: any = $state.raw(null);
	let status: any = $state.raw(null);
	let budgets: any = $state.raw(null);
	let timeline: any = $state.raw(null);
	let loading = $state(true);
	let selectedPeriod = $state('');
	let entries: any[] = [];
	let budgetRows: any[] = [];

	type Tab = 'flow' | 'timeline' | 'allocation' | 'budgets' | 'settings';
	let activeTab: Tab = $state('flow');

	const decimals = $derived(overview?.decimals ?? 8);
	const currency = $derived(overview?.currency ?? '');

	function fmt(raw: number): string {
		const v = (raw ?? 0) / 10 ** decimals;
		const s = v.toLocaleString(undefined, { maximumFractionDigits: 4 });
		return `${s} ${currency}`;
	}

	function isoDate(ts: number): string {
		return new Date(ts * 1000).toISOString().slice(0, 10);
	}

	async function loadOverview() {
		const [treasury, info, funds, periods, rules, departments] = await Promise.all([
			read('treasury_view', { count: 1 }),
			read('realm_info'),
			rows('Fund'),
			rows('FiscalPeriod'),
			rows('AllocationRule'),
			pages('department_list', {}, 'departments'),
		]);
		const config = treasury.config;
		const source = funds.find((f) => f.id === config.source_fund);
		const root = departments.find((d) => d.is_root).id;
		const [ruleGovernor, settingsGovernor] = await Promise.all([
			governor(source?.department || root),
			governor(root),
		]);
		const symbol = info.realm.accounting_currency || treasury.tokens[0]?.id || '';
		[entries, budgetRows] = await Promise.all([
			pages('ledger_view', { symbol }, 'entries'),
			rows('Budget'),
		]);
		const now = Date.now() / 1000;
		periods.sort((a, b) => a.starts_at - b.starts_at);
		const current = periods.find((p) => p.starts_at <= now && now < p.ends_at) ?? periods.at(-1);
		const rule = rules.find((r) => r.id === source?.allocation_rule);
		overview = {
			currency: symbol,
			decimals: treasury.tokens.find((t: any) => t.id === symbol)?.decimals ?? 8,
			source_fund: config.source_fund,
			epoch_length: config.epoch,
			anchor_month: config.anchor_month,
			test_mode: info.realm.test_mode,
			current_period: current?.id ?? '',
			periods,
			rule: rule
				? {
						id: rule.id,
						rules: Object.entries(rule.rules).map(([fund, percent]) => ({
							fund,
							percent_bp: (percent as number) * 100,
						})),
					}
				: null,
			drafts: rules.filter((r) => r.status === 'draft' && r.source_fund === config.source_fund),
			funds: funds
				.map((f) => ({ code: f.id, name: f.name, department: f.department }))
				.sort((a, b) => a.code.localeCompare(b.code)),
			schedule_active: !!config.auto_allocate,
			ruleGovernor,
			settingsGovernor,
		};
		if (!selectedPeriod) selectedPeriod = overview.current_period;
		syncSettingsDraft();
	}

	function sum(values: Record<string, number>): number {
		return Object.values(values).reduce((s, v) => s + v, 0);
	}

	/** Revenue booked on the source fund in ``period``, and what payments into it allocated to other funds. */
	function periodStatus(period: string) {
		const source = overview.source_fund;
		const booked = entries.filter((e) => e.period === period);
		const payments = new Set(
			booked.filter((e) => e.kind === 'revenue' && e.fund === source).map((e) => e.transaction),
		);
		const revenue_by_category: Record<string, number> = {};
		const allocations_by_fund: Record<string, number> = {};
		for (const e of booked) {
			if (e.kind === 'revenue' && e.fund === source) {
				revenue_by_category[e.category] = (revenue_by_category[e.category] ?? 0) + e.credit - e.debit;
			} else if (e.kind === 'asset' && e.fund !== source && e.debit && payments.has(e.transaction)) {
				allocations_by_fund[e.fund] = (allocations_by_fund[e.fund] ?? 0) + e.debit;
			}
		}
		const pool = sum(revenue_by_category);
		const allocated = sum(allocations_by_fund);
		return { pool, allocated, unallocated: pool - allocated, revenue_by_category, allocations_by_fund, booked };
	}

	/** Sankey read model: revenue mix → pool → funds → spending. */
	function periodFlows(s: ReturnType<typeof periodStatus>) {
		const nodes: any[] = [];
		const links: any[] = [];
		for (const [category, amount] of Object.entries(s.revenue_by_category).sort()) {
			if (amount <= 0) continue;
			nodes.push({ id: `rev:${category}`, label: category.replace(/_/g, ' '), column: 0, value: amount });
			links.push({ source: `rev:${category}`, target: 'pool', value: amount });
		}
		nodes.push({ id: 'pool', label: `${overview.source_fund} pool`, column: 1, value: s.pool });
		for (const [code, amount] of Object.entries(s.allocations_by_fund).sort()) {
			const label = overview.funds.find((f: any) => f.code === code)?.name || code;
			nodes.push({ id: `fund:${code}`, label, column: 2, value: amount });
			links.push({ source: 'pool', target: `fund:${code}`, value: amount });
		}
		if (s.unallocated > 0) {
			nodes.push({ id: 'reserve', label: 'Unallocated reserve', column: 2, value: s.unallocated });
			links.push({ source: 'pool', target: 'reserve', value: s.unallocated });
		}
		const spent: Record<string, number> = {};
		for (const e of s.booked) {
			const net = e.debit - e.credit;
			if (e.kind !== 'expense' || !(e.fund in s.allocations_by_fund) || net <= 0) continue;
			spent[`exp:${e.category}`] = (spent[`exp:${e.category}`] ?? 0) + net;
			links.push({ source: `fund:${e.fund}`, target: `exp:${e.category}`, value: net });
		}
		for (const [key, total] of Object.entries(spent).sort()) {
			nodes.push({ id: key, label: key.slice(4).replace(/_/g, ' '), column: 3, value: total });
		}
		return { nodes, links };
	}

	function loadPeriod() {
		if (!selectedPeriod) return;
		status = periodStatus(selectedPeriod);
		flows = periodFlows(status);
		budgets = {
			budgets: budgetRows
				.filter((b) => b.period === selectedPeriod && (b.status === 'adopted' || b.status === 'closed'))
				.map((b) => ({ ...b, variance: b.actual - b.planned }))
				.sort((a, b) => a.fund.localeCompare(b.fund)),
		};
	}

	function loadTimeline() {
		const now = Date.now() / 1000;
		timeline = {
			now_ts: now,
			epochs: overview.periods.map((p: any) => ({
				id: p.id,
				start_date: isoDate(p.starts_at),
				end_date: isoDate(p.ends_at - 1),
				start_ts: p.starts_at,
				end_ts: p.ends_at,
				status: p.status === 'open' && p.starts_at > now ? 'future' : p.status,
				stored: true,
				is_current: p.starts_at <= now && now < p.ends_at,
				...periodStatus(p.id),
			})),
		};
	}

	async function loadAll() {
		loading = true;
		try {
			await loadOverview();
			loadTimeline();
			loadPeriod();
			resetRuleDraft();
		} catch (e: any) {
			addToast(e?.message || 'Failed to load treasury overview', 'error');
		} finally {
			loading = false;
		}
	}

	void loadAll();

	function selectPeriod(id: string) {
		selectedPeriod = id;
		loadPeriod();
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

	function sameRules(a: Record<string, number>, b: Record<string, number>): boolean {
		const keys = Object.keys(a);
		return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k]);
	}

	async function saveRule() {
		const lines = ruleRows.filter((r) => r.fund && parseFloat(r.percent) > 0);
		if (lines.length === 0) {
			addToast('Add at least one fund with a percentage', 'error');
			return;
		}
		if (ruleTotal > 100) {
			addToast('Percentages exceed 100%', 'error');
			return;
		}
		if (lines.some((r) => !Number.isInteger(parseFloat(r.percent)))) {
			addToast('Use whole percentages', 'error');
			return;
		}
		const rules = Object.fromEntries(lines.map((r) => [r.fund, parseInt(r.percent)]));
		const parts = lines.map((r) => `${r.fund}: ${parseInt(r.percent)}%`).join(', ');
		ruleBusy = true;
		try {
			await governed(overview.ruleGovernor, `Adopt treasury allocation rule (${parts})`, async () => {
				// Under a voting policy drafting is voted on too; the draft it leaves is adopted on the next save.
				let rule = overview.drafts.find((d: any) => sameRules(d.rules, rules))?.id;
				if (!rule) {
					const drafted = await ctx.run('allocation_rule_draft', {
						source_fund: overview.source_fund,
						rules,
					});
					if (!applied(drafted, 'Failed to save rule', '; adopt the rule again once it passes')) return;
					rule = drafted.rule;
				}
				if (applied(await ctx.run('allocation_rule_propose', { rule }), 'Failed to save rule')) {
					addToast('Allocation rule adopted');
					await loadAll();
				}
			});
		} finally {
			ruleBusy = false;
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
	let epochBusy = $state(false);
	let scheduleBusy = $state(false);

	function syncSettingsDraft() {
		if (!overview) return;
		epochDraft = overview.epoch_length || 'monthly';
		anchorDraft = String(overview.anchor_month || 1);
	}

	async function configure(config: Record<string, unknown>, summary: string, done: string) {
		await governed(overview.settingsGovernor, summary, async () => {
			if (applied(await ctx.run('treasury_configure', { config }), 'Failed to change the treasury settings')) {
				addToast(done);
				await loadAll();
			}
		});
	}

	async function saveEpoch() {
		if (epochDraft === 'minutes') {
			addToast('Minute-based epochs are not supported by this realm version', 'error');
			return;
		}
		epochBusy = true;
		try {
			await configure(
				{ epoch: epochDraft, anchor_month: parseInt(anchorDraft) || 1 },
				`Set treasury epoch length to ${epochDraft}`,
				`Epoch length set to ${epochDraft}`,
			);
		} finally {
			epochBusy = false;
		}
	}

	async function setSchedule(enabled: boolean) {
		scheduleBusy = true;
		try {
			await configure(
				{ auto_allocate: enabled },
				`${enabled ? 'Enable' : 'Disable'} automatic allocation`,
				enabled ? 'Automatic allocation enabled' : 'Automatic allocation disabled',
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

	let narrow = $state(isNarrowViewport());
	const unsubNarrow = subscribeNarrowViewport((value) => {
		narrow = value;
	});
	onDestroy(unsubNarrow);

	const panelClass = $derived(
		narrow
			? 'p-3 bg-white border-y border-gray-200'
			: 'p-4 bg-white border border-gray-200 rounded-xl',
	);
	const metricClass = $derived(
		narrow
			? 'p-3 bg-white border border-gray-200'
			: 'p-3 bg-white border border-gray-200 rounded-xl',
	);
</script>

<style>
	.chrome-tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
	}

	.chrome-tab.is-on {
		border-bottom-color: #111827;
		color: #111827;
	}

	@media (max-width: 720px) {
		.chrome-label {
			display: none;
		}

		.chrome-tab {
			width: 40px;
			justify-content: center;
			padding: 10px 0;
		}
	}
</style>

<div class={cn('w-full', narrow ? 'py-3' : 'py-6')}>
	<!-- Header: title on its own row -->
	<div class="flex flex-col gap-2 mb-4">
		<div>
			<h1 class="text-xl font-semibold text-gray-900">Budget management</h1>
			<p class="text-sm text-gray-500">{extensionDescription}</p>
		</div>
		<div class="flex items-center gap-2 min-w-0">
			{#if overview}
				{#if narrow}
					<span class="text-xs text-gray-500 shrink-0">
						{overview.epoch_length} · {overview.schedule_active ? 'automatic' : 'manual'}
					</span>
				{:else}
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
			{/if}
			<select
				value={selectedPeriod}
				onchange={(e) => selectPeriod((e.target as HTMLSelectElement).value)}
				class="min-w-0 flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-1 focus:ring-gray-400"
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
			<div class={cn('grid gap-3 mb-4', narrow ? 'grid-cols-1' : 'grid-cols-3')}>
				<div class={metricClass}>
					<div class="text-xs text-gray-500">Recognized revenue</div>
					<div class="text-lg font-semibold text-gray-900">{fmt(status.pool)}</div>
				</div>
				<div class={metricClass}>
					<div class="text-xs text-gray-500">Allocated</div>
					<div class="text-lg font-semibold text-emerald-700">{fmt(status.allocated)}</div>
				</div>
				<div class={metricClass}>
					<div class="text-xs text-gray-500">Unallocated reserve</div>
					<div class="text-lg font-semibold text-amber-700">{fmt(status.unallocated)}</div>
				</div>
			</div>
		{/if}

		<!-- Tabs: icon-only on a narrow viewport -->
		<div class="flex mb-4 border-b border-gray-200">
			{#each tabs as tab (tab.id)}
				<button
					type="button"
					onclick={() => (activeTab = tab.id)}
					class="chrome-tab {activeTab === tab.id ? 'is-on' : ''}"
					title={tab.label}
					aria-label={tab.label}
				>
					{#if tab.id === 'flow'}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h12m0 0l-4 4m4-4l-4-4" />
						</svg>
					{:else if tab.id === 'timeline'}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					{:else if tab.id === 'allocation'}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
						</svg>
					{:else if tab.id === 'budgets'}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					{/if}
					<span class="chrome-label">{tab.label}</span>
				</button>
			{/each}
		</div>

		{#if activeTab === 'timeline'}
			<div class={panelClass}>
				{#if timeline?.epochs.length}
					<Timeline
						epochs={timeline.epochs ?? []}
						nowTs={timeline.now_ts ?? 0}
						selected={selectedPeriod}
						format={fmt}
						onselect={onTimelineSelect}
					/>
					{#if selectedPeriod && status}
						<div class={cn('mt-4 pt-4 border-t border-gray-100 grid gap-3 text-sm', narrow ? 'grid-cols-1' : 'grid-cols-3')}>
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
			<div class={panelClass}>
				{#if flows}
					<Sankey nodes={flows.nodes} links={flows.links} format={fmt} />
				{:else}
					<div class="py-12 text-center text-sm text-gray-400">No flow data</div>
				{/if}
			</div>
		{:else if activeTab === 'allocation'}
			<div class={cn('grid gap-4', narrow ? 'grid-cols-1' : 'md:grid-cols-2')}>
				<!-- Revenue mix -->
				<div class={panelClass}>
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
						disabled
						class="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
					>
						Allocate now
					</button>
					<p class="mt-2 text-xs text-amber-600">
						Allocating on demand is not supported by this realm version: with automatic allocation on,
						each payment is split by the adopted rule when it arrives.
					</p>
				</div>

				<!-- Rule editor -->
				<div class={panelClass}>
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
						Governed by {overview?.ruleGovernor.name} ({overview?.ruleGovernor.policy}) — changes may
						require a vote.
					</p>
				</div>
			</div>
		{:else if activeTab === 'budgets'}
			<div class={panelClass}>
				<h2 class="text-sm font-semibold text-gray-700 mb-3">
					Planned vs actual — {selectedPeriod}
				</h2>
				{#if (budgets?.budgets ?? []).length > 0}
					{#if narrow}
						<div class="divide-y divide-gray-200">
							{#each budgets.budgets as b (b.id)}
								<article class="py-3">
									<div class="flex items-start justify-between gap-2">
										<div class="min-w-0">
											<div class="font-medium text-gray-900">{b.fund}</div>
											<div class="text-xs text-gray-500 capitalize">{b.category.replace(/_/g, ' ')}</div>
										</div>
										<div
											class={cn(
												'shrink-0 text-sm font-medium',
												b.variance >= 0 ? 'text-emerald-700' : 'text-red-600',
											)}
										>
											{b.variance >= 0 ? '+' : ''}{fmt(b.variance)}
										</div>
									</div>
									<div class="mt-1 text-xs text-gray-500">
										Planned {fmt(b.planned)} · Actual {fmt(b.actual)}
									</div>
								</article>
							{/each}
						</div>
					{:else}
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
					{/if}
				{:else}
					<p class="text-sm text-gray-400 py-4">No budgets recorded for this epoch.</p>
				{/if}
			</div>
		{:else if activeTab === 'settings'}
			<div class={cn('grid gap-4', narrow ? 'grid-cols-1' : 'md:grid-cols-2')}>
				<!-- Epoch config -->
				<div class={panelClass}>
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
				<div class={panelClass}>
					<h2 class="text-sm font-semibold text-gray-700 mb-3">Automatic treasury</h2>
					<div class="flex items-center justify-between py-2">
						<div class="text-sm text-gray-600">
							Daily sweep of unmatched deposits
							<span class="ml-2 text-xs text-gray-400">not supported by this realm version</span>
						</div>
					</div>
					<div class="flex items-center justify-between py-2">
						<div class="text-sm text-gray-600">
							Allocate each payment by the adopted rule
							{#if overview?.schedule_active}
								<span class={narrow ? 'ml-2 text-xs text-emerald-700' : 'ml-2 px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded-full'}>on</span>
							{:else}
								<span class={narrow ? 'ml-2 text-xs text-gray-500' : 'ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full'}>off</span>
							{/if}
						</div>
					</div>
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
						Governed by {overview?.settingsGovernor.name} ({overview?.settingsGovernor.policy}) — changes may
						require a vote.
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
</div>
