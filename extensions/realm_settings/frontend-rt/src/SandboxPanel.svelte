<script lang="ts">
	import { onMount } from 'svelte';

	let {
		ctx,
		addToast,
	}: {
		ctx: any;
		addToast?: (msg: string, type?: 'success' | 'error') => void;
	} = $props();

	const cn = $derived(
		ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' ')),
	);

	interface HookMeta {
		name: string;
		desired_mode: string;
		resolved_mode: string;
		forced_in_process: boolean;
		sandbox_compatible: boolean;
	}

	interface ExtMeta {
		id: string;
		resolved_mode: string;
		reason: string;
		locked: boolean;
	}

	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let canConfigure = $state(false);
	let available = $state(false);

	let enabled = $state(true);
	let defaultMode = $state<'sandbox' | 'in_process'>('sandbox');
	let hookDefaultMode = $state<'sandbox' | 'in_process'>('sandbox');
	let budget = $state(10_000_000);

	let extensionMeta: ExtMeta[] = $state([]);
	let extensionOverrides: Record<string, string> = $state({});
	let hooks: HookMeta[] = $state([]);
	let hookOverrides: Record<string, string> = $state({});

	let voteConfirm: {
		summary: string;
		governedBy: string;
		policy: string;
		run: () => Promise<void>;
	} | null = $state(null);
	let voteConfirmBusy = $state(false);

	function notify(msg: string, type: 'success' | 'error' = 'success') {
		if (addToast) addToast(msg, type);
	}

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	function applyStatus(data: any) {
		available = !!data?.available;
		canConfigure = !!data?.caller_can_configure;
		const cfg = data?.config || {};
		enabled = !!cfg.enabled;
		defaultMode = cfg.default_mode === 'in_process' ? 'in_process' : 'sandbox';
		budget = typeof cfg.budget === 'number' ? cfg.budget : 10_000_000;
		extensionOverrides = { ...(cfg.extensions || {}) };
		const ch = cfg.codex_hooks || {};
		hookDefaultMode = ch.default_mode === 'in_process' ? 'in_process' : 'sandbox';
		hookOverrides = { ...(ch.hooks || {}) };
		extensionMeta = Array.isArray(data?.extensions) ? data.extensions : [];
		hooks = Array.isArray(data?.hooks) ? data.hooks : [];
	}

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await callExt('get_sandbox_config');
			if (res?.success) {
				applyStatus(res.data);
			} else {
				canConfigure = false;
				error = res?.error || 'Failed to load sandbox config';
				if (res?.denied_operation) {
					error = `Requires permission: ${res.denied_operation}`;
				}
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			error = op ? `Requires permission: ${op}` : e?.message || String(e);
			canConfigure = false;
		} finally {
			loading = false;
		}
	}

	function buildPatch(): Record<string, unknown> {
		return {
			enabled,
			default_mode: defaultMode,
			budget: Number(budget) || 0,
			extensions: { ...extensionOverrides },
			codex_hooks: {
				default_mode: hookDefaultMode,
				hooks: { ...hookOverrides },
			},
		};
	}

	async function save(confirm = false) {
		if (!canConfigure) return;
		saving = true;
		error = '';
		try {
			const res = await callExt('set_sandbox_config', {
				patch: buildPatch(),
				confirm,
			});
			if (res?.success && res.data?.requires_confirmation) {
				voteConfirm = {
					summary: res.data.summary || 'Update sandbox policy',
					governedBy: res.data.governed_by || 'root',
					policy: res.data.policy || '',
					run: async () => {
						voteConfirmBusy = true;
						try {
							await save(true);
							voteConfirm = null;
						} finally {
							voteConfirmBusy = false;
						}
					},
				};
				return;
			}
			if (res?.success) {
				if (res.data?.applied === 'proposal') {
					notify(
						`Proposal ${res.data.proposal_id || ''} created — vote in Governance → Voting`,
						'success',
					);
				} else {
					notify(res.data?.summary || 'Sandbox policy saved', 'success');
					if (res.data?.warning) notify(res.data.warning, 'error');
				}
				await load();
			} else {
				error = res?.error || 'Failed to save sandbox config';
				notify(error, 'error');
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			error = op ? `Requires permission: ${op}` : e?.message || String(e);
			notify(error, 'error');
		} finally {
			saving = false;
		}
	}

	function setExtensionMode(extId: string, mode: string) {
		if (mode === '') {
			const next = { ...extensionOverrides };
			delete next[extId];
			extensionOverrides = next;
		} else {
			extensionOverrides = { ...extensionOverrides, [extId]: mode };
		}
	}

	function setHookMode(name: string, mode: string) {
		if (mode === '') {
			const next = { ...hookOverrides };
			delete next[name];
			hookOverrides = next;
		} else {
			hookOverrides = { ...hookOverrides, [name]: mode };
		}
	}

	const extensionRows = $derived(
		[...extensionMeta]
			.sort((a, b) => a.id.localeCompare(b.id))
			.map((meta) => ({
				id: meta.id,
				resolved: meta.reason ? `${meta.resolved_mode} (${meta.reason})` : meta.resolved_mode,
				override: extensionOverrides[meta.id] || '',
				// Core/system extensions and those declaring "runtime": "in_process"
				// cannot be sandboxed, so they get no override control.
				locked: !!meta.locked,
			})),
	);

	onMount(load);
</script>

{#if voteConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-2">Governance vote required</h3>
			<p class="text-sm text-gray-600 mb-1">
				This sandbox policy change cannot be applied directly — the policy of
				<strong>{voteConfirm.governedBy}</strong> ({voteConfirm.policy}) requires a vote.
			</p>
			<div class="my-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
				{voteConfirm.summary}
			</div>
			<p class="text-sm text-gray-600 mb-4">
				Create a proposal? Members will vote on it in <strong>Voting</strong>.
			</p>
			<div class="flex justify-end gap-3">
				<button
					onclick={() => (voteConfirm = null)}
					disabled={voteConfirmBusy}
					class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
				>
					Cancel
				</button>
				<button
					onclick={() => voteConfirm?.run()}
					disabled={voteConfirmBusy}
					class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-40"
				>
					{#if voteConfirmBusy}
						<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
					{/if}
					Create proposal
				</button>
			</div>
		</div>
	</div>
{/if}

<section class="bg-white shadow-sm rounded-lg p-6 mb-6">
	<div class="flex items-start justify-between gap-4 mb-1">
		<div>
			<h2 class="text-lg font-semibold text-gray-900">Extension Sandboxing</h2>
			<p class="text-sm text-gray-500 mt-1">
				Run extension backends and compatible codex hooks in an isolated Python subinterpreter.
				Requires <code class="text-xs bg-gray-100 px-1 rounded">realm.configure</code>.
			</p>
		</div>
		{#if !loading}
			<span
				class={cn(
					'shrink-0 text-xs font-medium px-2 py-1 rounded-full',
					available ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800',
				)}
			>
				{available ? 'Sandbox available' : 'Sandbox unavailable in this image'}
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-10">
			<div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
		</div>
	{:else if error && !canConfigure}
		<div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
			{error}
		</div>
	{:else}
		<div class="mt-5 space-y-6" class:opacity-60={!canConfigure}>
			<!-- Master -->
			<div class="flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
				<div>
					<div class="text-sm font-medium text-gray-900">Enable sandboxing</div>
					<p class="text-xs text-gray-500 mt-0.5">
						Master switch. When off, every extension and hook runs in-process.
					</p>
				</div>
				<button
					type="button"
					role="switch"
					aria-checked={enabled}
					aria-label="Enable sandboxing"
					disabled={!canConfigure || saving}
					onclick={() => (enabled = !enabled)}
					class="inline-flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span
						class={cn(
							'text-xs font-semibold uppercase tracking-wide w-8 text-right',
							enabled ? 'text-green-700' : 'text-gray-400',
						)}
					>
						{enabled ? 'On' : 'Off'}
					</span>
					<span
						class={cn(
							'relative inline-flex h-6 w-11 rounded-full transition-colors',
							enabled ? 'bg-green-600' : 'bg-gray-300',
						)}
					>
						<span
							class={cn(
								'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
								enabled && 'translate-x-5',
							)}
						></span>
					</span>
				</button>
			</div>

			<!-- Defaults -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label for="sb-ext-default" class="block text-sm font-medium text-gray-700 mb-1">
						Extension default mode
					</label>
					<select
						id="sb-ext-default"
						bind:value={defaultMode}
						disabled={!canConfigure || saving || !enabled}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:opacity-50"
					>
						<option value="sandbox">sandbox</option>
						<option value="in_process">in_process</option>
					</select>
				</div>
				<div>
					<label for="sb-hook-default" class="block text-sm font-medium text-gray-700 mb-1">
						Codex hook default mode
					</label>
					<select
						id="sb-hook-default"
						bind:value={hookDefaultMode}
						disabled={!canConfigure || saving || !enabled}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:opacity-50"
					>
						<option value="sandbox">sandbox</option>
						<option value="in_process">in_process</option>
					</select>
				</div>
			</div>

			<!-- Advanced -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label for="sb-budget" class="block text-sm font-medium text-gray-700 mb-1">
						Instruction budget
					</label>
					<input
						id="sb-budget"
						type="number"
						min="0"
						step="100000"
						bind:value={budget}
						disabled={!canConfigure || saving}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
					/>
					<p class="text-xs text-gray-500 mt-1">0 = unmetered. Applied per sandboxed spawn.</p>
				</div>
				<div class="p-3 rounded-lg border border-gray-200 bg-gray-50">
					<div class="text-sm font-medium text-gray-900">No in-process fallback</div>
					<p class="text-xs text-gray-500 mt-0.5">
						A sandboxed call that cannot spawn fails — it is never retried with host
						access. Extensions needing host modules declare it in their manifest and
						are listed below as in-process.
					</p>
				</div>
			</div>

			<!-- Extensions -->
			<div>
				<h3 class="text-sm font-semibold text-gray-900 mb-2">Installed extensions</h3>
				<p class="text-xs text-gray-500 mb-3">
					Per-extension override. System extensions and those declaring
					<code class="text-[11px]">"runtime": "in_process"</code> are always in-process
					and cannot be sandboxed.
				</p>
				{#if extensionRows.length === 0}
					<p class="text-sm text-gray-400">No extensions installed.</p>
				{:else}
					<div class="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
						{#each extensionRows as row (row.id)}
							<div class="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 bg-white">
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium text-gray-900 truncate">{row.id}</div>
									<div class="text-xs text-gray-500">Effective: {row.resolved}</div>
								</div>
								<select
									value={row.override}
									onchange={(e) => setExtensionMode(row.id, (e.currentTarget as HTMLSelectElement).value)}
									disabled={!canConfigure || saving || row.locked || !enabled}
									class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white disabled:opacity-50 sm:w-44"
								>
									<option value="">Default ({defaultMode})</option>
									<option value="sandbox">sandbox</option>
									<option value="in_process">in_process</option>
								</select>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Codex hooks -->
			<div>
				<h3 class="text-sm font-semibold text-gray-900 mb-2">Codex hooks</h3>
				<p class="text-xs text-gray-500 mb-3">
					Desired mode per hook. Forced hooks (async / seeding) stay in-process.
					Hooks that still use host modules resolve as
					<code class="bg-gray-100 px-1 rounded">not sandbox-compatible</code>
					until rewritten to the plain-data contract — the legacy
					<code class="bg-gray-100 px-1 rounded">exec()</code> path is kept.
				</p>
				<div class="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
					{#each hooks as hook (hook.name)}
						<div class="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 bg-white">
							<div class="flex-1 min-w-0">
								<div class="text-sm font-medium text-gray-900 truncate">{hook.name}</div>
								<div class="text-xs text-gray-500">Effective: {hook.resolved_mode}</div>
							</div>
							<select
								value={hookOverrides[hook.name] || ''}
								onchange={(e) => setHookMode(hook.name, (e.currentTarget as HTMLSelectElement).value)}
								disabled={!canConfigure || saving || hook.forced_in_process || !enabled}
								class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white disabled:opacity-50 sm:w-44"
							>
								{#if hook.forced_in_process}
									<option value="">in_process (forced)</option>
								{:else}
									<option value="">Default ({hookDefaultMode})</option>
									<option value="sandbox">sandbox</option>
									<option value="in_process">in_process</option>
								{/if}
							</select>
						</div>
					{/each}
				</div>
			</div>

			{#if error && canConfigure}
				<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
			{/if}

			<div class="flex items-center gap-3 pt-2 border-t border-gray-100">
				<button
					onclick={() => save(false)}
					disabled={!canConfigure || saving}
					class={cn(
						'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
						'bg-gray-900 text-white hover:bg-black',
						'disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed',
					)}
				>
					{#if saving}
						<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
					{/if}
					Save sandbox policy
				</button>
				<button
					onclick={load}
					disabled={loading || saving}
					class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40"
				>
					Reload
				</button>
			</div>
		</div>
	{/if}
</section>
