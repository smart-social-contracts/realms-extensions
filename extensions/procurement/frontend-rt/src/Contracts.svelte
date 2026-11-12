<script lang="ts">
	import { t } from './lib/i18n';
	import {
		dayIn,
		decimalsFor,
		isCallOff,
		money,
		statusClass,
		suppliers,
		visibleContracts,
		type Contract,
		type RealmFacts,
	} from './contracts';

	let {
		read,
		facts,
		narrow,
		onOpen,
	}: {
		read: (name: string, args?: Record<string, unknown>) => Promise<any>;
		facts: RealmFacts;
		narrow: boolean;
		onOpen: (contract: string) => void;
	} = $props();

	let contracts = $state<Contract[]>([]);
	let loading = $state(true);
	let unavailable = $state(false);
	let onlyCallOffs = $state(false);

	let shown = $derived(visibleContracts(contracts, onlyCallOffs));
	let callOffs = $derived(contracts.filter(isCallOff).length);

	async function load() {
		const all: Contract[] = [];
		let from: number | null = 1;
		for (let pages = 0; from != null && pages < 20; pages++) {
			const res = await read('contract_list', { from, count: 500 });
			if (!res) {
				unavailable = true;
				break;
			}
			all.push(...(res.contracts ?? []));
			from = res.next ?? null;
		}
		contracts = all;
		loading = false;
	}

	function term(contract: Contract) {
		const from = dayIn(contract.starts_at, facts.zone) || '—';
		const to = dayIn(contract.ends_at, facts.zone) || t('no_end');
		return `${from} → ${to}`;
	}

	function value(contract: Contract) {
		return money(contract.value, contract.symbol, decimalsFor(contract.symbol, facts));
	}

	load();
</script>

{#snippet marks(contract: Contract)}
	{#if isCallOff(contract)}
		<span class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800" data-testid="call-off-badge">{t('badge_call_off')}</span>
	{/if}
	{#if contract.lot}
		<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{t('badge_lot', { lot: contract.lot })}</span>
	{/if}
{/snippet}

<section class="space-y-4" data-testid="contracts">
	{#if loading}
		<p class="text-gray-500">{t('contracts_loading')}</p>
	{:else if unavailable}
		<div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">{t('contracts_unavailable')}</div>
	{:else if contracts.length === 0}
		<div class="py-16 text-center">
			<p class="text-gray-500">{t('contracts_empty')}</p>
		</div>
	{:else}
		<div class="flex flex-wrap items-center gap-2" role="group" aria-label={t('contracts_filter')}>
			<button
				type="button"
				class="rounded border px-3 py-1.5 text-sm dark:border-gray-600 {onlyCallOffs ? '' : 'bg-blue-600 text-white'}"
				aria-pressed={!onlyCallOffs}
				onclick={() => (onlyCallOffs = false)}
			>
				{t('filter_all', { count: contracts.length })}
			</button>
			<button
				type="button"
				class="rounded border px-3 py-1.5 text-sm dark:border-gray-600 {onlyCallOffs ? 'bg-blue-600 text-white' : ''}"
				aria-pressed={onlyCallOffs}
				onclick={() => (onlyCallOffs = true)}
			>
				{t('filter_call_offs', { count: callOffs })}
			</button>
		</div>

		{#if shown.length === 0}
			<p class="py-8 text-center text-gray-500" data-testid="no-call-offs">{t('contracts_no_call_offs')}</p>
		{:else if narrow}
			<div class="divide-y divide-gray-200 dark:divide-gray-700">
				{#each shown as contract (contract.id)}
					<article class="py-3" data-testid="contract-row">
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<div class="font-medium text-gray-900 dark:text-white">{contract.title}</div>
								<div class="mt-0.5 font-mono text-xs text-gray-400">{contract.id}</div>
							</div>
							<span class="shrink-0 rounded-full px-2 py-0.5 text-xs {statusClass(contract.status)}">{t(`contract_status_${contract.status}`)}</span>
						</div>
						<div class="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-500">
							<span>{suppliers(contract).join(', ') || '—'} · {value(contract)}</span>
							{@render marks(contract)}
						</div>
						<div class="mt-1 flex items-center justify-between text-xs text-gray-500">
							<span>{term(contract)}</span>
							<button type="button" class="text-blue-600" onclick={() => onOpen(contract.id)}>{t('open')}</button>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
				<table class="w-full table-fixed text-sm">
					<thead class="bg-gray-50 text-left text-gray-600 dark:bg-gray-800 dark:text-gray-300">
						<tr>
							<th class="w-24 px-4 py-3">{t('col_reference')}</th>
							<th class="px-4 py-3">{t('col_contract')}</th>
							<th class="w-36 px-4 py-3">{t('col_supplier')}</th>
							<th class="w-36 px-4 py-3 text-right">{t('col_value')}</th>
							<th class="w-28 px-4 py-3">{t('col_status')}</th>
							<th class="w-56 px-4 py-3">{t('col_term')}</th>
							<th class="w-20 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#each shown as contract (contract.id)}
							<tr class="border-t border-gray-100 dark:border-gray-700" data-testid="contract-row">
								<td class="px-4 py-3 font-mono text-xs">{contract.id}</td>
								<td class="px-4 py-3">
									<div class="truncate">{contract.title}</div>
									<div class="mt-1 flex flex-wrap gap-1">{@render marks(contract)}</div>
								</td>
								<td class="truncate px-4 py-3">{suppliers(contract).join(', ') || '—'}</td>
								<td class="px-4 py-3 text-right">{value(contract)}</td>
								<td class="px-4 py-3">
									<span class="rounded-full px-2 py-0.5 text-xs {statusClass(contract.status)}">{t(`contract_status_${contract.status}`)}</span>
								</td>
								<td class="px-4 py-3 text-gray-500">{term(contract)}</td>
								<td class="px-4 py-3 text-right">
									<button type="button" class="text-blue-600 hover:underline" onclick={() => onOpen(contract.id)}>{t('open')}</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</section>
