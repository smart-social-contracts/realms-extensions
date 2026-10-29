<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount } from 'svelte';
	import { createExtensionClient, type ExtensionClient } from '@realmsgos/extension-bridge';
	import { PageHeader, Card, Button, EmptyState, AccessDenied } from '@realmsgos/extension-ui';

	type SystemInfoData = Record<string, any>;

	let bridgeReady = $state(false);
	let bridgeError = $state('');
	let data = $state<SystemInfoData | null>(null);
	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');
	let lastRefresh = $state('');

	let ctx: ExtensionClient | null = null;

	function applyTheme(theme: 'light' | 'dark') {
		document.documentElement.classList.toggle('dark', theme === 'dark');
		document.documentElement.dataset.theme = theme;
	}

	function reportHeight() {
		ctx?.reportHeight(document.body.scrollHeight);
	}

	async function installedExtensions(client: ExtensionClient) {
		const rows: { name: string; version: string; description?: string }[] = [];
		let from: number | null = 1;
		while (from) {
			const page = await client.read<any>('extension_list', { from, count: 100 });
			if (!page.ok) break;
			rows.push(
				...page.extensions.map((e: any) => ({ name: e.id, version: e.version, description: e.manifest?.description })),
			);
			from = page.next;
		}
		return rows;
	}

	async function fetchSystemInfo() {
		if (!ctx) return;
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const [status, monitor] = await Promise.all([ctx.read<any>('status'), ctx.read<any>('realm_monitor')]);
			if (!monitor.ok) {
				const needed = / needs (\S+)$/.exec(monitor.error)?.[1];
				if (needed) accessDeniedOp = needed;
				else error = monitor.error;
				return;
			}
			const counts: Record<string, number> = monitor.rows;
			const extensions = await installedExtensions(ctx);
			data = {
				realms: { version: monitor.version },
				canister: { canisters: status.ok ? { realm_backend: status.canister } : {} },
				db: {
					counts,
					total_entities: Object.values(counts).reduce((sum, n) => sum + n, 0),
					entity_types: Object.keys(counts).length,
				},
				extensions: { count: extensions.length, extensions },
			};
			lastRefresh = new Date().toLocaleString();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
			queueMicrotask(reportHeight);
		}
	}

	async function initClient() {
		try {
			const client = await createExtensionClient();
			ctx = client;
			bridgeReady = true;

			client.onStateChange((state) => {
				applyTheme(state.theme);
				queueMicrotask(reportHeight);
			});

			await fetchSystemInfo();
		} catch (e) {
			bridgeError = e instanceof Error ? e.message : String(e);
			loading = false;
		}
	}

	function formatNumber(n: number): string {
		if (n == null) return '0';
		return n.toLocaleString();
	}

	function entries(obj: unknown): [string, unknown][] {
		if (!obj || typeof obj !== 'object') return [];
		return Object.entries(obj);
	}

	function sortedEntries(obj: unknown): [string, number][] {
		return entries(obj).sort((a, b) => (b[1] as number) - (a[1] as number));
	}

	onMount(() => {
		void initClient();

		const observer = new ResizeObserver(() => reportHeight());
		observer.observe(document.body);
		queueMicrotask(reportHeight);

		return () => {
			observer.disconnect();
			ctx?.destroy();
		};
	});
</script>

<div class="w-full space-y-6 pb-8">
	<PageHeader title="System Info" subtitle={extensionDescription}>
		{#snippet actions()}
			<Button tone="secondary" size="sm" disabled={!bridgeReady || loading} onclick={fetchSystemInfo}>
				{#if loading}
					<svg class="mr-1.5 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
				{:else}
					<svg class="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				{/if}
				Refresh
			</Button>
		{/snippet}
	</PageHeader>

	{#if lastRefresh}
		<p class="text-xs text-gray-400 dark:text-gray-500">Last updated: {lastRefresh}</p>
	{/if}

	{#if bridgeError}
		<Card title="Bridge error">
			{#snippet children()}
				<p class="text-sm text-red-600 dark:text-red-400">Handshake failed: {bridgeError}</p>
			{/snippet}
		</Card>
	{:else if loading && !data}
		<Card>
			{#snippet children()}
				<EmptyState title="Loading system information…" />
			{/snippet}
		</Card>
	{:else if accessDeniedOp && !data}
		<Card>
			{#snippet children()}
				<AccessDenied
					operation="realm_monitor"
					message="You need additional permissions to view this page ({accessDeniedOp})."
				>
					{#snippet children()}
						<Button tone="secondary" size="sm" onclick={fetchSystemInfo}>Retry</Button>
					{/snippet}
				</AccessDenied>
			{/snippet}
		</Card>
	{:else if error && !data}
		<Card>
			{#snippet children()}
				<EmptyState title="Error loading system info" message={error}>
					{#snippet actions()}
						<Button tone="secondary" size="sm" onclick={fetchSystemInfo}>Retry</Button>
					{/snippet}
				</EmptyState>
			{/snippet}
		</Card>
	{:else if data}
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<Card>
				{#snippet children()}
					<p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Entities</p>
					<p class="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
						{formatNumber(data.db?.total_entities || 0)}
					</p>
					<p class="mt-0.5 text-xs text-gray-400">{data.db?.entity_types || 0} types</p>
				{/snippet}
			</Card>
		</div>
		<p class="text-xs text-gray-400 dark:text-gray-500">
			Cycles, memory, files, runtime versions, token balances and dependencies are not supported by this realm version.
		</p>

		<Card title="Versions">
			{#snippet children()}
				<div class="divide-y divide-gray-100 dark:divide-gray-700">
					<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-blue-400"></span>
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Realms</span>
						</div>
						<div class="text-right">
							<span class="font-mono text-sm text-gray-500 dark:text-gray-400">{data.realms?.version || 'N/A'}</span>
						</div>
					</div>
				</div>
			{/snippet}
		</Card>

		{#if data.canister?.canisters && Object.keys(data.canister.canisters).length > 0}
			<Card title="Canister IDs">
				{#snippet children()}
					<div class="divide-y divide-gray-100 dark:divide-gray-700">
						{#each entries(data.canister.canisters) as [role, id]}
							<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
								<span class="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{role}</span>
								<span class="font-mono text-sm text-gray-500 dark:text-gray-400">{id}</span>
							</div>
						{/each}
					</div>
				{/snippet}
			</Card>
		{/if}

		{#if data.extensions?.extensions?.length > 0}
			<Card>
				{#snippet header()}
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold text-gray-900 dark:text-white">Extensions</h2>
						<span class="text-xs text-gray-400 dark:text-gray-500">{data.extensions.count} installed</span>
					</div>
				{/snippet}
				{#snippet children()}
					<div class="divide-y divide-gray-100 dark:divide-gray-700">
						{#each data.extensions.extensions as ext}
							<div class="py-3 first:pt-0 last:pb-0">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{ext.name}</span>
									<span class="font-mono text-xs text-gray-500 dark:text-gray-400">v{ext.version}</span>
								</div>
								{#if ext.description}
									<p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{ext.description}</p>
								{/if}
							</div>
						{/each}
					</div>
				{/snippet}
			</Card>
		{/if}

		{#if data.db?.counts}
			<Card>
				{#snippet header()}
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold text-gray-900 dark:text-white">Database Entities</h2>
						<span class="text-xs text-gray-400 dark:text-gray-500">{formatNumber(data.db.total_entities)} total</span>
					</div>
				{/snippet}
				{#snippet children()}
					<div class="grid grid-cols-2 gap-px bg-gray-100 md:grid-cols-3 dark:bg-gray-700">
						{#each sortedEntries(data.db.counts) as [type, count]}
							<div class="flex items-center justify-between bg-white px-4 py-2.5 dark:bg-gray-800">
								<span class="text-xs text-gray-600 dark:text-gray-400">{type}</span>
								<span
									class="font-mono text-xs font-semibold {count > 0
										? 'text-gray-700 dark:text-gray-300'
										: 'text-gray-300 dark:text-gray-600'}"
								>
									{formatNumber(count)}
								</span>
							</div>
						{/each}
					</div>
				{/snippet}
			</Card>
		{/if}
	{/if}
</div>
