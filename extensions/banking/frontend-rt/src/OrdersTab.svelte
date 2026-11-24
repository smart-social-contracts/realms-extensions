<script lang="ts">
	// The committed orders and their way through the bank: in the outbox, accepted by the bank (the e-banking's order
	// reference as the receipt), and what the statements booked. Opening one shows the per-person list read from the
	// committed file, for the second signatory to compare with the e-banking screen before signing.
	import type { Env } from './env';
	import { errorText, money, saveFile } from './env';
	import FileLines from './FileLines.svelte';
	import { printIban } from './lib/iban';
	import { commitApproved, confirmAtBank, openSealed, sha256Hex, type Dispatch, type Doc, type OrderFacts } from './lib/realm';
	import { readOrderFile, type FileSummary } from './lib/review';

	type Approval = { status: string; outcome: 'pending' | 'approved' | 'rejected'; yes: number; eligible: number };
	let { env, orders, outbox, booked, approvals, onchanged }: {
		env: Env; orders: Doc[]; outbox: Map<string, Dispatch>; booked: Map<string, string>; approvals: Map<string, Approval>;
		onchanged: () => void;
	} = $props();
	let committing = $state('');

	let open = $state<{ doc: Doc; file: string; summary: FileSummary; hashOk: boolean } | null>(null);
	let opening = $state('');
	let receipt = $state('');

	const factsOf = (d: Doc) => d.facts as OrderFacts;

	function totals(facts: OrderFacts): string {
		const sums = new Map<string, number>();
		for (const [, amount, currency] of facts.lines) sums.set(currency, (sums.get(currency) ?? 0) + amount);
		return [...sums].map(([c, a]) => money(a, c)).join(' + ');
	}

	/** A file from the ERP waits for the treasury's vote before it may go to the bank. */
	function vote(d: Doc): string | null {
		const facts = factsOf(d);
		const approval = approvals.get(d.id);
		if (!facts.proposal || outbox.has(d.id) || !approval) return null;
		if (approval.outcome === 'pending') return `voting on ${facts.proposal}: ${approval.yes} of ${approval.eligible} yes`;
		if (approval.outcome === 'rejected') return `${facts.proposal} ${approval.status}: not to be paid`;
		return `approved by ${facts.proposal}: commit it for the bank`;
	}

	async function commit(d: Doc) {
		committing = d.id;
		try {
			const dispatch = await commitApproved(env.realm, d.id, factsOf(d));
			env.notify('success', `${factsOf(d).message_id} is committed for the bank (${dispatch}): upload the same file in the e-banking`);
			onchanged();
		} catch (e) {
			env.notify('error', errorText(e));
		} finally {
			committing = '';
		}
	}

	function status(d: Doc): string {
		const waiting = vote(d);
		if (waiting) return waiting;
		const sent = outbox.get(d.id);
		const lines = factsOf(d).lines;
		const bookedCount = lines.filter(([id]) => booked.has(id)).length;
		const bank = !sent ? 'not in the outbox' : sent.status === 'confirmed' ? `accepted by the bank (${sent.receipt})` : sent.status === 'failed' ? 'rejected by the bank' : 'waiting for the e-banking';
		return bookedCount ? `${bank}; ${bookedCount} of ${lines.length} booked` : bank;
	}

	async function show(d: Doc) {
		opening = d.id;
		try {
			const { data } = await openSealed<{ file: string }>(env.realm, env.vault, d.id);
			if (!data) throw new Error('this order was not sealed for you: ask a colleague to share the register again');
			open = { doc: d, file: data.file, summary: readOrderFile(data.file), hashOk: (await sha256Hex(data.file)) === factsOf(d).file_sha256 };
			receipt = '';
		} catch (e) {
			env.notify('error', `Cannot open ${d.id}: ${errorText(e)}`);
		} finally {
			opening = '';
		}
	}

	async function accepted() {
		const sent = open && outbox.get(open.doc.id);
		if (!sent || !receipt.trim()) return;
		try {
			await confirmAtBank(env.realm, sent.id, receipt.trim());
			env.notify('success', `${factsOf(open!.doc).message_id} is recorded as accepted by the bank`);
			onchanged();
		} catch (e) {
			env.notify('error', errorText(e));
		}
	}
</script>

{#if open}
	{@const facts = factsOf(open.doc)}
	{@const sent = outbox.get(open.doc.id)}
	<div class="bk-actions">
		<button type="button" onclick={() => (open = null)}>← All orders</button>
		<button type="button" onclick={() => window.print()}>Print</button>
		<button type="button" disabled={!open.hashOk} onclick={() => saveFile(`${facts.message_id}.xml`, open!.file)}>Download again</button>
	</div>
	<h3>Check before signing: {facts.message_id}</h3>
	<p class:bk-ok={open.hashOk} class:bk-error={!open.hashOk}>
		{open.hashOk
			? `The file is the one committed on ${facts.created_at.slice(0, 10)} (sha256 ${facts.file_sha256.slice(0, 16)}…).`
			: 'The file does not match the sha256 the realm committed: do not sign it.'}
	</p>
	<p>
		{open.summary.kind === 'payment' ? 'Paid from' : 'Collected into'} <strong>{open.summary.account.name}</strong>,
		<span class="bk-mono">{printIban(open.summary.account.iban)}</span>, on {facts.execution_date}.
		{open.summary.count} {open.summary.kind === 'payment' ? 'payments' : 'collections'}, control sum {open.summary.controlSum}.
	</p>
	<p class="bk-muted">
		Compare every line with the e-banking screen before you sign. A bank that books a salary group as one entry never
		shows these lines again: this list is the only per-person check.
	</p>
	<FileLines summary={open.summary} />

	{#if vote(open.doc)}
		<p><strong>{vote(open.doc)}</strong></p>
	{/if}
	{#if sent?.status === 'queued'}
		<div class="bk-card">
			<h4>Accepted by the bank?</h4>
			<p class="bk-muted">Once both signatures are in the e-banking, enter the bank's order reference.</p>
			<div class="bk-actions">
				<input bind:value={receipt} placeholder="e-banking order reference" />
				<button type="button" class="bk-primary" disabled={!receipt.trim()} onclick={accepted}>Record as accepted</button>
			</div>
		</div>
	{:else if sent}
		<p>Bank: {status(open.doc)}</p>
	{/if}
{:else if orders.length}
	<table>
		<thead><tr><th>Order</th><th>Kind</th><th>Execution</th><th class="bk-num">Payments</th><th class="bk-num">Total</th><th>Status</th><th></th></tr></thead>
		<tbody>
			{#each orders as d (d.id)}
				{@const facts = factsOf(d)}
				<tr>
					<td class="bk-mono">{facts.message_id}</td>
					<td>{facts.kind === 'collection' ? 'collection' : 'payment'}{facts.source === 'erp' ? ' · from the ERP' : ''}</td>
					<td>{facts.execution_date}</td>
					<td class="bk-num">{facts.lines.length}</td>
					<td class="bk-num">{totals(facts)}</td>
					<td>{status(d)}</td>
					<td class="bk-actions">
						<button type="button" disabled={opening === d.id} onclick={() => show(d)}>{opening === d.id ? 'Opening…' : 'Check'}</button>
						{#if approvals.get(d.id)?.outcome === 'approved' && !outbox.has(d.id)}
							<button type="button" class="bk-primary" disabled={committing === d.id} onclick={() => commit(d)}>Commit for the bank</button>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<p class="bk-muted">No payment order yet.</p>
{/if}
