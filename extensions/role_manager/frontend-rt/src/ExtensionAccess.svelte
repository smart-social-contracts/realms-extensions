<script lang="ts">
	import { onMount } from 'svelte';

	let { ctx }: { ctx: any } = $props();

	function addToast(message: string, type: 'success' | 'error' = 'success') {
		const level = type === 'error' ? 'error' : 'success';
		if (typeof ctx.notify === 'function') {
			ctx.notify(level, message);
			return;
		}
		console.warn('[extension]', level, message);
	}

	let extensions: any[] = $state([]);
	let extLoading = $state(false);
	let expandedExt: string | null = $state(null);
	let grantTarget = $state('');
	let grantType: 'user' | 'department' | 'profile' = $state('user');

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		const raw = await ctx.callSync(fn, args);
		return typeof raw === 'string' ? JSON.parse(raw) : raw;
	}

	async function loadExtensions() {
		extLoading = true;
		try {
			const res = await callExt('list_extensions');
			extensions = res?.data?.extensions ?? [];
		} catch (e: any) {
			addToast(e?.message || 'Failed to load extensions', 'error');
		} finally {
			extLoading = false;
		}
	}

	async function grantExtension(extName: string) {
		if (!grantTarget.trim()) return;
		let fn = '';
		let args: Record<string, string> = { extension: extName };
		if (grantType === 'user') {
			fn = 'grant_extension_to_user';
			args.user_principal = grantTarget.trim();
		} else if (grantType === 'department') {
			fn = 'grant_extension_to_department';
			args.department = grantTarget.trim();
		} else {
			fn = 'grant_extension_to_profile';
			args.profile = grantTarget.trim();
		}
		try {
			const res = await callExt(fn, args);
			if (res?.success) {
				addToast('Access granted');
				grantTarget = '';
				await loadExtensions();
			} else {
				addToast(res?.error || 'Failed', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

	async function revokeAccess(fn: string, args: Record<string, string>) {
		try {
			const res = await callExt(fn, args);
			if (res?.success) { addToast('Revoked'); await loadExtensions(); }
			else addToast(res?.error || 'Failed', 'error');
		} catch (e: any) { addToast(e?.message || 'Error', 'error'); }
	}

	function shortPrincipal(p: string): string {
		if (!p || p.length < 12) return p;
		return p.slice(0, 5) + '...' + p.slice(-5);
	}

	onMount(() => {
		loadExtensions();
	});
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-semibold text-gray-800">Extension Access ({extensions.length})</h2>
			<p class="text-sm text-gray-500 mt-0.5">Control who sees each extension in the sidebar — per user, department, or profile.</p>
		</div>
		<button
			onclick={() => loadExtensions()}
			disabled={extLoading}
			class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
			title="Refresh"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
		</button>
	</div>

	{#if extLoading}
		<div class="flex justify-center py-8">
			<svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
		</div>
	{:else if extensions.length === 0}
		<p class="text-center text-gray-500 py-8">No Extension entities found. Extensions are seeded when installed.</p>
	{:else}
		{#each extensions as ext (ext.name)}
			<div class="border border-gray-200 rounded-xl overflow-hidden">
				<button
					onclick={() => expandedExt = expandedExt === ext.name ? null : ext.name}
					class="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 text-left"
				>
					<div>
						<span class="font-medium text-gray-900">{ext.name}</span>
						{#if ext.description}
							<span class="ml-2 text-sm text-gray-500">— {ext.description}</span>
						{/if}
					</div>
					<span class="text-xs text-gray-500">{expandedExt === ext.name ? '▲' : '▼'}</span>
				</button>

				{#if expandedExt === ext.name}
					<div class="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-3">
						<!-- Profiles -->
						<div>
							<div class="text-sm font-medium text-gray-700 mb-1">Profile-level access (from manifest):</div>
							{#if ext.profiles.length === 0}
								<span class="text-sm text-gray-400">None</span>
							{:else}
								<div class="flex flex-wrap gap-1">
									{#each ext.profiles as p}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
											{p}
											<button onclick={() => revokeAccess('revoke_extension_from_profile', { extension: ext.name, profile: p })} class="text-blue-400 hover:text-blue-600">&times;</button>
										</span>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Departments -->
						<div>
							<div class="text-sm font-medium text-gray-700 mb-1">Department access:</div>
							{#if ext.departments.length === 0}
								<span class="text-sm text-gray-400">None</span>
							{:else}
								<div class="flex flex-wrap gap-1">
									{#each ext.departments as d}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
											{d}
											<button onclick={() => revokeAccess('revoke_extension_from_department', { extension: ext.name, department: d })} class="text-purple-400 hover:text-purple-600">&times;</button>
										</span>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Users -->
						<div>
							<div class="text-sm font-medium text-gray-700 mb-1">Direct user access:</div>
							{#if ext.users.length === 0}
								<span class="text-sm text-gray-400">None</span>
							{:else}
								<div class="flex flex-wrap gap-1">
									{#each ext.users as u}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
											{u.nickname || shortPrincipal(u.principal)}
											<button onclick={() => revokeAccess('revoke_extension_from_user', { extension: ext.name, user_principal: u.principal })} class="text-green-400 hover:text-green-600">&times;</button>
										</span>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Grant form -->
						<div class="pt-2 border-t border-gray-200">
							<div class="text-sm font-medium text-gray-700 mb-2">Grant access:</div>
							<div class="flex gap-2 flex-wrap">
								<select bind:value={grantType} class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
									<option value="user">User</option>
									<option value="department">Department</option>
									<option value="profile">Profile</option>
								</select>
								<input
									bind:value={grantTarget}
									placeholder={grantType === 'user' ? 'Principal' : grantType === 'department' ? 'Dept name' : 'Profile name'}
									class="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
								/>
								<button onclick={() => grantExtension(ext.name)} class="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">Grant</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	{/if}
</div>
