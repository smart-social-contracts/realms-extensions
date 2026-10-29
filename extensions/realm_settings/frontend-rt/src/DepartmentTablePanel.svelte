<script lang="ts">
	import { onMount } from 'svelte';
	import { neededPermission } from './realm';

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

	let destroying = $state(false);
	let loadingNames = $state(true);
	let error = $state('');
	let message = $state('');
	let departmentNames: string[] = $state([]);
	let destroyName = $state('');
	let confirmDestroy = $state(false);

	function notify(msg: string, type: 'success' | 'error' = 'success') {
		if (addToast) addToast(msg, type);
	}

	function deniedMessage(res: any, fallback: string): string {
		const needed = neededPermission(res?.error);
		if (needed) return `Requires permission: ${needed}`;
		return res?.error || fallback;
	}

	async function loadNames() {
		loadingNames = true;
		try {
			const names: string[] = [];
			let from: number | null = 1;
			while (from) {
				const page = await ctx.read('department_list', { from, count: 100 });
				if (!page.ok) return;
				names.push(...page.departments.filter((d: any) => !d.is_root).map((d: any) => d.id));
				from = page.next;
			}
			departmentNames = names;
			if (destroyName && !departmentNames.includes(destroyName)) {
				destroyName = '';
			}
		} catch {
			/* list is optional — destroy still accepts a typed name */
		} finally {
			loadingNames = false;
		}
	}

	async function destroyDepartment() {
		const name = destroyName.trim();
		if (!name) {
			error = 'Choose or type a department name to destroy';
			return;
		}
		if (!confirmDestroy) {
			confirmDestroy = true;
			return;
		}
		destroying = true;
		error = '';
		message = '';
		try {
			const res = await ctx.run('department_delete', { department: name });
			if (res.ok) {
				const summary = res.proposal
					? `Proposal ${res.proposal} created — '${name}' is deleted after the vote passes`
					: `Department '${name}' deleted`;
				message = summary;
				notify(summary);
				confirmDestroy = false;
				destroyName = '';
				await loadNames();
			} else {
				error = deniedMessage(res, 'Failed to destroy department');
				notify(error, 'error');
				confirmDestroy = false;
			}
		} catch (e: any) {
			error = e?.message || String(e);
			notify(error, 'error');
			confirmDestroy = false;
		} finally {
			destroying = false;
		}
	}

	onMount(loadNames);
</script>

<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
	<h2 class="text-lg font-semibold text-gray-900 mb-1">Department tables (JSON)</h2>
	<p class="text-sm text-gray-500 mb-5">
		Applying a department-table document is not supported by this realm version.
	</p>

	{#if message}
		<div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">{message}</div>
	{/if}
	{#if error}
		<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
	{/if}

	<div class="mt-8 pt-6 border-t border-gray-100">
		<h3 class="text-sm font-semibold text-gray-900">Destroy a department</h3>
		<p class="mt-1 text-sm text-gray-500 mb-4">
			Deletes a department that has no sub-departments and only closed positions. Root cannot be
			destroyed. Requires <code class="bg-gray-100 px-1 rounded">org.set_policy</code>.
		</p>
		<div class="flex flex-col sm:flex-row gap-2">
			{#if departmentNames.length}
				<select
					id="rs-dept-destroy"
					bind:value={destroyName}
					onchange={() => (confirmDestroy = false)}
					class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="">Select a department…</option>
					{#each departmentNames as name}
						<option value={name}>{name}</option>
					{/each}
				</select>
			{:else}
				<input
					id="rs-dept-destroy"
					type="text"
					bind:value={destroyName}
					oninput={() => (confirmDestroy = false)}
					placeholder={loadingNames ? 'Loading departments…' : 'Department name'}
					class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			{/if}
			<button
				type="button"
				onclick={destroyDepartment}
				disabled={destroying || !destroyName.trim()}
				class={cn(
					'px-6 py-2.5 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed',
					confirmDestroy
						? 'bg-red-700 text-white hover:bg-red-800'
						: 'bg-red-100 text-red-800 hover:bg-red-200',
				)}
			>
				{destroying ? 'Destroying…' : confirmDestroy ? `Confirm destroy ${destroyName}` : 'Destroy'}
			</button>
		</div>
	</div>
</section>
