<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount } from 'svelte';
	import { createExtensionClient, type ExtensionClient, type RealmReply } from '@realmsgos/extension-bridge';
	import { PageHeader, Card, Button, EmptyState } from '@realmsgos/extension-ui';

	type Status = { version?: string; status?: string; name?: string; canister?: string; operations?: number };
	type Monitor = {
		status?: string;
		version?: string;
		installed_version?: string;
		operations?: number;
		events?: number;
		rows?: Record<string, number>;
		upgrade?: { version?: string; accepted_at?: number; approved_by?: string };
	};
	type Ext = { id: string; version?: string; status?: string; manifest?: { description?: string } };
	type Codex = { codex?: { id?: string; version?: string; installed_at?: number } | null; healthy?: boolean };
	type QuarterRow = {
		id: string;
		name?: string;
		status?: string;
		population?: number;
		capital?: boolean;
		drifting?: boolean;
	};
	type Quarters = { capital?: string; quarters?: QuarterRow[] };
	type Scale = { capacity?: number; scale_at?: number; enabled?: boolean; wanted?: boolean; in_flight?: boolean };
	type SystemInfoData = {
		status: Status | null;
		monitor: Monitor | null;
		extensions: Ext[] | null;
		codex: Codex | null;
		quarters: Quarters | null;
		scale: Scale | null;
	};

	const EXTENSION_PAGES = 5;

	let bridgeReady = $state(false);
	let bridgeError = $state(false);
	const EMPTY: SystemInfoData = { status: null, monitor: null, extensions: null, codex: null, quarters: null, scale: null };

	let info = $state<SystemInfoData | null>(null);
	// Non-null so the snippets below, which lose `{#if}` narrowing, still type-check.
	let data = $derived(info ?? EMPTY);
	let loading = $state(true);
	let unavailable = $state(false);
	let lastRefresh = $state('');

	let ctx: ExtensionClient | null = null;

	let entityTotal = $derived(Object.values(data?.monitor?.rows ?? {}).reduce((sum, n) => sum + (Number(n) || 0), 0));
	let stats = $derived.by(() => {
		const out: { label: string; value: string; sub: string; color: string }[] = [];
		if (data?.status) {
			out.push({
				label: 'Operations',
				value: formatNumber(data.status.operations),
				sub: data.status.status ? `realm ${data.status.status}` : '',
				color: 'text-indigo-600 dark:text-indigo-400',
			});
		}
		if (data?.monitor) {
			out.push({
				label: 'Events',
				value: formatNumber(data.monitor.events),
				sub: 'recorded',
				color: 'text-emerald-600 dark:text-emerald-400',
			});
			out.push({
				label: 'Entities',
				value: formatNumber(entityTotal),
				sub: `${Object.keys(data.monitor.rows ?? {}).length} types`,
				color: 'text-amber-600 dark:text-amber-400',
			});
		}
		if (data?.extensions) {
			out.push({
				label: 'Extensions',
				value: formatNumber(data.extensions.length),
				sub: 'installed',
				color: 'text-rose-600 dark:text-rose-400',
			});
		}
		return out;
	});

	function applyTheme(theme: 'light' | 'dark') {
		document.documentElement.classList.toggle('dark', theme === 'dark');
		document.documentElement.dataset.theme = theme;
	}

	function reportHeight() {
		ctx?.reportHeight(document.body.scrollHeight);
	}

	/** A declared realm read operation's reply, or null when the realm refuses it or the bridge denies it. */
	async function read<T>(name: string, args: Record<string, unknown> = {}): Promise<T | null> {
		if (!ctx) return null;
		try {
			const reply = await ctx.read<RealmReply>(name, args);
			return reply?.ok ? (reply as unknown as T) : null;
		} catch {
			return null;
		}
	}

	async function readExtensions(): Promise<Ext[] | null> {
		const all: Ext[] = [];
		let from: number | null = 1;
		for (let i = 0; i < EXTENSION_PAGES && from != null; i++) {
			const page: { extensions?: Ext[]; next?: number | null } | null = await read('extension_list', {
				from,
				count: 500,
			});
			if (!page) return i === 0 ? null : all;
			all.push(...(page.extensions ?? []));
			from = page.next ?? null;
		}
		return all;
	}

	async function fetchSystemInfo() {
		if (!ctx) return;
		loading = true;
		try {
			const [status, monitor, extensions, codex, quarters, scale] = await Promise.all([
				read<Status>('status'),
				read<Monitor>('realm_monitor'),
				readExtensions(),
				read<Codex>('codex_status', { count: 1 }),
				read<Quarters>('quarter_directory'),
				read<Scale>('scale_status'),
			]);
			const next = { status, monitor, extensions, codex, quarters, scale };
			unavailable = Object.values(next).every((v) => v == null);
			if (!unavailable) {
				info = next;
				lastRefresh = new Date().toLocaleString();
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
		} catch {
			bridgeError = true;
			loading = false;
		}
	}

	function formatNumber(n: unknown): string {
		const v = Number(n);
		return Number.isFinite(v) ? v.toLocaleString() : '0';
	}

	function formatVersion(v: string | undefined): string {
		if (!v) return '—';
		return v.includes('PLACEHOLDER') ? 'development build' : v;
	}

	function formatSeconds(s: unknown): string {
		const v = Number(s);
		return Number.isFinite(v) && v > 0 ? new Date(v * 1000).toLocaleString() : '';
	}

	function sortedEntries(obj: Record<string, number> | undefined): [string, number][] {
		return Object.entries(obj ?? {})
			.map(([k, v]) => [k, Number(v) || 0] as [string, number])
			.sort((a, b) => b[1] - a[1]);
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
		<Card>
			{#snippet children()}
				<EmptyState title="Not connected" message="Couldn't reach the realm. Reload the page to try again." />
			{/snippet}
		</Card>
	{:else if loading && !info}
		<Card>
			{#snippet children()}
				<EmptyState title="Loading system information…" />
			{/snippet}
		</Card>
	{:else if unavailable && !info}
		<Card>
			{#snippet children()}
				<EmptyState title="System information is unavailable right now" message="The realm didn't share any figures with your account.">
					{#snippet actions()}
						<Button tone="secondary" size="sm" onclick={fetchSystemInfo}>Retry</Button>
					{/snippet}
				</EmptyState>
			{/snippet}
		</Card>
	{:else if info}
		{#if stats.length > 0}
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				{#each stats as stat (stat.label)}
					<Card>
						{#snippet children()}
							<p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{stat.label}</p>
							<p class="mt-1 text-xl font-bold {stat.color}">{stat.value}</p>
							<p class="mt-0.5 text-xs text-gray-400">{stat.sub}</p>
						{/snippet}
					</Card>
				{/each}
			</div>
		{/if}

		<Card title="Versions">
			{#snippet children()}
				<div class="divide-y divide-gray-100 dark:divide-gray-700">
					{#if data.status?.name}
						<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
							<div class="flex items-center gap-2">
								<span class="h-2 w-2 rounded-full bg-yellow-400"></span>
								<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Realm</span>
							</div>
							<div class="text-right">
								<span class="text-sm text-gray-500 dark:text-gray-400">{data.status.name}</span>
								{#if data.status.status}
									<span class="ml-2 text-xs text-gray-400 dark:text-gray-500">({data.status.status})</span>
								{/if}
							</div>
						</div>
					{/if}
					<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
						<div class="flex items-center gap-2">
							<span class="h-2 w-2 rounded-full bg-blue-400"></span>
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Realms</span>
						</div>
						<div class="text-right">
							<span class="font-mono text-sm text-gray-500 dark:text-gray-400">
								{formatVersion(data.status?.version || data.monitor?.version)}
							</span>
							{#if data.monitor?.installed_version && data.monitor.installed_version !== (data.status?.version || data.monitor.version)}
								<span class="ml-2 text-xs text-gray-400 dark:text-gray-500">
									(installed {formatVersion(data.monitor.installed_version)})
								</span>
							{/if}
						</div>
					</div>
					{#if data.codex}
						<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
							<div class="flex items-center gap-2">
								<span class="h-2 w-2 rounded-full {data.codex.healthy ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}"></span>
								<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Codex</span>
							</div>
							<div class="text-right">
								{#if data.codex.codex}
									<span class="font-mono text-sm text-gray-500 dark:text-gray-400">
										{(data.codex.codex.id ?? '').split('@')[0]} {data.codex.codex.version ? `v${data.codex.codex.version}` : ''}
									</span>
									{#if !data.codex.healthy}
										<span class="ml-2 text-xs text-amber-600 dark:text-amber-400">(last hook did not succeed)</span>
									{/if}
								{:else}
									<span class="text-sm text-gray-400 dark:text-gray-500">none installed</span>
								{/if}
							</div>
						</div>
					{/if}
					{#if data.monitor?.upgrade?.version}
						<div class="flex justify-end py-2">
							<span class="text-xs text-gray-400 dark:text-gray-500">
								Last accepted upgrade: {formatVersion(data.monitor.upgrade.version)}
								{#if formatSeconds(data.monitor.upgrade.accepted_at)}
									on {formatSeconds(data.monitor.upgrade.accepted_at)}
								{/if}
							</span>
						</div>
					{/if}
				</div>
			{/snippet}
		</Card>

		{#if data.status?.canister || data.quarters?.capital}
			<Card title="Canister IDs">
				{#snippet children()}
					<div class="divide-y divide-gray-100 dark:divide-gray-700">
						{#if data.status?.canister}
							<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
								<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Realm</span>
								<span class="font-mono text-sm text-gray-500 dark:text-gray-400">{data.status.canister}</span>
							</div>
						{/if}
						{#if data.quarters?.capital && data.quarters.capital !== data.status?.canister}
							<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
								<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Capital</span>
								<span class="font-mono text-sm text-gray-500 dark:text-gray-400">{data.quarters.capital}</span>
							</div>
						{/if}
					</div>
				{/snippet}
			</Card>
		{/if}

		{#if data.quarters?.quarters?.length}
			<Card>
				{#snippet header()}
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold text-gray-900 dark:text-white">Quarters</h2>
						{#if data?.scale?.capacity}
							<span class="text-xs text-gray-400 dark:text-gray-500">
								{formatNumber(data.scale.capacity)} members per quarter
							</span>
						{/if}
					</div>
				{/snippet}
				{#snippet children()}
					<div class="divide-y divide-gray-100 dark:divide-gray-700">
						{#each data?.quarters?.quarters ?? [] as q (q.id)}
							<div class="py-3 first:pt-0 last:pb-0">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
										{q.name || q.id}
										{#if q.capital}
											<span class="ml-1 text-xs text-indigo-600 dark:text-indigo-400">capital</span>
										{/if}
									</span>
									<span class="font-mono text-xs text-gray-500 dark:text-gray-400">
										{formatNumber(q.population)}{data?.scale?.capacity ? ` / ${formatNumber(data.scale.capacity)}` : ''} members
									</span>
								</div>
								<p class="mt-0.5 font-mono text-xs text-gray-400 dark:text-gray-500">
									{q.id}{q.status ? ` — ${q.status}` : ''}{q.drifting ? ' — codex differs from the capital' : ''}
								</p>
							</div>
						{/each}
					</div>
					{#if data?.scale}
						<p class="mt-3 border-t border-gray-200 pt-2 text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
							Auto-scaling {data.scale.enabled ? 'on' : 'off'}{data.scale.scale_at
								? ` (threshold ${formatNumber(data.scale.scale_at)} members)`
								: ''}{data.scale.in_flight ? '; a new quarter is being set up.' : data.scale.wanted ? '; a new quarter is wanted.' : '.'}
						</p>
					{/if}
				{/snippet}
			</Card>
		{/if}

		{#if data.extensions?.length}
			<Card>
				{#snippet header()}
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold text-gray-900 dark:text-white">Extensions</h2>
						<span class="text-xs text-gray-400 dark:text-gray-500">{formatNumber(data?.extensions?.length)} installed</span>
					</div>
				{/snippet}
				{#snippet children()}
					<div class="divide-y divide-gray-100 dark:divide-gray-700">
						{#each data?.extensions ?? [] as ext (ext.id)}
							<div class="py-3 first:pt-0 last:pb-0">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{ext.id}</span>
									<span class="font-mono text-xs text-gray-500 dark:text-gray-400">
										{ext.version ? `v${ext.version}` : ''}{ext.status && ext.status !== 'installed' ? ` — ${ext.status}` : ''}
									</span>
								</div>
								{#if ext.manifest?.description}
									<p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{ext.manifest.description}</p>
								{/if}
							</div>
						{/each}
					</div>
				{/snippet}
			</Card>
		{/if}

		{#if data.monitor?.rows}
			<Card>
				{#snippet header()}
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold text-gray-900 dark:text-white">Database Entities</h2>
						<span class="text-xs text-gray-400 dark:text-gray-500">{formatNumber(entityTotal)} total</span>
					</div>
				{/snippet}
				{#snippet children()}
					<div class="grid grid-cols-2 gap-px bg-gray-100 md:grid-cols-3 dark:bg-gray-700">
						{#each sortedEntries(data?.monitor?.rows) as [type, count]}
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

		<p class="text-xs text-gray-400 dark:text-gray-500">
			{#if !data.monitor}
				Health figures (events and stored records) are shown to holders of the realm.monitor permission.
			{/if}
			Cycles, memory, files, runtime versions, token balances and dependencies are not reported by this realm.
		</p>
	{/if}
</div>
