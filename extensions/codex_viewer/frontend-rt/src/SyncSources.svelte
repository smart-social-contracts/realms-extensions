<script lang="ts">
	import { t } from './lib/i18n';
	import TimeText from './TimeText.svelte';
	import { LEAST_INTERVAL, MOST_INTERVAL, complianceOf, noteOf, parseInterval, type Release, type SyncSource } from './legislation';

	let {
		sources,
		check,
		zones,
		canPropose,
		canConfigure,
		busy,
		proposed,
		onPropose,
		onCheckNow,
		onSaveInterval,
		onOpenProposal,
	}: {
		sources: SyncSource[];
		check: { interval: number; due: number };
		zones: { official: string; local: string };
		/** Anyone with `proposal.create` may press "Propose install" (§11.4). */
		canPropose: boolean;
		/** The admins' `realm.configure`: the interval and "check now". */
		canConfigure: boolean;
		busy: boolean;
		/** The proposals filed from this page, by `<source>@<version>`. */
		proposed: Record<string, string>;
		/** `runs` is the release the realm runs of the layer, for a step back to name. */
		onPropose: (release: Release, runs?: string) => void;
		onCheckNow: () => void;
		onSaveInterval: (hours: number) => void;
		onOpenProposal: (proposal: string) => void;
	} = $props();

	let typed = $state('');
	let interval = $derived(parseInterval(typed || String(check.interval)));
</script>

<section class="card" data-testid="sync-sources">
	<h2>{t('from_above')}</h2>
	{#each sources as source (source.source)}
		{@const flag = complianceOf(source.compliance)}
		<div class="source" data-testid="source">
			<p class="line">
				<strong>{source.name || source.source}</strong>
				<span class="badge" class:bad={flag.state === 'non_compliant'} class:warn={flag.state === 'unknown'} data-testid="compliance">
					{t(`compliance_${flag.state}`)}
				</span>
			</p>
			{#if flag.state === 'non_compliant'}
				<p class="error">
					{t('behind_since')} <TimeText epoch={flag.since} {zones} /><br />
					{t('stale_layers', { layers: flag.stale.join(', ') })}
				</p>
			{/if}
			{#each source.notes ?? [] as note (note.source + note.kind)}
				<p class="notice" data-testid="source-note" data-kind={note.kind}>
					{t(`note_${note.kind}`, { source: note.source, runs: note.runs, lists: note.lists })}
				</p>
			{/each}
			{#if source.error}
				<p class="error" data-testid="source-error">{t('check_failed', { reason: source.error })}</p>
			{/if}
			<p class="muted">{t('last_checked')} <TimeText epoch={source.checked_at} {zones} /></p>

			{#each source.installable as release (release.source + release.version)}
				{@const key = `${release.source}@${release.version}`}
				{@const runs = noteOf(source.notes, release.source, 'went_back')?.runs ?? ''}
				<p class="line release" data-testid="release">
					<span>{t('release_line', { source: release.source, version: release.version })}</span>
					<span class="muted">{t('effective')} <TimeText epoch={release.effective_from} {zones} /></span>
					{#if proposed[key]}
						<button type="button" class="btn" onclick={() => onOpenProposal(proposed[key])}>{t('open_proposal', { proposal: proposed[key] })}</button>
					{:else if canPropose}
						<button type="button" class="btn" class:primary={!release.step_back} disabled={busy} onclick={() => onPropose(release, runs)}>
							{release.step_back ? t('propose_step_back') : t('propose_install')}
						</button>
					{/if}
				</p>
				{#if release.step_back}
					<p class="error" data-testid="step-back">{t('step_back_warning', { source: release.source, version: release.version, runs })}</p>
				{/if}
			{:else}
				<p class="muted">{t('nothing_to_install')}</p>
			{/each}
		</div>
	{/each}

	<p class="muted" data-testid="schedule">
		{t('check_every', { hours: check.interval })}
		{#if check.due}· {t('next_check')} <TimeText epoch={check.due} {zones} />{/if}
	</p>
	{#if canConfigure}
		<form
			class="actions"
			onsubmit={(event) => {
				event.preventDefault();
				if (interval !== null) onSaveInterval(interval);
			}}
		>
			<label>
				{t('interval_hours')}
				<input type="text" inputmode="numeric" placeholder={String(check.interval)} bind:value={typed} />
			</label>
			<button type="submit" class="btn" disabled={busy || interval === null || interval === check.interval}>{t('save_interval')}</button>
			<button type="button" class="btn" disabled={busy} onclick={onCheckNow}>{t('check_now')}</button>
		</form>
		{#if interval === null}
			<p class="error">{t('interval_range', { least: LEAST_INTERVAL, most: MOST_INTERVAL })}</p>
		{/if}
	{/if}
</section>
