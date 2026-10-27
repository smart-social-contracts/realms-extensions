<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount, onDestroy, tick } from 'svelte';
	import AccessDenied from '../../../_shared/frontend-rt/AccessDenied.svelte';

	let { ctx }: { ctx: any } = $props();

	type Reply = { ok: boolean; error?: string; [key: string]: any };
	type Parcel = {
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
		land_type: string;
		status: string;
		owner: string;
		owner_kind: string;
		owner_id: string;
		token_id: string;
	};
	type MapZone = { id: string; name: string; kind: string };

	let lands: Parcel[] = $state([]);
	let zones: MapZone[] = $state([]);
	let userNames: Record<string, string> = $state({});
	let loading = $state(true);
	let refreshing = $state(false);
	let error = $state('');
	let accessDeniedOp: string | null = $state(null);
	let success = $state('');
	let expanded = $state(false);
	let sidebarWidth = $state(380);
	let isResizing = $state(false);
	let principal = $state('');

	let selectedLandId = $state('');
	let registerMode = $state(false);
	let registration = $state({
		name: '',
		kind: 'unassigned',
		x: 0,
		y: 0,
		width: 1,
		height: 1,
		owner_type: 'user',
		owner_id: '',
	});

	let mapContainer: HTMLDivElement | undefined = $state();
	let mapReady = $state(false);
	let mapUnavailable = $state(false);
	let map: any = null;
	let maplibregl: any = null;
	let h3: any = null;
	let landPopup: any = null;
	let didFitBounds = false;
	let unsubscribePrincipal: (() => void) | null = null;

	let transfer = $state({ owner_type: 'user', owner_id: '', order: '' });
	let disputeReason = $state('');
	let submitting = $state(false);

	const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
	const SOURCE_ZONES = 'zone-cells';
	const SOURCE_POINTS = 'zone-points';
	const PAGE = 500;
	const MAX_PAGES = 50;
	const MAX_SPAN = 16;
	const ACCESS_REFUSAL = /^\S+ needs (\S+)$/;

	const STATUS_LABELS: Record<string, string> = {
		active: 'Active',
		disputed: 'Disputed',
		transferred: 'Transferred',
		revoked: 'Revoked',
	};

	const LAND_COLORS: Record<string, string> = {
		residential: '#4ade80',
		agricultural: '#fbbf24',
		industrial: '#6b7280',
		commercial: '#3b82f6',
		unassigned: '#e5e7eb',
	};
	const LAND_TYPES = Object.keys(LAND_COLORS);
	const HEX_ZOOM_THRESHOLD = 10;

	let selectedLand = $derived(lands.find((l) => l.id === selectedLandId) ?? null);
	let knownUsers = $derived(Object.entries(userNames));

	function loadScript(src: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (document.querySelector(`script[src="${src}"]`)) {
				resolve();
				return;
			}
			const script = document.createElement('script');
			script.src = src;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Could not fetch ${src}`));
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
			link.onerror = () => reject(new Error(`Could not fetch ${href}`));
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
		if (!res.ok) throw new Error(`Could not fetch h3-js: HTTP ${res.status}`);
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

	function landColor(type: string) {
		return LAND_COLORS[type] || LAND_COLORS.unassigned;
	}

	function escapeHtml(text: unknown) {
		return String(text ?? '').replace(
			/[&<>"']/g,
			(ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] as string
		);
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

	function buildZoneGeoJson() {
		const features: any[] = [];
		if (!h3) return { type: 'FeatureCollection', features };

		for (const zone of zones) {
			try {
				const boundary = h3.cellToBoundary(zone.id, true);
				features.push({
					type: 'Feature',
					properties: {
						zone_id: zone.id,
						color: landColor(zone.kind),
						fillOpacity: 0.5,
						lineColor: '#9ca3af',
						lineWidth: 1,
						zone_json: JSON.stringify(zone),
					},
					geometry: { type: 'Polygon', coordinates: [boundary] },
				});
			} catch {
				/* not an h3 cell */
			}
		}
		return { type: 'FeatureCollection', features };
	}

	function buildPointGeoJson() {
		const features: any[] = [];
		if (!h3) return { type: 'FeatureCollection', features };

		for (const zone of zones) {
			const coords = getLandLatLng(zone.id);
			if (!coords) continue;
			const [lat, lng] = coords;
			features.push({
				type: 'Feature',
				properties: {
					zone_id: zone.id,
					color: landColor(zone.kind),
					strokeColor: '#22c55e',
					radius: 8,
					zone_json: JSON.stringify(zone),
				},
				geometry: { type: 'Point', coordinates: [lng, lat] },
			});
		}
		return { type: 'FeatureCollection', features };
	}

	function fitMapToData(force = false) {
		if (!map || !maplibregl || !h3 || (didFitBounds && !force)) return;
		const bounds = new maplibregl.LngLatBounds();
		let hasBounds = false;
		for (const zone of zones) {
			try {
				for (const [lng, lat] of h3.cellToBoundary(zone.id, true)) {
					bounds.extend([lng, lat]);
					hasBounds = true;
				}
			} catch {
				/* not an h3 cell */
			}
		}
		if (hasBounds) {
			map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: force ? 600 : 0 });
			didFitBounds = true;
		}
	}

	function updateLayerVisibility() {
		if (!map || !mapReady) return;
		const showHex = map.getZoom() >= HEX_ZOOM_THRESHOLD;
		for (const id of ['zones-fill', 'zones-line']) {
			if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', showHex ? 'visible' : 'none');
		}
		if (map.getLayer('zone-points')) {
			map.setLayoutProperty('zone-points', 'visibility', showHex ? 'none' : 'visible');
		}
	}

	function renderMapData() {
		if (!map || !mapReady || !h3) return;
		map.getSource(SOURCE_ZONES)?.setData(buildZoneGeoJson());
		map.getSource(SOURCE_POINTS)?.setData(buildPointGeoJson());
		updateLayerVisibility();
	}

	function selectLand(land: Parcel | null) {
		selectedLandId = land?.id || '';
		transfer = { owner_type: 'user', owner_id: '', order: '' };
		disputeReason = '';
	}

	function zonePopupHtml(zone: MapZone) {
		const color = landColor(zone.kind);
		return `<div style="padding:4px;font-size:13px;line-height:1.45">
			<strong>${escapeHtml(zone.name || 'Zone')}</strong><br>
			Type: <span style="color:${color}">${escapeHtml(zone.kind)}</span><br>
			Not tied to a parcel
			<br><span style="font-size:10px;color:#9ca3af">H3: ${escapeHtml(zone.id)}</span>
		</div>`;
	}

	function onFeatureClick(e: any) {
		const feature = e.features?.[0];
		if (!feature?.properties?.zone_json) return;
		try {
			const zone = JSON.parse(feature.properties.zone_json);
			landPopup?.remove();
			landPopup = new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
				.setLngLat(e.lngLat)
				.setHTML(zonePopupHtml(zone))
				.addTo(map);
		} catch {
			/* ignore */
		}
	}

	function addMapLayers() {
		if (!map) return;

		map.addSource(SOURCE_ZONES, { type: 'geojson', data: buildZoneGeoJson() });
		map.addLayer({ id: 'zones-fill', type: 'fill', source: SOURCE_ZONES, paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['get', 'fillOpacity'] } });
		map.addLayer({ id: 'zones-line', type: 'line', source: SOURCE_ZONES, paint: { 'line-color': ['get', 'lineColor'], 'line-width': ['get', 'lineWidth'] } });

		map.addSource(SOURCE_POINTS, { type: 'geojson', data: buildPointGeoJson() });
		map.addLayer({
			id: 'zone-points',
			type: 'circle',
			source: SOURCE_POINTS,
			paint: {
				'circle-radius': ['get', 'radius'],
				'circle-color': ['get', 'color'],
				'circle-stroke-color': ['get', 'strokeColor'],
				'circle-stroke-width': 2,
			},
		});

		for (const layerId of ['zones-fill', 'zone-points']) {
			map.on('click', layerId, onFeatureClick);
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
		h3 = await loadH3Lib();
		let style: any = STYLE_URL;
		try {
			const res = await fetch(STYLE_URL);
			if (res.ok) style = stripNoisyLayers(await res.json());
		} catch {
			/* fallback */
		}
		map = new maplibregl.Map({ container: mapContainer, style, center: [0, 20], zoom: 2, attributionControl: true });
		// Tile hiccups are not the user's concern; without a listener MapLibre logs them as errors.
		map.on('error', (e: any) => console.warn('land_registry map:', e?.error?.message ?? e));
		map.on('load', () => {
			addMapLayers();
			mapReady = true;
			renderMapData();
			fitMapToData();
			requestAnimationFrame(() => map?.resize());
		});
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

	function toParcel(raw: any): Parcel {
		const owner = String(raw?.owner ?? '');
		const colon = owner.indexOf(':');
		return {
			id: String(raw?.id ?? ''),
			x: Number(raw?.x) || 0,
			y: Number(raw?.y) || 0,
			width: Number(raw?.width) || 1,
			height: Number(raw?.height) || 1,
			land_type: String(raw?.kind || 'unassigned'),
			status: String(raw?.status || 'active'),
			owner,
			owner_kind: colon >= 0 ? owner.slice(0, colon) : '',
			owner_id: colon >= 0 ? owner.slice(colon + 1) : owner,
			token_id: raw?.token_id != null && raw.token_id !== '' ? String(raw.token_id) : '',
		};
	}

	function shortId(id: string) {
		return id.length > 16 ? `${id.slice(0, 5)}…${id.slice(-3)}` : id;
	}

	function ownerLabel(land: Parcel) {
		if (!land.owner) return 'No owner';
		if (land.owner_kind === 'User') return userNames[land.owner_id] || shortId(land.owner_id);
		if (land.owner_kind === 'Organization') return `Org ${land.owner_id}`;
		return land.owner;
	}

	function statusLabel(status: string) {
		return STATUS_LABELS[status] || status;
	}

	function ownerRef(type: string, id: string) {
		return `${type === 'organization' ? 'Organization' : 'User'}:${id}`;
	}

	/** A free spot on the land grid: right of the parcels already on row 0. */
	function nextFreeX() {
		return lands.reduce((most, l) => (l.y < MAX_SPAN && l.y + l.height > 0 ? Math.max(most, l.x + l.width) : most), 0);
	}

	async function loadLands(silent = false) {
		if (!silent) {
			if (lands.length === 0) loading = true;
			else refreshing = true;
		}
		error = '';
		accessDeniedOp = null;
		try {
			const [parcels, mapZones, users] = await Promise.all([
				readPages('land_list', 'lands'),
				readPages('land_map', 'zones'),
				call(false, 'user_list', { from: 1, count: PAGE }),
			]);
			if (parcels.error) {
				const needs = parcels.error.match(ACCESS_REFUSAL);
				if (needs || parcels.error === 'sign in first') accessDeniedOp = needs?.[1] ?? '';
				else error = `Parcels are unavailable right now: ${parcels.error}`;
			}
			lands = parcels.rows.map(toParcel).filter((l) => l.id);
			zones = mapZones.rows
				.filter((z) => z?.id)
				.map((z) => ({ id: String(z.id), name: String(z.name || ''), kind: String(z.kind || 'unassigned') }));
			if (mapZones.error) console.warn('land_map:', mapZones.error);
			if (users.ok) {
				const names: Record<string, string> = {};
				for (const u of users.users ?? []) if (u?.id) names[u.id] = u.nickname || '';
				userNames = names;
			} else console.warn('user_list:', users.error);
			if (selectedLandId && !lands.some((l) => l.id === selectedLandId)) selectedLandId = '';
			if (mapReady) {
				didFitBounds = false;
				renderMapData();
				if (zones.length) fitMapToData(true);
				await tick();
				map?.resize();
			}
		} finally {
			loading = false;
			refreshing = false;
		}
	}

	function startRegister() {
		registerMode = true;
		selectedLandId = '';
		registration = {
			name: '',
			kind: 'unassigned',
			x: nextFreeX(),
			y: 0,
			width: 1,
			height: 1,
			owner_type: 'user',
			owner_id: principal,
		};
	}

	function cancelRegister() {
		registerMode = false;
	}

	/** Run ``name``; a governed call files a proposal instead of acting, which is still a success. */
	async function act(name: string, args: Record<string, unknown>, done: (reply: Reply) => string) {
		submitting = true;
		error = '';
		success = '';
		try {
			const reply = await call(true, name, args);
			if (!reply.ok) {
				error = reply.error || `${name} was refused`;
				return null;
			}
			success = reply.proposal ? `Submitted for a vote as proposal ${reply.proposal}.` : done(reply);
			await loadLands(true);
			return reply;
		} finally {
			submitting = false;
		}
	}

	async function registerParcel() {
		const ownerId = registration.owner_id.trim();
		if (!ownerId) {
			error = 'Choose who owns the new parcel.';
			return;
		}
		const span = (v: unknown) => Math.min(MAX_SPAN, Math.max(1, Math.trunc(Number(v)) || 1));
		const args: Record<string, unknown> = {
			x: Math.trunc(Number(registration.x)) || 0,
			y: Math.trunc(Number(registration.y)) || 0,
			width: span(registration.width),
			height: span(registration.height),
			kind: registration.kind,
			owner: ownerRef(registration.owner_type, ownerId),
		};
		const name = registration.name.trim();
		if (name) args.metadata = { name };
		const reply = await act('land_register', args, (r) => `Parcel ${r.land} registered.`);
		if (!reply) return;
		cancelRegister();
		const created = reply.land ? lands.find((l) => l.id === reply.land) : null;
		if (created) selectLand(created);
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
			} else if (registerMode) {
				cancelRegister();
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

	async function transferParcel() {
		if (!selectedLand) return;
		const to = transfer.owner_id.trim();
		const order = transfer.order.trim();
		if (!to || !order) {
			error = 'Enter the new owner and the court order.';
			return;
		}
		await act(
			'land_transfer',
			{
				land: selectedLand.id,
				to: ownerRef(transfer.owner_type, to),
				order: order.includes(':') ? order : `Verdict:${order}`,
			},
			() => 'Ownership updated!'
		);
	}

	async function freezeParcel() {
		if (!selectedLand) return;
		const args: Record<string, unknown> = { land: selectedLand.id };
		if (disputeReason.trim()) args.reason = disputeReason.trim();
		await act('land_freeze', args, () => 'Parcel marked as disputed.');
		disputeReason = '';
	}

	async function unfreezeParcel() {
		if (!selectedLand) return;
		await act('land_unfreeze', { land: selectedLand.id }, () => 'Dispute ended; the parcel is active again.');
	}

	async function mintNFT() {
		if (!selectedLand) return;
		await act('land_mint_nft', { land: selectedLand.id }, (r) => `NFT minted! Token ID: ${r.token_id}`);
	}

	$effect(() => {
		if (mapReady) {
			zones;
			renderMapData();
		}
	});

	onMount(async () => {
		window.addEventListener('keydown', onWindowKeydown);
		unsubscribePrincipal = ctx.principal?.subscribe?.((value: string) => (principal = value || '')) ?? null;
		await loadLands(false);
		await tick();
		if (mapContainer) {
			try {
				await initMap();
			} catch (e: any) {
				console.warn('land_registry map unavailable:', e?.message ?? e);
				mapUnavailable = true;
			}
		}
	});

	onDestroy(() => {
		window.removeEventListener('keydown', onWindowKeydown);
		unsubscribePrincipal?.();
		document.body.classList.remove('land-registry-expanded');
		document.body.style.overflow = '';
		landPopup?.remove?.();
		map?.remove?.();
		map = null;
		mapReady = false;
	});
</script>

<div class="land-registry" class:expanded class:resizing={isResizing}>
	{#if accessDeniedOp !== null}
		<div class="denied-shell">
			<AccessDenied operation={accessDeniedOp} />
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
				{#if registerMode}
					<button type="button" class="ghost-btn" onclick={cancelRegister}>Cancel</button>
				{:else}
					<button type="button" class="primary-btn" onclick={startRegister}>Register parcel</button>
				{/if}
			</div>

			<datalist id="land-registry-users">
				{#each knownUsers as [id, nickname] (id)}<option value={id}>{nickname || id}</option>{/each}
			</datalist>

			{#if registerMode}
				<form class="draw-panel" onsubmit={(e) => { e.preventDefault(); registerParcel(); }}>
					<p class="muted">Parcels are rectangles on the realm's land grid, up to {MAX_SPAN} × {MAX_SPAN} cells.</p>
					<label>Name (optional)
						<input type="text" bind:value={registration.name} placeholder="Parcel name" />
					</label>
					<label>Type
						<select bind:value={registration.kind}>
							{#each LAND_TYPES as type (type)}<option value={type}>{type}</option>{/each}
						</select>
					</label>
					<div class="grid-fields">
						<label>X<input type="number" step="1" bind:value={registration.x} /></label>
						<label>Y<input type="number" step="1" bind:value={registration.y} /></label>
						<label>Width<input type="number" min="1" max={MAX_SPAN} step="1" bind:value={registration.width} /></label>
						<label>Height<input type="number" min="1" max={MAX_SPAN} step="1" bind:value={registration.height} /></label>
					</div>
					<label>Owner
						<select bind:value={registration.owner_type}>
							<option value="user">Citizen</option>
							<option value="organization">Organization</option>
						</select>
					</label>
					<input
						type="text"
						bind:value={registration.owner_id}
						placeholder={registration.owner_type === 'user' ? 'User ID' : 'Organization ID'}
						list={registration.owner_type === 'user' ? 'land-registry-users' : undefined}
					/>
					<button type="submit" class="primary-btn" disabled={submitting || !registration.owner_id.trim()}>Register parcel</button>
				</form>
			{/if}

			<div class="parcel-list">
				{#if loading}
					<p class="muted center">Loading lands…</p>
				{:else if lands.length === 0}
					<p class="muted center">No parcels yet. Use “Register parcel” to add one.</p>
				{:else}
					{#each lands as land (land.id)}
						<button
							type="button"
							class="parcel-row"
							class:selected={land.id === selectedLandId}
							onclick={() => selectLand(land)}
						>
							<span class="dot" style="background:{landColor(land.land_type)}"></span>
							<span class="parcel-main">
								<strong>{land.id}</strong>
								<span class="muted">{land.land_type} · ({land.x}, {land.y}) · {ownerLabel(land)}</span>
							</span>
							<span class="parcel-status">
								{#if land.status !== 'active'}{statusLabel(land.status)}{:else if land.token_id}NFT{:else}Owned{/if}
							</span>
						</button>
					{/each}
				{/if}
			</div>

			{#if selectedLand && !registerMode}
				<div class="detail-panel">
					<h3>{selectedLand.id}</h3>
					<p class="muted">{selectedLand.land_type} · {statusLabel(selectedLand.status)}</p>
					<code class="h3-code">Grid ({selectedLand.x}, {selectedLand.y}) · {selectedLand.width} × {selectedLand.height}</code>
					<p class="readonly-field">
						<span class="readonly-label">Owner</span>
						<span>{ownerLabel(selectedLand)}</span>
					</p>

					<form class="mini-form" onsubmit={(e) => { e.preventDefault(); transferParcel(); }}>
						<h4>Ownership</h4>
						{#if selectedLand.status === 'active' || selectedLand.status === 'disputed'}
							<select bind:value={transfer.owner_type}>
								<option value="user">Citizen</option>
								<option value="organization">Organization</option>
							</select>
							<input
								type="text"
								bind:value={transfer.owner_id}
								placeholder={transfer.owner_type === 'user' ? 'User ID' : 'Organization ID'}
								list={transfer.owner_type === 'user' ? 'land-registry-users' : undefined}
							/>
							<input type="text" bind:value={transfer.order} placeholder="Court order (Verdict ID)" />
							<p class="muted note">Ownership moves under an issued court verdict about this parcel.</p>
							<button type="submit" class="primary-btn green" disabled={submitting || !transfer.owner_id.trim() || !transfer.order.trim()}>Update ownership</button>
						{:else}
							<p class="muted note">This parcel's ownership is settled.</p>
						{/if}
					</form>

					<form class="mini-form" onsubmit={(e) => { e.preventDefault(); if (selectedLand?.status === 'disputed') unfreezeParcel(); else freezeParcel(); }}>
						<h4>Properties</h4>
						<p class="readonly-field">
							<span class="readonly-label">Type</span>
							<span>{selectedLand.land_type || 'unassigned'}</span>
						</p>
						<p class="readonly-field">
							<span class="readonly-label">Status</span>
							<span>{statusLabel(selectedLand.status)}</span>
						</p>
						{#if selectedLand.status === 'active'}
							<input type="text" bind:value={disputeReason} placeholder="Reason (optional)" />
							<button type="submit" class="primary-btn amber" disabled={submitting}>Mark disputed</button>
						{:else if selectedLand.status === 'disputed'}
							<button type="submit" class="primary-btn amber" disabled={submitting}>End dispute</button>
						{:else}
							<p class="muted note">This status is final.</p>
						{/if}
					</form>

					<form class="mini-form" onsubmit={(e) => { e.preventDefault(); mintNFT(); }}>
						<h4>Mint NFT</h4>
						{#if selectedLand.token_id}
							<p class="readonly-field">
								<span class="readonly-label">Token ID</span>
								<span>{selectedLand.token_id}</span>
							</p>
						{:else if selectedLand.status === 'active'}
							<p class="muted note">The NFT goes to the parcel's owner.</p>
							<button type="submit" class="primary-btn purple" disabled={submitting}>Mint NFT</button>
						{:else}
							<p class="muted note">Only active parcels can be minted.</p>
						{/if}
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
			<div bind:this={mapContainer} class="land-map"></div>
			<div class="map-overlay map-overlay-top">
				{#if mapUnavailable}
					<p class="map-note">The map is not available right now.</p>
				{:else if mapReady && zones.length === 0}
					<p class="map-note">No zones on the map yet.</p>
				{/if}
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

	.grid-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
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

	.note {
		font-size: 0.75rem;
	}

	.map-note {
		margin: 0 auto 0 0;
		align-self: center;
		padding: 0.35rem 0.6rem;
		border-radius: 0.45rem;
		background: rgba(255, 255, 255, 0.9);
		color: #525252;
		font-size: 0.8rem;
	}

	.denied-shell {
		padding: 1.5rem;
	}
</style>
