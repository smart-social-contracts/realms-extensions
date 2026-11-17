<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount, onDestroy, tick } from 'svelte';

	let { ctx }: { ctx: any } = $props();

	type Reply = { ok: boolean; error?: string; [key: string]: any };
	type MapZone = { h3_index: string; name: string; zone_type: string };

	let zones: MapZone[] = $state([]);
	let initialLoading = $state(true);
	let refreshing = $state(false);
	let zonesUnreadable = $state(false);
	let notice = $state('');
	let canPick = $state(false);
	let editing = $state(false);
	// The realm does not report a zone's owner: your home is only known once you set it here.
	let myZone = $state('');
	let mapUnavailable = $state(false);
	let h3Ready = $state(false);
	let unsubscribePrincipal: (() => void) | null = null;

	let zoneType = $state('residential');
	let zoneName = $state('');
	let painting = $state(false);

	let isPicking = $state(false);
	let pickedCell = $state('');
	let paintResolution = $state(8);

	let selectedZone: MapZone | null = $state(null);

	let mapContainer: HTMLDivElement | undefined = $state();
	let mapReady = $state(false);
	let expanded = $state(false);
	let map: any = null;
	let maplibregl: any = null;
	let h3: any = null;

	const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
	const SOURCE_ZONES = 'territory-zones';
	const SOURCE_PREVIEW = 'paint-preview';
	const PAGE = 500;
	const MAX_PAGES = 50;

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

	function zoneLabel(type: string) {
		return ZONE_TYPES.find((t) => t.value === type)?.label || type || 'Territory (unassigned)';
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

	async function call(write: boolean, name: string, args: Record<string, unknown> = {}): Promise<Reply> {
		try {
			const reply = await (write ? ctx.run(name, args) : ctx.read(name, args));
			if (reply && typeof reply === 'object') return reply;
		} catch (e: any) {
			return { ok: false, error: e?.message || `${name} did not answer` };
		}
		return { ok: false, error: `${name} did not answer` };
	}

	/** Every row of a paged read operation (``from``/``count``, continued by ``next``). */
	async function readPages(name: string, key: string): Promise<{ rows: any[]; error: string }> {
		const rows: any[] = [];
		let from: number | null = 1;
		for (let i = 0; from != null && i < MAX_PAGES; i++) {
			const reply = await call(false, name, { from, count: PAGE });
			if (!reply.ok) return { rows, error: reply.error || `${name} was refused` };
			rows.push(...(Array.isArray(reply[key]) ? reply[key] : []));
			from = typeof reply.next === 'number' ? reply.next : null;
		}
		return { rows, error: '' };
	}

	async function loadAllZones(silent = false) {
		if (!silent) {
			if (zones.length === 0) initialLoading = true;
			else refreshing = true;
		}
		try {
			const res = await readPages('land_map', 'zones');
			zones = res.rows
				.filter((z) => z?.id)
				.map((z) => ({
					h3_index: String(z.id),
					name: String(z.name || ''),
					zone_type: String(z.kind || 'unassigned'),
				}));
			zonesUnreadable = !!res.error;
			if (res.error) {
				console.warn('[zone_selector] land_map:', res.error);
				notice = 'Zones are not available to you right now.';
			}
		} finally {
			initialLoading = false;
			refreshing = false;
		}
	}

	async function loadMe() {
		const res = await call(false, 'me');
		const perms: string[] = res.ok && Array.isArray(res.permissions) ? res.permissions : [];
		canPick = perms.includes('all') || perms.includes('self.data_manage');
		if (!res.ok) console.warn('[zone_selector] me:', res.error);
	}

	function zonesGeoJson() {
		const features: any[] = [];
		for (const zone of zones) {
			if (!h3 || !zone.h3_index) continue;
			try {
				const boundary = h3.cellToBoundary(zone.h3_index, true);
				features.push({
					type: 'Feature',
					properties: {
						h3_index: zone.h3_index,
						zone_type: zone.zone_type,
						name: zone.name || 'Zone',
						color: zoneColor(zone.zone_type),
						mine: zone.h3_index === myZone,
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

	function refreshPreviewLayer() {
		if (!map || !mapReady || !h3) return;
		const color = zoneColor(zoneType);
		const features = pickedCell
			? [
					{
						type: 'Feature',
						properties: { h3_index: pickedCell, color },
						geometry: { type: 'Polygon', coordinates: [h3.cellToBoundary(pickedCell, true)] },
					},
				]
			: [];
		map.getSource(SOURCE_PREVIEW)?.setData({ type: 'FeatureCollection', features });
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
			paint: {
				'line-color': '#171717',
				'line-width': ['case', ['get', 'mine'], 3, 1.2],
				'line-opacity': 0.6,
			},
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

		map.on('click', 'zones-fill', (e: any) => {
			if (isPicking) return;
			const feature = e.features?.[0];
			if (!feature) return;
			const h3Index = feature.properties?.h3_index;
			selectedZone = zones.find((z) => z.h3_index === h3Index) ?? null;
		});

		map.on('click', onMapClick);
		map.on('mouseenter', 'zones-fill', () => {
			if (!isPicking) map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'zones-fill', () => {
			if (!isPicking) map.getCanvas().style.cursor = '';
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
		if (!maplibregl) throw new Error('MapLibre GL is unavailable');

		try {
			h3 = await loadH3();
			h3Ready = !!h3;
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

		// Tile hiccups are not the user's concern; without a listener MapLibre logs them as errors.
		map.on('error', (e: any) => console.warn('[zone_selector] map:', e?.error?.message ?? e));
		map.on('load', () => {
			addMapLayers();
			mapReady = true;
			refreshZonesLayer();
			fitToZones();
			requestAnimationFrame(() => map?.resize());
		});
	}

	function onMapClick(e: any) {
		if (!isPicking || !h3 || !map) return;
		const res = resolutionForZoom(map.getZoom());
		try {
			pickedCell = h3.latLngToCell(e.lngLat.lat, e.lngLat.lng, res);
			paintResolution = res;
		} catch {
			pickedCell = '';
		}
		refreshPreviewLayer();
	}

	function startPicking() {
		pickedCell = '';
		isPicking = true;
		selectedZone = null;
		notice = '';
		refreshPreviewLayer();
	}

	function cancelPicking() {
		isPicking = false;
		pickedCell = '';
		refreshPreviewLayer();
	}

	async function afterWrite(keepSelected: string) {
		await loadAllZones(true);
		selectedZone = keepSelected ? (zones.find((z) => z.h3_index === keepSelected) ?? null) : null;
		refreshZonesLayer();
		await tick();
		map?.resize();
	}

	function declined(res: Reply) {
		return `This zone was not changed: ${String(res.error || 'the realm declined').replace(/\.$/, '')}.`;
	}

	/** zone_set: make ``zone`` your home, optionally naming and typing it. */
	async function setHome(zone: string, fields: { name?: string; kind?: string }, done: string) {
		painting = true;
		notice = '';
		try {
			const res = await call(true, 'zone_set', { zone, ...fields });
			if (res.ok) {
				myZone = String(res.zone || zone);
				notice = done;
				return true;
			}
			notice = declined(res);
			return false;
		} finally {
			painting = false;
		}
	}

	async function paintZones() {
		if (!pickedCell) return;
		const cell = pickedCell;
		const existing = zones.find((z) => z.h3_index === cell);
		const name = zoneName.trim() || (existing ? '' : `${zoneLabel(zoneType)} zone`);
		const fields: { name?: string; kind: string } = { kind: zoneType };
		if (name) fields.name = name;
		if (await setHome(cell, fields, 'Your home zone is set.')) {
			isPicking = false;
			pickedCell = '';
			refreshPreviewLayer();
			await afterWrite(cell);
		}
	}

	async function updateZoneType(zone: MapZone, newType: string) {
		if (await setHome(zone.h3_index, { kind: newType }, 'Zone type updated.')) await afterWrite(zone.h3_index);
	}

	async function renameZone(zone: MapZone, name: string) {
		if (!name.trim()) return;
		if (await setHome(zone.h3_index, { name: name.trim() }, 'Zone renamed.')) await afterWrite(zone.h3_index);
	}

	async function claimZone(zone: MapZone) {
		if (await setHome(zone.h3_index, {}, 'Your home zone is set.')) await afterWrite(zone.h3_index);
	}

	async function removeZone(zone: MapZone) {
		painting = true;
		notice = '';
		try {
			const res = await call(true, 'zone_clear', { zone: zone.h3_index });
			if (res.ok) {
				myZone = '';
				notice = 'This zone is no longer your home.';
				await afterWrite('');
			} else {
				notice = declined(res);
			}
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
		if (mapReady) {
			zoneType;
			pickedCell;
			refreshPreviewLayer();
		}
	});

	$effect(() => {
		if (zones.length >= 0 && mapReady) {
			myZone;
			refreshZonesLayer();
		}
	});

	onMount(async () => {
		unsubscribePrincipal =
			ctx.principal?.subscribe?.(() => {
				myZone = '';
			}) ?? null;

		window.addEventListener('keydown', onWindowKeydown);

		await Promise.all([loadAllZones(false), loadMe()]);
		await tick();
		if (mapContainer) {
			try {
				await initMap();
			} catch (e: any) {
				console.warn('[zone_selector] map unavailable:', e?.message ?? e);
				mapUnavailable = true;
			}
		}
	});

	onDestroy(() => {
		unsubscribePrincipal?.();
		window.removeEventListener('keydown', onWindowKeydown);
		document.body.classList.remove('zone-selector-expanded');
		document.body.style.overflow = '';
		map?.remove?.();
		map = null;
		mapReady = false;
	});
</script>

<div class="zone-display" class:expanded>
	<div bind:this={mapContainer} class="zone-map" class:drawing={isPicking}></div>

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
				{#if canPick && !mapUnavailable}
					<button
						type="button"
						class="edit-toggle"
						class:active={editing}
						onclick={() => {
							editing = !editing;
							if (!editing) cancelPicking();
							notice = '';
						}}
					>
						{editing ? 'Done' : 'Choose my zone'}
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
			{#if mapUnavailable}
				<div class="zone-notice">The map cannot be shown right now.</div>
			{/if}
			{#if notice}
				<div class="zone-notice">{notice}</div>
			{/if}
			{#if refreshing}
				<div class="zone-refresh">Updating zones…</div>
			{/if}

			{#if editing && canPick}
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
						placeholder="Name for your zone (optional)"
						bind:value={zoneName}
					/>
					{#if !h3Ready}
						<div class="draw-hint">Picking a cell needs the hexagon grid, which is not available right now.</div>
					{:else if !isPicking}
						<button type="button" class="draw-btn" disabled={!mapReady} onclick={startPicking}>
							Pick a cell on the map
						</button>
						<div class="draw-hint gap-note">
							Each member has one home zone; choosing a new one replaces the previous. Painting many cells at
							once is not offered on this realm.
						</div>
					{:else if !pickedCell}
						<div class="draw-hint">
							Click the globe where your zone is (zoom in for a smaller cell).
							<div class="draw-actions">
								<button type="button" onclick={cancelPicking}>Cancel</button>
							</div>
						</div>
					{:else}
						<div class="draw-hint">
							Set <code>{pickedCell}</code> as your home zone,
							<strong>{zoneLabel(zoneType)}</strong> (H3 res {paintResolution}). Click elsewhere to pick another cell.
							<div class="draw-actions">
								<button type="button" class="primary" disabled={painting} onclick={paintZones}>
									{painting ? 'Saving…' : 'Set as my zone'}
								</button>
								<button type="button" disabled={painting} onclick={cancelPicking}>Cancel</button>
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
			{#if canPick && selectedZone.h3_index === myZone}
				<p class="panel-type">This is your home zone.</p>
				<div class="panel-controls">
					<label>
						Type
						<select
							disabled={painting}
							value={selectedZone.zone_type}
							onchange={(e) => updateZoneType(selectedZone!, (e.target as HTMLSelectElement).value)}
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
							onchange={(e) => renameZone(selectedZone!, (e.target as HTMLInputElement).value)}
						/>
					</label>
					<button type="button" class="remove-btn" disabled={painting} onclick={() => removeZone(selectedZone!)}>
						No longer my zone
					</button>
				</div>
			{:else}
				<p class="panel-type">
					Type: <strong>{zoneLabel(selectedZone.zone_type)}</strong>
				</p>
				{#if canPick}
					<div class="panel-controls">
						<button type="button" class="claim-btn" disabled={painting} onclick={() => claimZone(selectedZone!)}>
							Make this my zone
						</button>
					</div>
				{/if}
			{/if}
		</div>
	{/if}

	{#if zones.length === 0 && !editing && !initialLoading && !zonesUnreadable}
		<div class="zone-empty">
			<p>
				No zones have been set for this realm yet{canPick && !mapUnavailable
					? ' — use “Choose my zone” to pick yours'
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

	.draw-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	.remove-btn:disabled,
	.claim-btn:disabled {
		opacity: 0.5;
	}

	.claim-btn {
		padding: 0.45rem 0.9rem;
		border: none;
		border-radius: 0.5rem;
		background: #171717;
		color: #fff;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
	}

	.gap-note {
		margin-top: 0.5rem;
		color: #737373;
	}

	.panel-type {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: #525252;
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
