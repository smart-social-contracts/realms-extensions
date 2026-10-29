<script lang="ts">
	import { onDestroy } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	let { ctx }: { ctx: any } = $props();

	let narrow = $state(isNarrowViewport());
	let unsubNarrow = subscribeNarrowViewport((value) => {
		narrow = value;
	});
	onDestroy(() => {
		unsubNarrow?.();
	});

	type Tab = 'list' | 'create' | 'courts' | 'stats';

	const PAGE = 25;
	const DIRECTORY_PAGE = 500;

	let tab = $state<Tab>('list');
	let litigations: any[] = $state([]);
	let totalCount = $derived(litigations.length);
	let userProfile = $state('member');
	let loading = $state(true);
	let loadingMore = $state(false);
	let hasMore = $state(false);
	let nextFromId = $state<number | null>(null);
	let error = $state('');
	let listUnsupported = $state(false);

	let principal = $state('');
	$effect(() => {
		const p = ctx.principal;
		if (typeof p === 'string') {
			principal = p;
		} else if (p && typeof p.subscribe === 'function') {
			const unsub = p.subscribe((v: string) => (principal = v || ''));
			return unsub;
		}
	});

	// Create form
	let formTitle = $state('');
	let formDescription = $state('');
	let formDefendant = $state('');
	let creating = $state(false);
	let createError = $state('');
	let createSuccess = $state(false);

	// New-court form (admin Courts tab)
	let showCourtForm = $state(false);
	let courtFormName = $state('');
	let courtFormLevel = $state('first_instance');
	let courtFormJurisdiction = $state('');
	let courtFormOperator = $state('');
	let courtFormParentId = $state('');
	let courtFormSaving = $state(false);
	let courtFormError = $state('');
	let courtFormSuccess = $state('');

	const COURT_LEVELS = [
		{ value: 'first_instance', label: 'First instance' },
		{ value: 'appellate', label: 'Appellate' },
		{ value: 'supreme', label: 'Supreme' },
		{ value: 'specialized', label: 'Specialized' },
	];

	// Defendant autocomplete — this canister only (issue #325).
	let directory: any[] = $state([]);
	let directoryLoaded = $state(false);
	let directoryLoading = $state(false);
	let showDefendantSuggestions = $state(false);

	let defendantSuggestions = $derived.by(() => {
		const q = formDefendant.trim().toLowerCase();
		if (!q || !showDefendantSuggestions) return [];
		return directory
			.filter(
				(e) =>
					(e.label || '').toLowerCase().includes(q) ||
					(e.principal || '').toLowerCase().includes(q) ||
					(e.kind || '').toLowerCase().includes(q),
			)
			.slice(0, 8);
	});

	let selectedDefendantEntry: any = $state(null);
	// The principal actually submitted. When the user picks a suggestion we show
	// its friendly label in the input but keep the real principal here.
	let defendantPrincipal = $state('');

	let defendantLabel = $derived.by(() => {
		if (selectedDefendantEntry) {
			const e = selectedDefendantEntry;
			// A department is filed against as a whole entity, so don't show its
			// head's principal (that would imply the case targets one person).
			if (e.kind === 'department') return `${e.label} (department)`;
			const p = e.principal;
			return `${e.label} (${e.kind})${p && p !== e.label ? ` — ${p}` : ''}`;
		}
		const v = formDefendant.trim();
		if (!v) return '';
		const hit = directory.find((e) => e.principal === v);
		return hit ? `${hit.label} (${hit.kind})` : '';
	});

	// A defendant is valid if a directory entry was picked (user OR department)
	// or the user typed a raw principal directly.
	let hasDefendant = $derived(!!selectedDefendantEntry || !!defendantPrincipal.trim());

	async function readPages(op: string, key: string) {
		const out: any[] = [];
		let from: number | null = 1;
		while (from !== null) {
			const res = await ctx.read(op, { from, count: DIRECTORY_PAGE });
			if (!res.ok) break;
			out.push(...res[key]);
			from = res.next;
		}
		return out;
	}

	async function loadDirectory() {
		if (directoryLoaded || directoryLoading) return;
		directoryLoading = true;
		const [users, departments] = await Promise.all([
			readPages('user_list', 'users'),
			readPages('department_list', 'departments'),
		]);
		directory = [
			...users.map((u) => ({ kind: 'user', label: u.nickname || u.id, principal: u.id })),
			...departments.map((d) => ({ kind: 'department', label: d.id, id: d.id, principal: '' })),
		];
		directoryLoaded = true;
		directoryLoading = false;
	}

	function selectDefendant(entry: any) {
		if (!entry) return;
		// Show the human-friendly label in the box, submit the real principal.
		formDefendant = entry.label || entry.principal || '';
		defendantPrincipal = entry.principal || '';
		selectedDefendantEntry = entry;
		showDefendantSuggestions = false;
	}

	// Verdict modal
	let showVerdict = $state(false);
	let verdictCase: any = $state(null);
	let verdictCourt = $state('');
	let verdictJudge = $state('');
	let verdictDecision = $state('');
	let verdictReasoning = $state('');
	let executingVerdict = $state(false);
	let verdictError = $state('');
	let verdictSuccess = $state(false);

	// Derived statistics
	let pendingCount = $derived(litigations.filter((l) => l.status === 'filed').length);
	let inReviewCount = $derived(
		litigations.filter((l) => l.status === 'accepted').length,
	);
	let resolvedCount = $derived(
		litigations.filter((l) => l.status === 'rejected' || l.status === 'withdrawn').length,
	);

	async function run(op: string, args: Record<string, unknown>) {
		const res = await ctx.run(op, args);
		if (!res.ok) throw new Error(res.error);
		return res;
	}

	async function createCourt() {
		if (courtFormName.trim().length < 2) {
			courtFormError = 'Court name must be at least 2 characters';
			return;
		}
		courtFormSaving = true;
		courtFormError = '';
		courtFormSuccess = '';
		try {
			const params: Record<string, unknown> = {
				name: courtFormName.trim(),
				operator: courtFormOperator.trim(),
				level: courtFormLevel,
				jurisdiction: courtFormJurisdiction.trim(),
			};
			if (courtFormParentId.trim()) params.parent = courtFormParentId.trim();
			const res = await run('court_create', params);
			courtFormSuccess = res.requires_vote ? `Submitted for a vote as ${res.proposal}` : `Court ${res.court} created!`;
			courtFormName = '';
			courtFormJurisdiction = '';
			courtFormOperator = '';
			courtFormParentId = '';
		} catch (e: any) {
			courtFormError = e?.message || String(e);
		} finally {
			courtFormSaving = false;
		}
	}

	function row(d: any) {
		const [kind, id] = d.respondent.split(':');
		return {
			...d,
			case_title: d.title,
			requester_principal: d.claimant,
			defendant_kind: kind === 'Department' ? 'department' : 'user',
			defendant_label: id,
		};
	}

	async function loadLitigations(append = false) {
		if (append) {
			loadingMore = true;
		} else {
			loading = true;
			nextFromId = null;
			hasMore = false;
		}
		error = '';
		try {
			if (!append) {
				const me = await ctx.read('me');
				if (!me.ok) throw new Error(me.error);
				userProfile = me.permissions.includes('dispute.view_all') ? 'admin' : 'member';
			}
			listUnsupported = userProfile !== 'admin';
			if (listUnsupported) return;
			const res = await ctx.read('dispute_list_all', { from: append ? nextFromId : 1, count: PAGE });
			if (!res.ok) throw new Error(res.error);
			const rows = res.disputes.map(row);
			litigations = append ? [...litigations, ...rows] : rows;
			nextFromId = res.next;
			hasMore = res.next !== null;
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	async function partyPrincipals(respondent: string): Promise<string[]> {
		const [kind, id] = respondent.includes(':') ? respondent.split(':') : ['User', respondent];
		if (kind === 'User') return [id];
		if (kind !== 'Department') return [];
		const res = await ctx.read('department_get', { department: id });
		if (!res.ok) throw new Error(res.error);
		return [res.department.head, ...res.positions.flatMap((p: any) => p.holders.map((h: any) => h.user))].filter(
			Boolean,
		);
	}

	async function createLitigation() {
		if (!formTitle.trim() || !formDescription.trim() || !hasDefendant) {
			createError = 'All fields are required';
			return;
		}
		if (!ctx.crypto?.encryptForRecipients || !ctx.crypto?.grantScope) {
			createError = 'Secure sharing is unavailable in this host version.';
			return;
		}
		creating = true;
		createError = '';
		createSuccess = false;
		try {
			const e = selectedDefendantEntry;
			const respondent =
				e?.kind === 'department' ? `Department:${e.id}` : (e?.principal || defendantPrincipal).trim();
			const scope = `user:${principal}:dispute:${crypto.randomUUID()}`;
			const recipients = [principal, ...(await partyPrincipals(respondent))];
			const { ciphertext, wrappedDeks } = await ctx.crypto.encryptForRecipients(recipients, {
				description: formDescription.trim(),
			});
			await ctx.crypto.grantScope(scope, wrappedDeks);
			await run('dispute_file', {
				title: formTitle.trim(),
				respondent,
				description_ref: JSON.stringify({ scope, ciphertext }),
			});

			createSuccess = true;
			formTitle = '';
			formDescription = '';
			formDefendant = '';
			defendantPrincipal = '';
			selectedDefendantEntry = null;
			await loadLitigations();
			setTimeout(() => {
				createSuccess = false;
				tab = 'list';
			}, 1500);
		} catch (e: any) {
			createError = e?.message || String(e);
		} finally {
			creating = false;
		}
	}

	function openVerdict(litigation: any) {
		verdictCase = litigation;
		verdictCourt = '';
		verdictJudge = '';
		verdictDecision = '';
		verdictReasoning = '';
		verdictError = '';
		verdictSuccess = false;
		showVerdict = true;
	}

	function closeVerdict() {
		showVerdict = false;
		verdictCase = null;
		verdictDecision = '';
		verdictReasoning = '';
		verdictError = '';
		verdictSuccess = false;
	}

	async function executeVerdict() {
		if (!verdictCase || !verdictDecision.trim()) {
			verdictError = 'A decision is required';
			return;
		}
		executingVerdict = true;
		verdictError = '';
		verdictSuccess = false;
		try {
			const caseId =
				verdictCase.case ||
				(await run('dispute_accept', { dispute: verdictCase.id, court: verdictCourt.trim() })).case;
			verdictCase = { ...verdictCase, case: caseId };
			if (verdictJudge.trim()) await run('case_assign', { case: caseId, judge: verdictJudge.trim() });
			const { verdict } = await run('verdict_draft', {
				case: caseId,
				decision: verdictDecision.trim(),
				...(verdictReasoning.trim() && { reasoning_ref: verdictReasoning.trim() }),
			});
			await run('verdict_issue', { verdict });
			verdictSuccess = true;
			await loadLitigations();
			setTimeout(closeVerdict, 1500);
		} catch (e: any) {
			verdictError = e?.message || String(e);
		} finally {
			executingVerdict = false;
		}
	}

	function resetForm() {
		formTitle = '';
		formDescription = '';
		formDefendant = '';
		defendantPrincipal = '';
		selectedDefendantEntry = null;
		createError = '';
		createSuccess = false;
	}

	function statusColor(status: string) {
		switch (status) {
			case 'filed':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
			case 'accepted':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
			case 'rejected':
			case 'withdrawn':
				return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
		}
	}

	function truncatePrincipal(p: string) {
		if (!p) return 'Unknown';
		return p.length > 16 ? `${p.slice(0, 8)}…${p.slice(-4)}` : p;
	}

	$effect(() => {
		if (principal) {
			void loadLitigations();
		} else {
			loading = false;
			error = 'User not authenticated';
		}
	});

	$effect(() => {
		if (tab === 'create' && !directoryLoaded) void loadDirectory();
	});
</script>

<style>
	.chrome-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 6px 12px;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 6px;
		border: 1px solid #d1d5db;
		background: #fff;
		color: #374151;
		cursor: pointer;
		flex-shrink: 0;
	}

	.chrome-tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
	}

	.chrome-tab.is-on {
		border-bottom-color: #4f46e5;
		color: #4f46e5;
	}

	@media (max-width: 720px) {
		.chrome-label {
			display: none;
		}

		.chrome-btn {
			width: 32px;
			height: 32px;
			padding: 0;
		}

		.chrome-tab {
			width: 40px;
			justify-content: center;
			padding: 10px 0;
		}
	}
</style>

<div class="w-full py-4 sm:py-6">
	<!-- Header: title on its own row -->
	<div class="flex flex-col gap-2 mb-4 sm:mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
				Justice & Litigation
			</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{extensionDescription}</p>
		</div>
		<button
			class="chrome-btn self-start"
			onclick={() => loadLitigations()}
			disabled={loading}
			title={loading ? 'Loading' : 'Refresh'}
			aria-label={loading ? 'Loading' : 'Refresh'}
		>
			{#if loading}
				<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			{/if}
			<span class="chrome-label">{loading ? 'Loading…' : 'Refresh'}</span>
		</button>
	</div>

	{#if error && !loading}
		<div
			class="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm"
		>
			<span class="font-medium">Error:</span>
			{error}
		</div>
	{/if}

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16">
			<svg class="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			<p class="mt-4 text-gray-500 dark:text-gray-400 animate-pulse">Loading cases…</p>
		</div>
	{:else}
		<!-- Info bar (desktop chrome; hidden on narrow so cases win the page) -->
		<div class="mb-4 hidden sm:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
			<span>
				Profile: <span class="font-semibold capitalize">{userProfile}</span>
			</span>
			<span>
				Total cases: <span class="font-semibold">{totalCount}</span>
			</span>
		</div>

		<!-- Tabs: icon-only on a narrow viewport -->
		<div class="flex border-b border-gray-200 dark:border-gray-700 mb-4">
			<button
				class="chrome-tab {tab === 'list' ? 'is-on' : ''}"
				onclick={() => (tab = 'list')}
				title={userProfile === 'admin' ? 'All litigations' : 'My litigations'}
				aria-label={userProfile === 'admin' ? 'All litigations' : 'My litigations'}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					/>
				</svg>
				<span class="chrome-label">{userProfile === 'admin' ? 'All Litigations' : 'My Litigations'}</span>
			</button>
			<button
				class="chrome-tab {tab === 'create' ? 'is-on' : ''}"
				onclick={() => (tab = 'create')}
				title="Create litigation"
				aria-label="Create litigation"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				<span class="chrome-label">Create Litigation</span>
			</button>
			{#if userProfile === 'admin'}
				<button
					class="chrome-tab {tab === 'courts' ? 'is-on' : ''}"
					onclick={() => (tab = 'courts')}
					title="Courts"
					aria-label="Courts"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"
						/>
					</svg>
					<span class="chrome-label">Courts</span>
				</button>
			{/if}
			<button
				class="chrome-tab {tab === 'stats' ? 'is-on' : ''}"
				onclick={() => (tab = 'stats')}
				title="Statistics"
				aria-label="Statistics"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				<span class="chrome-label">Statistics</span>
			</button>
		</div>

		<!-- Tab Content -->
		<div class="sm:bg-gray-50 sm:dark:bg-gray-800/50 sm:rounded-lg sm:p-4 sm:border sm:border-gray-200 sm:dark:border-gray-700">
			<!-- LIST TAB -->
			{#if tab === 'list'}
				{#if listUnsupported}
					<p class="text-center py-12 text-gray-500 dark:text-gray-400">
						Listing your own litigations is not supported by this realm version.
					</p>
				{:else if litigations.length === 0}
					<div class="text-center py-12">
						<svg
							class="w-12 h-12 mx-auto text-gray-400 mb-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<p class="text-gray-500 dark:text-gray-400">
							{userProfile === 'admin'
								? 'No litigations found in the system.'
								: 'You have no litigation cases.'}
						</p>
					</div>
				{:else if narrow}
					<div class="divide-y divide-gray-200 dark:divide-gray-700">
						{#each litigations as lit (lit.id)}
							<article class="py-3">
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0">
										<div class="font-mono text-xs text-indigo-600 dark:text-indigo-400">
											{lit.id}
										</div>
										<div class="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
											{lit.case_title || '(untitled)'}
										</div>
									</div>
									<span class="shrink-0 text-xs font-medium {statusColor(lit.status)} px-2 py-0.5">
										{lit.status?.replace('_', ' ') || 'unknown'}
									</span>
								</div>
								<div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									{lit.case || '—'}
								</div>
								<div class="mt-0.5 text-xs text-gray-400 font-mono">
									{truncatePrincipal(lit.requester_principal)}
									{#if userProfile === 'admin'}
										→
										{#if lit.defendant_kind === 'department'}
											{lit.defendant_label}
										{:else}
											{truncatePrincipal(lit.defendant_label || lit.defendant_principal)}
										{/if}
									{/if}
								</div>
								{#if userProfile === 'admin' && (lit.status === 'filed' || lit.status === 'accepted')}
									<button
										class="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400"
										onclick={() => openVerdict(lit)}
									>
										Execute Verdict
									</button>
								{/if}
							</article>
						{/each}
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-sm text-left">
							<thead
								class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700"
							>
								<tr>
									<th class="px-4 py-3 rounded-tl-lg">Dispute ID</th>
									<th class="px-4 py-3">Title</th>
									<th class="px-4 py-3">Case</th>
									<th class="px-4 py-3">Status</th>
									<th class="px-4 py-3">Requester</th>
									{#if userProfile === 'admin'}
										<th class="px-4 py-3">Defendant</th>
									{/if}
									{#if userProfile === 'admin'}
										<th class="px-4 py-3 rounded-tr-lg">Actions</th>
									{:else}
										<th class="px-4 py-3 rounded-tr-lg"></th>
									{/if}
								</tr>
							</thead>
							<tbody>
								{#each litigations as lit (lit.id)}
									<tr
										class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
									>
									<td class="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">
										{lit.id}
									</td>
										<td class="px-4 py-3">
											<div class="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
												{lit.case_title || '(untitled)'}
											</div>
										</td>
										<td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
											{lit.case || '—'}
										</td>
										<td class="px-4 py-3">
											<span
												class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {statusColor(lit.status)}"
											>
												{lit.status?.replace('_', ' ') || 'unknown'}
											</span>
										</td>
										<td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
											{truncatePrincipal(lit.requester_principal)}
										</td>
										{#if userProfile === 'admin'}
											<td
												class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400"
											>
												{#if lit.defendant_kind === 'department'}
													<span
														class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 mr-1"
													>
														dept
													</span>
													<span class="font-sans">{lit.defendant_label}</span>
												{:else}
													{truncatePrincipal(lit.defendant_label || lit.defendant_principal)}
												{/if}
											</td>
										{/if}
										<td class="px-4 py-3">
											{#if userProfile === 'admin' && (lit.status === 'filed' || lit.status === 'accepted')}
												<button
													class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
													onclick={(e) => {
														e.stopPropagation();
														openVerdict(lit);
													}}
												>
													Execute Verdict
												</button>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					{#if hasMore}
						<div class="mt-4 flex justify-center">
							<button
								class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
								onclick={() => loadLitigations(true)}
								disabled={loadingMore}
							>
								{#if loadingMore}
									Loading…
								{:else}
									Load more cases
								{/if}
							</button>
						</div>
					{/if}
				{/if}

			<!-- CREATE TAB -->
			{:else if tab === 'create'}
				<div
					class="max-w-2xl mx-auto bg-white dark:bg-gray-800 sm:rounded-xl sm:border sm:border-gray-200 sm:dark:border-gray-700 sm:p-6"
				>
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
						Create New Litigation Case
					</h3>
					<p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
						Submit a new litigation request. All fields are required. The title is visible
						to the justice department, which accepts the case into a court. The description
						is encrypted in your browser and readable only by you and the defendant.
					</p>

					<div class="space-y-4">
						<div>
							<label
								for="jl-defendant"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
							>
								Defendant
							</label>
							<div class="relative">
								<input
									id="jl-defendant"
									type="text"
									bind:value={formDefendant}
									oninput={() => {
									selectedDefendantEntry = null;
									defendantPrincipal = formDefendant.trim();
									showDefendantSuggestions = true;
								}}
									onfocus={() => (showDefendantSuggestions = true)}
									onblur={() => setTimeout(() => (showDefendantSuggestions = false), 250)}
									autocomplete="off"
									placeholder="Search locally, or paste a principal"
									disabled={creating}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
								/>
								{#if defendantSuggestions.length > 0}
									<ul
										class="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1"
									>
										{#each defendantSuggestions as s (s.kind + ':' + s.principal + ':' + s.label)}
											<li>
												<button
													type="button"
													onmousedown={() => selectDefendant(s)}
													class="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
												>
													<span
														class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide {s.kind ===
														'department'
															? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
															: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'}"
													>
														{s.kind}
													</span>
													<span class="flex-1 min-w-0">
														<span class="block font-medium text-gray-900 dark:text-white truncate">
															{s.label}
														</span>
														{#if s.kind === 'department'}
															<span class="block text-xs text-gray-500 dark:text-gray-400 truncate">
																whole department
															</span>
														{:else if s.principal && s.principal !== s.label}
															<span class="block font-mono text-xs text-gray-500 dark:text-gray-400 truncate">
																{s.principal}
															</span>
														{/if}
													</span>
												</button>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
							{#if defendantLabel}
								<p class="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
									Selected: {defendantLabel}
								</p>
							{:else}
								<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									Search locally, or paste a principal.
								</p>
							{/if}
						</div>

						<div>
							<label
								for="jl-title"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
							>
								Case Title
							</label>
							<input
								id="jl-title"
								type="text"
								bind:value={formTitle}
								placeholder="Enter case title"
								disabled={creating}
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
							/>
						</div>

						<div>
							<label
								for="jl-desc"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
							>
								Case Description
							</label>
							<textarea
								id="jl-desc"
								bind:value={formDescription}
								placeholder="Provide detailed description of the dispute…"
								rows="4"
								disabled={creating}
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50 resize-y"
							></textarea>
						</div>
					</div>

					{#if createError}
						<div
							class="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm"
						>
							<span class="font-medium">Error:</span>
							{createError}
						</div>
					{/if}

					{#if createSuccess}
						<div
							class="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm"
						>
							<span class="font-medium">Success:</span> Litigation case created!
						</div>
					{/if}

					<div class="flex justify-end gap-3 mt-6">
						<button
							class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
							onclick={resetForm}
							disabled={creating}
						>
							Reset
						</button>
						<button
							class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
							onclick={createLitigation}
							disabled={creating ||
								!formTitle.trim() ||
								!formDescription.trim() ||
								!hasDefendant}
						>
							{#if creating}
								<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Creating…
							{:else}
								Create Litigation
							{/if}
						</button>
					</div>
				</div>

			<!-- COURTS TAB (admin) -->
			{:else if tab === 'courts'}
				<div class="flex flex-col gap-2 mb-4">
					<div>
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Courts</h3>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							The court hierarchy of this realm. Every litigation is filed at a court.
						</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							class="chrome-btn"
							onclick={() => (showCourtForm = !showCourtForm)}
							title={showCourtForm ? 'Close' : 'New court'}
							aria-label={showCourtForm ? 'Close' : 'New court'}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							<span class="chrome-label">{showCourtForm ? 'Close' : 'New Court'}</span>
						</button>
					</div>
				</div>

				{#if showCourtForm}
					<div
						class="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
					>
						<h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
							Create New Court
						</h4>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label
									for="jl-court-name"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>
									Name
								</label>
								<input
									id="jl-court-name"
									type="text"
									bind:value={courtFormName}
									placeholder="e.g. District Court"
									disabled={courtFormSaving}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
								/>
							</div>
							<div>
								<label
									for="jl-court-level"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>
									Level
								</label>
								<select
									id="jl-court-level"
									bind:value={courtFormLevel}
									disabled={courtFormSaving}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
								>
									{#each COURT_LEVELS as l (l.value)}
										<option value={l.value}>{l.label}</option>
									{/each}
								</select>
							</div>
							<div>
								<label
									for="jl-court-jurisdiction"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>
									Jurisdiction
								</label>
								<input
									id="jl-court-jurisdiction"
									type="text"
									bind:value={courtFormJurisdiction}
									placeholder="e.g. General, Commercial…"
									disabled={courtFormSaving}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
								/>
							</div>
							<div>
								<label
									for="jl-court-parent"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>
									Appeals go to (parent court)
								</label>
								<input
									id="jl-court-parent"
									type="text"
									bind:value={courtFormParentId}
									placeholder="Court ID, e.g. COURT-1 (optional)"
									disabled={courtFormSaving}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
								/>
							</div>
							<div class="sm:col-span-2">
								<label
									for="jl-court-operator"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>
									Run by
								</label>
								<input
									id="jl-court-operator"
									type="text"
									bind:value={courtFormOperator}
									placeholder="Department:justice, or Organization:ID with a court licence"
									disabled={courtFormSaving}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
								/>
							</div>
						</div>

						{#if courtFormError}
							<div
								class="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm"
							>
								<span class="font-medium">Error:</span>
								{courtFormError}
							</div>
						{/if}
						{#if courtFormSuccess}
							<div
								class="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm"
							>
								<span class="font-medium">Success:</span> {courtFormSuccess}
							</div>
						{/if}

						<div class="flex justify-end mt-4">
							<button
								class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								onclick={createCourt}
								disabled={courtFormSaving || courtFormName.trim().length < 2 || !courtFormOperator.trim()}
							>
								{courtFormSaving ? 'Creating…' : 'Create Court'}
							</button>
						</div>
					</div>
				{/if}

				<p class="py-8 text-center text-gray-500 dark:text-gray-400">
					Listing courts is not supported by this realm version.
				</p>

			<!-- STATS TAB -->
			{:else if tab === 'stats'}
				<div class="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 dark:bg-gray-700 sm:gap-4 sm:bg-transparent">
					<div
						class="bg-white dark:bg-gray-800 p-4 sm:border sm:border-gray-200 sm:dark:border-gray-700 sm:rounded-xl sm:p-5"
					>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
							Total Cases
						</p>
						<p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
							{totalCount}
						</p>
					</div>
					<div
						class="bg-white dark:bg-gray-800 p-4 sm:border sm:border-gray-200 sm:dark:border-gray-700 sm:rounded-xl sm:p-5"
					>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
							Filed
						</p>
						<p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
							{pendingCount}
						</p>
					</div>
					<div
						class="bg-white dark:bg-gray-800 p-4 sm:border sm:border-gray-200 sm:dark:border-gray-700 sm:rounded-xl sm:p-5"
					>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
							Accepted
						</p>
						<p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
							{inReviewCount}
						</p>
					</div>
					<div
						class="bg-white dark:bg-gray-800 p-4 sm:border sm:border-gray-200 sm:dark:border-gray-700 sm:rounded-xl sm:p-5"
					>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
							Rejected or withdrawn
						</p>
						<p class="text-3xl font-bold text-green-600 dark:text-green-400">
							{resolvedCount}
						</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Verdict Modal Backdrop -->
	{#if showVerdict}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
			<!-- Backdrop -->
			<button
				class="absolute inset-0 bg-black/50"
				onclick={closeVerdict}
				aria-label="Close"
			></button>

			<!-- Modal -->
			<div
				class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto"
			>
				<div class="p-6">
					<div class="flex items-center gap-2 mb-4">
						<svg
							class="w-6 h-6 text-indigo-600 dark:text-indigo-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
						<h3 class="text-xl font-semibold text-gray-900 dark:text-white">
							Issue Verdict
						</h3>
					</div>

					{#if verdictCase}
						<div
							class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4 text-sm space-y-1"
						>
							<div>
								<span class="font-medium text-gray-700 dark:text-gray-300">ID:</span>
								<span class="text-gray-600 dark:text-gray-400">{verdictCase.id}</span>
							</div>
							<div>
								<span class="font-medium text-gray-700 dark:text-gray-300">Title:</span>
								<span class="text-gray-600 dark:text-gray-400"
									>{verdictCase.case_title}</span
								>
							</div>
						</div>

						{#if !verdictCase.case}
							<div class="mb-4">
								<label
									for="jl-verdict-court"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>
									Accept into court
								</label>
								<input
									id="jl-verdict-court"
									bind:value={verdictCourt}
									disabled={executingVerdict}
									placeholder="Court ID, e.g. COURT-1"
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
								/>
							</div>
						{/if}

						<div class="mb-4">
							<label
								for="jl-verdict-judge"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
							>
								Assign judge
							</label>
							<input
								id="jl-verdict-judge"
								bind:value={verdictJudge}
								disabled={executingVerdict}
								placeholder={verdictCase.case ? 'Judge ID (if not assigned yet)' : 'Judge ID, e.g. J-1'}
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
							/>
						</div>

						<div class="mb-4">
							<label
								for="jl-verdict-decision"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
							>
								Decision
							</label>
							<input
								id="jl-verdict-decision"
								bind:value={verdictDecision}
								disabled={executingVerdict}
								placeholder="e.g. for the plaintiff"
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
							/>
						</div>

						<div class="mb-4">
							<label
								for="jl-verdict-reasoning"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
							>
								Reasoning
							</label>
							<textarea
								id="jl-verdict-reasoning"
								bind:value={verdictReasoning}
								rows="4"
								disabled={executingVerdict}
								placeholder="Legal reasoning for the decision…"
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50 resize-y"
							></textarea>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Only a judge assigned to this case may issue its verdict.
							</p>
						</div>

						{#if verdictError}
							<div
								class="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm"
							>
								<span class="font-medium">Error:</span>
								{verdictError}
							</div>
						{/if}

						{#if verdictSuccess}
							<div
								class="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm"
							>
								<span class="font-medium">Success:</span> Verdict issued!
							</div>
						{/if}

						<div class="flex justify-end gap-3">
							<button
								class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
								onclick={closeVerdict}
								disabled={executingVerdict}
							>
								Cancel
							</button>
							<button
								class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
								onclick={executeVerdict}
								disabled={executingVerdict ||
									!verdictDecision.trim() ||
									(!verdictCase.case && (!verdictCourt.trim() || !verdictJudge.trim()))}
							>
								{#if executingVerdict}
									<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Executing…
								{:else}
									Execute Verdict
								{/if}
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
