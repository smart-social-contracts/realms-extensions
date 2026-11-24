<script lang="ts">
	// A new order: payments to the register's payees (pain.001), or a collection from those who gave the realm a direct
	// debit mandate (pain.008). Each line is checked as it is typed by the chosen format. Committing records the file's
	// sha256 and lines in the realm first; only then is the file handed to the treasurer.
	import type { Env } from './env';
	import { errorText } from './env';
	import { collectionOf, createdAt, defaultFormat, factsOf, nextMessageId, orderOf, type Draft, type DraftLine } from './lib/compose';
	import { COLLECTION_FORMATS, collectionFormatById, FORMATS, formatById } from './lib/formats';
	import type { Problem } from './lib/order';
	import { commitOrder, profileOf, sha256Hex, type Doc, type OrderFacts, type Register } from './lib/realm';

	let { env, register, orders, oncommitted }: { env: Env; register: Register; orders: Doc[]; oncommitted: (doc: string) => void } =
		$props();

	const software = () => ({ name: 'Realms Banking', version: env.version });
	const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
	const currency = () => profileOf(register).currency;
	const blankLine = (): DraftLine => ({
		payee: '', amount: '', currency: currency(), salary: false, sequence: 'OOFF', referenceKind: '', reference: '', note: '',
	});

	let mode = $state<'pay' | 'collect'>('pay');
	let draft = $state<Draft>({ executionDate: inDays(1), lines: [blankLine()] });
	// Defaults the treasurer may change: picked from the account the tab opened with.
	// svelte-ignore state_referenced_locally
	let payFormat = $state(defaultFormat(register));
	// svelte-ignore state_referenced_locally
	let collectFormat = $state(['CH', 'LI'].includes(profileOf(register).country) ? 'ch-dd' : 'sepa-dd-2025');
	let committing = $state(false);

	/** The order as it would be committed now: its id, every problem with it, and, when it can be written, its file and
	 * the facts the realm keeps of it. */
	function build(now: Date): { messageId: string; problems: Problem[]; write?: () => string; facts?: (sha: string) => OrderFacts } {
		const messageId = nextMessageId(now, orders);
		if (mode === 'pay') {
			const format = formatById(payFormat);
			const { order, problems } = orderOf(register, draft, messageId, createdAt(now), software());
			if (!order) return { messageId, problems };
			return { messageId, problems: [...problems, ...format.problems(order)], write: () => format.write(order),
				facts: (sha) => factsOf(order, format, draft, sha) };
		}
		const format = collectionFormatById(collectFormat);
		const { order, problems } = collectionOf(register, draft, collectFormat, messageId, createdAt(now), software());
		if (!order) return { messageId, problems };
		return { messageId, problems: [...problems, ...format.problems(order)], write: () => format.write(order),
			facts: (sha) => factsOf(order, format, draft, sha) };
	}

	const preview = $derived(build(new Date()));
	const sepaCollection = $derived(mode === 'collect' && collectFormat === 'sepa-dd-2025');
	const payees = $derived(sepaCollection ? register.payees.filter((p) => p.mandate) : register.payees);
	const payeeName = (id: string) => register.payees.find((p) => p.id === id)?.name ?? '';

	async function commit() {
		committing = true;
		try {
			const order = build(new Date());
			if (order.problems.length || !order.write || !order.facts) throw new Error('the order still has problems');
			const file = order.write();
			const facts = order.facts(await sha256Hex(file));
			const { document } = await commitOrder(env.realm, env.vault, env.treasury, env.me, facts, file, env.language);
			await env.save(`${order.messageId}.xml`, file);
			env.notify('success', `${order.messageId} is committed (${document}) and downloaded: upload it in the e-banking`);
			draft = { executionDate: draft.executionDate, lines: [blankLine()] };
			oncommitted(document);
		} catch (e) {
			env.notify('error', `Nothing was downloaded: ${errorText(e)}`);
		} finally {
			committing = false;
		}
	}
</script>

{#if !register.account}
	<p class="bk-error">Add the realm's own account to the register first.</p>
{:else if !register.payees.length}
	<p class="bk-error">Add the payees to the register first.</p>
{:else}
	<div class="bk-grid">
		<label>What
			<select bind:value={mode}>
				<option value="pay">Pay (credit transfers)</option>
				<option value="collect">Collect (direct debits)</option>
			</select>
		</label>
		<label>{mode === 'pay' ? 'Execution date' : 'Collection date'} <input type="date" bind:value={draft.executionDate} /></label>
		<label>File format
			{#if mode === 'pay'}
				<select bind:value={payFormat}>{#each FORMATS as f (f.id)}<option value={f.id}>{f.label}</option>{/each}</select>
			{:else}
				<select bind:value={collectFormat}>{#each COLLECTION_FORMATS as f (f.id)}<option value={f.id}>{f.label}</option>{/each}</select>
			{/if}
		</label>
	</div>
	{#if sepaCollection && !payees.length}
		<p class="bk-error">Nobody in the register has a SEPA mandate yet: add one to a payee first.</p>
	{/if}

	<table>
		<thead>
			<tr>
				<th>{mode === 'pay' ? 'Payee' : 'Payer'}</th><th>Amount</th><th>Currency</th>
				<th>{mode === 'pay' ? 'Salary' : 'Sequence'}</th><th>Reference</th><th>Note</th><th></th>
			</tr>
		</thead>
		<tbody>
			{#each draft.lines as line, i (i)}
				<tr>
					<td>
						<select bind:value={line.payee}>
							<option value="">Choose…</option>
							{#each payees as p (p.id)}<option value={p.id}>{p.id} · {p.name}</option>{/each}
						</select>
					</td>
					<td><input class="bk-amount" bind:value={line.amount} inputmode="decimal" placeholder="0.00" /></td>
					<td><input class="bk-ccy" bind:value={line.currency} maxlength="3" /></td>
					<td>
						{#if mode === 'pay'}
							<input type="checkbox" bind:checked={line.salary} aria-label="Salary" />
						{:else}
							<select bind:value={line.sequence} aria-label="Sequence">
								<option value="OOFF">One-off</option><option value="RCUR">Recurring</option>
								{#if sepaCollection}<option value="FRST">First</option><option value="FNAL">Final</option>{/if}
							</select>
						{/if}
					</td>
					<td>
						<select bind:value={line.referenceKind}>
							<option value="">None</option>
							{#if mode === 'pay'}<option value="QRR">QR reference</option>{/if}
							<option value="SCOR">RF reference</option>
						</select>
						{#if line.referenceKind}<input bind:value={line.reference} />{/if}
					</td>
					<td><input bind:value={line.note} maxlength="140" /></td>
					<td><button type="button" onclick={() => (draft.lines = draft.lines.filter((_, j) => j !== i))}>Remove</button></td>
				</tr>
			{/each}
		</tbody>
	</table>
	<button type="button" onclick={() => (draft.lines = [...draft.lines, blankLine()])}>{mode === 'pay' ? 'Add a payment' : 'Add a payer'}</button>

	{#if preview.problems.length}
		<ul class="bk-problems">
			{#each preview.problems as p, i (i)}
				<li>{p.line ? `${payeeName(draft.lines[Number(p.line.split('-').at(-1)) - 1]?.payee ?? '') || p.line}: ` : ''}{p.message}</li>
			{/each}
		</ul>
	{/if}

	<div class="bk-actions">
		<button type="button" class="bk-primary" disabled={committing || !!preview.problems.length} onclick={commit}>
			{committing ? 'Committing…' : 'Commit and download the file'}
		</button>
		<span class="bk-muted">The file's sha256 and every line's amount are recorded in the realm before you get the file.</span>
	</div>
{/if}
