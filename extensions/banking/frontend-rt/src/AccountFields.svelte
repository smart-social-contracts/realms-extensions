<script lang="ts">
	// The fields of a bank account: the name the bank knows its holder by, the account as its country numbers it (an
	// IBAN; or the bank's clearing code and the account number, as in the United States, Canada, Australia and India;
	// elsewhere the account number and the bank's BIC), a BIC for payments abroad, and the structured postal address
	// banks ask for (town and country at least).
	import type { AccountForm } from './env';
	import { countryOf, localScheme, usesIban } from './lib/countries';
	import { ibanProblem } from './lib/iban';

	let { form = $bindable() }: { form: AccountForm } = $props();
	const country = $derived(form.country.trim().toUpperCase());
	const byIban = $derived(!/^[A-Z]{2}$/.test(country) || usesIban(country));
	const scheme = $derived(byIban ? null : localScheme(country));
	const ibanError = $derived(byIban && form.iban ? ibanProblem(form.iban) : null);
	const codeError = $derived(scheme && form.code && !scheme.code(form.code) ? `Not a valid ${scheme.codeLabel} (like ${scheme.codeExample})` : null);
	const numberError = $derived(scheme && form.number ? scheme.numberProblem(form.number) : null);
</script>

<div class="bk-grid">
	<label>Name at the bank <input bind:value={form.name} maxlength="70" /></label>
	<label>Country <input bind:value={form.country} maxlength="2" title={countryOf(country).name} /></label>
	{#if byIban}
		<label>IBAN <input bind:value={form.iban} class:bk-bad={!!ibanError} placeholder="CH93 0076 2011 6238 5295 7" /></label>
		<label>BIC (abroad) <input bind:value={form.bic} maxlength="11" /></label>
	{:else if scheme}
		<label>{scheme.codeLabel} <input bind:value={form.code} class:bk-bad={!!codeError} placeholder={scheme.codeExample} /></label>
		<label>{scheme.numberLabel} <input bind:value={form.number} class:bk-bad={!!numberError} inputmode="numeric" /></label>
		<label>BIC (abroad) <input bind:value={form.bic} maxlength="11" /></label>
	{:else}
		<label>Account number <input bind:value={form.number} maxlength="34" /></label>
		<label>BIC of the bank <input bind:value={form.bic} maxlength="11" /></label>
	{/if}
	<label>Street <input bind:value={form.street} /></label>
	<label>Number <input bind:value={form.building} /></label>
	<label>Post code <input bind:value={form.postCode} /></label>
	<label>Town <input bind:value={form.town} /></label>
</div>
{#if ibanError}<p class="bk-error">{ibanError}</p>{/if}
{#if codeError}<p class="bk-error">{codeError}</p>{/if}
{#if numberError}<p class="bk-error">{numberError}</p>{/if}
{#if !byIban && !scheme}
	<p class="bk-muted">{country} has no IBANs: the account is paid by its number at the bank the BIC names.</p>
{/if}
<p class="bk-muted">A town and a two-letter country are required: banks take structured addresses only since November 2026.</p>
