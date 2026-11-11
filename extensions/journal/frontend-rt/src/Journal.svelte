<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { loadExtensionI18n, t } from './lib/i18n';
	import { timeOfDay } from './dates';
	import { missedChange } from './entries';
	import type { Issue } from './issue';
	import { basePath, parseRoute, pathFor, realmPrefix, shiftDay, type Route } from './route';
	import { sheetHtml } from './sheet';

	let { ctx }: { ctx: any } = $props();

	let route: Route = $state(parseRoute(window.location.pathname));
	let issue: Issue | null = $state(null);
	let loading = $state(true);
	let asked = 0; // the newest request: an older answer that comes later is dropped
	let problem = $state('');
	// The capital whose issue is shown, when this realm is a quarter (its journal is the capital's).
	let capital = $state('');
	// The canister that issues the issue shown: the realm itself, or on a quarter its capital.
	let issuer = $state('');
	let locale = $state('en');
	let logoUrl = $state('');
	let frame: HTMLIFrameElement | undefined = $state();

	// A quarter's logo is not the capital's, whose journal it shows: the sheet has none then.
	let page = $derived(
		issue
			? sheetHtml(
					issue,
					{ logoUrl: capital ? '' : logoUrl, canisterId: issuer, prefix: realmPrefix(window.location.pathname) },
					t,
					locale,
				)
			: '',
	);
	// The changes the realm made on this day whose entries it could not record: a reader must not miss them.
	let notices = $derived(
		(issue?.entries ?? [])
			.filter((entry) => entry.kind === 'not_recorded')
			.map((entry) => t('notice_not_recorded', { change: missedChange(entry, t), time: timeOfDay(entry.at, issue!.timezone) }))
			.join(' '),
	);

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
		// The sheet is narrower or wider on another screen, and its text runs onto more or fewer lines.
		window.addEventListener('resize', fit);
		return () => {
			window.removeEventListener('popstate', follow);
			window.removeEventListener('resize', fit);
		};
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
				issuer = reply.capital;
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

	// The body's height, not the document's: the document is never shorter than the frame, so the frame could not shrink.
	function fit() {
		const body = frame?.contentDocument?.body;
		if (frame && body) frame.style.height = `${body.scrollHeight}px`;
	}

	// The sheet runs no script, so its links are followed from here: through the realm's router, not by loading the realm
	// again inside the frame.
	function followLink(event: MouseEvent) {
		const link = (event.target as Element).closest('a[href]');
		if (!link) return;
		event.preventDefault();
		void ctx.navigate(link.getAttribute('href')!);
	}

	function sheetLoaded() {
		fit();
		frame?.contentDocument?.addEventListener('click', followLink);
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
		{#if notices}
			<p class="note error" role="alert">{notices}</p>
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
			onload={sheetLoaded}
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
		border-radius: 2px;
		background: #fff;
		box-shadow: 0 1px 6px rgb(0 0 0 / 0.12);
	}
</style>
