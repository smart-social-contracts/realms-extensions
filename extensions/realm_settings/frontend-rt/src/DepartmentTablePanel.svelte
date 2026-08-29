<script lang="ts">
	import { onMount } from 'svelte';
	import {
		EXAMPLE_DEPARTMENT_TABLE,
		documentHasDestroy,
		formatApplyResult,
		parseDepartmentTableText,
	} from './departmentTable';

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

	const exampleText = JSON.stringify(EXAMPLE_DEPARTMENT_TABLE, null, 2);

	let tableText = $state(exampleText);
	let applying = $state(false);
	let destroying = $state(false);
	let loadingNames = $state(true);
	let error = $state('');
	let message = $state('');
	let departmentNames: string[] = $state([]);
	let destroyName = $state('');
	let confirmDestroy = $state(false);

	const parsed = $derived(parseDepartmentTableText(tableText));
	const preview = $derived(parsed.ok ? parsed.preview : null);
	const needsDelete = $derived(parsed.ok && documentHasDestroy(parsed.doc));

	function notify(msg: string, type: 'success' | 'error' = 'success') {
		if (addToast) addToast(msg, type);
	}

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	function deniedMessage(res: any, fallback: string): string {
		if (res?.denied_operation) return `Requires permission: ${res.denied_operation}`;
		return res?.error || fallback;
	}

	async function loadNames() {
		loadingNames = true;
		try {
			const res = await callExt('list_department_names');
			if (res?.success) {
				departmentNames = Array.isArray(res.data?.names) ? res.data.names : [];
				if (destroyName && !departmentNames.includes(destroyName)) {
					destroyName = '';
				}
			}
		} catch {
			/* list is optional — destroy still accepts a typed name */
		} finally {
			loadingNames = false;
		}
	}

	async function applyTable() {
		const check = parseDepartmentTableText(tableText);
		if (!check.ok) {
			error = check.error;
			return;
		}
		applying = true;
		error = '';
		message = '';
		try {
			const res = await callExt('apply_department_table', { document: check.doc });
			if (res?.success) {
				const summary = formatApplyResult(res);
				message = summary;
				notify(summary);
				await loadNames();
			} else {
				error = deniedMessage(res, 'Failed to apply department table');
				notify(error, 'error');
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			error = op ? `Requires permission: ${op}` : e?.message || String(e);
			notify(error, 'error');
		} finally {
			applying = false;
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
			const res = await callExt('delete_department', { name });
			if (res?.success) {
				const summary = res.data?.message || `Department '${name}' deleted`;
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
			const op = ctx.ui?.accessDeniedOperation?.(e);
			error = op ? `Requires permission: ${op}` : e?.message || String(e);
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
		Apply the founder department-table document from realms #358: upsert departments, posts, and
		staff, or destroy a department and its children. This is not Department Management CRUD.
		Apply needs <code class="bg-gray-100 px-1 rounded">organization.add</code>; destroy rows also
		need <code class="bg-gray-100 px-1 rounded">organization.delete</code>.
	</p>

	{#if message}
		<div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">{message}</div>
	{/if}
	{#if error}
		<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
	{/if}

	<label for="rs-dept-table" class="block text-sm font-medium text-gray-700 mb-1">
		Department table JSON
	</label>
	<textarea
		id="rs-dept-table"
		bind:value={tableText}
		rows="14"
		spellcheck="false"
		class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
	></textarea>

	{#if preview}
		<div class="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
			{#if preview.upsert.length}
				<div>
					<span class="font-medium">Apply / upsert:</span>
					{preview.upsert.join(', ')}
				</div>
			{/if}
			{#if preview.destroy.length}
				<div class="text-amber-800">
					<span class="font-medium">Destroy:</span>
					{preview.destroy.join(', ')}
				</div>
			{/if}
			{#if preview.warnings.length}
				<div class="text-xs text-gray-500 mt-1">{preview.warnings.join('; ')}</div>
			{/if}
		</div>
	{:else if tableText.trim()}
		<p class="mt-2 text-xs text-red-600">{parsed.ok ? '' : parsed.error}</p>
	{/if}

	<div class="mt-4 flex flex-wrap items-center gap-3">
		<button
			type="button"
			onclick={applyTable}
			disabled={applying || !parsed.ok}
			class="px-6 py-2.5 bg-[var(--color-primary-600,#2563eb)] text-white rounded-lg hover:bg-[var(--color-primary-700,#1d4ed8)] disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
		>
			{applying ? 'Applying…' : 'Apply table'}
		</button>
		<button
			type="button"
			onclick={() => {
				tableText = exampleText;
				error = '';
				message = '';
			}}
			class="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
		>
			Reset example
		</button>
		{#if needsDelete}
			<span class="text-xs text-amber-700">This document includes destroy rows.</span>
		{/if}
	</div>

	<div class="mt-8 pt-6 border-t border-gray-100">
		<h3 class="text-sm font-semibold text-gray-900">Destroy a department</h3>
		<p class="mt-1 text-sm text-gray-500 mb-4">
			Calls host <code class="bg-gray-100 px-1 rounded">delete_department</code> — cascade purge,
			then the department row. Root cannot be destroyed. Requires
			<code class="bg-gray-100 px-1 rounded">organization.delete</code>.
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
