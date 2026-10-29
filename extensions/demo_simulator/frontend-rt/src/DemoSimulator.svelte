<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';

	let { ctx }: { ctx: any } = $props();

	interface EntityTypeMeta {
		key: string;
		label: string;
	}

	interface Config {
		interval_seconds: number;
		batch_size: number;
		max_entities: number | null;
		seed: number;
		rotation_mode: string;
		enabled_types: Record<string, boolean>;
		type_counts: Record<string, number>;
	}

	interface Status extends Config {
		running: boolean;
		batch_number: number;
		stats: Record<string, number | undefined>;
	}

	const TASK = 'demo_simulator';
	const ROTATION_MODES = ['round_robin', 'random', 'all'];
	const ENTITY_TYPES: EntityTypeMeta[] = [
		{ key: 'users', label: 'Users' },
		{ key: 'organizations', label: 'Organizations' },
		{ key: 'proposals', label: 'Proposals' },
		{ key: 'transfers', label: 'Transfers' },
		{ key: 'disputes', label: 'Disputes' },
		{ key: 'votes', label: 'Votes' },
		{ key: 'lands', label: 'Land parcels' },
		{ key: 'courts', label: 'Courts' },
		{ key: 'cases', label: 'Cases' },
		{ key: 'funds', label: 'Funds' },
		{ key: 'fiscal_periods', label: 'Fiscal periods' },
		{ key: 'budgets', label: 'Budget lines' },
		{ key: 'ledger_entries', label: 'Ledger entries' },
		{ key: 'messages', label: 'Messages' },
		{ key: 'departments', label: 'Departments' }
	];
	const UNSUPPORTED = new Set(['transfers', 'votes', 'cases', 'ledger_entries']);
	const REALM_ROWS: Record<string, string> = {
		users: 'User',
		organizations: 'Organization',
		proposals: 'Proposal',
		messages: 'Notification',
		departments: 'Department'
	};
	const DEFAULTS: Config = {
		interval_seconds: 30,
		batch_size: 5,
		max_entities: null,
		seed: 0,
		rotation_mode: 'round_robin',
		enabled_types: Object.fromEntries(ENTITY_TYPES.map((et) => [et.key, !UNSUPPORTED.has(et.key)])),
		type_counts: {}
	};

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
		transfers: 'Token transfers between members. Not supported by this realm version.',
		disputes: 'Legal disputes for the justice module.',
		votes: 'Vote records linked to proposals. Not supported by this realm version.',
		lands: 'Land parcels with coordinates, zones, and ownership.',
		courts: 'Court institutions with judges and specializations.',
		cases: 'Legal cases filed in courts. Not supported by this realm version.',
		funds: 'Treasury funds used by finance and metrics extensions.',
		fiscal_periods: 'Fiscal year periods for budgeting and reporting.',
		budgets: 'Budget line items (revenue and expense categories).',
		ledger_entries: 'Double-entry ledger transactions across funds. Not supported by this realm version.',
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

	let status = $state<Status | null>(null);
	let task: any = null;
	let saved: Config = DEFAULTS;
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
			? Object.values(status.stats).reduce((sum: number, v) => sum + (v ?? 0), 0)
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

	function statValue(key: string): number | string {
		return status?.stats[key] ?? '–';
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
		for (const et of ENTITY_TYPES) {
			const override = data.type_counts?.[et.key];
			counts[et.key] = override != null ? String(override) : '';
		}
		editTypeCounts = counts;
	}

	function fail(e: any) {
		const op = ctx.ui?.accessDeniedOperation?.(e);
		accessDeniedOp = op ?? '';
		error = op != null ? '' : (e?.message ?? String(e));
	}

	async function call(name: string, args: Record<string, unknown> = {}, read = false) {
		const reply = await (read ? ctx.read(name, args) : ctx.run(name, args));
		if (!reply.ok) throw new Error(reply.error);
		return reply;
	}

	async function findTask() {
		for (let from: number | null = 1; from != null; ) {
			const page = await call('task_list', { from, count: 100 }, true);
			const found = page.tasks.find((t: any) => t.name === TASK);
			if (found) return found;
			from = page.next;
		}
		return null;
	}

	function steps(config: Config) {
		return [
			{
				op: 'extension_call',
				args: { extension: ctx.extensionId, function: 'run_batch', args: { config } },
				wait: 0
			}
		];
	}

	/** A new simulator task holding ``config``: deleting the old one also clears its run history. */
	async function createTask(config: Config, schedule: boolean) {
		if (task) {
			while ((await call('task_delete', { task: TASK })).remaining > 0);
		}
		await call('task_create', { name: TASK, steps: steps(config) });
		if (schedule) await call('task_schedule', { task: TASK, repeat_every: config.interval_seconds });
	}

	function randomSeed(): number {
		return Math.floor(Math.random() * 999999) + 1;
	}

	async function fetchStatus() {
		try {
			const [found, monitor] = await Promise.all([findTask(), call('realm_monitor', {}, true)]);
			task = found;
			saved = task ? task.steps[0].args.args.config : DEFAULTS;
			const runs = task ? (await call('task_logs', { task: TASK, count: 1 }, true)).runs : [];
			const data: Status = {
				...saved,
				running: !!task && task.status !== 'cancelled' && task.schedules.some((s: any) => !s.disabled),
				batch_number: runs.length ? Number(runs[0].name.split('#').pop()) : 0,
				stats: Object.fromEntries(
					Object.entries(REALM_ROWS).map(([key, entity]) => [key, monitor.rows[entity]])
				)
			};
			status = data;
			applyStatusToForm(data);
		} catch (e: any) {
			fail(e);
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
			if (status.running) await call('task_cancel', { task: TASK });
			else if (task && task.status !== 'cancelled')
				await call('task_schedule', { task: TASK, repeat_every: saved.interval_seconds });
			else await createTask(saved, true);
			await fetchStatus();
		} catch (e: any) {
			fail(e);
		} finally {
			toggling = false;
		}
	}

	function buildConfigPayload(): Config {
		const maxEntities = parseInt(editMaxEntities.toString().trim(), 10);
		const typeCounts: Record<string, number> = {};
		for (const [key, val] of Object.entries(editTypeCounts)) {
			const trimmed = val.trim();
			if (trimmed) {
				typeCounts[key] = Math.max(0, Math.min(100, parseInt(trimmed, 10)));
			}
		}
		return {
			interval_seconds: Math.max(10, editInterval),
			batch_size: Math.max(1, Math.min(20, editBatchSize)),
			max_entities: maxEntities ? Math.max(10, maxEntities) : null,
			seed: editSeed.trim() ? parseInt(editSeed, 10) : randomSeed(),
			rotation_mode: editRotationMode,
			enabled_types: editEnabledTypes,
			type_counts: typeCounts
		};
	}

	async function saveConfig() {
		saving = true;
		error = '';
		accessDeniedOp = '';
		try {
			const config = buildConfigPayload();
			if (!task) await createTask(config, false);
			else if (status?.running && config.interval_seconds !== saved.interval_seconds)
				await createTask(config, true);
			else await call('task_edit', { task: TASK, steps: steps(config) });
			await fetchStatus();
		} catch (e: any) {
			fail(e);
		} finally {
			saving = false;
		}
	}

	async function runOnce() {
		runningOnce = true;
		error = '';
		accessDeniedOp = '';
		try {
			if (!task || task.status === 'cancelled') await createTask(saved, false);
			await call('task_run', { task: TASK });
			const [run] = (await call('task_logs', { task: TASK, count: 1 }, true)).runs;
			const reply = JSON.parse(run.result);
			await fetchStatus();
			if (!reply.ok) error = reply.error;
			else if (reply.result.reason === 'no_enabled_types') {
				error = 'No entity types are enabled. Enable at least one type below.';
			}
		} catch (e: any) {
			fail(e);
		} finally {
			runningOnce = false;
		}
	}

	async function handleReset() {
		error = '';
		accessDeniedOp = '';
		try {
			await createTask({ ...saved, seed: randomSeed() }, !!status?.running);
			await fetchStatus();
		} catch (e: any) {
			fail(e);
		}
	}

	function setAllTypes(enabled: boolean) {
		if (!status) return;
		const next = { ...editEnabledTypes };
		for (const et of ENTITY_TYPES) {
			next[et.key] = enabled && !UNSUPPORTED.has(et.key);
		}
		editEnabledTypes = next;
	}

	function toggleType(key: string) {
		editEnabledTypes = {
			...editEnabledTypes,
			[key]: !editEnabledTypes[key]
		};
	}

	function defaultCount(key: string, batchSize: number): number {
		const bs = Math.max(1, batchSize);
		const half = Math.max(1, Math.floor(bs / 2));
		const third = Math.max(1, Math.floor(bs / 3));
		const counts: Record<string, number> = {
			organizations: half,
			proposals: half,
			disputes: third,
			lands: half,
			courts: third,
			cases: half,
			funds: 5,
			fiscal_periods: 2,
			budgets: Math.max(2, bs),
			ledger_entries: bs * 2,
			departments: Math.max(2, bs)
		};
		return counts[key] ?? bs;
	}

	function resolvedCount(key: string): number {
		if (!status) return 0;
		return status.type_counts[key] ?? defaultCount(key, status.batch_size);
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

<div class="w-full py-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Demo Simulator</h2>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{extensionDescription}</p>
		</div>
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
		<div class="ds-stats-grid mb-4">
			{#each ENTITY_TYPES as et (et.key)}
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
						{#each ROTATION_MODES as mode (mode)}
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
					{#each ENTITY_TYPES as et (et.key)}
						<label class="ds-type-toggle" class:ds-type-off={!editEnabledTypes[et.key]}>
							<div class="ds-type-header">
								<input
									type="checkbox"
									checked={editEnabledTypes[et.key]}
									disabled={UNSUPPORTED.has(et.key)}
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
						{#each ENTITY_TYPES as et (et.key)}
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
