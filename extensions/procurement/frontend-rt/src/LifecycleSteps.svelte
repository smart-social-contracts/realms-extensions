<script lang="ts">
	export interface LifecycleStep {
		status: string;
		label: string;
		tip: string;
	}

	let {
		steps,
		currentStatus = 'draft',
		compact = false,
	}: {
		steps: LifecycleStep[];
		currentStatus?: string;
		compact?: boolean;
	} = $props();

	let openTip: string | null = $state(null);

	function stepIndex(status: string) {
		return steps.findIndex((s) => s.status === status);
	}

	function stepState(stepStatus: string): 'done' | 'current' | 'upcoming' {
		const cur = stepIndex(currentStatus);
		const idx = stepIndex(stepStatus);
		if (idx < 0) return 'upcoming';
		if (cur < 0) return idx === 0 ? 'current' : 'upcoming';
		if (idx < cur) return 'done';
		if (idx === cur) return 'current';
		return 'upcoming';
	}

	function toggleTip(status: string) {
		openTip = openTip === status ? null : status;
	}

	function closeTips() {
		openTip = null;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="lifecycle {compact ? 'lifecycle--compact' : ''}"
	role="list"
	aria-label="Request For Proposal lifecycle"
	onclick={closeTips}
>
	{#each steps as step, i}
		{@const state = stepState(step.status)}
		<div class="lifecycle-step lifecycle-step--{state}" role="listitem">
			<div class="lifecycle-step__marker" aria-hidden="true">
				{#if state === 'done'}
					<svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<span>{i + 1}</span>
				{/if}
			</div>

			<div class="lifecycle-step__body">
				<div class="lifecycle-step__label-row">
					<span class="lifecycle-step__label">{step.label}</span>
					<button
						type="button"
						class="info-btn"
						class:info-btn--open={openTip === step.status}
						aria-label={`About ${step.label}`}
						aria-expanded={openTip === step.status}
						onclick={(e) => {
							e.stopPropagation();
							toggleTip(step.status);
						}}
					>
						<svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5" aria-hidden="true">
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="info-tip">{step.tip}</span>
					</button>
				</div>
				{#if state === 'current' && !compact}
					<span class="lifecycle-step__current">You are here</span>
				{/if}
			</div>

			{#if i < steps.length - 1}
				<div class="lifecycle-connector" aria-hidden="true"></div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.lifecycle {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0;
		width: 100%;
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid rgb(229 231 235);
		background: rgb(249 250 251);
	}

	:global(.dark) .lifecycle {
		border-color: rgb(55 65 81);
		background: rgb(17 24 39);
	}

	.lifecycle-step {
		display: flex;
		align-items: flex-start;
		flex: 1 1 8rem;
		min-width: 7rem;
		position: relative;
		gap: 0.5rem;
	}

	.lifecycle--compact .lifecycle-step {
		flex: 1 1 6rem;
		min-width: 5.5rem;
	}

	.lifecycle-step__marker {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		flex-shrink: 0;
		border: 2px solid rgb(209 213 219);
		background: white;
		color: rgb(107 114 128);
	}

	.lifecycle-step--done .lifecycle-step__marker {
		border-color: rgb(34 197 94);
		background: rgb(220 252 231);
		color: rgb(22 101 52);
	}

	.lifecycle-step--current .lifecycle-step__marker {
		border-color: rgb(37 99 235);
		background: rgb(37 99 235);
		color: white;
	}

	.lifecycle-step__body {
		flex: 1;
		min-width: 0;
		padding-top: 0.125rem;
	}

	.lifecycle-step__label-row {
		display: flex;
		align-items: flex-start;
		gap: 0.25rem;
	}

	.lifecycle-step__label {
		font-size: 0.8125rem;
		font-weight: 600;
		line-height: 1.25;
		color: rgb(55 65 81);
	}

	:global(.dark) .lifecycle-step__label {
		color: rgb(229 231 235);
	}

	.lifecycle-step--current .lifecycle-step__label {
		color: rgb(29 78 216);
	}

	.lifecycle-step--done .lifecycle-step__label {
		color: rgb(22 101 52);
	}

	.lifecycle-step__current {
		display: block;
		margin-top: 0.125rem;
		font-size: 0.6875rem;
		color: rgb(37 99 235);
	}

	.lifecycle-connector {
		display: none;
	}

	@media (min-width: 768px) {
		.lifecycle {
			flex-wrap: nowrap;
			align-items: flex-start;
		}

		.lifecycle-step {
			flex-direction: column;
			align-items: center;
			text-align: center;
			padding-bottom: 0;
		}

		.lifecycle-step__body {
			width: 100%;
		}

		.lifecycle-step__label-row {
			justify-content: center;
		}

		.lifecycle-connector {
			display: block;
			position: absolute;
			top: 0.875rem;
			left: calc(50% + 1rem);
			right: calc(-50% + 1rem);
			height: 2px;
			background: rgb(209 213 219);
			z-index: 0;
		}

		.lifecycle-step--done .lifecycle-connector {
			background: rgb(134 239 172);
		}

		.lifecycle-step:last-child .lifecycle-connector {
			display: none;
		}
	}

	.info-btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.125rem;
		border: none;
		background: transparent;
		color: rgb(156 163 175);
		cursor: pointer;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.info-btn:hover,
	.info-btn:focus-visible,
	.info-btn--open {
		color: rgb(37 99 235);
		outline: none;
	}

	.info-tip {
		display: none;
		position: absolute;
		left: 50%;
		bottom: calc(100% + 0.5rem);
		transform: translateX(-50%);
		width: max-content;
		max-width: 14rem;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		background: rgb(17 24 39);
		color: white;
		font-size: 0.75rem;
		font-weight: 400;
		line-height: 1.35;
		text-align: left;
		z-index: 20;
		box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
		pointer-events: none;
	}

	.info-tip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6px solid transparent;
		border-top-color: rgb(17 24 39);
	}

	.info-btn:hover .info-tip,
	.info-btn:focus-visible .info-tip,
	.info-btn--open .info-tip {
		display: block;
	}

	@media (max-width: 720px) {
		.lifecycle {
			padding: 0.75rem 0;
			border-radius: 0;
			border-left: none;
			border-right: none;
		}

		.info-tip {
			left: auto;
			right: 0;
			transform: none;
			max-width: 12rem;
		}

		.info-tip::after {
			left: auto;
			right: 0.5rem;
			transform: none;
		}
	}
</style>
