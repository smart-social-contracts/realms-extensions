<script lang="ts">
	import { t } from './lib/i18n';
	import { rowOrigin, valueText, type DomainView } from './legislation';

	let { views }: { views: Record<string, DomainView> } = $props();

	let domains = $derived(Object.keys(views).sort());
	let chosen = $state('');
	let domain = $derived(views[chosen] ?? views[domains[0]]);
</script>

<section class="card" data-testid="views">
	<h2>{t('flattened_view')}</h2>
	<p class="muted">{t('flattened_hint')}</p>
	{#if domains.length === 0}
		<p class="muted">{t('no_views')}</p>
	{:else}
		<label>
			{t('domain')}
			<select value={domain.domain} onchange={(event) => (chosen = event.currentTarget.value)}>
				{#each domains as name (name)}
					<option value={name}>{name}</option>
				{/each}
			</select>
		</label>
		<p class="muted">{t('path')}: <code>{domain.path.join(' → ')}</code></p>
		<table data-testid="view-table">
			<thead>
				<tr><th>{t('name')}</th><th>{t('kind')}</th><th>{t('from_layer')}</th><th>{t('legislation')}</th></tr>
			</thead>
			<tbody>
				{#each domain.members as row (row.name)}
					{@const origin = rowOrigin(row)}
					<tr>
						<td><code>{row.name}</code>{#if row.kind === 'setting'}{' '}<span class="value">= {valueText(row.value)}</span>{/if}</td>
						<td>{row.mark ? `${row.kind} · ${t(`mark_${row.mark}`)}` : row.kind}</td>
						<td>
							<code>{origin.applies}</code>
							{#if origin.overrides.length}<span class="muted">{t('overrides', { layers: origin.overrides.join(', ') })}</span>{/if}
						</td>
						<td>{origin.legislation ?? '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>
