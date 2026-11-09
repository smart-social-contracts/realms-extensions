<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { loadExtensionI18n, t } from './lib/i18n';
	import { basePath, parseRoute, pathFor, shiftDay, type Route } from './route';
	import { sheetHtml, type Issue } from './sheet';

	let { ctx }: { ctx: any } = $props();

	let route: Route = $state(parseRoute(window.location.pathname));
	let issue: Issue | null = $state(null);
	let loading = $state(true);
	let asked = 0; // the newest request: an older answer that comes later is dropped
	let problem = $state('');
	// The capital whose issue is shown, when this realm is a quarter (its journal is the capital's).
	let capital = $state('');
	let locale = $state('en');
	let logoUrl = $state('');
	let frame: HTMLIFrameElement | undefined = $state();

	// A quarter's logo is not the capital's, whose journal it shows: the sheet has none then.
	let page = $derived(issue ? sheetHtml(issue, capital ? '' : logoUrl, t, locale) : '');

	$effect(() => {
		const stop = ctx.locale?.subscribe?.((next: string | null | undefined) => {
			locale = next || 'en';
			void loadExtensionI18n(locale);
		});
		return stop;
	});

	$effect(() => {
		const stop = ctx.realmInfo?.subscribe?.((info: any) => {
			logoUrl = info?.logoUrl ?? '';
		});
		return stop;
	});

	$effect(() => {
		const day = route.day;
		untrack(() => void load(day));
	});

	onMount(() => {
		const follow = () => (route = parseRoute(window.location.pathname));
		window.addEventListener('popstate', follow);
		return () => window.removeEventListener('popstate', follow);
	});

	async function load(day: string | null) {
		const mine = ++asked;
		loading = true;
		problem = '';
		const args = day ? { day } : {};
		try {
			let reply = await ctx.read('journal_issue', args);
			// A quarter issues nothing: the capital's issue is asked for through the quarter.
			if (reply.ok && !reply.issued) reply = await ctx.run('journal_capital_issue', args);
			if (mine !== asked) return; // a later request has replaced this one
			if (reply.ok) {
				issue = reply.issue;
				capital = reply.issued ? '' : reply.capital;
			} else {
				fail(reply.denied ? t('login_for_capital') : reply.error);
			}
		} catch (e: any) {
			if (mine === asked) fail(e?.message ?? String(e));
		} finally {
			if (mine === asked) loading = false;
		}
	}

	function fail(reason: string) {
		issue = null;
		problem = reason;
	}

	function go(next: Route) {
		route = next;
		void ctx.navigate(pathFor(basePath(window.location.pathname), next));
	}

	function fit() {
		const body = frame?.contentDocument?.documentElement;
		if (frame && body) frame.style.height = `${body.scrollHeight}px`;
	}

	function print() {
		frame?.contentWindow?.focus();
		frame?.contentWindow?.print();
	}
</script>

<div class="journal">
	{#if loading && !issue}
		<p class="note">{t('loading')}</p>
	{/if}

	{#if problem}
		<p class="note error" role="alert">{t('error', { reason: problem })}</p>
		{#if route.day}
			<div class="bar">
				<button type="button" onclick={() => go({ day: null, print: false })}>{t('today')}</button>
			</div>
		{/if}
	{/if}

	{#if issue}
		{#if capital}
			<p class="note">{t('quarter_note')}</p>
		{/if}

		<nav class="bar" aria-label={t('journal')}>
			{#if route.print}
				<button type="button" onclick={() => go({ day: issue!.day, print: false })}>{t('back_to_issue')}</button>
				<button type="button" class="primary" onclick={print}>{t('print')}</button>
			{:else}
				<button
					type="button"
					disabled={issue.day <= issue.first_day}
					onclick={() => go({ day: shiftDay(issue!.day, -1), print: false })}>← {t('previous_day')}</button
				>
				<label>
					<span class="label">{t('pick_day')}</span>
					<input
						type="date"
						min={issue.first_day}
						max={issue.today}
						value={issue.day}
						onchange={(e) => e.currentTarget.value && go({ day: e.currentTarget.value, print: false })}
					/>
				</label>
				<button
					type="button"
					disabled={issue.day >= issue.today}
					onclick={() => go({ day: shiftDay(issue!.day, 1), print: false })}>{t('next_day')} →</button
				>
				<button type="button" disabled={issue.day === issue.today} onclick={() => go({ day: null, print: false })}
					>{t('today')}</button
				>
				<button type="button" class="primary" onclick={() => go({ day: issue!.day, print: true })}>{t('print')}</button>
			{/if}
		</nav>

		<!-- The sheet is its own document, so what is printed is the paper and nothing of the realm's page. It runs no
		     script (no allow-scripts); the realm's JSON is only text in it. -->
		<iframe
			bind:this={frame}
			class="sheet"
			title={t('journal')}
			sandbox="allow-same-origin allow-modals"
			srcdoc={page}
			onload={fit}
		></iframe>
	{/if}
</div>

<style>
	.journal {
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-width: 860px;
	}
	.note {
		margin: 0;
		padding: 10px 12px;
		border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
		border-radius: 8px;
		font-size: 14px;
	}
	.note.error {
		border-color: #b91c1c;
		color: #b91c1c;
	}
	.bar {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: flex-end;
	}
	.bar label {
		display: flex;
		flex-direction: column;
		font-size: 12px;
	}
	.bar .label {
		opacity: 0.7;
	}
	button,
	input {
		font: inherit;
		font-size: 14px;
		padding: 6px 12px;
		border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
		border-radius: 6px;
		background: transparent;
		color: inherit;
	}
	button {
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.45;
		cursor: default;
	}
	button.primary {
		background: #1d4ed8;
		border-color: #1d4ed8;
		color: #fff;
	}
	.sheet {
		width: 100%;
		min-height: 320px;
		border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
		border-radius: 4px;
		background: #fff;
	}
</style>
