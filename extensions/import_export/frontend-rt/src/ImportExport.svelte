<script lang="ts">
	import {
		planImportBatches,
		IMPORT_BATCH_SIZE,
		type ImportDependencyGraph,
		type ImportRecord,
	} from '../../../_shared/frontend/import-order.ts';

	let { ctx }: { ctx: any } = $props();

	const cn = $derived(ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' ')));

	type TabId = 'export' | 'import' | 'citizens';

	interface ImportPreview {
		valid: boolean;
		totalEntities: number;
		totalCodexes: number;
		typeCounts: Record<string, number>;
		entities: ImportRecord[];
		codexes: ImportRecord[];
		error?: string;
		citizenFormat?: boolean;
	}

	interface Toast {
		id: number;
		type: 'success' | 'error';
		text: string;
	}

	const entityIcons: Record<string, string> = {
		Codex: '📚', Organization: '🏢', Proposal: '🗳️', User: '👤', Vote: '✅',
		Department: '🏛️', Fund: '💰', LedgerEntry: '🧾',
	};

	const entityImportPlaceholder =
		'[{"_type":"Organization","_id":1,"name":"Example"}]';

	const citizenImportPlaceholder =
		'[{"id":"cit-001","name":"Alice","email":"a@example.com","quarter":"Q1"}]';

	let activeTab: TabId = $state('import');
	let toasts: Toast[] = $state([]);
	let toastCounter = 0;

	let entityTypes: string[] = $state([]);
	let selectedType = $state('');
	let importGraph: ImportDependencyGraph | null = $state(null);

	// Export
	let exporting = $state(false);
	let exportResult: any | null = $state(null);

	// Entity import
	let importMode: 'file' | 'editor' = $state('file');
	let importText = $state('');
	let importFileName = $state('');
	let importPreview: ImportPreview | null = $state(null);
	let importing = $state(false);
	let importResult: any | null = $state(null);
	let importProgress = $state({ batch: 0, total: 0, successful: 0, failed: 0 });
	let fileInput: HTMLInputElement | undefined = $state();
	let dragOver = $state(false);

	let citizenFileInput: HTMLInputElement | undefined = $state();

	function isCitizenCensusFormat(records: ImportRecord[]): boolean {
		if (!records.length) return false;
		const head = records.slice(0, Math.min(5, records.length));
		return head.every((r) => typeof r.id === 'string' && r.id && !r._type);
	}

	// Citizen census
	const CITIZEN_BATCH_SIZE = 200;
	let citizenJson = $state('');
	let citizenImporting = $state(false);
	let citizenReport: any = $state(null);
	let citizenProgress = $state({ batch: 0, total: 0 });
	let citizenStatus: any = $state(null);
	let pendingInvites: any[] = $state([]);
	let pendingTotal = $state(0);
	let pendingLoading = $state(false);
	let showPending = $state(false);

	function addToast(text: string, type: 'success' | 'error' = 'success') {
		const id = ++toastCounter;
		toasts = [...toasts, { id, text, type }];
		setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); }, 4000);
	}

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	async function loadMeta() {
		try {
			const [typesRes, graphRes, statusRes] = await Promise.all([
				callExt('get_entity_types'),
				callExt('get_import_type_graph'),
				callExt('import_status'),
			]);
			entityTypes = typesRes?.data ?? [];
			if (entityTypes.length && !selectedType) selectedType = entityTypes[0];
			if (graphRes?.success && graphRes?.data) {
				importGraph = {
					dependencies: graphRes.data.dependencies || {},
					fields: graphRes.data.fields || {},
				};
			}
			if (statusRes?.success) citizenStatus = statusRes.data;
		} catch (e: any) {
			addToast(e?.message || 'Failed to load', 'error');
		}
	}

	// ── Export ──

	async function exportEntities(all = false) {
		exporting = true;
		exportResult = null;
		try {
			const result = await callExt('export_data', all
				? { include_codexes: true }
				: { entity_types: [selectedType], include_codexes: true });
			if (result?.success && result?.data) {
				exportResult = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
				addToast(`Exported ${exportResult.total_entities ?? '?'} entities`);
			} else {
				addToast(result?.error || 'Export failed', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Export failed', 'error');
		} finally {
			exporting = false;
		}
	}

	function downloadExport() {
		if (!exportResult) return;
		const json = JSON.stringify(exportResult, null, 2);
		const filename = `export_${new Date().toISOString().slice(0, 10)}.json`;
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		try {
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.rel = 'noopener';
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			addToast('Download started');
		} catch {
			const opened = window.open(url, '_blank', 'noopener,noreferrer');
			if (opened) {
				addToast('Opened in new tab — use Save As if download is blocked');
			} else {
				copyExportJson(json);
			}
		} finally {
			setTimeout(() => URL.revokeObjectURL(url), 60_000);
		}
	}

	async function copyExportJson(json?: string) {
		const text = json ?? (exportResult ? JSON.stringify(exportResult, null, 2) : '');
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			addToast('Copied export JSON to clipboard');
		} catch {
			addToast('Could not copy — try again or use Download', 'error');
		}
	}

	// ── Entity import ──

	function readFile(file: File) {
		importFileName = file.name;
		const reader = new FileReader();
		reader.onload = (e) => {
			importText = (e.target?.result as string) || '';
			parseImportPreview();
		};
		reader.readAsText(file);
	}

	function parseImportPreview() {
		importPreview = null;
		importResult = null;
		if (!importText.trim()) return;
		try {
			const parsed = JSON.parse(importText);
			let entities: ImportRecord[] = [];
			let codexes: ImportRecord[] = [];
			if (Array.isArray(parsed)) entities = parsed;
			else if (parsed.entities) {
				entities = parsed.entities || [];
				codexes = parsed.codexes || [];
			} else entities = [parsed];
			const typeCounts: Record<string, number> = {};
			for (const ent of entities) {
				const t = String(ent._type || 'unknown');
				typeCounts[t] = (typeCounts[t] || 0) + 1;
			}
			if (isCitizenCensusFormat(entities)) {
				importPreview = {
					valid: false,
					citizenFormat: true,
					error: 'This JSON is citizen census format (id, name, email). Use the Citizen Census tab — entity import requires _type and _id on each record.',
					totalEntities: entities.length,
					totalCodexes: codexes.length,
					typeCounts,
					entities,
					codexes,
				};
				return;
			}
			importPreview = { valid: true, totalEntities: entities.length, totalCodexes: codexes.length, typeCounts, entities, codexes };
		} catch (e: any) {
			importPreview = { valid: false, error: e.message, totalEntities: 0, totalCodexes: 0, typeCounts: {}, entities: [], codexes: [] };
		}
	}

	async function executeEntityImport() {
		if (!importPreview?.valid) return;
		importing = true;
		importResult = null;
		try {
			const allRecords: ImportRecord[] = [...importPreview.entities];
			for (const codex of importPreview.codexes) allRecords.push({ ...codex, _type: 'Codex' });

			let batches: ImportRecord[][] = [allRecords];
			let sortWarnings: string[] = [];
			if (importGraph && allRecords.length > 0) {
				const plan = planImportBatches(allRecords, importGraph, IMPORT_BATCH_SIZE);
				batches = plan.batches;
				sortWarnings = plan.warnings;
			} else if (allRecords.length > IMPORT_BATCH_SIZE) {
				batches = [];
				for (let i = 0; i < allRecords.length; i += IMPORT_BATCH_SIZE) {
					batches.push(allRecords.slice(i, i + IMPORT_BATCH_SIZE));
				}
			}

			importProgress = { batch: 0, total: batches.length, successful: 0, failed: 0 };
			const allErrors: string[] = [];
			let totalRecords = 0;

			for (let i = 0; i < batches.length; i++) {
				importProgress = { ...importProgress, batch: i + 1 };
				const result = await callExt('import_data', {
					format: 'json',
					data: JSON.stringify(batches[i]),
					sort_records: false,
				});
				if (!result?.success) {
					importResult = result;
					addToast(result?.error || `Batch ${i + 1} failed`, 'error');
					return;
				}
				const d = result.data || {};
				totalRecords += d.total_records || batches[i].length;
				importProgress = {
					...importProgress,
					successful: importProgress.successful + (d.successful || 0),
					failed: importProgress.failed + (d.failed || 0),
				};
				if (d.errors?.length) allErrors.push(...d.errors);
			}

			importResult = {
				success: true,
				data: {
					total_records: totalRecords,
					successful: importProgress.successful,
					failed: importProgress.failed,
					errors: allErrors.slice(0, 10),
					warnings: sortWarnings,
					batches: batches.length,
				},
			};
			addToast(`Imported ${importProgress.successful} of ${totalRecords} records`);
		} catch (e: any) {
			importResult = { success: false, error: e.message };
			addToast(e?.message || 'Import failed', 'error');
		} finally {
			importing = false;
			importProgress = { batch: 0, total: 0, successful: 0, failed: 0 };
		}
	}

	// ── Citizen census ──

	function readCitizenFile(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => {
			citizenJson = (e.target?.result as string) || '';
		};
		reader.readAsText(file);
	}

	async function runCitizenImport() {
		let records: unknown;
		try {
			records = JSON.parse(citizenJson);
		} catch {
			addToast('Invalid JSON — expected an array of citizen records', 'error');
			return;
		}
		if (!Array.isArray(records)) {
			addToast('Expected a JSON array of citizen records', 'error');
			return;
		}

		citizenImporting = true;
		citizenReport = null;
		const batches: unknown[][] = [];
		for (let i = 0; i < records.length; i += CITIZEN_BATCH_SIZE) {
			batches.push(records.slice(i, i + CITIZEN_BATCH_SIZE));
		}
		citizenProgress = { batch: 0, total: batches.length };

		let created = 0;
		let skipped = 0;
		try {
			for (let i = 0; i < batches.length; i++) {
				citizenProgress = { batch: i + 1, total: batches.length };
				const res = await callExt('import_citizens', { citizens: batches[i] });
				if (!res?.success) {
					addToast(res?.error || `Citizen batch ${i + 1} failed`, 'error');
					return;
				}
				const data = res.data || res;
				created += data.created_count ?? (data.created?.length ?? 0);
				skipped += data.skipped_count ?? (data.skipped?.length ?? 0);
			}
			citizenReport = { created_count: created, skipped_count: skipped };
			citizenJson = '';
			addToast(`${created} citizens imported, ${skipped} skipped`);
			await loadMeta();
			if (showPending) await loadPending();
		} catch (e: any) {
			addToast(e?.message || 'Import failed', 'error');
		} finally {
			citizenImporting = false;
			citizenProgress = { batch: 0, total: 0 };
		}
	}

	async function loadPending() {
		pendingLoading = true;
		try {
			const res = await callExt('list_citizen_invites', { only_pending: true, limit: 50 });
			if (res?.success) {
				pendingInvites = res.data?.citizens ?? [];
				pendingTotal = res.data?.total ?? 0;
			}
		} catch (e: any) {
			addToast(e?.message || 'Failed to load invites', 'error');
		} finally {
			pendingLoading = false;
		}
	}

	async function copyText(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			addToast('Copied to clipboard');
		} catch {
			addToast('Could not copy', 'error');
		}
	}

	const TABS: { id: TabId; label: string }[] = [
		{ id: 'import', label: 'Entity Import' },
		{ id: 'export', label: 'Entity Export' },
		{ id: 'citizens', label: 'Citizen Census' },
	];

	const claimPercent = $derived(
		citizenStatus?.total > 0
			? Math.round((citizenStatus.claimed / citizenStatus.total) * 100)
			: 0
	);

	$effect(() => { loadMeta(); });
</script>

{#if toasts.length > 0}
	<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
		{#each toasts as toast (toast.id)}
			<div class={cn('px-4 py-3 rounded-lg shadow-lg text-sm font-medium', toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white')}>
				{toast.text}
			</div>
		{/each}
	</div>
{/if}

<div class="max-w-5xl mx-auto p-4 sm:p-6">
	<h1 class="text-2xl font-bold text-gray-900 mb-1">Import & Export</h1>
	<p class="text-sm text-gray-500 mb-6">Bulk entity JSON/CSV import/export and citizen census onboarding.</p>

	<div class="flex gap-1 mb-6 border-b border-gray-200">
		{#each TABS as tab}
			<button
				onclick={() => activeTab = tab.id}
				class={cn(
					'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
					activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
				)}
			>{tab.label}</button>
		{/each}
	</div>

	{#if activeTab === 'export'}
		<div class="bg-white shadow-sm rounded-lg p-6">
			<p class="text-gray-600 text-sm mb-4">Export entities as JSON. Codexes are included in a separate list.</p>
			{#if entityTypes.length > 0}
				<select bind:value={selectedType} class="mb-4 px-3 py-2 border border-gray-300 rounded-lg text-sm">
					{#each entityTypes as t}
						<option value={t}>{entityIcons[t] || '📊'} {t}</option>
					{/each}
				</select>
			{/if}
			<div class="flex gap-3 mb-4">
				<button onclick={() => exportEntities(false)} disabled={exporting} class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{exporting ? 'Exporting…' : `Export ${selectedType}`}</button>
				<button onclick={() => exportEntities(true)} disabled={exporting} class="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50">Export All</button>
			</div>
			{#if exportResult}
				<div class="border rounded-lg p-4">
					<p class="text-sm mb-2"><strong>{exportResult.total_entities}</strong> entities, <strong>{exportResult.total_codexes ?? 0}</strong> codexes</p>
					<button onclick={downloadExport} class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg">Download JSON</button>
					<button onclick={() => copyExportJson()} class="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">Copy JSON</button>
				</div>
			{/if}
		</div>

	{:else if activeTab === 'import'}
		<div class="bg-white shadow-sm rounded-lg p-6">
			<p class="text-gray-600 text-sm mb-4">Import entity JSON (upsert). Records are topologically sorted and uploaded in batches of {IMPORT_BATCH_SIZE}.</p>
			<div class="flex gap-2 mb-4">
				<button onclick={() => importMode = 'file'} class={cn('px-3 py-1.5 text-sm rounded-lg', importMode === 'file' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100')}>Upload File</button>
				<button onclick={() => importMode = 'editor'} class={cn('px-3 py-1.5 text-sm rounded-lg', importMode === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100')}>JSON Editor</button>
			</div>
			{#if importMode === 'file'}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					ondrop={(e) => { e.preventDefault(); dragOver = false; const f = e.dataTransfer?.files?.[0]; if (f) readFile(f); }}
					ondragover={(e) => { e.preventDefault(); dragOver = true; }}
					ondragleave={() => dragOver = false}
					onclick={() => fileInput?.click()}
					onkeydown={(e) => e.key === 'Enter' && fileInput?.click()}
					role="button"
					tabindex="0"
					class={cn('border-2 border-dashed rounded-lg p-8 text-center cursor-pointer', dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300')}
				>
					<input bind:this={fileInput} type="file" accept=".json" class="hidden" onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) readFile(f); }} />
					{importFileName || 'Drop JSON file or click to browse'}
				</div>
			{:else}
				<textarea bind:value={importText} oninput={parseImportPreview} class="w-full h-48 p-3 border rounded-lg font-mono text-sm" placeholder={entityImportPlaceholder}></textarea>
			{/if}
			{#if importPreview?.valid}
				<div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
					<p class="text-sm text-green-800 mb-2">{importPreview.totalEntities} entities, {importPreview.totalCodexes} codexes</p>
					<button onclick={executeEntityImport} disabled={importing} class="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">{importing ? 'Importing…' : 'Confirm Import'}</button>
					{#if importing && importProgress.total > 1}
						<div class="mt-3">
							<div class="flex justify-between text-xs text-gray-600 mb-1">
								<span>Batch {importProgress.batch} / {importProgress.total}</span>
								<span>{Math.round((importProgress.batch / importProgress.total) * 100)}%</span>
							</div>
							<div class="h-2 bg-gray-200 rounded-full"><div class="h-full bg-green-600 transition-all" style:width="{Math.round((importProgress.batch / importProgress.total) * 100)}%"></div></div>
						</div>
					{/if}
				</div>
			{:else if importPreview && !importPreview.valid}
				<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
					<p class="text-sm text-red-800">{importPreview.error}</p>
					{#if importPreview.citizenFormat}
						<button
							type="button"
							onclick={() => activeTab = 'citizens'}
							class="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg"
						>Switch to Citizen Census</button>
					{/if}
				</div>
			{/if}
			{#if importResult?.success}
				<p class="mt-4 text-sm text-green-700">Done: {importResult.data?.successful} ok, {importResult.data?.failed} failed</p>
			{/if}
		</div>

	{:else if activeTab === 'citizens'}
		<div class="bg-white shadow-sm rounded-lg p-6 space-y-6">
			{#if citizenStatus?.total > 0}
				<div class="p-4 bg-gray-50 rounded-lg">
					<p class="text-sm font-medium">Census progress</p>
					<p class="text-2xl font-bold">{citizenStatus.claimed} <span class="text-sm font-normal text-gray-400">/ {citizenStatus.total} claimed ({claimPercent}%)</span></p>
					<p class="text-xs text-gray-500">{citizenStatus.pending} pending</p>
				</div>
			{/if}
			<div>
				<h2 class="text-lg font-semibold mb-2">Import citizens</h2>
				<p class="text-sm text-gray-500 mb-2">JSON array — up to {CITIZEN_BATCH_SIZE} per batch. Each citizen gets a single-use invite URL.</p>
				<div class="flex gap-2 mb-2">
					<button
						type="button"
						onclick={() => citizenFileInput?.click()}
						class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
					>Upload JSON file</button>
					<input
						bind:this={citizenFileInput}
						type="file"
						accept=".json"
						class="hidden"
						onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) readCitizenFile(f); }}
					/>
				</div>
				<textarea bind:value={citizenJson} class="w-full h-40 p-3 border rounded-lg font-mono text-sm" placeholder={citizenImportPlaceholder}></textarea>
				<button onclick={runCitizenImport} disabled={citizenImporting} class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{citizenImporting ? 'Importing…' : 'Import Citizens'}</button>
				{#if citizenImporting && citizenProgress.total > 1}
					<p class="text-xs text-gray-500 mt-2">Batch {citizenProgress.batch} / {citizenProgress.total}</p>
				{/if}
			</div>
			<div>
				<button onclick={() => { showPending = !showPending; if (showPending) loadPending(); }} class="text-sm text-blue-600 hover:underline">
					{showPending ? 'Hide' : 'Show'} pending invites ({pendingTotal || citizenStatus?.pending || 0})
				</button>
				{#if showPending}
					{#if pendingLoading}
						<p class="text-sm text-gray-500 mt-2">Loading…</p>
					{:else if pendingInvites.length === 0}
						<p class="text-sm text-gray-400 mt-2">No pending invites.</p>
					{:else}
						<ul class="mt-2 divide-y border rounded-lg">
							{#each pendingInvites as row}
								<li class="p-3 flex justify-between items-center text-sm">
									<span>{row.name || row.id} · {row.quarter || '—'}</span>
									{#if row.url}
										<button onclick={() => copyText(row.url)} class="text-blue-600 hover:underline">Copy URL</button>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>
