<script lang="ts">
	import { onMount } from 'svelte';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';
	import { call, readPages, refusedPermission } from './realm';

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

	interface ExtAccess {
		name: string;
		description: string;
		profiles: string[];
		departments: string[];
	}

	let extensions: ExtAccess[] = $state([]);
	let extLoading = $state(false);
	let listNote = $state('');
	let expandedExt: string | null = $state(null);
	let grantTarget = $state('');
	let grantType: 'department' | 'profile' = $state('profile');

	function names(value: unknown): string[] {
		return Array.isArray(value) ? value.map(String) : [];
	}

	async function loadExtensions() {
		extLoading = true;
		try {
			const res = await readPages(ctx, 'extension_list', 'extensions');
			if (res.error) {
				console.warn('extension_list:', res.error);
				const needed = refusedPermission(res.error, 'realm.data_view');
				listNote = needed
					? `Viewing extension access requires the ${needed} permission.`
					: 'Extensions are unavailable right now.';
			} else {
				listNote = '';
			}
			extensions = res.rows
				.filter((row) => row?.id)
				.map((row) => ({
					name: String(row.id),
					description: String(row.manifest?.description ?? ''),
					profiles: names(row.access?.profiles),
					departments: names(row.access?.departments),
				}))
				.sort((a, b) => a.name.localeCompare(b.name));
		} finally {
			extLoading = false;
		}
	}

	/** Replace who gets ``ext``; a governed realm files a proposal instead. */
	async function setAccess(ext: ExtAccess, profiles: string[], departments: string[], done: string) {
		const reply = await call(ctx, true, 'extension_set_access', { extension: ext.name, profiles, departments });
		if (!reply.ok) {
			addToast(reply.error || 'The change was not applied.', 'error');
			return false;
		}
		addToast(reply.proposal ? `Submitted for a vote as proposal ${reply.proposal}.` : done);
		await loadExtensions();
		return true;
	}

	async function grantExtension(ext: ExtAccess) {
		const target = grantTarget.trim();
		if (!target) return;
		const profiles = grantType === 'profile' ? [...new Set([...ext.profiles, target])] : ext.profiles;
		const departments = grantType === 'department' ? [...new Set([...ext.departments, target])] : ext.departments;
		if (await setAccess(ext, profiles, departments, 'Access granted')) grantTarget = '';
	}

	function revokeProfile(ext: ExtAccess, profile: string) {
		void setAccess(ext, ext.profiles.filter((p) => p !== profile), ext.departments, 'Revoked');
	}

	function revokeDepartment(ext: ExtAccess, department: string) {
		void setAccess(ext, ext.profiles, ext.departments.filter((d) => d !== department), 'Revoked');
	}

	onMount(() => {
		loadExtensions();
	});
</script>

<div class="space-y-4">
	<div class="flex flex-col gap-2">
		<div>
			<h2 class="text-lg font-semibold text-gray-800">Extension Access ({extensions.length})</h2>
			<p class="text-sm text-gray-500 mt-0.5">Control who sees each extension in the sidebar — per profile or department.</p>
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
		<p class="text-center text-gray-500 py-8">{listNote || 'No extensions installed.'}</p>
	{:else}
		{#each extensions as ext (ext.name)}
			<div class="border-y border-gray-200 sm:border sm:rounded-xl overflow-hidden">
				<button
					onclick={() => expandedExt = expandedExt === ext.name ? null : ext.name}
					class="w-full px-0 py-3 sm:px-4 flex items-center justify-between bg-white hover:bg-gray-50 text-left"
				>
					<div class="min-w-0">
						<span class="font-medium text-gray-900">{ext.name}</span>
						{#if ext.description}
							<span class="block sm:inline sm:ml-2 text-sm text-gray-500">{narrow ? '' : '— '}{ext.description}</span>
						{/if}
					</div>
					<span class="text-xs text-gray-500 shrink-0 ml-2">{expandedExt === ext.name ? '▲' : '▼'}</span>
				</button>

				{#if expandedExt === ext.name}
					<div class="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-3">
						<!-- Profiles -->
						<div>
							<div class="text-sm font-medium text-gray-700 mb-1">Profile access:</div>
							{#if ext.profiles.length === 0}
								<span class="text-sm text-gray-400">None</span>
							{:else}
								<div class="flex flex-wrap gap-1">
									{#each ext.profiles as p}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
											{p}
											<button onclick={() => revokeProfile(ext, p)} class="text-blue-400 hover:text-blue-600">&times;</button>
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
											<button onclick={() => revokeDepartment(ext, d)} class="text-purple-400 hover:text-purple-600">&times;</button>
										</span>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Users -->
						<div>
							<div class="text-sm font-medium text-gray-700 mb-1">Direct user access:</div>
							<span class="text-sm text-gray-400">Not offered in this realm version; grant through a profile or department.</span>
						</div>

						<!-- Grant form -->
						<div class="pt-2 border-t border-gray-200">
							<div class="text-sm font-medium text-gray-700 mb-2">Grant access:</div>
							<div class="flex gap-2 flex-wrap">
								<select bind:value={grantType} class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
									<option value="profile">Profile</option>
									<option value="department">Department</option>
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
