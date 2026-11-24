<script lang="ts">
	// Banking: pay and be paid through an ordinary bank account, with no connector. The realm writes the payment file
	// (pain.001), the treasurer uploads it in the e-banking, and the statements (camt) come back here to be matched.
	// Only the staff of a department holding the treasury permission use it: the realm refuses anyone else's calls.
	import { get } from 'svelte/store';
	import { version } from '../../manifest.json';
	import type { Env } from './env';
	import { errorText } from './env';
	import BillsTab from './BillsTab.svelte';
	import { bankDispatches, bankRegistered, KIND, listDocs, loadRegister, realmOf, Refused, registerBank, treasuriesOf,
		type Dispatch, type Doc, type Register, type Treasury } from './lib/realm';
	import { hostVault } from './lib/vault';
	import NewOrderTab from './NewOrderTab.svelte';
	import OrdersTab from './OrdersTab.svelte';
	import RegisterTab from './RegisterTab.svelte';
	import StatementsTab from './StatementsTab.svelte';

	let { ctx }: { ctx: any } = $props();

	// The context is the host's for the whole life of the mount: reading it once is what is meant.
	// svelte-ignore state_referenced_locally
	const realm = realmOf(ctx);
	// svelte-ignore state_referenced_locally
	const vault = hostVault(ctx);
	const notify = (level: 'success' | 'info' | 'warning' | 'error', message: string) =>
		typeof ctx.notify === 'function' ? ctx.notify(level, message) : console.info(message);

	let me = $state('');
	let state = $state<'loading' | 'refused' | 'error' | 'ready'>('loading');
	let error = $state('');
	let treasuries = $state<Treasury[]>([]);
	let treasury = $state<Treasury | null>(null);
	let tab = $state<'register' | 'order' | 'bills' | 'orders' | 'statements'>('orders');

	let register = $state<Register | null>(null);
	let registerDoc = $state<string | null>(null);
	let bank = $state(true);
	let orders = $state<Doc[]>([]);
	let statements = $state<Doc[]>([]);
	let bills = $state<Doc[]>([]);
	let outbox = $state<Map<string, Dispatch>>(new Map());

	/** Payment id → the statement record that booked it, from the reports in clear. A group booked as one entry books
	 * every payment the order put in that group. */
	const booked = $derived.by(() => {
		const inGroup = new Map<string, string[]>();
		for (const o of orders) for (const [line, , , group] of o.facts.lines) inGroup.set(group, [...(inGroup.get(group) ?? []), line]);
		const out = new Map<string, string>();
		for (const d of statements) {
			for (const r of d.facts.reports ?? []) {
				for (const [line] of [...(r.paid ?? []), ...(r.collected ?? [])]) out.set(line, d.id);
				for (const [group] of r.group_booked ?? []) for (const line of inGroup.get(group) ?? []) out.set(line, d.id);
			}
		}
		return out;
	});

	const env = $derived<Env | null>(
		treasury ? { realm, vault, treasury, me, notify, version, language: (ctx.locale ? get(ctx.locale) : null) || 'en' } : null,
	);

	async function load() {
		if (!treasury) return;
		try {
			const [reg, os, ss, bs, out, hasBank] = await Promise.all([
				loadRegister(realm, vault, treasury),
				listDocs(realm, treasury.department, KIND.order),
				listDocs(realm, treasury.department, KIND.statement),
				listDocs(realm, treasury.department, KIND.bill),
				bankDispatches(realm),
				bankRegistered(realm),
			]);
			register = reg.register;
			registerDoc = reg.doc;
			orders = os.sort((a, b) => b.at - a.at);
			statements = ss.sort((a, b) => b.at - a.at);
			bills = bs.sort((a, b) => b.at - a.at);
			outbox = out;
			bank = hasBank;
			state = 'ready';
		} catch (e) {
			error = errorText(e);
			state = 'error';
		}
	}

	async function start(principal: string) {
		me = principal;
		state = 'loading';
		try {
			treasuries = await treasuriesOf(realm, me);
			treasury = treasuries[0] ?? null;
			if (!treasury) {
				state = 'refused';
				return;
			}
			await load();
		} catch (e) {
			// A visitor who is not a member is refused even the read of their own permissions.
			error = errorText(e);
			state = e instanceof Refused ? 'refused' : 'error';
		}
	}

	// svelte-ignore state_referenced_locally
	ctx.principal?.subscribe?.((p: string) => {
		if (p && p !== me) start(p);
	});

	async function addBank() {
		try {
			const reply = await registerBank(realm, 'Bank');
			notify('success', reply.proposal ? `Filed as proposal ${reply.proposal}: the bank is registered once it passes` : 'The bank is registered');
			await load();
		} catch (e) {
			notify('error', errorText(e));
		}
	}
</script>

<div class="bk">
	<h2>Banking</h2>
	{#if state === 'loading'}
		<p class="bk-muted">Loading…</p>
	{:else if state === 'refused'}
		<div class="bk-card">
			<h3>Banking is for the treasury's staff</h3>
			<p>
				Payment files and bank statements hold the payees' bank details. Only a seat holder of a department with the
				treasury permission can see them or generate a payment file; the realm refuses everyone else.
			</p>
			{#if error}<p class="bk-muted">The realm said: {error}</p>{/if}
		</div>
	{:else if state === 'error'}
		<p class="bk-error">{error}</p>
	{:else if env && register === null}
		<div class="bk-card">
			<h3>The bank register was not shared with you</h3>
			<p>It was saved before you joined {env.treasury.department}. Ask a colleague to open the register and save it again.</p>
		</div>
	{:else if env && register}
		{#if treasuries.length > 1}
			<label>Acting for
				<select bind:value={treasury} onchange={load}>
					{#each treasuries as t (t.department)}<option value={t}>{t.department}</option>{/each}
				</select>
			</label>
		{/if}
		{#if !bank}
			<div class="bk-card">
				<p>The bank is not registered as an outside body yet, so payment orders cannot enter its outbox.</p>
				<button type="button" onclick={addBank}>Register the bank (manual channel)</button>
			</div>
		{/if}
		<nav class="bk-tabs">
			<button type="button" class:bk-on={tab === 'orders'} onclick={() => (tab = 'orders')}>Orders</button>
			<button type="button" class:bk-on={tab === 'order'} onclick={() => (tab = 'order')}>New order</button>
			<button type="button" class:bk-on={tab === 'bills'} onclick={() => (tab = 'bills')}>QR-bills</button>
			<button type="button" class:bk-on={tab === 'statements'} onclick={() => (tab = 'statements')}>Statements</button>
			<button type="button" class:bk-on={tab === 'register'} onclick={() => (tab = 'register')}>Accounts and payees</button>
		</nav>
		{#if tab === 'orders'}
			<OrdersTab {env} {orders} {outbox} {booked} onchanged={load} />
		{:else if tab === 'order'}
			<NewOrderTab {env} {register} {orders} oncommitted={() => load().then(() => (tab = 'orders'))} />
		{:else if tab === 'bills'}
			<BillsTab {env} {register} {bills} {statements} onissued={load} />
		{:else if tab === 'statements'}
			<StatementsTab {env} {orders} {statements} {outbox} onimported={load} />
		{:else}
			<RegisterTab {env} {register} doc={registerDoc} onsaved={load} />
		{/if}
	{/if}
</div>

<style>
	.bk { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; font-size: 0.9rem; }
	.bk :global(h2) { font-size: 1.3rem; font-weight: 600; margin: 0; }
	.bk :global(h3) { font-size: 1.05rem; font-weight: 600; margin: 0.5rem 0; }
	.bk :global(h4) { font-weight: 600; margin: 0 0 0.5rem; }
	.bk :global(section) { display: flex; flex-direction: column; gap: 0.5rem; }
	.bk :global(table) { border-collapse: collapse; width: 100%; }
	.bk :global(th), .bk :global(td) { border-bottom: 1px solid rgb(128 128 128 / 0.25); padding: 0.35rem 0.5rem; text-align: left; vertical-align: top; }
	.bk :global(th) { font-weight: 600; }
	.bk :global(.bk-num) { text-align: right; white-space: nowrap; }
	.bk :global(.bk-mono) { font-family: ui-monospace, monospace; white-space: nowrap; }
	.bk :global(.bk-muted) { opacity: 0.7; }
	.bk :global(.bk-error) { color: #b42318; }
	.bk :global(.bk-ok) { color: #067647; }
	.bk :global(.bk-bad) { border-color: #b42318 !important; }
	.bk :global(.bk-review) { background: rgb(234 170 8 / 0.12); }
	.bk :global(.bk-card) { border: 1px solid rgb(128 128 128 / 0.3); border-radius: 0.5rem; padding: 0.75rem 1rem; }
	.bk :global(.bk-grid) { display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: 0.5rem 1rem; }
	.bk :global(label) { display: flex; flex-direction: column; gap: 0.2rem; }
	.bk :global(input), .bk :global(select) { border: 1px solid rgb(128 128 128 / 0.45); border-radius: 0.35rem; padding: 0.3rem 0.45rem; background: transparent; color: inherit; }
	.bk :global(input[type='checkbox']) { width: auto; }
	.bk :global(.bk-amount) { width: 7rem; text-align: right; }
	.bk :global(.bk-ccy) { width: 3.5rem; }
	.bk :global(button) { border: 1px solid rgb(128 128 128 / 0.45); border-radius: 0.35rem; padding: 0.3rem 0.75rem; background: transparent; color: inherit; cursor: pointer; }
	.bk :global(button:disabled) { opacity: 0.5; cursor: default; }
	.bk :global(.bk-primary) { background: #1d4ed8; border-color: #1d4ed8; color: white; }
	.bk :global(.bk-actions) { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
	.bk :global(.bk-tabs) { display: flex; gap: 0.25rem; border-bottom: 1px solid rgb(128 128 128 / 0.3); }
	.bk :global(.bk-tabs button) { border: none; border-bottom: 2px solid transparent; border-radius: 0; }
	.bk :global(.bk-tabs .bk-on) { border-bottom-color: currentColor; font-weight: 600; }
	.bk :global(.bk-problems) { color: #b42318; margin: 0; padding-left: 1.2rem; }
	.bk :global(.bk-file) { max-width: 30rem; }
	.bk :global(.bk-bill) { overflow-x: auto; background: white; border: 1px solid rgb(128 128 128 / 0.3); }
	.bk :global(.bk-bill img) { display: block; width: 100%; max-width: 210mm; height: auto; }
	@media print {
		.bk :global(button), .bk :global(.bk-tabs) { display: none; }
	}
</style>
