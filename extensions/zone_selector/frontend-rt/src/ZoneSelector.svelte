<script lang="ts">
	import { onMount, tick } from 'svelte';

	let { ctx }: { ctx: any } = $props();

	let zones: any[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let success = $state('');
	let userId = $state('');

	let mapContainer: HTMLDivElement | undefined = $state();
	let mapInstance: any = $state(null);
	let L: any = null;
	let h3: any = null;
	let zonesLayer: any = null;
	let drawLayer: any = null;

	let isDrawing = $state(false);
	let drawPoints: [number, number][] = $state([]);
	let previewCells: string[] = $state([]);
	let zoneType = $state('residential');
	let zoneName = $state('');
	let painting = $state(false);

	const H3_RESOLUTION = 8;

	const ZONE_TYPES = [
		{ value: 'unassigned', label: 'Territory (unassigned)', color: '#9ca3af' },
		{ value: 'residential', label: 'Residential', color: '#4ade80' },
		{ value: 'commercial', label: 'Commercial', color: '#60a5fa' },
		{ value: 'agricultural', label: 'Agricultural', color: '#facc15' },
		{ value: 'industrial', label: 'Industrial', color: '#9ca3af' },
		{ value: 'public', label: 'Public', color: '#a855f7' },
		{ value: 'mixed', label: 'Mixed use', color: '#2dd4bf' },
	];

	function loadScript(src: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (document.querySelector(`script[src="${src}"]`)) {
				resolve();
				return;
			}
			const script = document.createElement('script');
			script.src = src;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load ${src}`));
			document.head.appendChild(script);
		});
	}

	function loadStylesheet(href: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (document.querySelector(`link[href="${href}"]`)) {
				resolve();
				return;
			}
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = href;
			link.onload = () => resolve();
			link.onerror = () => reject(new Error(`Failed to load ${href}`));
			document.head.appendChild(link);
		});
	}

	async function loadLibs() {
		await loadStylesheet('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
		await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
		await loadScript('https://unpkg.com/h3-js@4.2.1/dist/h3-js.umd.js');
		L = (window as any).L;
		h3 = (window as any).h3;
	}

	async function loadAllZones() {
		loading = true;
		error = '';
		try {
			const raw = await ctx.callSync('get_all_zones', {});
			const res = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (res?.success && Array.isArray(res.data)) {
				zones = res.data;
			} else {
				zones = [];
				if (res?.error) error = res.error;
			}
		} catch (e: any) {
			error = e?.message || String(e);
		} finally {
			loading = false;
		}
	}

	function cellColor(zoneType: string) {
		return ZONE_TYPES.find((t) => t.value === zoneType)?.color || '#3b82f6';
	}

	function renderZones() {
		if (!L || !mapInstance || !zonesLayer) return;
		zonesLayer.clearLayers();
		const bounds: [number, number][] = [];

		for (const zone of zones) {
			if (!zone.h3_index) continue;
			try {
				if (h3.isValidCell && !h3.isValidCell(zone.h3_index)) continue;
				const boundary = h3.cellToBoundary(zone.h3_index);
				const latLngs = boundary.map((c: number[]) => [c[0], c[1]]);
				const color = cellColor(zone.zone_type);
				L.polygon(latLngs, {
					color,
					weight: 2,
					fillColor: color,
					fillOpacity: 0.25,
				}).addTo(zonesLayer);
				latLngs.forEach((p: [number, number]) => bounds.push(p));
			} catch {
				// skip invalid cell
			}
		}

		if (bounds.length > 0) {
			mapInstance.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 6 });
		}
	}

	function renderDrawPreview() {
		if (!L || !mapInstance || !drawLayer) return;
		drawLayer.clearLayers();

		if (drawPoints.length > 1) {
			L.polygon(drawPoints, {
				color: '#171717',
				weight: 2,
				dashArray: '5, 5',
				fillOpacity: 0.05,
			}).addTo(drawLayer);
		}

		for (const p of drawPoints) {
			L.circleMarker(p, { radius: 5, color: '#171717', fillColor: '#fff', fillOpacity: 1 }).addTo(drawLayer);
		}

		const color = cellColor(zoneType);
		for (const cell of previewCells) {
			try {
				const boundary = h3.cellToBoundary(cell);
				const latLngs = boundary.map((c: number[]) => [c[0], c[1]]);
				L.polygon(latLngs, {
					color,
					weight: 1,
					fillColor: color,
					fillOpacity: 0.4,
				}).addTo(drawLayer);
			} catch {}
		}
	}

	function recomputePreview() {
		previewCells = [];
		if (drawPoints.length < 3 || !h3) return;
		try {
			const closed = [...drawPoints, drawPoints[0]];
			previewCells = h3.polygonToCells(closed, H3_RESOLUTION, true);
		} catch {
			previewCells = [];
		}
		renderDrawPreview();
	}

	function startDrawing() {
		isDrawing = true;
		drawPoints = [];
		previewCells = [];
		renderDrawPreview();
	}

	function cancelDrawing() {
		isDrawing = false;
		drawPoints = [];
		previewCells = [];
		renderDrawPreview();
	}

	async function paintZones() {
		if (!previewCells.length || !userId) return;
		painting = true;
		error = '';
		success = '';
		try {
			const typeLabel = ZONE_TYPES.find((t) => t.value === zoneType)?.label || zoneType;
			const res = await ctx.callSync('add_zones_batch', {
				user_id: userId,
				h3_indexes: previewCells,
				zone_type: zoneType,
				name: zoneName.trim() || `${typeLabel} zone`,
			});
			if (res?.success) {
				success = res.data?.message || `Painted ${res.data?.created_count ?? 0} zone(s).`;
				cancelDrawing();
				await loadAllZones();
				renderZones();
			} else {
				error = res?.error || 'Failed to paint zones';
			}
		} catch (e: any) {
			error = e?.message || String(e);
		} finally {
			painting = false;
		}
	}

	async function initMap() {
		if (!mapContainer || mapInstance) return;
		await loadLibs();

		mapInstance = L.map(mapContainer, { zoomControl: true }).setView([20, 0], 2);
		L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
			subdomains: 'abcd',
			maxZoom: 19,
		}).addTo(mapInstance);

		zonesLayer = L.layerGroup().addTo(mapInstance);
		drawLayer = L.layerGroup().addTo(mapInstance);

		mapInstance.on('click', (e: any) => {
			if (!isDrawing) return;
			drawPoints = [...drawPoints, [e.latlng.lat, e.latlng.lng]];
			recomputePreview();
		});

		renderZones();
	}

	$effect(() => {
		if (zones.length >= 0 && mapInstance) {
			renderZones();
		}
	});

	$effect(() => {
		if (drawPoints.length >= 0 && mapInstance) {
			renderDrawPreview();
		}
	});

	onMount(async () => {
		userId = ctx.userId || ctx.principal || '';
		await loadAllZones();
		await tick();
		if (mapContainer) {
			try {
				await initMap();
			} catch (e: any) {
				error = e?.message || String(e);
			}
		}
	});
</script>

<div class="zone-display">
	<div class="zone-header">
		<h2>Zones</h2>
		<p>Draw the realm's territory, then paint zones inside it by purpose. Land parcels inherit their type from the zone they sit in.</p>
	</div>

	{#if error}
		<div class="zone-banner error">{error}</div>
	{/if}
	{#if success}
		<div class="zone-banner success">{success}</div>
	{/if}

	<div class="zone-controls">
		<div class="control-group">
			<label for="zone-type">Zone type</label>
			<select id="zone-type" bind:value={zoneType}>
				{#each ZONE_TYPES as t}
					<option value={t.value}>{t.label}</option>
				{/each}
			</select>
		</div>
		<div class="control-group">
			<label for="zone-name">Name (optional)</label>
			<input id="zone-name" type="text" bind:value={zoneName} placeholder="e.g. Harbor District" />
		</div>
		<div class="control-group buttons">
			{#if isDrawing}
				<button class="secondary" onclick={cancelDrawing}>Cancel</button>
				<button class="primary" onclick={paintZones} disabled={!previewCells.length || painting}>
					{#if painting}Painting…{:else}Paint {previewCells.length} zone{previewCells.length !== 1 ? 's' : ''}{/if}
				</button>
			{:else}
				<button class="primary" onclick={startDrawing}>Start drawing a shape</button>
			{/if}
		</div>
	</div>

	{#if isDrawing}
		<p class="draw-hint">
			Click on the map to place polygon corners. A closed shape will be filled with H3 cells at resolution {H3_RESOLUTION}.
			{#if drawPoints.length > 0}
				<strong>{drawPoints.length} point{drawPoints.length !== 1 ? 's' : ''} placed.</strong>
			{/if}
		</p>
	{/if}

	{#if loading}
		<div class="zone-loading">
			<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
			<span>Loading zones…</span>
		</div>
	{:else}
		<div bind:this={mapContainer} class="zone-map"></div>
		<div class="zone-count">{zones.length} zone{zones.length !== 1 ? 's' : ''}</div>
	{/if}
</div>

<style>
	.zone-display {
		max-width: 900px;
		margin: 0 auto;
		padding: 1.5rem;
	}

	.zone-header {
		margin-bottom: 1.25rem;
	}

	.zone-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #171717;
		margin: 0 0 0.25rem;
	}

	.zone-header p {
		font-size: 0.875rem;
		color: #737373;
		margin: 0;
	}

	.zone-banner {
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.zone-banner.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}

	.zone-banner.success {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
	}

	.zone-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: flex-end;
		margin-bottom: 1rem;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.control-group label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
	}

	.control-group input,
	.control-group select {
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: #374151;
		background: white;
	}

	.control-group.buttons {
		flex-direction: row;
		margin-left: auto;
	}

	button {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid transparent;
	}

	button.primary {
		background: #171717;
		color: white;
	}

	button.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	button.secondary {
		background: white;
		color: #374151;
		border-color: #d1d5db;
	}

	.draw-hint {
		font-size: 0.875rem;
		color: #6b7280;
		margin-bottom: 1rem;
	}

	.zone-map {
		width: 100%;
		height: 480px;
		min-height: 350px;
		border-radius: 0.75rem;
		border: 1px solid #e5e5e5;
		position: relative;
		z-index: 0;
	}

	.zone-count {
		margin-top: 0.75rem;
		text-align: center;
		font-size: 0.8rem;
		color: #a3a3a3;
	}

	.zone-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4rem 0;
		gap: 0.75rem;
		color: #737373;
		font-size: 0.875rem;
	}

	.spinner {
		width: 1.5rem;
		height: 1.5rem;
		animation: spin 1s linear infinite;
	}

	.spinner-track {
		opacity: 0.25;
	}

	.spinner-fill {
		opacity: 0.75;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
