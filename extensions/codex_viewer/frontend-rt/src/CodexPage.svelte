<script lang="ts">
	import { onMount } from 'svelte';
	import CodexViewer from './CodexViewer.svelte';
	import LegislationPage from './LegislationPage.svelte';
	import { loadExtensionI18n, t } from './lib/i18n';
	import { isLayered, type CodexStatus } from './legislation';

	let { ctx }: { ctx: any } = $props();

	type Tab = 'legislation' | 'source';

	let status = $state<CodexStatus | null>(null);
	let tab = $state<Tab>('legislation');

	$effect(() => {
		const localeStore = ctx?.locale;
		if (!localeStore?.subscribe) {
			void loadExtensionI18n('en');
			return;
		}
		return localeStore.subscribe((locale: string | null | undefined) => void loadExtensionI18n(locale || 'en'));
	});

	async function reload() {
		try {
			// Only the current state is wanted here: the viewer reads the history itself.
			const reply = await ctx.read('codex_status', { count: 1 });
			if (reply?.ok) status = reply;
		} catch (e) {
			console.warn('codex_status failed:', e);
		}
	}

	/** A realm that runs, or is installing, legislation in layers, or takes it from another realm, has this page too. */
	let layered = $derived(
		!!status && (isLayered(status.codex) || !!status.pending || !!status.job || status.sync_sources.length > 0),
	);

	onMount(() => void reload());
</script>

{#if status && layered}
	<div class="page">
		<div class="tabs" role="tablist">
			<button type="button" role="tab" aria-selected={tab === 'legislation'} class:active={tab === 'legislation'} onclick={() => (tab = 'legislation')}>
				{t('tab_legislation')}
			</button>
			<button type="button" role="tab" aria-selected={tab === 'source'} class:active={tab === 'source'} onclick={() => (tab = 'source')}>
				{t('tab_source')}
			</button>
		</div>
		<div class="body">
			{#if tab === 'legislation'}
				<LegislationPage {ctx} {status} {reload} />
			{:else}
				<CodexViewer {ctx} />
			{/if}
		</div>
	</div>
{:else}
	<CodexViewer {ctx} />
{/if}

<style>
	.page {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	.tabs {
		display: flex;
		gap: 4px;
		padding: 8px 16px 0;
		border-bottom: 1px solid #e5e7eb;
		background: #fff;
	}

	.tabs button {
		padding: 8px 14px;
		border: none;
		border-bottom: 2px solid transparent;
		background: none;
		font-size: 0.875rem;
		color: #6b7280;
		cursor: pointer;
	}

	.tabs button.active {
		color: #4338ca;
		border-bottom-color: #6366f1;
		font-weight: 600;
	}

	.body {
		flex: 1;
		min-height: 0;
	}
</style>
