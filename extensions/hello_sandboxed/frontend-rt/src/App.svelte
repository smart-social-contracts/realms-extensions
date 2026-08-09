<script lang="ts">
	import { onMount } from 'svelte';
	import { createExtensionClient, BRIDGE_PROTOCOL_VERSION, type HostState } from '@realmsgos/extension-bridge';
	import { PageHeader, Card, Button } from '@realmsgos/extension-ui';

	let bridgeReady = $state(false);
	let bridgeError = $state('');
	let extensionId = $state('');
	let capabilities = $state<string[]>([]);
	let sdkVersion = $state('');

	let hostState = $state<HostState | null>(null);

	let greetResult = $state<{ ok: true; data: unknown } | { ok: false; code: string; message: string } | null>(
		null,
	);
	let allowlistResult = $state<{ ok: false; code: string; message: string } | null>(null);
	let modalActionId = $state('');
	let actionBusy = $state('');

	let ctx: Awaited<ReturnType<typeof createExtensionClient>> | null = null;

	function formatValue(value: unknown): string {
		if (value === null || value === undefined) return '—';
		if (typeof value === 'object') return JSON.stringify(value, null, 2);
		return String(value);
	}

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
			extensionId = client.extensionId;
			capabilities = [...client.capabilities];
			sdkVersion = BRIDGE_PROTOCOL_VERSION;
			bridgeReady = true;

			client.onStateChange((state) => {
				hostState = state;
				applyTheme(state.theme);
				queueMicrotask(reportHeight);
			});
		} catch (e) {
			bridgeError = e instanceof Error ? e.message : String(e);
		}
	}

	async function runGreet() {
		if (!ctx) return;
		actionBusy = 'greet';
		greetResult = null;
		try {
			const data = await ctx.callExtension('greet', { name: 'Sandbox' });
			greetResult = { ok: true, data };
		} catch (e) {
			const { code, message } = bridgeErrorFields(e);
			greetResult = { ok: false, code, message };
		} finally {
			actionBusy = '';
			queueMicrotask(reportHeight);
		}
	}

	async function runDisallowedFn() {
		if (!ctx) return;
		actionBusy = 'allowlist';
		allowlistResult = null;
		try {
			await ctx.callExtension('not_allowed_fn', {});
		} catch (e) {
			const { code, message } = bridgeErrorFields(e);
			allowlistResult = { ok: false, code, message };
		} finally {
			actionBusy = '';
			queueMicrotask(reportHeight);
		}
	}

	async function runModal() {
		if (!ctx) return;
		actionBusy = 'modal';
		modalActionId = '';
		try {
			const { actionId } = await ctx.openModal({
				title: 'Confirm action',
				body: 'This declarative modal is rendered by the host, not the extension iframe.',
				actions: [
					{ id: 'cancel', label: 'Cancel', tone: 'secondary' },
					{ id: 'confirm', label: 'Confirm', tone: 'primary' },
				],
			});
			modalActionId = actionId;
		} finally {
			actionBusy = '';
			queueMicrotask(reportHeight);
		}
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

<div class="mx-auto max-w-3xl space-y-6 px-4 pb-8">
	<PageHeader
		title="Hello (Sandboxed)"
		subtitle="This extension runs inside a sandboxed iframe (opaque origin, allow-scripts only). All host interaction goes through the @realmsgos/extension-bridge postMessage protocol."
	/>

	<Card title="Bridge status">
		{#snippet children()}
			{#if bridgeError}
				<p class="text-sm text-red-600 dark:text-red-400">Handshake failed: {bridgeError}</p>
			{:else if bridgeReady}
				<dl class="grid gap-3 text-sm sm:grid-cols-2">
					<div>
						<dt class="font-medium text-gray-500 dark:text-gray-400">extensionId</dt>
						<dd class="mt-0.5 font-mono text-gray-900 dark:text-gray-100">{extensionId}</dd>
					</div>
					<div>
						<dt class="font-medium text-gray-500 dark:text-gray-400">sdkVersion</dt>
						<dd class="mt-0.5 font-mono text-gray-900 dark:text-gray-100">{sdkVersion}</dd>
					</div>
					<div class="sm:col-span-2">
						<dt class="font-medium text-gray-500 dark:text-gray-400">capabilities</dt>
						<dd class="mt-0.5 font-mono text-gray-900 dark:text-gray-100">
							{capabilities.length ? capabilities.join(', ') : '—'}
						</dd>
					</div>
				</dl>
			{:else}
				<p class="text-sm text-gray-500 dark:text-gray-400">Waiting for host handshake…</p>
			{/if}
		{/snippet}
	</Card>

	<Card title="Host state">
		{#snippet children()}
			{#if hostState}
				<dl class="grid gap-3 text-sm sm:grid-cols-2">
					<div>
						<dt class="font-medium text-gray-500 dark:text-gray-400">principal</dt>
						<dd class="mt-0.5 break-all font-mono text-gray-900 dark:text-gray-100">
							{hostState.principal || '—'}
						</dd>
					</div>
					<div>
						<dt class="font-medium text-gray-500 dark:text-gray-400">locale</dt>
						<dd class="mt-0.5 font-mono text-gray-900 dark:text-gray-100">{hostState.locale}</dd>
					</div>
					<div>
						<dt class="font-medium text-gray-500 dark:text-gray-400">theme</dt>
						<dd class="mt-0.5 font-mono text-gray-900 dark:text-gray-100">{hostState.theme}</dd>
					</div>
					<div class="sm:col-span-2">
						<dt class="font-medium text-gray-500 dark:text-gray-400">realmInfo</dt>
						<dd class="mt-0.5">
							<pre
								class="overflow-x-auto rounded-md bg-gray-50 p-3 font-mono text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">{formatValue(hostState.realmInfo)}</pre>
						</dd>
					</div>
				</dl>
			{:else}
				<p class="text-sm text-gray-500 dark:text-gray-400">No host state yet.</p>
			{/if}
		{/snippet}
	</Card>

	<Card title="Actions">
		{#snippet children()}
			<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
				Each button exercises one bridge request. Results appear below the controls.
			</p>

			<div class="flex flex-wrap gap-2">
				<Button
					tone="primary"
					disabled={!bridgeReady || !!actionBusy}
					onclick={() => ctx?.notify('success', 'Hello from the sandboxed extension!')}
				>
					Notify (success toast)
				</Button>

				<Button
					tone="secondary"
					disabled={!bridgeReady || !!actionBusy}
					onclick={() => ctx?.navigate('/')}
				>
					Navigate to /
				</Button>

				<Button tone="secondary" disabled={!bridgeReady || actionBusy === 'modal'} onclick={runModal}>
					Open confirm modal
				</Button>

				<Button tone="secondary" disabled={!bridgeReady || actionBusy === 'greet'} onclick={runGreet}>
					callExtension('greet')
				</Button>

				<Button
					tone="secondary"
					disabled={!bridgeReady || actionBusy === 'allowlist'}
					onclick={runDisallowedFn}
				>
					callExtension('not_allowed_fn')
				</Button>
			</div>

			{#if modalActionId}
				<div class="mt-4 rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-900">
					<p class="font-medium text-gray-700 dark:text-gray-300">Modal result</p>
					<p class="mt-1 font-mono text-gray-600 dark:text-gray-400">actionId: {modalActionId}</p>
				</div>
			{/if}

			{#if greetResult}
				<div class="mt-4 rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-900">
					{#if greetResult.ok}
						<p class="font-medium text-gray-700 dark:text-gray-300">greet result (dev-server mock)</p>
						<pre
							class="mt-1 overflow-x-auto font-mono text-xs text-gray-600 dark:text-gray-400">{formatValue(greetResult.data)}</pre>
						<p class="mt-2 text-xs text-gray-500 dark:text-gray-500">
							In a deployed realm without a backend canister, this call fails at the host checkpoint with a
							typed error instead.
						</p>
					{:else}
						<p class="font-medium text-gray-700 dark:text-gray-300">
							expected: typed denial/failure demonstrates the checkpoint
						</p>
						<p class="mt-1 font-mono text-xs text-gray-600 dark:text-gray-400">
							code: {greetResult.code}
						</p>
						<p class="mt-1 font-mono text-xs text-gray-600 dark:text-gray-400">
							message: {greetResult.message}
						</p>
					{/if}
				</div>
			{/if}

			{#if allowlistResult}
				<div class="mt-4 rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-900">
					<p class="font-medium text-gray-700 dark:text-gray-300">
						expected: entry_access allowlist denial
					</p>
					<p class="mt-1 font-mono text-xs text-gray-600 dark:text-gray-400">
						code: {allowlistResult.code}
					</p>
					<p class="mt-1 font-mono text-xs text-gray-600 dark:text-gray-400">
						message: {allowlistResult.message}
					</p>
				</div>
			{/if}
		{/snippet}
	</Card>
</div>
