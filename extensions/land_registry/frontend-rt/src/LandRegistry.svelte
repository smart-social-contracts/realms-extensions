<script lang="ts">
	import { onMount, tick } from 'svelte';

	let { ctx }: { ctx: any } = $props();

	let activeTab = $state<'geographic' | 'table' | 'admin'>('geographic');
	let lands: any[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');
	let success = $state('');

	// Map state
	let mapContainer: HTMLDivElement | undefined = $state();
	let mapInstance: any = $state(null);
	let L: any = null;
	let h3: any = null;
	let landLayer: any = null;
	let circleLayer: any = null;
	let zoneLayer: any = null;

	async function loadScript(url: string, globalName: string): Promise<any> {
		if ((window as any)[globalName]) return (window as any)[globalName];
		const resp = await fetch(url);
		if (!resp.ok) throw new Error(`Failed to load ${url}: HTTP ${resp.status}`);
		const code = await resp.text();
		(0, eval)(code);
		return (window as any)[globalName];
	}

	async function loadLeaflet() {
		if (L) return L;
		if (!document.querySelector('link[data-leaflet-css]')) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			link.setAttribute('data-leaflet-css', '');
			document.head.appendChild(link);
			await new Promise((r) => { link.onload = r; link.onerror = r; });
		}
		L = await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'L');
		return L;
	}

	async function loadH3() {
		if (h3) return h3;
		h3 = await loadScript('https://unpkg.com/h3-js@4.2.1/dist/h3-js.umd.js', 'h3');
		return h3;
	}

	// Table pagination
	let tablePage = $state(0);
	const tablePageSize = 10;
	let tableTotalPages = $derived(Math.ceil(lands.length / tablePageSize));
	let paginatedLands = $derived(lands.slice(tablePage * tablePageSize, (tablePage + 1) * tablePageSize));

	// Admin form state
	let newLand = $state({ x_coordinate: 0, y_coordinate: 0, land_type: 'unassigned', size_width: 1, size_height: 1 });
	let ownership = $state({ land_id: '', owner_user_id: '', owner_organization_id: '', owner_type: 'none' });
	let landUpdate = $state({ land_id: '', land_type: '', status: '' });
	let nftMint = $state({ land_id: '', owner_principal: '' });
	let submitting = $state(false);

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
	const DEFAULT_H3_RESOLUTION = 6;
	const HEX_ZOOM_THRESHOLD = 10;

	function parseMetadata(raw: unknown): Record<string, unknown> | null {
		if (!raw) return null;
		try {
			return typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);
		} catch {
			return null;
		}
	}

	function resolveH3Index(land: any, h3Api: any): string | null {
		const candidates: (string | null | undefined)[] = [
			land.h3_index,
			land.zones?.[0]?.h3_index,
		];
		const meta = parseMetadata(land.metadata);
		if (meta?.parent_zone) candidates.push(String(meta.parent_zone));

		for (const idx of candidates) {
			if (!idx || String(idx).includes('manual')) continue;
			try {
				if (h3Api.isValidCell && !h3Api.isValidCell(idx)) continue;
				h3Api.cellToLatLng(idx);
				return idx;
			} catch {}
		}

		const lat = land.latitude ?? land.zones?.[0]?.latitude;
		const lng = land.longitude ?? land.zones?.[0]?.longitude;
		if (lat == null || lng == null) return null;

		const resolution = Math.round(Number(land.zones?.[0]?.resolution ?? DEFAULT_H3_RESOLUTION));
		try {
			return h3Api.latLngToCell(Number(lat), Number(lng), resolution);
		} catch {
			return null;
		}
	}

	function getLandLatLng(land: any, h3Api: any, h3Index: string | null): [number, number] | null {
		if (land.latitude != null && land.longitude != null) {
			return [Number(land.latitude), Number(land.longitude)];
		}
		if (h3Index && h3Api) {
			try {
				const c = h3Api.cellToLatLng(h3Index);
				return [c[0], c[1]];
			} catch {}
		}
		return null;
	}

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	async function loadLands() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const res = await callExt('get_lands');
			if (res?.success) {
				lands = res.data ?? [];
			} else {
				lands = res?.data ?? (Array.isArray(res) ? res : []);
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
		}
	}

	// ── Map ──

	async function initMap() {
		if (!mapContainer || mapInstance) return;

		try {
			L = await loadLeaflet();
			h3 = await loadH3();

			mapInstance = L.map(mapContainer).setView([20, 0], 2);

		const cartoLayer = L.tileLayer(
			'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
			{ attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>', subdomains: 'abcd', maxZoom: 19 },
		);
		cartoLayer.on('tileerror', () => {
			if (!(mapInstance as any)._fb) {
				(mapInstance as any)._fb = true;
				mapInstance.removeLayer(cartoLayer);
				L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
					maxZoom: 19,
				}).addTo(mapInstance);
			}
		});
		cartoLayer.addTo(mapInstance);

		circleLayer = L.layerGroup().addTo(mapInstance);
		landLayer = L.layerGroup().addTo(mapInstance);
		zoneLayer = L.layerGroup().addTo(mapInstance);

		mapInstance.on('zoomend', updateLayerVisibility);
		updateLayerVisibility();
		renderLands();
		} catch (e: any) {
			error = e?.message ?? String(e);
		}
	}

	function updateLayerVisibility() {
		if (!mapInstance || !circleLayer || !landLayer) return;
		const zoom = mapInstance.getZoom();
		if (zoom < HEX_ZOOM_THRESHOLD) {
			circleLayer.addTo(mapInstance);
			mapInstance.removeLayer(landLayer);
		} else {
			landLayer.addTo(mapInstance);
			mapInstance.removeLayer(circleLayer);
		}
	}

	function renderZonesFromLands() {
		if (!L || !mapInstance || !h3 || !zoneLayer) return;
		zoneLayer.clearLayers();

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
		if (parentZones.size === 0) return;

		const hexData: Record<string, { minDistance: number; landCount: number; landTypes: Record<string, number> }> = {};
		parentZones.forEach((zoneInfo, centerHex) => {
			let disk: string[];
			try { disk = h3.gridDisk(centerHex, INFLUENCE_RINGS); } catch { disk = [centerHex]; }
			for (const hexIdx of disk) {
				let dist: number;
				try { dist = h3.gridDistance(centerHex, hexIdx); } catch { dist = hexIdx === centerHex ? 0 : 1; }
				if (!hexData[hexIdx]) hexData[hexIdx] = { minDistance: dist, landCount: 0, landTypes: {} };
				else hexData[hexIdx].minDistance = Math.min(hexData[hexIdx].minDistance, dist);
				if (dist === 0) {
					hexData[hexIdx].landCount += zoneInfo.landCount;
					hexData[hexIdx].landTypes = zoneInfo.landTypes;
				}
			}
		});

		const allLatLngs: [number, number][] = [];
		for (const [hexIdx, data] of Object.entries(hexData)) {
			try {
				const boundary = h3.cellToBoundary(hexIdx);
				const latLngs: [number, number][] = boundary.map((c: number[]) => [c[0], c[1]] as [number, number]);
				const distOp = 1 - (data.minDistance / (INFLUENCE_RINGS + 1)) * 0.7;
				const baseOp = data.minDistance === 0 ? 0.5 : 0.25;
				const poly = L.polygon(latLngs, {
					color: ZONE_COLOR, fillColor: ZONE_COLOR, fillOpacity: baseOp * distOp,
					weight: data.minDistance === 0 ? 2 : 1, opacity: data.minDistance === 0 ? 0.8 : 0.4,
					dashArray: data.minDistance > 0 ? '4 4' : undefined,
				});
				if (data.minDistance === 0) {
					const typeInfo = Object.entries(data.landTypes).map(([t, c]) => `${t}: ${c}`).join(', ');
					poly.bindPopup(`<div style="padding:4px"><strong>Land Zone</strong><br>Parcels: ${data.landCount}<br>${typeInfo ? `Types: ${typeInfo}<br>` : ''}<span style="font-size:10px;color:#9ca3af">H3: ${hexIdx}</span></div>`);
				}
				poly.addTo(zoneLayer);
				allLatLngs.push(...latLngs);
			} catch {}
		}
		if (allLatLngs.length > 0) {
			mapInstance.fitBounds(L.latLngBounds(allLatLngs), { padding: [50, 50], maxZoom: 12 });
		}
	}

	function renderLands() {
		if (!L || !mapInstance || !landLayer || !circleLayer) return;
		landLayer.clearLayers();
		circleLayer.clearLayers();
		renderZonesFromLands();

		const allLatLngs: [number, number][] = [];
		for (const land of lands) {
			const color = LAND_COLORS[land.land_type] || LAND_COLORS.unassigned;
			const isOwned = land.owner_user_id || land.owner_organization_id;
			const h3Index = h3 ? resolveH3Index(land, h3) : null;
			const coords = h3 ? getLandLatLng(land, h3, h3Index) : null;
			if (!coords) continue;
			const [lat, lng] = coords;
			allLatLngs.push([lat, lng]);

			const priceInfo = land.for_sale && land.price_realm_tokens ? `<br><span style="color:#16a34a;font-weight:600">${land.price_realm_tokens} REALM</span>` : '';
			const ownerInfo = land.owner_user_id ? `<br>Owner: User ${land.owner_user_id}` : land.owner_organization_id ? `<br>Owner: Org ${land.owner_organization_id}` : '<br><span style="color:#2563eb">Available</span>';
			const popup = `<div style="padding:4px"><strong>${land.id}</strong><br>Type: <span style="color:${color}">${land.land_type}</span>${ownerInfo}${priceInfo}${h3Index ? `<br><span style="font-size:10px;color:#9ca3af">H3: ${h3Index}</span>` : ''}</div>`;

			L.circleMarker([lat, lng], { radius: 18, fillColor: color, color: isOwned ? '#1f2937' : '#22c55e', weight: 3, opacity: 1, fillOpacity: 0.85 })
				.bindPopup(popup).addTo(circleLayer);

			if (h3 && h3Index) {
				try {
					const boundary = h3.cellToBoundary(h3Index);
					const latLngs = boundary.map((c: number[]) => [c[0], c[1]]);
					L.polygon(latLngs, { color: isOwned ? '#1f2937' : '#9ca3af', fillColor: color, fillOpacity: isOwned ? 0.7 : 0.5, weight: isOwned ? 2 : 1 })
						.bindPopup(popup).addTo(landLayer);
				} catch {}
			}
		}
		if (allLatLngs.length > 0 && zoneLayer && zoneLayer.getLayers().length === 0) {
			mapInstance.fitBounds(L.latLngBounds(allLatLngs), { padding: [50, 50], maxZoom: 12 });
		}
		updateLayerVisibility();
	}

	// ── Table helpers ──

	function getTypeColor(type: string) {
		const colors: Record<string, string> = {
			residential: 'bg-green-100 text-green-800',
			agricultural: 'bg-yellow-100 text-yellow-800',
			industrial: 'bg-gray-100 text-gray-800',
			commercial: 'bg-blue-100 text-blue-800',
		};
		return colors[type] || 'bg-gray-100 text-gray-600';
	}

	// ── Admin actions ──

	async function createLand() {
		submitting = true; error = ''; success = '';
		try {
			const res = await callExt('create_land', newLand);
			if (res?.success) {
				success = 'Land created successfully!';
				newLand = { x_coordinate: 0, y_coordinate: 0, land_type: 'unassigned', size_width: 1, size_height: 1 };
				await loadLands();
			} else { error = res?.error || 'Failed to create land'; }
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		}
		finally { submitting = false; }
	}

	async function updateOwnership() {
		submitting = true; error = ''; success = '';
		try {
			const data: any = { land_id: ownership.land_id };
			if (ownership.owner_type === 'user') data.owner_user_id = ownership.owner_user_id;
			else if (ownership.owner_type === 'organization') data.owner_organization_id = ownership.owner_organization_id;
			const res = await callExt('update_land_ownership', data);
			if (res?.success) {
				success = 'Ownership updated!';
				ownership = { land_id: '', owner_user_id: '', owner_organization_id: '', owner_type: 'none' };
				await loadLands();
			} else { error = res?.error || 'Failed to update ownership'; }
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		}
		finally { submitting = false; }
	}

	async function updateLandProps() {
		submitting = true; error = ''; success = '';
		try {
			const data: any = { land_id: landUpdate.land_id };
			if (landUpdate.land_type) data.land_type = landUpdate.land_type;
			if (landUpdate.status) data.status = landUpdate.status;
			const res = await callExt('update_land', data);
			if (res?.success) {
				success = res?.data?.message || 'Land updated!';
				landUpdate = { land_id: '', land_type: '', status: '' };
				await loadLands();
			} else { error = res?.error || 'Failed to update land'; }
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		}
		finally { submitting = false; }
	}

	async function mintNFT() {
		submitting = true; error = ''; success = '';
		try {
			const prepRes = await callExt('register_land_nft', {
				land_id: nftMint.land_id,
				owner_principal: nftMint.owner_principal,
				registered_by: ctx.principal || 'admin',
			});
			if (!prepRes?.success) { error = prepRes?.error || 'Failed to prepare NFT'; return; }
			const mintData = prepRes.data;
			const mintRaw = await ctx.backend.mint_land_nft_for_parcel(
				nftMint.land_id, nftMint.owner_principal, BigInt(mintData.token_id), '',
			);
			const mintRes = JSON.parse(mintRaw);
			if (mintRes.success) {
				await callExt('update_land_nft_token', { land_id: nftMint.land_id, nft_token_id: mintRes.token_id });
				success = `NFT minted! Token ID: ${mintRes.token_id}`;
				nftMint = { land_id: '', owner_principal: '' };
				await loadLands();
			} else { error = mintRes.error || 'Mint failed'; }
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		}
		finally { submitting = false; }
	}

	$effect(() => {
		if (activeTab === 'geographic' && lands.length > 0 && mapInstance) {
			renderLands();
		}
	});

	onMount(async () => {
		await loadLands();
		await tick();
		if (mapContainer) await initMap();
	});
</script>

<div class="max-w-5xl mx-auto p-4">
	<!-- Header -->
	<div class="mb-6">
		<h2 class="text-2xl font-bold text-gray-900">Land Registry</h2>
		<p class="text-gray-600 text-sm mt-1">Manage land parcels, ownership, and NFT minting</p>
	</div>

	{#if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error}
		<div class="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
	{/if}
	{#if success}
		<div class="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>
	{/if}

	<!-- Tabs -->
	<div class="border-b border-gray-200 mb-6">
		<nav class="-mb-px flex space-x-8">
			<button
				class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'geographic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				onclick={() => { activeTab = 'geographic'; tick().then(() => { if (mapContainer && !mapInstance) initMap(); else if (mapInstance) { mapInstance.invalidateSize(); renderLands(); } }); }}
			>Map View</button>
			<button
				class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'table' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				onclick={() => activeTab = 'table'}
			>Table View</button>
			<button
				class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'admin' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				onclick={() => activeTab = 'admin'}
			>Admin Controls</button>
		</nav>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
			<span class="ml-3 text-gray-500">Loading lands...</span>
		</div>

	<!-- ═══ MAP TAB ═══ -->
	{:else if activeTab === 'geographic'}
		<div>
			<div class="mb-4">
				<h3 class="text-lg font-semibold mb-2 text-gray-800">Land Registry Map</h3>
				<p class="text-sm text-gray-500 mb-3">Land parcels displayed as H3 hexagonal zones</p>
				<div class="flex flex-wrap gap-4 text-xs">
					{#each Object.entries(LAND_COLORS) as [type, color]}
						<div class="flex items-center gap-1.5">
							<span class="w-3 h-3 rounded" style="background-color:{color}"></span>
							<span class="capitalize text-gray-600">{type}</span>
						</div>
					{/each}
				</div>
			</div>
			<div bind:this={mapContainer} class="w-full rounded-lg border border-gray-300 relative z-0" style="height:500px;min-height:400px"></div>
			<div class="mt-3 flex items-center gap-4 text-xs text-gray-500">
				<div class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded border-2 border-gray-800"></span><span>Owned</span></div>
				<div class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded border border-gray-400"></span><span>Available</span></div>
				<button onclick={loadLands} class="ml-auto px-3 py-1 bg-gray-100 border border-gray-300 rounded text-xs hover:bg-gray-200 transition-colors">Refresh</button>
			</div>
		</div>

	<!-- ═══ TABLE TAB ═══ -->
	{:else if activeTab === 'table'}
		<div>
			<div class="mb-4 flex items-center justify-between">
				<div>
					<h3 class="text-lg font-semibold text-gray-800">Land Registry Table</h3>
					<p class="text-sm text-gray-500">Showing {paginatedLands.length} of {lands.length} parcels</p>
				</div>
				<button onclick={loadLands} class="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-xs hover:bg-gray-200 transition-colors">Refresh</button>
			</div>

			{#if lands.length > 0}
				<div class="overflow-x-auto rounded-lg border border-gray-200">
					<table class="min-w-full">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each paginatedLands as land}
								<tr class="hover:bg-gray-50 transition-colors">
									<td class="px-4 py-3 text-sm font-medium text-gray-900">{land.id}</td>
									<td class="px-4 py-3 text-sm">
										<span class="px-2 py-0.5 rounded-full text-xs font-medium {getTypeColor(land.land_type)}">{land.land_type}</span>
									</td>
									<td class="px-4 py-3 text-sm text-gray-600">
										{#if land.latitude && land.longitude}
											{land.latitude.toFixed(4)}, {land.longitude.toFixed(4)}
										{:else}
											<span class="text-gray-400">-</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-sm text-gray-600">{land.owner_user_id || land.owner_organization_id || '-'}</td>
									<td class="px-4 py-3 text-sm">
										{#if land.for_sale}
											<span class="text-green-600 font-medium">For Sale</span>
										{:else if land.owner_user_id || land.owner_organization_id}
											<span class="text-gray-600">Owned</span>
										{:else}
											<span class="text-blue-600">Available</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-sm">
										{#if land.for_sale && land.price_realm_tokens}
											<span class="text-green-700 font-semibold">{land.price_realm_tokens} REALM</span>
										{:else}
											<span class="text-gray-400">-</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if tableTotalPages > 1}
					<div class="flex justify-center items-center mt-4 gap-2">
						<button
							class="px-3 py-1 rounded border text-sm {tablePage > 0 ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}"
							disabled={tablePage === 0}
							onclick={() => tablePage = Math.max(0, tablePage - 1)}
						>Previous</button>
						<span class="text-sm text-gray-600">Page {tablePage + 1} of {tableTotalPages}</span>
						<button
							class="px-3 py-1 rounded border text-sm {tablePage < tableTotalPages - 1 ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}"
							disabled={tablePage >= tableTotalPages - 1}
							onclick={() => tablePage = Math.min(tableTotalPages - 1, tablePage + 1)}
						>Next</button>
					</div>
				{/if}
			{:else}
				<div class="text-center py-8 text-gray-500">No land parcels registered yet.</div>
			{/if}
		</div>

	<!-- ═══ ADMIN TAB ═══ -->
	{:else if activeTab === 'admin'}
		<div class="space-y-6">
			<div>
				<h3 class="text-lg font-semibold text-gray-800">Admin Controls</h3>
				<p class="text-gray-500 text-sm">Create new land parcels and manage ownership</p>
			</div>

			<!-- Create Land -->
			<div class="bg-white p-6 border border-gray-200 rounded-lg">
				<h4 class="font-semibold mb-4 text-gray-800">Create New Land Parcel</h4>
				<form onsubmit={(e) => { e.preventDefault(); createLand(); }} class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="lr-x" class="block text-sm font-medium text-gray-700 mb-1">X Coordinate</label>
							<input id="lr-x" type="number" bind:value={newLand.x_coordinate} min="0" max="19" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" required />
						</div>
						<div>
							<label for="lr-y" class="block text-sm font-medium text-gray-700 mb-1">Y Coordinate</label>
							<input id="lr-y" type="number" bind:value={newLand.y_coordinate} min="0" max="19" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" required />
						</div>
					</div>
					<div>
						<label for="lr-type" class="block text-sm font-medium text-gray-700 mb-1">Land Type</label>
						<select id="lr-type" bind:value={newLand.land_type} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
							{#each landTypes as type}<option value={type.value}>{type.label}</option>{/each}
						</select>
					</div>
					<button type="submit" disabled={submitting} class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
						{submitting ? 'Creating...' : 'Create Land Parcel'}
					</button>
				</form>
			</div>

			<!-- Update Ownership -->
			<div class="bg-white p-6 border border-gray-200 rounded-lg">
				<h4 class="font-semibold mb-4 text-gray-800">Update Land Ownership</h4>
				<form onsubmit={(e) => { e.preventDefault(); updateOwnership(); }} class="space-y-4">
					<div>
						<label for="own-id" class="block text-sm font-medium text-gray-700 mb-1">Land ID</label>
						<input id="own-id" type="text" bind:value={ownership.land_id} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Enter land ID" required />
					</div>
					<div>
						<label for="own-type" class="block text-sm font-medium text-gray-700 mb-1">Owner Type</label>
						<select id="own-type" bind:value={ownership.owner_type} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
							<option value="none">No Owner</option>
							<option value="user">Citizen</option>
							<option value="organization">Organization</option>
						</select>
					</div>
					{#if ownership.owner_type === 'user'}
						<div>
							<label for="own-uid" class="block text-sm font-medium text-gray-700 mb-1">User ID</label>
							<input id="own-uid" type="text" bind:value={ownership.owner_user_id} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Enter user ID" required />
						</div>
					{:else if ownership.owner_type === 'organization'}
						<div>
							<label for="own-oid" class="block text-sm font-medium text-gray-700 mb-1">Organization ID</label>
							<input id="own-oid" type="text" bind:value={ownership.owner_organization_id} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Enter organization ID" required />
						</div>
					{/if}
					<button type="submit" disabled={submitting} class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
						{submitting ? 'Updating...' : 'Update Ownership'}
					</button>
				</form>
			</div>

			<!-- Update Land Properties -->
			<div class="bg-white p-6 border border-gray-200 rounded-lg">
				<h4 class="font-semibold mb-4 text-gray-800">Update Land Properties</h4>
				<form onsubmit={(e) => { e.preventDefault(); updateLandProps(); }} class="space-y-4">
					<div>
						<label for="upd-id" class="block text-sm font-medium text-gray-700 mb-1">Land ID</label>
						<input id="upd-id" type="text" bind:value={landUpdate.land_id} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Enter land ID" required />
					</div>
					<div>
						<label for="upd-type" class="block text-sm font-medium text-gray-700 mb-1">Land Type (optional)</label>
						<select id="upd-type" bind:value={landUpdate.land_type} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
							<option value="">-- No change --</option>
							{#each landTypes as type}<option value={type.value}>{type.label}</option>{/each}
						</select>
					</div>
					<div>
						<label for="upd-status" class="block text-sm font-medium text-gray-700 mb-1">Status (optional)</label>
						<select id="upd-status" bind:value={landUpdate.status} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
							<option value="">-- No change --</option>
							{#each landStatuses as s}<option value={s.value}>{s.label}</option>{/each}
						</select>
					</div>
					<button type="submit" disabled={submitting} class="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
						{submitting ? 'Updating...' : 'Update Land'}
					</button>
				</form>
			</div>

			<!-- Mint NFT -->
			<div class="bg-white p-6 border border-gray-200 rounded-lg">
				<h4 class="font-semibold mb-2 text-gray-800">Mint Land NFT</h4>
				<p class="text-sm text-gray-500 mb-4">Register a land parcel and mint an NFT representing ownership</p>
				<form onsubmit={(e) => { e.preventDefault(); mintNFT(); }} class="space-y-4">
					<div>
						<label for="nft-lid" class="block text-sm font-medium text-gray-700 mb-1">Land ID</label>
						<input id="nft-lid" type="text" bind:value={nftMint.land_id} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Enter land ID to mint NFT for" required />
					</div>
					<div>
						<label for="nft-own" class="block text-sm font-medium text-gray-700 mb-1">Owner Principal</label>
						<input id="nft-own" type="text" bind:value={nftMint.owner_principal} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Principal ID of the NFT owner" required />
					</div>
					<button type="submit" disabled={submitting} class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
						{submitting ? 'Minting...' : 'Mint NFT'}
					</button>
				</form>
			</div>
		</div>
	{/if}
</div>
