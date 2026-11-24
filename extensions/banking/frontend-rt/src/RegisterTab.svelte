<script lang="ts">
	// The bank register: the realm's own account and the payees' bank details, one record sealed for the treasury's
	// staff. Saving it again wraps its key for whoever holds a seat now.
	import AccountFields from './AccountFields.svelte';
	import type { AccountForm as Form, Env } from './env';
	import { errorText } from './env';
	import { COUNTRIES, countryOf, localScheme, usesIban } from './lib/countries';
	import { ibanProblem, printIban } from './lib/iban';
	import { accountText, type Account, type Address } from './lib/order';
	import { isRsPid, isSepaCreditorId } from './lib/collection';
	import { profileOf, saveRegister, type BankingProfile, type Payee, type Register } from './lib/realm';

	let { env, register, doc, onsaved }: { env: Env; register: Register; doc: string | null; onsaved: () => void } = $props();

	// svelte-ignore state_referenced_locally
	let profile = $state<BankingProfile>({ ...profileOf(register) });
	const blank = (): Form => ({ name: '', iban: '', number: '', code: '', bic: '', street: '', building: '', postCode: '', town: '',
		country: profile.country });

	function formOf(a: Account | null): Form {
		if (!a) return blank();
		const ad = a.address;
		return { name: a.name, iban: a.local ? '' : printIban(a.iban), number: a.local?.number ?? '', code: a.local?.code ?? '',
			bic: a.bic ?? '', street: ad?.street ?? '', building: ad?.building ?? '', postCode: ad?.postCode ?? '',
			town: ad?.town ?? '', country: ad?.country ?? '' };
	}

	/** Whether the account in ``f`` is one its country can pay: a valid IBAN; or the bank's code and the account number
	 * by the country's scheme; or, where neither exists, a number and the bank's BIC. */
	function accountComplete(f: Form): boolean {
		const country = f.country.trim().toUpperCase();
		if (usesIban(country)) return !!f.iban && !ibanProblem(f.iban);
		const scheme = localScheme(country);
		if (scheme) return !!scheme.code(f.code) && !scheme.numberProblem(f.number);
		return !!f.number.trim() && /^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/.test(f.bic.trim());
	}

	/** A form is complete with a name, an account its country can pay, a town and a two-letter country. */
	function complete(f: Form): boolean {
		return !!f.name.trim() && /^[A-Za-z]{2}$/.test(f.country.trim()) && accountComplete(f) && !!f.town.trim();
	}

	function accountOf(f: Form): Account {
		const country = f.country.trim().toUpperCase();
		const address: Address = {
			street: f.street.trim() || undefined, building: f.building.trim() || undefined, postCode: f.postCode.trim() || undefined,
			town: f.town.trim(), country,
		};
		const bic = f.bic.trim().toUpperCase() || undefined;
		if (usesIban(country)) return { name: f.name.trim(), iban: f.iban.replace(/\s+/g, '').toUpperCase(), bic, address };
		const scheme = localScheme(country);
		const local = scheme
			? { number: f.number.replace(/[\s.-]/g, ''), system: scheme.system, code: scheme.code(f.code) ?? f.code.trim() }
			: { number: f.number.replace(/\s+/g, '') };
		return { name: f.name.trim(), iban: '', local, bic, address };
	}

	function setCountry(code: string) {
		profile = { country: code, currency: countryOf(code).currency || profile.currency };
		if (!account.name && !account.iban && !account.number) account.country = code;
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
	const profileValid = $derived(/^[A-Z]{2}$/.test(profile.country) && /^[A-Z]{3}$/.test(profile.currency.trim().toUpperCase()));


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
			const next: Register = {
				account: { ...accountOf(account), ...ids }, payees,
				profile: { country: profile.country, currency: profile.currency.trim().toUpperCase() },
			};
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
	<h3>Banking profile</h3>
	<p class="bk-muted">The country of the realm's bank and the currency it pays in: they decide how accounts are entered and which file
		a new order writes (Swiss Payment Standards, SEPA, or the ISO 20022 file banks take worldwide).</p>
	<div class="bk-grid">
		<label>Country of the realm's bank
			<select value={profile.country} onchange={(e) => setCountry((e.currentTarget as HTMLSelectElement).value)}>
				{#each COUNTRIES as c (c.code)}<option value={c.code}>{c.name}</option>{/each}
				{#if !COUNTRIES.some((c) => c.code === profile.country)}<option value={profile.country}>{profile.country}</option>{/if}
			</select>
		</label>
		<label>Currency <input bind:value={profile.currency} maxlength="3" /></label>
	</div>
</section>

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
			<thead><tr><th>Id</th><th>Name</th><th>Account</th><th>Town</th><th>Mandate</th><th></th></tr></thead>
			<tbody>
				{#each payees as p (p.id)}
					<tr>
						<td>{p.id}</td><td>{p.name}</td><td class="bk-mono">{p.local ? accountText(p) : printIban(p.iban)}</td><td>{p.address?.town ?? ''}</td><td>{p.mandate?.id ?? ''}</td>
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
	<button type="button" class="bk-primary" disabled={saving || !complete(account) || !!editing || !idsValid || !profileValid} onclick={save}>
		{saving ? 'Saving…' : 'Save the register'}
	</button>
	<span class="bk-muted">Saved encrypted: the realm keeps no IBAN, name or address in clear.</span>
</div>
