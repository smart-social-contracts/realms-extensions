<script lang="ts">
	import { onMount, tick } from 'svelte';

	let { ctx }: { ctx: any } = $props();

	let statusData: any = $state(null);
	let realmData: any = $state(null);
	let lifecycleData: any = $state({});
	let lifecycleStageIndex = $state(0);
	let dashboardConfig: any = $state({});
	let departments: string[] = $state([]);
	let now = $state(Date.now());
	let zones: any[] = $state([]);
	let latestUsers: any[] = $state([]);
	let loading = $state(true);
	let mapContainer: HTMLDivElement | undefined = $state();

	const STAGES = ['alpha', 'beta', 'production', 'deprecation', 'terminated'] as const;
	const STAGE_LABELS: Record<string, string> = {
		alpha: 'Alpha',
		beta: 'Beta',
		production: 'Live',
		deprecation: 'Winding Down',
		terminated: 'Archived',
	};
	const STAGE_DESCRIPTIONS: Record<string, string> = {
		alpha: 'Gathering founding members. Deposits are refundable while the community grows.',
		beta: 'Critical mass reached. Infrastructure, land, and service providers are being prepared.',
		production: 'Fully operational. Governance, services, and community life are active.',
		deprecation: 'This realm is winding down. New members cannot join.',
		terminated: 'This realm has closed. Records remain available as a read-only archive.',
	};
	const STAGE_THEMES: Record<string, { bg: string; border: string; accent: string; dot: string; text: string }> = {
		alpha: { bg: '#eff6ff', border: '#bfdbfe', accent: '#2563eb', dot: '#3b82f6', text: '#1e40af' },
		beta: { bg: '#fffbeb', border: '#fde68a', accent: '#d97706', dot: '#f59e0b', text: '#92400e' },
		production: { bg: '#ecfdf5', border: '#a7f3d0', accent: '#059669', dot: '#10b981', text: '#065f46' },
		deprecation: { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c', dot: '#f97316', text: '#9a3412' },
		terminated: { bg: '#f9fafb', border: '#e5e7eb', accent: '#6b7280', dot: '#9ca3af', text: '#374151' },
	};

	function parseEntities(response: any): any[] {
		if (response?.success && response?.data?.objectsListPaginated) {
			return (response.data.objectsListPaginated.objects || []).map((s: string) => JSON.parse(s));
		}
		return [];
	}

	async function loadData() {
		loading = true;
		const backend = ctx.backend;

		const [statusResp, realmResp, zonesResp, latestResp] = await Promise.all([
			backend.status().catch((e: any) => { console.warn('status() failed:', e); return null; }),
			backend.get_objects_paginated('Realm', 0, 1, 'asc').catch((e: any) => { console.warn('Realm fetch failed:', e); return null; }),
			backend.get_objects_paginated('Zone', 0, 200, 'asc').catch((e: any) => { console.warn('Zone fetch failed:', e); return null; }),
			backend.get_objects_paginated('User', 0, 50, 'desc').catch((e: any) => { console.warn('User fetch failed:', e); return null; }),
		]);

		if (statusResp?.success && statusResp?.data?.status) {
			statusData = statusResp.data.status;
		}

		const realms = parseEntities(realmResp);
		if (realms.length > 0) {
			realmData = realms[0];
		}

		const allZones = parseEntities(zonesResp);
		zones = allZones.filter((z: any) => z.h3_index || (z.latitude && z.longitude));
		latestUsers = parseEntities(latestResp);

		await loadLifecycleData(backend);

		loading = false;
	}

	function parseExtensionResponse(raw: any) {
		const envelope = typeof raw === 'string' ? JSON.parse(raw) : raw;
		return envelope?.response
			? typeof envelope.response === 'string'
				? JSON.parse(envelope.response)
				: envelope.response
			: envelope;
	}

	async function loadLifecycleData(backend: any) {
		try {
			const raw = await backend.extension_sync_call('realm_settings', 'get_realm_stage', '{}');
			const res = parseExtensionResponse(raw);
			if (res?.success && res?.data) {
				lifecycleData = res.data.lifecycle || {};
				lifecycleStageIndex = res.data.stage_index ?? Math.max(0, STAGES.indexOf(res.data.stage || 'alpha'));
				dashboardConfig = res.data.dashboard || {};
				departments = res.data.departments || [];
				return;
			}
		} catch (e) {
			console.warn('get_realm_stage failed, using status fallback:', e);
		}

		const stage = statusData?.realm_stage || realmData?.status || 'alpha';
		lifecycleStageIndex = Math.max(0, STAGES.indexOf(stage));
		lifecycleData = {
			critical_mass: 10000,
			registered_users: Number(statusData?.users_count || 0),
			deposits_locked: stage !== 'alpha',
			land_acquired: ['production', 'deprecation', 'terminated'].includes(stage),
			infrastructure_ready: ['production', 'deprecation', 'terminated'].includes(stage),
			providers_ready: ['production', 'deprecation', 'terminated'].includes(stage),
			history: [],
		};
	}

	const INFLUENCE_RINGS = 3;

	async function loadScript(url: string, globalName: string): Promise<any> {
		if ((window as any)[globalName]) return (window as any)[globalName];
		const resp = await fetch(url);
		const code = await resp.text();
		(0, eval)(code);
		return (window as any)[globalName];
	}

	async function initMap() {
		if (!mapContainer || zones.length === 0) return;

		if (!document.querySelector('link[href*="leaflet"]')) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			document.head.appendChild(link);
			await new Promise((r) => { link.onload = r; link.onerror = r; });
		}

		const L = await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'L');
		const h3 = await loadScript('https://unpkg.com/h3-js@4.2.1/dist/h3-js.umd.js', 'h3');
		const { cellToBoundary, gridDisk } = h3;

		const map = L.map(mapContainer).setView([20, 0], 2);

		const cartoLayer = L.tileLayer(
			'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
			{
				attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
				subdomains: 'abcd',
				maxZoom: 19,
			},
		);
		cartoLayer.on('tileerror', function () {
			if (!(map as any)._fallbackTiles) {
				(map as any)._fallbackTiles = true;
				map.removeLayer(cartoLayer);
				L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
					maxZoom: 19,
				}).addTo(map);
			}
		});
		cartoLayer.addTo(map);

		const allLatLngs: [number, number][] = [];
		const renderedHexes = new Set<string>();

		for (const zone of zones) {
			if (zone.h3_index) {
				try {
					const disk = gridDisk(zone.h3_index, INFLUENCE_RINGS);
					for (const hexIndex of disk) {
						if (renderedHexes.has(hexIndex)) continue;
						renderedHexes.add(hexIndex);

						const boundary = cellToBoundary(hexIndex);
						const latLngs: [number, number][] = boundary.map(
							(c: number[]) => [c[0], c[1]] as [number, number],
						);

						const isCenter = hexIndex === zone.h3_index;
						const opacity = isCenter ? 0.45 : 0.15;
						const weight = isCenter ? 2 : 0.8;

						L.polygon(latLngs, {
							color: '#4338ca',
							weight,
							fillColor: '#6366f1',
							fillOpacity: opacity,
						}).addTo(map);

						if (isCenter) {
							latLngs.forEach((c) => allLatLngs.push(c));
						}
					}
				} catch {
					if (zone.latitude && zone.longitude) {
						allLatLngs.push([Number(zone.latitude), Number(zone.longitude)]);
					}
				}
			}

			if (zone.latitude && zone.longitude) {
				const lat = Number(zone.latitude);
				const lng = Number(zone.longitude);
				L.circleMarker([lat, lng], {
					radius: 14,
					fillColor: '#6366f1',
					color: '#6366f1',
					weight: 0,
					fillOpacity: 0.25,
				}).addTo(map);
				const marker = L.circleMarker([lat, lng], {
					radius: 8,
					fillColor: '#6366f1',
					color: '#fff',
					weight: 2,
					fillOpacity: 0.9,
				}).addTo(map);

				const name = zone.name || zone.h3_index || '';
				const desc = zone.description || '';
				marker.bindPopup(`<strong>${name}</strong>${desc ? '<br/>' + desc : ''}`);

				if (!allLatLngs.some((c) => c[0] === lat && c[1] === lng)) {
					allLatLngs.push([lat, lng]);
				}
			}
		}

		if (allLatLngs.length > 0) {
			map.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40], maxZoom: 5 });
		}
	}

	let kpiCards = $derived(
		statusData
			? [
					{ label: 'Users', value: Number(statusData.users_count), color: '#3b82f6', icon: 'users' },
					{ label: 'Organizations', value: Number(statusData.organizations_count), color: '#8b5cf6', icon: 'org' },
					{ label: 'Proposals', value: Number(statusData.proposals_count), color: '#f59e0b', icon: 'proposal' },
					{ label: 'Votes', value: Number(statusData.votes_count), color: '#10b981', icon: 'vote' },
					{ label: 'Transfers', value: Number(statusData.transfers_count), color: '#f43f5e', icon: 'transfer' },
					{ label: 'Zones', value: zones.length, color: '#06b6d4', icon: 'zone' },
				]
			: [],
	);

	let realmStage = $derived(statusData?.realm_stage || realmData?.status || 'alpha');
	let stageTheme = $derived(STAGE_THEMES[realmStage] || STAGE_THEMES.alpha);
	let stageLabel = $derived(STAGE_LABELS[realmStage] || realmStage);
	let stageDescription = $derived(STAGE_DESCRIPTIONS[realmStage] || '');
	let stageProgressPct = $derived(
		lifecycleData.critical_mass
			? Math.min(100, Math.round((Number(lifecycleData.registered_users || statusData?.users_count || 0) / lifecycleData.critical_mass) * 100))
			: 0,
	);
	let registrationOpen = $derived(Boolean(statusData?.open_registration ?? realmData?.open_registration));
	let quarterCount = $derived(statusData?.quarters?.length || 0);

	let dashboardSections: string[] = $derived(dashboardConfig?.public?.sections || []);
	let goLiveRemaining = $derived.by(() => {
		const target = lifecycleData.go_live_target ? new Date(lifecycleData.go_live_target).getTime() : NaN;
		const diff = target - now;
		if (!Number.isFinite(target) || diff <= 0) return null;
		return {
			days: Math.floor(diff / 86400000),
			hours: Math.floor((diff % 86400000) / 3600000),
			minutes: Math.floor((diff % 3600000) / 60000),
			seconds: Math.floor((diff % 60000) / 1000),
		};
	});

	let kpiVisible = $state(false);
	let animatedValues: number[] = $state([]);

	function animateCountUp() {
		if (kpiCards.length === 0) return;
		animatedValues = kpiCards.map(() => 0);
		kpiVisible = true;
		const duration = 1200;
		const fps = 60;
		const totalFrames = Math.round(duration / (1000 / fps));
		let frame = 0;

		function step() {
			frame++;
			const progress = frame / totalFrames;
			const ease = 1 - Math.pow(1 - progress, 3);
			animatedValues = kpiCards.map((card) => Math.round(card.value * ease));
			if (frame < totalFrames) requestAnimationFrame(step);
		}
		requestAnimationFrame(step);
	}

	let showOverlay = $state(false);

	function fullBleed(node: HTMLElement) {
		function adjust() {
			node.style.marginLeft = '';
			node.style.marginRight = '';
			node.style.width = '';
			const rect = node.getBoundingClientRect();
			const left = rect.left;
			const right = window.innerWidth - rect.right;
			node.style.marginLeft = `-${left}px`;
			node.style.marginRight = `-${right}px`;
			node.style.width = `100vw`;
		}
		adjust();
		window.addEventListener('resize', adjust);
		return { destroy() { window.removeEventListener('resize', adjust); } };
	}

	onMount(async () => {
		await loadData();
		await tick();
		await initMap();
		setTimeout(() => { showOverlay = true; }, 2000);
		setTimeout(() => { animateCountUp(); }, 2800);
	});

	$effect(() => {
		const id = setInterval(() => { now = Date.now(); }, 1000);
		return () => clearInterval(id);
	});
</script>


<div>
	{#if loading}
		<div class="flex items-center justify-center py-12 mt-20">
			<svg
				class="animate-spin h-8 w-8 text-gray-400"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			<span class="ml-3 text-gray-500">Loading dashboard...</span>
		</div>
	{:else}
		<!-- Hero: full-viewport background image with content inside -->
		{#if realmData}
			<div
				use:fullBleed
				class="hero-screen"
				style="background-image: url('/custom/background.png');"
			>
				<div
					class="hero-gradient"
					style="opacity: {showOverlay ? 1 : 0};"
				></div>

				<div
					class="hero-bottom-zone"
					style="opacity: {showOverlay ? 1 : 0}; transform: translateY({showOverlay ? '0px' : '24px'});"
				>
					<div class="hero-identity">
						<div class="hero-brand-row">
							<img
								src="/custom/logo.png"
								alt={realmData.name || 'Realm'}
								class="hero-logo"
								onerror={(e) => { e.currentTarget.src = '/images/logo_sphere_only.svg'; }}
							/>
							<h1 class="hero-title">{realmData.name || 'Realm'}</h1>
						</div>
						{#if realmData.welcome_message}
							<p class="hero-welcome">{realmData.welcome_message}</p>
						{/if}
					</div>

					<div class="hero-chevron">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M6 9l6 6 6-6" />
						</svg>
					</div>
				</div>
			</div>

		<style>
			@keyframes bounceDown {
				0%, 100% { transform: translateY(0); }
				50% { transform: translateY(8px); }
			}
			.hero-screen {
				height: 100vh;
				min-height: 520px;
				background: center / cover no-repeat;
				position: relative;
				margin-top: -6rem;
				padding-top: 6rem;
				overflow: hidden;
			}
			.hero-gradient {
				position: absolute;
				left: 0;
				right: 0;
				bottom: 0;
				/* Fade begins ~33% from bottom; solid white fills the branding band below */
				height: 40%;
				background: linear-gradient(
					to top,
					#ffffff 0%,
					#ffffff 90%,
					rgba(255, 255, 255, 0.7) 96%,
					transparent 100%
				);
				pointer-events: none;
				transition: opacity 3s cubic-bezier(0.25, 0.1, 0.25, 1);
			}
			.hero-bottom-zone {
				position: absolute;
				left: 0;
				right: 0;
				bottom: 0;
				height: 32%;
				min-height: 200px;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				padding: 0 24px 28px;
				z-index: 2;
				transition: opacity 2.5s cubic-bezier(0.25, 0.1, 0.25, 1) 0.5s,
					transform 3s cubic-bezier(0.16, 1, 0.3, 1) 0.5s;
			}
			.hero-identity {
				width: 100%;
				max-width: 720px;
				text-align: center;
			}
			.hero-brand-row {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 14px;
				margin-bottom: 10px;
			}
			.hero-logo {
				width: clamp(40px, 7vw, 52px);
				height: clamp(40px, 7vw, 52px);
				object-fit: contain;
				flex-shrink: 0;
			}
			.hero-title {
				font-size: clamp(1.75rem, 5vw, 2.35rem);
				font-weight: 700;
				color: #111827;
				margin: 0;
				line-height: 1.15;
			}
			.hero-welcome {
				font-size: clamp(0.95rem, 2.8vw, 1.05rem);
				color: #374151;
				font-style: italic;
				margin: 0 auto;
				max-width: 540px;
				line-height: 1.55;
			}
			.hero-chevron {
				margin-top: 18px;
				color: #111827;
				opacity: 0.7;
			}
			.hero-chevron svg {
				width: 28px;
				height: 28px;
				animation: bounceDown 2s ease-in-out infinite;
			}
			.join-btn {
				display: inline-flex;
				align-items: center;
				gap: 10px;
				padding: 16px 48px;
				border-radius: 12px;
				background: #111827;
				color: #fff;
				font-size: 1.15rem;
				font-weight: 600;
				text-decoration: none;
				box-shadow: 0 4px 14px rgba(0,0,0,0.15);
				transition: background 0.2s, transform 0.2s;
				letter-spacing: 0.02em;
			}
			.join-btn:hover {
				background: #000;
				transform: translateY(-1px);
			}
			.kpi-card {
				background: #fff;
				border-radius: 12px;
				padding: 16px 18px;
				box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
				transition: box-shadow 0.2s ease, transform 0.2s ease;
			}
			.kpi-card:hover {
				box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06);
				transform: translateY(-2px);
			}
			.kpi-header {
				display: flex;
				align-items: center;
				gap: 8px;
				margin-bottom: 8px;
			}
			.kpi-icon {
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
			}
			.kpi-label {
				font-size: 0.8rem;
				font-weight: 500;
				color: #6b7280;
				letter-spacing: 0.01em;
			}
			.kpi-value {
				font-size: 1.85rem;
				font-weight: 700;
				color: #111827;
				margin: 0;
				line-height: 1.1;
				font-variant-numeric: tabular-nums;
			}
			.realm-status-card {
				background: #fff;
				border-radius: 16px;
				padding: 28px;
				box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05);
				border: 1px solid #e5e7eb;
			}
			.realm-status-header {
				display: flex;
				align-items: flex-start;
				justify-content: space-between;
				gap: 16px;
				margin-bottom: 24px;
				flex-wrap: wrap;
			}
			.realm-status-badge {
				display: inline-flex;
				align-items: center;
				gap: 8px;
				padding: 8px 14px;
				border-radius: 999px;
				font-size: 0.85rem;
				font-weight: 600;
				border: 1px solid;
			}
			.realm-status-dot {
				width: 8px;
				height: 8px;
				border-radius: 999px;
				flex-shrink: 0;
			}
			.realm-stage-track {
				position: relative;
				margin-bottom: 24px;
			}
			.realm-stage-line {
				position: absolute;
				top: 18px;
				left: 8%;
				right: 8%;
				height: 2px;
				background: #e5e7eb;
				z-index: 0;
			}
			.realm-stage-line-fill {
				position: absolute;
				top: 18px;
				left: 8%;
				height: 2px;
				background: #10b981;
				z-index: 0;
				transition: width 0.5s ease;
			}
			.realm-stage-steps {
				display: flex;
				justify-content: space-between;
				position: relative;
				z-index: 1;
			}
			.realm-stage-step {
				display: flex;
				flex-direction: column;
				align-items: center;
				flex: 1;
				min-width: 0;
			}
			.realm-stage-circle {
				width: 36px;
				height: 36px;
				border-radius: 999px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 0.75rem;
				font-weight: 700;
				border: 2px solid;
			}
			.realm-status-metrics {
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 12px;
			}
			@media (min-width: 768px) {
				.realm-status-metrics {
					grid-template-columns: repeat(4, minmax(0, 1fr));
				}
			}
			.realm-status-metric {
				background: #f9fafb;
				border: 1px solid #f3f4f6;
				border-radius: 12px;
				padding: 14px 16px;
			}
			.realm-status-metric-label {
				font-size: 0.75rem;
				color: #6b7280;
				margin-bottom: 4px;
			}
			.realm-status-metric-value {
				font-size: 1.05rem;
				font-weight: 700;
				color: #111827;
			}
			.realm-progress-bar {
				height: 8px;
				border-radius: 999px;
				background: #e5e7eb;
				overflow: hidden;
				margin-top: 8px;
			}
			.realm-progress-fill {
				height: 100%;
				border-radius: 999px;
				transition: width 0.8s ease;
			}
			.realm-checklist {
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 10px;
				margin-top: 16px;
			}
			@media (min-width: 768px) {
				.realm-checklist {
					grid-template-columns: repeat(4, minmax(0, 1fr));
				}
			}
			.realm-check-item {
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 10px 12px;
				border-radius: 10px;
				border: 1px solid #f3f4f6;
				background: #fafafa;
				font-size: 0.82rem;
				color: #374151;
			}
		</style>

			<!-- Manifesto -->
			{#if realmData.manifesto}
				<div style="max-width: 700px; margin: 0 auto; padding: 2.5rem 24px 0;">
					<p style="font-size: 1.1rem; color: #374151; line-height: 1.8; text-align: center;">
						{realmData.manifesto}
					</p>
				</div>
			{/if}

			<!-- Join button -->
			<div style="display: flex; justify-content: center; padding: 2.5rem 0;">
				<a
					href="/join"
					class="join-btn"
				>
					Join this Realm
					<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</a>
			</div>

			<!-- Codex-driven dashboard blocks -->
			{#if dashboardSections.length > 0}
				{@const registered = Number(lifecycleData.registered_users ?? statusData?.users_count ?? 0)}
				<div class="max-w-5xl mx-auto px-4 pb-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#if dashboardSections.includes('migration_progress')}
							{@const target = Number(lifecycleData.population_target || lifecycleData.critical_mass || 0)}
							{@const pct = target > 0 ? Math.min(100, Math.round((registered / target) * 100)) : 0}
							<div class="bg-white rounded-lg border border-gray-200 shadow p-6">
								<div class="text-sm font-medium text-gray-500 mb-2">{dashboardConfig.public?.migration_progress?.label || 'Population migrated'}</div>
								<div class="text-3xl font-bold text-gray-900">{pct}%</div>
								<div class="realm-progress-bar">
									<div class="realm-progress-fill" style="width: {pct}%; background: #10b981;"></div>
								</div>
								<div class="text-sm text-gray-500 mt-2">{registered.toLocaleString()} of {target.toLocaleString()} migrated</div>
							</div>
						{/if}

						{#if dashboardSections.includes('departments') && departments.length > 0}
							<div class="bg-white rounded-lg border border-gray-200 shadow p-6">
								<div class="text-sm font-medium text-gray-500 mb-2">Departments</div>
								<div class="text-3xl font-bold text-gray-900 mb-3">{departments.length}</div>
								<div class="flex flex-wrap gap-2">
									{#each departments as dept (dept)}
										<span class="inline-block px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">{dept}</span>
									{/each}
								</div>
							</div>
						{/if}

						{#if dashboardSections.includes('countdown')}
							<div class="bg-white rounded-lg border border-gray-200 shadow p-6">
								<div class="text-sm font-medium text-gray-500 mb-2">{dashboardConfig.public?.countdown?.label || 'Time to go-live'}</div>
								{#if goLiveRemaining}
									<div class="text-3xl font-bold text-gray-900" style="font-variant-numeric: tabular-nums;">
										{goLiveRemaining.days}d {goLiveRemaining.hours}h {goLiveRemaining.minutes}m {goLiveRemaining.seconds}s
									</div>
								{:else}
									<div class="text-3xl font-bold text-green-600">Live</div>
								{/if}
							</div>
						{/if}

						{#if dashboardSections.includes('citizen_counter')}
							<div class="bg-white rounded-lg border border-gray-200 shadow p-6">
								<div class="text-sm font-medium text-gray-500 mb-2">{dashboardConfig.public?.citizen_counter?.label || 'Citizens onboarded'}</div>
								<div class="text-3xl font-bold text-gray-900">{Number(statusData?.users_count ?? lifecycleData.registered_users ?? 0).toLocaleString()}</div>
							</div>
						{/if}

						{#if dashboardSections.includes('threshold')}
							{@const mass = Number(lifecycleData.critical_mass || 0)}
							{@const pct = mass > 0 ? Math.min(100, Math.round((registered / mass) * 100)) : 0}
							<div class="bg-white rounded-lg border border-gray-200 shadow p-6">
								<div class="text-sm font-medium text-gray-500 mb-2">{dashboardConfig.public?.threshold?.label || 'Critical mass'}</div>
								<div class="text-3xl font-bold text-gray-900">{pct}%</div>
								<div class="realm-progress-bar">
									<div class="realm-progress-fill" style="width: {pct}%; background: #2563eb;"></div>
								</div>
								<div class="text-sm text-gray-500 mt-2">{registered.toLocaleString()} / {mass.toLocaleString()}</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Realm lifecycle status -->
			{#if statusData}
				<div class="px-4 pb-8">
					<div class="realm-status-card max-w-5xl mx-auto">
						<div class="realm-status-header">
							<div style="flex: 1; min-width: 240px;">
								<p style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; margin: 0 0 8px;">Realm Status</p>
								<h2 style="font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0 0 8px;">{stageLabel} Phase</h2>
								<p style="font-size: 0.95rem; color: #4b5563; line-height: 1.6; margin: 0; max-width: 640px;">{stageDescription}</p>
							</div>
							<span
								class="realm-status-badge"
								style="background: {stageTheme.bg}; border-color: {stageTheme.border}; color: {stageTheme.text};"
							>
								<span class="realm-status-dot" style="background: {stageTheme.dot};"></span>
								Currently {stageLabel}
							</span>
						</div>

						<div class="realm-stage-track">
							<div class="realm-stage-line"></div>
							<div
								class="realm-stage-line-fill"
								style="width: {lifecycleStageIndex / (STAGES.length - 1) * 84}%;"
							></div>
							<div class="realm-stage-steps">
								{#each STAGES as stage, i}
									{@const isCurrent = i === lifecycleStageIndex}
									{@const isPast = i < lifecycleStageIndex}
									<div class="realm-stage-step">
										<div
											class="realm-stage-circle"
											style="
												background: {isCurrent ? stageTheme.accent : isPast ? '#10b981' : '#f3f4f6'};
												border-color: {isCurrent ? stageTheme.accent : isPast ? '#10b981' : '#d1d5db'};
												color: {isCurrent || isPast ? '#fff' : '#9ca3af'};
											"
										>
											{#if isPast}
												<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
											{:else}
												{i + 1}
											{/if}
										</div>
										<span
											style="font-size: 0.72rem; font-weight: {isCurrent ? '700' : '500'}; margin-top: 8px; text-align: center; color: {isCurrent ? stageTheme.text : isPast ? '#059669' : '#9ca3af'};"
										>
											{STAGE_LABELS[stage]}
										</span>
									</div>
								{/each}
							</div>
						</div>

						<div class="realm-status-metrics">
							<div class="realm-status-metric">
								<div class="realm-status-metric-label">Registration</div>
								<div class="realm-status-metric-value" style="color: {registrationOpen ? '#059669' : '#dc2626'};">
									{registrationOpen ? 'Open' : 'Closed'}
								</div>
							</div>
							<div class="realm-status-metric">
								<div class="realm-status-metric-label">Members</div>
								<div class="realm-status-metric-value">
									{Number(lifecycleData.registered_users ?? statusData.users_count ?? 0).toLocaleString()}
								</div>
							</div>
							<div class="realm-status-metric">
								<div class="realm-status-metric-label">Governance Activity</div>
								<div class="realm-status-metric-value">
									{Number(statusData.proposals_count ?? 0).toLocaleString()} proposals · {Number(statusData.votes_count ?? 0).toLocaleString()} votes
								</div>
							</div>
							<div class="realm-status-metric">
								<div class="realm-status-metric-label">{quarterCount === 1 && statusData.quarters?.[0]?.is_capital ? 'Capital Quarter' : 'Quarters'}</div>
								<div class="realm-status-metric-value">
									{quarterCount > 0 ? quarterCount : 'Single realm'}
								</div>
							</div>
						</div>

						{#if realmStage === 'alpha' || realmStage === 'beta'}
							<div style="margin-top: 20px; padding: 16px; border-radius: 12px; background: {stageTheme.bg}; border: 1px solid {stageTheme.border};">
								<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap;">
									<div>
										<div style="font-size: 0.8rem; font-weight: 600; color: {stageTheme.text};">Path to next phase</div>
										<div style="font-size: 0.85rem; color: #4b5563; margin-top: 4px;">
											{Number(lifecycleData.registered_users ?? statusData.users_count ?? 0).toLocaleString()} of {Number(lifecycleData.critical_mass ?? 10000).toLocaleString()} members toward critical mass
										</div>
									</div>
									<div style="font-size: 1.25rem; font-weight: 700; color: {stageTheme.accent};">{stageProgressPct}%</div>
								</div>
								<div class="realm-progress-bar">
									<div class="realm-progress-fill" style="width: {stageProgressPct}%; background: {stageTheme.accent};"></div>
								</div>
							</div>
						{/if}

						{#if realmStage === 'beta' || realmStage === 'production'}
							<div class="realm-checklist">
								<div class="realm-check-item">
									<span style="color: {lifecycleData.deposits_locked ? '#059669' : '#9ca3af'};">{lifecycleData.deposits_locked ? '✓' : '○'}</span>
									Deposits {lifecycleData.deposits_locked ? 'locked' : 'refundable'}
								</div>
								<div class="realm-check-item">
									<span style="color: {lifecycleData.land_acquired ? '#059669' : '#9ca3af'};">{lifecycleData.land_acquired ? '✓' : '○'}</span>
									Land {lifecycleData.land_acquired ? 'secured' : 'pending'}
								</div>
								<div class="realm-check-item">
									<span style="color: {lifecycleData.infrastructure_ready ? '#059669' : '#9ca3af'};">{lifecycleData.infrastructure_ready ? '✓' : '○'}</span>
									Infrastructure {lifecycleData.infrastructure_ready ? 'ready' : 'in progress'}
								</div>
								<div class="realm-check-item">
									<span style="color: {lifecycleData.providers_ready ? '#059669' : '#9ca3af'};">{lifecycleData.providers_ready ? '✓' : '○'}</span>
									Providers {lifecycleData.providers_ready ? 'ready' : 'pending'}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- KPI stats -->
			{#if kpiCards.length > 0}
				<div class="px-4 pb-6">
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
						{#each kpiCards as card, i}
							<div
								class="kpi-card"
								style="border-left: 3px solid {card.color}; opacity: {kpiVisible ? 1 : 0}; transform: translateY({kpiVisible ? '0px' : '16px'}); transition: opacity 0.5s ease {i * 0.08}s, transform 0.5s ease {i * 0.08}s;"
							>
								<div class="kpi-header">
									<div class="kpi-icon" style="color: {card.color};">
										{#if card.icon === 'users'}
											<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
										{:else if card.icon === 'org'}
											<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/><path d="M12 12v3"/><circle cx="12" cy="12" r="1"/></svg>
										{:else if card.icon === 'proposal'}
											<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
										{:else if card.icon === 'vote'}
											<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
										{:else if card.icon === 'transfer'}
											<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
										{:else if card.icon === 'zone'}
											<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
										{/if}
									</div>
									<span class="kpi-label">{card.label}</span>
								</div>
								<p class="kpi-value">
									{(animatedValues[i] ?? 0).toLocaleString()}
								</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}

		<div class="space-y-4 px-4 pb-8">
			<!-- Zones Map -->
			{#if zones.length > 0}
				<div class="rounded-lg border border-gray-200 shadow-md bg-white p-6">
					<h3 class="text-xl font-semibold text-gray-900 mb-1">Realm Zones</h3>
					<p class="text-sm text-gray-500 mb-4">
						{zones.length} zone{zones.length !== 1 ? 's' : ''} in this realm
					</p>
					<div
						bind:this={mapContainer}
						style="width: 100%; height: 320px; position: relative; z-index: 0;"
						class="rounded-lg overflow-hidden border border-gray-200"
					></div>
				</div>
			{/if}

			<!-- Latest Users -->
			{#if latestUsers.length > 0}
				<div class="rounded-lg border border-gray-200 shadow-md bg-white p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Latest Members</h3>
				<div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));">
					{#each latestUsers as user}
						<div class="flex flex-col items-center">
								<img
									src={`https://api.dicebear.com/9.x/glass/svg?seed=${user.name || user.id}`}
									alt={user.name || user.id}
									width="48"
									height="48"
									style="width: 48px; height: 48px; border-radius: 9999px;"
									class="ring-2 ring-gray-200 hover:ring-gray-300 transition-all duration-200"
								/>
								<span
									class="text-xs text-gray-600 text-center truncate w-full mt-1"
									title={user.name || user.id}
								>
									{user.name || user.id.substring(0, 8)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
