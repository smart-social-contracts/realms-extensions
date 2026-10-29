<script lang="ts">
	import { onMount } from 'svelte';
	import { configureChange, neededPermission } from './realm';

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

	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let canChange = $state(false);

	let requireApproval = $state(true);
	let approversText = $state('');
	let effectiveApprovers: string[] = $state([]);
	let marketplaceCanisterId = $state('');
	let status = $state('');

	const trustedApprovers = $derived(
		approversText
			.split(/[\n,]/)
			.map((p) => p.trim())
			.filter(Boolean),
	);

	function notify(msg: string, type: 'success' | 'error' = 'success') {
		if (addToast) addToast(msg, type);
	}

	async function load() {
		loading = true;
		error = '';
		try {
			const [setup, me] = await Promise.all([ctx.run('setup_state'), ctx.read('me')]);
			if (!setup.ok) {
				canChange = false;
				const needed = neededPermission(setup.error);
				error = needed ? `Requires permission: ${needed}` : setup.error || 'Failed to load trust policy';
				return;
			}
			const held: string[] = me.ok ? me.permissions : [];
			canChange = held.includes('all') || held.includes('realm.configure.trust_policy');
			status = setup.status;
			const realm = setup.realm;
			requireApproval = !!realm.require_marketplace_approval;
			const trusted: string[] = realm.trusted_approvers || [];
			approversText = trusted.join('\n');
			marketplaceCanisterId = realm.marketplace_canister_id || '';
			const approvers = trusted.filter((a) => !a.startsWith('sha256:'));
			effectiveApprovers = approvers.length ? approvers : marketplaceCanisterId ? [marketplaceCanisterId] : [];
		} catch (e: any) {
			error = e?.message || String(e);
			canChange = false;
		} finally {
			loading = false;
		}
	}

	async function save() {
		if (!canChange) return;
		saving = true;
		error = '';
		try {
			const change = configureChange(status, 'trust_policy', {
				require_marketplace_approval: requireApproval,
				trusted_approvers: [...trustedApprovers],
			});
			const res = await ctx.run(change.op, change.args);
			if (!res.ok) {
				const needed = neededPermission(res.error);
				error = needed ? `Requires permission: ${needed}` : res.error || 'Failed to save trust policy';
				notify(error, 'error');
				return;
			}
			if (res.proposal) {
				notify(`Proposal ${res.proposal} created — vote in Governance → Voting`, 'success');
			} else {
				notify('Approval policy saved', 'success');
			}
			await load();
		} catch (e: any) {
			error = e?.message || String(e);
			notify(error, 'error');
		} finally {
			saving = false;
		}
	}

	onMount(load);
</script>

<section class="bg-white shadow-sm rounded-lg p-6 mb-6">
	<div class="flex items-start justify-between gap-4 mb-1">
		<div>
			<h2 class="text-lg font-semibold text-gray-900">Marketplace Approval</h2>
			<p class="text-sm text-gray-500 mt-1">
				Install only extensions and codices that a trusted marketplace reviewer has approved. Each
				approval is bound to the exact files that were reviewed, so modified code is rejected.
				Requires <code class="text-xs bg-gray-100 px-1 rounded">realm.configure.trust_policy</code>.
			</p>
		</div>
		{#if !loading}
			<span
				class={cn(
					'shrink-0 text-xs font-medium px-2 py-1 rounded-full',
					requireApproval ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800',
				)}
			>
				{requireApproval ? 'Enforcing' : 'Not enforcing'}
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-10">
			<div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
		</div>
	{:else if error && !canChange}
		<div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
			{error}
		</div>
	{:else}
		<div class="mt-5 space-y-6" class:opacity-60={!canChange}>
			<!-- Master -->
			<div class="flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
				<div>
					<div class="text-sm font-medium text-gray-900">Require marketplace approval</div>
					<p class="text-xs text-gray-500 mt-0.5">
						When installing, refuse any extension or codex that lacks an approval from a trusted
						approver. Turning this off allows unreviewed code to be installed.
					</p>
				</div>
				<button
					type="button"
					role="switch"
					aria-checked={requireApproval}
					aria-label="Require marketplace approval"
					disabled={!canChange || saving}
					onclick={() => (requireApproval = !requireApproval)}
					class="inline-flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span
						class={cn(
							'text-xs font-semibold uppercase tracking-wide w-8 text-right',
							requireApproval ? 'text-green-700' : 'text-gray-400',
						)}
					>
						{requireApproval ? 'On' : 'Off'}
					</span>
					<span
						class={cn(
							'relative inline-flex h-6 w-11 rounded-full transition-colors',
							requireApproval ? 'bg-green-600' : 'bg-gray-300',
						)}
					>
						<span
							class={cn(
								'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
								requireApproval && 'translate-x-5',
							)}
						></span>
					</span>
				</button>
			</div>

			{#if !requireApproval}
				<div class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
					<div class="text-sm font-semibold text-amber-900">Enforcement is off</div>
					<p class="text-sm text-amber-900 mt-1">
						This realm will install extensions and codices that nobody has reviewed. Any code
						offered to the realm can run with the permissions it asks for.
					</p>
				</div>
			{/if}

			<!-- Approvers -->
			<div>
				<label for="tp-approvers" class="block text-sm font-medium text-gray-700 mb-1">
					Trusted approvers
				</label>
				<textarea
					id="tp-approvers"
					rows="4"
					spellcheck="false"
					placeholder="One principal id per line"
					bind:value={approversText}
					disabled={!canChange || saving}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono disabled:opacity-50"
				></textarea>
				<p class="text-xs text-gray-500 mt-1">
					One principal id per line. Leave empty to trust only this realm's configured marketplace.
				</p>
				<div class="mt-3 space-y-2 text-xs text-gray-500">
					<div>
						Configured marketplace:
						{#if marketplaceCanisterId}
							<code class="text-xs bg-gray-100 px-1 rounded">{marketplaceCanisterId}</code>
						{:else}
							<span class="text-gray-400">none configured</span>
						{/if}
					</div>
					<div>
						<div class="mb-1">Used for enforcement:</div>
						{#if effectiveApprovers.length === 0}
							<p class="text-amber-800">
								This realm currently trusts no approver, so every install will be refused while
								enforcement is on.
							</p>
						{:else}
							<ul class="space-y-1">
								{#each effectiveApprovers as approver (approver)}
									<li>
										<code class="text-xs bg-gray-100 px-1 rounded">{approver}</code>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			</div>

			{#if error && canChange}
				<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
			{/if}

			<div class="flex items-center gap-3 pt-2 border-t border-gray-100">
				<button
					onclick={save}
					disabled={!canChange || saving}
					class={cn(
						'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
						'bg-gray-900 text-white hover:bg-black',
						'disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed',
					)}
				>
					{#if saving}
						<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
					{/if}
					Save approval policy
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
