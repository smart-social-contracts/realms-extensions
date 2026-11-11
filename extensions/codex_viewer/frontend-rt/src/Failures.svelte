<script lang="ts">
	import { t } from './lib/i18n';
	import TimeText from './TimeText.svelte';
	import { failureRows, shortId, type Failures } from './legislation';

	let {
		failures,
		previous,
		itTeam,
		canRevert,
		busy,
		zones,
		onRevert,
	}: {
		failures: Failures;
		/** The codex a fast revert restores: the one the running codex replaced. */
		previous: string;
		/** The department the admins designated as the IT admin team, "" for none. */
		itTeam: string;
		canRevert: boolean;
		busy: boolean;
		zones: { official: string; local: string };
		onRevert: (codex: string) => void;
	} = $props();

	let rows = $derived(failureRows(failures));
	let confirming = $state(false);
</script>

{#if rows.length}
	<section class="card" data-testid="failures">
		<h2>{t('failing_methods')}</h2>
		<p class="muted">{t('failing_hint')}</p>
		<table>
			<thead>
				<tr><th>{t('chapter')}</th><th>{t('method')}</th><th>{t('times')}</th><th>{t('last_error')}</th><th>{t('when')}</th></tr>
			</thead>
			<tbody>
				{#each rows as row (row.file + row.method)}
					<tr>
						<td><code>{row.file}</code></td>
						<td><code>{row.method}</code></td>
						<td>{row.count}</td>
						<td class="error">{row.error}</td>
						<td><TimeText epoch={row.at} {zones} /></td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if !itTeam}
			<p class="muted">{t('revert_no_team')}</p>
		{:else if canRevert && previous}
			{#if confirming}
				<p class="notice" data-testid="revert-confirm">{t('revert_confirm', { codex: shortId(previous) })}</p>
				<div class="actions">
					<button type="button" class="btn danger" disabled={busy} onclick={() => onRevert(previous)}>{t('revert_do')}</button>
					<button type="button" class="btn" disabled={busy} onclick={() => (confirming = false)}>{t('cancel')}</button>
				</div>
			{:else}
				<button type="button" class="btn danger" onclick={() => (confirming = true)}>{t('revert_button')}</button>
			{/if}
		{:else if canRevert}
			<p class="muted">{t('revert_none')}</p>
		{/if}
	</section>
{/if}
