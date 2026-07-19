<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';

	let { ctx }: { ctx: any } = $props();

	let activeTab = $state<'geographic' | 'table' | 'admin'>('geographic');
	let lands: any[] = $state([]);
	let loading = $state(true);
	let refreshing = $state(false);
	let error = $state('');
	let accessDeniedOp = $state('');
	let success = $state('');
	let expanded = $state(false);

	let mapContainer: HTMLDivElement | undefined = $state();
	let mapReady = $state(false);
	let map: any = null;
	let maplibregl: any = null;
	let h3: any = null;
	let landPopup: any = null;
	let didFitBounds = false;

	const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
	const SOURCE_ZONES = 'land-zones';
	const SOURCE_LANDS = 'land-parcels';
	const SOURCE_POINTS = 'land-points';

	const landTypes = [
		{ value: 'unassigned', label: 'Unassigned' },
		{ value: 'residential', label: 'Residential' },
		{ value: 'agricultural', label: 'Agricultural' },
		{ value: 'industrial', label: 'Industrial' },
		{ value: 'commercial', label: 'Commercial' },
	];
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
	const ZONE_COLOR = '#f59e0b';
	const INFLUENCE_RINGS = 2;
	const HEX_ZOOM_THRESHOLD = 10;

	let tablePage = $state(0);
	const tablePageSize = 10;
	let tableTotalPages = $derived(Math.ceil(lands.length / tablePageSize));
	let paginatedLands = $derived(lands.slice(tablePage * tablePageSize, (tablePage + 1) * tablePageSize));

	let newLand = $state({ x_coordinate: 0, y_coordinate: 0, land_type: 'unassigned', size_width: 1, size_height: 1 });
	let ownership = $state({ land_id: '', owner_user_id: '', owner_organization_id: '', owner_type: 'none' });
	let landUpdate = $state({ land_id: '', land_type: '', status: '' });
	let nftMint = $state({ land_id: '', owner_principal: '' });
	let submitting = $state(false);

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
				sourceLayer === 'poi';
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

	function resolveH3Index(land: any): string | null {
		const candidates: (string | null | undefined)[] = [land.h3_index, land.zones?.[0]?.h3_index];
		const meta = parseMetadata(land.metadata);
		if (meta?.parent_zone) candidates.push(String(meta.parent_zone));

		for (const idx of candidates) {
			if (!idx || String(idx).includes('manual')) continue;
			try {
				if (h3?.isValidCell && !h3.isValidCell(idx)) continue;
				h3.cellToLatLng(idx);
				return idx;
			} catch {
				/* skip */
			}
		}
		return null;
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

	function landColor(type: string) {
		return LAND_COLORS[type] || LAND_COLORS.unassigned;
	}

	function landPopupHtml(land: any, h3Index: string | null) {
		const color = landColor(land.land_type);
		const isOwned = !!(land.owner_user_id || land.owner_organization_id);
		const ownerInfo = land.owner_user_id
			? `Owner: User ${land.owner_user_id}`
			: land.owner_organization_id
				? `Owner: Org ${land.owner_organization_id}`
				: '<span style="color:#2563eb">Available</span>';
		const priceInfo =
			land.for_sale && land.price_realm_tokens
				? `<br><span style="color:#16a34a;font-weight:600">${land.price_realm_tokens} REALM</span>`
				: '';
		return `<div style="padding:4px;font-size:13px;line-height:1.45">
			<strong>${land.id}</strong><br>
			Type: <span style="color:${color}">${land.land_type}</span><br>
			${ownerInfo}${priceInfo}
			${h3Index ? `<br><span style="font-size:10px;color:#9ca3af">H3: ${h3Index}</span>` : ''}
			${isOwned ? '' : ''}
		</div>`;
	}

	function buildZoneGeoJson() {
		const features: any[] = [];
		if (!h3) return { type: 'FeatureCollection', features };

		const parentZones = new Map<string, { landCount: number; landTypes: Record<string, number> }>();
		for (const land of lands) {
			const meta = parseMetadata(land.metadata);
			const parentZone = meta?.parent_zone ? String(meta.parent_zone) : null;
			if (!parentZone) continue;
			if (!parentZones.has(parentZone)) parentZones.set(parentZone, { landCount: 0, landTypes: {} });
			const zd = parentZones.get(parentZone)!;
			zd.landCount++;
			zd.landTypes[land.land_type] = (zd.landTypes[land.land_type] || 0) + 1;
		}

		const hexData: Record<
			string,
			{ minDistance: number; landCount: number; landTypes: Record<string, number> }
		> = {};

		parentZones.forEach((zoneInfo, centerHex) => {
			let disk: string[];
			try {
				disk = h3.gridDisk(centerHex, INFLUENCE_RINGS);
			} catch {
				disk = [centerHex];
			}
			for (const hexIdx of disk) {
				let dist: number;
				try {
					dist = h3.gridDistance(centerHex, hexIdx);
				} catch {
					dist = hexIdx === centerHex ? 0 : 1;
				}
				if (!hexData[hexIdx]) hexData[hexIdx] = { minDistance: dist, landCount: 0, landTypes: {} };
				else hexData[hexIdx].minDistance = Math.min(hexData[hexIdx].minDistance, dist);
				if (dist === 0) {
					hexData[hexIdx].landCount += zoneInfo.landCount;
					hexData[hexIdx].landTypes = zoneInfo.landTypes;
				}
			}
		});

		for (const [hexIdx, data] of Object.entries(hexData)) {
			try {
				const boundary = h3.cellToBoundary(hexIdx, true);
				const distOp = 1 - (data.minDistance / (INFLUENCE_RINGS + 1)) * 0.7;
				const fillOpacity = (data.minDistance === 0 ? 0.5 : 0.25) * distOp;
				features.push({
					type: 'Feature',
					properties: {
						h3_index: hexIdx,
						color: ZONE_COLOR,
						fillOpacity,
						lineOpacity: data.minDistance === 0 ? 0.8 : 0.4,
						lineWidth: data.minDistance === 0 ? 2 : 1,
						dashed: data.minDistance > 0 ? 1 : 0,
						isCenter: data.minDistance === 0 ? 1 : 0,
						landCount: data.landCount,
						typeSummary: Object.entries(data.landTypes)
							.map(([t, c]) => `${t}: ${c}`)
							.join(', '),
					},
					geometry: { type: 'Polygon', coordinates: [boundary] },
				});
			} catch {
				/* skip */
			}
		}

		return { type: 'FeatureCollection', features };
	}

	function buildLandGeoJson() {
		const features: any[] = [];
		if (!h3) return { type: 'FeatureCollection', features };

		for (const land of lands) {
			const h3Index = resolveH3Index(land);
			if (!h3Index) continue;
			const isOwned = !!(land.owner_user_id || land.owner_organization_id);
			try {
				const boundary = h3.cellToBoundary(h3Index, true);
				features.push({
					type: 'Feature',
					properties: {
						land_id: land.id,
						color: landColor(land.land_type),
						fillOpacity: isOwned ? 0.7 : 0.5,
						lineColor: isOwned ? '#1f2937' : '#9ca3af',
						lineWidth: isOwned ? 2 : 1,
						land_json: JSON.stringify(land),
						h3_index: h3Index,
					},
					geometry: { type: 'Polygon', coordinates: [boundary] },
				});
			} catch {
				/* skip */
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
			features.push({
				type: 'Feature',
				properties: {
					land_id: land.id,
					color: landColor(land.land_type),
					strokeColor: isOwned ? '#1f2937' : '#22c55e',
					land_json: JSON.stringify(land),
					h3_index: h3Index,
				},
				geometry: { type: 'Point', coordinates: [lng, lat] },
			});
		}

		return { type: 'FeatureCollection', features };
	}

	function fitMapToData() {
		if (!map || !maplibregl || !h3 || didFitBounds) return;
		const bounds = new maplibregl.LngLatBounds();
		let hasBounds = false;

		for (const land of lands) {
			const h3Index = resolveH3Index(land);
			if (!h3Index) continue;
			try {
				const boundary = h3.cellToBoundary(h3Index, true);
				for (const [lng, lat] of boundary) {
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

		if (hasBounds) {
			map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 0 });
			didFitBounds = true;
		}
	}

	function updateLayerVisibility() {
		if (!map || !mapReady) return;
		const zoom = map.getZoom();
		const showHex = zoom >= HEX_ZOOM_THRESHOLD;
		for (const id of ['lands-fill', 'lands-line']) {
			if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', showHex ? 'visible' : 'none');
		}
		if (map.getLayer('land-points')) {
			map.setLayoutProperty('land-points', 'visibility', showHex ? 'none' : 'visible');
		}
	}

	function renderMapData() {
		if (!map || !mapReady || !h3) return;
		map.getSource(SOURCE_ZONES)?.setData(buildZoneGeoJson());
		map.getSource(SOURCE_LANDS)?.setData(buildLandGeoJson());
		map.getSource(SOURCE_POINTS)?.setData(buildPointGeoJson());
		updateLayerVisibility();
		fitMapToData();
	}

	function showFeaturePopup(e: any, layerId: string) {
		if (!map || !maplibregl) return;
		const feature = e.features?.[0];
		if (!feature) return;

		if (layerId === 'zones-fill' && feature.properties?.isCenter) {
			const html = `<div style="padding:4px;font-size:13px">
				<strong>Land Zone</strong><br>
				Parcels: ${feature.properties.landCount}<br>
				${feature.properties.typeSummary ? `Types: ${feature.properties.typeSummary}<br>` : ''}
				<span style="font-size:10px;color:#9ca3af">H3: ${feature.properties.h3_index}</span>
			</div>`;
			landPopup?.remove();
			landPopup = new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
				.setLngLat(e.lngLat)
				.setHTML(html)
				.addTo(map);
			return;
		}

		const landRaw = feature.properties?.land_json;
		if (!landRaw) return;
		try {
			const land = JSON.parse(landRaw);
			landPopup?.remove();
			landPopup = new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
				.setLngLat(e.lngLat)
				.setHTML(landPopupHtml(land, feature.properties?.h3_index || null))
				.addTo(map);
		} catch {
			/* ignore */
		}
	}

	function addMapLayers() {
		if (!map) return;

		map.addSource(SOURCE_ZONES, { type: 'geojson', data: buildZoneGeoJson() });
		map.addLayer({
			id: 'zones-fill',
			type: 'fill',
			source: SOURCE_ZONES,
			paint: {
				'fill-color': ['get', 'color'],
				'fill-opacity': ['get', 'fillOpacity'],
			},
		});
		map.addLayer({
			id: 'zones-line',
			type: 'line',
			source: SOURCE_ZONES,
			paint: {
				'line-color': ['get', 'color'],
				'line-width': ['get', 'lineWidth'],
				'line-opacity': ['get', 'lineOpacity'],
				'line-dasharray': ['case', ['==', ['get', 'dashed'], 1], ['literal', [4, 4]], ['literal', [1, 0]]],
			},
		});

		map.addSource(SOURCE_LANDS, { type: 'geojson', data: buildLandGeoJson() });
		map.addLayer({
			id: 'lands-fill',
			type: 'fill',
			source: SOURCE_LANDS,
			paint: {
				'fill-color': ['get', 'color'],
				'fill-opacity': ['get', 'fillOpacity'],
			},
		});
		map.addLayer({
			id: 'lands-line',
			type: 'line',
			source: SOURCE_LANDS,
			paint: {
				'line-color': ['get', 'lineColor'],
				'line-width': ['get', 'lineWidth'],
			},
		});

		map.addSource(SOURCE_POINTS, { type: 'geojson', data: buildPointGeoJson() });
		map.addLayer({
			id: 'land-points',
			type: 'circle',
			source: SOURCE_POINTS,
			paint: {
				'circle-radius': 8,
				'circle-color': ['get', 'color'],
				'circle-stroke-color': ['get', 'strokeColor'],
				'circle-stroke-width': 2,
				'circle-opacity': 0.9,
			},
		});

		for (const layerId of ['lands-fill', 'land-points', 'zones-fill']) {
			map.on('click', layerId, (e: any) => {
				showFeaturePopup(e, layerId);
			});
			map.on('mouseenter', layerId, () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', layerId, () => {
				map.getCanvas().style.cursor = '';
			});
		}

		map.on('zoomend', updateLayerVisibility);
		updateLayerVisibility();
	}

	async function initMap() {
		if (!mapContainer || map) return;

		maplibregl = await loadMapLibre();
		if (!maplibregl) throw new Error('MapLibre GL failed to initialize');
		h3 = await loadH3();

		let style: any = STYLE_URL;
		try {
			const res = await fetch(STYLE_URL);
			if (res.ok) style = stripNoisyLayers(await res.json());
		} catch {
			/* keep URL fallback */
		}

		map = new maplibregl.Map({
			container: mapContainer,
			style,
			center: [0, 20],
			zoom: 2,
			attributionControl: true,
		});

		map.on('load', () => {
			addMapLayers();
			mapReady = true;
			renderMapData();
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
			const res = await callExt('get_lands');
			if (res?.success) {
				lands = res.data ?? [];
			} else {
				lands = res?.data ?? (Array.isArray(res) ? res : []);
			}
			if (mapReady) {
				didFitBounds = false;
				renderMapData();
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

	function resizeMapSoon() {
		requestAnimationFrame(() => {
			map?.resize();
			requestAnimationFrame(() => map?.resize());
		});
	}

	function setExpanded(next: boolean) {
		expanded = next;
		if (typeof document !== 'undefined') {
			document.body.classList.toggle('land-registry-expanded', next);
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

	async function switchToMapTab() {
		activeTab = 'geographic';
		await tick();
		if (mapContainer && !map) {
			await initMap();
		} else if (map) {
			resizeMapSoon();
			renderMapData();
		}
	}

	function getTypeColor(type: string) {
		const colors: Record<string, string> = {
			residential: 'bg-green-100 text-green-800',
			agricultural: 'bg-yellow-100 text-yellow-800',
			industrial: 'bg-gray-100 text-gray-800',
			commercial: 'bg-blue-100 text-blue-800',
		};
		return colors[type] || 'bg-gray-100 text-gray-600';
	}

	async function createLand() {
		submitting = true;
		error = '';
		success = '';
		try {
			const res = await callExt('create_land', newLand);
			if (res?.success) {
				success = 'Land created successfully!';
				newLand = { x_coordinate: 0, y_coordinate: 0, land_type: 'unassigned', size_width: 1, size_height: 1 };
				await loadLands(true);
			} else {
				error = res?.error || 'Failed to create land';
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
			submitting = false;
		}
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
				ownership = { land_id: '', owner_user_id: '', owner_organization_id: '', owner_type: 'none' };
				await loadLands(true);
			} else {
				error = res?.error || 'Failed to update ownership';
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
			submitting = false;
		}
	}

	async function updateLandProps() {
		submitting = true;
		error = '';
		success = '';
		try {
			const data: any = { land_id: landUpdate.land_id };
			if (landUpdate.land_type) data.land_type = landUpdate.land_type;
			if (landUpdate.status) data.status = landUpdate.status;
			const res = await callExt('update_land', data);
			if (res?.success) {
				success = res?.data?.message || 'Land updated!';
				landUpdate = { land_id: '', land_type: '', status: '' };
				await loadLands(true);
			} else {
				error = res?.error || 'Failed to update land';
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
			const mintData = prepRes.data;
			const mintRaw = await ctx.backend.mint_land_nft_for_parcel(
				nftMint.land_id,
				nftMint.owner_principal,
				BigInt(mintData.token_id),
				''
			);
			const mintRes = JSON.parse(mintRaw);
			if (mintRes.success) {
				await callExt('update_land_nft_token', { land_id: nftMint.land_id, nft_token_id: mintRes.token_id });
				success = `NFT minted! Token ID: ${mintRes.token_id}`;
				nftMint = { land_id: '', owner_principal: '' };
				await loadLands(true);
			} else {
				error = mintRes.error || 'Mint failed';
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
			submitting = false;
		}
	}

	$effect(() => {
		if (activeTab === 'geographic' && mapReady && lands.length >= 0) {
			lands;
			renderMapData();
		}
	});

	onMount(async () => {
		window.addEventListener('keydown', onWindowKeydown);
		await loadLands(false);
		await tick();
		if (activeTab === 'geographic' && mapContainer) {
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

<div class="land-registry" class:expanded class:map-tab={activeTab === 'geographic'}>
	{#if accessDeniedOp}
		<div class="panel-shell">
			{#if ctx.ui?.AccessDenied}
				<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
			{:else}
				<p class="muted">You need additional permissions to view this page.</p>
			{/if}
		</div>
	{:else if activeTab === 'geographic'}
		<div bind:this={mapContainer} class="land-map"></div>

		<div class="land-overlay land-overlay-top">
			<div class="land-header">
				<div class="land-header-copy">
					<h2>Land Registry</h2>
					<p class="land-header-desc">Manage land parcels, ownership, and NFT minting on the map.</p>
				</div>
				<div class="land-header-actions">
					<button type="button" class="ghost-btn" onclick={toggleExpanded} aria-pressed={expanded}>
						{expanded ? 'Exit full screen' : 'Expand'}
					</button>
				</div>
			</div>

			<nav class="tab-nav">
				<button type="button" class="tab-btn active" onclick={switchToMapTab}>Map View</button>
				<button type="button" class="tab-btn" onclick={() => (activeTab = 'table')}>Table View</button>
				<button type="button" class="tab-btn" onclick={() => (activeTab = 'admin')}>Admin Controls</button>
			</nav>

			{#if loading}
				<div class="status-banner">Loading lands…</div>
			{:else if refreshing}
				<div class="status-banner">Updating lands…</div>
			{/if}
			{#if error}
				<div class="alert error">{error}</div>
			{/if}
			{#if success}
				<div class="alert success">{success}</div>
			{/if}
		</div>

		<div class="land-overlay land-overlay-bottom">
			<div class="legend">
				{#each Object.entries(LAND_COLORS) as [type, color]}
					<span class="legend-item">
						<span class="legend-dot" style="background:{color}"></span>
						<span class="capitalize">{type}</span>
					</span>
				{/each}
				<span class="legend-item">
					<span class="legend-dot ring-owned"></span>
					Owned
				</span>
				<span class="legend-item">
					<span class="legend-dot ring-available"></span>
					Available
				</span>
				<span class="legend-spacer"></span>
				<button type="button" class="ghost-btn" onclick={() => loadLands(true)}>Refresh</button>
				<span class="parcel-count">{lands.length} parcel{lands.length !== 1 ? 's' : ''}</span>
			</div>
		</div>
	{:else}
		<div class="panel-shell">
			<div class="panel-head">
				<div>
					<h2>Land Registry</h2>
					<p class="muted">Manage land parcels, ownership, and NFT minting</p>
				</div>
				<button type="button" class="ghost-btn" onclick={switchToMapTab}>Back to map</button>
			</div>

			<nav class="tab-nav panel-tabs">
				<button type="button" class="tab-btn" onclick={switchToMapTab}>Map View</button>
				<button type="button" class="tab-btn" class:active={activeTab === 'table'} onclick={() => (activeTab = 'table')}>Table View</button>
				<button type="button" class="tab-btn" class:active={activeTab === 'admin'} onclick={() => (activeTab = 'admin')}>Admin Controls</button>
			</nav>

			{#if error}
				<div class="alert error">{error}</div>
			{/if}
			{#if success}
				<div class="alert success">{success}</div>
			{/if}

			{#if loading}
				<div class="loading-row">Loading lands…</div>
			{:else if activeTab === 'table'}
				<div class="panel-block">
					<div class="panel-block-head">
						<div>
							<h3>Land Registry Table</h3>
							<p class="muted">Showing {paginatedLands.length} of {lands.length} parcels</p>
						</div>
						<button type="button" class="ghost-btn" onclick={() => loadLands(true)}>Refresh</button>
					</div>

					{#if lands.length > 0}
						<div class="table-wrap">
							<table>
								<thead>
									<tr>
										<th>ID</th>
										<th>Type</th>
										<th>H3 Cell</th>
										<th>Owner</th>
										<th>Status</th>
										<th>Price</th>
									</tr>
								</thead>
								<tbody>
									{#each paginatedLands as land}
										<tr>
											<td><strong>{land.id}</strong></td>
											<td><span class="badge {getTypeColor(land.land_type)}">{land.land_type}</span></td>
											<td>{land.h3_index ? land.h3_index : '—'}</td>
											<td>{land.owner_user_id || land.owner_organization_id || '—'}</td>
											<td>
												{#if land.for_sale}
													For Sale
												{:else if land.owner_user_id || land.owner_organization_id}
													Owned
												{:else}
													Available
												{/if}
											</td>
											<td>{land.for_sale && land.price_realm_tokens ? `${land.price_realm_tokens} REALM` : '—'}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						{#if tableTotalPages > 1}
							<div class="pager">
								<button type="button" class="ghost-btn" disabled={tablePage === 0} onclick={() => (tablePage = Math.max(0, tablePage - 1))}>Previous</button>
								<span class="muted">Page {tablePage + 1} of {tableTotalPages}</span>
								<button type="button" class="ghost-btn" disabled={tablePage >= tableTotalPages - 1} onclick={() => (tablePage = Math.min(tableTotalPages - 1, tablePage + 1))}>Next</button>
							</div>
						{/if}
					{:else}
						<p class="muted center">No land parcels registered yet.</p>
					{/if}
				</div>
			{:else if activeTab === 'admin'}
				<div class="admin-grid">
					<section class="admin-card">
						<h3>Create New Land Parcel</h3>
						<form
							onsubmit={(e) => {
								e.preventDefault();
								createLand();
							}}
							class="form-grid"
						>
							<label>X Coordinate<input type="number" bind:value={newLand.x_coordinate} min="0" max="19" required /></label>
							<label>Y Coordinate<input type="number" bind:value={newLand.y_coordinate} min="0" max="19" required /></label>
							<label class="full">Land Type
								<select bind:value={newLand.land_type}>
									{#each landTypes as type}<option value={type.value}>{type.label}</option>{/each}
								</select>
							</label>
							<button type="submit" class="primary-btn" disabled={submitting}>{submitting ? 'Creating…' : 'Create Land Parcel'}</button>
						</form>
					</section>

					<section class="admin-card">
						<h3>Update Land Ownership</h3>
						<form
							onsubmit={(e) => {
								e.preventDefault();
								updateOwnership();
							}}
							class="form-grid"
						>
							<label class="full">Land ID<input type="text" bind:value={ownership.land_id} required /></label>
							<label class="full">Owner Type
								<select bind:value={ownership.owner_type}>
									<option value="none">No Owner</option>
									<option value="user">Citizen</option>
									<option value="organization">Organization</option>
								</select>
							</label>
							{#if ownership.owner_type === 'user'}
								<label class="full">User ID<input type="text" bind:value={ownership.owner_user_id} required /></label>
							{:else if ownership.owner_type === 'organization'}
								<label class="full">Organization ID<input type="text" bind:value={ownership.owner_organization_id} required /></label>
							{/if}
							<button type="submit" class="primary-btn green" disabled={submitting}>{submitting ? 'Updating…' : 'Update Ownership'}</button>
						</form>
					</section>

					<section class="admin-card">
						<h3>Update Land Properties</h3>
						<form
							onsubmit={(e) => {
								e.preventDefault();
								updateLandProps();
							}}
							class="form-grid"
						>
							<label class="full">Land ID<input type="text" bind:value={landUpdate.land_id} required /></label>
							<label>Land Type
								<select bind:value={landUpdate.land_type}>
									<option value="">— No change —</option>
									{#each landTypes as type}<option value={type.value}>{type.label}</option>{/each}
								</select>
							</label>
							<label>Status
								<select bind:value={landUpdate.status}>
									<option value="">— No change —</option>
									{#each landStatuses as s}<option value={s.value}>{s.label}</option>{/each}
								</select>
							</label>
							<button type="submit" class="primary-btn amber" disabled={submitting}>{submitting ? 'Updating…' : 'Update Land'}</button>
						</form>
					</section>

					<section class="admin-card">
						<h3>Mint Land NFT</h3>
						<p class="muted">Register a land parcel and mint an NFT representing ownership.</p>
						<form
							onsubmit={(e) => {
								e.preventDefault();
								mintNFT();
							}}
							class="form-grid"
						>
							<label class="full">Land ID<input type="text" bind:value={nftMint.land_id} required /></label>
							<label class="full">Owner Principal<input type="text" bind:value={nftMint.owner_principal} required /></label>
							<button type="submit" class="primary-btn purple" disabled={submitting}>{submitting ? 'Minting…' : 'Mint NFT'}</button>
						</form>
					</section>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.land-registry {
		position: relative;
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

	.land-map {
		position: absolute;
		inset: 0;
	}

	.land-overlay {
		position: absolute;
		left: 0;
		right: 0;
		z-index: 2;
		pointer-events: none;
	}

	.land-overlay > :global(*) {
		pointer-events: auto;
	}

	.land-overlay-top {
		top: 0;
		padding: 1rem 1.25rem 0.75rem;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0));
	}

	.land-overlay-bottom {
		bottom: 0;
		padding: 0.75rem 1.25rem 1rem;
		background: linear-gradient(to top, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0));
	}

	.land-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.land-header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.land-header-copy h2 {
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: #171717;
	}

	.land-header-copy p {
		margin: 0;
		font-size: 0.875rem;
		color: #525252;
	}

	.land-header-desc {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.tab-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.tab-btn {
		padding: 0.4rem 0.85rem;
		border: 1px solid #d4d4d4;
		border-radius: 999px;
		background: #fff;
		font-size: 0.8rem;
		color: #404040;
		cursor: pointer;
	}

	.tab-btn.active {
		background: #171717;
		border-color: #171717;
		color: #fff;
	}

	.legend {
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
		gap: 0.35rem;
	}

	.legend-dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 999px;
	}

	.legend-dot.ring-owned {
		background: #4ade80;
		border: 2px solid #1f2937;
	}

	.legend-dot.ring-available {
		background: #4ade80;
		border: 1px solid #9ca3af;
	}

	.parcel-count {
		color: #737373;
	}

	.legend-spacer {
		flex: 1;
	}

	.ghost-btn {
		padding: 0.45rem 0.85rem;
		border: 1px solid #d4d4d4;
		border-radius: 0.5rem;
		background: #fff;
		font-size: 0.8rem;
		color: #404040;
		cursor: pointer;
	}

	.status-banner,
	.alert {
		margin-bottom: 0.5rem;
		padding: 0.65rem 0.85rem;
		border-radius: 0.5rem;
		font-size: 0.85rem;
	}

	.status-banner {
		background: rgba(250, 250, 250, 0.92);
		color: #737373;
	}

	.alert.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}

	.alert.success {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
	}

	.panel-shell {
		height: 100%;
		min-height: 0;
		overflow: auto;
		padding: 1rem 1.25rem 1.5rem;
		background: #fff;
	}

	.panel-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.panel-head h2,
	.panel-block h3,
	.admin-card h3 {
		margin: 0 0 0.35rem;
		font-size: 1.1rem;
		color: #171717;
	}

	.muted {
		margin: 0;
		color: #737373;
		font-size: 0.875rem;
	}

	.panel-tabs {
		margin-bottom: 1rem;
	}

	.panel-block,
	.admin-card {
		margin-top: 1rem;
		padding: 1rem;
		border: 1px solid #e5e5e5;
		border-radius: 0.75rem;
		background: #fafafa;
	}

	.panel-block-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.table-wrap {
		overflow: auto;
		border: 1px solid #e5e5e5;
		border-radius: 0.5rem;
		background: #fff;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th,
	td {
		padding: 0.75rem 1rem;
		text-align: left;
		border-bottom: 1px solid #f0f0f0;
	}

	th {
		background: #fafafa;
		font-size: 0.75rem;
		text-transform: uppercase;
		color: #737373;
	}

	.badge {
		display: inline-block;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		font-size: 0.75rem;
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.admin-grid {
		display: grid;
		gap: 1rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.form-grid label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #525252;
	}

	.form-grid label.full {
		grid-column: 1 / -1;
	}

	.form-grid input,
	.form-grid select {
		padding: 0.5rem 0.65rem;
		border: 1px solid #d4d4d4;
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}

	.primary-btn {
		grid-column: 1 / -1;
		padding: 0.55rem 1rem;
		border: none;
		border-radius: 0.5rem;
		background: #2563eb;
		color: #fff;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.primary-btn.green {
		background: #16a34a;
	}

	.primary-btn.amber {
		background: #d97706;
	}

	.primary-btn.purple {
		background: #7c3aed;
	}

	.primary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.loading-row,
	.center {
		text-align: center;
		padding: 2rem 0;
	}
</style>
