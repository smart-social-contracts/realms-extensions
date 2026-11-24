<script lang="ts">
	// The bank register: the realm's own account and the payees' bank details, one record sealed for the treasury's
	// staff. Saving it again wraps its key for whoever holds a seat now.
	import AccountFields from './AccountFields.svelte';
	import type { AccountForm as Form, Env } from './env';
	import { errorText } from './env';
	import { ibanProblem, printIban } from './lib/iban';
	import type { Account, Address } from './lib/order';
	import { saveRegister, type Payee, type Register } from './lib/realm';

	let { env, register, doc, onsaved }: { env: Env; register: Register; doc: string | null; onsaved: () => void } = $props();

	const blank = (): Form => ({ name: '', iban: '', bic: '', street: '', building: '', postCode: '', town: '', country: 'CH' });

	function formOf(a: Account | null): Form {
		if (!a) return blank();
		const ad = a.address;
		return { name: a.name, iban: printIban(a.iban), bic: a.bic ?? '', street: ad?.street ?? '', building: ad?.building ?? '',
			postCode: ad?.postCode ?? '', town: ad?.town ?? '', country: ad?.country ?? '' };
	}

	function accountOf(f: Form): Account {
		const address: Address | undefined = f.town.trim()
			? { street: f.street.trim() || undefined, building: f.building.trim() || undefined, postCode: f.postCode.trim() || undefined,
				town: f.town.trim(), country: f.country.trim().toUpperCase() }
			: undefined;
		return { name: f.name.trim(), iban: f.iban.replace(/\s+/g, '').toUpperCase(), bic: f.bic.trim().toUpperCase() || undefined, address };
	}

	// The forms start from the register as it was opened; saving reloads the tab with what was saved.
	// svelte-ignore state_referenced_locally
	let account = $state<Form>(formOf(register.account));
	// svelte-ignore state_referenced_locally
	let payees = $state<Payee[]>($state.snapshot(register.payees) as Payee[]);
	let editing = $state<{ id: string | null; form: Form } | null>(null);
	let saving = $state(false);

	const accountIban = $derived(account.iban ? ibanProblem(account.iban) : null);
	const editingIban = $derived(editing?.form.iban ? ibanProblem(editing.form.iban) : null);

	function nextId(): string {
		const n = Math.max(0, ...payees.map((p) => Number(p.id.slice(1)) || 0)) + 1;
		return `P${n}`;
	}

	function keepPayee() {
		if (!editing || !editing.form.name.trim() || editingIban) return;
		const payee = { id: editing.id ?? nextId(), ...accountOf(editing.form) };
		payees = editing.id ? payees.map((p) => (p.id === editing!.id ? payee : p)) : [...payees, payee];
		editing = null;
	}

	async function save() {
		saving = true;
		try {
			const next: Register = { account: account.iban ? accountOf(account) : null, payees };
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
	<p class="bk-muted">The account the orders pay from. Only the staff of {env.treasury.department} can read it.</p>
	<AccountFields bind:form={account} />
</section>

<section>
	<h3>Payees</h3>
	{#if payees.length}
		<table>
			<thead><tr><th>Id</th><th>Name</th><th>IBAN</th><th>Town</th><th></th></tr></thead>
			<tbody>
				{#each payees as p (p.id)}
					<tr>
						<td>{p.id}</td><td>{p.name}</td><td class="bk-mono">{printIban(p.iban)}</td><td>{p.address?.town ?? ''}</td>
						<td class="bk-actions">
							<button type="button" onclick={() => (editing = { id: p.id, form: formOf(p) })}>Edit</button>
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
			<div class="bk-actions">
				<button type="button" class="bk-primary" disabled={!editing.form.name.trim() || !editing.form.iban || !!editingIban} onclick={keepPayee}>Keep</button>
				<button type="button" onclick={() => (editing = null)}>Cancel</button>
			</div>
		</div>
	{:else}
		<button type="button" onclick={() => (editing = { id: null, form: blank() })}>Add a payee</button>
	{/if}
</section>

<div class="bk-actions">
	<button type="button" class="bk-primary" disabled={saving || !!accountIban || !!editing} onclick={save}>
		{saving ? 'Saving…' : 'Save the register'}
	</button>
	<span class="bk-muted">Saved encrypted: the realm keeps no IBAN, name or address in clear.</span>
</div>
