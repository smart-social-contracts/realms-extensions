<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount, onDestroy } from 'svelte';

	let { ctx }: { ctx: any } = $props();

	const VIEW = 32;
	const PAGE = 500;

	let lands: any[] = $state([]);
	let parcels: any[] = $state([]);
	let view = $state({ x: 0, y: 0 });
	let loading = $state(true);
	let refreshing = $state(false);
	let error = $state('');
	let accessDeniedOp = $state('');
	let success = $state('');
	let expanded = $state(false);
	let sidebarWidth = $state(380);
	let isResizing = $state(false);

	let selectedLandId = $state('');
	let drawMode = $state(false);
	let drawStart: [number, number] | null = $state(null);
	let drawEnd: [number, number] | null = $state(null);
	let draft = $state({ owner: '', kind: 'unassigned' });

	let transfer = $state({ land_id: '', to: '', order: '' });
	let landUpdate = $state({ land_id: '', status: '' });
	let submitting = $state(false);

	const landStatuses = [
		{ value: 'active', label: 'Active' },
		{ value: 'disputed', label: 'Disputed' },
	];

	const LAND_COLORS: Record<string, string> = {
		residential: '#4ade80',
		agricultural: '#fbbf24',
		industrial: '#6b7280',
		commercial: '#3b82f6',
		unassigned: '#e5e7eb',
	};

	let selectedLand = $derived(
		lands.find((l) => l.id === selectedLandId) ?? parcels.find((p) => p.id === selectedLandId) ?? null,
	);
	let draftRect = $derived.by(() => {
		if (!drawStart) return null;
		const [x1, y1] = drawStart;
		const [x2, y2] = drawEnd ?? drawStart;
		return { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1) + 1, height: Math.abs(y2 - y1) + 1 };
	});

	function landColor(type: string) {
		return LAND_COLORS[type] || LAND_COLORS.unassigned;
	}

	function fail(res: any, op: string) {
		if (/ needs |^sign in first/.test(res.error)) accessDeniedOp = op;
		else error = res.error;
	}

	function done(res: any, message: string) {
		success = res.requires_vote ? `Submitted for a vote as ${res.proposal}.` : message;
	}

	async function loadMap() {
		const res = await ctx.read('land_map', { x: view.x, y: view.y, w: VIEW, h: VIEW, count: 1 });
		if (res.ok) parcels = res.parcels;
		else fail(res, 'land_map');
	}

	async function loadLands(silent = false) {
		if (!silent) {
			if (lands.length === 0) loading = true;
			else refreshing = true;
		}
		error = '';
		accessDeniedOp = '';
		const all: any[] = [];
		let from: number | null = 1;
		while (from !== null) {
			const res = await ctx.read('land_list', { from, count: PAGE });
			if (!res.ok) {
				fail(res, 'land_list');
				break;
			}
			all.push(...res.lands);
			from = res.next;
		}
		lands = all;
		if (selectedLandId && !lands.some((l) => l.id === selectedLandId)) selectedLandId = '';
		await loadMap();
		loading = false;
		refreshing = false;
	}

	function pan(dx: number, dy: number) {
		view = { x: view.x + dx, y: view.y + dy };
		loadMap();
	}

	function selectLand(land: any | null, center = false) {
		selectedLandId = land?.id || '';
		if (!land) return;
		transfer = { land_id: land.id, to: '', order: '' };
		landUpdate = { land_id: land.id, status: land.status || 'active' };
		if (center) {
			view = { x: land.x - Math.floor((VIEW - land.width) / 2), y: land.y - Math.floor((VIEW - land.height) / 2) };
			loadMap();
		}
	}

	function cellAt(e: MouseEvent): [number, number] {
		const svg = e.currentTarget as SVGSVGElement;
		const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
		return [view.x + Math.floor(pt.x), view.y + Math.floor(pt.y)];
	}

	function onMapClick(e: MouseEvent) {
		if (!drawMode) return;
		const cell = cellAt(e);
		if (!drawStart || drawEnd) {
			drawStart = cell;
			drawEnd = null;
		} else {
			drawEnd = cell;
		}
	}

	function startDrawMode() {
		drawMode = true;
		drawStart = null;
		drawEnd = null;
		selectedLandId = '';
	}

	function cancelDrawMode() {
		drawMode = false;
		drawStart = null;
		drawEnd = null;
	}

	async function createDrawnParcel() {
		if (!draftRect || !draft.owner.trim()) return;
		submitting = true;
		error = '';
		success = '';
		const res = await ctx.run('land_register', { ...draftRect, owner: draft.owner.trim(), kind: draft.kind });
		submitting = false;
		if (!res.ok) {
			error = res.error;
			return;
		}
		done(res, `Land parcel ${res.land} registered.`);
		cancelDrawMode();
		await loadLands(true);
		if (res.land) selectLand(lands.find((l) => l.id === res.land) ?? null, true);
	}

	function setExpanded(next: boolean) {
		expanded = next;
		document.body.classList.toggle('land-registry-expanded', next);
		document.body.style.overflow = next ? 'hidden' : '';
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (expanded) {
				e.preventDefault();
				setExpanded(false);
			} else if (drawMode) {
				cancelDrawMode();
			}
		}
	}

	function onResizeStart(e: MouseEvent) {
		e.preventDefault();
		isResizing = true;
		const startX = e.clientX;
		const startWidth = sidebarWidth;
		const onMove = (ev: MouseEvent) => {
			sidebarWidth = Math.min(560, Math.max(280, startWidth + (ev.clientX - startX)));
		};
		const onUp = () => {
			isResizing = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	function ownerLabel(owner: string) {
		const [kind, id] = owner.split(':');
		return kind === 'Organization' ? `Org ${id}` : `User ${id}`;
	}

	async function updateOwnership() {
		submitting = true;
		error = '';
		success = '';
		const res = await ctx.run('land_transfer', { land: transfer.land_id, to: transfer.to.trim(), order: transfer.order.trim() });
		submitting = false;
		if (!res.ok) {
			error = res.error;
			return;
		}
		done(res, 'Ownership updated!');
		await loadLands(true);
	}

	async function updateLandProps() {
		const land = selectedLand;
		if (!land || landUpdate.status === land.status) return;
		submitting = true;
		error = '';
		success = '';
		const res = await ctx.run(landUpdate.status === 'disputed' ? 'land_freeze' : 'land_unfreeze', { land: land.id });
		submitting = false;
		if (!res.ok) {
			error = res.error;
			return;
		}
		done(res, 'Land updated!');
		await loadLands(true);
	}

	async function mintNFT() {
		submitting = true;
		error = '';
		success = '';
		const res = await ctx.run('land_mint_nft', { land: selectedLandId });
		submitting = false;
		if (!res.ok) {
			error = res.error;
			return;
		}
		done(res, `NFT minted! Token ID: ${res.token_id}`);
		await loadLands(true);
	}

	onMount(() => {
		window.addEventListener('keydown', onWindowKeydown);
		loadLands(false);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', onWindowKeydown);
		document.body.classList.remove('land-registry-expanded');
		document.body.style.overflow = '';
	});
</script>

<div class="land-registry" class:expanded class:resizing={isResizing}>
	{#if accessDeniedOp}
		<div class="denied-shell">
			{#if ctx.ui?.AccessDenied}
				{@const AccessDenied = ctx.ui.AccessDenied}
				<AccessDenied operation={accessDeniedOp} />
			{:else}
				<p class="muted">You need additional permissions to view this page.</p>
			{/if}
		</div>
	{:else}
		<aside class="sidebar" style="width: {sidebarWidth}px">
			<div class="sidebar-head">
				<div>
					<h2>Land Registry</h2>
					<p class="muted">{extensionDescription}</p>
					<p class="muted">{lands.length} parcel{lands.length !== 1 ? 's' : ''}</p>
				</div>
				<button type="button" class="ghost-btn" onclick={() => loadLands(true)} disabled={refreshing}>Refresh</button>
			</div>

			{#if error}<div class="alert error">{error}</div>{/if}
			{#if success}<div class="alert success">{success}</div>{/if}

			<div class="sidebar-toolbar">
				{#if drawMode}
					<button type="button" class="ghost-btn" onclick={cancelDrawMode}>Cancel draw</button>
					{#if draftRect}
						<button
							type="button"
							class="primary-btn"
							onclick={createDrawnParcel}
							disabled={submitting || !draft.owner.trim()}
						>
							Register {draftRect.width}×{draftRect.height} parcel
						</button>
					{/if}
				{:else}
					<button type="button" class="primary-btn" onclick={startDrawMode}>Draw parcel</button>
				{/if}
			</div>

			{#if drawMode}
				<div class="draw-panel">
					<label>Owner
						<input type="text" bind:value={draft.owner} placeholder="User ID or Organization:ID" />
					</label>
					<label>Type
						<select bind:value={draft.kind}>
							{#each Object.keys(LAND_COLORS) as type (type)}<option value={type}>{type}</option>{/each}
						</select>
					</label>
					{#if draftRect}
						<p class="muted">Parcel at ({draftRect.x}, {draftRect.y}), {draftRect.width}×{draftRect.height} cells (at most 16×16).</p>
					{:else}
						<p class="muted">Click two corner cells on the map to define the parcel area.</p>
					{/if}
				</div>
			{/if}

			<div class="parcel-list">
				{#if loading}
					<p class="muted center">Loading lands…</p>
				{:else if lands.length === 0}
					<p class="muted center">No parcels yet. Use “Draw parcel” on the map.</p>
				{:else}
					{#each lands as land (land.id)}
						<button
							type="button"
							class="parcel-row"
							class:selected={land.id === selectedLandId}
							onclick={() => selectLand(land, true)}
						>
							<span class="dot" style="background:{landColor(land.kind)}"></span>
							<span class="parcel-main">
								<strong>{land.id}</strong>
								<span class="muted">{land.kind} · ({land.x}, {land.y}) {land.width}×{land.height}</span>
							</span>
							<span class="parcel-status">{land.owner ? 'Owned' : 'Open'}</span>
						</button>
					{/each}
				{/if}
			</div>

			{#if selectedLand && !drawMode}
				<div class="detail-panel">
					<h3>{selectedLand.id}</h3>
					<p class="muted">{selectedLand.kind} · {selectedLand.status || 'active'}</p>
					<code class="parcel-code">
						({selectedLand.x}, {selectedLand.y}) {selectedLand.width}×{selectedLand.height} · {ownerLabel(selectedLand.owner)}
					</code>

					<form class="mini-form" onsubmit={(e) => { e.preventDefault(); updateOwnership(); }}>
						<h4>Ownership</h4>
						<input type="text" bind:value={transfer.to} placeholder="New owner: User ID or Organization:ID" />
						<input type="text" bind:value={transfer.order} placeholder="Court order (Verdict:ID)" />
						<button type="submit" class="primary-btn green" disabled={submitting || !transfer.to.trim() || !transfer.order.trim()}>
							Update ownership
						</button>
					</form>

					<form class="mini-form" onsubmit={(e) => { e.preventDefault(); updateLandProps(); }}>
						<h4>Properties</h4>
						<p class="readonly-field">
							<span class="readonly-label">Type</span>
							<span>{selectedLand.kind || 'unassigned'}</span>
						</p>
						<select bind:value={landUpdate.status}>
							{#each landStatuses as s (s.value)}<option value={s.value}>{s.label}</option>{/each}
						</select>
						<button type="submit" class="primary-btn amber" disabled={submitting}>Update land</button>
					</form>

					<form class="mini-form" onsubmit={(e) => { e.preventDefault(); mintNFT(); }}>
						<h4>Mint NFT</h4>
						{#if selectedLand.token_id}
							<p class="muted">Minted: token {selectedLand.token_id}</p>
						{:else}
							<p class="muted">Minted to the parcel's owner.</p>
						{/if}
						<button type="submit" class="primary-btn purple" disabled={submitting || !!selectedLand.token_id}>Mint NFT</button>
					</form>
				</div>
			{/if}
		</aside>

		<button
			type="button"
			class="resize-handle"
			aria-label="Resize sidebar"
			onmousedown={onResizeStart}
		></button>

		<div class="map-column">
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
			<svg
				class="land-map"
				class:drawing={drawMode}
				viewBox="0 0 {VIEW} {VIEW}"
				role="img"
				aria-label="Parcels from ({view.x}, {view.y})"
				onclick={onMapClick}
			>
				<defs>
					<pattern id="land-grid" width="1" height="1" patternUnits="userSpaceOnUse">
						<path d="M 1 0 L 0 0 0 1" fill="none" stroke="#d4d4d4" stroke-width="0.03" />
					</pattern>
				</defs>
				<rect width={VIEW} height={VIEW} fill="url(#land-grid)" />
				{#each parcels as p (p.id)}
					{@const selected = p.id === selectedLandId}
					<rect
						class="parcel"
						x={p.x - view.x}
						y={p.y - view.y}
						width={p.width}
						height={p.height}
						fill={landColor(p.kind)}
						fill-opacity={selected ? 0.85 : p.owner ? 0.7 : 0.5}
						stroke={selected ? '#2563eb' : p.status === 'disputed' ? '#dc2626' : '#1f2937'}
						stroke-width={selected ? 0.15 : 0.06}
						role="button"
						tabindex="0"
						onclick={(e) => {
							if (drawMode) return;
							e.stopPropagation();
							selectLand(p);
						}}
						onkeydown={(e) => e.key === 'Enter' && selectLand(p)}
					>
						<title>{p.id} · {p.kind} · {ownerLabel(p.owner)}</title>
					</rect>
				{/each}
				{#if draftRect}
					<rect
						x={draftRect.x - view.x}
						y={draftRect.y - view.y}
						width={draftRect.width}
						height={draftRect.height}
						fill="#2563eb"
						fill-opacity="0.3"
						stroke="#2563eb"
						stroke-width="0.08"
						stroke-dasharray="0.3 0.2"
						pointer-events="none"
					/>
				{/if}
			</svg>
			<div class="map-overlay map-overlay-top">
				<div class="map-actions">
					<span class="muted">({view.x}, {view.y}) – ({view.x + VIEW - 1}, {view.y + VIEW - 1})</span>
					<button type="button" class="ghost-btn" onclick={() => pan(-VIEW / 2, 0)} aria-label="Pan left">←</button>
					<button type="button" class="ghost-btn" onclick={() => pan(0, -VIEW / 2)} aria-label="Pan up">↑</button>
					<button type="button" class="ghost-btn" onclick={() => pan(0, VIEW / 2)} aria-label="Pan down">↓</button>
					<button type="button" class="ghost-btn" onclick={() => pan(VIEW / 2, 0)} aria-label="Pan right">→</button>
					<button type="button" class="ghost-btn" onclick={() => setExpanded(!expanded)} aria-pressed={expanded}>
						{expanded ? 'Exit full screen' : 'Expand'}
					</button>
				</div>
			</div>
			<div class="map-overlay map-overlay-bottom">
				<div class="legend">
					{#each Object.entries(LAND_COLORS) as [type, color] (type)}
						<span class="legend-item"><span class="legend-dot" style="background:{color}"></span>{type}</span>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.land-registry {
		display: flex;
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow: hidden;
		background: #f5f5f5;
	}

	.land-registry.expanded {
		position: fixed;
		inset: 0;
		z-index: 9999;
		width: 100vw;
		height: 100vh;
	}

	.land-registry.resizing {
		cursor: col-resize;
		user-select: none;
	}

	.sidebar {
		flex: none;
		display: flex;
		flex-direction: column;
		min-width: 280px;
		max-width: 560px;
		background: rgba(255, 255, 255, 0.98);
		border-right: 1px solid #e5e5e5;
		overflow: hidden;
	}

	.resize-handle {
		flex: none;
		width: 6px;
		padding: 0;
		border: none;
		cursor: col-resize;
		background: linear-gradient(to right, transparent, #e5e5e5, transparent);
	}

	.map-column {
		position: relative;
		flex: 1;
		min-width: 0;
		min-height: 0;
	}

	.land-map {
		position: absolute;
		top: 3.5rem;
		left: 1rem;
		width: calc(100% - 2rem);
		height: calc(100% - 6rem);
		background: #fff;
	}

	.land-map.drawing {
		cursor: crosshair;
	}

	.parcel {
		cursor: pointer;
	}

	.land-map.drawing .parcel {
		cursor: crosshair;
	}

	.map-overlay {
		position: absolute;
		left: 0;
		right: 0;
		z-index: 2;
		pointer-events: none;
	}

	.map-overlay > :global(*) {
		pointer-events: auto;
	}

	.map-overlay-top {
		top: 0;
		padding: 0.75rem 1rem;
		display: flex;
		justify-content: flex-end;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.92), transparent);
	}

	.map-actions {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.map-overlay-bottom {
		bottom: 0;
		padding: 0.75rem 1rem;
		background: linear-gradient(to top, rgba(255, 255, 255, 0.92), transparent);
	}

	.sidebar-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 1rem 1rem 0.5rem;
	}

	.sidebar-head h2 {
		margin: 0 0 0.15rem;
		font-size: 1.15rem;
	}

	.sidebar-toolbar,
	.draw-panel {
		padding: 0 1rem 0.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.draw-panel {
		flex-direction: column;
		border-bottom: 1px solid #f0f0f0;
	}

	.draw-panel label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #525252;
	}

	.draw-panel input,
	.draw-panel select,
	.mini-form input,
	.mini-form select {
		padding: 0.45rem 0.6rem;
		border: 1px solid #d4d4d4;
		border-radius: 0.45rem;
		font-size: 0.85rem;
	}

	.parcel-list {
		flex: 1;
		min-height: 0;
		overflow: auto;
		border-top: 1px solid #f0f0f0;
		border-bottom: 1px solid #f0f0f0;
	}

	.parcel-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0.7rem 1rem;
		border: none;
		border-bottom: 1px solid #f5f5f5;
		background: #fff;
		text-align: left;
		cursor: pointer;
	}

	.parcel-row:hover,
	.parcel-row.selected {
		background: #eff6ff;
	}

	.dot {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 999px;
		flex-shrink: 0;
	}

	.parcel-main {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}

	.parcel-main strong {
		font-size: 0.85rem;
	}

	.parcel-status {
		font-size: 0.7rem;
		color: #737373;
	}

	.detail-panel {
		padding: 1rem;
		overflow: auto;
		max-height: 42%;
	}

	.detail-panel h3,
	.detail-panel h4 {
		margin: 0 0 0.35rem;
	}

	.parcel-code {
		display: block;
		margin: 0.35rem 0 0.75rem;
		font-size: 0.7rem;
		color: #a3a3a3;
		word-break: break-all;
	}

	.mini-form {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		margin-top: 0.85rem;
		padding-top: 0.85rem;
		border-top: 1px solid #f0f0f0;
	}

	.readonly-field {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		padding: 0.45rem 0.6rem;
		border: 1px solid #e5e5e5;
		border-radius: 0.45rem;
		font-size: 0.85rem;
		background: #f9fafb;
	}

	.readonly-label {
		color: #525252;
		font-size: 0.75rem;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: #525252;
	}

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		text-transform: capitalize;
	}

	.legend-dot {
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 999px;
	}

	.ghost-btn,
	.primary-btn {
		padding: 0.45rem 0.75rem;
		border-radius: 0.45rem;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.ghost-btn {
		border: 1px solid #d4d4d4;
		background: #fff;
		color: #404040;
	}

	.primary-btn {
		border: none;
		background: #2563eb;
		color: #fff;
	}

	.primary-btn.green { background: #16a34a; }
	.primary-btn.amber { background: #d97706; }
	.primary-btn.purple { background: #7c3aed; }
	.primary-btn:disabled,
	.ghost-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.alert {
		margin: 0 1rem 0.5rem;
		padding: 0.6rem 0.75rem;
		border-radius: 0.45rem;
		font-size: 0.8rem;
	}

	.alert.error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
	.alert.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }

	.muted {
		margin: 0;
		color: #737373;
		font-size: 0.8rem;
	}

	.center {
		text-align: center;
		padding: 1.5rem 1rem;
	}

	.denied-shell {
		padding: 1.5rem;
	}
</style>
