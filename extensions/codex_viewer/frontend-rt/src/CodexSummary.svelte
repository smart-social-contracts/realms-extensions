<script lang="ts">
	import { t } from './lib/i18n';
	import TimeText from './TimeText.svelte';
	import { isLayered, layerRows, shortId, type CodexStatus } from './legislation';

	let { status, zones }: { status: CodexStatus; zones: { official: string; local: string } } = $props();

	let codex = $derived(isLayered(status.codex) ? status.codex : null);
	let layers = $derived(codex ? layerRows(codex) : []);
</script>

<section class="card" data-testid="in-force">
	<h2>{t('in_force')}</h2>
	{#if codex}
		<p class="line">
			<code title={codex.id}>{shortId(codex.id)}</code>
			<span class="badge" class:bad={!status.healthy} data-testid="health">{status.healthy ? t('healthy') : t('failing')}</span>
		</p>
		<p class="muted">
			{t('installed')} <TimeText epoch={codex.installed_at} {zones} />
			{#if codex.proposal}· {t('adopted_by', { proposal: codex.proposal })}{/if}
		</p>
		<table>
			<thead>
				<tr><th>{t('layer')}</th><th>{t('version')}</th><th>{t('domains')}</th><th>{t('vouched_by')}</th></tr>
			</thead>
			<tbody>
				{#each layers as layer (layer.source)}
					<tr>
						<td><code>{layer.source}</code></td>
						<td>{layer.version || '—'}</td>
						<td>{layer.domains.join(', ')}</td>
						<td>{layer.vouchedBy.length ? layer.vouchedBy.join(', ') : t('own_layer')}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else if status.codex}
		<p class="muted">{t('legacy_codex', { id: String(status.codex.id) })}</p>
	{:else}
		<p class="muted">{t('no_codex')}</p>
	{/if}

	{#if status.pending}
		<p class="notice" data-testid="pending">
			{t('pending_codex', { id: shortId(status.pending.id) })}
			<TimeText epoch={status.pending.activates_at} {zones} />
		</p>
	{/if}
</section>
