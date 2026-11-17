<script lang="ts">
	import { untrack } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';
	import AccessDenied from '../../../_shared/frontend-rt/AccessDenied.svelte';

	let { ctx }: { ctx: any } = $props();

	const cn = ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' '));

	type TabId = 'overview' | 'access';
	type Reply = { ok: boolean; error?: string; [key: string]: any };

	interface ExtAccess {
		name: string;
		version: string;
		description: string;
		profiles: string[];
		departments: string[];
	}

	const PAGE = 500;
	const MAX_PAGES = 20;
	const ACCESS_REFUSAL = /^\S+ needs (\S+)$/;

	let activeTab: TabId = $state('overview');

	function addToast(message: string, type: 'success' | 'info' | 'error' = 'success') {
		if (typeof ctx.notify === 'function') {
			ctx.notify(type, message);
			return;
		}
		console.warn('[extension]', type, message);
	}
	let pkgUpdateCount = $state(0);
	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');
	let extensionCount = $state(0);
	let codexCount = $state(0);

	// Access Control
	let extensions: ExtAccess[] = $state([]);
	let extLoading = $state(false);
	let expandedExt: string | null = $state(null);
	let grantTarget = $state('');
	let grantType: 'department' | 'profile' = $state('profile');

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

	/** Show a refused read as the access-denied panel, anything else as a neutral notice. */
	function refused(message: string, what: string) {
		const needs = message.match(ACCESS_REFUSAL);
		if (needs || message === 'sign in first') {
			accessDeniedOp = needs?.[1] ?? '';
			error = '';
		} else {
			accessDeniedOp = '';
			error = `${what} are unavailable right now: ${message}`;
		}
	}

	function strings(value: unknown): string[] {
		return Array.isArray(value) ? value.filter((v) => typeof v === 'string' && v) : [];
	}

	function toAccess(raw: any): ExtAccess {
		return {
			name: String(raw?.id ?? ''),
			version: String(raw?.version ?? ''),
			description: typeof raw?.manifest?.description === 'string' ? raw.manifest.description : '',
			profiles: strings(raw?.access?.profiles),
			departments: strings(raw?.access?.departments),
		};
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
			const [ext, codex] = await Promise.all([
				readPages('extension_list', 'extensions'),
				call(false, 'codex_status', { from: 1, count: 1 }),
			]);
			if (ext.error) refused(ext.error, 'Packages');
			const installed = ext.rows.map(toAccess).filter((e) => e.name);
			extensionCount = installed.length;

			// codex_status ids are "<codex>@<version>"; only one codex is active at a time.
			const active = codex.ok && codex.codex ? codex.codex : null;
			if (!codex.ok) console.warn('codex_status:', codex.error);
			codexCount = active ? 1 : 0;
			const activeCodex = active
				? { id: String(active.id ?? '').split('@')[0], version: String(active.version ?? '') }
				: null;

			pkgUpdateCount = await countUpdates(installed, activeCodex);
		} finally {
			loading = false;
		}
	}

	/** Packages whose file registry has a newer version than the one installed. */
	async function countUpdates(installed: ExtAccess[], codex: { id: string; version: string } | null) {
		const canisterId = ctx.config?.fileRegistryCanisterId;
		const base = canisterId ? registryBaseUrl(canisterId) : null;
		if (!base) return 0;
		const get = (path: string) =>
			fetch(`${base}${path}`, { headers: { Accept: 'application/json' } })
				.then((r) => (r.ok ? r.json() : []))
				.catch(() => []);
		const [extResp, codexResp] = await Promise.all([get('/api/extensions'), get('/api/codices')]);
		const versions = new Map(installed.map((e) => [e.name, e.version]));
		let updates = 0;
		for (const e of Array.isArray(extResp) ? extResp : []) {
			const current = versions.get(e?.ext_id);
			if (current && e.latest && versionGreater(e.latest, current)) updates++;
		}
		for (const c of Array.isArray(codexResp) ? codexResp : []) {
			if (codex && c?.codex_id === codex.id && c.latest && versionGreater(c.latest, codex.version)) updates++;
		}
		return updates;
	}

	// --- Access Control ---
	async function loadExtensions() {
		extLoading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const ext = await readPages('extension_list', 'extensions');
			if (ext.error) refused(ext.error, 'Extensions');
			extensions = ext.rows.map(toAccess).filter((e) => e.name);
		} finally {
			extLoading = false;
		}
	}

	/** Replace ``ext``'s profiles and departments; a governed call files a proposal instead, shown as such. */
	async function setAccess(ext: ExtAccess, profiles: string[], departments: string[], done: string) {
		const reply = await call(true, 'extension_set_access', { extension: ext.name, profiles, departments });
		if (!reply.ok) {
			addToast(reply.error || 'The change was not accepted', 'error');
			return false;
		}
		if (reply.proposal) addToast(`Submitted for a vote as proposal ${reply.proposal}.`, 'info');
		else addToast(done);
		await loadExtensions();
		return true;
	}

	async function grantExtension(ext: ExtAccess) {
		const target = grantTarget.trim();
		if (!target) return;
		const profiles = grantType === 'profile' ? [...new Set([...ext.profiles, target])] : ext.profiles;
		const departments = grantType === 'department' ? [...new Set([...ext.departments, target])] : ext.departments;
		if (await setAccess(ext, profiles, departments, 'Access granted')) grantTarget = '';
	}

	async function revokeExtDept(ext: ExtAccess, deptName: string) {
		await setAccess(ext, ext.profiles, ext.departments.filter((d) => d !== deptName), 'Revoked');
	}

	async function revokeExtProfile(ext: ExtAccess, profileName: string) {
		await setAccess(ext, ext.profiles.filter((p) => p !== profileName), ext.departments, 'Revoked');
	}

	$effect(() => {
		const tab = activeTab;
		untrack(() => (tab === 'overview' ? loadPackages() : loadExtensions()));
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
		<AccessDenied operation={accessDeniedOp} />
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
				{#if !error && !accessDeniedOp}
					<p class="text-center text-gray-500 py-8">No extensions are installed yet.</p>
				{/if}
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
									<div class="text-sm font-medium text-gray-700 mb-1">Profile access:</div>
									{#if ext.profiles.length === 0}
										<span class="text-sm text-gray-400">None</span>
									{:else}
										<div class="flex flex-wrap gap-1">
											{#each ext.profiles as p}
												<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
													{p}
													<button onclick={() => revokeExtProfile(ext, p)} class="text-blue-400 hover:text-blue-600">&times;</button>
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
													<button onclick={() => revokeExtDept(ext, d)} class="text-purple-400 hover:text-purple-600">&times;</button>
												</span>
											{/each}
										</div>
									{/if}
								</div>

								<p class="text-xs text-gray-500">
									Access is given to profiles and departments; direct access for single users is not offered in this realm version.
								</p>

								<!-- Grant form -->
								<div class="pt-2 border-t border-gray-200">
									<div class="text-sm font-medium text-gray-700 mb-2">Grant access:</div>
									<div class="flex gap-2 flex-wrap">
										<select bind:value={grantType} class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
											<option value="department">Department</option>
											<option value="profile">Profile</option>
										</select>
										<input
											bind:value={grantTarget}
											placeholder={grantType === 'department' ? 'Dept name' : 'Profile name'}
											class="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
										/>
										<button onclick={() => grantExtension(ext)} class="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">Grant</button>
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
