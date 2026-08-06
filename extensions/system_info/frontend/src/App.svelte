<script lang="ts">
	import { onMount } from 'svelte';
	import { createExtensionClient, type ExtensionClient } from '@realmsgos/extension-bridge';
	import { PageHeader, Card, Button, EmptyState } from '@realmsgos/extension-ui';

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

	function bridgeErrorFields(err: unknown): { code: string; message: string } {
		if (err instanceof Error) {
			const code = (err as Error & { code?: string }).code ?? 'failed';
			return { code, message: err.message };
		}
		return { code: 'failed', message: String(err) };
	}

	async function fetchSystemInfo() {
		if (!ctx) return;
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			data = (await ctx.callExtension('get_system_info', {})) as SystemInfoData;
			lastRefresh = new Date().toLocaleString();
		} catch (e) {
			const { code, message } = bridgeErrorFields(e);
			if (code === 'denied') {
				accessDeniedOp = message;
				error = '';
			} else {
				accessDeniedOp = '';
				error = message;
			}
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

	function formatCycles(tc: number): string {
		if (tc >= 1) return `${tc.toFixed(2)} TC`;
		return `${(tc * 1000).toFixed(1)} GC`;
	}

	function formatBytes(bytes: number): string {
		if (!bytes && bytes !== 0) return '—';
		if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
		if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
		if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${bytes} B`;
	}

	function formatNumber(n: number): string {
		if (n == null) return '0';
		return n.toLocaleString();
	}

	function formatTimestamp(ns: number): string {
		if (!ns) return 'N/A';
		return new Date(ns / 1_000_000).toLocaleString();
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

<div class="mx-auto max-w-4xl space-y-6 px-4 pb-8">
	<PageHeader title="System Info" subtitle="Canister diagnostics & health dashboard">
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
				<EmptyState
					title="Access denied"
					message="You need additional permissions to view this page ({accessDeniedOp})."
				>
					{#snippet actions()}
						<Button tone="secondary" size="sm" onclick={fetchSystemInfo}>Retry</Button>
					{/snippet}
				</EmptyState>
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
					<p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Cycles</p>
					<p class="mt-1 text-xl font-bold text-indigo-600 dark:text-indigo-400">
						{formatCycles(data.canister?.cycles_tc || 0)}
					</p>
					<p class="mt-0.5 text-xs text-gray-400">{formatNumber(data.canister?.cycles || 0)}</p>
				{/snippet}
			</Card>
			<Card>
				{#snippet children()}
					<p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Stable Memory</p>
					<p class="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
						{data.canister?.stable_memory_mb || 0} MB
					</p>
					<p class="mt-0.5 text-xs text-gray-400">
						{formatNumber(data.canister?.stable_memory_pages || 0)} pages
					</p>
				{/snippet}
			</Card>
			<Card>
				{#snippet children()}
					<p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Entities</p>
					<p class="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
						{formatNumber(data.db?.total_entities || 0)}
					</p>
					<p class="mt-0.5 text-xs text-gray-400">{data.db?.entity_types || 0} types</p>
				{/snippet}
			</Card>
			<Card>
				{#snippet children()}
					<p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Files</p>
					<p class="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">
						{formatNumber(data.files?.total_files || 0)}
					</p>
					<p class="mt-0.5 text-xs text-gray-400">{formatBytes(data.files?.total_size_bytes || 0)}</p>
				{/snippet}
			</Card>
		</div>

		<Card title="Versions">
			{#snippet children()}
				<div class="divide-y divide-gray-100 dark:divide-gray-700">
					<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-yellow-400"></span>
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Python</span>
						</div>
						<span class="font-mono text-sm text-gray-500 dark:text-gray-400">{data.python?.version || 'N/A'}</span>
					</div>
					<div class="flex items-center justify-between py-3">
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-green-400"></span>
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Basilisk</span>
						</div>
						<div class="text-right">
							<span class="font-mono text-sm text-gray-500 dark:text-gray-400">{data.basilisk?.version || 'N/A'}</span>
							{#if data.basilisk?.rust_version}
								<span class="ml-2 text-xs text-gray-400 dark:text-gray-500">(Rust {data.basilisk.rust_version})</span>
							{/if}
						</div>
					</div>
					<div class="flex items-center justify-between py-3">
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-blue-400"></span>
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Realms</span>
						</div>
						<div class="text-right">
							<span class="font-mono text-sm text-gray-500 dark:text-gray-400">{data.realms?.version || 'N/A'}</span>
							{#if data.realms?.commit && !data.realms.commit.includes('PLACEHOLDER')}
								<span class="ml-2 text-xs text-gray-400 dark:text-gray-500">({data.realms.commit.slice(0, 7)})</span>
							{/if}
						</div>
					</div>
					{#if data.realms?.commit_datetime && !data.realms.commit_datetime.includes('PLACEHOLDER')}
						<div class="flex justify-end py-2">
							<span class="text-xs text-gray-400 dark:text-gray-500">Built: {data.realms.commit_datetime}</span>
						</div>
					{/if}
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
					{#if data.canister?.time_ns}
						<p class="mt-3 border-t border-gray-200 pt-2 text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
							Canister time: {formatTimestamp(data.canister.time_ns)}
						</p>
					{/if}
				{/snippet}
			</Card>
		{/if}

		{#if data.tokens?.tokens?.length > 0}
			<Card title="Token Balances">
				{#snippet children()}
					<div class="divide-y divide-gray-100 dark:divide-gray-700">
						{#each data.tokens.tokens as token}
							<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
								<div>
									<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{token.name}</span>
									<span class="ml-2 font-mono text-xs text-gray-400 dark:text-gray-500">{token.ledger?.slice(0, 10)}…</span>
								</div>
								<span class="font-mono text-sm text-gray-600 dark:text-gray-400">
									{(token.balance_raw / Math.pow(10, token.decimals || 8)).toFixed(
										token.decimals > 4 ? 4 : token.decimals || 8,
									)}
								</span>
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
								{#if ext.commit && !ext.commit.includes('PLACEHOLDER')}
									<p class="mt-0.5 font-mono text-xs text-gray-400 dark:text-gray-500">
										{ext.commit.slice(0, 7)} — {ext.commit_datetime}
									</p>
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

		{#if data.files?.top_extensions}
			<Card>
				{#snippet header()}
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold text-gray-900 dark:text-white">Filesystem</h2>
						<span class="text-xs text-gray-400 dark:text-gray-500">
							{formatNumber(data.files.total_files)} files, {formatBytes(data.files.total_size_bytes)}
						</span>
					</div>
				{/snippet}
				{#snippet children()}
					<div class="grid grid-cols-2 gap-px bg-gray-100 md:grid-cols-5 dark:bg-gray-700">
						{#each sortedEntries(data.files.top_extensions) as [ext, count]}
							<div class="bg-white px-3 py-2 text-center dark:bg-gray-800">
								<p class="font-mono text-xs text-gray-500 dark:text-gray-400">{ext}</p>
								<p class="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatNumber(count)}</p>
							</div>
						{/each}
					</div>
				{/snippet}
			</Card>
		{/if}

		{#if data.dependencies?.length > 0}
			<Card title="Dependencies">
				{#snippet children()}
					<div class="flex flex-wrap gap-x-4 gap-y-1">
						{#each data.dependencies as dep}
							<span class="font-mono text-xs text-gray-500 dark:text-gray-400">{dep}</span>
						{/each}
					</div>
				{/snippet}
			</Card>
		{/if}
	{/if}
</div>
