<script lang="ts" module>
	import type { StageName } from './stages.ts';

	/** The colour of each stage, in the bar and in the legend that explains it. */
	export const STAGE_COLORS: Record<StageName, string> = {
		actual: 'bg-gray-800',
		committed: 'bg-amber-500',
		reserved: 'bg-blue-500',
		available: 'bg-green-100',
	};
</script>

<script lang="ts">
	import { bar, type Stages } from './stages.ts';

	/** One bar for a line's money: charged, committed, reserved and available, side by side, of what is planned. */
	let { stages, label }: { stages: Stages; label: string } = $props();
</script>

<div class="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100" style="min-width: 6rem" role="img" aria-label={label}>
	{#each bar(stages) as part (part.stage)}
		{#if part.percent > 0}
			<div class={STAGE_COLORS[part.stage]} style="width: {part.percent}%" data-stage={part.stage}></div>
		{/if}
	{/each}
</div>
