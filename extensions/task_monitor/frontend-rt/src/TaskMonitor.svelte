<script lang="ts">
	import { untrack } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';

	let { ctx }: { ctx: any } = $props();

	type Reply = { ok: boolean; error?: string; [key: string]: any };

	interface TaskSchedule {
		name: string;
		disabled: boolean;
		run_at: number;
		repeat_every: number;
		last_run_at: number;
	}

	interface TaskStep {
		op: string;
		args: Record<string, unknown>;
		wait: number;
		status: string;
	}

	interface Task {
		name: string;
		status: string;
		creator: string;
		steps: TaskStep[];
		schedules: TaskSchedule[];
	}

	interface TaskRun {
		name: string;
		status: string;
		started_at: number;
		completed_at: number;
		result: string;
	}

	let tasks: Task[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let searchTerm = $state('');
	let statusFilter = $state('');

	let runningTasks: Record<string, boolean> = $state({});
	let deletingTasks: Record<string, boolean> = $state({});
	let stoppingTasks: Record<string, boolean> = $state({});

	const PAGE_SIZE = 10;
	const RUNS_PAGE = 10;
	// Rows of deleted tasks leave empty id ranges: read on until a page has rows.
	const MAX_EMPTY_PAGES = 20;
	let fromId = $state(1);
	let nextFromId: number | null = $state(null);
	let hasMore = $state(false);
	let pageHistory: number[] = $state([1]);

	let selectedTask = $state('');
	let taskDetail: Task | null = $derived(
		selectedTask ? (tasks.find((t) => t.name === selectedTask) ?? null) : null,
	);
	let taskRuns: TaskRun[] = $state([]);
	let runsNext: number | null = $state(null);
	let runsLoading = $state(false);
	let runsNote = $state('');
	let detailLoading = $state(false);

	let expandedExecution: string | null = $state(null);
	let showCodeModal = $state(false);
	let codeModalContent: { name: string; code: string; description: string } | null = $state(null);
	let activeDetailTab: 'overview' | 'steps' | 'executions' = $state('overview');
	let viewMode: 'grid' | 'list' = $state('grid');

	let stats = $derived({
		total: tasks.length,
		running: tasks.filter((t) => isTaskBusy(t)).length,
		pending: tasks.filter((t) => t.status?.toLowerCase() === 'pending').length,
		completed: tasks.filter((t) => t.status?.toLowerCase() === 'completed').length,
		failed: tasks.filter((t) => t.status?.toLowerCase() === 'failed').length,
	});

	let filteredTasks = $derived(
		tasks.filter((task) => {
			const matchesSearch =
				!searchTerm ||
				task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				task.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
				stepSummary(task).toLowerCase().includes(searchTerm.toLowerCase());
			const matchesStatus =
				!statusFilter || task.status?.toLowerCase() === statusFilter.toLowerCase();
			return matchesSearch && matchesStatus;
		}),
	);

	function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
		const level = type === 'error' ? 'error' : type === 'info' ? 'info' : 'success';
		if (typeof ctx.notify === 'function') {
			ctx.notify(level, message);
			return;
		}
		console.warn('[extension]', level, message);
	}

	async function call(write: boolean, name: string, args: Record<string, unknown> = {}): Promise<Reply> {
		try {
			const reply = await (write ? ctx.run(name, args) : ctx.read(name, args));
			if (reply && typeof reply === 'object') return reply;
		} catch (e: any) {
			return { ok: false, error: e?.message || `${name} did not answer` };
		}
		return { ok: false, error: `${name} did not answer` };
	}

	function toTask(raw: any): Task {
		return {
			name: String(raw?.name ?? ''),
			status: String(raw?.status ?? ''),
			creator: String(raw?.creator ?? ''),
			steps: (Array.isArray(raw?.steps) ? raw.steps : []).map((s: any) => ({
				op: String(s?.op ?? ''),
				args: s?.args && typeof s.args === 'object' ? s.args : {},
				wait: Number(s?.wait) || 0,
				status: String(s?.status ?? ''),
			})),
			schedules: (Array.isArray(raw?.schedules) ? raw.schedules : []).map((s: any) => ({
				name: String(s?.name ?? ''),
				disabled: !!s?.disabled,
				run_at: Number(s?.run_at) || 0,
				repeat_every: Number(s?.repeat_every) || 0,
				last_run_at: Number(s?.last_run_at) || 0,
			})),
		};
	}

	function toRun(raw: any): TaskRun {
		const result = raw?.result;
		return {
			name: String(raw?.name ?? ''),
			status: String(raw?.status ?? ''),
			started_at: Number(raw?.started_at) || 0,
			completed_at: Number(raw?.completed_at) || 0,
			result: typeof result === 'string' ? result : result == null ? '' : JSON.stringify(result),
		};
	}

	async function loadTasks() {
		const rows: Task[] = [];
		let from: number | null = fromId;
		let next: number | null = null;
		for (let i = 0; from != null && i < MAX_EMPTY_PAGES; i++) {
			const reply = await call(false, 'task_list', { from, count: PAGE_SIZE });
			if (!reply.ok) {
				error = `Tasks could not be read: ${reply.error || 'no reply'}`;
				loading = false;
				return;
			}
			rows.push(...(Array.isArray(reply.tasks) ? reply.tasks : []).map(toTask).filter((t: Task) => t.name));
			next = typeof reply.next === 'number' ? reply.next : null;
			if (rows.length) break;
			from = next;
		}
		tasks = rows;
		nextFromId = next;
		hasMore = next != null;
		error = '';
		loading = false;
	}

	function goNextPage() {
		if (nextFromId) {
			pageHistory = [...pageHistory, nextFromId];
			fromId = nextFromId;
			loadTasks();
		}
	}

	function goPrevPage() {
		if (pageHistory.length > 1) {
			pageHistory = pageHistory.slice(0, -1);
			fromId = pageHistory[pageHistory.length - 1];
			loadTasks();
		}
	}

	async function viewTaskDetails(name: string) {
		selectedTask = name;
		expandedExecution = null;
		taskRuns = [];
		runsNext = null;
		detailLoading = true;
		await loadRuns(name);
		detailLoading = false;
	}

	async function loadRuns(name: string, from: number | null = null) {
		runsLoading = true;
		const args: Record<string, unknown> = { task: name, count: RUNS_PAGE };
		if (from != null) args.from = from;
		const reply = await call(false, 'task_logs', args);
		runsLoading = false;
		if (selectedTask !== name) return;
		if (reply.ok) {
			const runs = (Array.isArray(reply.runs) ? reply.runs : []).map(toRun);
			taskRuns = from == null ? runs : [...taskRuns, ...runs];
			runsNext = typeof reply.next === 'number' ? reply.next : null;
			runsNote = '';
		} else {
			runsNote = `Runs could not be read: ${reply.error || 'no reply'}`;
		}
	}

	function goBackToList() {
		selectedTask = '';
		taskRuns = [];
		runsNext = null;
		runsNote = '';
		activeDetailTab = 'overview';
		expandedExecution = null;
	}

	/** A run's result is the last step's reply as JSON (cut at 5000 characters): shown readable. */
	function formatResult(result: string): string {
		if (!result) return '';
		try {
			const parsed = JSON.parse(result);
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				const { ok, error: reason, ...rest } = parsed;
				if (ok === false) return `Step refused: ${reason ?? 'no reason given'}`;
				return Object.keys(rest).length ? JSON.stringify(rest, null, 2) : 'Done';
			}
		} catch {
			/* cut short or plain text */
		}
		return result;
	}

	function toggleExecution(name: string) {
		expandedExecution = expandedExecution === name ? null : name;
	}

	function openCodeModal(codex: { name: string; code: string; description: string }) {
		codeModalContent = codex;
		showCodeModal = true;
	}

	function closeCodeModal() {
		showCodeModal = false;
		codeModalContent = null;
	}

	async function runTaskNow(name: string) {
		runningTasks[name] = true;
		const reply = await call(true, 'task_run', { task: name });
		if (!reply.ok) showToast(reply.error || 'The task did not run', 'error');
		else if (reply.status === 'failed') showToast('The task ran and a step was refused', 'error');
		else if (reply.status === 'waiting') showToast('Task started: waiting before its next step', 'info');
		else showToast('Task completed', 'success');
		await loadTasks();
		if (selectedTask === name) await loadRuns(name);
		delete runningTasks[name];
	}

	async function stopTask(name: string) {
		stoppingTasks[name] = true;
		const reply = await call(true, 'task_cancel', { task: name });
		if (reply.ok) showToast('Task cancelled', 'success');
		else showToast(reply.error || 'The task was not cancelled', 'error');
		await loadTasks();
		if (selectedTask === name) await loadRuns(name);
		delete stoppingTasks[name];
	}

	/** task_delete removes at most 100 runs per call: call again until none remain. */
	async function deleteTask(name: string) {
		deletingTasks[name] = true;
		let reply: Reply = { ok: false };
		for (let i = 0; i < 50; i++) {
			reply = await call(true, 'task_delete', { task: name });
			if (!reply.ok || !reply.remaining) break;
		}
		if (reply.ok && !reply.remaining) {
			showToast('Task deleted', 'success');
			if (selectedTask === name) goBackToList();
		} else if (reply.ok) {
			showToast('Part of the run history remains: delete again to finish', 'info');
		} else {
			showToast(reply.error || 'The task was not deleted', 'error');
		}
		await loadTasks();
		delete deletingTasks[name];
	}

	function getStatusColor(status: string): string {
		const s = status?.toLowerCase();
		if (s === 'running') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
		if (s === 'waiting')
			return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
		if (s === 'pending')
			return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
		if (s === 'completed')
			return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
		if (s === 'failed') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
		return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
	}

	function stepSummary(task: Task): string {
		return task.steps.map((s) => s.op).filter(Boolean).join(' → ');
	}

	function shortPrincipal(p: string): string {
		if (!p) return '-';
		return p.length > 16 ? `${p.slice(0, 8)}…${p.slice(-5)}` : p;
	}

	function formatRelativeTime(timestamp: number | null): string {
		if (!timestamp) return '-';
		const ms = timestamp > 1e15 ? timestamp / 1e6 : timestamp > 1e12 ? timestamp : timestamp * 1000;
		const diffMs = Date.now() - ms;
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHour = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHour / 24);
		if (diffSec < 60) return 'Just now';
		if (diffMin < 60) return `${diffMin}m ago`;
		if (diffHour < 24) return `${diffHour}h ago`;
		return `${diffDay}d ago`;
	}

	function formatInterval(seconds: number): string {
		if (!seconds) return 'One-time';
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (days > 0) return `Every ${days}d ${hours}h`;
		if (hours > 0) return `Every ${hours}h ${minutes}m`;
		if (minutes > 0) return `Every ${minutes}m`;
		return `Every ${seconds}s`;
	}

	function formatTimestamp(ts: number | null): string {
		if (!ts) return '-';
		const ms = ts > 1e15 ? ts / 1e6 : ts > 1e12 ? ts : ts * 1000;
		return new Date(ms).toLocaleString();
	}

	/** running, or waiting between steps: such a task cannot be run, edited or deleted. */
	function isTaskBusy(task: { status?: string } | null): boolean {
		const s = task?.status?.toLowerCase();
		return s === 'running' || s === 'waiting';
	}

	function isCancelled(task: { status?: string } | null): boolean {
		return task?.status?.toLowerCase() === 'cancelled';
	}

	$effect(() => {
		untrack(() => loadTasks());
		const interval = setInterval(loadTasks, 10000);
		return () => clearInterval(interval);
	});
</script>

<div class="w-full py-6">
	<!-- Code Modal -->
	{#if showCodeModal && codeModalContent}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div class="absolute inset-0 bg-black/50 backdrop-blur-sm" role="button" tabindex="-1" aria-label="Close modal" onclick={closeCodeModal} onkeydown={(e) => { if (e.key === 'Escape') closeCodeModal(); }}></div>
			<div class="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
				<div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
					<div>
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">{codeModalContent.name}</h3>
						{#if codeModalContent.description}
							<p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{codeModalContent.description}</p>
						{/if}
					</div>
					<button onclick={closeCodeModal} aria-label="Close" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
					</button>
				</div>
				<div class="flex-1 overflow-auto p-6">
					<pre class="text-sm font-mono bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">{codeModalContent.code || 'No arguments'}</pre>
				</div>
			</div>
		</div>
	{/if}

	<!-- Detail View -->
	{#if selectedTask}
		<div class="mb-4">
			<button
				onclick={goBackToList}
				class="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
				Back to tasks
			</button>
		</div>

		{#if detailLoading}
			<div class="flex justify-center py-16">
				<svg class="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
			</div>
		{:else if taskDetail}
			<!-- Task Header -->
			<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
				<div class="p-6 border-b border-gray-100 dark:border-gray-700">
					<div class="flex items-start justify-between gap-4">
						<div>
							<h2 class="text-xl font-bold text-gray-900 dark:text-white">{taskDetail.name}</h2>
							<p class="text-xs text-gray-400 mt-1 font-mono" title={taskDetail.creator}>Created by {shortPrincipal(taskDetail.creator)}</p>
						</div>
						{#if taskDetail.status}
							<span class="px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(taskDetail.status)}">
								{taskDetail.status}
							</span>
						{/if}
					</div>
				</div>

				<div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex gap-3">
					{#if isTaskBusy(taskDetail)}
						<button
							onclick={() => stopTask(selectedTask)}
							disabled={stoppingTasks[selectedTask]}
							title="Cancels the task for good: its schedules stop and a waiting run ends before its next step"
							class="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-2"
						>
							{#if stoppingTasks[selectedTask]}
								<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
								Cancelling...
							{:else}
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
								Cancel
							{/if}
						</button>
					{:else}
						<button
							onclick={() => runTaskNow(selectedTask)}
							disabled={runningTasks[selectedTask] || isCancelled(taskDetail)}
							title={isCancelled(taskDetail) ? 'A cancelled task does not run again' : ''}
							class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-2"
						>
							{#if runningTasks[selectedTask]}
								<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
								Starting...
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
								Run Now
							{/if}
						</button>
					{/if}
					<button
						onclick={() => deleteTask(selectedTask)}
						disabled={deletingTasks[selectedTask] || isTaskBusy(taskDetail)}
						class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg flex items-center gap-2"
						title={isTaskBusy(taskDetail) ? 'Cannot delete a running task' : ''}
					>
						{#if deletingTasks[selectedTask]}
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
						{/if}
						Delete
					</button>
				</div>
			</div>

			<!-- Tabs -->
			<div class="mb-6 border-b border-gray-200 dark:border-gray-700">
				<nav class="flex gap-6" aria-label="Tabs">
					<button
						onclick={() => activeDetailTab = 'overview'}
						class="pb-3 text-sm font-medium border-b-2 transition-colors
							{activeDetailTab === 'overview'
								? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
								: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}"
					>
						Overview
					</button>
					<button
						onclick={() => activeDetailTab = 'steps'}
						class="pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5
							{activeDetailTab === 'steps'
								? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
								: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}"
					>
						Steps
						{#if taskDetail.steps?.length}
							<span class="px-1.5 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{taskDetail.steps.length}</span>
						{/if}
					</button>
					<button
						onclick={() => activeDetailTab = 'executions'}
						class="pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5
							{activeDetailTab === 'executions'
								? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
								: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'}"
					>
						Executions
						{#if taskRuns.length}
							<span class="px-1.5 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{taskRuns.length}{runsNext != null ? '+' : ''}</span>
						{/if}
					</button>
				</nav>
			</div>

			<!-- Tab: Overview -->
			{#if activeDetailTab === 'overview'}
				<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
					<div class="p-6 space-y-4">
						{#if stepSummary(taskDetail)}
							<p class="text-sm text-gray-600 dark:text-gray-400 font-mono">{stepSummary(taskDetail)}</p>
						{/if}

						<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
							<div>
								<span class="block text-gray-500 dark:text-gray-400">Created By</span>
								<span class="font-medium text-gray-900 dark:text-white font-mono" title={taskDetail.creator}>{shortPrincipal(taskDetail.creator)}</span>
							</div>
							<div>
								<span class="block text-gray-500 dark:text-gray-400">Last Run</span>
								<span class="font-medium text-gray-900 dark:text-white">{formatTimestamp(taskRuns[0]?.started_at ?? null)}</span>
							</div>
							<div>
								<span class="block text-gray-500 dark:text-gray-400">Executions</span>
								<span class="font-medium text-gray-900 dark:text-white">{taskRuns.length}{runsNext != null ? '+' : ''}</span>
							</div>
							<div>
								<span class="block text-gray-500 dark:text-gray-400">Steps</span>
								<span class="font-medium text-gray-900 dark:text-white">{taskDetail.steps.length}</span>
							</div>
						</div>

						{#if taskDetail.schedules.length > 0}
							<div>
								<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Schedules</h3>
								<div class="space-y-2">
									{#each taskDetail.schedules as sched}
										<div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-2 text-sm">
											<div class="flex items-center gap-2">
												<span class={sched.disabled ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}>
													{formatInterval(sched.repeat_every)}
												</span>
												{#if sched.disabled}
													<span class="px-1.5 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">Paused</span>
												{/if}
												{#if sched.last_run_at}
													<span class="text-xs text-gray-400">Last: {formatRelativeTime(sched.last_run_at)}</span>
												{/if}
											</div>
											{#if !sched.disabled && sched.run_at}
												<span class="text-xs text-gray-500 dark:text-gray-400">Next: {formatTimestamp(sched.run_at)}</span>
											{/if}
										</div>
									{/each}
								</div>
								<p class="mt-2 text-xs text-gray-400">Single schedules cannot be paused here; cancelling the task stops all of them.</p>
							</div>
						{/if}
					</div>
				</div>

			<!-- Tab: Steps -->
			{:else if activeDetailTab === 'steps'}
				<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
					{#if !taskDetail.steps.length}
						<div class="p-12 text-center">
							<svg class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
							<p class="text-gray-500 dark:text-gray-400">No steps defined for this task</p>
						</div>
					{:else}
						<div class="divide-y divide-gray-100 dark:divide-gray-700">
							{#each taskDetail.steps as step, idx}
								<div class="p-4">
									<div class="flex items-start justify-between gap-3">
										<div class="flex items-start gap-3">
											<div class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
												{step.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
												 step.status === 'running' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
												 step.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
												 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}">
												{#if step.status === 'completed'}
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
												{:else if step.status === 'running'}
													<svg class="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
												{:else if step.status === 'failed'}
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
												{:else}
													{idx + 1}
												{/if}
											</div>
											<div>
												<div class="flex items-center gap-2">
													<span class="text-sm font-medium text-gray-900 dark:text-white">Step {idx + 1}</span>
													<span class="px-1.5 py-0.5 rounded text-xs font-medium {getStatusColor(step.status || 'pending')}">
														{step.status || 'pending'}
													</span>
												</div>
												{#if step.op}
													<div class="mt-1.5 flex items-center gap-2">
														<svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
														<span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{step.op}</span>
													</div>
												{/if}
												{#if step.wait}
													<p class="text-xs text-gray-400 mt-1">Delay before next: {step.wait}s</p>
												{/if}
											</div>
										</div>
										{#if Object.keys(step.args).length}
											<button
												onclick={() => openCodeModal({ name: step.op, code: JSON.stringify(step.args, null, 2), description: `Arguments of step ${idx + 1}` })}
												class="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
											>
												<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
												View Arguments
											</button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

			<!-- Tab: Executions -->
			{:else if activeDetailTab === 'executions'}
				<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
					{#if runsNote}
						<p class="px-5 pt-4 text-sm text-gray-500 dark:text-gray-400">{runsNote}</p>
					{/if}
					{#if !taskRuns.length}
						<div class="p-12 text-center">
							<svg class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
							<p class="text-gray-500 dark:text-gray-400">No executions recorded yet</p>
						</div>
					{:else}
						<div class="divide-y divide-gray-100 dark:divide-gray-700">
							{#each taskRuns as exec (exec.name)}
								{@const resultText = formatResult(exec.result)}
								<div>
									<button
										onclick={() => toggleExecution(exec.name)}
										class="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
									>
										<div class="flex-shrink-0">
											{#if exec.status === 'completed'}
												<div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
													<svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
												</div>
											{:else if exec.status === 'running'}
												<div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
													<svg class="animate-spin w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
												</div>
											{:else if exec.status === 'failed'}
												<div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
													<svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
												</div>
											{:else}
												<div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
													<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
												</div>
											{/if}
										</div>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium text-gray-900 dark:text-white truncate">{exec.name}</span>
												<span class="px-1.5 py-0.5 rounded text-xs font-medium {getStatusColor(exec.status)}">
													{exec.status || 'pending'}
												</span>
											</div>
											<div class="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
												<span>{formatTimestamp(exec.started_at)}</span>
												{#if resultText}
													<span class="truncate max-w-xs">{resultText.replace(/\s+/g, ' ').substring(0, 80)}{resultText.length > 80 ? '...' : ''}</span>
												{/if}
											</div>
										</div>
										<div class="flex-shrink-0">
											<svg class="w-4 h-4 text-gray-400 transition-transform {expandedExecution === exec.name ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
										</div>
									</button>

									{#if expandedExecution === exec.name}
										<div class="px-5 pb-4 pl-16">
											<div class="mb-3 grid grid-cols-2 gap-4 text-xs">
												<div>
													<span class="block text-gray-500 dark:text-gray-400">Started</span>
													<span class="text-gray-700 dark:text-gray-300">{formatTimestamp(exec.started_at)}</span>
												</div>
												<div>
													<span class="block text-gray-500 dark:text-gray-400">Finished</span>
													<span class="text-gray-700 dark:text-gray-300">{formatTimestamp(exec.completed_at)}</span>
												</div>
											</div>
											<span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Result</span>
											{#if resultText}
												<pre class="mt-1 text-xs font-mono bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-words">{resultText}</pre>
											{:else}
												<p class="mt-1 text-sm text-gray-400">No result yet</p>
											{/if}
											<p class="mt-2 text-xs text-gray-400">The realm keeps the reply of the last step of each run; separate run logs are not kept.</p>
										</div>
									{/if}
								</div>
							{/each}
						</div>

						{#if runsNext != null}
							<div class="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-center">
								<button
									onclick={() => loadRuns(selectedTask, runsNext)}
									disabled={runsLoading}
									class="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
								>
									{runsLoading ? 'Loading...' : 'Load more executions...'}
								</button>
							</div>
						{/if}
					{/if}
				</div>
			{/if}
		{:else}
			<p class="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">This task is no longer listed.</p>
		{/if}

	<!-- List View -->
	{:else}
		<div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
			<div>
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Task Monitor</h1>
				<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{extensionDescription}</p>
			</div>
			<div class="flex items-center gap-2">
				<div class="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
					<button
						onclick={() => viewMode = 'grid'}
						class="px-2.5 py-1.5 transition-colors {viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}"
						aria-label="Grid view"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
					</button>
					<button
						onclick={() => viewMode = 'list'}
						class="px-2.5 py-1.5 transition-colors {viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}"
						aria-label="List view"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
					</button>
				</div>
				<button
					onclick={loadTasks}
					class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
					Refresh
				</button>
			</div>
		</div>

		{#if error}
			<div class="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2 text-sm">
				<svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
				{error}
			</div>
		{/if}

		{#if loading}
			<div class="flex justify-center items-center py-16">
				<svg class="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
			</div>
		{:else}
			<!-- Stats & Search -->
			<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
				<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
					<div class="flex items-center gap-4 text-sm">
						<span class="font-medium text-gray-700 dark:text-gray-300">{stats.total} tasks</span>
						<span class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
							{#if stats.running > 0}
								<span class="relative flex h-2 w-2">
									<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
									<span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
								</span>
							{/if}
							{stats.running} running
						</span>
						<span class="text-yellow-600 dark:text-yellow-400 font-medium">{stats.pending} pending</span>
						<span class="text-green-600 dark:text-green-400 font-medium">{stats.completed} completed</span>
						<span class="text-red-600 dark:text-red-400 font-medium">{stats.failed} failed</span>
					</div>
					<div class="flex flex-1 items-center gap-2 ml-auto min-w-0">
						<div class="flex-1 relative min-w-[150px]">
							<svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
							<input
								type="text"
								bind:value={searchTerm}
								placeholder="Search tasks..."
								class="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
							/>
						</div>
						<select
							bind:value={statusFilter}
							class="w-36 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
						>
							<option value="">All Status</option>
							<option value="running">Running</option>
							<option value="waiting">Waiting</option>
							<option value="pending">Pending</option>
							<option value="completed">Completed</option>
							<option value="failed">Failed</option>
							<option value="cancelled">Cancelled</option>
						</select>
					</div>
				</div>
			</div>

		

			{#if filteredTasks.length === 0}
				<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
					<svg class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
					<p class="text-gray-500 dark:text-gray-400">{searchTerm || statusFilter ? 'No matching tasks' : 'No tasks found'}</p>
				</div>
			{:else}
				{#if viewMode === 'grid'}
				<!-- Task Cards Grid -->
				<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
					{#each filteredTasks as task (task.name)}
						<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 flex flex-col">
							<div class="p-4 border-b border-gray-100 dark:border-gray-700">
								<div class="flex justify-between items-start gap-2">
									<div class="flex-1 min-w-0">
										<h3 class="font-semibold text-gray-900 dark:text-white truncate">{task.name}</h3>
										<p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5" title={task.creator}>By {shortPrincipal(task.creator)}</p>
									</div>
									<div class="flex items-center gap-2">
										{#if isTaskBusy(task)}
											<span class="relative flex h-2.5 w-2.5">
												<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
												<span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
											</span>
										{/if}
										<span class="px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(task.status)}">
											{task.status || 'Unknown'}
										</span>
									</div>
								</div>
							</div>

							<div class="p-4 space-y-3 flex-1">
								{#if stepSummary(task)}
									<p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 font-mono">{stepSummary(task)}</p>
								{/if}

								<div class="flex flex-wrap gap-3 text-sm">
									{#if task.schedules?.length > 0}
										{@const schedule = task.schedules[0]}
										<div class="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
											<span class={schedule.disabled ? 'line-through text-gray-400' : ''}>
												{formatInterval(schedule.repeat_every)}
											</span>
										</div>
										{#if schedule.last_run_at}
											<span class="text-xs text-gray-500">Last: {formatRelativeTime(schedule.last_run_at)}</span>
										{/if}
									{:else}
										<span class="text-xs text-gray-500">One-time task</span>
									{/if}
									<button
										onclick={() => viewTaskDetails(task.name)}
										class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline text-xs"
									>
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
										{task.steps.length} {task.steps.length === 1 ? 'step' : 'steps'}
									</button>
								</div>
							</div>

							<div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 rounded-b-xl flex gap-2">
								<button
									onclick={() => viewTaskDetails(task.name)}
									class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
								>
									<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
									View
								</button>
								{#if !isTaskBusy(task)}
									<button
										onclick={() => runTaskNow(task.name)}
										disabled={runningTasks[task.name] || isCancelled(task)}
										title={isCancelled(task) ? 'A cancelled task does not run again' : ''}
										class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
									>
										{#if runningTasks[task.name]}
											<svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
										{:else}
											<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
										{/if}
										Run
									</button>
								{/if}
								<button
									onclick={() => deleteTask(task.name)}
									disabled={deletingTasks[task.name] || isTaskBusy(task)}
									class="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									title={isTaskBusy(task) ? 'Cannot delete a running task' : 'Delete'}
									aria-label="Delete task"
								>
									{#if deletingTasks[task.name]}
										<svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
									{:else}
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
									{/if}
								</button>
							</div>
						</div>
					{/each}
				</div>

				{:else}
				<!-- Task List View -->
				<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
					{#each filteredTasks as task (task.name)}
						<div class="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
							<div class="flex-shrink-0 flex items-center gap-2">
								{#if isTaskBusy(task)}
									<span class="relative flex h-2.5 w-2.5">
										<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
										<span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
									</span>
								{/if}
								<span class="px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(task.status)}">
									{task.status || 'Unknown'}
								</span>
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">{task.name}</h3>
								<div class="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
									{#if task.schedules?.length > 0}
										<span>{formatInterval(task.schedules[0].repeat_every)}</span>
										{#if task.schedules[0].last_run_at}
											<span>Last: {formatRelativeTime(task.schedules[0].last_run_at)}</span>
										{/if}
									{/if}
									<span>{task.steps.length} {task.steps.length === 1 ? 'step' : 'steps'}</span>
								</div>
							</div>
							<div class="flex items-center gap-2 flex-shrink-0">
								<button
									onclick={() => viewTaskDetails(task.name)}
									class="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
								>
									View
								</button>
								{#if !isTaskBusy(task)}
									<button
										onclick={() => runTaskNow(task.name)}
										disabled={runningTasks[task.name] || isCancelled(task)}
										title={isCancelled(task) ? 'A cancelled task does not run again' : ''}
										class="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
									>
										Run
									</button>
								{/if}
								<button
									onclick={() => deleteTask(task.name)}
									disabled={deletingTasks[task.name] || isTaskBusy(task)}
									class="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									title={isTaskBusy(task) ? 'Cannot delete a running task' : 'Delete'}
									aria-label="Delete task"
								>
									<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
								</button>
							</div>
						</div>
					{/each}
				</div>
				{/if}

				<!-- Pagination -->
				<div class="flex items-center justify-between mt-6">
					<button
						onclick={goPrevPage}
						disabled={pageHistory.length <= 1}
						class="text-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
					>
						Previous
					</button>
					<span class="text-xs text-gray-500 dark:text-gray-400">Page {pageHistory.length}</span>
					<button
						onclick={goNextPage}
						disabled={!hasMore}
						class="text-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
					>
						Next
					</button>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
