<script lang="ts">
	import { onDestroy } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	let { ctx }: { ctx: any } = $props();

	const cn = $derived(
		ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' ')),
	);

	function addToast(message: string, type: 'success' | 'error' = 'success') {
		if (typeof ctx.notify === 'function') {
			ctx.notify(type, message);
			return;
		}
		console.warn('[extension]', type, message);
	}

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	// --- Vote confirmation (same flow as budget_manager) ---
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

	// --- Labels ---
	const BASE_LABELS: Record<string, string> = {
		flat: 'Per member (flat)',
		land_area: 'Land parcels (area × value per unit)',
	};
	const METHOD_LABELS: Record<string, string> = {
		fixed: 'Fixed amount',
		proportional: 'Percentage of value',
		progressive: 'Progressive brackets',
	};
	const PERIOD_LABELS: Record<string, string> = {
		monthly: 'Monthly',
		quarterly: 'Quarterly',
		annual: 'Annual',
	};

	// --- Data ---
	let overview: any = $state.raw(null);
	let loading = $state(true);
	let busy = $state('');

	const currency = $derived(overview?.currency || '');
	const canManage = $derived(Boolean(overview?.can_manage));

	function fmt(n: number | null | undefined): string {
		const s = (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 6 });
		return currency ? `${s} ${currency}` : s;
	}

	function pct(bp: number | null | undefined): string {
		return `${((bp ?? 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
	}

	function describeTax(t: any): string {
		const per = t.base === 'land_area' ? 'per parcel' : 'per member';
		let how = '';
		if (t.method === 'fixed') how = `${fmt(t.amount)} ${per}`;
		else if (t.method === 'proportional') how = `${pct(t.rate_bp)} of the value`;
		else {
			const parts = (t.brackets ?? []).map((b: any) =>
				b.up_to == null ? `${pct(b.rate_bp)} above` : `${pct(b.rate_bp)} up to ${b.up_to.toLocaleString()}`,
			);
			how = parts.join(', ');
		}
		if (t.base === 'land_area') how += ` · value = area × ${t.unit_value}`;
		if (t.exempt_below) how += ` · exempt below ${Number(t.exempt_below).toLocaleString()}`;
		return `${how} · ${(PERIOD_LABELS[t.period] ?? t.period).toLowerCase()}`;
	}

	// --- Editor rows ---
	interface BracketRow {
		uid: number;
		upTo: number | null;
		rate: number | null;
	}
	interface TaxRow {
		uid: number;
		code: string;
		label: string;
		enabled: boolean;
		base: string;
		unitValue: number | null;
		method: string;
		amount: number | null;
		rate: number | null;
		brackets: BracketRow[];
		exemptBelow: number | null;
		appliesTo: string;
		exemptProfiles: string;
		period: string;
		dueDays: number | null;
	}

	let nextUid = 1;
	let rows: TaxRow[] = $state([]);
	let description = $state('');
	let expanded: number | null = $state(null);
	let baseline = $state('[]');

	function bracketFrom(b: any): BracketRow {
		return { uid: nextUid++, upTo: b.up_to ?? null, rate: (b.rate_bp ?? 0) / 100 };
	}

	function rowFrom(t: any): TaxRow {
		return {
			uid: nextUid++,
			code: t.code ?? '',
			label: t.label ?? '',
			enabled: t.enabled !== false,
			base: t.base ?? 'flat',
			unitValue: t.unit_value ?? 1,
			method: t.method ?? 'fixed',
			amount: t.amount ?? null,
			rate: t.rate_bp != null ? t.rate_bp / 100 : null,
			brackets: (t.brackets ?? []).map(bracketFrom),
			exemptBelow: t.exempt_below || null,
			appliesTo: (t.applies_to ?? ['member']).join(', '),
			exemptProfiles: (t.exempt_profiles ?? []).join(', '),
			period: t.period ?? 'annual',
			dueDays: t.due_days ?? 30,
		};
	}

	function names(s: string): string[] {
		return s
			.split(',')
			.map((x) => x.trim())
			.filter(Boolean);
	}

	function bp(rate: number | null): number {
		return Math.round((rate ?? 0) * 100);
	}

	function taxFrom(r: TaxRow): Record<string, unknown> {
		const t: Record<string, unknown> = {
			code: r.code.trim(),
			label: r.label.trim() || r.code.trim(),
			enabled: r.enabled,
			base: r.base,
			method: r.base === 'flat' ? 'fixed' : r.method,
			period: r.period,
			due_days: r.dueDays,
			applies_to: names(r.appliesTo),
			exempt_profiles: names(r.exemptProfiles),
		};
		if (r.exemptBelow) t.exempt_below = r.exemptBelow;
		if (r.base === 'land_area') t.unit_value = r.unitValue;
		if (t.method === 'fixed') t.amount = r.amount;
		else if (t.method === 'proportional') t.rate_bp = bp(r.rate);
		else
			t.brackets = r.brackets.map((b, i) => ({
				up_to: i === r.brackets.length - 1 ? null : b.upTo,
				rate_bp: bp(b.rate),
			}));
		return t;
	}

	const documentTaxes = $derived(rows.map(taxFrom));
	const dirty = $derived(JSON.stringify(documentTaxes) !== baseline);

	function resetEditor() {
		const source =
			overview?.draft?.taxes ?? overview?.adopted?.taxes ?? overview?.effective_taxes ?? [];
		rows = source.map(rowFrom);
		description = overview?.draft?.description ?? '';
		baseline = JSON.stringify(rows.map(taxFrom));
		expanded = null;
	}

	function addTax(base: 'flat' | 'land_area') {
		let n = rows.length + 1;
		while (rows.some((r) => r.code === `tax_${n}`)) n++;
		const row = rowFrom(
			base === 'flat'
				? { code: `tax_${n}`, label: 'Membership tax', base, method: 'fixed', amount: 10, period: 'monthly' }
				: {
						code: `tax_${n}`,
						label: 'Land tax',
						base,
						method: 'proportional',
						rate_bp: 100,
						unit_value: 1,
						period: 'annual',
					},
		);
		rows.push(row);
		expanded = row.uid;
	}

	function removeTax(uid: number) {
		rows = rows.filter((r) => r.uid !== uid);
	}

	function setMethod(r: TaxRow, method: string) {
		r.method = method;
		if (method === 'progressive' && r.brackets.length === 0) {
			r.brackets = [
				{ uid: nextUid++, upTo: 10000, rate: r.rate ?? 0.5 },
				{ uid: nextUid++, upTo: null, rate: (r.rate ?? 0.5) * 2 },
			];
		}
	}

	function addBracket(r: TaxRow) {
		const last = r.brackets[r.brackets.length - 1];
		const prevTop = r.brackets.length > 1 ? (r.brackets[r.brackets.length - 2].upTo ?? 0) : 0;
		if (last) last.upTo = prevTop ? prevTop * 2 : 10000;
		r.brackets.push({ uid: nextUid++, upTo: null, rate: last?.rate ?? 0 });
	}

	function removeBracket(r: TaxRow, uid: number) {
		r.brackets = r.brackets.filter((b) => b.uid !== uid);
	}

	// --- Loading ---
	async function load() {
		const res = await callExt('get_tax_overview');
		if (!res?.success) {
			addToast(res?.error || 'Failed to load the tax policy', 'error');
			return;
		}
		overview = res.data;
		resetEditor();
	}

	async function loadAll() {
		loading = true;
		try {
			await load();
		} finally {
			loading = false;
		}
	}

	void loadAll();

	// --- Actions ---
	async function saveDraft(quiet = false): Promise<boolean> {
		const res = await callExt('save_tax_draft', {
			document: { schema_version: 1, taxes: documentTaxes },
			description,
		});
		if (!res?.success) {
			addToast(res?.error || 'Could not save the draft', 'error');
			return false;
		}
		if (!quiet) addToast('Draft saved');
		await load();
		return true;
	}

	async function onSave() {
		busy = 'save';
		try {
			await saveDraft();
		} finally {
			busy = '';
		}
	}

	async function onDiscard() {
		busy = 'discard';
		try {
			const res = await callExt('discard_tax_draft');
			if (!res?.success) addToast(res?.error || 'Could not discard the draft', 'error');
			else addToast('Draft discarded');
			await load();
		} finally {
			busy = '';
		}
	}

	async function onAdopt() {
		busy = 'adopt';
		try {
			if ((dirty || !overview?.draft) && !(await saveDraft(true))) return;
			await callGated('adopt_tax_policy', {}, async (res) => {
				if (!res?.success) {
					addToast(res?.error || 'Could not adopt the tax policy', 'error');
					return;
				}
				if (res.data?.applied === 'proposal') {
					addToast(`Proposal ${res.data.proposal_id} created — a vote is required`);
				} else {
					addToast('Tax policy adopted');
				}
				await load();
			});
		} finally {
			busy = '';
		}
	}

	// --- Assessment ---
	interface Assessment {
		batches: number;
		created: number;
		already: number;
		nothingDue: number;
		notEligible: number;
		total: number;
		done: boolean;
		error: string;
	}
	let assessment: Assessment | null = $state.raw(null);
	let confirmAssess = $state(false);
	const MAX_BATCHES = 2000;

	async function runAssessment() {
		confirmAssess = false;
		busy = 'assess';
		const acc: Assessment = {
			batches: 0,
			created: 0,
			already: 0,
			nothingDue: 0,
			notEligible: 0,
			total: 0,
			done: false,
			error: '',
		};
		let cursor = '';
		try {
			while (acc.batches < MAX_BATCHES) {
				const res = await callExt('run_tax_assessment', { cursor });
				if (!res?.success) {
					acc.error = res?.error || 'The assessment failed';
					break;
				}
				const d = res.data ?? {};
				acc.batches += 1;
				acc.created += d.invoices_created ?? 0;
				acc.already += d.already_invoiced ?? 0;
				acc.nothingDue += d.nothing_due ?? 0;
				acc.notEligible += d.not_eligible ?? 0;
				acc.total += d.total_amount ?? 0;
				assessment = { ...acc };
				cursor = d.next_cursor || '';
				if (!cursor) {
					acc.done = true;
					break;
				}
			}
		} finally {
			assessment = { ...acc };
			busy = '';
		}
		if (acc.error) addToast(acc.error, 'error');
		else if (acc.done) addToast(`${acc.created} invoice(s) issued`);
	}

	// --- Preview ---
	let previewUid: number | null = $state(null);
	let previewQuantity: number | null = $state(1000);
	let preview: any = $state.raw(null);

	const previewRow = $derived(rows.find((r) => r.uid === previewUid) ?? rows[0] ?? null);

	async function runPreview() {
		if (!previewRow) return;
		busy = 'preview';
		try {
			const res = await callExt('preview_tax', {
				tax: taxFrom(previewRow),
				quantity: previewRow.base === 'flat' ? 1 : previewQuantity,
			});
			if (!res?.success) {
				addToast(res?.error || 'Preview failed', 'error');
				preview = null;
				return;
			}
			preview = res.data;
		} finally {
			busy = '';
		}
	}

	// --- History ---
	let historyRows: any[] = $state.raw([]);
	let historyNext: number | null = $state(1);
	let historyLoaded = $state(false);

	async function loadHistory(reset = false) {
		const cursor = reset ? 1 : historyNext;
		if (cursor == null) return;
		busy = 'history';
		try {
			const res = await callExt('get_tax_history', { cursor, count: 20 });
			if (!res?.success) {
				addToast(res?.error || 'Failed to load history', 'error');
				return;
			}
			historyRows = reset ? res.data.rows : [...historyRows, ...res.data.rows];
			historyNext = res.data.next ?? null;
			historyLoaded = true;
		} finally {
			busy = '';
		}
	}

	// --- Tabs / layout ---
	type Tab = 'policy' | 'preview' | 'history';
	let activeTab: Tab = $state('policy');
	const tabs: { id: Tab; label: string }[] = [
		{ id: 'policy', label: 'Policy' },
		{ id: 'preview', label: 'Preview' },
		{ id: 'history', label: 'History' },
	];

	function selectTab(id: Tab) {
		activeTab = id;
		if (id === 'history' && !historyLoaded) void loadHistory(true);
	}

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
	const inputClass = 'w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white';
	const labelClass = 'block text-xs text-gray-500 mb-1';
	const primaryClass =
		'inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50';
	const secondaryClass =
		'inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50';
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
</style>

{#snippet spinner(light: boolean)}
	<div
		class={cn(
			'w-3 h-3 border-2 border-t-transparent rounded-full animate-spin',
			light ? 'border-white' : 'border-gray-400',
		)}
	></div>
{/snippet}

{#snippet taxList(taxes: any[])}
	{#if taxes.length === 0}
		<p class="text-sm text-gray-400 py-2">No taxes.</p>
	{:else}
		<ul class="divide-y divide-gray-100">
			{#each taxes as t (t.code)}
				<li class="py-2">
					<div class="flex items-center justify-between gap-2">
						<span class={cn('text-sm font-medium', t.enabled === false ? 'text-gray-400' : 'text-gray-900')}>
							{t.label || t.code}
						</span>
						<span class="text-xs text-gray-400">
							{BASE_LABELS[t.base] ?? t.base}{t.enabled === false ? ' · off' : ''}
						</span>
					</div>
					<div class="text-xs text-gray-500">{describeTax(t)}</div>
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

<div class={cn('w-full', narrow ? 'py-3' : 'py-6')}>
	<div class="mb-4">
		<h1 class="text-xl font-semibold text-gray-900">Taxes</h1>
		<p class="text-sm text-gray-500">{extensionDescription}</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
		</div>
	{:else if overview}
		<div class="flex mb-4 border-b border-gray-200">
			{#each tabs as tab (tab.id)}
				<button
					type="button"
					onclick={() => selectTab(tab.id)}
					class="chrome-tab {activeTab === tab.id ? 'is-on' : ''}"
				>
					{tab.label}
				</button>
			{/each}
		</div>

		{#if activeTab === 'policy'}
			<div class={cn('grid gap-4', narrow ? 'grid-cols-1' : 'md:grid-cols-3')}>
				<!-- In force -->
				<div class={cn(panelClass, narrow ? '' : 'md:col-span-1')}>
					<div class="flex items-center justify-between mb-2">
						<h2 class="text-sm font-semibold text-gray-700">In force</h2>
						{#if overview.adopted}
							<span class="text-xs text-gray-400">{overview.adopted.id}</span>
						{/if}
					</div>
					{#if overview.adopted}
						{@render taxList(overview.adopted.taxes)}
						<p class="mt-2 text-xs text-gray-400">
							Adopted {overview.adopted.adopted_at?.slice(0, 10)}{overview.adopted.proposal_id
								? ` by vote ${overview.adopted.proposal_id}`
								: ''}
						</p>
					{:else if overview.effective_source === 'codex'}
						<p class="text-xs text-amber-700 mb-2">
							No policy adopted yet; these are the codex defaults.
						</p>
						{@render taxList(overview.effective_taxes)}
					{:else}
						<p class="text-sm text-gray-400 py-2">No tax policy adopted yet.</p>
					{/if}

					{#each overview.proposed ?? [] as p (p.id)}
						<div class="mt-3 p-2 text-xs bg-amber-50 text-amber-800 rounded-lg">
							{p.id} is up for a vote{p.proposal_id ? ` (${p.proposal_id})` : ''}.
						</div>
					{/each}

					<div class="mt-4 pt-3 border-t border-gray-100">
						{#if overview.codex_assesses}
							<p class="text-xs text-gray-500 mb-2">
								The codex <span class="font-medium">{overview.codex}</span> issues the invoices.
							</p>
							{#if canManage}
								{#if confirmAssess}
									<p class="text-xs text-gray-600 mb-2">
										Bill every taxpayer for the current period under {overview.adopted?.id}? Invoices
										already issued for this period are skipped.
									</p>
									<div class="flex gap-2">
										<button class={cn(primaryClass, 'flex-1')} onclick={runAssessment}>
											Issue invoices
										</button>
										<button class={secondaryClass} onclick={() => (confirmAssess = false)}>
											Cancel
										</button>
									</div>
								{:else}
									<button
										class={cn(primaryClass, 'w-full')}
										disabled={busy !== '' || !overview.adopted}
										onclick={() => (confirmAssess = true)}
									>
										{#if busy === 'assess'}{@render spinner(true)}{/if}
										Run assessment
									</button>
								{/if}
							{/if}
						{:else}
							<p class="text-xs text-amber-700">
								The active codex{overview.codex ? ` (${overview.codex})` : ''} does not assess taxes:
								the policy is stored, but no invoices are issued.
							</p>
						{/if}

						{#if assessment}
							<div class="mt-3 p-2 text-xs bg-gray-50 rounded-lg text-gray-600 space-y-0.5">
								<div class="font-medium text-gray-700">
									{assessment.done
										? 'Assessment finished'
										: assessment.error
											? 'Assessment stopped'
											: `Batch ${assessment.batches}…`}
								</div>
								<div>{assessment.created} invoice(s) issued, {fmt(assessment.total)}</div>
								<div>{assessment.already} already invoiced this period</div>
								<div>{assessment.nothingDue} owed nothing, {assessment.notEligible} not liable</div>
								{#if assessment.error}
									<div class="text-red-600">{assessment.error}</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>

				<!-- Editor -->
				<div class={cn(panelClass, narrow ? '' : 'md:col-span-2')}>
					<div class="flex items-center justify-between mb-3">
						<h2 class="text-sm font-semibold text-gray-700">
							{canManage ? 'Edit taxes' : 'Taxes'}
						</h2>
						{#if overview.draft}
							<span class="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
								draft {overview.draft.id}
							</span>
						{:else if dirty}
							<span class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">unsaved</span>
						{/if}
					</div>

					{#if !canManage}
						{@render taxList(documentTaxes)}
						<p class="mt-3 text-xs text-gray-400">
							Only admins of {overview.governed_by || 'the realm'} can change the tax policy.
						</p>
					{:else}
						<div class="space-y-2">
							{#each rows as row (row.uid)}
								<div class="border border-gray-200 rounded-lg">
									<div class="flex items-center gap-2 px-3 py-2">
										<input
											type="checkbox"
											bind:checked={row.enabled}
											class="rounded border-gray-300"
											aria-label="Enabled"
										/>
										<button
											type="button"
											class="flex-1 min-w-0 text-left"
											onclick={() => (expanded = expanded === row.uid ? null : row.uid)}
										>
											<div class={cn('text-sm font-medium truncate', row.enabled ? 'text-gray-900' : 'text-gray-400')}>
												{row.label || row.code || 'New tax'}
											</div>
											<div class="text-xs text-gray-500 truncate">
												{describeTax(taxFrom(row))}
											</div>
										</button>
										<button
											type="button"
											onclick={() => removeTax(row.uid)}
											class="p-1.5 text-gray-400 hover:text-red-500"
											aria-label="Remove tax"
										>
											&times;
										</button>
									</div>

									{#if expanded === row.uid}
										<div class={cn('grid gap-3 px-3 pb-3 pt-1 border-t border-gray-100', narrow ? 'grid-cols-1' : 'grid-cols-2')}>
											<div>
												<label class={labelClass} for="label-{row.uid}">Name</label>
												<input id="label-{row.uid}" class={inputClass} bind:value={row.label} />
											</div>
											<div>
												<label class={labelClass} for="code-{row.uid}">Code</label>
												<input
													id="code-{row.uid}"
													class={cn(inputClass, 'font-mono')}
													bind:value={row.code}
													placeholder="property_tax"
												/>
											</div>
											<div>
												<label class={labelClass} for="base-{row.uid}">What is taxed</label>
												<select id="base-{row.uid}" class={inputClass} bind:value={row.base}>
													{#each overview.options?.bases ?? [] as b (b)}
														<option value={b}>{BASE_LABELS[b] ?? b}</option>
													{/each}
												</select>
											</div>
											<div>
												<label class={labelClass} for="method-{row.uid}">How it is calculated</label>
												<select
													id="method-{row.uid}"
													class={inputClass}
													value={row.base === 'flat' ? 'fixed' : row.method}
													disabled={row.base === 'flat'}
													onchange={(e) => setMethod(row, (e.target as HTMLSelectElement).value)}
												>
													{#each overview.options?.methods ?? [] as m (m)}
														<option value={m}>{METHOD_LABELS[m] ?? m}</option>
													{/each}
												</select>
											</div>

											{#if row.base === 'land_area'}
												<div>
													<label class={labelClass} for="unit-{row.uid}">Value per unit of area</label>
													<input
														id="unit-{row.uid}"
														type="number"
														min="0"
														step="any"
														class={inputClass}
														bind:value={row.unitValue}
													/>
												</div>
											{/if}

											{#if row.base === 'flat' || row.method === 'fixed'}
												<div>
													<label class={labelClass} for="amount-{row.uid}">
														Amount{currency ? ` (${currency})` : ''}
													</label>
													<input
														id="amount-{row.uid}"
														type="number"
														min="0"
														step="any"
														class={inputClass}
														bind:value={row.amount}
													/>
												</div>
											{:else if row.method === 'proportional'}
												<div>
													<label class={labelClass} for="rate-{row.uid}">Rate (%)</label>
													<input
														id="rate-{row.uid}"
														type="number"
														min="0"
														max="100"
														step="0.01"
														class={inputClass}
														bind:value={row.rate}
													/>
												</div>
											{/if}

											{#if row.base === 'land_area'}
												<div>
													<label class={labelClass} for="exempt-{row.uid}">Exempt when value is below</label>
													<input
														id="exempt-{row.uid}"
														type="number"
														min="0"
														step="any"
														class={inputClass}
														bind:value={row.exemptBelow}
														placeholder="0"
													/>
												</div>
											{/if}

											{#if row.base !== 'flat' && row.method === 'progressive'}
												<div class={narrow ? '' : 'col-span-2'}>
													<div class={labelClass}>Brackets (marginal: each rate applies to its slice)</div>
													<div class="space-y-1.5">
														{#each row.brackets as b, i (b.uid)}
															<div class="flex items-center gap-2">
																<span class="w-12 text-xs text-gray-500">
																	{i === row.brackets.length - 1 ? 'above' : 'up to'}
																</span>
																{#if i === row.brackets.length - 1}
																	<span class="flex-1 text-xs text-gray-400">
																		{(row.brackets[i - 1]?.upTo ?? 0).toLocaleString()}
																	</span>
																{:else}
																	<input
																		type="number"
																		min="0"
																		step="any"
																		class={cn(inputClass, 'flex-1')}
																		bind:value={b.upTo}
																		aria-label="Upper bound"
																	/>
																{/if}
																<input
																	type="number"
																	min="0"
																	max="100"
																	step="0.01"
																	class={cn(inputClass, 'w-24')}
																	bind:value={b.rate}
																	aria-label="Rate %"
																/>
																<span class="text-xs text-gray-500">%</span>
																<button
																	type="button"
																	onclick={() => removeBracket(row, b.uid)}
																	disabled={row.brackets.length <= 1}
																	class="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
																	aria-label="Remove bracket"
																>
																	&times;
																</button>
															</div>
														{/each}
													</div>
													<button
														type="button"
														onclick={() => addBracket(row)}
														class="mt-1.5 text-xs text-gray-600 hover:text-gray-900"
													>
														+ Add bracket
													</button>
												</div>
											{/if}

											<div>
												<label class={labelClass} for="period-{row.uid}">Billed</label>
												<select id="period-{row.uid}" class={inputClass} bind:value={row.period}>
													{#each overview.options?.periods ?? [] as p (p)}
														<option value={p}>{PERIOD_LABELS[p] ?? p}</option>
													{/each}
												</select>
											</div>
											<div>
												<label class={labelClass} for="due-{row.uid}">Due after (days)</label>
												<input
													id="due-{row.uid}"
													type="number"
													min="1"
													max="365"
													class={inputClass}
													bind:value={row.dueDays}
												/>
											</div>
											<div>
												<label class={labelClass} for="applies-{row.uid}">Applies to profiles</label>
												<input
													id="applies-{row.uid}"
													class={inputClass}
													bind:value={row.appliesTo}
													placeholder="member"
												/>
											</div>
											<div>
												<label class={labelClass} for="exprof-{row.uid}">Exempt profiles</label>
												<input
													id="exprof-{row.uid}"
													class={inputClass}
													bind:value={row.exemptProfiles}
													placeholder="e.g. admin"
												/>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>

						<div class="flex gap-3 mt-3">
							<button type="button" onclick={() => addTax('flat')} class="text-xs text-gray-600 hover:text-gray-900">
								+ Flat tax
							</button>
							<button type="button" onclick={() => addTax('land_area')} class="text-xs text-gray-600 hover:text-gray-900">
								+ Land tax
							</button>
						</div>

						<label class={cn(labelClass, 'mt-4')} for="tax-description">Note for this version</label>
						<input
							id="tax-description"
							class={inputClass}
							bind:value={description}
							placeholder="What changes and why"
						/>

						<div class={cn('flex gap-2 mt-4', narrow ? 'flex-col' : '')}>
							<button
								class={cn(primaryClass, 'flex-1')}
								disabled={busy !== '' || rows.length === 0}
								onclick={onAdopt}
							>
								{#if busy === 'adopt'}{@render spinner(true)}{/if}
								{overview.direct ? 'Adopt' : 'Propose for a vote'}
							</button>
							<button class={secondaryClass} disabled={busy !== '' || !dirty} onclick={onSave}>
								{#if busy === 'save'}{@render spinner(false)}{/if}
								Save draft
							</button>
							{#if overview.draft}
								<button class={secondaryClass} disabled={busy !== ''} onclick={onDiscard}>
									{#if busy === 'discard'}{@render spinner(false)}{/if}
									Discard draft
								</button>
							{:else if dirty}
								<button class={secondaryClass} disabled={busy !== ''} onclick={resetEditor}>
									Reset
								</button>
							{/if}
						</div>
						<p class="mt-2 text-xs text-gray-400">
							Governed by {overview.governed_by || 'the realm'}{overview.governed_policy
								? ` (${overview.governed_policy})`
								: ''}. {overview.direct
								? 'Adopting applies at once.'
								: 'Adopting opens a vote; the draft is frozen until it closes.'}
						</p>
					{/if}
				</div>
			</div>
		{:else if activeTab === 'preview'}
			<div class={cn(panelClass, 'max-w-2xl')}>
				<h2 class="text-sm font-semibold text-gray-700 mb-1">What would one taxpayer owe?</h2>
				<p class="text-xs text-gray-500 mb-3">
					Uses the taxes as currently edited, saved or not, and the same calculation the codex
					runs.
				</p>
				{#if rows.length === 0}
					<p class="text-sm text-gray-400 py-4">Add a tax on the Policy tab first.</p>
				{:else}
					<div class={cn('grid gap-3', narrow ? 'grid-cols-1' : 'grid-cols-2')}>
						<div>
							<label class={labelClass} for="preview-tax">Tax</label>
							<select
								id="preview-tax"
								class={inputClass}
								value={previewRow?.uid}
								onchange={(e) => {
									previewUid = Number((e.target as HTMLSelectElement).value);
									preview = null;
								}}
							>
								{#each rows as r (r.uid)}
									<option value={r.uid}>{r.label || r.code}</option>
								{/each}
							</select>
						</div>
						{#if previewRow && previewRow.base !== 'flat'}
							<div>
								<label class={labelClass} for="preview-qty">Parcel area</label>
								<input
									id="preview-qty"
									type="number"
									min="0"
									step="any"
									class={inputClass}
									bind:value={previewQuantity}
								/>
							</div>
						{/if}
					</div>
					<button class={cn(primaryClass, 'mt-3')} disabled={busy !== ''} onclick={runPreview}>
						{#if busy === 'preview'}{@render spinner(true)}{/if}
						Calculate
					</button>

					{#if preview}
						<div class="mt-4 pt-3 border-t border-gray-100">
							{#if previewRow?.base !== 'flat'}
								<div class="text-xs text-gray-500 mb-2">
									Taxable value: {preview.value.toLocaleString()}
								</div>
							{/if}
							{#if preview.exempt}
								<p class="text-sm text-emerald-700">Exempt: the value is below the threshold.</p>
							{:else}
								<ul class="divide-y divide-gray-100">
									{#each preview.lines as line (`${line.from}-${line.to}`)}
										<li class="flex justify-between py-1.5 text-sm">
											<span class="text-gray-600">
												{#if line.rate_bp}
													{pct(line.rate_bp)} of {line.from.toLocaleString()} – {line.to.toLocaleString()}
												{:else}
													Fixed amount
												{/if}
											</span>
											<span class="text-gray-900">{fmt(line.amount)}</span>
										</li>
									{/each}
								</ul>
							{/if}
							<div class="flex justify-between pt-2 mt-1 border-t border-gray-200 text-sm font-semibold">
								<span>Owed per period</span>
								<span>{fmt(preview.amount)}</span>
							</div>
						</div>
					{/if}
				{/if}
			</div>
		{:else if activeTab === 'history'}
			<div class={panelClass}>
				<h2 class="text-sm font-semibold text-gray-700 mb-3">Policy versions</h2>
				{#if historyRows.length === 0}
					<p class="text-sm text-gray-400 py-4">
						{busy === 'history' ? 'Loading…' : 'No versions yet.'}
					</p>
				{:else}
					<ul class="divide-y divide-gray-100">
						{#each historyRows as h (h.id)}
							<li class="py-2 flex items-start justify-between gap-3">
								<div class="min-w-0">
									<div class="text-sm font-medium text-gray-900">{h.id}</div>
									<div class="text-xs text-gray-500 truncate">
										{h.taxes} tax(es){h.description ? ` · ${h.description}` : ''}
									</div>
								</div>
								<div class="shrink-0 text-right">
									<span
										class={cn(
											'px-2 py-0.5 text-xs rounded-full',
											h.status === 'adopted'
												? 'bg-green-50 text-green-700'
												: h.status === 'proposed'
													? 'bg-amber-50 text-amber-700'
													: h.status === 'draft'
														? 'bg-blue-50 text-blue-700'
														: 'bg-gray-100 text-gray-500',
										)}
									>
										{h.status}
									</span>
									{#if h.adopted_at}
										<div class="text-xs text-gray-400 mt-0.5">{h.adopted_at.slice(0, 10)}</div>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
					{#if historyNext != null}
						<button class={cn(secondaryClass, 'mt-3')} disabled={busy !== ''} onclick={() => loadHistory()}>
							Load more
						</button>
					{/if}
				{/if}
			</div>
		{/if}
	{/if}

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
						class={secondaryClass}
					>
						Cancel
					</button>
					<button onclick={() => voteConfirm?.run()} disabled={voteConfirmBusy} class={primaryClass}>
						{#if voteConfirmBusy}{@render spinner(true)}{/if}
						Create proposal
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
