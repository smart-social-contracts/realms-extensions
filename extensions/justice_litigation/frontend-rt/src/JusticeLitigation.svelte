<script lang="ts">
	let { ctx }: { ctx: any } = $props();

	type Tab = 'list' | 'create' | 'courts' | 'stats';

	let tab = $state<Tab>('list');
	let litigations: any[] = $state([]);
	let totalCount = $state(0);
	let userProfile = $state('member');
	let loading = $state(true);
	let loadingMore = $state(false);
	let hasMore = $state(false);
	let nextFromId = $state<number | null>(null);
	let error = $state('');
	let accessDeniedOp = $state('');

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

	// Courts — every case is filed at a court, so the list is needed by the
	// create form (court picker / empty-state) and the admin Courts tab.
	let courts: any[] = $state([]);
	let courtsLoading = $state(false);
	let courtsLoaded = $state(false);
	let courtsError = $state('');
	let selectedCourtId = $state('');
	let seedingCourts = $state(false);

	// New-court form (admin Courts tab)
	let showCourtForm = $state(false);
	let courtFormName = $state('');
	let courtFormLevel = $state('first_instance');
	let courtFormJurisdiction = $state('');
	let courtFormDescription = $state('');
	let courtFormParentId = $state('');
	let courtFormSaving = $state(false);
	let courtFormError = $state('');
	let courtFormSuccess = $state(false);

	const COURT_LEVELS = [
		{ value: 'first_instance', label: 'First instance' },
		{ value: 'appellate', label: 'Appellate' },
		{ value: 'supreme', label: 'Supreme' },
		{ value: 'specialized', label: 'Specialized' },
	];

	let activeCourts = $derived(courts.filter((c) => c.status === 'active'));

	// Courts ordered as a tree (roots first, children indented) for the
	// hierarchy view. Courts whose parent lives on another canister (e.g. the
	// capital's appellate court, seen from a quarter) count as roots.
	let courtTree = $derived.by(() => {
		const ids = new Set(courts.map((c) => String(c.id)));
		const byParent = new Map<string, any[]>();
		const roots: any[] = [];
		for (const c of courts) {
			const pid = c.parent_court_id != null ? String(c.parent_court_id) : '';
			if (pid && ids.has(pid)) {
				const list = byParent.get(pid) ?? [];
				list.push(c);
				byParent.set(pid, list);
			} else {
				roots.push(c);
			}
		}
		const out: { court: any; depth: number }[] = [];
		const visit = (c: any, depth: number) => {
			if (depth > 6) return;
			out.push({ court: c, depth });
			for (const child of byParent.get(String(c.id)) ?? []) visit(child, depth + 1);
		};
		for (const r of roots) visit(r, 0);
		return out;
	});

	// Where a court's appeals go: its local parent, or (for a quarter court
	// whose appellate court lives on the capital) the name recorded in metadata.
	function appealsTo(court: any): string {
		if (court.parent_court_name) return court.parent_court_name;
		try {
			const meta = JSON.parse(court.metadata || '{}');
			if (meta.appellate_court) return `${meta.appellate_court} (capital)`;
		} catch {
			// metadata is not JSON — nothing to show
		}
		return '—';
	}

	// Defendant autocomplete — realm directory (users + departments) is fetched
	// once from the host's `directory_list` query and filtered client-side.
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

	async function loadDirectory() {
		if (directoryLoaded || directoryLoading || !ctx.backend?.directory_list) return;
		directoryLoading = true;
		try {
			const resp: any = await ctx.backend.directory_list();
			if (resp?.success && resp?.data?.message) {
				const parsed = JSON.parse(resp.data.message);
				directory = Array.isArray(parsed?.entries) ? parsed.entries : [];
			}
			directoryLoaded = true;
		} catch (e) {
			// Non-fatal: the user can still paste a raw principal.
			console.warn('[justice_litigation] directory load failed', e);
		} finally {
			directoryLoading = false;
		}
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
	let verdictDecision = $state('');
	let verdictReasoning = $state('');
	let executingVerdict = $state(false);
	let verdictError = $state('');
	let verdictSuccess = $state(false);

	// Derived statistics
	let pendingCount = $derived(litigations.filter((l) => l.status === 'pending').length);
	let inReviewCount = $derived(
		litigations.filter((l) => l.status === 'in_review').length,
	);
	let resolvedCount = $derived(litigations.filter((l) => l.status === 'resolved').length);

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	async function loadCourts() {
		courtsLoading = true;
		courtsError = '';
		try {
			const res: any = await callExt('get_courts');
			const data = res?.data ?? res;
			if (res?.success === false || data?.success === false) {
				throw new Error(data?.error || res?.error || 'Failed to load courts');
			}
			courts = data?.courts ?? [];
			const actives = courts.filter((c: any) => c.status === 'active');
			if (!selectedCourtId || !actives.some((c: any) => String(c.id) === selectedCourtId)) {
				selectedCourtId = actives[0] ? String(actives[0].id) : '';
			}
			courtsLoaded = true;
		} catch (e: any) {
			courtsError = e?.message || String(e);
		} finally {
			courtsLoading = false;
		}
	}

	async function seedDefaultCourts() {
		seedingCourts = true;
		courtsError = '';
		try {
			const res: any = await callExt('seed_default_courts', {});
			const data = res?.data ?? res;
			if (res?.success === false || data?.success === false) {
				throw new Error(data?.error || res?.error || 'Failed to set up courts');
			}
			await loadCourts();
		} catch (e: any) {
			courtsError = e?.message || String(e);
		} finally {
			seedingCourts = false;
		}
	}

	async function createCourt() {
		if (courtFormName.trim().length < 2) {
			courtFormError = 'Court name must be at least 2 characters';
			return;
		}
		courtFormSaving = true;
		courtFormError = '';
		courtFormSuccess = false;
		try {
			const params: Record<string, unknown> = {
				name: courtFormName.trim(),
				level: courtFormLevel,
				jurisdiction: courtFormJurisdiction.trim(),
				description: courtFormDescription.trim(),
			};
			if (courtFormParentId) params.parent_court_id = courtFormParentId;
			const res: any = await callExt('create_court', params);
			const data = res?.data ?? res;
			if (res?.success === false || data?.success === false) {
				throw new Error(data?.error || res?.error || 'Failed to create court');
			}
			courtFormSuccess = true;
			courtFormName = '';
			courtFormJurisdiction = '';
			courtFormDescription = '';
			courtFormParentId = '';
			await loadCourts();
			setTimeout(() => {
				courtFormSuccess = false;
				showCourtForm = false;
			}, 1200);
		} catch (e: any) {
			courtFormError = e?.message || String(e);
		} finally {
			courtFormSaving = false;
		}
	}

	// Decrypt a litigation row's title/description in the browser. Private rows
	// carry an opaque ciphertext + scope; only principals holding a key (the
	// submitter and the justice department) can decrypt. Rows we cannot decrypt
	// are flagged `locked` so the UI shows a "no access" indicator. Legacy
	// (plaintext) rows pass through unchanged.
	async function decryptRow(row: any) {
		if (!row?.is_private) {
			return { ...row, locked: false };
		}
		const scope = row.content_scope;
		const ciphertext = row.content_ciphertext;
		if (!scope || !ciphertext || !ctx.crypto?.decryptScope) {
			return { ...row, locked: true };
		}
		try {
			const decrypted = await ctx.crypto.decryptScope(scope, ciphertext);
			if (decrypted && (decrypted.title || decrypted.description)) {
				return {
					...row,
					case_title: decrypted.title ?? '',
					description: decrypted.description ?? '',
					locked: false,
				};
			}
		} catch (e) {
			console.warn('[justice_litigation] decrypt failed', e);
		}
		return { ...row, locked: true };
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
		accessDeniedOp = '';
		try {
			const req: Record<string, unknown> = {
				user_principal: principal,
				user_profile: userProfile,
			};
			if (append && nextFromId != null) {
				req.from_id = nextFromId;
			}
			const res = await callExt('get_litigations', req);
			const data = res?.data ?? res;
			const rows = data?.litigations ?? (Array.isArray(data) ? data : []);
			const decrypted = await Promise.all(rows.map(decryptRow));
			litigations = append ? [...litigations, ...decrypted] : decrypted;
			totalCount = data?.total_count ?? litigations.length;
			if (data?.user_profile) userProfile = data.user_profile;
			hasMore = !!data?.has_more;
			nextFromId = data?.next_from_id ?? null;
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
			loadingMore = false;
		}
	}

	async function createLitigation() {
		if (!formTitle.trim() || !formDescription.trim() || !hasDefendant) {
			createError = 'All fields are required';
			return;
		}
		if (courtsLoaded && activeCourts.length === 0) {
			createError = 'No courts available. Please create a court first.';
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
			// 1. Open the case (no plaintext leaves the browser): reserve an id,
			//    its sharing scope, and the recipient principals (justice dept).
			// Build the defendant payload. A department is recorded by name/id
			// (the host Case.defendant only holds a User); a person by principal.
			const e = selectedDefendantEntry;
			const defendantParams =
				e && e.kind === 'department'
					? {
							defendant_kind: 'department',
							defendant_department: e.label || '',
							defendant_department_id: e.id || '',
						}
					: {
							defendant_kind: 'user',
							defendant_principal: (e?.principal || defendantPrincipal).trim(),
						};
			const created: any = await callExt('create_litigation', {
				...defendantParams,
				...(selectedCourtId ? { court_id: selectedCourtId } : {}),
			});
			const cdata = created?.data ?? created;
			const id = cdata?.id;
			const scope = cdata?.scope;
			if (!id || !scope) throw new Error(cdata?.error || created?.error || 'Failed to open litigation');

			// 2. Recipients = submitter + justice department members.
			const recipients = Array.from(
				new Set([...(cdata?.recipients ?? []), principal].filter(Boolean)),
			);

			// 3. Encrypt title + description locally (fresh DEK, IBE-wrapped per
			//    recipient) and attach the ciphertext, then grant the wrapped DEKs.
			const { ciphertext, wrappedDeks } = await ctx.crypto.encryptForRecipients(recipients, {
				title: formTitle.trim(),
				description: formDescription.trim(),
			});
			const setRes: any = await callExt('set_litigation_content', { id, ciphertext });
			if (setRes?.success === false) throw new Error(setRes?.data?.error || setRes?.error || 'Failed to store litigation');
			await ctx.crypto.grantScope(scope, wrappedDeks);

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
			const res: any = await callExt('issue_verdict', {
				case_id: verdictCase.id,
				decision: verdictDecision.trim(),
				reasoning: verdictReasoning.trim(),
			});
			// A refusal comes back as a normal response, so it has to be read
			// rather than caught — the previous version reported success for one.
			if (res?.success === false)
				throw new Error(res?.error || 'Failed to issue verdict');
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
			case 'pending':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
			case 'in_review':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
			case 'resolved':
				return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
		}
	}

	function levelColor(level: string) {
		switch (level) {
			case 'supreme':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
			case 'appellate':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
			case 'specialized':
				return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
		}
	}

	function levelLabel(level: string) {
		return COURT_LEVELS.find((l) => l.value === level)?.label ?? (level || 'unknown');
	}

	function formatDate(dateString: string) {
		if (!dateString) return '';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
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

	$effect(() => {
		if ((tab === 'create' || tab === 'courts') && !courtsLoaded && !courtsLoading) {
			void loadCourts();
		}
	});
</script>

<div class="w-full max-w-5xl mx-auto px-4 py-6">
	<!-- Header -->
	<div class="flex items-center gap-3 mb-6">
		<div
			class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center"
		>
			<svg
				class="w-5 h-5 text-indigo-600 dark:text-indigo-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
				/>
			</svg>
		</div>
		<div class="flex-1">
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
				Justice & Litigation
			</h1>
		</div>
		<button
			class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
			onclick={() => loadLitigations()}
			disabled={loading}
		>
			{#if loading}
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
				Loading…
			{:else}
				↻ Refresh
			{/if}
		</button>
	</div>

	{#if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			{@const AccessDenied = ctx.ui.AccessDenied}
			<AccessDenied operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error && !loading}
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
		<!-- Info bar -->
		<div class="mb-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
			<span>
				Profile: <span class="font-semibold capitalize">{userProfile}</span>
			</span>
			<span>
				Total cases: <span class="font-semibold">{totalCount}</span>
			</span>
		</div>

		<!-- Tabs -->
		<div class="flex border-b-2 border-gray-200 dark:border-gray-700 mb-6">
			<button
				class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-0.5 border-b-2 transition-colors {tab ===
				'list'
					? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
					: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
				onclick={() => (tab = 'list')}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					/>
				</svg>
				{userProfile === 'admin' ? 'All Litigations' : 'My Litigations'}
			</button>
			<button
				class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-0.5 border-b-2 transition-colors {tab ===
				'create'
					? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
					: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
				onclick={() => (tab = 'create')}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Create Litigation
			</button>
			{#if userProfile === 'admin'}
				<button
					class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-0.5 border-b-2 transition-colors {tab ===
					'courts'
						? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
						: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
					onclick={() => (tab = 'courts')}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"
						/>
					</svg>
					Courts
				</button>
			{/if}
			<button
				class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-0.5 border-b-2 transition-colors {tab ===
				'stats'
					? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
					: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
				onclick={() => (tab = 'stats')}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				Statistics
			</button>
		</div>

		<!-- Tab Content -->
		<div
			class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
		>
			<!-- LIST TAB -->
			{#if tab === 'list'}
				{#if litigations.length === 0}
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
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-sm text-left">
							<thead
								class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700"
							>
								<tr>
									<th class="px-4 py-3 rounded-tl-lg">Case ID</th>
									<th class="px-4 py-3">Title</th>
									<th class="px-4 py-3">Court</th>
									<th class="px-4 py-3">Status</th>
									<th class="px-4 py-3">Requester</th>
									{#if userProfile === 'admin'}
										<th class="px-4 py-3">Defendant</th>
									{/if}
									<th class="px-4 py-3">Date</th>
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
										{lit.case_number || lit.id}
									</td>
										<td class="px-4 py-3">
											{#if lit.locked}
												<div class="flex items-center gap-1.5 font-medium text-gray-400 dark:text-gray-500 italic">
													<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
													</svg>
													Encrypted — no access
												</div>
											{:else}
												<div class="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
													{#if lit.is_private}
														<svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Private">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
														</svg>
													{/if}
													{lit.case_title || '(untitled)'}
												</div>
												{#if lit.description}
													<div class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
														{lit.description}
													</div>
												{/if}
											{/if}
										</td>
										<td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
											{lit.court_name || '—'}
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
										<td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
											{formatDate(lit.requested_at)}
										</td>
										<td class="px-4 py-3">
											{#if userProfile === 'admin' && lit.status !== 'resolved'}
												<button
													class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
													onclick={(e) => {
														e.stopPropagation();
														openVerdict(lit);
													}}
												>
													Execute Verdict
												</button>
											{:else if lit.status === 'resolved'}
												<span class="text-xs text-gray-400">Resolved</span>
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
					class="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
				>
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
						Create New Litigation Case
					</h3>
					<p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
						Submit a new litigation request. All fields are required. The title and
						description are encrypted in your browser and shared only with you and the
						justice department — no one else (not even the defendant) can read them.
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
									placeholder="Search by name, department, or principal…"
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
									Start typing to pick a user or department, or paste a principal ID.
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

						<!-- Court the case will be filed at -->
						<div>
							{#if courtsLoading && !courtsLoaded}
								<p class="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
									Loading courts…
								</p>
							{:else if activeCourts.length === 0}
								<div
									class="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300"
								>
									<p class="font-medium mb-1">This realm has no courts yet.</p>
									{#if userProfile === 'admin'}
										<p class="mb-3">
											A case must be filed at a court. Set up a default court now, or
											manage the hierarchy in the Courts tab.
										</p>
										<button
											class="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors disabled:opacity-50"
											onclick={seedDefaultCourts}
											disabled={seedingCourts}
										>
											{seedingCourts ? 'Setting up…' : 'Set up default court'}
										</button>
									{:else}
										<p>
											The judiciary has not been set up yet — please contact a realm
											administrator before filing a case.
										</p>
									{/if}
									{#if courtsError}
										<p class="mt-2 text-red-600 dark:text-red-400">{courtsError}</p>
									{/if}
								</div>
							{:else if activeCourts.length === 1}
								<p class="text-xs text-gray-500 dark:text-gray-400">
									Filing at:
									<span class="font-medium text-gray-700 dark:text-gray-300">
										{activeCourts[0].name}
									</span>
									({levelLabel(activeCourts[0].level)})
								</p>
							{:else}
								<label
									for="jl-court"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>
									Court
								</label>
								<select
									id="jl-court"
									bind:value={selectedCourtId}
									disabled={creating}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
								>
									{#each activeCourts as c (c.id)}
										<option value={String(c.id)}>
											{c.name} — {levelLabel(c.level)}
										</option>
									{/each}
								</select>
							{/if}
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
								!hasDefendant ||
								(courtsLoaded && activeCourts.length === 0)}
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
				<div class="flex items-center justify-between mb-4">
					<div>
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Courts</h3>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							The court hierarchy of this realm. Every litigation is filed at a court.
						</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							class="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
							onclick={loadCourts}
							disabled={courtsLoading}
						>
							{courtsLoading ? 'Loading…' : '↻ Refresh'}
						</button>
						<button
							class="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
							onclick={() => (showCourtForm = !showCourtForm)}
						>
							{showCourtForm ? 'Close' : '+ New Court'}
						</button>
					</div>
				</div>

				{#if courtsError}
					<div
						class="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm"
					>
						<span class="font-medium">Error:</span>
						{courtsError}
					</div>
				{/if}

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
								<select
									id="jl-court-parent"
									bind:value={courtFormParentId}
									disabled={courtFormSaving}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
								>
									<option value="">— None —</option>
									{#each courts as c (c.id)}
										<option value={String(c.id)}>{c.name}</option>
									{/each}
								</select>
							</div>
							<div class="sm:col-span-2">
								<label
									for="jl-court-desc"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>
									Description
								</label>
								<textarea
									id="jl-court-desc"
									bind:value={courtFormDescription}
									rows="2"
									placeholder="What kinds of cases does this court handle?"
									disabled={courtFormSaving}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50 resize-y"
								></textarea>
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
								<span class="font-medium">Success:</span> Court created!
							</div>
						{/if}

						<div class="flex justify-end mt-4">
							<button
								class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								onclick={createCourt}
								disabled={courtFormSaving || courtFormName.trim().length < 2}
							>
								{courtFormSaving ? 'Creating…' : 'Create Court'}
							</button>
						</div>
					</div>
				{/if}

				{#if courtsLoading && !courtsLoaded}
					<p class="py-8 text-center text-gray-500 dark:text-gray-400 animate-pulse">
						Loading courts…
					</p>
				{:else if courts.length === 0}
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
								d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"
							/>
						</svg>
						<p class="text-gray-500 dark:text-gray-400 mb-4">
							This realm has no courts yet, so no litigation can be filed.
						</p>
						<button
							class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
							onclick={seedDefaultCourts}
							disabled={seedingCourts}
						>
							{seedingCourts ? 'Setting up…' : 'Set up default court'}
						</button>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-sm text-left">
							<thead
								class="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700"
							>
								<tr>
									<th class="px-4 py-3 rounded-tl-lg">Court</th>
									<th class="px-4 py-3">Level</th>
									<th class="px-4 py-3">Status</th>
									<th class="px-4 py-3">Jurisdiction</th>
									<th class="px-4 py-3">Appeals to</th>
									<th class="px-4 py-3 text-right">Judges</th>
									<th class="px-4 py-3 text-right rounded-tr-lg">Cases</th>
								</tr>
							</thead>
							<tbody>
								{#each courtTree as row (row.court.id)}
									<tr
										class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
									>
										<td class="px-4 py-3" style="padding-left: {16 + row.depth * 24}px">
											<div class="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
												{#if row.depth > 0}
													<span class="text-gray-400 dark:text-gray-500">└</span>
												{/if}
												{row.court.name}
											</div>
											{#if row.court.description}
												<div class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
													{row.court.description}
												</div>
											{/if}
										</td>
										<td class="px-4 py-3">
											<span
												class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {levelColor(row.court.level)}"
											>
												{levelLabel(row.court.level)}
											</span>
										</td>
										<td class="px-4 py-3">
											<span
												class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {row.court.status === 'active'
													? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
													: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}"
											>
												{row.court.status || 'unknown'}
											</span>
										</td>
										<td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
											{row.court.jurisdiction || '—'}
										</td>
										<td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
											{appealsTo(row.court)}
										</td>
										<td class="px-4 py-3 text-right text-xs text-gray-600 dark:text-gray-400">
											{row.court.judge_count ?? 0}
										</td>
										<td class="px-4 py-3 text-right text-xs text-gray-600 dark:text-gray-400">
											{row.court.case_count ?? 0}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}

			<!-- STATS TAB -->
			{:else if tab === 'stats'}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<div
						class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
					>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
							Total Cases
						</p>
						<p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
							{totalCount}
						</p>
					</div>
					<div
						class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
					>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
							Pending
						</p>
						<p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
							{pendingCount}
						</p>
					</div>
					<div
						class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
					>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
							In Review
						</p>
						<p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
							{inReviewCount}
						</p>
					</div>
					<div
						class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
					>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
							Resolved
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
							{#if verdictCase.description}
								<div>
									<span class="font-medium text-gray-700 dark:text-gray-300"
										>Description:</span
									>
									<span class="text-gray-600 dark:text-gray-400"
										>{verdictCase.description}</span
									>
								</div>
							{/if}
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
								disabled={executingVerdict || !verdictDecision.trim()}
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
