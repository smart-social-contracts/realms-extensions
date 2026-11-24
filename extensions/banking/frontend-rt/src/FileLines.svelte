<script lang="ts">
	// The per-person list of a payment or direct debit file, as the file itself writes it.
	import { printIban } from './lib/iban';
	import type { FileSummary } from './lib/review';

	let { summary }: { summary: FileSummary } = $props();
</script>

<table>
	<thead>
		<tr>
			<th>{summary.kind === 'payment' ? 'Payment id' : 'Collection id'}</th><th>{summary.kind === 'payment' ? 'Payee' : 'Payer'}</th>
			<th>IBAN</th><th class="bk-num">Amount</th><th>Reference / note</th><th>Group</th>
		</tr>
	</thead>
	<tbody>
		{#each summary.lines as l, i (i)}
			<tr>
				<td class="bk-mono">{l.id}</td>
				<td>{l.name}</td>
				<td class="bk-mono">{printIban(l.iban)}{l.bic ? ` · ${l.bic}` : ''}</td>
				<td class="bk-num">{l.amount} {l.currency}</td>
				<td>{l.reference || l.note}</td>
				<td>{l.group}{l.salary ? ' · salary' : ''}{l.sepa ? ' · SEPA' : ''}{l.sequence ? ` · ${l.sequence}` : ''}{l.mandate ? ` · mandate ${l.mandate}` : ''}</td>
			</tr>
		{/each}
	</tbody>
</table>
