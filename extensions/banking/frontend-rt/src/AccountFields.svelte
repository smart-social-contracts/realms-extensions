<script lang="ts">
	// The fields of a bank account: the name the bank knows its holder by, the IBAN, a BIC for payments abroad, and
	// the structured postal address SPS and SEPA ask for (town and country at least).
	import type { AccountForm } from './env';
	import { ibanProblem } from './lib/iban';

	let { form = $bindable() }: { form: AccountForm } = $props();
	const ibanError = $derived(form.iban ? ibanProblem(form.iban) : null);
</script>

<div class="bk-grid">
	<label>Name at the bank <input bind:value={form.name} maxlength="70" /></label>
	<label>IBAN <input bind:value={form.iban} class:bk-bad={!!ibanError} placeholder="CH93 0076 2011 6238 5295 7" /></label>
	<label>BIC (abroad) <input bind:value={form.bic} maxlength="11" /></label>
	<label>Street <input bind:value={form.street} /></label>
	<label>Number <input bind:value={form.building} /></label>
	<label>Post code <input bind:value={form.postCode} /></label>
	<label>Town <input bind:value={form.town} /></label>
	<label>Country <input bind:value={form.country} maxlength="2" /></label>
</div>
{#if ibanError}<p class="bk-error">{ibanError}</p>{/if}
<p class="bk-muted">A town and a two-letter country are required: banks take structured addresses only since November 2026.</p>
