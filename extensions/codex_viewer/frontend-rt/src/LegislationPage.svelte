<script lang="ts">
	import { UTC, isKnownZone } from '../../../_shared/frontend/realm-time';
	import { applied } from '../../../_shared/frontend/governed';
	import CodexSummary from './CodexSummary.svelte';
	import Failures from './Failures.svelte';
	import FlattenedViews from './FlattenedViews.svelte';
	import InstallJobCard from './InstallJob.svelte';
	import SyncSources from './SyncSources.svelte';
	import { t } from './lib/i18n';
	import { can, installProposal, isLayered, type CodexStatus, type DomainView, type InstallJob, type Release } from './legislation';

	let { ctx, status, reload }: { ctx: any; status: CodexStatus; reload: () => Promise<void> } = $props();

	let permissions = $state<string[]>([]);
	let views = $state<Record<string, DomainView> | null>(null);
	// The realm's official time zone (§4.5); a quarter also shows its own beside it.
	let zones = $state({ official: UTC, local: UTC });
	let busy = $state(false);
	let proposed = $state<Record<string, string>>({});

	/** A realm read, or null when it fails or is not open to the caller. */
	async function read(name: string, args: Record<string, unknown> = {}): Promise<any> {
		try {
			const reply = await ctx.read(name, args);
			return reply?.ok ? reply : null;
		} catch {
			return null;
		}
	}

	function notify(message: string, type: 'success' | 'error' = 'success') {
		ctx.notify?.(type, message);
	}

	/** An operation that changes the realm: the reply, or `{ ok: false, error }` when it is refused or fails. */
	async function run(name: string, args: Record<string, unknown> = {}): Promise<any> {
		busy = true;
		try {
			return (await ctx.run(name, args)) ?? { ok: false, error: `${name} returned no reply` };
		} catch (e: any) {
			return { ok: false, error: e?.message ?? String(e) };
		} finally {
			busy = false;
		}
	}

	async function loadAround() {
		const [me, info, flattened] = await Promise.all([
			read('me'),
			read('realm_info'),
			isLayered(status.codex) ? read('codex_views') : null,
		]);
		permissions = me?.permissions ?? [];
		const zone = info?.realm?.timezone;
		const own = typeof zone === 'string' && isKnownZone(zone) ? zone : UTC;
		const official = info?.realm?.official_timezone;
		zones = { official: typeof official === 'string' && isKnownZone(official) ? official : own, local: own };
		views = flattened?.views ?? null;
	}

	async function resume(job: InstallJob) {
		const reply = await run('codex_install_resume', { job: job.id });
		if (reply.ok) notify(t('resumed', { job: job.id }));
		else notify(reply.error || t('resume_failed'), 'error');
		await reload();
	}

	async function propose(release: Release) {
		const { title, description } = installProposal(t, release);
		const reply = await run('proposal_create', {
			title,
			description,
			action: { op: 'codex_install', args: { source: release.source, version: release.version } },
		});
		if (!reply.ok) {
			notify(reply.error || t('propose_failed'), 'error');
			return;
		}
		proposed = { ...proposed, [`${release.source}@${release.version}`]: String(reply.proposal) };
		notify(t('proposed', { proposal: String(reply.proposal) }));
	}

	function openProposal(id: string) {
		void ctx.navigate?.(`/extensions/voting/proposals/${encodeURIComponent(id)}`);
	}

	async function checkNow() {
		const reply = await run('codex_check_now');
		if (reply.ok) notify(t('check_started'));
		else notify(reply.error || t('check_failed_to_start'), 'error');
		// The check runs in the next message and reads each record by a call of its own.
		setTimeout(() => void reload(), 4000);
	}

	async function saveInterval(hours: number) {
		const reply = await run('codex_check_config', { interval: hours });
		if (reply.ok) notify(t('interval_saved', { hours }));
		else notify(reply.error || t('interval_failed'), 'error');
		await reload();
	}

	async function revert(codex: string) {
		const reply = await run('codex_revert_fast', { codex });
		if (applied(reply, notify, t('revert_failed'), '')) notify(t('reverted'));
		await reload();
	}

	// What is read besides the status (who the caller is, the zones, the flattened views) is read again whenever the
	// status is: every reload replaces it, and a revert or an install changes the flattened views.
	$effect(() => {
		void status;
		void loadAround();
	});
</script>

<div class="legislation" data-testid="legislation">
	<CodexSummary {status} {zones} />

	{#if status.job}
		<InstallJobCard
			job={status.job}
			{zones}
			canResume={can(permissions, 'codex.install')}
			{busy}
			onResume={resume}
		/>
	{/if}

	{#if status.sync_sources.length}
		<SyncSources
			sources={status.sync_sources}
			check={status.check}
			{zones}
			canPropose={can(permissions, 'proposal.create')}
			canConfigure={can(permissions, 'realm.configure')}
			{busy}
			{proposed}
			onPropose={propose}
			onCheckNow={checkNow}
			onSaveInterval={saveInterval}
			onOpenProposal={openProposal}
		/>
	{/if}

	<Failures
		failures={status.failures}
		previous={status.codex?.previous ?? ''}
		itTeam={status.it_team}
		canRevert={can(permissions, 'codex.revert_fast')}
		{busy}
		{zones}
		onRevert={revert}
	/>

	{#if views}
		<FlattenedViews {views} />
	{/if}
</div>

<style>
	.legislation {
		max-width: 64rem;
		margin: 0 auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		overflow-y: auto;
		height: 100%;
		box-sizing: border-box;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		color: #111827;
	}

	/* The sections are separate components: they share these rules. */
	.legislation :global(.card) {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 16px;
	}

	.legislation :global(h2) {
		margin: 0 0 8px;
		font-size: 1rem;
		font-weight: 600;
	}

	.legislation :global(p) {
		margin: 6px 0;
		font-size: 0.875rem;
	}

	.legislation :global(.line) {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.legislation :global(.muted) {
		color: #6b7280;
	}

	.legislation :global(.error) {
		color: #b91c1c;
		overflow-wrap: anywhere;
	}

	.legislation :global(.notice) {
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 6px;
		padding: 8px 12px;
	}

	.legislation :global(code) {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.8125rem;
	}

	.legislation :global(.badge) {
		padding: 1px 8px;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		background: #dcfce7;
		color: #166534;
	}

	.legislation :global(.badge.warn) {
		background: #fef3c7;
		color: #92400e;
	}

	.legislation :global(.badge.bad) {
		background: #fee2e2;
		color: #991b1b;
	}

	.legislation :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
		margin: 8px 0;
	}

	.legislation :global(th),
	.legislation :global(td) {
		text-align: left;
		padding: 6px 8px;
		border-bottom: 1px solid #f3f4f6;
		vertical-align: top;
		overflow-wrap: anywhere;
	}

	.legislation :global(th) {
		color: #6b7280;
		font-weight: 500;
		white-space: nowrap;
	}

	.legislation :global(.actions) {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 8px;
		margin-top: 8px;
	}

	.legislation :global(.source) {
		border-top: 1px solid #f3f4f6;
		padding-top: 8px;
		margin-top: 8px;
	}

	.legislation :global(.release) {
		justify-content: space-between;
	}

	.legislation :global(label) {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 0.8125rem;
		color: #374151;
	}

	.legislation :global(input),
	.legislation :global(select) {
		padding: 6px 10px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		background: #fff;
	}

	.legislation :global(.btn) {
		padding: 6px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: #fff;
		color: #374151;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}

	.legislation :global(.btn:hover:not(:disabled)) {
		background: #f9fafb;
	}

	.legislation :global(.btn:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.legislation :global(.btn.primary) {
		background: #4f46e5;
		border-color: #4f46e5;
		color: #fff;
	}

	.legislation :global(.btn.danger) {
		background: #b91c1c;
		border-color: #b91c1c;
		color: #fff;
	}

	.legislation :global(.value) {
		color: #4338ca;
	}
</style>
