<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';

	let { ctx }: { ctx: any } = $props();

	let greetName = $state('Tester');
	let greetResult = $state('');
	let asyncResult = $state('');
	let universeData = $state('');
	let snapshotsData = $state('');
	let loading = $state<Record<string, boolean>>({});
	let error = $state('');
	let accessDeniedOp = $state('');

	let principal = $state('');
	let isAuthenticated = $state(false);

	$effect(() => {
		const unsubs: (() => void)[] = [];
		if (ctx.principal) unsubs.push(ctx.principal.subscribe((v: string) => (principal = v)));
		if (ctx.isAuthenticated) unsubs.push(ctx.isAuthenticated.subscribe((v: boolean) => (isAuthenticated = v)));
		return () => unsubs.forEach((u) => u());
	});

	const extensionId = ctx.config?.extensionId ?? 'test_bench';
	const version = ctx.config?.version ?? '';

	async function runTest(key: string, fn: () => Promise<void>) {
		loading = { ...loading, [key]: true };
		error = '';
		accessDeniedOp = '';
		try {
			await fn();
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = `${key}: ${e?.message ?? String(e)}`;
			}
		} finally {
			loading = { ...loading, [key]: false };
		}
	}

	async function doGreet() {
		await runTest('greet', async () => {
			const raw = await ctx.backend.greet(greetName);
			greetResult = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
		});
	}

	async function doAsync() {
		await runTest('async', async () => {
			const data = await ctx.callAsync('get_data', { data: 'from frontend-rt' });
			asyncResult = JSON.stringify(data, null, 2);
		});
	}

	async function doUniverse() {
		await runTest('universe', async () => {
			const raw = await ctx.backend.get_universe();
			const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
			universeData = JSON.stringify(parsed, null, 2);
		});
	}

	async function doSnapshots() {
		await runTest('snapshots', async () => {
			const raw = await ctx.backend.get_snapshots();
			const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
			snapshotsData = JSON.stringify(parsed, null, 2);
		});
	}
</script>

<div class="max-w-2xl mx-auto p-6 space-y-4">
	<div class="mb-2">
		<div class="flex items-center gap-3">
			<h2 class="text-2xl font-bold text-gray-900">Test Bench</h2>
			{#if version}
				<span class="inline-block rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5 text-xs font-medium">v{version}</span>
			{/if}
		</div>
		<p class="text-sm text-gray-500 mt-1">{extensionDescription}</p>
	</div>

	{#if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error}
		<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
	{/if}

	<!-- Greet Card -->
	<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
		<h3 class="text-base font-semibold text-gray-900 mb-3">Greet</h3>
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={greetName}
				placeholder="Name"
				class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
			/>
			<button
				onclick={doGreet}
				disabled={loading.greet}
				class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{loading.greet ? '...' : 'Greet'}
			</button>
		</div>
		{#if greetResult}
			<pre class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs font-mono whitespace-pre-wrap break-words max-h-72 overflow-y-auto">{greetResult}</pre>
		{/if}
	</div>

	<!-- Async Extension Call Card -->
	<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
		<h3 class="text-base font-semibold text-gray-900 mb-3">Extension Async Call</h3>
		<button
			onclick={doAsync}
			disabled={loading.async}
			class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{loading.async ? 'Running...' : 'Call get_data (async)'}
		</button>
		{#if asyncResult}
			<pre class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs font-mono whitespace-pre-wrap break-words max-h-72 overflow-y-auto">{asyncResult}</pre>
		{/if}
	</div>

	<!-- Universe Card -->
	<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
		<h3 class="text-base font-semibold text-gray-900 mb-3">Universe</h3>
		<button
			onclick={doUniverse}
			disabled={loading.universe}
			class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{loading.universe ? 'Loading...' : 'Get Universe'}
		</button>
		{#if universeData}
			<pre class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs font-mono whitespace-pre-wrap break-words max-h-72 overflow-y-auto">{universeData}</pre>
		{/if}
	</div>

	<!-- Snapshots Card -->
	<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
		<h3 class="text-base font-semibold text-gray-900 mb-3">Snapshots</h3>
		<button
			onclick={doSnapshots}
			disabled={loading.snapshots}
			class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{loading.snapshots ? 'Loading...' : 'Get Snapshots'}
		</button>
		{#if snapshotsData}
			<pre class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs font-mono whitespace-pre-wrap break-words max-h-72 overflow-y-auto">{snapshotsData}</pre>
		{/if}
	</div>

	<!-- Context Info Card -->
	<div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
		<h3 class="text-base font-semibold text-gray-900 mb-3">Context</h3>
		<dl class="divide-y divide-gray-100 text-sm">
			<div class="flex justify-between py-2">
				<dt class="text-gray-500">Extension ID</dt>
				<dd class="font-medium text-gray-900">{extensionId}</dd>
			</div>
			<div class="flex justify-between py-2">
				<dt class="text-gray-500">Principal</dt>
				<dd class="font-mono text-xs text-gray-900">{principal || '(anonymous)'}</dd>
			</div>
			<div class="flex justify-between py-2">
				<dt class="text-gray-500">Authenticated</dt>
				<dd class="font-medium text-gray-900">{isAuthenticated ? 'Yes' : 'No'}</dd>
			</div>
		</dl>
	</div>
</div>
