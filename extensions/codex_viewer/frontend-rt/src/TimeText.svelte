<script lang="ts">
	import { formatRealmWide } from '../../../_shared/frontend/realm-time';
	import { t } from './lib/i18n';

	/** A realm-wide time (§4.5): in the official zone, with the quarter's own beside it when its clock differs. */
	let { epoch, zones }: { epoch: number | null; zones: { official: string; local: string } } = $props();

	let shown = $derived(epoch ? formatRealmWide(epoch, zones.official, zones.local) : null);
</script>

{#if shown && epoch}
	<time datetime={new Date(epoch * 1000).toISOString()}>{shown.official}</time>
	{#if shown.local}<span class="local">· {t('local_time', { time: shown.local })}</span>{/if}
{:else}
	—
{/if}

<style>
	.local {
		color: #6b7280;
	}
</style>
