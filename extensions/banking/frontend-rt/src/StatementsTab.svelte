<script lang="ts">
	// Importing a camt.053 statement or camt.054 notification: read and matched in the browser, then the file is kept
	// encrypted and each statement reported to the realm. What did not match is listed for a person to look at.
	import type { Env } from './env';
	import { errorText, money } from './env';
	import { parseStatements, type Statement } from './lib/camt';
	import { batchOfFacts } from './lib/compose';
	import { matchStatement, reportOf, type Match } from './lib/match';
	import { openSealed, recordImport, type Doc, type OrderFacts } from './lib/realm';

	let { env, orders, statements, onimported }: { env: Env; orders: Doc[]; statements: Doc[]; onimported: () => void } = $props();

	/** The file picked, its statements and each statement's matches. */
	let loaded = $state<{ name: string; file: string; parsed: Statement[]; matches: Match[][] } | null>(null);
	let saving = $state(false);
	let reviewed = $state<{ doc: Doc; matches: Match[] } | null>(null);

	const seen = $derived(new Set(statements.flatMap((d) => (d.facts.reports ?? []).map((r: any) => r.statement))));

	async function pick(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		try {
			const text = await file.text();
			const parsed = parseStatements(text);
			const batches = orders.map((d) => batchOfFacts(d.facts as OrderFacts));
			loaded = { name: file.name, file: text, parsed, matches: parsed.map((s) => matchStatement(s, batches)) };
		} catch (e) {
			env.notify('error', `${file.name} cannot be read: ${errorText(e)}`);
		}
	}

	async function record() {
		if (!loaded) return;
		saving = true;
		try {
			const { parsed, matches } = loaded;
			const reports = parsed.map((s, i) => reportOf(s, matches[i]));
			const doc = await recordImport(env.realm, env.vault, env.treasury, env.me,
				{ name: loaded.name, file: loaded.file, matches: matches.flat(), reports }, env.language);
			env.notify('success', `Recorded as ${doc} and reported to the realm`);
			loaded = null;
			onimported();
		} catch (e) {
			env.notify('error', `The statement was not recorded: ${errorText(e)}`);
		} finally {
			saving = false;
		}
	}

	async function review(d: Doc) {
		try {
			const { data } = await openSealed<{ matches: Match[] }>(env.realm, env.vault, d.id);
			if (!data) throw new Error('it was not sealed for you');
			reviewed = { doc: d, matches: data.matches };
		} catch (e) {
			env.notify('error', `Cannot open ${d.id}: ${errorText(e)}`);
		}
	}

	function describe(m: Match): string {
		switch (m.kind) {
			case 'paid': return `${m.line} paid`;
			case 'group_booked': return `${m.group} booked as one entry: ${m.lines.length} payments, per person not on the statement`;
			case 'returned': return `${m.line} came back: the payment was returned`;
			case 'incoming': return `${m.invoice} paid (reference ${m.reference})`;
			case 'review': return `to review: ${m.reason}${m.transaction?.counterparty.name ? ` · ${m.transaction.counterparty.name}` : ''}${m.transaction?.note ? ` · ${m.transaction.note}` : ''}`;
		}
	}
</script>

{#snippet matchList(matches: Match[])}
	<table>
		<thead><tr><th>Entry</th><th>Date</th><th class="bk-num">Amount</th><th>What it is</th></tr></thead>
		<tbody>
			{#each matches as m, i (i)}
				<tr class:bk-review={m.kind === 'review'}>
					<td class="bk-mono">{m.entry}</td>
					<td>{m.date}</td>
					<td class="bk-num">{m.kind === 'review' && m.direction === 'out' ? '−' : ''}{money(m.amount, m.currency)}</td>
					<td>{describe(m)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/snippet}

{#if reviewed}
	<button type="button" onclick={() => (reviewed = null)}>← All statements</button>
	<h3>{reviewed.doc.id}</h3>
	{@render matchList(reviewed.matches)}
{:else}
	<label class="bk-file">Import a camt.053 statement or camt.054 notification
		<input type="file" accept=".xml,application/xml,text/xml" onchange={pick} />
	</label>

	{#if loaded}
		<div class="bk-card">
			<h4>{loaded.name}</h4>
			{#each loaded.parsed as s (s.id)}
				<p>
					{s.kind} {s.id}, account <span class="bk-mono">{s.account.iban}</span>, {s.entries.length} entries
					{#if seen.has(s.id)}<strong class="bk-error"> · already imported</strong>{/if}
				</p>
			{/each}
			{@render matchList(loaded.matches.flat())}
			<div class="bk-actions">
				<button type="button" class="bk-primary" disabled={saving} onclick={record}>{saving ? 'Recording…' : 'Record this import'}</button>
				<button type="button" onclick={() => (loaded = null)}>Cancel</button>
			</div>
		</div>
	{/if}

	{#if statements.length}
		<h3>Imported</h3>
		<table>
			<thead><tr><th>Record</th><th>Statements</th><th class="bk-num">Matched</th><th class="bk-num">To review</th><th></th></tr></thead>
			<tbody>
				{#each statements as d (d.id)}
					{@const reports = d.facts.reports ?? []}
					<tr>
						<td class="bk-mono">{d.id}</td>
						<td>{reports.map((r: any) => `${r.kind} ${r.statement}`).join(', ')}</td>
						<td class="bk-num">{reports.reduce((n: number, r: any) => n + r.paid.length + r.group_booked.length + r.returned.length + r.incoming.length, 0)}</td>
						<td class="bk-num">{reports.reduce((n: number, r: any) => n + r.to_review, 0)}</td>
						<td><button type="button" onclick={() => review(d)}>Open</button></td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
{/if}
