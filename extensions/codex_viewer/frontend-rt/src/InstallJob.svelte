<script lang="ts">
	import { t } from './lib/i18n';
	import TimeText from './TimeText.svelte';
	import type { InstallJob } from './legislation';

	let {
		job,
		zones,
		canResume,
		busy,
		onResume,
	}: {
		job: InstallJob;
		zones: { official: string; local: string };
		/** Whether the caller may resume a paused job (permission `codex.install`). */
		canResume: boolean;
		busy: boolean;
		onResume: (job: InstallJob) => void;
	} = $props();
</script>

<section class="card" data-testid="install-job">
	<h2>{t('install_job')}</h2>
	<p class="line">
		<code>{job.id}</code>
		<span class="badge" class:bad={job.status === 'failed'} class:warn={job.status === 'paused'} data-testid="job-status">
			{t(`job_${job.status}`)}
		</span>
		<span class="muted">{t('step')}: {t(`step_${job.step}`)}</span>
	</p>
	<p class="muted">
		{t('started')} <TimeText epoch={job.started_at} {zones} />
		{#if job.finished_at}· {t('finished')} <TimeText epoch={job.finished_at} {zones} />{/if}
		{#if job.proposal}· {t('proposal_of', { proposal: job.proposal })}{/if}
	</p>
	{#if job.error}
		<p class="error" data-testid="job-error">{job.error}</p>
	{/if}
	{#if job.status === 'paused'}
		<p class="notice">{t('paused_hint')}</p>
		{#if canResume}
			<button type="button" class="btn primary" disabled={busy} onclick={() => onResume(job)}>{t('resume')}</button>
		{:else}
			<p class="muted">{t('resume_admin_only')}</p>
		{/if}
	{/if}
</section>
