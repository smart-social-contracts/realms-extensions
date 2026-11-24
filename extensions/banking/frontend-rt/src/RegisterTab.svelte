<script lang="ts">
	// The bank register: the realm's own account and the payees' bank details, one record sealed for the treasury's
	// staff. Saving it again wraps its key for whoever holds a seat now.
	import AccountFields from './AccountFields.svelte';
	import type { AccountForm as Form, Env } from './env';
	import { errorText } from './env';
	import { ibanProblem, printIban } from './lib/iban';
	import type { Account, Address } from './lib/order';
	import { isRsPid, isSepaCreditorId } from './lib/collection';
	import { saveRegister, type Payee, type Register } from './lib/realm';

	let { env, register, doc, onsaved }: { env: Env; register: Register; doc: string | null; onsaved: () => void } = $props();

	const blank = (): Form => ({ name: '', iban: '', bic: '', street: '', building: '', postCode: '', town: '', country: 'CH' });

	function formOf(a: Account | null): Form {
		if (!a) return blank();
		const ad = a.address;
		return { name: a.name, iban: printIban(a.iban), bic: a.bic ?? '', street: ad?.street ?? '', building: ad?.building ?? '',
			postCode: ad?.postCode ?? '', town: ad?.town ?? '', country: ad?.country ?? '' };
	}

	/** A form is complete with a name, a valid IBAN, a town and a two-letter country (a structured address). */
	function complete(f: Form): boolean {
		return !!f.name.trim() && !!f.iban && !ibanProblem(f.iban) && !!f.town.trim() && /^[A-Za-z]{2}$/.test(f.country.trim());
	}

	function accountOf(f: Form): Account {
		const address: Address = {
			street: f.street.trim() || undefined, building: f.building.trim() || undefined, postCode: f.postCode.trim() || undefined,
			town: f.town.trim(), country: f.country.trim().toUpperCase(),
		};
		return { name: f.name.trim(), iban: f.iban.replace(/\s+/g, '').toUpperCase(), bic: f.bic.trim().toUpperCase() || undefined, address };
	}

	// The forms start from the register as it was opened; saving reloads the tab with what was saved.
	// svelte-ignore state_referenced_locally
	let account = $state<Form>(formOf(register.account));
	// svelte-ignore state_referenced_locally
	let payees = $state<Payee[]>($state.snapshot(register.payees) as Payee[]);
	// svelte-ignore state_referenced_locally
	let creditorId = $state(register.account?.creditorId ?? '');
	// svelte-ignore state_referenced_locally
	let rsPid = $state(register.account?.rsPid ?? '');
	const idsValid = $derived((!creditorId || isSepaCreditorId(creditorId)) && (!rsPid || isRsPid(rsPid)));
	/** The payee being edited, with the direct debit mandate they signed, if any. */
	let editing = $state<{ id: string | null; form: Form; mandateId: string; signedOn: string } | null>(null);
	let saving = $state(false);


	function nextId(): string {
		const n = Math.max(0, ...payees.map((p) => Number(p.id.slice(1)) || 0)) + 1;
		return `P${n}`;
	}

	function keepPayee() {
		if (!editing || !complete(editing.form)) return;
		const mandate = editing.mandateId.trim() ? { id: editing.mandateId.trim(), signedOn: editing.signedOn } : undefined;
		const payee = { id: editing.id ?? nextId(), ...accountOf(editing.form), ...(mandate ? { mandate } : {}) };
		payees = editing.id ? payees.map((p) => (p.id === editing!.id ? payee : p)) : [...payees, payee];
		editing = null;
	}

	async function save() {
		saving = true;
		try {
			const ids = { creditorId: creditorId.replace(/\s+/g, '').toUpperCase() || undefined, rsPid: rsPid.trim() || undefined };
			const next: Register = { account: { ...accountOf(account), ...ids }, payees };
			await saveRegister(env.realm, env.vault, env.treasury, env.me, next, doc, env.language);
			env.notify('success', `Bank register saved, readable by the ${env.treasury.staff.length} staff of ${env.treasury.department}`);
			onsaved();
		} catch (e) {
			env.notify('error', `The register was not saved: ${errorText(e)}`);
		} finally {
			saving = false;
		}
	}
</script>


<section>
	<h3>The realm's account</h3>
	<p class="bk-muted">The account the orders pay from and the collections are credited to. Only the staff of {env.treasury.department} can read it.</p>
	<AccountFields bind:form={account} />
	<div class="bk-grid">
		<label>SEPA creditor identifier (direct debits)
			<input bind:value={creditorId} class:bk-bad={!!creditorId && !isSepaCreditorId(creditorId)} placeholder="DE98ZZZ09999999999" />
		</label>
		<label>PostFinance RS-PID (CH-DD)
			<input bind:value={rsPid} class:bk-bad={!!rsPid && !isRsPid(rsPid)} inputmode="numeric" />
		</label>
	</div>
</section>

<section>
	<h3>Payees</h3>
	{#if payees.length}
		<table>
			<thead><tr><th>Id</th><th>Name</th><th>IBAN</th><th>Town</th><th>Mandate</th><th></th></tr></thead>
			<tbody>
				{#each payees as p (p.id)}
					<tr>
						<td>{p.id}</td><td>{p.name}</td><td class="bk-mono">{printIban(p.iban)}</td><td>{p.address?.town ?? ''}</td><td>{p.mandate?.id ?? ''}</td>
						<td class="bk-actions">
							<button type="button" onclick={() => (editing = { id: p.id, form: formOf(p), mandateId: p.mandate?.id ?? '', signedOn: p.mandate?.signedOn ?? '' })}>Edit</button>
							<button type="button" onclick={() => (payees = payees.filter((x) => x.id !== p.id))}>Remove</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p class="bk-muted">No payees yet.</p>
	{/if}

	{#if editing}
		<div class="bk-card">
			<h4>{editing.id ? `Payee ${editing.id}` : 'New payee'}</h4>
			<AccountFields bind:form={editing.form} />
			<div class="bk-grid">
				<label>Direct debit mandate (SEPA) <input bind:value={editing.mandateId} maxlength="35" /></label>
				<label>Signed on <input type="date" bind:value={editing.signedOn} /></label>
			</div>
			<div class="bk-actions">
				<button type="button" class="bk-primary" disabled={!complete(editing.form)} onclick={keepPayee}>Keep</button>
				<button type="button" onclick={() => (editing = null)}>Cancel</button>
			</div>
		</div>
	{:else}
		<button type="button" onclick={() => (editing = { id: null, form: blank(), mandateId: '', signedOn: '' })}>Add a payee</button>
	{/if}
</section>

<div class="bk-actions">
	<button type="button" class="bk-primary" disabled={saving || !complete(account) || !!editing || !idsValid} onclick={save}>
		{saving ? 'Saving…' : 'Save the register'}
	</button>
	<span class="bk-muted">Saved encrypted: the realm keeps no IBAN, name or address in clear.</span>
</div>
