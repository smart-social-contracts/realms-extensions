<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount, onDestroy, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	let { ctx }: { ctx: any } = $props();

	let lands: any[] = $state([]);
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
	let isDrawing = $state(false);
	let drawPoints: [number, number][] = $state([]);
	let paintCells: string[] = $state([]);
	let paintableCount = $state(0);
	let paintResolution = $state(8);
	let drawLandName = $state('');

	let mapContainer: HTMLDivElement | undefined = $state();
	let mapReady = $state(false);
	let map: any = null;
	let maplibregl: any = null;
	let h3: any = null;
	let landPopup: any = null;
	let didFitBounds = false;

	let ownership = $state({ land_id: '', owner_user_id: '', owner_organization_id: '', owner_type: 'none' });
	let landUpdate = $state({ land_id: '', land_type: '', status: '' });
	let nftMint = $state({ land_id: '', owner_principal: '' });
	let submitting = $state(false);

	const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
	const SOURCE_LANDS = 'land-parcels';
	const SOURCE_POINTS = 'land-points';
	const SOURCE_HIGHLIGHT = 'land-highlight';
	const SOURCE_DRAFT_LINE = 'draft-line';
	const SOURCE_DRAFT_POINTS = 'draft-points';
	const SOURCE_PREVIEW = 'draw-preview';

	const landStatuses = [
		{ value: 'active', label: 'Active' },
		{ value: 'disputed', label: 'Disputed' },
		{ value: 'transferred', label: 'Transferred' },
		{ value: 'revoked', label: 'Revoked' },
	];

	const LAND_COLORS: Record<string, string> = {
		residential: '#4ade80',
		agricultural: '#fbbf24',
		industrial: '#6b7280',
		commercial: '#3b82f6',
		unassigned: '#e5e7eb',
	};
	const DRAFT_PREVIEW_COLOR = '#2563eb';
	const HEX_ZOOM_THRESHOLD = 10;

	let selectedLand = $derived(lands.find((l) => l.id === selectedLandId) ?? null);

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

	async function loadH3Lib() {
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
				sourceLayer.includes('boundary') || sourceLayer === 'admin' || id.includes('boundary');
			const isLabel = type === 'symbol' || id.includes('label') || sourceLayer.includes('place');
			if (!isBoundary && !isLabel) filtered.layers.push(layer);
		}
		delete filtered.light;
		return filtered;
	}

	function parseMetadata(raw: unknown): Record<string, unknown> | null {
		if (!raw) return null;
		try {
			return typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);
		} catch {
			return null;
		}
	}

	function landColor(type: string) {
		return LAND_COLORS[type] || LAND_COLORS.unassigned;
	}

	function resolveH3Index(land: any): string | null {
		if (land.h3_index) return land.h3_index;
		if (land.h3_indexes?.length) return land.h3_indexes[0];
		if (land.zones?.[0]?.h3_index) return land.zones[0].h3_index;
		const meta = parseMetadata(land.metadata);
		if (meta?.parent_zone) return String(meta.parent_zone);
		return null;
	}

	function resolveAllH3Indexes(land: any): string[] {
		if (land.h3_indexes?.length) return land.h3_indexes;
		if (land.zones?.length) return land.zones.map((z: any) => z.h3_index).filter(Boolean);
		const idx = resolveH3Index(land);
		return idx ? [idx] : [];
	}

	function getLandLatLng(h3Index: string | null): [number, number] | null {
		if (!h3Index || !h3) return null;
		try {
			const [lat, lng] = h3.cellToLatLng(h3Index);
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
			return [lat, lng];
		} catch {
			return null;
		}
	}

	function resolutionForZoom(zoom: number) {
		if (zoom <= 8) return 6;
		if (zoom <= 10) return 7;
		if (zoom <= 13) return 8;
		return 9;
	}

	function maxCellsForResolution(res: number) {
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

	function occupiedH3Cells(): Set<string> {
		const out = new SvelteSet<string>();
		for (const land of lands) {
			for (const idx of resolveAllH3Indexes(land)) out.add(idx);
		}
		return out;
	}

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
		const occupied = occupiedH3Cells();
		paintCells = cells;
		paintableCount = cells.filter((c) => !occupied.has(c)).length;
		paintResolution = res;
		refreshPreviewLayer();
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
		const color = DRAFT_PREVIEW_COLOR;
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

	function buildLandGeoJson() {
		const features: any[] = [];
		if (!h3) return { type: 'FeatureCollection', features };

		for (const land of lands) {
			for (const h3Index of resolveAllH3Indexes(land)) {
				const isOwned = !!(land.owner_user_id || land.owner_organization_id);
				const selected = land.id === selectedLandId;
				try {
					const boundary = h3.cellToBoundary(h3Index, true);
					features.push({
						type: 'Feature',
						properties: {
							land_id: land.id,
							color: landColor(land.land_type),
							fillOpacity: selected ? 0.85 : isOwned ? 0.7 : 0.5,
							lineColor: selected ? '#2563eb' : isOwned ? '#1f2937' : '#9ca3af',
							lineWidth: selected ? 3 : isOwned ? 2 : 1,
							land_json: JSON.stringify(land),
							h3_index: h3Index,
						},
						geometry: { type: 'Polygon', coordinates: [boundary] },
					});
				} catch {
					/* skip */
				}
			}
		}
		return { type: 'FeatureCollection', features };
	}

	function buildPointGeoJson() {
		const features: any[] = [];
		if (!h3) return { type: 'FeatureCollection', features };

		for (const land of lands) {
			const h3Index = resolveH3Index(land);
			const coords = getLandLatLng(h3Index);
			if (!coords) continue;
			const [lat, lng] = coords;
			const isOwned = !!(land.owner_user_id || land.owner_organization_id);
			const selected = land.id === selectedLandId;
			features.push({
				type: 'Feature',
				properties: {
					land_id: land.id,
					color: landColor(land.land_type),
					strokeColor: selected ? '#2563eb' : isOwned ? '#1f2937' : '#22c55e',
					radius: selected ? 11 : 8,
					land_json: JSON.stringify(land),
					h3_index: h3Index,
				},
				geometry: { type: 'Point', coordinates: [lng, lat] },
			});
		}
		return { type: 'FeatureCollection', features };
	}

	function buildHighlightGeoJson() {
		if (!selectedLand || !h3) return { type: 'FeatureCollection', features: [] };
		const features: any[] = [];
		for (const h3Index of resolveAllH3Indexes(selectedLand)) {
			try {
				const boundary = h3.cellToBoundary(h3Index, true);
				features.push({
					type: 'Feature',
					properties: { land_id: selectedLand.id },
					geometry: { type: 'Polygon', coordinates: [boundary] },
				});
			} catch {
				/* skip */
			}
		}
		return { type: 'FeatureCollection', features };
	}

	function fitMapToData(force = false) {
		if (!map || !maplibregl || !h3 || (didFitBounds && !force)) return;
		const bounds = new maplibregl.LngLatBounds();
		let hasBounds = false;
		for (const land of lands) {
			for (const h3Index of resolveAllH3Indexes(land)) {
				try {
					for (const [lng, lat] of h3.cellToBoundary(h3Index, true)) {
						bounds.extend([lng, lat]);
						hasBounds = true;
					}
				} catch {
					const coords = getLandLatLng(h3Index);
					if (coords) {
						bounds.extend([coords[1], coords[0]]);
						hasBounds = true;
					}
				}
			}
		}
		if (hasBounds) {
			map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: force ? 600 : 0 });
			didFitBounds = true;
		}
	}

	function flyToLand(land: any) {
		if (!map || !h3) return;
		const idx = resolveH3Index(land);
		const coords = getLandLatLng(idx);
		if (coords) {
			map.flyTo({ center: [coords[1], coords[0]], zoom: Math.max(map.getZoom(), 12), duration: 700 });
		}
	}

	function updateLayerVisibility() {
		if (!map || !mapReady) return;
		const showHex = map.getZoom() >= HEX_ZOOM_THRESHOLD;
		for (const id of ['lands-fill', 'lands-line', 'land-highlight-fill', 'land-highlight-line']) {
			if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', showHex ? 'visible' : 'none');
		}
		if (map.getLayer('land-points')) {
			map.setLayoutProperty('land-points', 'visibility', showHex ? 'none' : 'visible');
		}
		const previewVis = drawMode && paintCells.length > 0 ? 'visible' : 'none';
		for (const id of ['preview-fill', 'preview-line', 'draft-line-layer', 'draft-points-layer']) {
			if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', previewVis);
		}
	}

	function renderMapData() {
		if (!map || !mapReady || !h3) return;
		map.getSource(SOURCE_LANDS)?.setData(buildLandGeoJson());
		map.getSource(SOURCE_POINTS)?.setData(buildPointGeoJson());
		map.getSource(SOURCE_HIGHLIGHT)?.setData(buildHighlightGeoJson());
		refreshPreviewLayer();
		updateLayerVisibility();
	}

	function selectLand(land: any | null, fly = false) {
		selectedLandId = land?.id || '';
		if (land) {
			ownership = { ...ownership, land_id: land.id };
			landUpdate = { land_id: land.id, land_type: land.land_type || '', status: land.status || '' };
			nftMint = { ...nftMint, land_id: land.id, owner_principal: ctx.principal || '' };
			if (fly) flyToLand(land);
		}
		renderMapData();
	}

	function landPopupHtml(land: any, h3Index: string | null) {
		const color = landColor(land.land_type);
		const ownerInfo = land.owner_user_id
			? `Owner: User ${land.owner_user_id}`
			: land.owner_organization_id
				? `Owner: Org ${land.owner_organization_id}`
				: 'Available';
		return `<div style="padding:4px;font-size:13px;line-height:1.45">
			<strong>${land.id}</strong><br>
			Type: <span style="color:${color}">${land.land_type}</span><br>
			${ownerInfo}
			${h3Index ? `<br><span style="font-size:10px;color:#9ca3af">H3: ${h3Index}</span>` : ''}
		</div>`;
	}

	function onMapClick(e: any) {
		if (isDrawing) {
			drawPoints = [...drawPoints, [e.lngLat.lat, e.lngLat.lng]];
			refreshDraftLayers();
			syncDraftPreview();
			return;
		}
		if (drawMode) return;
	}

	function onFeatureClick(e: any) {
		if (isDrawing || drawMode) return;
		const feature = e.features?.[0];
		if (!feature?.properties?.land_json) return;
		try {
			const land = JSON.parse(feature.properties.land_json);
			selectLand(land, false);
			landPopup?.remove();
			landPopup = new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
				.setLngLat(e.lngLat)
				.setHTML(landPopupHtml(land, feature.properties.h3_index || null))
				.addTo(map);
		} catch {
			/* ignore */
		}
	}

	function addMapLayers() {
		if (!map) return;

		map.addSource(SOURCE_LANDS, { type: 'geojson', data: buildLandGeoJson() });
		map.addLayer({ id: 'lands-fill', type: 'fill', source: SOURCE_LANDS, paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['get', 'fillOpacity'] } });
		map.addLayer({ id: 'lands-line', type: 'line', source: SOURCE_LANDS, paint: { 'line-color': ['get', 'lineColor'], 'line-width': ['get', 'lineWidth'] } });

		map.addSource(SOURCE_HIGHLIGHT, { type: 'geojson', data: buildHighlightGeoJson() });
		map.addLayer({ id: 'land-highlight-fill', type: 'fill', source: SOURCE_HIGHLIGHT, paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.12 } });
		map.addLayer({ id: 'land-highlight-line', type: 'line', source: SOURCE_HIGHLIGHT, paint: { 'line-color': '#2563eb', 'line-width': 3 } });

		map.addSource(SOURCE_POINTS, { type: 'geojson', data: buildPointGeoJson() });
		map.addLayer({
			id: 'land-points',
			type: 'circle',
			source: SOURCE_POINTS,
			paint: {
				'circle-radius': ['get', 'radius'],
				'circle-color': ['get', 'color'],
				'circle-stroke-color': ['get', 'strokeColor'],
				'circle-stroke-width': 2,
			},
		});

		map.addSource(SOURCE_PREVIEW, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
		map.addLayer({ id: 'preview-fill', type: 'fill', source: SOURCE_PREVIEW, paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.55 } });
		map.addLayer({ id: 'preview-line', type: 'line', source: SOURCE_PREVIEW, paint: { 'line-color': '#171717', 'line-width': 1, 'line-dasharray': [2, 1] } });

		map.addSource(SOURCE_DRAFT_LINE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
		map.addLayer({ id: 'draft-line-layer', type: 'line', source: SOURCE_DRAFT_LINE, paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-dasharray': [1, 1] } });
		map.addSource(SOURCE_DRAFT_POINTS, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
		map.addLayer({
			id: 'draft-points-layer',
			type: 'circle',
			source: SOURCE_DRAFT_POINTS,
			paint: { 'circle-radius': 5, 'circle-color': ['case', ['get', 'first'], '#dc2626', '#2563eb'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 },
		});

		for (const layerId of ['lands-fill', 'land-points']) {
			map.on('click', layerId, onFeatureClick);
			map.on('mouseenter', layerId, () => {
				if (!isDrawing) map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', layerId, () => {
				map.getCanvas().style.cursor = isDrawing ? 'crosshair' : '';
			});
		}

		map.on('click', onMapClick);
		map.on('zoomend', () => {
			if (isDrawing) syncDraftPreview();
			updateLayerVisibility();
		});
		updateLayerVisibility();
	}

	async function initMap() {
		if (!mapContainer || map) return;
		maplibregl = await loadMapLibre();
		h3 = await loadH3Lib();
		let style: any = STYLE_URL;
		try {
			const res = await fetch(STYLE_URL);
			if (res.ok) style = stripNoisyLayers(await res.json());
		} catch {
			/* fallback */
		}
		map = new maplibregl.Map({ container: mapContainer, style, center: [0, 20], zoom: 2, attributionControl: true });
		map.on('load', () => {
			addMapLayers();
			mapReady = true;
			renderMapData();
			fitMapToData();
			requestAnimationFrame(() => map?.resize());
		});
	}

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	async function loadLands(silent = false) {
		if (!silent) {
			if (lands.length === 0) loading = true;
			else refreshing = true;
		}
		error = '';
		accessDeniedOp = '';
		try {
			const res = await callExt('get_lands', { all: true });
			if (res?.success) lands = res.data ?? [];
			else lands = res?.data ?? [];
			if (selectedLandId && !lands.some((l) => l.id === selectedLandId)) selectedLandId = '';
			if (mapReady) {
				didFitBounds = false;
				renderMapData();
				if (lands.length) fitMapToData(true);
				await tick();
				map?.resize();
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			loading = false;
			refreshing = false;
		}
	}

	function startDrawMode() {
		drawMode = true;
		isDrawing = false;
		drawPoints = [];
		paintCells = [];
		paintableCount = 0;
		selectedLandId = '';
		refreshDraftLayers();
		refreshPreviewLayer();
		updateLayerVisibility();
		if (map) map.getCanvas().style.cursor = '';
	}

	function cancelDrawMode() {
		drawMode = false;
		isDrawing = false;
		drawPoints = [];
		paintCells = [];
		paintableCount = 0;
		refreshDraftLayers();
		refreshPreviewLayer();
		updateLayerVisibility();
		if (map) map.getCanvas().style.cursor = '';
	}

	function startDrawing() {
		isDrawing = true;
		drawPoints = [];
		paintCells = [];
		if (map) map.getCanvas().style.cursor = 'crosshair';
		refreshDraftLayers();
		syncDraftPreview();
	}

	function undoPoint() {
		drawPoints = drawPoints.slice(0, -1);
		refreshDraftLayers();
		syncDraftPreview();
	}

	function finishShape() {
		if (drawPoints.length < 3) return;
		syncDraftPreview();
		isDrawing = false;
		drawPoints = [];
		refreshDraftLayers();
		if (map) map.getCanvas().style.cursor = '';
		updateLayerVisibility();
	}

	async function createDrawnParcel() {
		if (paintableCount === 0) return;
		const newCells = paintCells.filter((c) => !occupiedH3Cells().has(c));
		if (!newCells.length) return;
		submitting = true;
		error = '';
		success = '';
		try {
			const res = await callExt('create_land', {
				h3_indexes: newCells,
				name: drawLandName.trim() || undefined,
			});
			if (res?.success) {
				success = res.data?.message || 'Land parcel created.';
				cancelDrawMode();
				await loadLands(true);
				if (res.data?.id) {
					const created = lands.find((l) => l.id === res.data.id);
					if (created) selectLand(created, true);
				}
			} else {
				error = res?.error || 'Failed to create land parcel';
			}
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			submitting = false;
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
		document.body.classList.toggle('land-registry-expanded', next);
		document.body.style.overflow = next ? 'hidden' : '';
		resizeMapSoon();
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
			resizeMapSoon();
		};
		const onUp = () => {
			isResizing = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	function getTypeColor(type: string) {
		const colors: Record<string, string> = {
			residential: 'chip-green',
			agricultural: 'chip-yellow',
			industrial: 'chip-gray',
			commercial: 'chip-blue',
		};
		return colors[type] || 'chip-muted';
	}

	async function updateOwnership() {
		submitting = true;
		error = '';
		success = '';
		try {
			const data: any = { land_id: ownership.land_id };
			if (ownership.owner_type === 'user') data.owner_user_id = ownership.owner_user_id;
			else if (ownership.owner_type === 'organization') data.owner_organization_id = ownership.owner_organization_id;
			const res = await callExt('update_land_ownership', data);
			if (res?.success) {
				success = 'Ownership updated!';
				await loadLands(true);
			} else error = res?.error || 'Failed to update ownership';
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			submitting = false;
		}
	}

	async function updateLandProps() {
		submitting = true;
		error = '';
		success = '';
		try {
			const data: any = { land_id: landUpdate.land_id };
			if (landUpdate.status) data.status = landUpdate.status;
			const res = await callExt('update_land', data);
			if (res?.success) {
				success = res?.data?.message || 'Land updated!';
				await loadLands(true);
			} else error = res?.error || 'Failed to update land';
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			submitting = false;
		}
	}

	async function mintNFT() {
		submitting = true;
		error = '';
		success = '';
		try {
			const prepRes = await callExt('register_land_nft', {
				land_id: nftMint.land_id,
				owner_principal: nftMint.owner_principal,
				registered_by: ctx.principal || 'admin',
			});
			if (!prepRes?.success) {
				error = prepRes?.error || 'Failed to prepare NFT';
				return;
			}
			const mintRaw = await ctx.backend.mint_land_nft_for_parcel(
				nftMint.land_id,
				nftMint.owner_principal,
				''
			);
			const mintRes = JSON.parse(mintRaw);
			if (mintRes.success) {
				await callExt('update_land_nft_token', { land_id: nftMint.land_id, nft_token_id: mintRes.token_id });
				success = `NFT minted! Token ID: ${mintRes.token_id}`;
				nftMint = { ...nftMint, owner_principal: '' };
				await loadLands(true);
			} else error = mintRes.error || 'Mint failed';
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			submitting = false;
		}
	}

	$effect(() => {
		if (mapReady) {
			lands;
			selectedLandId;
			renderMapData();
		}
	});

	onMount(async () => {
		window.addEventListener('keydown', onWindowKeydown);
		await loadLands(false);
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
		document.body.classList.remove('land-registry-expanded');
		document.body.style.overflow = '';
		landPopup?.remove?.();
		map?.remove?.();
		map = null;
		mapReady = false;
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
					{#if !isDrawing && paintCells.length === 0}
						<button type="button" class="primary-btn" onclick={startDrawing}>Start drawing</button>
					{:else if isDrawing}
						<button type="button" class="ghost-btn" onclick={undoPoint} disabled={drawPoints.length === 0}>Undo</button>
						<button type="button" class="primary-btn" onclick={finishShape} disabled={drawPoints.length < 3}>Finish shape</button>
					{:else if paintCells.length > 0}
						<button type="button" class="primary-btn" onclick={createDrawnParcel} disabled={submitting || paintableCount === 0}>
							Create {paintableCount} cell(s)
						</button>
					{/if}
				{:else}
					<button type="button" class="primary-btn" onclick={startDrawMode}>Draw parcel</button>
				{/if}
			</div>

			{#if drawMode}
				<div class="draw-panel">
					<p class="muted">Parcel type is inherited from the covering zone (Zones extension).</p>
					<label>Name (optional)
						<input type="text" bind:value={drawLandName} placeholder="Parcel name" />
					</label>
					{#if isDrawing}
						<p class="muted">Click the map to add points ({drawPoints.length}). Need at least 3.</p>
					{:else if paintCells.length > 0}
						<p class="muted">Previewing {paintableCount} new cell(s) at H3 res {paintResolution}.</p>
					{:else}
						<p class="muted">Draw a shape on the map to define the parcel area.</p>
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
							<span class="dot" style="background:{landColor(land.land_type)}"></span>
							<span class="parcel-main">
								<strong>{land.id}</strong>
								<span class="muted">{land.land_type}{land.h3_index ? ` · ${land.h3_index.slice(0, 10)}…` : ''}</span>
							</span>
							<span class="parcel-status">
								{#if land.for_sale}Sale{:else if land.owner_user_id || land.owner_organization_id}Owned{:else}Open{/if}
							</span>
						</button>
					{/each}
				{/if}
			</div>

			{#if selectedLand && !drawMode}
				<div class="detail-panel">
					<h3>{selectedLand.id}</h3>
					<p class="muted">{selectedLand.land_type} · {selectedLand.status || 'active'}</p>
					{#if selectedLand.h3_index}<code class="h3-code">{selectedLand.h3_index}</code>{/if}

					<form class="mini-form" onsubmit={(e) => { e.preventDefault(); updateOwnership(); }}>
						<h4>Ownership</h4>
						<select bind:value={ownership.owner_type}>
							<option value="none">No owner</option>
							<option value="user">Citizen</option>
							<option value="organization">Organization</option>
						</select>
						{#if ownership.owner_type === 'user'}
							<input type="text" bind:value={ownership.owner_user_id} placeholder="User ID" />
						{:else if ownership.owner_type === 'organization'}
							<input type="text" bind:value={ownership.owner_organization_id} placeholder="Organization ID" />
						{/if}
						<button type="submit" class="primary-btn green" disabled={submitting}>Update ownership</button>
					</form>

					<form class="mini-form" onsubmit={(e) => { e.preventDefault(); updateLandProps(); }}>
						<h4>Properties</h4>
						<p class="readonly-field">
							<span class="readonly-label">Type</span>
							<span>{selectedLand.land_type || 'unassigned'}</span>
						</p>
						<select bind:value={landUpdate.status}>
							{#each landStatuses as s (s.value)}<option value={s.value}>{s.label}</option>{/each}
						</select>
						<button type="submit" class="primary-btn amber" disabled={submitting}>Update land</button>
					</form>

					<form class="mini-form" onsubmit={(e) => { e.preventDefault(); mintNFT(); }}>
						<h4>Mint NFT</h4>
						<input type="text" bind:value={nftMint.owner_principal} placeholder="Owner principal" />
						<button type="submit" class="primary-btn purple" disabled={submitting}>Mint NFT</button>
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
			<div bind:this={mapContainer} class="land-map" class:drawing={isDrawing}></div>
			<div class="map-overlay map-overlay-top">
				<div class="map-actions">
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
		inset: 0;
	}

	.land-map.drawing {
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

	.h3-code {
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
