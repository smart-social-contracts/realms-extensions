<script lang="ts">
	import StageBar, { STAGE_COLORS } from './StageBar.svelte';
	import { byFund, stagesOf, type BudgetLine, type StageName, type Stages } from './stages.ts';
	import { t } from './lib/i18n';

	/**
	 * The expense lines of a period with the stages of their money (ggg I-FIN-9): a bar and the numbers for each line,
	 * the totals of each fund and of the budget. A line still being drafted or proposed has no stages: it plans only.
	 */
	let {
		period,
		lines,
		pending,
		fmt,
		narrow,
	}: {
		period: string;
		lines: BudgetLine[];
		pending: BudgetLine[];
		fmt: (raw: number) => string;
		narrow: boolean;
	} = $props();

	const funds = $derived(byFund(lines));
	const budget = $derived(stagesOf(funds.flatMap((f) => f.lines)));

	const LEGEND: StageName[] = ['actual', 'committed', 'reserved', 'available'];

	function stageLabel(stage: StageName): string {
		const labels: Record<StageName, string> = {
			actual: t('stage_actual'),
			committed: t('stage_committed'),
			reserved: t('stage_reserved'),
			available: t('stage_available'),
		};
		return labels[stage];
	}

	function barLabel(s: Stages): string {
		return t('stages_bar', {
			planned: fmt(s.planned),
			actual: fmt(s.actual),
			committed: fmt(s.committed),
			reserved: fmt(s.reserved),
			available: fmt(s.available),
		});
	}

	const words = (category: string) => category.replace(/_/g, ' ');
</script>

{#snippet cells(s: Stages)}
	<td class="py-2 pr-3 text-right tabular-nums text-gray-700">{fmt(s.planned)}</td>
	<td class="py-2 pr-3 text-right tabular-nums text-gray-700">{fmt(s.reserved)}</td>
	<td class="py-2 pr-3 text-right tabular-nums text-gray-700">{fmt(s.committed)}</td>
	<td class="py-2 pr-3 text-right tabular-nums text-gray-700">{fmt(s.actual)}</td>
	<td class="py-2 text-right tabular-nums font-medium text-gray-900">{fmt(s.available)}</td>
{/snippet}

{#snippet figures(s: Stages)}
	<dl class="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
		<div class="flex justify-between gap-2"><dt>{t('stage_reserved')}</dt><dd>{fmt(s.reserved)}</dd></div>
		<div class="flex justify-between gap-2"><dt>{t('stage_committed')}</dt><dd>{fmt(s.committed)}</dd></div>
		<div class="flex justify-between gap-2"><dt>{t('stage_actual')}</dt><dd>{fmt(s.actual)}</dd></div>
		<div class="flex justify-between gap-2 font-medium text-gray-900"><dt>{t('stage_available')}</dt><dd>{fmt(s.available)}</dd></div>
	</dl>
{/snippet}

<div data-testid="stages">
	<h2 class="text-sm font-semibold text-gray-700 mb-1">{t('stages_title', { period })}</h2>
	<p class="text-xs text-gray-500 mb-3">{t('stages_hint')}</p>
	<ul class="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-gray-600" aria-label={t('stages_legend')}>
		{#each LEGEND as stage (stage)}
			<li class="inline-flex items-center gap-2">
				<span class="w-2.5 h-2.5 rounded-full border border-gray-200 {STAGE_COLORS[stage]}"></span>
				{stageLabel(stage)}
			</li>
		{/each}
	</ul>

	{#if funds.length === 0}
		<p class="text-sm text-gray-400 py-4">{t('stages_empty')}</p>
	{:else if narrow}
		<div class="divide-y divide-gray-200">
			{#each funds as f (f.fund)}
				<section class="py-3" data-fund={f.fund}>
					<h3 class="font-semibold text-gray-900">{f.fund}</h3>
					{#each f.lines as line (line.id)}
						<article class="py-2" data-line={line.id}>
							<div class="flex items-start justify-between gap-2 mb-1">
								<span class="min-w-0 font-medium text-gray-900">
									<span class="capitalize">{words(line.category)}</span>{#if line.status === 'extended'}<span class="text-xs text-gray-400"> · {t('stages_extended')}</span>{/if}
								</span>
								<span class="shrink-0 text-xs text-gray-500">{t('stage_planned')} {fmt(line.planned)}</span>
							</div>
							<StageBar stages={line} label={barLabel(line)} />
							{@render figures(line)}
						</article>
					{/each}
					<div class="pt-2 border-t border-gray-100" data-total={f.fund}>
						<div class="flex justify-between gap-2 text-sm font-medium text-gray-900">
							<span>{t('stages_fund_total', { fund: f.fund })}</span>
							<span>{t('stage_planned')} {fmt(f.totals.planned)}</span>
						</div>
						<StageBar stages={f.totals} label={barLabel(f.totals)} />
						{@render figures(f.totals)}
					</div>
				</section>
			{/each}
			<section class="py-3" data-total="budget">
				<div class="flex justify-between gap-2 text-sm font-semibold text-gray-900">
					<span>{t('stages_budget_total')}</span>
					<span>{t('stage_planned')} {fmt(budget.planned)}</span>
				</div>
				<StageBar stages={budget} label={barLabel(budget)} />
				{@render figures(budget)}
			</section>
		</div>
	{:else}
		<table class="w-full text-sm" data-testid="stages-table">
			<thead>
				<tr class="text-left text-xs text-gray-500 border-b border-gray-200">
					<th class="py-2 pr-3">{t('col_category')}</th>
					<th class="py-2 pr-3 w-48"><span class="sr-only">{t('stages_legend')}</span></th>
					<th class="py-2 pr-3 text-right">{t('stage_planned')}</th>
					<th class="py-2 pr-3 text-right">{t('stage_reserved')}</th>
					<th class="py-2 pr-3 text-right">{t('stage_committed')}</th>
					<th class="py-2 pr-3 text-right">{t('stage_actual')}</th>
					<th class="py-2 text-right">{t('stage_available')}</th>
				</tr>
			</thead>
			{#each funds as f (f.fund)}
				<tbody class="divide-y divide-gray-100" data-fund={f.fund}>
					<tr class="bg-gray-50">
						<th scope="rowgroup" colspan="7" class="py-2 pr-3 text-left font-semibold text-gray-900">{f.fund}</th>
					</tr>
					{#each f.lines as line (line.id)}
						<tr data-line={line.id}>
							<td class="py-2 pr-3 text-gray-600">
								<span class="capitalize">{words(line.category)}</span>{#if line.status === 'extended'}<span class="text-xs text-gray-400"> · {t('stages_extended')}</span>{/if}
							</td>
							<td class="py-2 pr-3"><StageBar stages={line} label={barLabel(line)} /></td>
							{@render cells(line)}
						</tr>
					{/each}
					<tr class="font-medium border-t border-gray-200" data-total={f.fund}>
						<td class="py-2 pr-3 text-gray-900">{t('stages_fund_total', { fund: f.fund })}</td>
						<td class="py-2 pr-3"><StageBar stages={f.totals} label={barLabel(f.totals)} /></td>
						{@render cells(f.totals)}
					</tr>
				</tbody>
			{/each}
			<tfoot>
				<tr class="font-semibold border-t border-gray-200" data-total="budget">
					<td class="py-2 pr-3 text-gray-900">{t('stages_budget_total')}</td>
					<td class="py-2 pr-3"><StageBar stages={budget} label={barLabel(budget)} /></td>
					{@render cells(budget)}
				</tr>
			</tfoot>
		</table>
	{/if}

	{#if pending.length > 0}
		<h3 class="mt-6 mb-1 text-sm font-semibold text-gray-700">{t('unadopted_title')}</h3>
		<p class="text-xs text-gray-500 mb-2">{t('unadopted_hint')}</p>
		<ul class="divide-y divide-gray-100" data-testid="unadopted">
			{#each pending as line (line.id)}
				<li class="flex justify-between gap-3 py-2 text-sm">
					<span class="min-w-0 text-gray-600">
						<span class="font-medium text-gray-900">{line.fund}</span> · <span class="capitalize">{words(line.category)}</span>
						<span class="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
							{line.status === 'draft' ? t('status_draft') : t('status_proposed')}
						</span>
					</span>
					<span class="shrink-0 font-medium text-gray-900">{fmt(line.planned)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
