<script lang="ts">
	import { formatInZone } from '../../../_shared/frontend/realm-time';
	import { dayInZone } from './days.ts';

	/** A time as the day it falls on in the realm's time zone, the exact time and zone in its tooltip. */
	let { epoch, zone }: { epoch: number | null; zone: string } = $props();
</script>

{#if epoch}
	<time datetime={new Date(epoch * 1000).toISOString()} title={formatInZone(epoch, zone)}>{dayInZone(epoch, zone)}</time>
{:else}
	—
{/if}
