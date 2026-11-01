<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	let { ctx }: { ctx: any } = $props();

	let narrow = $state(isNarrowViewport());
	$effect(() => subscribeNarrowViewport((value) => { narrow = value; }));

	const cn = ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' '));

	type Kind = 'extension' | 'codex';
	type TabId = 'installed' | 'available' | 'marketplace';
	type KindFilter = 'all' | Kind;
	type InstalledFilter = 'all' | 'updates';
	type AvailableFilter = 'actionable' | 'all';

	interface InstalledItem {
		kind: Kind;
		id: string;
		version: string;
		manifest: Record<string, any> | null;
	}

	interface RegistryExtension {
		ext_id: string;
		versions: string[];
		latest: string;
		manifest: Record<string, unknown> | null;
	}

	interface RegistryCodex {
		codex_id: string;
		versions: string[];
		latest: string;
	}

	interface CatalogEntry {
		kind: Kind;
		id: string;
		versions: string[];
		latest: string;
		manifest: Record<string, any> | null;
	}

	const PROTECTED_IDS = new Set([
		'package_manager',
		'member_dashboard',
		'public_dashboard',
		'welcome',
	]);

	// The slim realm has one file registry; the host hands its canister id over in ctx.config.
	const FILE_REGISTRY_ID = ctx.config?.fileRegistryCanisterId || '';

	let authState = $state(false);
	let userProfilesState = $state<string[]>([]);

	$effect(() => {
		const authStore = ctx.isAuthenticated;
		if (authStore && typeof authStore.subscribe === 'function') {
			return authStore.subscribe((v: boolean) => {
				authState = v;
			});
		}
		authState = authStore !== false;
	});

	$effect(() => {
		const profileStore = ctx.userProfiles;
		if (profileStore && typeof profileStore.subscribe === 'function') {
			return profileStore.subscribe((v: string[]) => {
				userProfilesState = v ?? [];
			});
		}
		userProfilesState = Array.isArray(profileStore) ? profileStore : [];
	});

	let canManage = $derived(
		authState && userProfilesState.some((p) => p === 'admin' || p === 'developer'),
	);

	function fileRegistryBaseUrlFor(canisterId: string): string {
		const host = typeof window !== 'undefined' ? window.location.host : '';
		const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
		if (isLocal) {
			const port = host.split(':')[1] ?? '4943';
			return `http://${canisterId}.localhost:${port}`;
		}
		return `https://${canisterId}.icp0.io`;
	}

	async function fetchJson<T>(url: string): Promise<T> {
		const resp = await fetch(url, { headers: { Accept: 'application/json' } });
		if (!resp.ok) {
			throw new Error(`HTTP ${resp.status} from ${url}: ${await resp.text().catch(() => '')}`);
		}
		return (await resp.json()) as T;
	}

	async function listRegistryExtensions(canisterId: string): Promise<RegistryExtension[]> {
		return fetchJson<RegistryExtension[]>(`${fileRegistryBaseUrlFor(canisterId)}/api/extensions`);
	}

	async function listRegistryCodices(canisterId: string): Promise<RegistryCodex[]> {
		return fetchJson<RegistryCodex[]>(`${fileRegistryBaseUrlFor(canisterId)}/api/codices`);
	}

	function compareVersions(a: string, b: string): number {
		const pa = a.split('-', 1)[0].split('.').map((n) => parseInt(n, 10) || 0);
		const pb = b.split('-', 1)[0].split('.').map((n) => parseInt(n, 10) || 0);
		const len = Math.max(pa.length, pb.length);
		for (let i = 0; i < len; i++) {
			const x = pa[i] ?? 0;
			const y = pb[i] ?? 0;
			if (x !== y) return x - y;
		}
		if (a === b) return 0;
		return a < b ? -1 : 1;
	}

	function displayName(manifest: Record<string, any> | null | undefined, id: string): string {
		const label = manifest?.sidebar_label;
		if (typeof label === 'string' && label.trim()) return label;
		if (label && typeof label === 'object') {
			const en = label.en ?? label['en'];
			if (typeof en === 'string' && en.trim()) return en;
			const first = Object.values(label).find((v) => typeof v === 'string' && v.trim());
			if (typeof first === 'string') return first;
		}
		if (typeof manifest?.name === 'string' && manifest.name !== id) return manifest.name;
		return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function displayDescription(manifest: Record<string, any> | null | undefined): string {
		const raw = (manifest?.short_description ?? manifest?.description ?? '').trim();
		if (!raw) return '';
		const dot = raw.indexOf('. ');
		return dot > 0 && dot <= 90 ? raw.slice(0, dot) : raw.length > 90 ? `${raw.slice(0, 87)}…` : raw;
	}

	function dedupeCatalog(entries: CatalogEntry[]): CatalogEntry[] {
		const byKey = new Map<string, CatalogEntry>();
		for (const entry of entries) {
			const key = `${entry.kind}:${entry.id.toLowerCase()}`;
			const existing = byKey.get(key);
			if (!existing) {
				byKey.set(key, entry);
				continue;
			}
			const preferNew =
				compareVersions(entry.latest || '', existing.latest || '') > 0 ||
				(entry.id === entry.id.toLowerCase() && existing.id !== existing.id.toLowerCase());
			if (preferNew) byKey.set(key, entry);
		}
		return [...byKey.values()];
	}

	let activeTab = $state<TabId>('installed');
	let searchQuery = $state('');
	let kindFilter = $state<KindFilter>('all');
	let installedFilter = $state<InstalledFilter>('all');
	let availableFilter = $state<AvailableFilter>('actionable');
	let openMenuKey = $state<string | null>(null);
	let selectedVersions = $state<Record<string, string>>({});

	let installed = $state<InstalledItem[]>([]);
	let installedLoading = $state(true);
	let installedError = $state('');

	let registryEntries = $state<CatalogEntry[]>([]);
	let registryLoading = $state(false);
	let registryErrors = $state<string[]>([]);

	let busy = $state<Record<string, string>>({});

	// Marketplace (merged from the deprecated market_place extension)
	let mpAvailable = $derived(!!ctx.marketplace);
	let mpLoading = $state(false);
	let mpError = $state('');
	let mpListings = $state<any[]>([]);
	let mpPurchases = $state<any[]>([]);
	let mpSearch = $state('');
	let mpLoaded = $state(false);
	let mpSelected = $state<any>(null);
	let mpPurchasing = $state(false);
	let mpPurchasedIds = $derived(new Set(mpPurchases.map((p: any) => p.extension_id || p.id)));

	let updateCount = $derived(installed.filter((i) => statusFor(i) === 'outdated').length);
	let actionableCount = $derived(
		registryEntries.filter((e) => {
			const inst = isInstalled(e);
			if (!inst) return true;
			return (
				e.latest &&
				inst.version &&
				compareVersions(e.latest, inst.version) > 0
			);
		}).length,
	);

	function rowKey(kind: Kind, id: string): string {
		return `${kind}:${id}`;
	}

	function setBusy(kind: Kind, id: string, label: string) {
		busy = { ...busy, [rowKey(kind, id)]: label };
	}

	function clearBusy(kind: Kind, id: string) {
		const next = { ...busy };
		delete next[rowKey(kind, id)];
		busy = next;
	}

	function pushToast(type: 'success' | 'error' | 'info', text: string) {
		const level = type === 'error' ? 'error' : type === 'info' ? 'info' : 'success';
		if (typeof ctx.notify === 'function') {
			ctx.notify(level, text);
			return;
		}
		console.warn('[extension]', level, text);
	}

	function shortId(s: string, n = 8): string {
		return s.length > n ? `${s.slice(0, n)}…` : s;
	}

	function notifySidebarRefresh() {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('realms:extensions-changed'));
		}
	}

	function selectedVersionFor(entry: CatalogEntry): string {
		const key = rowKey(entry.kind, entry.id);
		const picked = selectedVersions[key];
		if (picked && entry.versions.includes(picked)) return picked;
		return entry.latest || entry.versions[entry.versions.length - 1] || '';
	}

	function matchesSearch(item: { id: string; manifest: Record<string, any> | null }, kind: Kind): boolean {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return true;
		const name = displayName(item.manifest, item.id).toLowerCase();
		const desc = displayDescription(item.manifest).toLowerCase();
		return (
			item.id.toLowerCase().includes(q) ||
			name.includes(q) ||
			desc.includes(q) ||
			kind.includes(q)
		);
	}

	async function listInstalledExtensions(): Promise<InstalledItem[]> {
		const items: InstalledItem[] = [];
		let from: number | null = 1;
		while (from !== null) {
			const reply: any = await ctx.backend.read('extension_list', { from });
			if (!reply.ok) throw new Error(reply.error);
			for (const e of reply.extensions) {
				items.push({ kind: 'extension', id: e.id, version: e.version ?? '', manifest: e.manifest ?? {} });
			}
			from = reply.next;
		}
		return items;
	}

	// A realm runs one codex at a time; its id is "<codex>@<version>". The codex's manifest id is assumed to equal
	// its registry namespace id; if they differ, "update available" never shows.
	async function listInstalledCodex(): Promise<InstalledItem[]> {
		const reply: any = await ctx.backend.read('codex_status');
		if (!reply.ok) throw new Error(reply.error);
		if (!reply.codex) return [];
		return [{ kind: 'codex', id: reply.codex.id.split('@')[0], version: reply.codex.version, manifest: {} }];
	}

	async function loadInstalled() {
		installedLoading = true;
		installedError = '';
		try {
			const [extensions, codices] = await Promise.all([listInstalledExtensions(), listInstalledCodex()]);
			installed = [...extensions, ...codices].sort((a, b) =>
				displayName(a.manifest, a.id).localeCompare(displayName(b.manifest, b.id)),
			);
		} catch (e: any) {
			installedError = e?.message ?? String(e);
		} finally {
			installedLoading = false;
		}
	}

	async function loadRegistryCatalog() {
		if (!FILE_REGISTRY_ID) return;
		registryLoading = true;
		registryErrors = [];
		const errors: string[] = [];
		const exts = await listRegistryExtensions(FILE_REGISTRY_ID).catch((e: any) => {
			errors.push(`extensions: ${e?.message ?? String(e)}`);
			return [] as RegistryExtension[];
		});
		const codices = await listRegistryCodices(FILE_REGISTRY_ID).catch((e: any) => {
			errors.push(`codices: ${e?.message ?? String(e)}`);
			return [] as RegistryCodex[];
		});
		if (errors.length > 0 && exts.length === 0 && codices.length === 0) {
			registryErrors = [`Failed to load from registry ${shortId(FILE_REGISTRY_ID)}: ${errors.join('; ')}`];
		}

		const out: CatalogEntry[] = [
			...exts.map((e): CatalogEntry => ({
				kind: 'extension',
				id: e.ext_id,
				versions: e.versions ?? [],
				latest: e.latest,
				manifest: e.manifest as any,
			})),
			...codices.map((c): CatalogEntry => ({
				kind: 'codex',
				id: c.codex_id,
				versions: c.versions ?? [],
				latest: c.latest,
				manifest: null,
			})),
		];
		registryEntries = dedupeCatalog(out).sort((a, b) =>
			displayName(a.manifest, a.id).localeCompare(displayName(b.manifest, b.id)),
		);
		registryLoading = false;
	}

	async function refreshAll() {
		await Promise.all([loadInstalled(), loadRegistryCatalog()]);
	}

	// --- Marketplace (merged from the deprecated market_place extension) ---

	function formatICP(e8s: number | bigint): string {
		const v = typeof e8s === 'bigint' ? Number(e8s) : Number(e8s ?? 0);
		if (v === 0) return 'Free';
		return `${(v / 100_000_000).toFixed(2)} ICP`;
	}

	async function loadMarketplace() {
		if (!ctx.marketplace) return;
		mpLoading = true;
		mpError = '';
		try {
			const [listRes, purchasesRes] = await Promise.all([
				mpSearch.trim()
					? ctx.marketplace.search_marketplace(mpSearch.trim())
					: ctx.marketplace.list_extensions(),
				ctx.marketplace.get_my_purchases().catch(() => ({ data: [] })),
			]);
			mpListings = (listRes?.listings ?? []).map((e: any) => ({
				...e,
				price_e8s: Number(e.price_e8s ?? 0),
				downloads: Number(e.downloads ?? 0),
			}));
			mpPurchases = purchasesRes?.data ?? [];
			mpLoaded = true;
		} catch (e: any) {
			mpError = e?.message ?? String(e);
		} finally {
			mpLoading = false;
		}
	}

	async function mpConfirmPurchase() {
		if (!mpSelected || !ctx.marketplace) return;
		mpPurchasing = true;
		mpError = '';
		try {
			const extId = mpSelected.extension_id || mpSelected.id || mpSelected.name;
			const res = await ctx.marketplace.buy_extension(extId);
			if (res?.Err) {
				mpError = String(res.Err);
			} else {
				pushToast('success', `Acquired ${extId}. Install it from the Available tab.`);
				mpSelected = null;
				await Promise.all([loadMarketplace(), loadRegistryCatalog()]);
			}
		} catch (e: any) {
			mpError = e?.message ?? String(e);
		} finally {
			mpPurchasing = false;
		}
	}

	async function uninstall(item: InstalledItem) {
		if (PROTECTED_IDS.has(item.id)) {
			pushToast('error', `${displayName(item.manifest, item.id)} is a core package and cannot be uninstalled from here.`);
			return;
		}

		const label = displayName(item.manifest, item.id);
		const typed = prompt(
			`Uninstall ${label} (${item.id})?\n\nData written by this package may remain on the realm. Type the package ID to confirm:`,
			'',
		);
		if (typed !== item.id) return;

		setBusy(item.kind, item.id, `Uninstalling ${item.id}…`);
		try {
			// The realm has one codex, so codex_uninstall takes no id.
			const reply =
				item.kind === 'extension'
					? await ctx.backend.run('extension_uninstall', { extension: item.id })
					: await ctx.backend.run('codex_uninstall');
			if (!reply.ok) throw new Error(reply.error);
			openMenuKey = null;
			if (reply.proposal) {
				pushToast('info', `Proposal ${reply.proposal} filed: ${label} is uninstalled once it is accepted`);
				return;
			}
			pushToast('success', `Uninstalled ${label}`);
			notifySidebarRefresh();
			await Promise.all([loadInstalled(), loadRegistryCatalog()]);
		} catch (e: any) {
			pushToast('error', e?.message ?? String(e));
		} finally {
			clearBusy(item.kind, item.id);
		}
	}

	async function updateInstalled(item: InstalledItem) {
		const candidate = registryEntries.find((c) => c.kind === item.kind && c.id.toLowerCase() === item.id.toLowerCase());
		if (!candidate) return;
		const ver = selectedVersionFor(candidate);
		if (!ver) return;
		if (item.version && compareVersions(ver, item.version) <= 0) return;
		const ok = confirm(
			`Update ${displayName(item.manifest, item.id)} from v${item.version || '?'} to v${ver}?`,
		);
		if (!ok) return;
		await installFromRegistry(candidate, ver);
	}

	async function installFromRegistry(entry: CatalogEntry, ver: string) {
		setBusy(entry.kind, entry.id, `Installing ${entry.id}…`);
		try {
			const reply =
				entry.kind === 'extension'
					? await ctx.backend.run('extension_install', { extension: entry.id, version: ver })
					: await ctx.backend.run('codex_install', { codex: entry.id, version: ver });
			if (!reply.ok) throw new Error(reply.error);
			if (reply.proposal) {
				pushToast('info', `Proposal ${reply.proposal} filed: ${displayName(entry.manifest, entry.id)} installs once it is accepted`);
				return;
			}
			pushToast('success', `Installed ${displayName(entry.manifest, entry.id)} (v${ver})`);
			notifySidebarRefresh();
			await Promise.all([loadInstalled(), loadRegistryCatalog()]);
		} catch (e: any) {
			pushToast('error', e?.message ?? String(e));
		} finally {
			clearBusy(entry.kind, entry.id);
		}
	}

	function findCatalogEntry(item: InstalledItem): CatalogEntry | undefined {
		return registryEntries.find((c) => c.kind === item.kind && c.id.toLowerCase() === item.id.toLowerCase());
	}

	function statusFor(item: InstalledItem): 'installed' | 'outdated' | 'unknown' {
		const c = findCatalogEntry(item);
		if (!c || !c.latest || !item.version) return 'unknown';
		return compareVersions(c.latest, item.version) > 0 ? 'outdated' : 'installed';
	}

	function isInstalled(entry: CatalogEntry): InstalledItem | undefined {
		return installed.find((i) => i.kind === entry.kind && i.id.toLowerCase() === entry.id.toLowerCase());
	}

	let filteredInstalled = $derived(
		installed.filter((item) => {
			if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
			if (installedFilter === 'updates' && statusFor(item) !== 'outdated') return false;
			return matchesSearch(item, item.kind);
		}),
	);

	let filteredAvailable = $derived(
		registryEntries.filter((entry) => {
			if (kindFilter !== 'all' && entry.kind !== kindFilter) return false;
			if (!matchesSearch(entry, entry.kind)) return false;
			const inst = isInstalled(entry);
			const outdated =
				inst && entry.latest && inst.version && compareVersions(entry.latest, inst.version) > 0;
			if (availableFilter === 'actionable') {
				return !inst || outdated;
			}
			return true;
		}),
	);

	function kindBadge(kind: Kind): string {
		return kind === 'extension'
			? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300'
			: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300';
	}

	function statusBadge(st: string): { cls: string; label: string } {
		if (st === 'outdated')
			return {
				cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
				label: 'update available',
			};
		if (st === 'installed')
			return {
				cls: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
				label: 'installed',
			};
		return { cls: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400', label: 'unknown' };
	}

	const spinnerSvg = `<svg class="inline-block w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>`;

	$effect(() => {
		if (canManage) void refreshAll();
	});
</script>

<style>
	.chrome-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 6px 12px;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 6px;
		border: 1px solid #d1d5db;
		background: #fff;
		color: #374151;
		cursor: pointer;
		flex-shrink: 0;
	}

	.chrome-tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		white-space: nowrap;
	}

	.chrome-tab.is-on {
		border-bottom-color: #4f46e5;
		color: #4f46e5;
	}

	@media (max-width: 720px) {
		.chrome-label,
		.chrome-count {
			display: none;
		}

		.chrome-btn {
			width: 32px;
			height: 32px;
			padding: 0;
		}

		.chrome-tab {
			padding: 10px 10px;
		}
	}
</style>

<div class={cn('w-full py-4 md:py-6')}>
	{#if !authState}
		<div class={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center max-w-lg mx-auto mt-8')}>
			<h1 class={cn('text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2')}>Package Manager</h1>
			<p class={cn('text-sm text-gray-600 dark:text-gray-400 mb-6')}>
				Sign in with an admin or developer account to install, update, and uninstall packages on this realm.
			</p>
			<button
				onclick={() => ctx.navigate?.('/join')}
				class={cn('px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800')}
			>
				Sign in
			</button>
		</div>
	{:else if !canManage}
		<div class={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center max-w-lg mx-auto mt-8')}>
			<h1 class={cn('text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2')}>Package Manager</h1>
			<p class={cn('text-sm text-gray-600 dark:text-gray-400')}>
				You need the <strong>admin</strong> or <strong>developer</strong> profile to manage packages.
				Contact a realm administrator if you need access.
			</p>
		</div>
	{:else}
		<div class={cn('mb-5 flex flex-col gap-2')}>
			<div>
				<h1 class={cn('text-2xl font-semibold text-gray-900 dark:text-gray-100')}>Package Manager</h1>
				<p class={cn('text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl')}>{extensionDescription}</p>
				<p class={cn('text-sm text-gray-500 dark:text-gray-500 mt-1 max-w-2xl')}>
					To choose which people may open an installed extension, go to Users → Extension Access.
				</p>
			</div>
			<button
				type="button"
				onclick={refreshAll}
				disabled={installedLoading || registryLoading}
				class="chrome-btn self-start"
				title={installedLoading || registryLoading ? 'Loading' : 'Refresh'}
				aria-label={installedLoading || registryLoading ? 'Loading' : 'Refresh'}
			>
				{#if installedLoading || registryLoading}
					<div class="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
				{:else}
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
				{/if}
				<span class="chrome-label">{installedLoading || registryLoading ? 'Loading…' : 'Refresh'}</span>
			</button>
		</div>

		{#if narrow}
			<div class={cn('grid grid-cols-2 mb-5 border-y border-gray-200 dark:border-gray-700')}>
				<div class={cn('px-3 py-2 border-b border-r border-gray-200 dark:border-gray-700')}>
					<div class={cn('text-xs text-gray-500 uppercase tracking-wide')}>Installed</div>
					<div class={cn('text-xl font-semibold text-gray-900 dark:text-gray-100')}>{installed.length}</div>
				</div>
				<div class={cn('px-3 py-2 border-b border-gray-200 dark:border-gray-700')}>
					<div class={cn('text-xs text-gray-500 uppercase tracking-wide')}>Updates</div>
					<div class={cn('text-xl font-semibold', updateCount > 0 ? 'text-amber-600' : 'text-gray-900 dark:text-gray-100')}>
						{updateCount}
					</div>
				</div>
				<div class={cn('px-3 py-2 border-r border-gray-200 dark:border-gray-700')}>
					<div class={cn('text-xs text-gray-500 uppercase tracking-wide')}>Available</div>
					<div class={cn('text-xl font-semibold text-gray-900 dark:text-gray-100')}>{actionableCount}</div>
				</div>
				<div class={cn('px-3 py-2')}>
					<div class={cn('text-xs text-gray-500 uppercase tracking-wide')}>Registries</div>
					<div class={cn('text-xl font-semibold text-gray-900 dark:text-gray-100')}>
						{FILE_REGISTRY_ID ? 1 : 0}
					</div>
				</div>
			</div>
		{:else}
			<div class={cn('grid grid-cols-4 gap-3 mb-5')}>
				<div class={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3')}>
					<div class={cn('text-xs text-gray-500 uppercase tracking-wide')}>Installed</div>
					<div class={cn('text-2xl font-semibold text-gray-900 dark:text-gray-100')}>{installed.length}</div>
				</div>
				<div class={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3')}>
					<div class={cn('text-xs text-gray-500 uppercase tracking-wide')}>Updates</div>
					<div class={cn('text-2xl font-semibold', updateCount > 0 ? 'text-amber-600' : 'text-gray-900 dark:text-gray-100')}>
						{updateCount}
					</div>
				</div>
				<div class={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3')}>
					<div class={cn('text-xs text-gray-500 uppercase tracking-wide')}>Available</div>
					<div class={cn('text-2xl font-semibold text-gray-900 dark:text-gray-100')}>{actionableCount}</div>
				</div>
				<div class={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3')}>
					<div class={cn('text-xs text-gray-500 uppercase tracking-wide')}>Registries</div>
					<div class={cn('text-2xl font-semibold text-gray-900 dark:text-gray-100')}>
						{FILE_REGISTRY_ID ? 1 : 0}
					</div>
				</div>
			</div>
		{/if}

		<div class={cn('flex flex-col sm:flex-row gap-3 mb-4')}>
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search by name or ID…"
				class={cn(
					'flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg',
					'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
				)}
			/>
			<select
				bind:value={kindFilter}
				class={cn(
					'px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg',
					'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
				)}
			>
				<option value="all">All types</option>
				<option value="extension">Extensions</option>
				<option value="codex">Codices</option>
			</select>
		</div>

		<nav class={cn('flex border-b border-gray-200 dark:border-gray-700 mb-5 overflow-x-auto')} role="tablist">
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'installed'}
				onclick={() => (activeTab = 'installed')}
				class="chrome-tab {activeTab === 'installed' ? 'is-on' : ''}"
				title="Installed"
			>
				Installed
				<span class={cn('chrome-count text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700')}>{installed.length}</span>
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === 'available'}
				onclick={() => (activeTab = 'available')}
				class="chrome-tab {activeTab === 'available' ? 'is-on' : ''}"
				title="Available"
			>
				Available
				<span class={cn('chrome-count text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700')}>{actionableCount}</span>
			</button>
			{#if mpAvailable}
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'marketplace'}
					onclick={() => {
						activeTab = 'marketplace';
						if (!mpLoaded) void loadMarketplace();
					}}
					class="chrome-tab {activeTab === 'marketplace' ? 'is-on' : ''}"
					title="Marketplace"
				>
					Marketplace
				</button>
			{/if}
		</nav>

		{#if activeTab === 'installed'}
			<div class={cn('bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 py-4 sm:border sm:rounded-xl sm:p-4 md:p-5')}>
				<div class={cn('flex flex-wrap items-center gap-2 mb-4')}>
					<button
						onclick={() => (installedFilter = 'all')}
						class={cn(
							'px-3 py-1 text-xs font-medium rounded-full border',
							installedFilter === 'all'
								? 'bg-indigo-50 border-indigo-200 text-indigo-700'
								: 'border-gray-200 text-gray-600',
						)}
					>
						All
					</button>
					<button
						onclick={() => (installedFilter = 'updates')}
						class={cn(
							'px-3 py-1 text-xs font-medium rounded-full border',
							installedFilter === 'updates'
								? 'bg-amber-50 border-amber-200 text-amber-700'
								: 'border-gray-200 text-gray-600',
						)}
					>
						Updates only ({updateCount})
					</button>
				</div>

				{#if installedLoading}
					<p class={cn('text-sm text-gray-500 text-center py-12')}>Loading installed packages…</p>
				{:else if installedError}
					<div class={cn('p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800')}>{installedError}</div>
				{:else if filteredInstalled.length === 0}
					<p class={cn('text-sm text-gray-500 text-center py-12')}>
						{installed.length === 0
							? 'No packages installed yet. Check the Available tab to install from a registry.'
							: 'No packages match your filters.'}
					</p>
				{:else if narrow}
					<div class={cn('divide-y divide-gray-100 dark:divide-gray-700')}>
						{#each filteredInstalled as item (rowKey(item.kind, item.id))}
							{@const st = statusFor(item)}
							{@const cat = findCatalogEntry(item)}
							{@const stBadge = statusBadge(st)}
							{@const rowBusy = busy[rowKey(item.kind, item.id)]}
							{@const menuKey = rowKey(item.kind, item.id)}
							<article class={cn('py-3 relative')}>
								<div class={cn('flex items-start justify-between gap-3')}>
									<div class={cn('min-w-0')}>
										<div class={cn('font-medium text-gray-900 dark:text-gray-100')}>
											{displayName(item.manifest, item.id)}
										</div>
										<div class={cn('text-xs font-mono text-gray-500')}>{item.id}</div>
									</div>
									<span class={cn('shrink-0 inline-block text-xs font-medium px-2 py-0.5 rounded-full', stBadge.cls)}>
										{stBadge.label}
									</span>
								</div>
								<div class={cn('mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500')}>
									<span class={cn('inline-block font-medium px-2 py-0.5 rounded-full', kindBadge(item.kind))}>
										{item.kind}
									</span>
									<span>{item.version || '—'}{cat?.latest ? ` → ${cat.latest}` : ''}</span>
								</div>
								{#if displayDescription(item.manifest)}
									<div class={cn('text-xs text-gray-500 mt-1')}>{displayDescription(item.manifest)}</div>
								{/if}
								<div class={cn('mt-2')}>
									{#if rowBusy}
										<span class={cn('inline-flex items-center gap-1.5 text-xs text-gray-500')}>
											{@html spinnerSvg}
											{rowBusy}
										</span>
									{:else}
										<div class={cn('inline-flex items-center gap-1.5')}>
											{#if st === 'outdated'}
												<button
													onclick={() => updateInstalled(item)}
													class={cn('text-xs font-medium px-3 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700')}
												>
													Update
												</button>
											{/if}
											<button
												onclick={(e) => {
													e.stopPropagation();
													openMenuKey = openMenuKey === menuKey ? null : menuKey;
												}}
												class={cn('text-xs font-medium px-2 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50')}
												aria-label="More actions"
											>
												⋯
											</button>
										</div>
										{#if openMenuKey === menuKey}
											<div
												role="menu"
												onclick={(e) => e.stopPropagation()}
												class={cn(
													'absolute right-0 top-full mt-1 z-20 min-w-[140px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 text-left',
												)}
											>
												{#if !PROTECTED_IDS.has(item.id)}
													<button
														onclick={() => uninstall(item)}
														class={cn('block w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20')}
													>
														Uninstall…
													</button>
												{/if}
											</div>
										{/if}
									{/if}
								</div>
							</article>
						{/each}
					</div>
				{:else}
					<div class={cn('overflow-x-auto')}>
						<table class={cn('w-full text-sm')}>
							<thead>
								<tr class={cn('bg-gray-50 dark:bg-gray-700/50')}>
									<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase')}>Package</th>
									<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase')}>Type</th>
									<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase')}>Installed</th>
									<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase')}>Latest</th>
									<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase')}>Status</th>
									<th class={cn('px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase')}>Actions</th>
								</tr>
							</thead>
							<tbody class={cn('divide-y divide-gray-100 dark:divide-gray-700')}>
								{#each filteredInstalled as item (rowKey(item.kind, item.id))}
									{@const st = statusFor(item)}
									{@const cat = findCatalogEntry(item)}
									{@const stBadge = statusBadge(st)}
									{@const rowBusy = busy[rowKey(item.kind, item.id)]}
									{@const menuKey = rowKey(item.kind, item.id)}
									<tr class={cn('hover:bg-gray-50 dark:hover:bg-gray-700/30')}>
										<td class={cn('px-4 py-3')}>
											<div class={cn('font-medium text-gray-900 dark:text-gray-100')}>
												{displayName(item.manifest, item.id)}
											</div>
											<div class={cn('text-xs font-mono text-gray-500')}>{item.id}</div>
											{#if displayDescription(item.manifest)}
												<div class={cn('text-xs text-gray-500 mt-0.5 max-w-md')}>{displayDescription(item.manifest)}</div>
											{/if}
										</td>
										<td class={cn('px-4 py-3')}>
											<span class={cn('inline-block text-xs font-medium px-2 py-0.5 rounded-full', kindBadge(item.kind))}>
												{item.kind}
											</span>
										</td>
										<td class={cn('px-4 py-3')}>{item.version || '—'}</td>
										<td class={cn('px-4 py-3')}>{cat?.latest ?? '—'}</td>
										<td class={cn('px-4 py-3')}>
											<span class={cn('inline-block text-xs font-medium px-2 py-0.5 rounded-full', stBadge.cls)}>
												{stBadge.label}
											</span>
										</td>
										<td class={cn('px-4 py-3 text-right whitespace-nowrap relative')}>
											{#if rowBusy}
												<span class={cn('inline-flex items-center gap-1.5 text-xs text-gray-500')}>
													{@html spinnerSvg}
													{rowBusy}
												</span>
											{:else}
												<div class={cn('inline-flex items-center gap-1.5 justify-end')}>
													{#if st === 'outdated'}
														<button
															onclick={() => updateInstalled(item)}
															class={cn('text-xs font-medium px-3 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700')}
														>
															Update
														</button>
													{/if}
													<button
														onclick={(e) => {
															e.stopPropagation();
															openMenuKey = openMenuKey === menuKey ? null : menuKey;
														}}
														class={cn('text-xs font-medium px-2 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50')}
														aria-label="More actions"
													>
														⋯
													</button>
												</div>
												{#if openMenuKey === menuKey}
													<div
														role="menu"
														onclick={(e) => e.stopPropagation()}
														class={cn(
															'absolute right-4 top-full mt-1 z-20 min-w-[140px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 text-left',
														)}
													>
														{#if !PROTECTED_IDS.has(item.id)}
															<button
																onclick={() => uninstall(item)}
																class={cn('block w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20')}
															>
																Uninstall…
															</button>
														{/if}
													</div>
												{/if}
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'available'}
			<div class={cn('bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 py-4 sm:border sm:rounded-xl sm:p-4 md:p-5')}>
				<div class={cn('flex flex-wrap items-center gap-2 mb-4')}>
					<button
						onclick={() => (availableFilter = 'actionable')}
						class={cn(
							'px-3 py-1 text-xs font-medium rounded-full border',
							availableFilter === 'actionable'
								? 'bg-indigo-50 border-indigo-200 text-indigo-700'
								: 'border-gray-200 text-gray-600',
						)}
					>
						Needs action ({actionableCount})
					</button>
					<button
						onclick={() => (availableFilter = 'all')}
						class={cn(
							'px-3 py-1 text-xs font-medium rounded-full border',
							availableFilter === 'all'
								? 'bg-indigo-50 border-indigo-200 text-indigo-700'
								: 'border-gray-200 text-gray-600',
						)}
					>
						Show all registry ({registryEntries.length})
					</button>
				</div>

				{#if !FILE_REGISTRY_ID}
					<p class={cn('text-sm text-gray-500 text-center py-12')}>
						No file registry configured for this realm.
					</p>
				{:else}
					{#if registryErrors.length > 0}
						<div class={cn('space-y-2 mb-4')}>
							{#each registryErrors as err}
								<div class={cn('p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800')}>{err}</div>
							{/each}
						</div>
					{/if}

					{#if registryLoading}
						<p class={cn('text-sm text-gray-500 text-center py-12')}>Loading registry catalog…</p>
					{:else if filteredAvailable.length === 0}
						<p class={cn('text-sm text-gray-500 text-center py-12')}>
							{availableFilter === 'actionable'
								? 'Everything from the registry is installed and up to date.'
								: 'No packages match your filters.'}
						</p>
					{:else if narrow}
						<div class={cn('divide-y divide-gray-100 dark:divide-gray-700')}>
							{#each filteredAvailable as entry (rowKey(entry.kind, entry.id))}
								{@const installedItem = isInstalled(entry)}
								{@const installedVersion = installedItem?.version ?? ''}
								{@const isOutdated =
									installedItem &&
									entry.latest &&
									installedVersion &&
									compareVersions(entry.latest, installedVersion) > 0}
								{@const rowBusy = busy[rowKey(entry.kind, entry.id)]}
								{@const verKey = rowKey(entry.kind, entry.id)}
								<article class={cn('py-3')}>
									<div class={cn('flex items-start justify-between gap-3')}>
										<div class={cn('min-w-0')}>
											<div class={cn('font-medium text-gray-900 dark:text-gray-100')}>
												{displayName(entry.manifest, entry.id)}
											</div>
											<div class={cn('text-xs font-mono text-gray-500')}>{entry.id}</div>
										</div>
										{#if isOutdated}
											<span class={cn('shrink-0 inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800')}>
												update available
											</span>
										{:else if installedItem}
											<span class={cn('shrink-0 inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800')}>
												installed
											</span>
										{:else}
											<span class={cn('shrink-0 inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600')}>
												not installed
											</span>
										{/if}
									</div>
									<div class={cn('mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500')}>
										<span class={cn('inline-block font-medium px-2 py-0.5 rounded-full', kindBadge(entry.kind))}>
											{entry.kind}
										</span>
										{#if entry.versions.length > 1}
											<select
												class={cn('text-xs border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-800')}
												value={selectedVersionFor(entry)}
												onchange={(e) => {
													selectedVersions = {
														...selectedVersions,
														[verKey]: (e.currentTarget as HTMLSelectElement).value,
													};
												}}
											>
												{#each [...entry.versions].sort((a, b) => compareVersions(b, a)) as v}
													<option value={v}>{v}{v === entry.latest ? ' (latest)' : ''}</option>
												{/each}
											</select>
										{:else}
											<span>{entry.latest || '—'}</span>
										{/if}
									</div>
									{#if displayDescription(entry.manifest)}
										<div class={cn('text-xs text-gray-500 mt-1')}>{displayDescription(entry.manifest)}</div>
									{/if}
									<div class={cn('mt-2')}>
										{#if rowBusy}
											<span class={cn('inline-flex items-center gap-1.5 text-xs text-gray-500')}>
												{@html spinnerSvg}
												{rowBusy}
											</span>
										{:else if !installedItem}
											<button
												onclick={() => installFromRegistry(entry, selectedVersionFor(entry))}
												disabled={!selectedVersionFor(entry)}
												class={cn('text-xs font-medium px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50')}
											>
												Install
											</button>
										{:else if isOutdated}
											<button
												onclick={() => installFromRegistry(entry, selectedVersionFor(entry))}
												class={cn('text-xs font-medium px-3 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700')}
											>
												Update
											</button>
										{:else}
											<span class={cn('text-xs text-gray-400')}>Up to date</span>
										{/if}
									</div>
								</article>
							{/each}
						</div>
					{:else}
						<div class={cn('overflow-x-auto')}>
							<table class={cn('w-full text-sm')}>
								<thead>
									<tr class={cn('bg-gray-50 dark:bg-gray-700/50')}>
										<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase')}>Package</th>
										<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase')}>Type</th>
										<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase')}>Version</th>
										<th class={cn('px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase')}>Status</th>
										<th class={cn('px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase')}>Actions</th>
									</tr>
								</thead>
								<tbody class={cn('divide-y divide-gray-100 dark:divide-gray-700')}>
									{#each filteredAvailable as entry (rowKey(entry.kind, entry.id))}
										{@const installedItem = isInstalled(entry)}
										{@const installedVersion = installedItem?.version ?? ''}
										{@const isOutdated =
											installedItem &&
											entry.latest &&
											installedVersion &&
											compareVersions(entry.latest, installedVersion) > 0}
										{@const rowBusy = busy[rowKey(entry.kind, entry.id)]}
										{@const verKey = rowKey(entry.kind, entry.id)}
										<tr class={cn('hover:bg-gray-50 dark:hover:bg-gray-700/30')}>
											<td class={cn('px-4 py-3')}>
												<div class={cn('font-medium text-gray-900 dark:text-gray-100')}>
													{displayName(entry.manifest, entry.id)}
												</div>
												<div class={cn('text-xs font-mono text-gray-500')}>{entry.id}</div>
												{#if displayDescription(entry.manifest)}
													<div class={cn('text-xs text-gray-500 mt-0.5 max-w-md')}>{displayDescription(entry.manifest)}</div>
												{/if}
											</td>
											<td class={cn('px-4 py-3')}>
												<span class={cn('inline-block text-xs font-medium px-2 py-0.5 rounded-full', kindBadge(entry.kind))}>
													{entry.kind}
												</span>
											</td>
											<td class={cn('px-4 py-3')}>
												{#if entry.versions.length > 1}
													<select
														class={cn('text-xs border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-800')}
														value={selectedVersionFor(entry)}
														onchange={(e) => {
															selectedVersions = {
																...selectedVersions,
																[verKey]: (e.currentTarget as HTMLSelectElement).value,
															};
														}}
													>
														{#each [...entry.versions].sort((a, b) => compareVersions(b, a)) as v}
															<option value={v}>{v}{v === entry.latest ? ' (latest)' : ''}</option>
														{/each}
													</select>
												{:else}
													{entry.latest || '—'}
												{/if}
											</td>
											<td class={cn('px-4 py-3')}>
												{#if isOutdated}
													<span class={cn('inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800')}>
														update available
													</span>
												{:else if installedItem}
													<span class={cn('inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800')}>
														installed
													</span>
												{:else}
													<span class={cn('inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600')}>
														not installed
													</span>
												{/if}
											</td>
											<td class={cn('px-4 py-3 text-right whitespace-nowrap')}>
												{#if rowBusy}
													<span class={cn('inline-flex items-center gap-1.5 text-xs text-gray-500')}>
														{@html spinnerSvg}
														{rowBusy}
													</span>
												{:else if !installedItem}
													<button
														onclick={() => installFromRegistry(entry, selectedVersionFor(entry))}
														disabled={!selectedVersionFor(entry)}
														class={cn('text-xs font-medium px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50')}
													>
														Install
													</button>
												{:else if isOutdated}
													<button
														onclick={() => installFromRegistry(entry, selectedVersionFor(entry))}
														class={cn('text-xs font-medium px-3 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700')}
													>
														Update
													</button>
												{:else}
													<span class={cn('text-xs text-gray-400')}>Up to date</span>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				{/if}
			</div>
		{/if}

		{#if activeTab === 'marketplace'}
			<div class={cn('bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 py-4 sm:border sm:rounded-xl sm:p-4 md:p-5')}>
				<div class={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4')}>
					<p class={cn('text-sm text-gray-600 dark:text-gray-400')}>
						Paid and third-party offerings from the shared marketplace. Once acquired, packages
						appear in the file registry catalog under the Available tab.
					</p>
					<div class={cn('flex gap-2')}>
						<input
							type="search"
							bind:value={mpSearch}
							onkeydown={(e) => e.key === 'Enter' && loadMarketplace()}
							placeholder="Search marketplace…"
							class={cn(
								'px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg',
								'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
							)}
						/>
						<button
							onclick={() => loadMarketplace()}
							disabled={mpLoading}
							class={cn('px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50')}
						>
							Search
						</button>
					</div>
				</div>

				{#if mpError}
					<div class={cn('mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm')}>
						{mpError}
						<button onclick={() => (mpError = '')} class={cn('ml-2 text-red-600 hover:text-red-800 font-bold')}>&times;</button>
					</div>
				{/if}

				{#if mpLoading}
					<div class={cn('flex items-center justify-center py-12')}>
						<svg class={cn('animate-spin h-6 w-6 text-gray-400')} viewBox="0 0 24 24" fill="none">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
						<span class={cn('ml-3 text-sm text-gray-500')}>Loading marketplace…</span>
					</div>
				{:else if mpListings.length === 0}
					<p class={cn('text-center text-sm text-gray-500 py-12')}>
						{mpLoaded ? 'No marketplace listings found.' : 'Press Search to load marketplace listings.'}
					</p>
				{:else}
					<div class={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4')}>
						{#each mpListings as ext (ext.extension_id || ext.id || ext.name)}
							{@const extId = ext.extension_id || ext.id || ext.name}
							{@const owned = mpPurchasedIds.has(extId)}
							{@const isFree = Number(ext.price_e8s) === 0}
							<div class={cn('border-y border-gray-200 dark:border-gray-700 py-4 sm:border sm:rounded-xl sm:p-4 flex flex-col')}>
								<div class={cn('flex justify-between items-start mb-2')}>
									<div>
										<h3 class={cn('font-semibold text-gray-900 dark:text-gray-100 capitalize')}>
											{(ext.name || extId).replace(/_/g, ' ')}
										</h3>
										<p class={cn('text-xs text-gray-500')}>v{ext.version || '1.0'}</p>
									</div>
									<span class={cn(
										'px-2.5 py-0.5 rounded-full text-xs font-medium',
										isFree ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
									)}>
										{formatICP(ext.price_e8s)}
									</span>
								</div>
								{#if ext.description}
									<p class={cn('text-sm text-gray-600 dark:text-gray-400 mb-3 flex-grow line-clamp-2')}>{ext.description}</p>
								{:else}
									<div class={cn('flex-grow')}></div>
								{/if}
								<div class={cn('text-xs text-gray-500 mb-3')}>{ext.downloads ?? 0} downloads</div>
								{#if owned}
									<span class={cn('w-full py-1.5 text-center rounded-lg bg-green-100 text-green-700 text-sm font-medium')}>Acquired</span>
								{:else}
									<button
										onclick={() => (mpSelected = ext)}
										class={cn(
											'w-full py-1.5 rounded-lg text-sm font-medium text-white',
											isFree ? 'bg-gray-800 hover:bg-gray-900' : 'bg-indigo-600 hover:bg-indigo-700',
										)}
									>
										{isFree ? 'Get' : 'Purchase'}
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

{#if mpSelected}
	{@const isFree = Number(mpSelected.price_e8s) === 0}
	<div class={cn('fixed inset-0 z-50 flex items-center justify-center p-4')}>
		<button
			type="button"
			aria-label="Close"
			class={cn('absolute inset-0 bg-black/50')}
			onclick={() => { if (!mpPurchasing) mpSelected = null; }}
		></button>
		<div class={cn('relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6')}>
			<h3 class={cn('text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3')}>
				{isFree ? 'Confirm' : 'Confirm Purchase'}
			</h3>
			<div class={cn('bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4')}>
				<h4 class={cn('font-semibold text-gray-900 dark:text-gray-100 capitalize')}>
					{(mpSelected.name || mpSelected.extension_id || '').replace(/_/g, ' ')}
				</h4>
				{#if mpSelected.description}
					<p class={cn('text-sm text-gray-600 dark:text-gray-400 mt-1')}>{mpSelected.description}</p>
				{/if}
			</div>
			<div class={cn('flex justify-between items-center py-3 border-t border-b border-gray-200 dark:border-gray-700 mb-4')}>
				<span class={cn('text-sm text-gray-600 dark:text-gray-400')}>Price</span>
				<span class={cn('text-xl font-bold text-gray-900 dark:text-gray-100')}>{formatICP(mpSelected.price_e8s)}</span>
			</div>
			{#if !isFree}
				<p class={cn('text-sm text-gray-500 mb-4')}>Payment will be deducted from your ICP balance.</p>
			{/if}
			<div class={cn('flex justify-end gap-3')}>
				<button
					onclick={() => (mpSelected = null)}
					disabled={mpPurchasing}
					class={cn('px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50')}
				>
					Cancel
				</button>
				<button
					onclick={mpConfirmPurchase}
					disabled={mpPurchasing}
					class={cn('px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg')}
				>
					{#if mpPurchasing}{@html spinnerSvg}{/if}
					{isFree ? 'Get' : 'Purchase'}
				</button>
			</div>
		</div>
	</div>
{/if}

<svelte:window onclick={() => (openMenuKey = null)} />
