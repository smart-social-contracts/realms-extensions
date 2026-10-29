<script lang="ts">
	import { onMount } from 'svelte';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	let { ctx }: { ctx: any } = $props();

	let narrow = $state(isNarrowViewport());
	$effect(() => subscribeNarrowViewport((value) => { narrow = value; }));

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
	let grantType: 'department' | 'profile' = $state('profile');

	async function loadExtensions() {
		extLoading = true;
		try {
			const rows: any[] = [];
			for (let from: number | null = 1; from; ) {
				const page = await ctx.read('extension_list', { from, count: 100 });
				if (!page.ok) throw new Error(page.error);
				rows.push(...page.extensions);
				from = page.next;
			}
			extensions = rows;
		} catch (e: any) {
			addToast(e?.message || 'Failed to load extensions', 'error');
		} finally {
			extLoading = false;
		}
	}

	async function setAccess(ext: any, profiles: string[], departments: string[], done: string) {
		try {
			const res = await ctx.run('extension_set_access', { extension: ext.id, profiles, departments });
			if (!res.ok) {
				addToast(res.error, 'error');
				return;
			}
			addToast(res.requires_vote ? `A vote on this change was opened (${res.proposal})` : done);
			await loadExtensions();
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

	async function grantExtension(ext: any) {
		const target = grantTarget.trim();
		if (!target) return;
		const { profiles, departments } = ext.access;
		await setAccess(
			ext,
			grantType === 'profile' ? [...profiles, target] : profiles,
			grantType === 'department' ? [...departments, target] : departments,
			'Access granted',
		);
		grantTarget = '';
	}

	function revokeAccess(ext: any, kind: 'profiles' | 'departments', name: string) {
		const { profiles, departments } = ext.access;
		void setAccess(
			ext,
			kind === 'profiles' ? profiles.filter((p: string) => p !== name) : profiles,
			kind === 'departments' ? departments.filter((d: string) => d !== name) : departments,
			'Revoked',
		);
	}

	onMount(() => {
		loadExtensions();
	});
</script>

<div class="space-y-4">
	<div class="flex flex-col gap-2">
		<div>
			<h2 class="text-lg font-semibold text-gray-800">Extension Access ({extensions.length})</h2>
			<p class="text-sm text-gray-500 mt-0.5">Control who sees each extension in the sidebar — per user, department, or profile.</p>
		</div>
		<button
			type="button"
			onclick={() => loadExtensions()}
			disabled={extLoading}
			class="self-start p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
			title="Refresh"
			aria-label="Refresh"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
		{#each extensions as ext (ext.id)}
			<div class="border-y border-gray-200 sm:border sm:rounded-xl overflow-hidden">
				<button
					onclick={() => expandedExt = expandedExt === ext.id ? null : ext.id}
					class="w-full px-0 py-3 sm:px-4 flex items-center justify-between bg-white hover:bg-gray-50 text-left"
				>
					<div class="min-w-0">
						<span class="font-medium text-gray-900">{ext.id}</span>
						{#if ext.manifest.description}
							<span class="block sm:inline sm:ml-2 text-sm text-gray-500">{narrow ? '' : '— '}{ext.manifest.description}</span>
						{/if}
					</div>
					<span class="text-xs text-gray-500 shrink-0 ml-2">{expandedExt === ext.id ? '▲' : '▼'}</span>
				</button>

				{#if expandedExt === ext.id}
					<div class="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-3">
						<!-- Profiles -->
						<div>
							<div class="text-sm font-medium text-gray-700 mb-1">Profile-level access (from manifest):</div>
							{#if ext.access.profiles.length === 0}
								<span class="text-sm text-gray-400">None</span>
							{:else}
								<div class="flex flex-wrap gap-1">
									{#each ext.access.profiles as p}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
											{p}
											<button onclick={() => revokeAccess(ext, 'profiles', p)} class="text-blue-400 hover:text-blue-600">&times;</button>
										</span>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Departments -->
						<div>
							<div class="text-sm font-medium text-gray-700 mb-1">Department access:</div>
							{#if ext.access.departments.length === 0}
								<span class="text-sm text-gray-400">None</span>
							{:else}
								<div class="flex flex-wrap gap-1">
									{#each ext.access.departments as d}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
											{d}
											<button onclick={() => revokeAccess(ext, 'departments', d)} class="text-purple-400 hover:text-purple-600">&times;</button>
										</span>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Users -->
						<div>
							<div class="text-sm font-medium text-gray-700 mb-1">Direct user access:</div>
							<span class="text-sm text-gray-400">Not supported by this realm version.</span>
						</div>

						<!-- Grant form -->
						<div class="pt-2 border-t border-gray-200">
							<div class="text-sm font-medium text-gray-700 mb-2">Grant access:</div>
							<div class="flex gap-2 flex-wrap">
								<select bind:value={grantType} class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
									<option value="department">Department</option>
									<option value="profile">Profile</option>
								</select>
								<input
									bind:value={grantTarget}
									placeholder={grantType === 'department' ? 'Dept name' : 'Profile name'}
									class="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
								/>
								<button onclick={() => grantExtension(ext)} class="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">Grant</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	{/if}
</div>
