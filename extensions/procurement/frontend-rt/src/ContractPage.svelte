<script lang="ts">
	import { formatInZone } from '../../../_shared/frontend/realm-time';
	import AmendmentForm from './AmendmentForm.svelte';
	import { t } from './lib/i18n';
	import {
		dayIn,
		decimalsFor,
		holderOf,
		isCallOff,
		money,
		proposalPath,
		shortId,
		splitText,
		statusClass,
		suppliers,
		termChanges,
		type Amendment,
		type AmendmentRule,
		type Contract,
		type RealmFacts,
		type TermChange,
	} from './contracts';

	type Read = (name: string, args?: Record<string, unknown>) => Promise<any>;

	let {
		read,
		run,
		facts,
		contractId,
		mayAmend,
		onOpenTender,
		navigate,
	}: {
		read: Read;
		run: (name: string, args: Record<string, unknown>) => Promise<any>;
		facts: RealmFacts;
		contractId: string;
		mayAmend: boolean;
		onOpenTender: (tender: string) => void;
		navigate: (path: string) => void;
	} = $props();

	let contract = $state<Contract | null>(null);
	let amendments = $state<Amendment[]>([]);
	let next = $state<number | null>(null);
	// What an amendment is held to, as the realm says it; null when the realm does not say.
	let rule = $state<AmendmentRule | null>(null);
	let tenderTitle = $state('');
	let lotTitle = $state('');
	let loading = $state(true);
	let missing = $state(false);
	let applied = $state(false);

	let decimals = $derived(contract ? decimalsFor(contract.symbol, facts) : 0);
	let holder = $derived(contract?.framework ? holderOf(contract.framework, facts.externals, facts.realms) : null);

	function amount(value: number) {
		return money(value, contract?.symbol ?? '', decimals);
	}

	function day(epoch: number) {
		return dayIn(epoch, facts.zone) || '—';
	}

	async function load() {
		loading = true;
		missing = false;
		applied = false;
		const res = await read('contract_get', { contract: contractId });
		if (!res?.contract) {
			contract = null;
			missing = true;
			loading = false;
			return;
		}
		contract = res.contract;
		amendments = res.amendments ?? [];
		next = res.next ?? null;
		rule =
			'paid' in res
				? { paid: res.paid, governed_by: res.governed_by, needs_vote: !!res.needs_vote, budgets: res.budgets ?? [] }
				: null;
		loading = false;
		await loadOrigin(res.contract);
	}

	/** The tender the contract came from, for its title and the title of its lot: nothing breaks when it cannot be read. */
	async function loadOrigin(of: Contract) {
		tenderTitle = '';
		lotTitle = '';
		if (!of.tender) return;
		const res = await read('tender_get', { tender: of.tender });
		tenderTitle = res?.tender?.title ?? '';
		lotTitle = (res?.tender?.lots ?? []).find((lot: { id: string }) => lot.id === of.lot)?.title ?? '';
	}

	async function more() {
		if (next === null) return;
		const res = await read('contract_get', { contract: contractId, from: next });
		if (!res) return;
		amendments = [...amendments, ...(res.amendments ?? [])];
		next = res.next ?? null;
	}

	/** The amendment was applied at once: read the contract again, with its new amendment and a form from its new terms. */
	async function reload() {
		await load();
		applied = true;
	}

	function change(item: TermChange, side: 'before' | 'after') {
		const value = item[side];
		if (item.term === 'value') return amount(value as number);
		if (item.term === 'split') {
			const split = value as Amendment['before']['split'];
			return split.length ? splitText(split, contract?.symbol ?? '', decimals) : t('not_spread');
		}
		return day(value as number) === '—' ? t('no_date') : day(value as number);
	}

	function follow(event: MouseEvent, path: string) {
		// A click that asks for something else (a new tab) is left to the browser.
		if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		navigate(path);
	}

	load();
</script>

{#if loading}
	<p class="text-gray-500">{t('contract_loading')}</p>
{:else if missing || !contract}
	<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{t('contract_missing')}</div>
{:else}
	<div class="space-y-4 sm:space-y-6" data-testid="contract-page">
		{#if applied}
			<div class="rounded-lg bg-green-50 p-3 text-sm text-green-800" data-testid="amend-applied">{t('amend_applied')}</div>
		{/if}
		<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700">
			<div class="flex flex-wrap items-center gap-2">
				<h2 class="text-lg font-medium">{contract.title}</h2>
				<span class="rounded-full px-2 py-0.5 text-xs {statusClass(contract.status)}" data-testid="contract-status">{t(`contract_status_${contract.status}`)}</span>
				{#if isCallOff(contract)}
					<span class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">{t('badge_call_off')}</span>
				{/if}
				<span class="font-mono text-xs text-gray-500">{contract.id}</span>
			</div>

			<dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
				<div>
					<dt class="text-gray-500">{t('term_supplier')}</dt>
					<dd data-testid="contract-supplier">{suppliers(contract).join(', ') || '—'}</dd>
				</div>
				<div>
					<dt class="text-gray-500">{t('term_value')}</dt>
					<dd data-testid="contract-value">{amount(contract.value)}</dd>
				</div>
				<div>
					<dt class="text-gray-500">{t('term_starts_at')}</dt>
					<dd data-testid="contract-starts">{day(contract.starts_at)}</dd>
				</div>
				<div>
					<dt class="text-gray-500">{t('term_ends_at')}</dt>
					<dd data-testid="contract-ends">{contract.ends_at ? day(contract.ends_at) : t('no_end')}</dd>
				</div>
				{#if contract.kind || contract.procedure}
					<div>
						<dt class="text-gray-500">{t('term_kind')}</dt>
						<dd>{[contract.kind, contract.procedure].filter(Boolean).join(' · ')}</dd>
					</div>
				{/if}
				{#if rule}
					<div>
						<dt class="text-gray-500">{t('term_paid')}</dt>
						<dd data-testid="contract-paid">{t('paid_of', { paid: amount(rule.paid), value: amount(contract.value) })}</dd>
					</div>
					<div>
						<dt class="text-gray-500">{t('term_budget')}</dt>
						<dd data-testid="contract-budget">
							{#if rule.budgets.length}
								{#each rule.budgets as line}
									<div>{t('budget_line', { fund: line.fund, category: line.category, period: line.period })} <span class="font-mono text-xs text-gray-400">{line.id}</span></div>
								{/each}
							{:else}
								<span class="text-gray-500">{t('budget_none')}</span>
							{/if}
						</dd>
					</div>
				{/if}
			</dl>
		</section>

		<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700" data-testid="contract-split">
			<h3 class="font-medium">{t('split_title')}</h3>
			{#if contract.split.length === 0}
				<p class="mt-1 text-sm text-gray-500">{t('not_spread')}</p>
			{:else}
				<table class="mt-2 w-full text-sm">
					<thead class="text-left text-gray-500">
						<tr><th class="py-1 pr-4">{t('split_period')}</th><th class="py-1 text-right">{t('split_amount')}</th></tr>
					</thead>
					<tbody>
						{#each contract.split as row}
							<tr class="border-t border-gray-100 dark:border-gray-700"><td class="py-1 pr-4">{row.period}</td><td class="py-1 text-right">{amount(row.amount)}</td></tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>

		{#if contract.tender}
			<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700" data-testid="contract-origin">
				<h3 class="font-medium">{t('origin_title')}</h3>
				<p class="mt-1 text-sm">
					<button type="button" class="text-blue-600 hover:underline" onclick={() => onOpenTender(contract!.tender)}>
						{t('origin_tender', { tender: contract.tender })}{tenderTitle ? ` — ${tenderTitle}` : ''}
					</button>
				</p>
				{#if contract.lot}
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-300" data-testid="contract-lot">
						{t('origin_lot', { lot: contract.lot })}{lotTitle ? ` — ${lotTitle}` : ''}
					</p>
				{/if}
			</section>
		{/if}

		{#if contract.framework && holder}
			<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700" data-testid="contract-framework">
				<h3 class="font-medium">{t('framework_title')}</h3>
				<dl class="mt-2 grid gap-3 text-sm sm:grid-cols-2">
					<div>
						<dt class="text-gray-500">{t(holder.kind === 'external' ? 'framework_holder_body' : 'framework_holder_realm')}</dt>
						<dd data-testid="framework-holder">
							{#if holder.name}
								{holder.name}{holder.body ? ` (${holder.body})` : ''}
							{:else}
								<span title={holder.id}>{holder.kind === 'external' ? holder.id : t('framework_realm_unnamed', { id: shortId(holder.id) })}</span>
							{/if}
						</dd>
					</div>
					<div>
						<dt class="text-gray-500">{t('framework_reference')}</dt>
						<dd class="font-mono" data-testid="framework-reference">{contract.framework.reference}</dd>
					</div>
					<div class="sm:col-span-2">
						<dt class="text-gray-500">{t('framework_winners')}</dt>
						<dd data-testid="framework-winners">
							{#if contract.framework.winners.length}
								{contract.framework.winners.join(', ')}
							{:else}
								<span class="text-gray-500">{t('framework_winners_unknown')}</span>
							{/if}
						</dd>
					</div>
				</dl>
			</section>
		{/if}

		<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700" data-testid="amendments">
			<h3 class="font-medium">{t('amendments_title', { count: amendments.length })}</h3>
			{#if amendments.length === 0}
				<p class="mt-1 text-sm text-gray-500">{t('amendments_none')}</p>
			{:else}
				<ol class="mt-2 space-y-3">
					{#each amendments as item, index (item.id)}
						<li class="rounded-lg border border-gray-100 p-3 text-sm dark:border-gray-700" data-testid="amendment">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<span class="font-medium">{t('amendment_number', { number: index + 1 })}</span>
								<span class="text-xs text-gray-500" data-testid="amendment-at">{t('amendment_took_effect', { time: formatInZone(item.at, facts.zone) })}</span>
							</div>
							<ul class="mt-2 space-y-1">
								{#each termChanges(item.before, item.after) as changed}
									<li data-testid="amendment-change">
										<span class="text-gray-500">{t(`term_${changed.term}`)}:</span>
										{change(changed, 'before')} → <strong>{change(changed, 'after')}</strong>
									</li>
								{/each}
							</ul>
							<p class="mt-2 text-xs text-gray-500" data-testid="amendment-decision">
								{#if item.proposal}
									{@const path = proposalPath(item.proposal, window.location.pathname)}
									<a class="text-blue-600 hover:underline" href={path} onclick={(event) => follow(event, path)}>{t('amendment_proposal', { proposal: item.proposal })}</a>
								{:else}
									{t('amendment_direct')}
								{/if}
							</p>
						</li>
					{/each}
				</ol>
				{#if next !== null}
					<button type="button" class="mt-3 text-sm text-blue-600 hover:underline" onclick={more}>{t('amendments_more')}</button>
				{/if}
			{/if}
		</section>

		{#if rule}
			<AmendmentForm {contract} {rule} {facts} {mayAmend} {run} onApplied={reload} />
		{:else}
			<p class="text-sm text-gray-500" data-testid="amend-rule-unknown">{t('amend_rule_unknown')}</p>
		{/if}
	</div>
{/if}
