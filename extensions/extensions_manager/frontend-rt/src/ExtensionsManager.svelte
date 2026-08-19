<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';

	let { ctx }: { ctx: any } = $props();

	const cn = ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' '));

	type TabId = 'overview' | 'access';

	interface ExtManifest {
		name: string;
		version: string;
		description?: string;
		icon?: string;
		categories?: string[];
	}

	interface Toast { id: number; type: 'success' | 'error'; text: string; }

	let activeTab: TabId = $state('overview');
	let toasts: Toast[] = $state([]);
	let toastCounter = $state(0);

	// Overview
	let pkgInstalledCount: number | null = $state(null);
	let pkgUpdateCount = $state(0);
	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');
	let extensionCount = $state(0);
	let codexCount = $state(0);
	let extensionManifests: Record<string, ExtManifest> = $state({});
	let codexManifests: Record<string, ExtManifest> = $state({});

	// Access Control
	let extensions: any[] = $state([]);
	let extLoading = $state(false);
	let expandedExt: string | null = $state(null);
	let grantTarget = $state('');
	let grantType: 'user' | 'department' | 'profile' = $state('user');

	function addToast(message: string, type: 'success' | 'error' = 'success') {
		const id = ++toastCounter;
		toasts = [...toasts, { id, text: message, type }];
		setTimeout(() => { toasts = toasts.filter(t => t.id !== id); }, 4000);
	}

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	function registryBaseUrl(canisterId: string): string | null {
		if (typeof window === 'undefined') return null;
		const host = window.location.host;
		const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
		if (isLocal) {
			const port = host.split(':')[1] ?? '4943';
			return `http://${canisterId}.localhost:${port}`;
		}
		return `https://${canisterId}.icp0.io`;
	}

	function versionGreater(a: string, b: string): boolean {
		const pa = (a || '').split('-', 1)[0].split('.').map(n => parseInt(n, 10) || 0);
		const pb = (b || '').split('-', 1)[0].split('.').map(n => parseInt(n, 10) || 0);
		const len = Math.max(pa.length, pb.length);
		for (let i = 0; i < len; i++) {
			const x = pa[i] ?? 0;
			const y = pb[i] ?? 0;
			if (x !== y) return x > y;
		}
		return false;
	}

	async function loadPackages() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const [extRaw, codexRaw, statusResp] = await Promise.all([
				ctx.backend.list_runtime_extensions().catch(() => '{}'),
				ctx.backend.list_codex_packages().catch(() => '{}'),
				ctx.backend.status().catch(() => null),
			]);

			const extParsed = typeof extRaw === 'string' ? JSON.parse(extRaw) : extRaw;
			const codexParsed = typeof codexRaw === 'string' ? JSON.parse(codexRaw) : codexRaw;
			const installedExt = extParsed?.success ? (extParsed.runtime_extensions ?? []) : [];
			const installedCodex = codexParsed?.success ? (codexParsed.codex_packages ?? []) : [];
			const extMfsts = extParsed?.success ? (extParsed.all_manifests ?? {}) : {};
			const codexMfsts = codexParsed?.success ? (codexParsed.manifests ?? {}) : {};
			extensionManifests = extMfsts;
			codexManifests = codexMfsts;
			extensionCount = Object.keys(extMfsts).length || installedExt.length;
			codexCount = Array.isArray(installedCodex) ? installedCodex.length : Object.keys(codexMfsts).length;
			pkgInstalledCount = extensionCount + codexCount;

			const registries = (statusResp?.success && statusResp?.data?.status?.registries) || [];
			let updates = 0;
			for (const reg of registries) {
				try {
					const base = registryBaseUrl(reg.canister_id);
					if (!base) continue;
					const [extResp, codexResp] = await Promise.all([
						fetch(`${base}/api/extensions`, { headers: { Accept: 'application/json' } }).then(r => r.ok ? r.json() : []).catch(() => []),
						fetch(`${base}/api/codices`, { headers: { Accept: 'application/json' } }).then(r => r.ok ? r.json() : []).catch(() => []),
					]);
					for (const e of extResp) {
						if (!installedExt.includes(e.ext_id)) continue;
						const installedVersion = extMfsts?.[e.ext_id]?.version;
						if (installedVersion && e.latest && versionGreater(e.latest, installedVersion)) updates++;
					}
					for (const c of codexResp) {
						if (!installedCodex.includes(c.codex_id)) continue;
						const installedVersion = codexMfsts?.[c.codex_id]?.version;
						if (installedVersion && c.latest && versionGreater(c.latest, installedVersion)) updates++;
					}
				} catch { /* unreachable registry */ }
			}
			pkgUpdateCount = updates;
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

	// --- Access Control ---
	async function loadExtensions() {
		extLoading = true;
		try {
			const res = await callExt('list_extensions');
			extensions = res?.data?.extensions ?? [];
		} catch (e: any) {
			addToast(e?.message || 'Failed to load extensions', 'error');
		} finally {
			extLoading = false;
		}
	}

	async function grantExtension(extName: string) {
		if (!grantTarget.trim()) return;
		let fn = '';
		let args: Record<string, string> = { extension: extName };
		if (grantType === 'user') {
			fn = 'grant_extension_to_user';
			args.user_principal = grantTarget.trim();
		} else if (grantType === 'department') {
			fn = 'grant_extension_to_department';
			args.department = grantTarget.trim();
		} else {
			fn = 'grant_extension_to_profile';
			args.profile = grantTarget.trim();
		}
		try {
			const res = await callExt(fn, args);
			if (res?.success) {
				addToast('Access granted');
				grantTarget = '';
				await loadExtensions();
			} else {
				addToast(res?.error || 'Failed', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

	async function revokeExtUser(extName: string, principal: string) {
		try {
			const res = await callExt('revoke_extension_from_user', { extension: extName, user_principal: principal });
			if (res?.success) { addToast('Revoked'); await loadExtensions(); }
			else addToast(res?.error || 'Failed', 'error');
		} catch (e: any) { addToast(e?.message || 'Error', 'error'); }
	}

	async function revokeExtDept(extName: string, deptName: string) {
		try {
			const res = await callExt('revoke_extension_from_department', { extension: extName, department: deptName });
			if (res?.success) { addToast('Revoked'); await loadExtensions(); }
			else addToast(res?.error || 'Failed', 'error');
		} catch (e: any) { addToast(e?.message || 'Error', 'error'); }
	}

	async function revokeExtProfile(extName: string, profileName: string) {
		try {
			const res = await callExt('revoke_extension_from_profile', { extension: extName, profile: profileName });
			if (res?.success) { addToast('Revoked'); await loadExtensions(); }
			else addToast(res?.error || 'Failed', 'error');
		} catch (e: any) { addToast(e?.message || 'Error', 'error'); }
	}

	function shortPrincipal(p: string): string {
		if (!p || p.length < 12) return p;
		return p.slice(0, 5) + '...' + p.slice(-5);
	}

	$effect(() => {
		if (activeTab === 'overview') loadPackages();
		else if (activeTab === 'access') loadExtensions();
	});
</script>

<div class="w-full px-4 max-w-none">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Packages</h1>
			<p class="text-gray-600 mt-1">{extensionDescription}</p>
		</div>
		<button
			onclick={() => { if (activeTab === 'overview') loadPackages(); else loadExtensions(); }}
			disabled={loading || extLoading}
			class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
			title="Refresh"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
		</button>
	</div>

	<!-- Toasts -->
	{#if toasts.length > 0}
		<div class="fixed top-4 right-4 z-50 space-y-2">
			{#each toasts as toast (toast.id)}
				<div class={cn(
					'px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all',
					toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
				)}>
					{toast.text}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Tabs -->
	<div class="border-b border-gray-200 mb-6">
		<nav class="flex gap-6">
			{#each [['overview', 'Overview'], ['access', 'Access Control']] as [id, label]}
				<button
					onclick={() => activeTab = id as TabId}
					class={cn(
						'pb-3 text-sm font-medium border-b-2 transition-colors',
						activeTab === id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
					)}
				>
					{label}
				</button>
			{/each}
		</nav>
	</div>

	{#if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error}
		<div class="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
			{error}
			<button onclick={() => error = ''} class="ml-2 text-red-600 hover:text-red-800 font-bold">&times;</button>
		</div>
	{/if}

	{#if activeTab === 'overview'}
		{#if loading}
			<div class="flex items-center justify-center py-10">
				<div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
			</div>
		{:else}
			<!-- Summary cards -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
				<div class="bg-white shadow-sm rounded-lg p-5 border border-gray-200">
					<div class="text-xs text-gray-500 uppercase tracking-wide font-medium">Extensions</div>
					<div class="text-3xl font-bold text-gray-900 mt-1">{extensionCount}</div>
				</div>
				<div class="bg-white shadow-sm rounded-lg p-5 border border-gray-200">
					<div class="text-xs text-gray-500 uppercase tracking-wide font-medium">Codexes</div>
					<div class="text-3xl font-bold text-gray-900 mt-1">{codexCount}</div>
				</div>
				<div class="bg-white shadow-sm rounded-lg p-5 border border-gray-200">
					<div class="text-xs text-gray-500 uppercase tracking-wide font-medium">Updates Available</div>
					<div class={cn('text-3xl font-bold mt-1', pkgUpdateCount > 0 ? 'text-yellow-600' : 'text-gray-900')}>
						{pkgUpdateCount}
					</div>
				</div>
			</div>

			<!-- Quick links -->
			<div class={cn('flex flex-wrap gap-3 mb-6')}>
				<button
					onclick={() => ctx.navigate?.('/extensions/package_manager')}
					class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
					</svg>
					Manage Packages
				</button>
				<button
					onclick={() => ctx.navigate?.('/extensions/market_place')}
					class="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
				>
					Browse Marketplace
				</button>
			</div>

			<p class="text-sm text-gray-500 mb-6">
				Use Package Manager to install, update, or remove packages on this realm.
				Use the Access Control tab to manage who can see each extension in the sidebar.
			</p>
		{/if}

	{:else if activeTab === 'access'}
		<div class="space-y-4">
			<h2 class="text-lg font-semibold text-gray-800">Extension Access ({extensions.length})</h2>

			{#if extLoading}
				<div class="flex justify-center py-8">
					<svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				</div>
			{:else if extensions.length === 0}
				<p class="text-center text-gray-500 py-8">No Extension entities found. Extensions are seeded when installed.</p>
			{:else}
				{#each extensions as ext (ext.name)}
					<div class="border border-gray-200 rounded-xl overflow-hidden">
						<button
							onclick={() => expandedExt = expandedExt === ext.name ? null : ext.name}
							class="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 text-left"
						>
							<div>
								<span class="font-medium text-gray-900">{ext.name}</span>
								{#if ext.description}
									<span class="ml-2 text-sm text-gray-500">— {ext.description}</span>
								{/if}
							</div>
							<span class="text-xs text-gray-500">{expandedExt === ext.name ? '▲' : '▼'}</span>
						</button>

						{#if expandedExt === ext.name}
							<div class="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-3">
								<!-- Profiles -->
								<div>
									<div class="text-sm font-medium text-gray-700 mb-1">Profile-level access (from manifest):</div>
									{#if ext.profiles.length === 0}
										<span class="text-sm text-gray-400">None</span>
									{:else}
										<div class="flex flex-wrap gap-1">
											{#each ext.profiles as p}
												<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
													{p}
													<button onclick={() => revokeExtProfile(ext.name, p)} class="text-blue-400 hover:text-blue-600">&times;</button>
												</span>
											{/each}
										</div>
									{/if}
								</div>

								<!-- Departments -->
								<div>
									<div class="text-sm font-medium text-gray-700 mb-1">Department access:</div>
									{#if ext.departments.length === 0}
										<span class="text-sm text-gray-400">None</span>
									{:else}
										<div class="flex flex-wrap gap-1">
											{#each ext.departments as d}
												<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
													{d}
													<button onclick={() => revokeExtDept(ext.name, d)} class="text-purple-400 hover:text-purple-600">&times;</button>
												</span>
											{/each}
										</div>
									{/if}
								</div>

								<!-- Users -->
								<div>
									<div class="text-sm font-medium text-gray-700 mb-1">Direct user access:</div>
									{#if ext.users.length === 0}
										<span class="text-sm text-gray-400">None</span>
									{:else}
										<div class="flex flex-wrap gap-1">
											{#each ext.users as u}
												<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
													{u.nickname || shortPrincipal(u.principal)}
													<button onclick={() => revokeExtUser(ext.name, u.principal)} class="text-green-400 hover:text-green-600">&times;</button>
												</span>
											{/each}
										</div>
									{/if}
								</div>

								<!-- Grant form -->
								<div class="pt-2 border-t border-gray-200">
									<div class="text-sm font-medium text-gray-700 mb-2">Grant access:</div>
									<div class="flex gap-2 flex-wrap">
										<select bind:value={grantType} class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
											<option value="user">User</option>
											<option value="department">Department</option>
											<option value="profile">Profile</option>
										</select>
										<input
											bind:value={grantTarget}
											placeholder={grantType === 'user' ? 'Principal' : grantType === 'department' ? 'Dept name' : 'Profile name'}
											class="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
										/>
										<button onclick={() => grantExtension(ext.name)} class="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">Grant</button>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>
