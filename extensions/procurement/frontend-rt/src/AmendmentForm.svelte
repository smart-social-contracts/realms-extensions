<script lang="ts">
	import { untrack } from 'svelte';
	import { formatUnits, toBaseUnits } from '../../../_shared/frontend/units';
	import { t } from './lib/i18n';
	import {
		amendment,
		dayIn,
		decimalsFor,
		money,
		splitTotal,
		termsOf,
		type AmendmentRule,
		type Contract,
		type RealmFacts,
	} from './contracts';

	let {
		contract,
		rule,
		facts,
		mayAmend,
		run,
		onApplied,
	}: {
		contract: Contract;
		rule: AmendmentRule;
		facts: RealmFacts;
		mayAmend: boolean;
		run: (name: string, args: Record<string, unknown>) => Promise<any>;
		onApplied: () => void;
	} = $props();

	let decimals = $derived(decimalsFor(contract.symbol, facts));

	function amounts(amount: number) {
		return formatUnits(amount, decimals);
	}

	// The form starts from the contract's terms (it is made again when the contract is read again); what the person leaves
	// as it is stays out of the amendment.
	const start = untrack(() => ({
		value: amounts(contract.value),
		split: contract.split.map((row) => ({ period: row.period, amount: amounts(row.amount) })),
		starts: dayIn(contract.starts_at, facts.zone),
		ends: dayIn(contract.ends_at, facts.zone),
	}));
	let value = $state(start.value);
	let split = $state(start.split);
	let starts = $state(start.starts);
	let ends = $state(start.ends);
	let busy = $state(false);
	let error = $state('');
	let filed = $state('');

	// The periods of a split that adds up to the value: shown while a person edits them, checked by the realm on filing.
	let total = $derived(
		split.length ? splitTotal(split.map((row) => ({ period: row.period, amount: toBaseUnits(row.amount, decimals) ?? 0 }))) : null,
	);
	let wanted = $derived(toBaseUnits(value, decimals));

	function addPeriod() {
		split = [...split, { period: '', amount: '' }];
	}

	function removePeriod(index: number) {
		split = split.filter((_, i) => i !== index);
	}

	async function submit() {
		error = '';
		filed = '';
		const built = amendment(termsOf(contract), { value, split, starts, ends }, decimals, facts.zone);
		if (built.problem) {
			error = t(`amend_problem_${built.problem}`, { decimals });
			return;
		}
		busy = true;
		try {
			const reply = await run('contract_amend', { contract: contract.id, ...built.args });
			if (!reply?.ok) throw new Error(reply?.error || t('amend_refused'));
			if (reply.proposal) filed = t('amend_filed', { proposal: reply.proposal });
			else onApplied();
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}
</script>

<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700" data-testid="amendment-form">
	<h3 class="font-medium">{t('amend_title')}</h3>

	<ul class="mt-2 space-y-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300" data-testid="amend-rule">
		<li data-testid="amend-floor">{t('amend_rule_floor', { paid: money(rule.paid, contract.symbol, decimals) })}</li>
		<li data-testid="amend-vote">
			{t(rule.needs_vote ? 'amend_rule_vote' : 'amend_rule_direct', { department: rule.governed_by })}
		</li>
	</ul>

	{#if !mayAmend}
		<p class="mt-3 text-sm text-gray-500" data-testid="amend-denied">{t('amend_denied')}</p>
	{:else}
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			<label class="block md:col-span-2">
				<span class="text-sm text-gray-600">{t('amend_value', { symbol: contract.symbol })}</span>
				<input class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" inputmode="decimal" bind:value />
			</label>

			<fieldset class="md:col-span-2">
				<legend class="text-sm text-gray-600">{t('amend_split')}</legend>
				{#each split as row, index}
					<div class="mt-1 flex items-center gap-2" data-testid="split-row">
						<input
							class="w-32 rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
							aria-label={t('amend_period')}
							placeholder={t('amend_period')}
							bind:value={row.period}
						/>
						<input
							class="min-w-0 flex-1 rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900"
							aria-label={t('amend_period_amount')}
							placeholder={t('amend_period_amount')}
							inputmode="decimal"
							bind:value={row.amount}
						/>
						<button type="button" class="text-sm text-red-600" onclick={() => removePeriod(index)}>{t('amend_remove_period')}</button>
					</div>
				{/each}
				{#if total !== null && wanted !== null}
					<p class="mt-1 text-xs {total === wanted ? 'text-gray-500' : 'text-red-700'}" data-testid="split-total">
						{t('amend_split_total', { total: money(total, contract.symbol, decimals), value: money(wanted, contract.symbol, decimals) })}
					</p>
				{:else if split.length === 0}
					<p class="mt-1 text-xs text-gray-500">{t('amend_not_spread')}</p>
				{/if}
				<button type="button" class="mt-2 text-sm text-blue-600 hover:underline" onclick={addPeriod}>{t('amend_add_period')}</button>
			</fieldset>

			<label class="block">
				<span class="text-sm text-gray-600">{t('amend_starts')}</span>
				<input type="date" class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" bind:value={starts} />
			</label>
			<label class="block">
				<span class="text-sm text-gray-600">{t('amend_ends')}</span>
				<input type="date" class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" bind:value={ends} />
			</label>
		</div>

		{#if error}
			<div class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="amend-error">{error}</div>
		{/if}
		{#if filed}
			<div class="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800" data-testid="amend-filed">{filed}</div>
		{/if}

		<button
			type="button"
			class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
			disabled={busy}
			onclick={submit}
		>
			{busy ? t('amend_submitting') : rule.needs_vote ? t('amend_submit_vote') : t('amend_submit')}
		</button>
	{/if}
</section>
