<script lang="ts">
	import Day from './Day.svelte';
	import { bookingOf, idOnQuarter, newestFirst, swept, type BookedEntry, type Sweep, type SweepRule } from './sweeps.ts';
	import { t } from './lib/i18n';

	/**
	 * Money paid in a quarter reaches its capital's funds (ggg I-FED-5 to I-FED-7). On the capital: the sweep rules it
	 * set and the sweeps its quarters reported, each booked once as `<quarter>/<id>`. On a quarter: its own sweeps.
	 */
	let {
		role,
		rules,
		sweeps,
		entries,
		bookings,
		names,
		canRead,
		zone,
		fmtIn,
		narrow,
	}: {
		role: 'capital' | 'quarter';
		rules: SweepRule[];
		sweeps: Sweep[];
		entries: BookedEntry[];
		/** Whether the realm names the sweep on the ledger entries that book it: an older realm does not, and shows no booking. */
		bookings: boolean;
		/** The names of the quarters by canister id. */
		names: Record<string, string>;
		canRead: boolean;
		zone: string;
		fmtIn: (raw: number, symbol: string) => string;
		narrow: boolean;
	} = $props();

	const history = $derived(newestFirst(sweeps));
	const sweptText = $derived(
		Object.entries(swept(sweeps))
			.map(([symbol, amount]) => fmtIn(amount, symbol))
			.join(' + '),
	);

	function statusLabel(status: string): string {
		const labels: Record<string, string> = {
			sending: t('sweep_sending'),
			sent: t('sweep_sent'),
			booked: t('sweep_booked'),
			failed: t('sweep_failed'),
			needs_check: t('sweep_needs_check'),
		};
		return labels[status] ?? status;
	}
</script>

{#snippet status(sweep: Sweep)}
	<span class={sweep.status === 'failed' || sweep.status === 'needs_check' ? 'font-medium text-red-700' : 'text-gray-700'}>
		{statusLabel(sweep.status)}
	</span>
	{#if sweep.reason}<div class="text-xs text-gray-500">{sweep.reason}</div>{/if}
	{#if sweep.block}<div class="text-xs text-gray-400">{t('sweep_block', { block: sweep.block })}</div>{/if}
{/snippet}

{#snippet booking(sweep: Sweep)}
	{@const booked = bookingOf(sweep, entries)}
	{#if booked}
		<div class="text-gray-700">{t('sweep_booked_as', { transaction: booked.transaction })}</div>
		<ul class="text-xs text-gray-500">
			{#each booked.entries as entry (entry.id)}
				<li>
					{entry.debit > 0
						? t('entry_debit', { category: entry.category, amount: fmtIn(entry.debit, sweep.symbol) })
						: t('entry_credit', { category: entry.category, amount: fmtIn(entry.credit, sweep.symbol) })}
				</li>
			{/each}
		</ul>
	{:else}
		—
	{/if}
{/snippet}

<div data-testid="sweeps">
	<h2 class="text-sm font-semibold text-gray-700 mb-3">
		{role === 'capital' ? t('sweeps_title_capital') : t('sweeps_title_quarter')}
	</h2>

	{#if role === 'capital'}
		<h3 class="text-xs font-semibold text-gray-500 mb-1">{t('sweeps_rules_title')}</h3>
		<p class="text-xs text-gray-500 mb-2">{t('sweeps_rules_hint')}</p>
		{#if rules.length === 0}
			<p class="text-sm text-gray-400 py-2" data-testid="no-rules">{t('sweeps_rules_empty')}</p>
		{:else}
			<table class="w-full text-sm mb-4" data-testid="rules">
				<thead>
					<tr class="text-left text-xs text-gray-500 border-b border-gray-200">
						<th scope="col" class="py-2 pr-3">{t('rule_fund')}</th>
						<th scope="col" class="py-2 pr-3">{t('rule_symbol')}</th>
						<th scope="col" class="py-2 pr-3">{t('rule_into')}</th>
						<th scope="col" class="py-2 text-right">{t('rule_keep')}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each rules as rule (`${rule.fund}:${rule.symbol}`)}
						<tr>
							<td class="py-2 pr-3 font-medium text-gray-900">{rule.fund}</td>
							<td class="py-2 pr-3 text-gray-600">{rule.symbol}</td>
							<td class="py-2 pr-3 text-gray-600">{rule.into}</td>
							<td class="py-2 text-right tabular-nums text-gray-700">{fmtIn(rule.keep, rule.symbol)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	{/if}

	<h3 class="mt-4 text-xs font-semibold text-gray-500 mb-1">{t('sweeps_history_title')}</h3>
	{#if !canRead}
		<p class="text-sm text-gray-400 py-2">{t('sweeps_history_restricted')}</p>
	{:else if history.length === 0}
		<p class="text-sm text-gray-400 py-2">{t('sweeps_empty')}</p>
	{:else}
		{#if sweptText}
			<p class="mb-2 text-sm font-medium text-gray-900" data-testid="swept">{t('sweeps_total', { amount: sweptText })}</p>
		{/if}
		{#if narrow}
			<div class="divide-y divide-gray-200">
				{#each history as sweep (sweep.id)}
					<article class="py-3 text-sm" data-sweep={sweep.id}>
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<div class="font-medium text-gray-900">{role === 'capital' ? (names[sweep.quarter] ?? sweep.quarter) : sweep.id}</div>
								<div class="text-xs text-gray-500">
									<Day epoch={sweep.created_at} {zone} />
									{#if role === 'capital'}{' · '}{t('sweep_quarter_side', { id: idOnQuarter(sweep) })}{/if}
								</div>
							</div>
							<div class="shrink-0 font-medium text-gray-900">{fmtIn(sweep.amount, sweep.symbol)}</div>
						</div>
						<div class="mt-1 text-xs text-gray-500">{sweep.fund} → {sweep.into}</div>
						<div class="mt-1 text-xs">{@render status(sweep)}</div>
						{#if bookings}<div class="mt-1 text-xs">{@render booking(sweep)}</div>{/if}
					</article>
				{/each}
			</div>
		{:else}
			<table class="w-full text-sm" data-testid="history">
				<thead>
					<tr class="text-left text-xs text-gray-500 border-b border-gray-200">
						<th scope="col" class="py-2 pr-3">{t('col_date')}</th>
						<th scope="col" class="py-2 pr-3">{role === 'capital' ? t('col_quarter') : t('col_sweep')}</th>
						<th scope="col" class="py-2 pr-3">{t('col_into')}</th>
						<th scope="col" class="py-2 pr-3 text-right">{t('col_amount')}</th>
						<th scope="col" class="py-2 pr-3">{t('col_state')}</th>
						{#if bookings}<th scope="col" class="py-2">{t('col_booking')}</th>{/if}
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each history as sweep (sweep.id)}
						<tr class="align-top" data-sweep={sweep.id}>
							<td class="py-2 pr-3 text-gray-900"><Day epoch={sweep.created_at} {zone} /></td>
							<td class="py-2 pr-3 text-gray-600">
								{#if role === 'capital'}
									{names[sweep.quarter] ?? sweep.quarter}
									<div class="text-xs text-gray-400">{t('sweep_quarter_side', { id: idOnQuarter(sweep) })}</div>
								{:else}
									{sweep.id}
								{/if}
							</td>
							<td class="py-2 pr-3 text-gray-600">{sweep.fund} → {sweep.into}</td>
							<td class="py-2 pr-3 text-right tabular-nums font-medium text-gray-900">
								{fmtIn(sweep.amount, sweep.symbol)}
								{#if sweep.fee > 0}<div class="text-xs font-normal text-gray-400">{t('sweep_fee', { fee: fmtIn(sweep.fee, sweep.symbol) })}</div>{/if}
							</td>
							<td class="py-2 pr-3">{@render status(sweep)}</td>
							{#if bookings}<td class="py-2">{@render booking(sweep)}</td>{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	{/if}
</div>
