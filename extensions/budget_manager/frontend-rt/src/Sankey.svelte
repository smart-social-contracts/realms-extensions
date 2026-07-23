<script lang="ts">
	// Hand-rolled SVG Sankey (no d3 — keeps the bundle tiny, issue #261).
	// Nodes carry a column index; values are raw currency units. All layout
	// math is derived, so the diagram re-flows when data changes.

	interface SankeyNode {
		id: string;
		label: string;
		column: number;
		value: number;
	}
	interface SankeyLink {
		source: string;
		target: string;
		value: number;
	}

	let {
		nodes = [],
		links = [],
		format = (v: number) => String(v),
	}: {
		nodes: SankeyNode[];
		links: SankeyLink[];
		format?: (v: number) => string;
	} = $props();

	const W = 960;
	const H = 440;
	const NODE_W = 14;
	const PAD_Y = 12;
	const MARGIN = { top: 10, bottom: 10, left: 4, right: 4 };

	// One hue family per column; shades cycle within a column.
	const PALETTES = [
		['#0ea5e9', '#38bdf8', '#0284c7', '#7dd3fc', '#0369a1'],
		['#6366f1', '#818cf8', '#4f46e5'],
		['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857', '#a7f3d0'],
		['#f59e0b', '#fbbf24', '#d97706', '#fcd34d', '#b45309', '#fde68a'],
	];

	let hovered: string | null = $state(null);

	const layout = $derived.by(() => {
		const cols = [...new Set(nodes.map((n) => n.column))].sort((a, b) => a - b);
		if (cols.length === 0) return null;

		// Node height must fit both its declared value and its link volume
		// (end columns can have inflow-only nodes).
		const volume = new Map<string, number>();
		for (const n of nodes) volume.set(n.id, Math.max(0, n.value || 0));
		const inflow = new Map<string, number>();
		const outflow = new Map<string, number>();
		for (const l of links) {
			outflow.set(l.source, (outflow.get(l.source) || 0) + l.value);
			inflow.set(l.target, (inflow.get(l.target) || 0) + l.value);
		}
		for (const n of nodes) {
			volume.set(
				n.id,
				Math.max(volume.get(n.id) || 0, inflow.get(n.id) || 0, outflow.get(n.id) || 0),
			);
		}

		// Global scale: the tallest column (values + inter-node padding) must
		// fit the drawable height, so k is the minimum feasible scale.
		const usable = H - MARGIN.top - MARGIN.bottom;
		let k = Infinity;
		for (const c of cols) {
			const colNodes = nodes.filter((n) => n.column === c);
			const total = colNodes.reduce((s, n) => s + (volume.get(n.id) || 0), 0);
			const padding = PAD_Y * Math.max(0, colNodes.length - 1);
			if (total > 0) k = Math.min(k, Math.max(0, usable - padding) / total);
		}
		if (!isFinite(k) || k <= 0) return null;

		const colX = new Map<number, number>();
		const span = W - MARGIN.left - MARGIN.right - NODE_W;
		for (let i = 0; i < cols.length; i++) {
			colX.set(cols[i], MARGIN.left + (cols.length === 1 ? 0 : (span * i) / (cols.length - 1)));
		}

		const placed = new Map<
			string,
			{ x: number; y: number; h: number; color: string; node: SankeyNode }
		>();
		for (const c of cols) {
			const colNodes = nodes.filter((n) => n.column === c);
			const total = colNodes.reduce((s, n) => s + (volume.get(n.id) || 0) * k, 0);
			const padding = PAD_Y * Math.max(0, colNodes.length - 1);
			let y = MARGIN.top + Math.max(0, (usable - total - padding) / 2);
			const palette = PALETTES[c % PALETTES.length];
			colNodes.forEach((n, i) => {
				const h = Math.max(2, (volume.get(n.id) || 0) * k);
				placed.set(n.id, {
					x: colX.get(c) || 0,
					y,
					h,
					color: palette[i % palette.length],
					node: n,
				});
				y += h + PAD_Y;
			});
		}

		// Ribbons: consume vertical space on each node edge in link order.
		const outOffset = new Map<string, number>();
		const inOffset = new Map<string, number>();
		const ribbons = [];
		const sorted = [...links].sort((a, b) => {
			const ya = placed.get(a.target)?.y ?? 0;
			const yb = placed.get(b.target)?.y ?? 0;
			return ya - yb;
		});
		for (const l of sorted) {
			const s = placed.get(l.source);
			const t = placed.get(l.target);
			if (!s || !t || l.value <= 0) continue;
			const th = l.value * k;
			const sy = s.y + (outOffset.get(l.source) || 0);
			const ty = t.y + (inOffset.get(l.target) || 0);
			outOffset.set(l.source, (outOffset.get(l.source) || 0) + th);
			inOffset.set(l.target, (inOffset.get(l.target) || 0) + th);
			const x0 = s.x + NODE_W;
			const x1 = t.x;
			const mx = (x0 + x1) / 2;
			ribbons.push({
				id: `${l.source}→${l.target}`,
				source: l.source,
				target: l.target,
				value: l.value,
				color: s.color,
				path:
					`M ${x0} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${x1} ${ty} ` +
					`L ${x1} ${ty + th} C ${mx} ${ty + th}, ${mx} ${sy + th}, ${x0} ${sy + th} Z`,
			});
		}

		const lastCol = cols[cols.length - 1];
		return { placed: [...placed.values()], ribbons, lastCol };
	});

	function labelAnchor(column: number): 'start' | 'end' {
		return layout && column === layout.lastCol && layout.lastCol !== 0 ? 'end' : 'start';
	}

	function labelX(x: number, column: number): number {
		return labelAnchor(column) === 'end' ? x - 6 : x + NODE_W + 6;
	}

	function isDimmed(id: string, kind: 'node' | 'ribbon', source = '', target = ''): boolean {
		if (!hovered) return false;
		if (kind === 'node') return id !== hovered && !connected(id);
		return source !== hovered && target !== hovered;
	}

	function connected(id: string): boolean {
		return links.some(
			(l) => (l.source === hovered && l.target === id) || (l.target === hovered && l.source === id),
		);
	}
</script>

{#if layout}
	<svg viewBox={`0 0 ${W} ${H}`} class="sankey" role="img" aria-label="Budget allocation flow">
		{#each layout.ribbons as r (r.id)}
			<path
				d={r.path}
				fill={r.color}
				class="ribbon"
				class:dim={isDimmed(r.id, 'ribbon', r.source, r.target)}
			>
				<title>{r.source.replace(/^\w+:/, '')} → {r.target.replace(/^\w+:/, '')}: {format(r.value)}</title>
			</path>
		{/each}
		{#each layout.placed as p (p.node.id)}
			<g
				class="node"
				class:dim={isDimmed(p.node.id, 'node')}
				onmouseenter={() => (hovered = p.node.id)}
				onmouseleave={() => (hovered = null)}
				role="presentation"
			>
				<rect x={p.x} y={p.y} width={NODE_W} height={p.h} rx="3" fill={p.color}>
					<title>{p.node.label}: {format(p.node.value)}</title>
				</rect>
				<text
					x={labelX(p.x, p.node.column)}
					y={p.y + p.h / 2 - 2}
					text-anchor={labelAnchor(p.node.column)}
					class="label"
				>
					{p.node.label}
				</text>
				<text
					x={labelX(p.x, p.node.column)}
					y={p.y + p.h / 2 + 12}
					text-anchor={labelAnchor(p.node.column)}
					class="value"
				>
					{format(p.node.value)}
				</text>
			</g>
		{/each}
	</svg>
{:else}
	<div class="empty">No flows in this epoch yet</div>
{/if}

<style>
	.sankey {
		width: 100%;
		height: auto;
		display: block;
	}
	.ribbon {
		opacity: 0.32;
		transition: opacity 0.15s ease;
	}
	.ribbon:hover {
		opacity: 0.6;
	}
	.ribbon.dim {
		opacity: 0.08;
	}
	.node rect {
		transition: opacity 0.15s ease;
		cursor: default;
	}
	.node.dim rect,
	.node.dim text {
		opacity: 0.25;
	}
	.label {
		font-size: 12px;
		font-weight: 600;
		fill: #374151;
	}
	.value {
		font-size: 11px;
		fill: #6b7280;
	}
	.empty {
		padding: 3rem 0;
		text-align: center;
		color: #9ca3af;
		font-size: 0.875rem;
	}
</style>
