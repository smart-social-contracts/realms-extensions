<script lang="ts">
	// A new payment order: lines from the register's payees, checked as they are typed by the chosen format. Committing
	// records the file's sha256 and lines in the realm first; only then is the file handed to the treasurer.
	import type { Env } from './env';
	import { errorText, saveFile } from './env';
	import { createdAt, defaultFormat, factsOf, nextMessageId, orderOf, type Draft, type DraftLine } from './lib/compose';
	import { FORMATS, formatById } from './lib/formats';
	import { commitOrder, sha256Hex, type Doc, type Register } from './lib/realm';

	let { env, register, orders, oncommitted }: { env: Env; register: Register; orders: Doc[]; oncommitted: (doc: string) => void } =
		$props();

	const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
	const currency = () => (register.account?.iban.startsWith('CH') || register.account?.iban.startsWith('LI') ? 'CHF' : 'EUR');
	const blankLine = (): DraftLine => ({ payee: '', amount: '', currency: currency(), salary: false, referenceKind: '', reference: '', note: '' });

	let draft = $state<Draft>({ executionDate: tomorrow, lines: [blankLine()] });
	// A default the treasurer may change: picked once, from the account the tab opened with.
	// svelte-ignore state_referenced_locally
	let formatId = $state(defaultFormat(register));
	let committing = $state(false);

	// The id and time are fixed when the order is committed; until then they only shape the preview.
	const preview = $derived.by(() => {
		const now = new Date();
		const built = orderOf(register, draft, nextMessageId(now, orders), createdAt(now), { name: 'Realms Banking', version: env.version });
		const format = formatById(formatId);
		return { ...built, problems: [...built.problems, ...(built.order ? format.problems(built.order) : [])] };
	});

	const payeeName = (id: string) => register.payees.find((p) => p.id === id)?.name ?? '';

	async function commit() {
		committing = true;
		try {
			const now = new Date();
			const { order, problems } = orderOf(register, draft, nextMessageId(now, orders), createdAt(now), {
				name: 'Realms Banking', version: env.version,
			});
			const format = formatById(formatId);
			if (!order || problems.length || format.problems(order).length) throw new Error('the order still has problems');
			const file = format.write(order);
			const facts = factsOf(order, format, draft, await sha256Hex(file));
			const { document } = await commitOrder(env.realm, env.vault, env.treasury, env.me, facts, file, env.language);
			saveFile(`${order.messageId}.xml`, file);
			env.notify('success', `${order.messageId} is committed (${document}) and downloaded: upload it in the e-banking`);
			draft = { executionDate: tomorrow, lines: [blankLine()] };
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
		<label>Execution date <input type="date" bind:value={draft.executionDate} /></label>
		<label>File format
			<select bind:value={formatId}>
				{#each FORMATS as f (f.id)}<option value={f.id}>{f.label}</option>{/each}
			</select>
		</label>
	</div>

	<table>
		<thead>
			<tr><th>Payee</th><th>Amount</th><th>Currency</th><th>Salary</th><th>Reference</th><th>Note</th><th></th></tr>
		</thead>
		<tbody>
			{#each draft.lines as line, i (i)}
				<tr>
					<td>
						<select bind:value={line.payee}>
							<option value="">Choose…</option>
							{#each register.payees as p (p.id)}<option value={p.id}>{p.id} · {p.name}</option>{/each}
						</select>
					</td>
					<td><input class="bk-amount" bind:value={line.amount} inputmode="decimal" placeholder="0.00" /></td>
					<td><input class="bk-ccy" bind:value={line.currency} maxlength="3" /></td>
					<td><input type="checkbox" bind:checked={line.salary} aria-label="Salary" /></td>
					<td>
						<select bind:value={line.referenceKind}>
							<option value="">None</option><option value="QRR">QR reference</option><option value="SCOR">RF reference</option>
						</select>
						{#if line.referenceKind}<input bind:value={line.reference} />{/if}
					</td>
					<td><input bind:value={line.note} maxlength="140" /></td>
					<td><button type="button" onclick={() => (draft.lines = draft.lines.filter((_, j) => j !== i))}>Remove</button></td>
				</tr>
			{/each}
		</tbody>
	</table>
	<button type="button" onclick={() => (draft.lines = [...draft.lines, blankLine()])}>Add a payment</button>

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
