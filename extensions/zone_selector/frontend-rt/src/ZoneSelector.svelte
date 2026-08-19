<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount, onDestroy, tick } from 'svelte';

	let { ctx }: { ctx: any } = $props();

	let zones: any[] = $state([]);
	let initialLoading = $state(true);
	let refreshing = $state(false);
	let error = $state('');
	let notice = $state('');
	let isAdmin = $state(false);
	let editing = $state(false);
	let userId = $state('');

	let zoneType = $state('residential');
	let zoneName = $state('');
	let painting = $state(false);

	let isDrawing = $state(false);
	let drawPoints: [number, number][] = $state([]);
	let paintCells: string[] = $state([]);
	let paintableCount = $state(0);
	let paintResolution = $state(8);

	let selectedZone: any = $state(null);

	let mapContainer: HTMLDivElement | undefined = $state();
	let mapReady = $state(false);
	let expanded = $state(false);
	let map: any = null;
	let maplibregl: any = null;
	let h3: any = null;

	const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
	const SOURCE_ZONES = 'territory-zones';
	const SOURCE_DRAFT_LINE = 'draft-line';
	const SOURCE_DRAFT_POINTS = 'draft-points';
	const SOURCE_PREVIEW = 'paint-preview';

	const ZONE_TYPES = [
		{ value: 'unassigned', label: 'Territory (unassigned)', color: '#d4d4d4' },
		{ value: 'residential', label: 'Residential', color: '#4ade80' },
		{ value: 'commercial', label: 'Commercial', color: '#3b82f6' },
		{ value: 'agricultural', label: 'Agricultural', color: '#fbbf24' },
		{ value: 'industrial', label: 'Industrial', color: '#6b7280' },
		{ value: 'public', label: 'Public', color: '#a855f7' },
		{ value: 'mixed', label: 'Mixed use', color: '#14b8a6' },
	];

	function zoneColor(type: string) {
		return ZONE_TYPES.find((t) => t.value === type)?.color || '#d4d4d4';
	}

	function resolutionForZoom(zoom: number) {
		if (zoom <= 2) return 3;
		if (zoom <= 4) return 4;
		if (zoom <= 6) return 5;
		if (zoom <= 8) return 6;
		if (zoom <= 10) return 7;
		if (zoom <= 13) return 8;
		return 9;
	}

	function maxCellsForResolution(res: number) {
		if (res <= 4) return 300;
		if (res <= 6) return 800;
		if (res <= 8) return 1500;
		return 2500;
	}

	function polygonToCells(points: [number, number][], resolution: number): string[] {
		if (points.length < 3 || !h3) return [];
		const ring = [...points];
		const [lat0, lng0] = points[0];
		const [latN, lngN] = points[points.length - 1];
		if (lat0 !== latN || lng0 !== lngN) ring.push(points[0]);
		try {
			const cells = h3.polygonToCells(ring, resolution, false);
			const cap = maxCellsForResolution(resolution);
			return cells.length > cap ? cells.slice(0, cap) : cells;
		} catch {
			return [];
		}
	}

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

	async function loadMapLibre() {
		const cdnCss = 'https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css';
		const cdnJs = 'https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js';
		try {
			await loadStylesheet(cdnCss);
			await loadScript(cdnJs);
		} catch {
			const base = `${window.location.origin}/ext/${ctx.extensionId}/${ctx.version}/frontend/dist/`;
			await loadStylesheet(`${base}maplibre-gl.css`);
			await loadScript(`${base}maplibre-gl.js`);
		}
		return (window as any).maplibregl;
	}

	async function loadH3() {
		if ((window as any).h3) return (window as any).h3;
		const res = await fetch('https://unpkg.com/h3-js@4.2.1/dist/h3-js.umd.js');
		if (!res.ok) throw new Error(`Failed to load h3-js: HTTP ${res.status}`);
		(0, eval)(await res.text());
		return (window as any).h3;
	}

	function stripNoisyLayers(style: any) {
		if (!style?.layers) return style;
		const filtered = { ...style, layers: [] as any[] };
		for (const layer of style.layers) {
			const id = String(layer.id || '').toLowerCase();
			const sourceLayer = String(layer['source-layer'] || '').toLowerCase();
			const type = String(layer.type || '').toLowerCase();
			const isBoundary =
				sourceLayer.includes('boundary') ||
				sourceLayer === 'admin' ||
				id.includes('boundary') ||
				id.includes('admin');
			const isLabel =
				type === 'symbol' ||
				id.includes('label') ||
				id.includes('name') ||
				sourceLayer.includes('place') ||
				sourceLayer === 'poi' ||
				sourceLayer.includes('water_name') ||
				sourceLayer.includes('transportation_name');
			if (!isBoundary && !isLabel) filtered.layers.push(layer);
		}
		delete filtered.light;
		return filtered;
	}

	async function loadAllZones(silent = false) {
		if (!silent) {
			if (zones.length === 0) initialLoading = true;
			else refreshing = true;
		}
		error = '';
		try {
			const res = await ctx.callSync('get_all_zones', {});
			if (res?.success) {
				zones = res.data ?? [];
				isAdmin = !!res.is_admin;
			} else {
				zones = [];
				if (res?.error) error = res.error;
			}
		} catch (e: any) {
			error = e?.message || String(e);
		} finally {
			initialLoading = false;
			refreshing = false;
		}
	}

	function zonesGeoJson() {
		const features: any[] = [];
		for (const zone of zones) {
			if (!h3 || !zone.h3_index || String(zone.h3_index).startsWith('manual')) continue;
			try {
				const boundary = h3.cellToBoundary(zone.h3_index, true);
				features.push({
					type: 'Feature',
					properties: {
						h3_index: zone.h3_index,
						zone_type: zone.zone_type,
						name: zone.name || 'Zone',
						color: zoneColor(zone.zone_type),
					},
					geometry: { type: 'Polygon', coordinates: [boundary] },
				});
			} catch {
				/* skip invalid cell */
			}
		}
		return { type: 'FeatureCollection', features };
	}

	function refreshZonesLayer() {
		if (!map || !mapReady) return;
		const source = map.getSource(SOURCE_ZONES);
		source?.setData(zonesGeoJson());
	}

	function draftGeoJson() {
		const coords = drawPoints.map(([lat, lng]) => [lng, lat]);
		return {
			line: {
				type: 'FeatureCollection',
				features:
					coords.length >= 2
						? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }]
						: [],
			},
			points: {
				type: 'FeatureCollection',
				features: coords.map((c, i) => ({
					type: 'Feature',
					properties: { first: i === 0 },
					geometry: { type: 'Point', coordinates: c },
				})),
			},
		};
	}

	function refreshDraftLayers() {
		if (!map || !mapReady) return;
		const { line, points } = draftGeoJson();
		map.getSource(SOURCE_DRAFT_LINE)?.setData(line);
		map.getSource(SOURCE_DRAFT_POINTS)?.setData(points);
	}

	function refreshPreviewLayer() {
		if (!map || !mapReady || !h3) return;
		const color = zoneColor(zoneType);
		const features = paintCells.map((cell) => {
			const boundary = h3.cellToBoundary(cell, true);
			return {
				type: 'Feature',
				properties: { h3_index: cell, color },
				geometry: { type: 'Polygon', coordinates: [boundary] },
			};
		});
		map.getSource(SOURCE_PREVIEW)?.setData({ type: 'FeatureCollection', features });
	}

	function existingZoneCells() {
		return new Set(zones.map((z) => z.h3_index));
	}

	/** Recompute preview hexes from the in-progress polygon while drawing. */
	function syncDraftPreview() {
		if (!isDrawing || !h3 || !map) return;

		if (drawPoints.length < 3) {
			paintCells = [];
			paintableCount = 0;
			paintResolution = 0;
			refreshPreviewLayer();
			return;
		}

		const res = resolutionForZoom(map.getZoom());
		const cells = polygonToCells(drawPoints, res);
		const existing = existingZoneCells();
		paintCells = cells;
		paintableCount = cells.filter((c) => !existing.has(c)).length;
		paintResolution = res;
		refreshPreviewLayer();
	}

	function addMapLayers() {
		if (!map) return;

		map.addSource(SOURCE_ZONES, { type: 'geojson', data: zonesGeoJson() });
		map.addLayer({
			id: 'zones-fill',
			type: 'fill',
			source: SOURCE_ZONES,
			paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.45 },
		});
		map.addLayer({
			id: 'zones-line',
			type: 'line',
			source: SOURCE_ZONES,
			paint: { 'line-color': '#171717', 'line-width': 1.2, 'line-opacity': 0.6 },
		});

		map.addSource(SOURCE_PREVIEW, {
			type: 'geojson',
			data: { type: 'FeatureCollection', features: [] },
		});
		map.addLayer({
			id: 'preview-fill',
			type: 'fill',
			source: SOURCE_PREVIEW,
			paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.55 },
		});
		map.addLayer({
			id: 'preview-line',
			type: 'line',
			source: SOURCE_PREVIEW,
			paint: { 'line-color': '#171717', 'line-width': 1, 'line-dasharray': [2, 1] },
		});

		map.addSource(SOURCE_DRAFT_LINE, {
			type: 'geojson',
			data: { type: 'FeatureCollection', features: [] },
		});
		map.addLayer({
			id: 'draft-line-layer',
			type: 'line',
			source: SOURCE_DRAFT_LINE,
			paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-dasharray': [1, 1] },
		});

		map.addSource(SOURCE_DRAFT_POINTS, {
			type: 'geojson',
			data: { type: 'FeatureCollection', features: [] },
		});
		map.addLayer({
			id: 'draft-points-layer',
			type: 'circle',
			source: SOURCE_DRAFT_POINTS,
			paint: {
				'circle-radius': 5,
				'circle-color': ['case', ['get', 'first'], '#dc2626', '#2563eb'],
				'circle-stroke-color': '#fff',
				'circle-stroke-width': 1.5,
			},
		});

		map.on('click', 'zones-fill', (e: any) => {
			if (isDrawing) return;
			const feature = e.features?.[0];
			if (!feature) return;
			const h3Index = feature.properties?.h3_index;
			selectedZone = zones.find((z) => z.h3_index === h3Index) ?? null;
		});

		map.on('click', onMapClick);
		map.on('zoomend', () => {
			if (isDrawing) syncDraftPreview();
		});
		map.on('mouseenter', 'zones-fill', () => {
			if (!isDrawing) map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'zones-fill', () => {
			if (!isDrawing) map.getCanvas().style.cursor = '';
		});
	}

	function fitToZones() {
		if (!map || !h3) return;
		const coords: [number, number][] = [];
		for (const zone of zones) {
			if (!zone.h3_index) continue;
			try {
				const [lat, lng] = h3.cellToLatLng(zone.h3_index);
				coords.push([lng, lat]);
			} catch {
				/* skip */
			}
		}
		if (coords.length === 0) return;
		let minLng = Infinity,
			minLat = Infinity,
			maxLng = -Infinity,
			maxLat = -Infinity;
		for (const [lng, lat] of coords) {
			minLng = Math.min(minLng, lng);
			maxLng = Math.max(maxLng, lng);
			minLat = Math.min(minLat, lat);
			maxLat = Math.max(maxLat, lat);
		}
		map.fitBounds(
			[
				[minLng, minLat],
				[maxLng, maxLat],
			],
			{ padding: 60, maxZoom: 8, duration: 0 },
		);
	}

	async function initMap() {
		if (!mapContainer || map) return;

		maplibregl = await loadMapLibre();
		if (!maplibregl) throw new Error('MapLibre GL failed to initialize');

		try {
			h3 = await loadH3();
		} catch (e) {
			console.warn('[zone_selector] h3-js unavailable, hexagons disabled', e);
		}

		let style: any = STYLE_URL;
		try {
			const res = await fetch(STYLE_URL);
			if (res.ok) style = stripNoisyLayers(await res.json());
		} catch {
			/* keep URL fallback */
		}

		if (typeof style === 'object') style.projection = { type: 'globe' };

		map = new maplibregl.Map({
			container: mapContainer,
			style,
			center: [0, 20],
			zoom: 1.3,
			attributionControl: true,
		});

		if (typeof style === 'string') map.setProjection({ type: 'globe' });

		map.on('load', () => {
			addMapLayers();
			mapReady = true;
			refreshZonesLayer();
			fitToZones();
			requestAnimationFrame(() => map?.resize());
		});
	}

	function onMapClick(e: any) {
		if (!isDrawing) return;
		drawPoints = [...drawPoints, [e.lngLat.lat, e.lngLat.lng]];
		refreshDraftLayers();
		syncDraftPreview();
	}

	function startDrawing() {
		paintCells = [];
		drawPoints = [];
		isDrawing = true;
		notice = '';
		refreshDraftLayers();
		refreshPreviewLayer();
	}

	function cancelDrawing() {
		isDrawing = false;
		drawPoints = [];
		paintCells = [];
		paintableCount = 0;
		refreshDraftLayers();
		refreshPreviewLayer();
	}

	function undoPoint() {
		drawPoints = drawPoints.slice(0, -1);
		refreshDraftLayers();
		syncDraftPreview();
	}

	function finishShape() {
		if (drawPoints.length < 3 || !h3 || !map) return;
		syncDraftPreview();
		isDrawing = false;
		drawPoints = [];
		refreshDraftLayers();
		if (paintCells.length === 0) {
			notice = 'That shape produced no H3 cells — try drawing a larger area.';
		}
	}

	function discardPreview() {
		paintCells = [];
		paintableCount = 0;
		refreshPreviewLayer();
	}

	async function paintZones() {
		if (paintableCount === 0 || !userId) return;
		const newCells = paintCells.filter((c) => !zones.some((z) => z.h3_index === c));
		if (newCells.length === 0) return;

		painting = true;
		error = '';
		notice = '';
		try {
			const typeLabel = ZONE_TYPES.find((t) => t.value === zoneType)?.label || zoneType;
			const res = await ctx.callSync('add_zones_batch', {
				user_id: userId,
				h3_indexes: newCells,
				zone_type: zoneType,
				name: zoneName.trim() || `${typeLabel} zone`,
			});
			if (res?.success) {
				notice = res.data?.message || 'Zones painted.';
				paintCells = [];
				paintableCount = 0;
				refreshPreviewLayer();
				await loadAllZones(true);
				refreshZonesLayer();
				await tick();
				map?.resize();
			} else {
				error = res?.error || 'Failed to paint zones';
			}
		} catch (e: any) {
			error = e?.message || String(e);
		} finally {
			painting = false;
		}
	}

	async function updateZoneType(zone: any, newType: string) {
		painting = true;
		try {
			const res = await ctx.callSync('update_zone', {
				user_id: userId,
				zone_id: zone.h3_index,
				zone_type: newType,
			});
			if (res?.success) {
				await loadAllZones(true);
				selectedZone = zones.find((z) => z.h3_index === zone.h3_index) ?? null;
				refreshZonesLayer();
				map?.resize();
			} else {
				error = res?.error || 'Failed to update zone';
			}
		} catch (e: any) {
			error = e?.message || String(e);
		} finally {
			painting = false;
		}
	}

	async function renameZone(zone: any, name: string) {
		if (!name.trim()) return;
		painting = true;
		try {
			const res = await ctx.callSync('update_zone', {
				user_id: userId,
				zone_id: zone.h3_index,
				name: name.trim(),
			});
			if (res?.success) {
				await loadAllZones(true);
				selectedZone = zones.find((z) => z.h3_index === zone.h3_index) ?? null;
				refreshZonesLayer();
			} else {
				error = res?.error || 'Failed to rename zone';
			}
		} catch (e: any) {
			error = e?.message || String(e);
		} finally {
			painting = false;
		}
	}

	async function removeZone(zone: any) {
		painting = true;
		try {
			const res = await ctx.callSync('remove_zone', { user_id: userId, zone_id: zone.h3_index });
			if (res?.success) {
				selectedZone = null;
				await loadAllZones(true);
				refreshZonesLayer();
				map?.resize();
			} else {
				error = res?.error || 'Failed to remove zone';
			}
		} catch (e: any) {
			error = e?.message || String(e);
		} finally {
			painting = false;
		}
	}

	function resizeMapSoon() {
		requestAnimationFrame(() => {
			map?.resize();
			requestAnimationFrame(() => map?.resize());
		});
	}

	function setExpanded(next: boolean) {
		expanded = next;
		if (typeof document !== 'undefined') {
			document.body.classList.toggle('zone-selector-expanded', next);
			document.body.style.overflow = next ? 'hidden' : '';
		}
		resizeMapSoon();
	}

	function toggleExpanded() {
		setExpanded(!expanded);
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && expanded) {
			e.preventDefault();
			setExpanded(false);
		}
	}

	$effect(() => {
		if (mapReady && paintCells.length > 0) {
			zoneType;
			refreshPreviewLayer();
		}
	});

	$effect(() => {
		if (zones.length >= 0 && mapReady) refreshZonesLayer();
	});

	onMount(async () => {
		userId = ctx.userId || '';
		ctx.principal?.subscribe?.((p: string) => {
			userId = p || userId;
		});

		window.addEventListener('keydown', onWindowKeydown);

		await loadAllZones(false);
		await tick();
		if (mapContainer) {
			try {
				await initMap();
			} catch (e: any) {
				error = e?.message || String(e);
			}
		}
	});

	onDestroy(() => {
		window.removeEventListener('keydown', onWindowKeydown);
		document.body.classList.remove('zone-selector-expanded');
		document.body.style.overflow = '';
		map?.remove?.();
		map = null;
		mapReady = false;
	});
</script>

<div class="zone-display" class:expanded>
	<div bind:this={mapContainer} class="zone-map" class:drawing={isDrawing}></div>

	<div class="zone-overlay zone-overlay-top">
		<div class="zone-header">
			<div class="zone-header-copy">
				<h2>Zones</h2>
				<p class="zone-header-desc">{extensionDescription}</p>
			</div>
			<div class="zone-header-actions">
				<button type="button" class="expand-toggle" onclick={toggleExpanded} aria-pressed={expanded}>
					{expanded ? 'Exit full screen' : 'Expand'}
				</button>
				{#if isAdmin}
					<button
						type="button"
						class="edit-toggle"
						class:active={editing}
						onclick={() => {
							editing = !editing;
							if (!editing) cancelDrawing();
							notice = '';
						}}
					>
						{editing ? 'Done editing' : 'Edit zones'}
					</button>
				{/if}
			</div>
		</div>

		{#if initialLoading}
			<div class="zone-loading">
				<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path
						class="spinner-fill"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<span>Loading zones…</span>
			</div>
		{:else}
			{#if error}
				<div class="zone-error">{error}</div>
			{/if}
			{#if notice}
				<div class="zone-notice">{notice}</div>
			{/if}
			{#if refreshing}
				<div class="zone-refresh">Updating zones…</div>
			{/if}

			{#if editing && isAdmin}
				<div class="edit-bar">
					<div class="type-palette">
						{#each ZONE_TYPES as t}
							<button
								type="button"
								class="type-chip"
								class:selected={zoneType === t.value}
								style="--chip-color: {t.color}"
								onclick={() => (zoneType = t.value)}
							>
								<span class="chip-dot" style="background: {t.color}"></span>
								{t.label}
							</button>
						{/each}
					</div>
					<input
						class="zone-name-input"
						type="text"
						placeholder="Name for these zones (optional)"
						bind:value={zoneName}
					/>
					{#if !isDrawing && paintCells.length === 0}
						<button type="button" class="draw-btn" onclick={startDrawing}>Start drawing a shape</button>
					{:else if isDrawing}
						<div class="draw-hint">
							Click the globe to add points ({drawPoints.length} so far).
							{#if drawPoints.length >= 3}
								Previewing <strong>{paintableCount}</strong> new cell(s) as
								<strong>{ZONE_TYPES.find((t) => t.value === zoneType)?.label || zoneType}</strong>
								(H3 res {paintResolution}{paintCells.length !== paintableCount
									? `, ${paintCells.length - paintableCount} already zoned — skipped`
									: ''}).
							{:else}
								Add at least 3 points to preview hexes.
							{/if}
							<div class="draw-actions">
								<button type="button" disabled={drawPoints.length === 0} onclick={undoPoint}>
									Undo point
								</button>
								<button type="button" class="primary" disabled={drawPoints.length < 3} onclick={finishShape}>
									Finish shape
								</button>
								<button type="button" onclick={cancelDrawing}>Cancel</button>
							</div>
						</div>
					{:else if paintCells.length > 0}
						<div class="draw-hint">
							Will paint <strong>{paintableCount}</strong> new cell(s) as
							<strong>{ZONE_TYPES.find((t) => t.value === zoneType)?.label || zoneType}</strong>
							(H3 res {paintResolution}{paintCells.length !== paintableCount
								? `, ${paintCells.length - paintableCount} already zoned — skipped`
								: ''}).
							<div class="draw-actions">
								<button
									type="button"
									class="primary"
									disabled={painting || paintableCount === 0}
									onclick={paintZones}
								>
									{painting ? 'Painting…' : `Paint ${paintableCount} zone(s)`}
								</button>
								<button type="button" disabled={painting} onclick={discardPreview}>Discard</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>

	<div class="zone-overlay zone-overlay-bottom">
		<div class="zone-legend">
			{#each ZONE_TYPES as t}
				<span class="legend-item">
					<span class="chip-dot" style="background: {t.color}"></span>
					{t.label}
				</span>
			{/each}
			<span class="zone-count">{zones.length} zone{zones.length !== 1 ? 's' : ''}</span>
		</div>
	</div>

	{#if selectedZone}
		<div class="zone-panel">
			<div class="panel-head">
				<span class="chip-dot big" style="background: {zoneColor(selectedZone.zone_type)}"></span>
				<div class="panel-title">
					<strong>{selectedZone.name || 'Zone'}</strong>
					<code>{selectedZone.h3_index}</code>
				</div>
				<button type="button" class="panel-close" onclick={() => (selectedZone = null)}>&times;</button>
			</div>
			{#if isAdmin}
				<div class="panel-controls">
					<label>
						Type
						<select
							disabled={painting}
							value={selectedZone.zone_type}
							onchange={(e) => updateZoneType(selectedZone, (e.target as HTMLSelectElement).value)}
						>
							{#each ZONE_TYPES as t}
								<option value={t.value}>{t.label}</option>
							{/each}
						</select>
					</label>
					<label>
						Name
						<input
							disabled={painting}
							value={selectedZone.name || ''}
							onchange={(e) => renameZone(selectedZone, (e.target as HTMLInputElement).value)}
						/>
					</label>
					<button type="button" class="remove-btn" disabled={painting} onclick={() => removeZone(selectedZone)}>
						Remove zone
					</button>
				</div>
			{:else}
				<p class="panel-type">
					Type: <strong>{selectedZone.zone_type || 'unassigned'}</strong>
				</p>
				{#if selectedZone.description}
					<p class="panel-desc">{selectedZone.description}</p>
				{/if}
			{/if}
		</div>
	{/if}

	{#if zones.length === 0 && !editing && !initialLoading}
		<div class="zone-empty">
			<p>
				No zones have been set for this realm yet{isAdmin
					? ' — use “Edit zones” to define the territory'
					: ''}.
			</p>
		</div>
	{/if}
</div>

<style>
	.zone-display {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow: hidden;
		background: #f5f5f5;
	}

	.zone-display.expanded {
		position: fixed;
		inset: 0;
		z-index: 9999;
		width: 100vw;
		height: 100vh;
	}

	.zone-map {
		position: absolute;
		inset: 0;
	}

	.zone-map.drawing {
		cursor: crosshair;
	}

	.zone-overlay {
		position: absolute;
		left: 0;
		right: 0;
		z-index: 2;
		pointer-events: none;
	}

	.zone-overlay > :global(*) {
		pointer-events: auto;
	}

	.zone-overlay-top {
		top: 0;
		padding: 1rem 1.25rem 0.75rem;
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.96) 0%,
			rgba(255, 255, 255, 0.88) 70%,
			rgba(255, 255, 255, 0) 100%
		);
	}

	.zone-overlay-bottom {
		bottom: 0;
		padding: 0.75rem 1.25rem 1rem;
		background: linear-gradient(
			to top,
			rgba(255, 255, 255, 0.96) 0%,
			rgba(255, 255, 255, 0.88) 70%,
			rgba(255, 255, 255, 0) 100%
		);
	}

	.zone-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.zone-header-actions {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.5rem;
	}

	.zone-header-copy h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #171717;
		margin: 0 0 0.25rem;
	}

	.zone-header-copy p {
		font-size: 0.875rem;
		color: #525252;
		margin: 0;
		max-width: 42rem;
	}

	.zone-header-desc {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.expand-toggle {
		flex-shrink: 0;
		padding: 0.5rem 1rem;
		border: 1px solid #d4d4d4;
		border-radius: 0.5rem;
		background: #fff;
		font-size: 0.85rem;
		font-weight: 500;
		color: #404040;
		cursor: pointer;
	}

	.expand-toggle[aria-pressed='true'] {
		background: #171717;
		border-color: #171717;
		color: #fff;
	}

	.edit-toggle {
		flex-shrink: 0;
		padding: 0.5rem 1rem;
		border: 1px solid #d4d4d4;
		border-radius: 0.5rem;
		background: #fff;
		font-size: 0.85rem;
		font-weight: 500;
		color: #404040;
		cursor: pointer;
	}

	.edit-toggle.active {
		background: #171717;
		border-color: #171717;
		color: #fff;
	}

	.edit-bar {
		padding: 0.75rem;
		border: 1px solid rgba(229, 229, 229, 0.9);
		border-radius: 0.75rem;
		background: rgba(250, 250, 250, 0.95);
		backdrop-filter: blur(8px);
	}

	.type-palette {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}

	.type-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.7rem;
		border: 1px solid #e5e5e5;
		border-radius: 999px;
		background: #fff;
		font-size: 0.78rem;
		color: #404040;
		cursor: pointer;
	}

	.type-chip.selected {
		border-color: var(--chip-color);
		box-shadow: 0 0 0 2px var(--chip-color);
	}

	.chip-dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 999px;
		display: inline-block;
	}

	.chip-dot.big {
		width: 1rem;
		height: 1rem;
	}

	.zone-name-input {
		width: 100%;
		padding: 0.45rem 0.7rem;
		border: 1px solid #d4d4d4;
		border-radius: 0.5rem;
		font-size: 0.85rem;
		margin-bottom: 0.5rem;
		box-sizing: border-box;
	}

	.draw-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		background: #2563eb;
		color: #fff;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
	}

	.draw-hint {
		font-size: 0.8rem;
		color: #404040;
	}

	.draw-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.draw-actions button {
		padding: 0.4rem 0.8rem;
		border: 1px solid #d4d4d4;
		border-radius: 0.5rem;
		background: #fff;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.draw-actions button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.draw-actions button.primary {
		background: #171717;
		border-color: #171717;
		color: #fff;
	}

	.zone-legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: #525252;
	}

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.zone-count {
		margin-left: auto;
		color: #737373;
	}

	.zone-panel {
		position: absolute;
		right: 1rem;
		bottom: 4.5rem;
		z-index: 3;
		width: min(22rem, calc(100% - 2rem));
		padding: 0.9rem 1rem;
		border: 1px solid #e5e5e5;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.96);
		backdrop-filter: blur(8px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	}

	.panel-head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.panel-title {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.panel-title strong {
		font-size: 0.95rem;
		color: #171717;
	}

	.panel-title code {
		font-size: 0.7rem;
		color: #a3a3a3;
		word-break: break-all;
	}

	.panel-close {
		margin-left: auto;
		border: none;
		background: none;
		font-size: 1.25rem;
		color: #a3a3a3;
		cursor: pointer;
	}

	.panel-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.panel-controls label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #737373;
	}

	.panel-controls select,
	.panel-controls input {
		padding: 0.4rem 0.6rem;
		border: 1px solid #d4d4d4;
		border-radius: 0.5rem;
		font-size: 0.85rem;
	}

	.remove-btn {
		padding: 0.45rem 0.9rem;
		border: none;
		border-radius: 0.5rem;
		background: #dc2626;
		color: #fff;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
	}

	.remove-btn:disabled {
		opacity: 0.5;
	}

	.panel-type,
	.panel-desc {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: #525252;
	}

	.zone-error {
		margin-bottom: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		background: #fef2f2;
		color: #991b1b;
		font-size: 0.875rem;
	}

	.zone-notice {
		margin-bottom: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid #fde68a;
		border-radius: 0.5rem;
		background: #fffbeb;
		color: #92400e;
		font-size: 0.875rem;
	}

	.zone-refresh {
		margin-bottom: 0.5rem;
		font-size: 0.75rem;
		color: #737373;
	}

	.zone-loading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0;
		color: #737373;
		font-size: 0.875rem;
	}

	.spinner {
		width: 1.25rem;
		height: 1.25rem;
		animation: spin 1s linear infinite;
	}

	.spinner-track {
		opacity: 0.25;
	}

	.spinner-fill {
		opacity: 0.75;
	}

	.zone-empty {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		z-index: 1;
		padding: 1rem 1.25rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.92);
		color: #737373;
		font-size: 0.875rem;
		text-align: center;
		pointer-events: none;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
