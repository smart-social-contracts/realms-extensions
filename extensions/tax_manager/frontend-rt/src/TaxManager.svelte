<script lang="ts">
	import { onDestroy } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';
	import { applied, governorOf, voteGate } from '../../../_shared/frontend/governed';
	import { PERCENT, formatPercent, formatUnits, fromPercent, toBaseUnits } from '../../../_shared/frontend/units';

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

	// What the viewer may do; "all" stands for every permission.
	let permissions: string[] = $state([]);
	const can = (permission: string) =>
		permissions.includes('all') || permissions.includes(permission);
	const canManage = $derived(can('tax.manage'));
	const canAssess = $derived(can('tax.assess'));

	const { confirm: voteConfirm, busy: voteConfirmBusy, governed } = voteGate(addToast, 'Tax policy');

	// --- Labels ---
	const BASES = ['flat', 'land_area', 'declared'];
	const METHODS = ['fixed', 'proportional', 'progressive'];
	const BASE_LABELS: Record<string, string> = {
		flat: 'Per member (flat)',
		land_area: 'Land parcels (area × value per unit)',
		declared: 'Declared by the taxpayer',
	};
	const METHOD_LABELS: Record<string, string> = {
		fixed: 'Fixed amount',
		proportional: 'Percentage of value',
		progressive: 'Progressive brackets',
	};

	// --- Data ---
	let overview: any = $state.raw(null);
	let loading = $state(true);
	let busy = $state('');

	const currency = $derived(overview?.currency ?? '');
	const decimals = $derived(overview?.decimals ?? 0);

	/** The realm keeps amounts in the token's base units: shown in tokens, with at least two places. */
	function human(n: number | null | undefined): string {
		return Number(formatUnits(n ?? 0, decimals)).toLocaleString(undefined, {
			minimumFractionDigits: Math.min(decimals, 2),
			maximumFractionDigits: decimals,
		});
	}

	function fmt(n: number | null | undefined): string {
		return currency ? `${human(n)} ${currency}` : human(n);
	}

	/** An amount the admin typed, in tokens, as base units; NaN when it is not an amount of this token. */
	function toUnits(n: number | null | undefined): number {
		return toBaseUnits(String(n ?? 0), decimals) ?? NaN;
	}

	/** Base units as the number an input shows, in tokens. */
	function toTokens(n: number | null | undefined): number | null {
		return n == null ? null : Number(formatUnits(n, decimals));
	}

	function pct(ratio: number | null | undefined): string {
		return `${formatPercent(ratio)}%`;
	}

	function describeTax(t: any): string {
		const per =
			t.base === 'land_area' ? 'per parcel' : t.base === 'declared' ? 'per declaration' : 'per member';
		let how = '';
		if (t.method === 'fixed') how = `${fmt(t.amount)} ${per}`;
		else if (t.method === 'proportional') how = `${pct(t.rate)} of the value`;
		else {
			const parts = (t.brackets ?? []).map((b: any) =>
				b.up_to == null ? `${pct(b.rate)} above` : `${pct(b.rate)} up to ${human(b.up_to)}`,
			);
			how = parts.join(', ');
		}
		if (t.base === 'land_area') how += ` · value = area × ${human(t.unit_value)}`;
		if (t.exempt_below) how += ` · exempt below ${human(t.exempt_below)}`;
		return `${how} · due after ${t.due_days ?? 30} days`;
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
		exemptProfiles: string;
		dueDays: number | null;
	}

	let nextUid = 1;
	let rows: TaxRow[] = $state([]);
	let description = $state('');
	let expanded: number | null = $state(null);
	let baseline = $state('[]');

	function bracketFrom(b: any): BracketRow {
		return { uid: nextUid++, upTo: toTokens(b.up_to), rate: Number(formatPercent(b.rate)) };
	}

	function rowFrom(t: any): TaxRow {
		return {
			uid: nextUid++,
			code: t.code ?? '',
			label: t.label ?? '',
			enabled: t.enabled !== false,
			base: t.base ?? 'flat',
			unitValue: toTokens(t.unit_value ?? toUnits(1)),
			method: t.method ?? 'fixed',
			amount: toTokens(t.amount),
			rate: t.rate != null ? Number(formatPercent(t.rate)) : null,
			brackets: (t.brackets ?? []).map(bracketFrom),
			exemptBelow: toTokens(t.exempt_below || null),
			exemptProfiles: (t.exempt_profiles ?? []).join(', '),
			dueDays: t.due_days ?? 30,
		};
	}

	function names(s: string): string[] {
		return s
			.split(',')
			.map((x) => x.trim())
			.filter(Boolean);
	}

	function taxFrom(r: TaxRow): Record<string, unknown> {
		const t: Record<string, unknown> = {
			code: r.code.trim(),
			label: r.label.trim() || r.code.trim(),
			enabled: r.enabled,
			base: r.base,
			method: r.base === 'flat' ? 'fixed' : r.method,
			due_days: r.dueDays ?? 30,
			exempt_profiles: names(r.exemptProfiles),
		};
		if (r.exemptBelow) t.exempt_below = toUnits(r.exemptBelow);
		if (r.base === 'land_area') t.unit_value = toUnits(r.unitValue ?? 1);
		if (t.method === 'fixed') t.amount = toUnits(r.amount);
		else if (t.method === 'proportional') t.rate = fromPercent(r.rate);
		else
			t.brackets = r.brackets.map((b, i) => ({
				up_to: i === r.brackets.length - 1 ? null : toUnits(b.upTo),
				rate: fromPercent(b.rate),
			}));
		return t;
	}

	const documentTaxes = $derived(rows.map(taxFrom));
	const badAmount = $derived(
		documentTaxes.some((t: any) =>
			[t.amount, t.exempt_below, t.unit_value, ...(t.brackets ?? []).map((b: any) => b.up_to)].some(Number.isNaN),
		),
	);
	const dirty = $derived(JSON.stringify(documentTaxes) !== baseline);

	function resetEditor() {
		rows = (overview?.adopted?.taxes ?? []).map(rowFrom);
		description = '';
		baseline = JSON.stringify(rows.map(taxFrom));
		expanded = null;
	}

	function addTax(base: 'flat' | 'land_area' | 'declared') {
		let n = rows.length + 1;
		while (rows.some((r) => r.code === `tax_${n}`)) n++;
		const row = rowFrom(
			base === 'flat'
				? { code: `tax_${n}`, label: 'Membership tax', base, method: 'fixed', amount: toUnits(10) }
				: {
						code: `tax_${n}`,
						label: base === 'land_area' ? 'Land tax' : 'Tax on declared amounts',
						base,
						method: 'proportional',
						rate: PERCENT,
						unit_value: toUnits(1),
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
				{ uid: nextUid++, upTo: 100, rate: r.rate ?? 0.5 },
				{ uid: nextUid++, upTo: null, rate: (r.rate ?? 0.5) * 2 },
			];
		}
	}

	function addBracket(r: TaxRow) {
		const last = r.brackets[r.brackets.length - 1];
		const prevTop = r.brackets.length > 1 ? (r.brackets[r.brackets.length - 2].upTo ?? 0) : 0;
		if (last) last.upTo = prevTop ? prevTop * 2 : 100;
		r.brackets.push({ uid: nextUid++, upTo: null, rate: last?.rate ?? 0 });
	}

	function removeBracket(r: TaxRow, uid: number) {
		r.brackets = r.brackets.filter((b) => b.uid !== uid);
	}

	// --- Loading ---
	async function load() {
		const [view, me, departments] = await Promise.all([
			read('tax_policy_view'),
			read('me'),
			pages('department_list', {}, 'departments'),
		]);
		const declarations = [...view.declarations];
		for (let from = view.next; from; ) {
			const page = await read('tax_policy_view', { from });
			declarations.push(...page.declarations);
			from = page.next;
		}
		permissions = me.permissions;
		const policy = view.policy;
		overview = {
			currency: view.currency,
			decimals: view.decimals,
			adopted: policy && {
				id: policy.id,
				taxes: policy.document.taxes,
				adopted_at: policy.adopted_at,
				proposal: policy.proposal,
			},
			drafts: view.drafts,
			declarations,
			governor: await governorOf(read, departments.find((d) => d.is_root).id),
		};
		resetEditor();
	}

	async function loadAll() {
		loading = true;
		try {
			await load();
		} catch (e: any) {
			addToast(e?.message || 'Failed to load the tax policy', 'error');
		} finally {
			loading = false;
		}
	}

	void loadAll();

	// --- Adopting a policy ---
	/** Adopt the draft ``policy`` that is on the realm; under a voting policy this opens the second vote. */
	async function adoptPolicy(policy: string) {
		if (applied(await ctx.run('tax_policy_propose', { policy }), addToast, 'Could not adopt the tax policy')) {
			addToast('Tax policy adopted');
			await load();
		}
	}

	/** Draft the edited taxes, then adopt the draft; each step may open a vote instead. */
	async function onAdopt() {
		if (badAmount) {
			addToast(`Amounts need at most ${decimals} decimal places`, 'error');
			return;
		}
		busy = 'adopt';
		try {
			const taxes = documentTaxes;
			await governed(overview.governor, `Adopt a tax policy of ${taxes.length} tax(es)`, async () => {
				// Under a voting policy drafting is voted on too; the draft it leaves is adopted from the list of drafts.
				const document = { ...(currency ? { symbol: currency } : {}), taxes };
				const drafted = await ctx.run('tax_policy_draft', { document, description });
				if (!applied(drafted, addToast, 'Could not draft the tax policy', '; adopt the draft from the list once it passes')) return;
				await adoptPolicy(drafted.policy);
			});
		} finally {
			busy = '';
		}
	}

	/** Adopt a draft that is already on the realm, e.g. one a vote has passed. */
	async function onAdoptDraft(draft: any) {
		busy = 'adopt';
		try {
			await governed(overview.governor, `Adopt tax policy ${draft.id}`, () => adoptPolicy(draft.id));
		} finally {
			busy = '';
		}
	}

	// --- Assessment ---
	interface Assessment {
		batches: number;
		issued: number;
		skipped: number;
		done: boolean;
		error: string;
	}
	let assessment: Assessment | null = $state.raw(null);
	let confirmAssess = $state(false);
	let assessPeriod = $state(new Date().toISOString().slice(0, 7));
	const MAX_BATCHES = 2000;

	async function runAssessment() {
		confirmAssess = false;
		busy = 'assess';
		const acc: Assessment = { batches: 0, issued: 0, skipped: 0, done: false, error: '' };
		let from = 1;
		try {
			while (acc.batches < MAX_BATCHES) {
				const res = await ctx.run('tax_assess', { period: assessPeriod.trim(), from });
				if (!res.ok) {
					acc.error = res.error || 'The assessment failed';
					break;
				}
				acc.batches += 1;
				acc.issued += res.count;
				acc.skipped += res.skipped;
				assessment = { ...acc };
				if (!res.next) {
					acc.done = true;
					break;
				}
				from = res.next;
			}
		} finally {
			assessment = { ...acc };
			busy = '';
		}
		if (acc.error) addToast(acc.error, 'error');
		else if (acc.done) addToast(`${acc.issued} invoice(s) issued`);
	}

	// --- Declaring a tax ---
	const declaredTaxes = $derived(
		(overview?.adopted?.taxes ?? []).filter((t: any) => t.base === 'declared' && t.enabled !== false),
	);
	let declareTax = $state('');
	let declarePeriod = $state(new Date().toISOString().slice(0, 7));
	let declareAmount: number | null = $state(null);
	let declareOrganization = $state('');

	async function onDeclare() {
		const amount = toBaseUnits(String(declareAmount ?? 0), decimals);
		if (amount == null) {
			addToast(`Amounts need at most ${decimals} decimal places`, 'error');
			return;
		}
		busy = 'declare';
		try {
			const res = await ctx.run('tax_declare', {
				base: declareTax || declaredTaxes[0]?.code,
				period: declarePeriod.trim(),
				amount,
				...(declareOrganization.trim() ? { organization: declareOrganization.trim() } : {}),
			});
			if (!res.ok) {
				addToast(res.error || 'Could not declare', 'error');
				return;
			}
			addToast(`Declared: you owe ${fmt(res.owed)}${res.invoice ? ' — pay it from your dashboard' : ''}`);
			declareAmount = null;
			await load();
		} finally {
			busy = '';
		}
	}

	// --- Tabs / layout ---
	type Tab = 'policy' | 'mine';
	let activeTab: Tab = $state('policy');
	const tabs: { id: Tab; label: string }[] = [
		{ id: 'policy', label: 'Policy' },
		{ id: 'mine', label: 'My taxes' },
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

{#snippet draftList()}
	{#if overview.drafts.length > 0}
		<h3 class="mt-4 mb-2 text-xs font-semibold text-gray-500">Drafts</h3>
		<ul class="divide-y divide-gray-100" aria-label="Policy drafts">
			{#each overview.drafts as d (d.id)}
				<li class="flex items-center justify-between gap-2 py-2 text-sm">
					<span class="min-w-0 text-gray-600">
						<span class="font-medium text-gray-900">{d.id}</span>
						<span class="text-xs text-gray-400">
							· {d.document.taxes.map((t: any) => t.label || t.code).join(', ')}{d.description ? ` · ${d.description}` : ''}
						</span>
					</span>
					{#if canManage}
						<button
							class={secondaryClass}
							disabled={busy !== ''}
							aria-label="Adopt {d.id}"
							onclick={() => onAdoptDraft(d)}
						>
							Adopt
						</button>
					{/if}
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
					onclick={() => (activeTab = tab.id)}
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
							Adopted {new Date(overview.adopted.adopted_at * 1000).toISOString().slice(0, 10)}{overview.adopted.proposal
								? ` by vote ${overview.adopted.proposal}`
								: ''}
						</p>
					{:else}
						<p class="text-sm text-gray-400 py-2">No tax policy adopted yet.</p>
					{/if}

					{#if canAssess}
						<div class="mt-4 pt-3 border-t border-gray-100">
							{#if confirmAssess}
								<p class="text-xs text-gray-600 mb-2">
									Bill every taxpayer for {assessPeriod} under {overview.adopted?.id}? Invoices already
									issued for this period are skipped.
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
								<label class={labelClass} for="assess-period">Period to bill</label>
								<input id="assess-period" class={cn(inputClass, 'mb-2')} bind:value={assessPeriod} />
								<button
									class={cn(primaryClass, 'w-full')}
									disabled={busy !== '' || !overview.adopted || !assessPeriod.trim()}
									onclick={() => (confirmAssess = true)}
								>
									{#if busy === 'assess'}{@render spinner(true)}{/if}
									Run assessment
								</button>
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
									<div>{assessment.issued} invoice(s) issued</div>
									<div>{assessment.skipped} already billed for this period</div>
									{#if assessment.error}
										<div class="text-red-600">{assessment.error}</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Editor -->
				<div class={cn(panelClass, narrow ? '' : 'md:col-span-2')}>
					<div class="flex items-center justify-between mb-3">
						<h2 class="text-sm font-semibold text-gray-700">
							{canManage ? 'Edit taxes' : 'Taxes'}
						</h2>
						{#if dirty}
							<span class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">unsaved</span>
						{/if}
					</div>

					{#if !canManage}
						{@render taxList(overview.adopted?.taxes ?? [])}
						<p class="mt-3 text-xs text-gray-400">
							Only those who hold tax.manage can change the tax policy.
						</p>
						{@render draftList()}
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
													{#each BASES as b (b)}
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
													{#each METHODS as m (m)}
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
														step="any"
														class={inputClass}
														bind:value={row.rate}
													/>
												</div>
											{/if}

											{#if row.base !== 'flat'}
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
																	step="any"
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
							<button type="button" onclick={() => addTax('declared')} class="text-xs text-gray-600 hover:text-gray-900">
								+ Declared tax
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
								{overview.governor.direct ? 'Adopt' : 'Propose for a vote'}
							</button>
							{#if dirty}
								<button class={secondaryClass} disabled={busy !== ''} onclick={resetEditor}>
									Reset
								</button>
							{/if}
						</div>
						<p class="mt-2 text-xs text-gray-400">
							Governed by {overview.governor.name} ({overview.governor.policy}).
							{overview.governor.direct
								? 'Adopting applies at once.'
								: 'Adopting opens a vote.'}
							Amounts are in {currency || 'tokens'}.
						</p>
						{#if !overview.governor.direct}
							<p class="mt-2 text-xs text-gray-400">
								This realm votes on its tax policy: a change takes two votes, one to draft the policy and
								one to adopt it.
							</p>
						{/if}
						{@render draftList()}
					{/if}
				</div>
			</div>
		{:else}
			<div class={cn('grid gap-4', narrow ? 'grid-cols-1' : 'md:grid-cols-2')}>
				<!-- Declare -->
				<div class={panelClass}>
					<h2 class="text-sm font-semibold text-gray-700 mb-3">Declare a tax</h2>
					{#if declaredTaxes.length === 0}
						<p class="text-sm text-gray-400 py-2">
							The tax policy in force has no tax you declare yourself. The realm bills the others.
						</p>
					{:else}
						<div class="space-y-3">
							<div>
								<label class={labelClass} for="declare-tax">Tax</label>
								<select
									id="declare-tax"
									class={inputClass}
									value={declareTax || declaredTaxes[0]?.code}
									onchange={(e) => (declareTax = (e.target as HTMLSelectElement).value)}
								>
									{#each declaredTaxes as t (t.code)}
										<option value={t.code}>{t.label || t.code}</option>
									{/each}
								</select>
							</div>
							<div>
								<label class={labelClass} for="declare-period">Period</label>
								<input id="declare-period" class={inputClass} bind:value={declarePeriod} />
							</div>
							<div>
								<label class={labelClass} for="declare-amount">Amount to declare</label>
								<input
									id="declare-amount"
									type="number"
									min="0"
									step="any"
									class={inputClass}
									bind:value={declareAmount}
								/>
							</div>
							<div>
								<label class={labelClass} for="declare-org">For an organization you administer (optional)</label>
								<input id="declare-org" class={inputClass} bind:value={declareOrganization} />
							</div>
							<button
								class={cn(primaryClass, 'w-full')}
								disabled={busy !== '' || declareAmount == null || !declarePeriod.trim()}
								onclick={onDeclare}
							>
								{#if busy === 'declare'}{@render spinner(true)}{/if}
								Declare
							</button>
							<p class="text-xs text-gray-400">
								Each tax is declared once per period. The invoice appears on your dashboard.
							</p>
						</div>
					{/if}
				</div>

				<!-- Declarations -->
				<div class={panelClass}>
					<h2 class="text-sm font-semibold text-gray-700 mb-1">Your declarations</h2>
					<p class="mb-3 text-xs text-gray-400">Declarations of an organization you administer are not listed here.</p>
					{#if overview.declarations.length === 0}
						<p class="text-sm text-gray-400 py-2">Nothing has been assessed or declared for you yet.</p>
					{:else}
						<ul class="divide-y divide-gray-100">
							{#each overview.declarations as d (d.id)}
								<li class="flex items-center justify-between gap-2 py-2 text-sm">
									<span class="text-gray-900">{d.base} · {d.period}</span>
									<span class="text-xs text-gray-500">{d.status}</span>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		{/if}
	{/if}

	{#if $voteConfirm}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
			<div class="w-full max-w-md bg-white rounded-xl shadow-xl p-5">
				<h3 class="text-base font-semibold text-gray-900 mb-1">A vote is required</h3>
				<p class="text-sm text-gray-600 mb-3">{$voteConfirm.summary}</p>
				<div class="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 mb-4">
					<p class="mb-1">
						<span class="font-medium text-gray-700">Governed by:</span>
						{$voteConfirm.governedBy} ({$voteConfirm.governedPolicy})
					</p>
					<p>{$voteConfirm.policyReason}</p>
				</div>
				<div class="flex gap-2 justify-end">
					<button
						onclick={() => voteConfirm.set(null)}
						disabled={$voteConfirmBusy}
						class={secondaryClass}
					>
						Cancel
					</button>
					<button onclick={() => $voteConfirm?.run()} disabled={$voteConfirmBusy} class={primaryClass}>
						{#if $voteConfirmBusy}{@render spinner(true)}{/if}
						Create proposal
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
