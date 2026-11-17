<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import AccessDenied from '../../../_shared/frontend-rt/AccessDenied.svelte';

	let { ctx }: { ctx: any } = $props();

	type Reply = { ok: boolean; error?: string; [key: string]: any };
	type Release = { version: string; module_hash: string; approved_by: string; accepted_at: number };
	type Scale = {
		quarters: number;
		members: number;
		capacity: number;
		enabled: boolean;
		wanted: boolean;
		inFlight: boolean;
	};

	const ACCESS_REFUSAL = /^\S+ needs (\S+)$/;

	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');

	// status (public)
	let realmCanisterId = $state('');
	let currentVersion = $state('');
	let realmStatus = $state('');

	// realm_monitor
	let monitorNote = $state('');
	let installedVersion = $state('');
	let lastRelease: Release | null = $state(null);

	// scale_status
	let scale: Scale | null = $state(null);

	// An accepted release the realm does not run yet.
	let pendingRelease = $derived(
		!!lastRelease && lastRelease.version !== currentVersion && lastRelease.version !== installedVersion,
	);

	// realm_upgrade
	let upgradeVersion = $state('');
	let upgradeHash = $state('');
	let upgradeLoading = $state(false);
	let upgradeError = $state('');
	let upgradeSuccess = $state('');

	async function call(write: boolean, name: string, args: Record<string, unknown> = {}): Promise<Reply> {
		try {
			const reply = await (write ? ctx.run(name, args) : ctx.read(name, args));
			if (reply && typeof reply === 'object') return reply;
		} catch (e: any) {
			return { ok: false, error: e?.message || `${name} did not answer` };
		}
		return { ok: false, error: `${name} did not answer` };
	}

	function text(value: unknown): string {
		return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
	}

	function count(value: unknown): number {
		const n = Number(value);
		return Number.isFinite(n) ? n : 0;
	}

	function toRelease(raw: any): Release | null {
		if (!raw || typeof raw !== 'object' || !raw.version) return null;
		return {
			version: text(raw.version),
			module_hash: text(raw.module_hash),
			approved_by: text(raw.approved_by),
			accepted_at: count(raw.accepted_at),
		};
	}

	function toScale(raw: Reply): Scale {
		const pops = raw.populations && typeof raw.populations === 'object' ? Object.values(raw.populations) : [];
		return {
			quarters: pops.length,
			members: pops.reduce((sum: number, p) => sum + count(p), 0),
			capacity: count(raw.capacity),
			enabled: !!raw.enabled,
			wanted: !!raw.wanted,
			inFlight: !!raw.in_flight,
		};
	}

	async function loadAll() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const [status, monitor, scaling] = await Promise.all([
				call(false, 'status'),
				call(false, 'realm_monitor'),
				call(false, 'scale_status'),
			]);

			if (status.ok) {
				currentVersion = text(status.version);
				realmStatus = text(status.status);
				realmCanisterId = text(status.canister) || text(ctx.config?.canisterId);
			} else {
				const needs = String(status.error ?? '').match(ACCESS_REFUSAL);
				if (needs || status.error === 'sign in first') accessDeniedOp = needs?.[1] ?? '';
				else error = String(status.error || 'status did not answer');
			}

			if (monitor.ok) {
				monitorNote = '';
				installedVersion = text(monitor.installed_version);
				lastRelease = toRelease(monitor.upgrade);
			} else {
				const needs = String(monitor.error ?? '').match(ACCESS_REFUSAL);
				monitorNote = needs
					? `Release details need the ${needs[1]} permission.`
					: 'Release details are not available right now.';
				installedVersion = '';
				lastRelease = null;
			}

			scale = scaling.ok ? toScale(scaling) : null;
		} finally {
			loading = false;
		}
	}

	async function handleUpgrade() {
		const version = upgradeVersion.trim();
		const module_hash = upgradeHash.trim();
		if (!version || !module_hash) return;
		upgradeLoading = true;
		upgradeError = '';
		upgradeSuccess = '';
		const reply = await call(true, 'realm_upgrade', { version, module_hash });
		if (!reply.ok) {
			upgradeError = String(reply.error || 'The realm did not accept this release.');
		} else if (reply.requires_vote) {
			upgradeSuccess = `Submitted for a vote as proposal ${text(reply.proposal)}. The release is accepted once the vote passes.`;
		} else {
			upgradeSuccess = `Release ${text(reply.version) || version} accepted. Casals will install it.`;
			upgradeVersion = '';
			upgradeHash = '';
			await loadAll();
		}
		upgradeLoading = false;
	}

	function formatDate(timestamp: number): string {
		if (!timestamp) return '—';
		return new Date(timestamp * 1000).toLocaleDateString(undefined, {
			year: 'numeric', month: 'short', day: 'numeric',
			hour: '2-digit', minute: '2-digit',
		});
	}

	function statusLabel(status: string): string {
		return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
	}

	function shortHash(hash: string): string {
		return hash.length > 24 ? `${hash.slice(0, 14)}…${hash.slice(-8)}` : hash;
	}

	$effect(() => {
		loadAll();
	});
</script>

<div class="w-full py-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
				<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
				</svg>
			</div>
			<div>
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Managed Services</h1>
				<p class="text-sm text-gray-500 dark:text-gray-400">{extensionDescription}</p>
			</div>
		</div>
		<button
			onclick={loadAll}
			disabled={loading}
			class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{#if loading}
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
				</svg>
			{:else}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			{/if}
			Refresh
		</button>
	</div>

	<!-- Loading -->
	{#if loading && !currentVersion}
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
			<svg class="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
			<p class="text-gray-500 dark:text-gray-400">Loading managed services...</p>
		</div>

	{:else if accessDeniedOp && !currentVersion}
		<AccessDenied operation={accessDeniedOp} />
	{:else if error && !currentVersion}
		<div class="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
			<p class="text-red-700 dark:text-red-300 font-medium">The realm did not answer: {error}</p>
			<button
				onclick={loadAll}
				class="mt-4 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
			>
				Retry
			</button>
		</div>

	{:else}
		<!-- Overview Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
				<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current Version</p>
				<p class="text-xl font-bold text-gray-900 dark:text-white mt-1 font-mono">
					{currentVersion || 'Unknown'}
				</p>
			</div>
			<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
				<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Accepted Release</p>
				<p class="text-xl font-bold mt-1 font-mono {pendingRelease ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}">
					{lastRelease?.version || (monitorNote ? 'Not available' : 'None yet')}
				</p>
				{#if pendingRelease}
					<span class="inline-flex items-center mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
						Waiting to be installed
					</span>
				{:else if installedVersion}
					<span class="text-xs text-gray-400 dark:text-gray-500 mt-1">
						Installed: <span class="font-mono">{installedVersion}</span>
					</span>
				{/if}
			</div>
			<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
				<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Realm Status</p>
				<p class="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
					{statusLabel(realmStatus)}
				</p>
				{#if realmStatus === 'setup'}
					<span class="text-xs text-gray-400 dark:text-gray-500 mt-1">Upgrades are accepted directly during setup</span>
				{:else if realmStatus}
					<span class="text-xs text-gray-400 dark:text-gray-500 mt-1">Upgrades go to a vote</span>
				{/if}
			</div>
		</div>

		<!-- Upgrade Action -->
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
			<div class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
				<h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Realm Upgrade</h2>
			</div>
			<div class="p-5 space-y-4">
				{#if pendingRelease && lastRelease}
					<div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
						<svg class="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div class="min-w-0">
							<p class="text-sm font-medium text-blue-800 dark:text-blue-200">
								Release <span class="font-mono">{lastRelease.version}</span> is accepted and waiting for Casals to install it.
							</p>
							<p class="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate">
								Accepted {formatDate(lastRelease.accepted_at)}{#if lastRelease.module_hash}{' · module '}<span class="font-mono">{shortHash(lastRelease.module_hash)}</span>{/if}
							</p>
						</div>
					</div>
				{:else if lastRelease}
					<div class="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
						<svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<p class="text-sm text-green-700 dark:text-green-300">
							Your realm runs the last accepted release (accepted {formatDate(lastRelease.accepted_at)}).
						</p>
					</div>
				{:else if monitorNote}
					<p class="text-sm text-gray-500 dark:text-gray-400">{monitorNote}</p>
				{:else}
					<p class="text-sm text-gray-500 dark:text-gray-400">No release has been accepted for this realm yet.</p>
				{/if}

				<div>
					<p class="text-sm text-gray-700 dark:text-gray-300">Accept a new release</p>
					<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
						Enter the release version and its backend wasm module hash. The realm accepts it only if its trust policy approves that exact module; Casals then installs it.
					</p>
					<div class="mt-3 flex flex-col md:flex-row gap-2">
						<input
							type="text"
							placeholder="Version"
							aria-label="Release version"
							bind:value={upgradeVersion}
							class="md:w-40 px-3 py-2 text-sm font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
						/>
						<input
							type="text"
							placeholder="sha256:…"
							aria-label="Module hash"
							bind:value={upgradeHash}
							class="flex-1 min-w-0 px-3 py-2 text-sm font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
						/>
						<button
							onclick={handleUpgrade}
							disabled={upgradeLoading || !upgradeVersion.trim() || !upgradeHash.trim()}
							class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if upgradeLoading}
								<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
								</svg>
								Submitting...
							{:else}
								Accept release
							{/if}
						</button>
					</div>
				</div>

				{#if upgradeError}
					<div class="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
						<p class="text-sm text-red-700 dark:text-red-300">{upgradeError}</p>
					</div>
				{/if}
				{#if upgradeSuccess}
					<div class="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
						<p class="text-sm text-green-700 dark:text-green-300">{upgradeSuccess}</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Hosting Capacity -->
		{#if scale}
			<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
				<div class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
					<h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Hosting Capacity</h2>
				</div>
				<div class="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Quarters</p>
						<p class="text-lg font-bold text-gray-900 dark:text-white mt-1">{scale.quarters}</p>
					</div>
					<div>
						<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Members</p>
						<p class="text-lg font-bold text-gray-900 dark:text-white mt-1">{scale.members}</p>
					</div>
					<div>
						<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Capacity per quarter</p>
						<p class="text-lg font-bold text-gray-900 dark:text-white mt-1">{scale.capacity || '—'}</p>
					</div>
					<div>
						<p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Auto-scaling</p>
						<p class="text-lg font-bold mt-1 {scale.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}">
							{scale.enabled ? 'On' : 'Off'}
						</p>
					</div>
				</div>
				{#if scale.inFlight}
					<p class="px-5 pb-5 text-sm text-blue-700 dark:text-blue-300">A new quarter is being set up.</p>
				{:else if scale.wanted}
					<p class="px-5 pb-5 text-sm text-amber-700 dark:text-amber-300">A quarter is close to capacity; a new quarter will be set up.</p>
				{/if}
			</div>
		{/if}

		<!-- Credits & Billing -->
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
			<div class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-5 py-3">
				<h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Credits &amp; Billing</h2>
			</div>
			<div class="p-5 space-y-3">
				<p class="text-sm text-gray-500 dark:text-gray-400">
					Credit balance, top-ups and transaction history are kept by the Realms billing service and are not shown here.
				</p>
				{#if realmCanisterId}
					<div>
						<p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Realm Canister ID (credit account)</p>
						<div class="flex items-center gap-2 mt-1">
							<code class="text-sm font-mono bg-white dark:bg-gray-800 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 flex-1 overflow-x-auto">
								{realmCanisterId}
							</code>
							<button
								onclick={() => navigator.clipboard?.writeText(realmCanisterId).catch(() => {})}
								class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
								title="Copy to clipboard"
							>
								<svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Realm Info Footer -->
		{#if realmCanisterId}
			<div class="text-center">
				<p class="text-xs text-gray-400 dark:text-gray-500">
					Realm canister: <span class="font-mono">{realmCanisterId}</span>
				</p>
			</div>
		{/if}
	{/if}
</div>
