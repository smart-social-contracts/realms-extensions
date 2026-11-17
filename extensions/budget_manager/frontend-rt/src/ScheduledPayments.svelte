<script lang="ts">
	import Day from './Day.svelte';
	import { dayInZone } from './days.ts';
	import { isOverdue, listed, owed, partyName, type Filter, type Payment } from './payments.ts';
	import type { BudgetLine } from './stages.ts';
	import { t } from './lib/i18n';

	/**
	 * What the realm owes by a due date (ggg I-FIN-10), and what was revoked unpaid: each payment with its due day in
	 * the realm's time zone, overdue ones marked, and the budget line it is charged to.
	 */
	let {
		payments,
		lines,
		zone,
		now,
		fmtIn,
		narrow,
		onshowline,
	}: {
		payments: Payment[];
		lines: Record<string, BudgetLine>;
		zone: string;
		now: number;
		fmtIn: (raw: number, symbol: string) => string;
		narrow: boolean;
		onshowline: (line: BudgetLine) => void;
	} = $props();

	const FILTERS: Filter[] = ['month', 'overdue', 'all'];
	let filter: Filter = $state('all');

	const rows = $derived(listed(payments, filter, now, zone));
	const owedText = $derived(
		Object.entries(owed(rows))
			.map(([symbol, amount]) => fmtIn(amount, symbol))
			.join(' + '),
	);

	function filterLabel(f: Filter): string {
		const labels: Record<Filter, string> = {
			month: t('filter_month'),
			overdue: t('filter_overdue'),
			all: t('filter_all'),
		};
		return labels[f];
	}

	function emptyText(f: Filter): string {
		const texts: Record<Filter, string> = {
			month: t('payments_empty_month'),
			overdue: t('payments_empty_overdue'),
			all: t('payments_empty_all'),
		};
		return texts[f];
	}

	const words = (category: string) => category.replace(/_/g, ' ');
</script>

{#snippet stateCell(payment: Payment)}
	{#if payment.status === 'cancelled'}
		<span class="text-gray-500">{t('payment_cancelled')}</span>
	{:else if isOverdue(payment, now)}
		<span class="font-medium text-red-700">{t('payment_overdue', { date: dayInZone(payment.due_at ?? now, zone) })}</span>
	{:else}
		<span class="text-gray-600">{t('payment_scheduled')}</span>
	{/if}
{/snippet}

{#snippet lineCell(payment: Payment)}
	{#if payment.budget && lines[payment.budget]}
		{@const budgetLine = lines[payment.budget]}
		<button
			type="button"
			onclick={() => onshowline(budgetLine)}
			title={t('payment_show_line')}
			class="text-left text-gray-700 underline hover:text-gray-900"
		>
			{t('payment_line', { fund: budgetLine.fund, category: words(budgetLine.category), period: budgetLine.period })}
		</button>
	{:else if payment.budget}
		<span class="text-gray-600">{payment.budget}</span>
	{:else}
		—
	{/if}
	{#if payment.committed}<div class="text-xs text-gray-400">{t('payment_committed')}</div>{/if}
	{#if payment.contract}<div class="text-xs text-gray-400">{t('payment_contract', { contract: payment.contract })}</div>{/if}
{/snippet}

<div data-testid="payments">
	<h2 class="text-sm font-semibold text-gray-700 mb-1">{t('payments_title')}</h2>
	<p class="text-xs text-gray-500 mb-3">{t('payments_hint')}</p>

	<div class="flex flex-wrap items-center justify-between gap-2 mb-3">
		<div class="flex flex-wrap gap-2" role="group" aria-label={t('payments_filter')}>
			{#each FILTERS as f (f)}
				<button
					type="button"
					onclick={() => (filter = f)}
					aria-pressed={filter === f}
					class="px-3 py-1.5 text-sm rounded-lg border {filter === f
						? 'bg-gray-900 text-white border-gray-900'
						: 'border-gray-300 text-gray-700 hover:bg-gray-50'}"
				>
					{filterLabel(f)}
				</button>
			{/each}
		</div>
		{#if owedText}
			<span class="text-sm font-medium text-gray-900" data-testid="owed">{t('payments_owed', { amount: owedText })}</span>
		{/if}
	</div>

	{#if rows.length === 0}
		<p class="text-sm text-gray-400 py-4">{emptyText(filter)}</p>
	{:else if narrow}
		<div class="divide-y divide-gray-200">
			{#each rows as payment (payment.id)}
				<article class="py-3 {isOverdue(payment, now) ? 'bg-red-50' : ''}" data-payment={payment.id}>
					<div class="flex items-start justify-between gap-2">
						<div class="min-w-0 text-sm text-gray-900">
							<Day epoch={payment.due_at} {zone} />
							<div class="text-xs text-gray-500">{partyName(payment.sender)} → {partyName(payment.to)}</div>
						</div>
						<div class="shrink-0 text-sm font-medium text-gray-900 {payment.status === 'cancelled' ? 'line-through text-gray-500' : ''}">
							{fmtIn(payment.amount, payment.symbol)}
						</div>
					</div>
					<div class="mt-1 text-xs">{@render stateCell(payment)}</div>
					<div class="mt-1 text-xs">{@render lineCell(payment)}</div>
				</article>
			{/each}
		</div>
	{:else}
		<table class="w-full text-sm">
			<thead>
				<tr class="text-left text-xs text-gray-500 border-b border-gray-200">
					<th scope="col" class="py-2 pr-3">{t('col_due')}</th>
					<th scope="col" class="py-2 pr-3">{t('col_from')}</th>
					<th scope="col" class="py-2 pr-3">{t('col_to')}</th>
					<th scope="col" class="py-2 pr-3 text-right">{t('col_amount')}</th>
					<th scope="col" class="py-2 pr-3">{t('col_line')}</th>
					<th scope="col" class="py-2">{t('col_state')}</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each rows as payment (payment.id)}
					<tr class={isOverdue(payment, now) ? 'bg-red-50' : ''} data-payment={payment.id}>
						<td class="py-2 pr-3 text-gray-900"><Day epoch={payment.due_at} {zone} /></td>
						<td class="py-2 pr-3 text-gray-600">{partyName(payment.sender)}</td>
						<td class="py-2 pr-3 text-gray-600">{partyName(payment.to)}</td>
						<td class="py-2 pr-3 text-right tabular-nums font-medium {payment.status === 'cancelled' ? 'line-through text-gray-500' : 'text-gray-900'}">
							{fmtIn(payment.amount, payment.symbol)}
						</td>
						<td class="py-2 pr-3">{@render lineCell(payment)}</td>
						<td class="py-2">{@render stateCell(payment)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
