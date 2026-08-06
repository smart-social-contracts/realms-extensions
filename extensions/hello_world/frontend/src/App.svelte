<script lang="ts">
	import { onMount } from 'svelte';
	import { createExtensionClient, type HostState } from '@realmsgos/extension-bridge';
	import { PageHeader, Card, Button } from '@realmsgos/extension-ui';

	let bridgeReady = $state(false);
	let bridgeError = $state('');

	let name = $state('');
	let response = $state('');
	let loading = $state(false);
	let error = $state('');
	let accessDenied = $state(false);

	let canSubmit = $derived(bridgeReady && !loading && name.trim().length > 0);

	let ctx: Awaited<ReturnType<typeof createExtensionClient>> | null = null;

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

	async function initClient() {
		try {
			const client = await createExtensionClient();
			ctx = client;
			bridgeReady = true;

			client.onStateChange((state: HostState) => {
				applyTheme(state.theme);
				queueMicrotask(reportHeight);
			});
		} catch (e) {
			bridgeError = e instanceof Error ? e.message : String(e);
		}
	}

	async function greet() {
		if (!ctx) return;
		loading = true;
		error = '';
		accessDenied = false;
		response = '';
		try {
			const result = await ctx.callExtension<string>('greet', { name: name.trim() });
			response = typeof result === 'string' ? result : String(result);
		} catch (e) {
			const { code, message } = bridgeErrorFields(e);
			if (code === 'denied') {
				accessDenied = true;
				error = '';
			} else {
				accessDenied = false;
				error = message;
			}
		} finally {
			loading = false;
			queueMicrotask(reportHeight);
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && canSubmit) greet();
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

<div class="mx-auto max-w-md space-y-6 px-4 pb-8">
	<PageHeader
		title="Hello World"
		subtitle="Simple hello world extension — sandboxed runtime demo."
	/>

	{#if bridgeError}
		<Card title="Bridge error">
			{#snippet children()}
				<p class="text-sm text-red-600 dark:text-red-400">Handshake failed: {bridgeError}</p>
			{/snippet}
		</Card>
	{:else}
		<Card title="Greet">
			{#snippet children()}
				<label for="hw-name" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Your name
				</label>
				<input
					id="hw-name"
					type="text"
					placeholder="Enter your name..."
					bind:value={name}
					onkeydown={onKeydown}
					disabled={!bridgeReady || loading}
					class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
				/>

				<div class="mt-4">
					<Button tone="primary" disabled={!canSubmit} onclick={greet}>
						{#if loading}
							<svg class="mr-2 inline-block h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
							</svg>
							Calling backend…
						{:else}
							Say Hello
						{/if}
					</Button>
				</div>

				{#if !bridgeReady}
					<p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Waiting for host handshake…</p>
				{/if}

				{#if response}
					<div
						class="mt-4 rounded-lg border border-green-200 bg-green-50 p-3.5 dark:border-green-800 dark:bg-green-900/20"
					>
						<p class="text-sm font-medium text-green-800 dark:text-green-300">{response}</p>
					</div>
				{/if}

				{#if accessDenied}
					<div
						class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-800 dark:bg-amber-900/20"
					>
						<p class="text-sm text-amber-800 dark:text-amber-300">
							You need additional permissions to perform this action.
						</p>
					</div>
				{:else if error}
					<div
						class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3.5 dark:border-red-800 dark:bg-red-900/20"
					>
						<p class="text-sm text-red-800 dark:text-red-300">{error}</p>
					</div>
				{/if}
			{/snippet}
		</Card>
	{/if}
</div>
