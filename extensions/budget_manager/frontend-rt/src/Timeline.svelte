<script lang="ts">
	// Hand-rolled interactive epoch timeline (no charting library).
	interface Epoch {
		id: string;
		start_date: string;
		end_date: string;
		start_ts: number;
		end_ts: number;
		status: string;
		stored?: boolean;
		is_current?: boolean;
		pool?: number;
		allocated?: number;
		unallocated?: number;
	}

	let {
		epochs = [],
		nowTs = 0,
		selected = '',
		format = (v: number) => String(v),
		onselect = (_id: string) => {},
	}: {
		epochs: Epoch[];
		nowTs: number;
		selected: string;
		format?: (v: number) => string;
		onselect?: (id: string) => void;
	} = $props();

	const W = 960;
	const H = 200;
	const PAD = { top: 28, bottom: 36, left: 12, right: 12 };
	const MIN_SPAN = 3600; // 1 hour minimum window

	let viewCenter = $state(0);
	let viewSpan = $state(0);
	let dragging = $state(false);
	let dragStartX = 0;
	let dragCenter = 0;
	let dragMoved = false;

	// Initialise / refresh view from data.
	$effect(() => {
		if (!epochs.length) return;
		const minTs = epochs[0].start_ts;
		const maxTs = epochs[epochs.length - 1].end_ts;
		if (!viewCenter) viewCenter = nowTs || (minTs + maxTs) / 2;
		if (!viewSpan) viewSpan = Math.max(maxTs - minTs, MIN_SPAN);
	});

	const viewStart = $derived(viewCenter - viewSpan / 2);
	const viewEnd = $derived(viewCenter + viewSpan / 2);

	const layout = $derived.by(() => {
		const span = Math.max(viewEnd - viewStart, 1);
		const innerW = W - PAD.left - PAD.right;
		const blocks = epochs
			.filter((e) => e.end_ts >= viewStart && e.start_ts <= viewEnd)
			.map((e) => {
				const x0 = PAD.left + ((Math.max(e.start_ts, viewStart) - viewStart) / span) * innerW;
				const x1 = PAD.left + ((Math.min(e.end_ts, viewEnd) - viewStart) / span) * innerW;
				const w = Math.max(x1 - x0, 4);
				return { ...e, x: x0, w };
			});
		const nowX =
			nowTs >= viewStart && nowTs <= viewEnd
				? PAD.left + ((nowTs - viewStart) / span) * innerW
				: null;
		return { blocks, span, nowX };
	});

	function shortLabel(ep: Epoch): string {
		const s = ep.start_date || '';
		if (s.includes('T')) return s.slice(11, 16);
		if (ep.id.startsWith('m')) return s.slice(11, 16) || ep.id;
		if (ep.id.startsWith('W') || ep.id.startsWith('B')) return s.slice(5);
		return ep.id.length > 10 ? ep.id.replace(/^FY/, '') : ep.id;
	}

	function statusColor(status: string, isSelected: boolean): string {
		if (isSelected) return '#111827';
		if (status === 'open') return '#4f46e5';
		if (status === 'future') return '#d1d5db';
		return '#9ca3af';
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const factor = e.deltaY > 0 ? 1.15 : 0.87;
		viewSpan = Math.max(MIN_SPAN, viewSpan * factor);
	}

	function onPointerDown(e: PointerEvent) {
		dragging = true;
		dragMoved = false;
		dragStartX = e.clientX;
		dragCenter = viewCenter;
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		if (Math.abs(e.clientX - dragStartX) > 3) dragMoved = true;
		const innerW = W - PAD.left - PAD.right;
		const dx = e.clientX - dragStartX;
		viewCenter = dragCenter - (dx / innerW) * viewSpan;
	}

	function onPointerUp(e: PointerEvent) {
		dragging = false;
		try {
			(e.currentTarget as Element).releasePointerCapture(e.pointerId);
		} catch {
			/* already released */
		}
	}

	function zoom(factor: number) {
		viewSpan = Math.max(MIN_SPAN, viewSpan * factor);
	}

	function goNow() {
		viewCenter = nowTs;
		const total =
			epochs.length > 1
				? epochs[epochs.length - 1].end_ts - epochs[0].start_ts
				: Math.max(epochs[0]?.end_ts - epochs[0]?.start_ts || 0, MIN_SPAN);
		viewSpan = Math.max(total * 1.05, MIN_SPAN);
	}

	function fitAll() {
		if (!epochs.length) return;
		viewCenter = (epochs[0].start_ts + epochs[epochs.length - 1].end_ts) / 2;
		viewSpan = Math.max(
			epochs[epochs.length - 1].end_ts - epochs[0].start_ts,
			MIN_SPAN,
		);
	}
</script>

<div class="timeline-wrap">
	<div class="toolbar">
		<button type="button" class="btn" onclick={() => zoom(0.75)} title="Zoom in">+</button>
		<button type="button" class="btn" onclick={() => zoom(1.33)} title="Zoom out">−</button>
		<button type="button" class="btn" onclick={goNow}>Now</button>
		<button type="button" class="btn" onclick={fitAll}>Fit all</button>
		<span class="hint">Drag to pan · scroll to zoom · click an epoch to select</span>
	</div>

	{#if epochs.length === 0}
		<div class="empty">No epochs to display</div>
	{:else}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<svg
			viewBox="0 0 {W} {H}"
			class="timeline"
			role="img"
			aria-label="Fiscal epoch timeline"
			onwheel={onWheel}
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
		>
			<!-- axis -->
			<line
				x1={PAD.left}
				y1={H - PAD.bottom}
				x2={W - PAD.right}
				y2={H - PAD.bottom}
				class="axis"
			/>

			{#if layout.nowX !== null}
				<line x1={layout.nowX} y1={PAD.top} x2={layout.nowX} y2={H - PAD.bottom} class="now-line" />
				<text x={layout.nowX + 4} y={PAD.top + 10} class="now-label">now</text>
			{/if}

			{#each layout.blocks as block (block.id)}
				{@const sel = block.id === selected}
				{@const fill = statusColor(block.status, sel)}
				<g
					class="epoch"
					class:selected={sel}
					role="button"
					tabindex="0"
					onpointerdown={(e) => e.stopPropagation()}
					onclick={(e) => {
						e.stopPropagation();
						if (!dragMoved) onselect(block.id);
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							onselect(block.id);
						}
					}}
				>
					<rect
						x={block.x}
						y={PAD.top + 18}
						width={block.w}
						height={H - PAD.top - PAD.bottom - 24}
						rx="4"
						fill={fill}
						opacity={block.status === 'future' ? 0.45 : sel ? 1 : 0.85}
					/>
					{#if block.w > 36}
						<text x={block.x + block.w / 2} y={PAD.top + 32} text-anchor="middle" class="label">
							{shortLabel(block)}
						</text>
					{/if}
					{#if block.w > 56 && (block.pool ?? 0) > 0}
						<text
							x={block.x + block.w / 2}
							y={PAD.top + 48}
							text-anchor="middle"
							class="value"
						>
							{format(block.pool ?? 0)}
						</text>
					{/if}
					<title>
						{block.id} ({block.status})
						{block.start_date} → {block.end_date}
						{#if (block.pool ?? 0) > 0}
							· pool {format(block.pool ?? 0)}
						{/if}
					</title>
				</g>
			{/each}
		</svg>

		<div class="legend">
			<span><i class="dot open"></i> open</span>
			<span><i class="dot closed"></i> closed</span>
			<span><i class="dot future"></i> future</span>
			<span><i class="dot selected"></i> selected</span>
		</div>
	{/if}
</div>

<style>
	.timeline-wrap {
		width: 100%;
	}
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 0.5rem;
	}
	.btn {
		padding: 0.25rem 0.55rem;
		font-size: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		background: white;
		color: #374151;
		cursor: pointer;
	}
	.btn:hover {
		background: #f9fafb;
	}
	.hint {
		margin-left: auto;
		font-size: 0.7rem;
		color: #9ca3af;
	}
	.timeline {
		width: 100%;
		height: auto;
		display: block;
		cursor: grab;
		user-select: none;
		touch-action: none;
	}
	.timeline:active {
		cursor: grabbing;
	}
	.axis {
		stroke: #e5e7eb;
		stroke-width: 1;
	}
	.now-line {
		stroke: #f59e0b;
		stroke-width: 1.5;
		stroke-dasharray: 4 3;
	}
	.now-label {
		font-size: 10px;
		fill: #d97706;
		font-weight: 600;
	}
	.epoch {
		cursor: pointer;
	}
	.epoch.selected rect {
		stroke: #111827;
		stroke-width: 2;
	}
	.label {
		font-size: 10px;
		font-weight: 600;
		fill: white;
		pointer-events: none;
	}
	.value {
		font-size: 9px;
		fill: rgba(255, 255, 255, 0.9);
		pointer-events: none;
	}
	.legend {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
		font-size: 0.7rem;
		color: #6b7280;
	}
	.dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 2px;
		margin-right: 0.25rem;
		vertical-align: middle;
	}
	.dot.open {
		background: #4f46e5;
	}
	.dot.closed {
		background: #9ca3af;
	}
	.dot.future {
		background: #d1d5db;
	}
	.dot.selected {
		background: #111827;
	}
	.empty {
		padding: 3rem 0;
		text-align: center;
		color: #9ca3af;
		font-size: 0.875rem;
	}
</style>
