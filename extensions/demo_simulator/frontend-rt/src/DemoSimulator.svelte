<script lang="ts">
	let { ctx }: { ctx: any } = $props();

	interface EntityTypeMeta {
		key: string;
		label: string;
		stat_field: string;
	}

	interface Stats {
		users: number;
		organizations: number;
		proposals: number;
		transfers: number;
		disputes: number;
		votes?: number;
		lands?: number;
		courts?: number;
		cases?: number;
		funds?: number;
		fiscal_periods?: number;
		budgets?: number;
		ledger_entries?: number;
		messages?: number;
		departments?: number;
	}

	interface Status {
		running: boolean;
		interval_seconds: number;
		batch_size: number;
		max_entities: number | null;
		batch_number: number;
		seed: number;
		rotation_mode: string;
		rotation_modes: string[];
		enabled_types: Record<string, boolean>;
		type_counts: Record<string, number | null>;
		resolved_type_counts: Record<string, number>;
		entity_types: EntityTypeMeta[];
		stats: Stats;
		demo_mode_active: boolean;
	}

	const ROTATION_LABELS: Record<string, string> = {
		round_robin: 'Round robin — one type per batch',
		random: 'Random — one random type per batch',
		all: 'All enabled — every type each batch'
	};

	const CONFIG_HELP: Record<string, string> = {
		interval:
			'Seconds between automatic batches while the simulator is running. Minimum 10 seconds.',
		batch_size:
			'Base count used to derive how many entities of each type are created per batch. Some types use smaller fractions of this value by default.',
		max_entities:
			'Stop automatically once this many entities have been created in total across all types. Leave empty for no limit.',
		seed: 'Fixed random seed so demo data is reproducible. The same seed yields the same names, amounts, and choices. Leave empty for a random seed.',
		rotation_mode:
			'How enabled types are picked each batch. Round robin cycles one type at a time; Random picks one enabled type; All runs every enabled type in the same batch.',
		entity_types:
			'Choose which kinds of demo data are created. Disabled types are skipped entirely until re-enabled.',
		type_overrides:
			'Optional fixed count per entity type, overriding defaults derived from batch size. Leave blank to use the default shown as the placeholder.',
		reset_counters:
			'Clears batch and entity counters only. Already-created realm data is not deleted.'
	};

	const ENTITY_TYPE_HELP: Record<string, string> = {
		users: 'Demo member accounts with generated names and profile data.',
		organizations: 'Cooperatives, agencies, and other organization entities.',
		proposals: 'Governance proposals with titles, descriptions, and codex references.',
		transfers: 'Token transfers between members.',
		disputes: 'Legal disputes for the justice module.',
		votes: 'Vote records linked to proposals.',
		lands: 'Land parcels with coordinates, zones, and ownership.',
		courts: 'Court institutions with judges and specializations.',
		cases: 'Legal cases filed in courts.',
		funds: 'Treasury funds used by finance and metrics extensions.',
		fiscal_periods: 'Fiscal year periods for budgeting and reporting.',
		budgets: 'Budget line items (revenue and expense categories).',
		ledger_entries: 'Double-entry ledger transactions across funds.',
		messages: 'In-app notifications sent to members.',
		departments: 'Government departments and member assignments.'
	};

	const STAT_COLORS: Record<string, string> = {
		users: '#4f46e5',
		organizations: '#059669',
		proposals: '#7c3aed',
		transfers: '#0891b2',
		disputes: '#e11d48',
		votes: '#6366f1',
		lands: '#10b981',
		courts: '#d97706',
		cases: '#dc2626',
		funds: '#0d9488',
		fiscal_periods: '#0284c7',
		budgets: '#8b5cf6',
		ledger_entries: '#64748b',
		messages: '#2563eb',
		departments: '#9333ea'
	};

	let status: Status | null = $state(null);
	let loading = $state(true);
	let toggling = $state(false);
	let saving = $state(false);
	let runningOnce = $state(false);
	let error = $state('');
	let accessDeniedOp = $state('');
	let showAdvanced = $state(false);

	let editInterval = $state(60);
	let editBatchSize = $state(3);
	let editMaxEntities = $state('');
	let editSeed = $state('');
	let editRotationMode = $state('round_robin');
	let editEnabledTypes = $state<Record<string, boolean>>({});
	let editTypeCounts = $state<Record<string, string>>({});

	let totalEntities = $derived(
		status
			? Object.values(status.stats).reduce((sum, v) => sum + (v ?? 0), 0)
			: 0
	);

	let progressPercent = $derived(
		status && status.max_entities
			? Math.min(100, Math.round((totalEntities / status.max_entities) * 100))
			: 0
	);

	let enabledCount = $derived(
		Object.values(editEnabledTypes).filter(Boolean).length
	);

	function statValue(key: string): number {
		if (!status) return 0;
		return (status.stats as Record<string, number | undefined>)[key] ?? 0;
	}

	function shortLabel(label: string): string {
		const map: Record<string, string> = {
			Organizations: 'Orgs',
			'Land parcels': 'Lands',
			'Fiscal periods': 'Fiscal',
			'Budget lines': 'Budgets',
			'Ledger entries': 'Ledger',
			Messages: 'Msgs',
			Departments: 'Depts'
		};
		return map[label] ?? label;
	}

	function applyStatusToForm(data: Status) {
		editInterval = data.interval_seconds;
		editBatchSize = data.batch_size;
		editMaxEntities = data.max_entities != null ? String(data.max_entities) : '';
		editSeed = String(data.seed ?? '');
		editRotationMode = data.rotation_mode ?? 'round_robin';
		editEnabledTypes = { ...data.enabled_types };
		const counts: Record<string, string> = {};
		for (const et of data.entity_types ?? []) {
			const override = data.type_counts?.[et.key];
			counts[et.key] = override != null ? String(override) : '';
		}
		editTypeCounts = counts;
	}

	async function fetchStatus() {
		try {
			const raw = await ctx.callSync('get_status', {});
			const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (data.success) {
				status = data;
				applyStatusToForm(data);
			} else {
				error = data.error || 'Failed to fetch status';
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			loading = false;
		}
	}

	async function handleToggle() {
		if (!status) return;
		toggling = true;
		error = '';
		accessDeniedOp = '';
		try {
			const raw = await ctx.callSync('toggle', { enabled: !status.running });
			const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (data.success) {
				await fetchStatus();
			} else {
				error = data.error || 'Toggle failed';
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			toggling = false;
		}
	}

	function buildConfigPayload(): Record<string, unknown> {
		const maxVal = editMaxEntities.toString().trim();
		const config: Record<string, unknown> = {
			interval_seconds: editInterval,
			batch_size: editBatchSize,
			max_entities: maxVal ? parseInt(maxVal, 10) : null,
			rotation_mode: editRotationMode,
			enabled_types: editEnabledTypes
		};
		if (editSeed.trim()) {
			config.seed = parseInt(editSeed, 10);
		}
		const typeCounts: Record<string, number> = {};
		for (const [key, val] of Object.entries(editTypeCounts)) {
			const trimmed = val.trim();
			if (trimmed) {
				typeCounts[key] = parseInt(trimmed, 10);
			}
		}
		config.type_counts = typeCounts;
		return config;
	}

	async function saveConfig() {
		saving = true;
		error = '';
		accessDeniedOp = '';
		try {
			const raw = await ctx.callSync('update_config', buildConfigPayload());
			const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (data.success) {
				await fetchStatus();
			} else {
				error = data.error || 'Save failed';
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			saving = false;
		}
	}

	async function runOnce() {
		runningOnce = true;
		error = '';
		accessDeniedOp = '';
		try {
			const raw = await ctx.callSync('run_once', {});
			const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
			await fetchStatus();
			if (data.error) error = data.error;
			if (data.reason === 'no_enabled_types') {
				error = 'No entity types are enabled. Enable at least one type below.';
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			runningOnce = false;
		}
	}

	async function handleReset() {
		error = '';
		accessDeniedOp = '';
		try {
			const raw = await ctx.callSync('reset', {});
			const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (data.success) {
				await fetchStatus();
			} else {
				error = data.error || 'Reset failed';
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		}
	}

	function setAllTypes(enabled: boolean) {
		if (!status) return;
		const next = { ...editEnabledTypes };
		for (const et of status.entity_types) {
			next[et.key] = enabled;
		}
		editEnabledTypes = next;
	}

	function toggleType(key: string) {
		editEnabledTypes = {
			...editEnabledTypes,
			[key]: !editEnabledTypes[key]
		};
	}

	function resolvedCount(key: string): number {
		return status?.resolved_type_counts?.[key] ?? 0;
	}

	$effect(() => {
		fetchStatus();
		const interval = setInterval(fetchStatus, 10000);
		return () => clearInterval(interval);
	});
</script>

{#snippet HelpTip(text: string)}
	<span class="ds-help" tabindex="0">
		<span class="ds-help-icon" aria-hidden="true">?</span>
		<span class="ds-help-tip" role="tooltip">{text}</span>
	</span>
{/snippet}

{#snippet FieldLabel(forId: string, label: string, help: string)}
	<div class="ds-label-row">
		<label for={forId} class="text-xs text-gray-500 dark:text-gray-400">{label}</label>
		{@render HelpTip(help)}
	</div>
{/snippet}

<div class="max-w-3xl mx-auto p-6">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Demo Simulator</h2>
		{#if status}
			<span
				class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full
					{status.running
					? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
					: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}"
			>
				<span
					class="w-2 h-2 rounded-full {status.running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}"
				></span>
				{status.running ? 'Running' : 'Stopped'}
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
	{:else if status}
		{#if !status.demo_mode_active}
			<div
				class="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
			>
				<p class="text-sm text-amber-800 dark:text-amber-300">
					<strong>Note:</strong> TEST_MODE and TEST_MODE_DEMO_DATA are not both enabled in backend
					config. The simulator will not auto-activate on canister start, but can still be toggled
					manually.
				</p>
			</div>
		{/if}

		<div class="ds-stats-grid mb-4">
			{#each status.entity_types as et (et.key)}
				<div class="ds-stat">
					<span class="ds-stat-val" style="color:{STAT_COLORS[et.key] ?? '#374151'}"
						>{statValue(et.key)}</span
					>
					<span class="ds-stat-lbl">{shortLabel(et.label)}</span>
				</div>
			{/each}
			<div class="ds-stat">
				<span class="ds-stat-val" style="color:#374151">{status.batch_number}</span>
				<span class="ds-stat-lbl">Batches</span>
			</div>
		</div>

		<div class="mb-6">
			{#if status.max_entities}
				<div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
					<span>{totalEntities} / {status.max_entities} entities</span>
					<span>{progressPercent}%</span>
				</div>
				<div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
					<div
						class="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500"
						style="width: {progressPercent}%"
					></div>
				</div>
			{:else}
				<div class="text-xs text-gray-500 dark:text-gray-400">
					{totalEntities} entities (unlimited)
				</div>
			{/if}
		</div>

		<div
			class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-4"
		>
			<div class="flex items-center gap-3 mb-5">
				<button onclick={handleToggle} disabled={toggling} class="ds-btn ds-btn-primary flex-1">
					{#if toggling}
						<svg class="inline-block w-4 h-4 mr-1.5 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
							/>
						</svg>
					{/if}
					{status.running ? 'Stop Simulator' : 'Start Simulator'}
				</button>
				<button onclick={runOnce} disabled={runningOnce} class="ds-btn ds-btn-secondary">
					{runningOnce ? 'Running...' : 'Run Once'}
				</button>
			</div>

			<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Configuration</h3>
			<div class="grid grid-cols-2 gap-3 mb-4">
				<div>
					{@render FieldLabel('ds-interval', 'Interval (s)', CONFIG_HELP.interval)}
					<input
						id="ds-interval"
						type="number"
						min="10"
						max="3600"
						bind:value={editInterval}
						class="ds-input"
					/>
				</div>
				<div>
					{@render FieldLabel('ds-batch', 'Batch size', CONFIG_HELP.batch_size)}
					<input
						id="ds-batch"
						type="number"
						min="1"
						max="20"
						bind:value={editBatchSize}
						class="ds-input"
					/>
				</div>
				<div>
					{@render FieldLabel('ds-max', 'Max entities', CONFIG_HELP.max_entities)}
					<input
						id="ds-max"
						type="text"
						placeholder="unlimited"
						bind:value={editMaxEntities}
						class="ds-input"
					/>
				</div>
				<div>
					{@render FieldLabel('ds-seed', 'Seed (deterministic)', CONFIG_HELP.seed)}
					<input
						id="ds-seed"
						type="text"
						placeholder="random"
						bind:value={editSeed}
						class="ds-input"
					/>
				</div>
				<div class="col-span-2">
					{@render FieldLabel('ds-rotation', 'Rotation mode', CONFIG_HELP.rotation_mode)}
					<select id="ds-rotation" bind:value={editRotationMode} class="ds-input">
						{#each status.rotation_modes as mode (mode)}
							<option value={mode}>{ROTATION_LABELS[mode] ?? mode}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="mb-4">
				<div class="flex items-center justify-between mb-2">
					<div class="flex items-center gap-1">
						<h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
							Entity types
							<span class="font-normal text-gray-500 dark:text-gray-400"
								>({enabledCount} enabled)</span
							>
						</h4>
						{@render HelpTip(CONFIG_HELP.entity_types)}
					</div>
					<div class="flex gap-2">
						<button type="button" onclick={() => setAllTypes(true)} class="ds-link-btn"
							>Enable all</button
						>
						<button type="button" onclick={() => setAllTypes(false)} class="ds-link-btn"
							>Disable all</button
						>
					</div>
				</div>
				<div class="ds-type-grid">
					{#each status.entity_types as et (et.key)}
						<label class="ds-type-toggle" class:ds-type-off={!editEnabledTypes[et.key]}>
							<div class="ds-type-header">
								<input
									type="checkbox"
									checked={editEnabledTypes[et.key]}
									onchange={() => toggleType(et.key)}
								/>
								<span class="ds-type-name">{et.label}</span>
								<span
									class="ds-help ds-help-inline"
									tabindex="0"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
									onkeydown={(e) => e.stopPropagation()}
								>
									<span class="ds-help-icon" aria-hidden="true">?</span>
									<span class="ds-help-tip" role="tooltip"
										>{ENTITY_TYPE_HELP[et.key] ?? et.label}</span
									>
								</span>
							</div>
							<span class="ds-type-count">{resolvedCount(et.key)}/batch</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="mb-4">
				<div class="flex items-center gap-1">
					<button
						type="button"
						class="ds-advanced-toggle"
						onclick={() => (showAdvanced = !showAdvanced)}
					>
						{showAdvanced ? '▼' : '▶'} Per-type count overrides
						<span class="text-gray-500 dark:text-gray-400 font-normal"
							>(optional — blank uses defaults from batch size)</span
						>
					</button>
					{@render HelpTip(CONFIG_HELP.type_overrides)}
				</div>
				{#if showAdvanced}
					<div class="ds-type-grid mt-2">
						{#each status.entity_types as et (et.key)}
							<div>
								{@render FieldLabel(
									`count-${et.key}`,
									et.label,
									ENTITY_TYPE_HELP[et.key] ?? CONFIG_HELP.type_overrides
								)}
								<input
									id="count-{et.key}"
									type="number"
									min="0"
									max="100"
									placeholder={String(resolvedCount(et.key))}
									bind:value={editTypeCounts[et.key]}
									class="ds-input"
									disabled={!editEnabledTypes[et.key]}
								/>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex gap-3">
				<button onclick={saveConfig} disabled={saving} class="ds-btn ds-btn-secondary flex-1">
					{saving ? 'Saving...' : 'Save Config'}
				</button>
				<span class="flex items-center gap-1">
					<button onclick={handleReset} class="ds-btn ds-btn-danger">Reset Counters</button>
					{@render HelpTip(CONFIG_HELP.reset_counters)}
				</span>
			</div>
		</div>

		{#if accessDeniedOp}
			{#if ctx.ui?.AccessDenied}
				<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
			{:else}
				<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
			{/if}
		{:else if error}
			<div
				class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
			>
				<p class="text-sm text-red-800 dark:text-red-300">{error}</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.ds-stats-grid {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 0.375rem;
	}
	@media (max-width: 640px) {
		.ds-stats-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
	.ds-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.375rem 0.25rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		background: #fff;
	}
	:global(.dark) .ds-stat {
		background: #1f2937;
		border-color: #374151;
	}
	.ds-stat-val {
		font-size: 1.125rem;
		font-weight: 700;
		line-height: 1.2;
	}
	.ds-stat-lbl {
		font-size: 0.625rem;
		color: #6b7280;
		margin-top: 0.125rem;
		text-align: center;
	}
	:global(.dark) .ds-stat-lbl {
		color: #9ca3af;
	}
	.ds-btn {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 150ms;
		border: none;
	}
	.ds-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.ds-btn-primary {
		color: #fff !important;
		background-color: #4f46e5 !important;
	}
	.ds-btn-primary:hover:not(:disabled) {
		background-color: #4338ca !important;
	}
	.ds-btn-secondary {
		color: #374151 !important;
		background-color: #f3f4f6 !important;
		border: 1px solid #d1d5db !important;
	}
	.ds-btn-secondary:hover:not(:disabled) {
		background-color: #e5e7eb !important;
	}
	:global(.dark) .ds-btn-secondary {
		color: #d1d5db !important;
		background-color: #374151 !important;
		border-color: #4b5563 !important;
	}
	:global(.dark) .ds-btn-secondary:hover:not(:disabled) {
		background-color: #4b5563 !important;
	}
	.ds-btn-danger {
		color: #dc2626 !important;
		background-color: transparent !important;
		border: 1px solid #fca5a5 !important;
	}
	.ds-btn-danger:hover:not(:disabled) {
		background-color: #fef2f2 !important;
	}
	:global(.dark) .ds-btn-danger {
		color: #f87171 !important;
		border-color: #7f1d1d !important;
	}
	:global(.dark) .ds-btn-danger:hover:not(:disabled) {
		background-color: #7f1d1d33 !important;
	}
	.ds-input {
		width: 100%;
		padding: 0.375rem 0.625rem;
		font-size: 0.875rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		background: #fff;
		color: #111827;
		transition: border-color 150ms;
	}
	.ds-input:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
	}
	:global(.dark) .ds-input {
		background: #1f2937;
		border-color: #4b5563;
		color: #f3f4f6;
	}
	.ds-type-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.375rem;
	}
	@media (max-width: 640px) {
		.ds-type-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	.ds-type-toggle {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0.625rem;
		border: 1px solid #c7d2fe;
		border-radius: 0.375rem;
		background: #eef2ff;
		cursor: pointer;
		transition: all 150ms;
	}
	:global(.dark) .ds-type-toggle {
		background: #312e81;
		border-color: #4338ca;
	}
	.ds-type-toggle.ds-type-off {
		background: #f9fafb;
		border-color: #e5e7eb;
		opacity: 0.7;
	}
	:global(.dark) .ds-type-toggle.ds-type-off {
		background: #1f2937;
		border-color: #374151;
	}
	.ds-type-toggle input {
		margin-right: 0.375rem;
	}
	.ds-type-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: #3730a3;
	}
	:global(.dark) .ds-type-name {
		color: #c7d2fe;
	}
	.ds-type-off .ds-type-name {
		color: #6b7280;
	}
	:global(.dark) .ds-type-off .ds-type-name {
		color: #9ca3af;
	}
	.ds-type-count {
		font-size: 0.625rem;
		color: #6366f1;
	}
	:global(.dark) .ds-type-count {
		color: #a5b4fc;
	}
	.ds-link-btn {
		font-size: 0.75rem;
		color: #4f46e5;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}
	.ds-link-btn:hover {
		text-decoration: underline;
	}
	:global(.dark) .ds-link-btn {
		color: #a5b4fc;
	}
	.ds-advanced-toggle {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #374151;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		text-align: left;
	}
	:global(.dark) .ds-advanced-toggle {
		color: #d1d5db;
	}
	.ds-label-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 0.25rem;
	}
	.ds-help {
		position: relative;
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
	}
	.ds-help-inline {
		margin-left: auto;
	}
	.ds-help-icon {
		width: 0.875rem;
		height: 0.875rem;
		border-radius: 9999px;
		background: #e5e7eb;
		color: #6b7280;
		font-size: 0.625rem;
		font-weight: 700;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: help;
		user-select: none;
	}
	:global(.dark) .ds-help-icon {
		background: #374151;
		color: #9ca3af;
	}
	.ds-help:hover .ds-help-icon,
	.ds-help:focus-visible .ds-help-icon {
		background: #c7d2fe;
		color: #4338ca;
	}
	:global(.dark) .ds-help:hover .ds-help-icon,
	:global(.dark) .ds-help:focus-visible .ds-help-icon {
		background: #4338ca;
		color: #e0e7ff;
	}
	.ds-help-tip {
		position: absolute;
		bottom: calc(100% + 0.375rem);
		left: 50%;
		transform: translateX(-50%);
		width: max-content;
		max-width: 14rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: #1f2937;
		color: #f9fafb;
		font-size: 0.6875rem;
		font-weight: 400;
		line-height: 1.35;
		text-align: left;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transition:
			opacity 150ms,
			visibility 150ms;
		z-index: 50;
	}
	.ds-help-tip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-top-color: #1f2937;
	}
	.ds-help:hover .ds-help-tip,
	.ds-help:focus-visible .ds-help-tip,
	.ds-help:focus-within .ds-help-tip {
		opacity: 1;
		visibility: visible;
	}
	.ds-type-header {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		width: 100%;
	}
	.ds-type-header .ds-type-name {
		flex: 1;
		min-width: 0;
	}
</style>
