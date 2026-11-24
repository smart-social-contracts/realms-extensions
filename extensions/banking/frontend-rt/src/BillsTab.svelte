<script lang="ts">
	// Bills the realm issues as Swiss QR-bills: a tax, a fee or an invoice, paid from any e-banking by scanning the QR
	// code. Each bill is kept encrypted (who is billed) and named by its reference, so an imported statement marks it
	// paid.
	import { SwissQRBill } from 'swissqrbill/svg';
	import type { Env } from './env';
	import { errorText, money } from './env';
	import { billProblems, nextBillId, qrDataOf, referenceOfBill, type Bill } from './lib/bill';
	import { parseAmount } from './lib/order';
	import { openSealed, storeBill, type BillFacts, type Doc, type Register } from './lib/realm';

	let { env, register, bills, statements, onissued }: {
		env: Env; register: Register; bills: Doc[]; statements: Doc[]; onissued: () => void;
	} = $props();

	type Form = { payer: string; amount: string; currency: 'CHF' | 'EUR'; message: string; dueDate: string; invoice: string };
	const blank = (): Form => ({ payer: '', amount: '', currency: 'CHF', message: '', dueDate: '', invoice: '' });
	let form = $state<Form>(blank());
	let issuing = $state(false);
	let shown = $state<{ bill: Bill; svg: string } | null>(null);

	/** The bill the form describes, with what stops it. */
	const draft = $derived.by(() => {
		const payee = register.payees.find((p) => p.id === form.payer);
		const amount = form.amount.trim() ? parseAmount(form.amount, form.currency) : undefined;
		const bill: Bill = {
			id: nextBillId(bills.length),
			currency: form.currency,
			...(payee ? { payer: { name: payee.name, address: payee.address } } : {}),
			...(amount !== undefined && amount !== null ? { amount } : {}),
			...(form.message.trim() ? { message: form.message.trim() } : {}),
			...(form.dueDate ? { dueDate: form.dueDate } : {}),
			...(form.invoice.trim() ? { invoice: form.invoice.trim().toUpperCase() } : {}),
		};
		const problems = billProblems(bill, register.account);
		if (amount === null) problems.push({ message: `"${form.amount}" is not an amount in ${form.currency}` });
		return { bill, problems };
	});

	/** Payments the statements matched to each bill, by its id. */
	const paid = $derived.by(() => {
		const out = new Map<string, [number, string, string][]>();
		for (const d of statements) {
			for (const r of d.facts.reports ?? []) {
				for (const [id, amount, currency, date] of r.incoming ?? []) out.set(id, [...(out.get(id) ?? []), [amount, currency, date]]);
			}
		}
		return out;
	});

	function status(f: BillFacts): string {
		const payments = paid.get(f.bill) ?? [];
		if (!payments.length) return f.due ? `open, due ${f.due}` : 'open';
		const total = payments.reduce((sum, [a]) => sum + a, 0);
		const when = payments.at(-1)![2];
		if (f.amount === null || total === f.amount) return `paid on ${when}`;
		return total < f.amount ? `${money(total, f.currency)} paid of ${money(f.amount, f.currency)}` : `paid ${money(total, f.currency)}, more than billed`;
	}

	function render(bill: Bill): string {
		return new SwissQRBill(qrDataOf(bill, register.account!), { language: 'EN' }).toString();
	}

	async function issue() {
		issuing = true;
		try {
			const { bill, problems } = draft;
			if (problems.length) throw new Error('the bill still has problems');
			const svg = render(bill);
			const reference = referenceOfBill(bill, register.account!.iban).value;
			await storeBill(env.realm, env.vault, env.treasury, env.me, bill, reference, env.language);
			env.notify('success', `${bill.id} is issued: download it and send it to the payer`);
			shown = { bill, svg };
			form = blank();
			onissued();
		} catch (e) {
			env.notify('error', `The bill was not issued: ${errorText(e)}`);
		} finally {
			issuing = false;
		}
	}

	async function open(d: Doc) {
		try {
			const { data } = await openSealed<Bill>(env.realm, env.vault, d.id);
			if (!data) throw new Error('it was not sealed for you');
			shown = { bill: data, svg: render(data) };
		} catch (e) {
			env.notify('error', `Cannot open ${d.facts.bill}: ${errorText(e)}`);
		}
	}

	/** The bill in a window of its own, to print or save as PDF from the browser. */
	function printable(svg: string) {
		const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
		window.open(url, '_blank');
		setTimeout(() => URL.revokeObjectURL(url), 60_000);
	}
</script>

{#if !register.account}
	<p class="bk-error">Add the realm's own account to the register first.</p>
{:else}
	<section>
		<h3>Issue a QR-bill</h3>
		<p class="bk-muted">Paid into {register.account.name}'s account. The payer scans the QR code in any Swiss e-banking app.</p>
		<div class="bk-grid">
			<label>Payer
				<select bind:value={form.payer}>
					<option value="">Left blank on the bill</option>
					{#each register.payees as p (p.id)}<option value={p.id}>{p.id} · {p.name}</option>{/each}
				</select>
			</label>
			<label>Amount (blank: the payer enters it) <input class="bk-amount" bind:value={form.amount} inputmode="decimal" placeholder="0.00" /></label>
			<label>Currency
				<select bind:value={form.currency}><option>CHF</option><option>EUR</option></select>
			</label>
			<label>Due on <input type="date" bind:value={form.dueDate} /></label>
			<label>For (printed on the bill) <input bind:value={form.message} maxlength="140" placeholder="Waste fee 2026" /></label>
			<label>Settles realm invoice <input bind:value={form.invoice} placeholder="INV-12" /></label>
		</div>
		{#if draft.problems.length}
			<ul class="bk-problems">{#each draft.problems as p, i (i)}<li>{p.message}</li>{/each}</ul>
		{/if}
		<div class="bk-actions">
			<button type="button" class="bk-primary" disabled={issuing || !!draft.problems.length} onclick={issue}>
				{issuing ? 'Issuing…' : `Issue ${draft.bill.id}`}
			</button>
		</div>
	</section>

	{#if shown}
		<section class="bk-card">
			<h4>{shown.bill.id}{shown.bill.payer ? ` · ${shown.bill.payer.name}` : ''}</h4>
			<!-- As an image, not inline markup: the SVG holds names typed by people, and an image runs no code. -->
			<div class="bk-bill"><img alt="QR-bill {shown.bill.id}" src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(shown.svg)} /></div>
			<div class="bk-actions">
				<button type="button" onclick={() => env.save(`${shown!.bill.id}.svg`, shown!.svg, 'image/svg+xml').catch((e) => env.notify('error', errorText(e)))}>Download</button>
				<button type="button" onclick={() => printable(shown!.svg)}>Open to print</button>
				<button type="button" onclick={() => (shown = null)}>Close</button>
			</div>
		</section>
	{/if}

	{#if bills.length}
		<section>
			<h3>Issued</h3>
			<table>
				<thead><tr><th>Bill</th><th class="bk-num">Amount</th><th>Reference</th><th>Settles</th><th>Status</th><th></th></tr></thead>
				<tbody>
					{#each bills as d (d.id)}
						{@const f = d.facts as unknown as BillFacts}
						<tr>
							<td class="bk-mono">{f.bill}</td>
							<td class="bk-num">{f.amount === null ? 'open' : money(f.amount, f.currency)}</td>
							<td class="bk-mono">{f.reference}</td>
							<td>{f.invoice}</td>
							<td>{status(f)}</td>
							<td><button type="button" onclick={() => open(d)}>Show</button></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}
{/if}
