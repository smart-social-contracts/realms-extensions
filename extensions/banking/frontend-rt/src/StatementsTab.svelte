<script lang="ts">
	// Importing a bank file: a camt.052 report, camt.053 statement or camt.054 notification, read and matched in the
	// browser, or a pain.002 status report on an order, which also settles the order's dispatch (accepted, or rejected
	// with the bank's reason). The file is kept encrypted and reported to the realm; what did not match is listed for a
	// person to look at.
	import type { Env } from './env';
	import { errorText, money } from './env';
	import { statementsOf, type Statement } from './lib/camt';
	import { batchOfFacts } from './lib/compose';
	import { matchStatement, reportOf, type Match } from './lib/match';
	import { confirmAtBank, failAtBank, openSealed, recordImport, type Dispatch, type Doc, type OrderFacts } from './lib/realm';
	import { acceptedByBank, statusOf, statusReportOf, type StatusReport } from './lib/status';
	import { parse } from './lib/xml';

	let { env, orders, statements, outbox, onimported }: {
		env: Env; orders: Doc[]; statements: Doc[]; outbox: Map<string, Dispatch>; onimported: () => void;
	} = $props();

	/** The file picked, its statements and each statement's matches. */
	let loaded = $state<{ name: string; file: string; parsed: Statement[]; matches: Match[][] } | null>(null);
	let saving = $state(false);
	let reviewed = $state<{ doc: Doc; matches: Match[] } | null>(null);
	/** A pain.002 picked, and the committed order it reports on. */
	let status = $state<{ name: string; file: string; report: StatusReport; order: Doc | undefined } | null>(null);

	const seen = $derived(new Set(statements.flatMap((d) => (d.facts.reports ?? []).map((r: any) => r.statement))));

	async function pick(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		try {
			const text = await file.text();
			const root = parse(text);
			if (root.children[0]?.name === 'CstmrPmtStsRpt') {
				const report = statusOf(root);
				status = { name: file.name, file: text, report, order: orders.find((d) => d.facts.message_id === report.original) };
				return;
			}
			const parsed = statementsOf(root);
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

	/** Keep the status report, and settle the order's dispatch with it if it is still waiting for the bank. */
	async function recordStatus() {
		if (!status) return;
		saving = true;
		try {
			const { report, order } = status;
			const doc = await recordImport(env.realm, env.vault, env.treasury, env.me,
				{ name: status.name, file: status.file, matches: [], reports: [statusReportOf(report)], topic: 'banking.status' }, env.language);
			const sent = order && outbox.get(order.id);
			if (sent?.status === 'queued') {
				if (acceptedByBank(report)) await confirmAtBank(env.realm, sent.id, `pain.002 ${report.messageId} ${report.status}`);
				else await failAtBank(env.realm, sent.id, `pain.002 ${report.messageId}: ${report.reason || 'rejected'}`);
			}
			env.notify('success', `Recorded as ${doc}${sent?.status === 'queued' ? ` and ${report.original} is marked ${acceptedByBank(report) ? 'accepted' : 'rejected'}` : ''}`);
			status = null;
			onimported();
		} catch (e) {
			env.notify('error', `The status report was not recorded: ${errorText(e)}`);
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
			case 'collected': return `${m.line} collected`;
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
	<label class="bk-file">Import a bank file: camt.052, camt.053 or camt.054, or a pain.002 status report
		<input type="file" accept=".xml,application/xml,text/xml" onchange={pick} />
	</label>

	{#if status}
		<div class="bk-card">
			<h4>{status.name}: status report {status.report.messageId}</h4>
			<p>
				On {status.order ? `order ${status.report.original}` : `${status.report.original}, which is no order of this realm`}:
				<strong>{status.report.status || 'per payment'}</strong>{status.report.reason ? ` (${status.report.reason})` : ''}.
			</p>
			{#if status.report.rejected.length}
				<table>
					<thead><tr><th>Rejected</th><th>Why</th></tr></thead>
					<tbody>
						{#each status.report.rejected as r (r.ref)}<tr class="bk-review"><td class="bk-mono">{r.ref}</td><td>{r.reason || '—'}</td></tr>{/each}
					</tbody>
				</table>
			{/if}
			<div class="bk-actions">
				<button type="button" class="bk-primary" disabled={saving} onclick={recordStatus}>{saving ? 'Recording…' : 'Record this report'}</button>
				<button type="button" onclick={() => (status = null)}>Cancel</button>
			</div>
		</div>
	{/if}

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
						<td class="bk-num">{reports.reduce((n: number, r: any) => n + ['paid', 'collected', 'group_booked', 'returned', 'incoming'].reduce((k, key) => k + (r[key]?.length ?? 0), 0), 0)}</td>
						<td class="bk-num">{reports.reduce((n: number, r: any) => n + r.to_review, 0)}</td>
						<td><button type="button" onclick={() => review(d)}>Open</button></td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
{/if}
