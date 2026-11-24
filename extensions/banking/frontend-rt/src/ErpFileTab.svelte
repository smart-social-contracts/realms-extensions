<script lang="ts">
	// Files from the public body's ERP: a pain.001 or pain.008 the ERP made is checked, shown line by line and put to the
	// treasury's vote as it is; once approved, its hash is committed for the bank (in Orders). Anyone can then check a
	// file against what the realm approved before it is uploaded in the e-banking.
	import type { Env } from './env';
	import { errorText, money } from './env';
	import FileLines from './FileLines.svelte';
	import { printIban } from './lib/iban';
	import { proposeFile, sha256Hex, type Dispatch, type Doc, type OrderFacts, type Register } from './lib/realm';
	import { checkFile, committedAs, factsOfFile, type FileCheck } from './lib/upload';

	let { env, register, orders, outbox, onproposed }: {
		env: Env; register: Register; orders: Doc[]; outbox: Map<string, Dispatch>; onproposed: () => void;
	} = $props();

	let picked = $state<{ name: string; file: string; sha: string; check: FileCheck } | null>(null);
	let proposing = $state(false);
	let verified = $state<{ name: string; sha: string; doc: Doc | undefined } | null>(null);

	async function read(event: Event): Promise<{ name: string; file: string; sha: string } | null> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return null;
		const text = await file.text();
		return { name: file.name, file: text, sha: await sha256Hex(text) };
	}

	async function pick(event: Event) {
		const file = await read(event);
		if (file) picked = { ...file, check: checkFile(file.file, register, orders, file.sha) };
	}

	async function verify(event: Event) {
		const file = await read(event);
		if (file) verified = { name: file.name, sha: file.sha, doc: committedAs(orders, file.sha) };
	}

	async function propose() {
		if (!picked?.check.summary) return;
		proposing = true;
		try {
			const facts = factsOfFile(picked.check, picked.sha);
			const { proposal } = await proposeFile(env.realm, env.vault, env.treasury, env.me, facts, picked.file, env.language);
			env.notify('success', `${facts.message_id} is put to the treasury's vote as ${proposal}. Once approved, commit it for the bank in Orders.`);
			picked = null;
			onproposed();
		} catch (e) {
			env.notify('error', `The file was not put to the vote: ${errorText(e)}`);
		} finally {
			proposing = false;
		}
	}

	function totals(facts: OrderFacts): string {
		const sums = new Map<string, number>();
		for (const [, amount, currency] of facts.lines) sums.set(currency, (sums.get(currency) ?? 0) + amount);
		return [...sums].map(([c, a]) => money(a, c)).join(' + ');
	}

	/** What the realm says of a verified file: approved and committed, waiting, or unknown. */
	function verdict(doc: Doc | undefined): { ok: boolean; text: string } {
		if (!doc) return { ok: false, text: 'The realm never approved this file. Do not upload it.' };
		const facts = doc.facts as OrderFacts;
		const sent = outbox.get(doc.id);
		if (sent) return { ok: true, text: `This is ${facts.message_id}, committed for the bank as ${sent.id}${facts.proposal ? ` after ${facts.proposal} approved it` : ''}: ${facts.lines.length} lines, ${totals(facts)}.` };
		return { ok: false, text: `This is ${facts.message_id}, but it is not committed for the bank yet${facts.proposal ? `: ${facts.proposal} must approve it first` : ''}.` };
	}
</script>

<section>
	<h3>Put a file from the ERP to the vote</h3>
	<p class="bk-muted">
		Upload the pain.001 (payments) or pain.008 (direct debits) your ERP made. The treasury votes on exactly this file;
		the realm keeps it encrypted and shows the vote only ids, amounts and the file's sha256.
	</p>
	<label class="bk-file">The ERP's file <input type="file" accept=".xml,application/xml,text/xml" onchange={pick} /></label>

	{#if picked}
		<div class="bk-card">
			<h4>{picked.name}</h4>
			{#if picked.check.summary}
				{@const s = picked.check.summary}
				<p>
					{s.kind === 'payment' ? 'Pays from' : 'Collects into'} <strong>{s.account.name}</strong>,
					<span class="bk-mono">{printIban(s.account.iban)}</span>. {s.count} {s.kind === 'payment' ? 'payments' : 'collections'},
					control sum {s.controlSum}. Message {s.messageId} ({picked.check.message}).
				</p>
				<p class="bk-muted bk-mono">sha256 {picked.sha}</p>
				<FileLines summary={s} />
			{/if}
			{#if picked.check.problems.length}
				<ul class="bk-problems">{#each picked.check.problems as p, i (i)}<li>{p.line ? `${p.line}: ` : ''}{p.message}</li>{/each}</ul>
			{/if}
			{#if picked.check.warnings.length}
				<ul class="bk-warnings">{#each picked.check.warnings as w, i (i)}<li>{w}</li>{/each}</ul>
			{/if}
			<div class="bk-actions">
				<button type="button" class="bk-primary" disabled={proposing || !!picked.check.problems.length} onclick={propose}>
					{proposing ? 'Filing…' : "Put it to the treasury's vote"}
				</button>
				<button type="button" onclick={() => (picked = null)}>Cancel</button>
			</div>
		</div>
	{/if}
</section>

<section>
	<h3>Verify a file before it goes to the bank</h3>
	<p class="bk-muted">Check any file, from the ERP or from the e-banking's upload screen, against what the realm approved.</p>
	<label class="bk-file">The file to check <input type="file" accept=".xml,application/xml,text/xml" onchange={verify} /></label>
	{#if verified}
		{@const v = verdict(verified.doc)}
		<div class="bk-card">
			<h4>{verified.name}</h4>
			<p class:bk-ok={v.ok} class:bk-error={!v.ok}>{v.text}</p>
			<p class="bk-muted bk-mono">sha256 {verified.sha}</p>
		</div>
	{/if}
</section>
