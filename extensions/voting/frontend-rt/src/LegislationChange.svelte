<script lang="ts">
	import MonacoDiffPane from './MonacoDiffPane.svelte';
	import { t } from './lib/i18n';
	import {
		MAX_CHANGE_LIST,
		MAX_CHAPTER,
		MAX_REPORT,
		differenceOf,
		fetchFirstPinned,
		fetchPinned,
		isStepBack,
		readChangeList,
		runningRelease,
		summaryFor,
		type ChangeList,
		type ChapterEntry,
		type Fetched,
		type ReleaseChange,
		type SyncSourceView,
	} from './legislationChange';

	/**
	 * What an install proposal changes (§7): the change list its action pins, read from its address and checked against
	 * the checksum, the chapters it sets or removes next to the ones the realm runs, and the analysis report its maker
	 * attached, which the realm has not checked.
	 */
	let {
		changeList,
		release,
		releaseChange,
		open,
		locale,
		read,
	}: {
		/** The action's `{url, checksum}`; null for the install of a release. */
		changeList: { url: string; checksum: string } | null;
		/** The action's `{source, version}` for the install of a release, which the realm builds when it runs. */
		release: { source: string; version: string } | null;
		/** What `proposal_get` says of how that release stands against the one the realm runs (`release_change`), if it does. */
		releaseChange?: ReleaseChange | null;
		/** Whether the proposal can still run: a change list the realm would refuse as stale is said so only then. */
		open: boolean;
		locale: string;
		read: (name: string, args?: Record<string, unknown>) => Promise<any>;
	} = $props();

	let list = $state<ChangeList | null>(null);
	let failure = $state('');
	// The codex the realm runs ("" and no chapters when it runs none, or one of the earlier kind); null while unknown.
	let running = $state<{ id: string; chapters: Record<string, { sha256: string }> } | null>(null);
	let report = $state<Fetched | null>(null);
	// The chapters whose changes are open, with the two texts once they are read.
	let shown = $state<Record<string, { before: string; after: string } | { error: string } | 'loading'>>({});

	// For the install of a release: the release of that layer the realm runs now ('' when none, or unknown), and the sync
	// sources `codex_status` says (undefined until read), whose `installable` mark a step back.
	let runsNow = $state('');
	let sources = $state<SyncSourceView[] | undefined>(undefined);
	// A step back when the realm says so of this proposal's release (`releaseChange`) or a sync source marks it (isStepBack).
	let stepBack = $derived(!!release && isStepBack(sources, release, releaseChange));
	let unplaced = $derived(releaseChange?.order === 'tied' || releaseChange?.order === 'unknown');

	let summary = $derived(list ? summaryFor(list.summary, locale) : null);
	let stale = $derived(open && !!list && !!running && (list.replaces ?? '') !== running.id);

	const hex = (checksum: string) => checksum.replace(/^sha256:/, '');
	const reason = (fetched: Fetched) => (fetched.ok ? '' : t(`fetch_${fetched.reason}`));

	async function loadRelease() {
		if (!release) return;
		const status = await read('codex_status', { count: 1 });
		if (!status) return;
		runsNow = runningRelease(status.codex?.chapters, release.source);
		sources = status.sync_sources;
	}

	async function load() {
		if (!changeList) return;
		const fetched = await fetchPinned(changeList.url, hex(changeList.checksum), MAX_CHANGE_LIST);
		if (!fetched.ok) {
			failure = reason(fetched);
			return;
		}
		try {
			list = readChangeList(fetched.text);
		} catch {
			failure = t('change_invalid');
			return;
		}
		const status = await read('codex_status', { count: 1 });
		if (status) running = { id: String(status.codex?.id ?? ''), chapters: status.codex?.chapters ?? {} };
		if (list.report) report = await fetchPinned(list.report.url, list.report.sha256, MAX_REPORT);
	}

	async function toggle(entry: ChapterEntry) {
		if (entry.chapter in shown) {
			const { [entry.chapter]: _closed, ...rest } = shown;
			shown = rest;
			return;
		}
		shown = { ...shown, [entry.chapter]: 'loading' };
		const after = await fetchFirstPinned(entry.urls, hex(entry.sha256), MAX_CHAPTER);
		const current = running?.chapters[entry.chapter];
		const before = current ? await read('legislation_chapter', { chapter: current.sha256 }) : { ok: true, text: '' };
		shown = {
			...shown,
			[entry.chapter]: !after.ok
				? { error: reason(after) }
				: !before?.ok
					? { error: t('fetch_unreachable') }
					: { before: before.text, after: after.text },
		};
	}

	$effect(() => {
		void load();
		void loadRelease();
	});
</script>

<div class="space-y-4" data-testid="legislation-change">
	{#if release}
		<p class="text-sm text-gray-700" data-testid="release-install">{t('release_install', { version: release.version, source: release.source })}</p>
		{#if runsNow || releaseChange?.runs}
			<p class="text-sm text-gray-700" data-testid="release-runs">{t('release_runs', { version: releaseChange?.runs || runsNow, source: release.source })}</p>
		{/if}
		{#if stepBack}
			<p class="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2" data-testid="release-step-back">
				{t('release_step_back', { version: release.version, source: release.source, runs: releaseChange?.runs || runsNow || '—' })}
			</p>
		{:else if unplaced}
			<p class="text-xs text-gray-500" data-testid="release-unplaced">
				{t('release_unplaced', { version: release.version, source: release.source, runs: releaseChange?.runs || runsNow || '—' })}
			</p>
		{/if}
	{:else if failure}
		<p class="text-sm text-red-700" data-testid="change-failure">{t('change_unreadable', { reason: failure })}</p>
	{:else if !list}
		<p class="text-sm text-gray-500">{t('change_loading')}</p>
	{:else}
		<div>
			<h4 class="text-sm font-semibold text-gray-900 mb-1">{t('change_summary')}</h4>
			{#if summary}
				<p class="text-sm text-gray-700 whitespace-pre-line" lang={summary.language} data-testid="change-summary">{summary.text}</p>
				{#if summary.language !== locale.split('-')[0] && summary.language !== locale}
					<p class="text-xs text-gray-500 mt-1">{t('summary_language', { language: summary.language })}</p>
				{/if}
			{:else}
				<p class="text-sm text-gray-500">{t('change_no_summary')}</p>
			{/if}
		</div>

		<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
			<div>
				<dt class="text-xs text-gray-500">{t('change_realm')}</dt>
				<dd class="font-mono text-gray-900">{list.realm || '—'}</dd>
			</div>
			<div>
				<dt class="text-xs text-gray-500">{t('change_replaces')}</dt>
				<dd class="font-mono text-xs break-all text-gray-900">{list.replaces ?? '—'}</dd>
			</div>
		</dl>

		{#if stale}
			<p class="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2" data-testid="change-stale">
				{t('change_stale', { replaces: list.replaces ?? '—', running: running?.id || '—' })}
			</p>
		{/if}

		{#if list.set.length}
			<div>
				<h4 class="text-sm font-semibold text-gray-900 mb-1">{t('change_chapters')}</h4>
				<ul class="divide-y divide-gray-100 text-sm" data-testid="change-chapters">
					{#each list.set as entry (entry.chapter)}
						{@const difference = running ? differenceOf(entry, running.chapters) : null}
						<li class="py-2">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-mono text-gray-900">{entry.chapter}</span>
								{#if difference}
									<span class="px-2 py-0.5 rounded-full text-xs font-semibold {difference === 'same' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'}">{t(`chapter_${difference}`)}</span>
								{/if}
								{#if entry.size}<span class="text-xs text-gray-500">{t('chapter_size', { bytes: entry.size })}</span>{/if}
								{#if difference && difference !== 'same'}
									<button type="button" class="text-xs text-blue-600 hover:underline" onclick={() => toggle(entry)}>
										{entry.chapter in shown ? t('hide_changes') : t('show_changes')}
									</button>
								{/if}
							</div>
							{#if entry.chapter in shown}
								{@const text = shown[entry.chapter]}
								{#if text === 'loading'}
									<p class="text-xs text-gray-500 mt-2">{t('chapter_loading')}</p>
								{:else if 'error' in text}
									<p class="text-xs text-red-700 mt-2">{t('chapter_unreadable', { reason: text.error })}</p>
								{:else}
									<div class="mt-2 border border-gray-200 rounded-lg overflow-hidden">
										<MonacoDiffPane original={text.before} modified={text.after} />
									</div>
								{/if}
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if list.remove.length}
			<div>
				<h4 class="text-sm font-semibold text-gray-900 mb-1">{t('change_removes')}</h4>
				<ul class="text-sm font-mono text-gray-900" data-testid="change-removes">
					{#each list.remove as chapter (chapter)}<li>{chapter}</li>{/each}
				</ul>
			</div>
		{/if}

		<div class="rounded-lg border border-amber-200 bg-amber-50 p-4" data-testid="report">
			<h4 class="text-sm font-semibold text-gray-900">{t('report_heading')}</h4>
			<p class="text-xs text-amber-800 mt-1" data-testid="report-label">{t('report_label')}</p>
			{#if !list.report}
				<p class="text-sm text-gray-600 mt-2">{t('report_none')}</p>
			{:else if !report}
				<p class="text-sm text-gray-500 mt-2">{t('report_loading')}</p>
			{:else if !report.ok}
				<p class="text-sm text-red-700 mt-2">{t('report_unreadable', { reason: reason(report) })}</p>
			{:else}
				<pre class="text-xs bg-white border border-gray-200 rounded-lg p-3 mt-2 overflow-x-auto max-h-80 whitespace-pre-wrap text-gray-700" data-testid="report-text">{report.text}</pre>
			{/if}
		</div>
	{/if}
</div>
