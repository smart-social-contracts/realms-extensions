<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
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

	let tab = $state<Tab>('list');
	let litigations: any[] = $state([]);
	let loading = $state(true);
	let loadingMore = $state(false);
	let hasMore = $state(false);
	let nextFromId = $state<number | null>(null);
	let error = $state('');

	// The viewer's permissions from the realm's `me`; "all" stands for every permission.
	let permissions: string[] = $state([]);
	let meLoaded = false;
	let meId = '';
	let userProfile = $derived(can('dispute.view_all') ? 'admin' : 'member');
	let totalCount = $derived(litigations.length);

	function can(perm: string) {
		return permissions.includes('all') || permissions.includes(perm);
	}

	/** A realm read operation's reply, or null when it fails or is not open to the viewer. */
	async function read(name: string, args: Record<string, unknown> = {}): Promise<any> {
		try {
			const reply = await ctx.read(name, args);
			if (reply?.ok) return reply;
			console.warn(`[justice_litigation] ${name}:`, reply?.error);
		} catch (e) {
			console.warn(`[justice_litigation] ${name} failed:`, e);
		}
		return null;
	}

	/** Run a realm operation; a refusal is thrown so the form that asked can show it. */
	async function run(name: string, args: Record<string, unknown> = {}): Promise<any> {
		const reply = await ctx.run(name, args);
		if (!reply?.ok) throw new Error(reply?.error || `${name} was refused`);
		return reply;
	}

	async function loadMe() {
		const self = await read('me');
		permissions = Array.isArray(self?.permissions) ? self.permissions : [];
		meId = typeof self?.user?.id === 'string' ? self.user.id : '';
		meLoaded = true;
	}

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
	// Neutral notice when private filing cannot run (e.g. the realm's key service is unavailable).
	let createNote = $state('');
	let createSuccess = $state(false);
	let createdId = $state('');

	// Courts: the realm has no operation that lists them, so the Courts tab only creates one.
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

	// Accepting a filed dispute into a court opens its case.
	let acceptCourtId = $state('');
	let deciding = $state(false);
	let decideError = $state('');

	// Defendant autocomplete: this realm's users and departments. A cross-realm
	// (realm://) defendant cannot be named: the realm only resolves its own parties.
	let directory: any[] = $state([]);
	let directoryLoaded = $state(false);
	let directoryLoading = $state(false);
	let showDefendantSuggestions = $state(false);
	// Departments (court operators) and the justice staff a description is encrypted for.
	let departments: string[] = $state([]);
	let justiceStaff: string[] = $state([]);
	let departmentsLoaded = false;

	let defendantSuggestions = $derived.by(() => {
		const q = formDefendant.trim().toLowerCase();
		if (!q || !showDefendantSuggestions || q.startsWith('realm://')) return [];
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
	// or the user typed a principal of this realm directly.
	let crossRealmDefendant = $derived(
		!selectedDefendantEntry && defendantPrincipal.trim().toLowerCase().startsWith('realm://'),
	);
	let hasDefendant = $derived(
		(!!selectedDefendantEntry || !!defendantPrincipal.trim()) && !crossRealmDefendant,
	);

	function chartNodes(node: any, out: any[] = []): any[] {
		if (!node || out.length > 1000) return out;
		out.push(node);
		for (const child of node.children ?? []) chartNodes(child, out);
		return out;
	}

	async function loadDepartments() {
		if (departmentsLoaded) return;
		departmentsLoaded = true;
		const res = await read('department_chart');
		const nodes = chartNodes(res?.chart);
		departments = [...new Set(nodes.map((n) => String(n.department || '')).filter(Boolean))];
		let justice = nodes.filter((n) => /justic|court|judic/i.test(String(n.department || '')));
		// No justice department: the root department's staff oversee disputes.
		if (justice.length === 0 && nodes.length) justice = [nodes[0]];
		const staff = justice.flatMap((n) => [
			n.head,
			...(n.positions ?? []).flatMap((p: any) => (p.holders ?? []).map((h: any) => h.user)),
		]);
		justiceStaff = [...new Set(staff.filter((p) => typeof p === 'string' && p))];
		if (!courtFormOperator) courtFormOperator = justice[0]?.department ?? departments[0] ?? '';
	}

	async function loadDirectory() {
		if (directoryLoaded || directoryLoading) return;
		directoryLoading = true;
		try {
			const [users] = await Promise.all([
				read('user_list', { from: 1, count: 500 }),
				loadDepartments(),
			]);
			directory = [
				...((users?.users ?? []) as any[]).map((u) => ({
					kind: 'user',
					label: u.nickname || u.id,
					principal: u.id,
					id: u.id,
				})),
				...departments.map((d) => ({ kind: 'department', label: d, principal: '', id: d })),
			];
			directoryLoaded = true;
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

	// Dispute detail (List tab): the dispute in full when the viewer is one of its
	// parties, and the verdicts of the case it opened.
	let selectedCase: any = $state(null);
	let caseDetail: any = $state(null);
	let detailLoading = $state(false);
	let detailError = $state('');

	// Derived statistics
	let pendingCount = $derived(litigations.filter((l) => l.status === 'filed').length);
	let inReviewCount = $derived(litigations.filter((l) => l.status === 'accepted').length);
	let resolvedCount = $derived(
		litigations.filter((l) => l.status === 'rejected' || l.status === 'withdrawn').length,
	);

	// "Department:justice" -> { kind: 'department', id: 'justice' }; a bare id is a user.
	function party(ref: unknown) {
		const text = String(ref || '');
		const at = text.indexOf(':');
		if (at < 0) return { kind: 'user', id: text };
		return { kind: text.slice(0, at).toLowerCase(), id: text.slice(at + 1) };
	}

	function userLabel(id: string) {
		const hit = directory.find((e) => e.kind === 'user' && e.principal === id);
		return hit?.label || id;
	}

	function toRow(d: any) {
		const def = party(d?.respondent);
		return {
			id: String(d?.id ?? ''),
			case_id: String(d?.case || ''),
			case_title: String(d?.title || ''),
			description: '',
			status: String(d?.status || 'filed'),
			requester_principal: String(d?.claimant || ''),
			defendant_kind: def.kind,
			defendant_label: def.kind === 'user' ? userLabel(def.id) : def.id,
			defendant_principal: def.kind === 'user' ? def.id : '',
		};
	}

	function toVerdict(v: any) {
		return {
			id: String(v?.id ?? ''),
			decision: String(v?.decision || ''),
			reasoning: String(v?.reasoning_ref || ''),
			status: String(v?.status || ''),
			issued_at: Number(v?.issued_at) || 0,
			court: String(v?.court || ''),
			penalties: ((v?.penalties ?? []) as any[]).map((p) => ({
				id: String(p?.id ?? ''),
				penalty_type: String(p?.kind || ''),
				amount: Number(p?.amount) || 0,
				currency: String(p?.symbol || ''),
				status: String(p?.status || ''),
				target: String(p?.target || ''),
				invoice: String(p?.invoice || ''),
			})),
		};
	}

	// A description is stored as {ciphertext}: encrypted in the browser for the claimant
	// and the justice department (never the defendant), keyed at the dispute's scope.
	const disputeScope = (claimant: string, id: string) => `user:${claimant}:dispute:${id}`;

	function sealedOf(ref: string): { ciphertext: string } | null {
		try {
			const v = JSON.parse(ref);
			return v && typeof v.ciphertext === 'string' ? v : null;
		} catch {
			return null;
		}
	}

	async function describe(d: any) {
		const ref = String(d?.description_ref || '');
		if (!ref) return { description: '', is_private: false, locked: false };
		const sealed = sealedOf(ref);
		if (!sealed) return { description: ref, is_private: false, locked: false };
		try {
			const scope = disputeScope(String(d.claimant || ''), String(d.id || ''));
			const plain: any = await ctx.crypto?.decryptScope?.(scope, sealed.ciphertext);
			if (plain && typeof plain.description === 'string') {
				return { description: plain.description, is_private: true, locked: false };
			}
		} catch (e) {
			console.warn('[justice_litigation] decrypt failed', e);
		}
		return { description: '', is_private: true, locked: true };
	}

	// A member's own disputes: the dispute scopes they hold a key at, each read in full.
	async function loadMine() {
		const me = meId || principal;
		if (!me) return [];
		const prefix = disputeScope(me, '');
		const ids: string[] = [];
		let from: number | null = 1;
		for (let i = 0; from != null && i < 10; i++) {
			const res = await read('crypto_scopes', { from, count: 500 });
			for (const s of (res?.scopes ?? []) as string[]) {
				if (typeof s === 'string' && s.startsWith(prefix)) ids.push(s.slice(prefix.length));
			}
			from = typeof res?.next === 'number' ? res.next : null;
		}
		const found = await Promise.all(ids.map((id) => read('dispute_get', { dispute: id })));
		return found.filter((r) => r?.dispute).map((r) => toRow(r.dispute));
	}

	function canVerdict(lit: any) {
		return lit?.status === 'accepted' && !!lit?.case_id && can('resolution.draft');
	}

	async function createCourt() {
		if (courtFormName.trim().length < 2) {
			courtFormError = 'Court name must be at least 2 characters';
			return;
		}
		if (!courtFormOperator) {
			courtFormError = 'Choose the department that runs the court';
			return;
		}
		courtFormSaving = true;
		courtFormError = '';
		courtFormSuccess = '';
		try {
			const params: Record<string, unknown> = {
				name: courtFormName.trim(),
				operator: `Department:${courtFormOperator}`,
				level: courtFormLevel,
				jurisdiction: courtFormJurisdiction.trim(),
			};
			if (courtFormParentId.trim()) params.parent = courtFormParentId.trim();
			const reply = await run('court_create', params);
			courtFormSuccess = reply.court
				? `Court ${reply.court} created.`
				: reply.proposal
					? `Proposal ${reply.proposal} filed for a vote.`
					: 'Court created.';
			courtFormName = '';
			courtFormJurisdiction = '';
			courtFormParentId = '';
		} catch (e: any) {
			courtFormError = e?.message || String(e);
		} finally {
			courtFormSaving = false;
		}
	}

	let loadSeq = 0;

	async function loadLitigations(append = false) {
		const seq = ++loadSeq;
		if (append) {
			loadingMore = true;
		} else {
			loading = true;
			nextFromId = null;
			hasMore = false;
		}
		error = '';
		try {
			if (!meLoaded) await loadMe();
			if (seq !== loadSeq) return;
			// Labels for the parties; a failure only leaves raw ids.
			await loadDirectory();
			if (seq !== loadSeq) return;
			let rows: any[];
			if (can('dispute.view_all')) {
				const res = await read('dispute_list_all', {
					from: append && nextFromId != null ? nextFromId : 1,
					count: 100,
				});
				rows = ((res?.disputes ?? []) as any[]).map(toRow);
				nextFromId = typeof res?.next === 'number' ? res.next : null;
			} else {
				rows = await loadMine();
				nextFromId = null;
			}
			if (seq !== loadSeq) return;
			litigations = append ? [...litigations, ...rows] : rows;
			hasMore = nextFromId != null;
			if (!append && selectedCase) {
				const fresh = rows.find((r) => r.id === selectedCase.id);
				void openCase(fresh ?? selectedCase);
			}
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			if (seq === loadSeq) {
				loading = false;
				loadingMore = false;
			}
		}
	}

	async function createLitigation() {
		if (!formTitle.trim() || !formDescription.trim() || !hasDefendant) {
			createError = 'All fields are required';
			return;
		}
		createError = '';
		createNote = '';
		if (!meLoaded) await loadMe();
		const me = meId || principal;
		if (!me || !ctx.crypto?.encryptForRecipients || !ctx.crypto?.grantScope) {
			createNote = 'Private filing is not available here. Sign in to file a dispute.';
			return;
		}
		creating = true;
		createSuccess = false;
		try {
			const e = selectedDefendantEntry;
			const typed = (e?.principal || defendantPrincipal).trim();
			const respondent =
				e?.kind === 'department'
					? `Department:${e.id}`
					: typed.includes(':')
						? typed
						: `User:${typed}`;

			// 1. Encrypt the description locally for the claimant and the justice department.
			await loadDepartments();
			const recipients = [...new Set([me, ...justiceStaff])];
			let sealed: { ciphertext: string; wrappedDeks: Record<string, string> };
			try {
				sealed = await ctx.crypto.encryptForRecipients(recipients, {
					description: formDescription.trim(),
				});
			} catch (err) {
				console.warn('[justice_litigation] encrypt failed', err);
				createNote =
					'Private filing is not available right now: the realm’s key service did not respond. Please try again later.';
				return;
			}

			// 2. File the dispute; the description travels only as ciphertext.
			const filed = await run('dispute_file', {
				respondent,
				title: formTitle.trim(),
				description_ref: JSON.stringify({ ciphertext: sealed.ciphertext }),
			});
			createdId = String(filed.dispute || '');

			// 3. Store the readers' wrapped keys at the dispute's scope, which the claimant owns.
			try {
				await ctx.crypto.grantScope(disputeScope(me, createdId), sealed.wrappedDeks);
			} catch (err: any) {
				throw new Error(
					`Dispute ${createdId} was filed, but sharing its description failed: ${err?.message || err}`,
				);
			}
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

	async function openCase(lit: any) {
		selectedCase = lit;
		caseDetail = null;
		detailError = '';
		decideError = '';
		detailLoading = true;
		const isCurrent = () => selectedCase?.id === lit.id;
		try {
			const [full, found] = await Promise.all([
				read('dispute_get', { dispute: lit.id }),
				lit.case_id ? read('resolution_query', { count: 500 }) : Promise.resolve(null),
			]);
			if (!isCurrent()) return;
			const text = await describe(full?.dispute);
			if (!isCurrent()) return;
			selectedCase = { ...lit, ...text };
			const verdicts = ((found?.verdicts ?? []) as any[])
				.filter((v) => v?.case === lit.case_id)
				.map(toVerdict);
			caseDetail = { verdicts, court: verdicts.find((v) => v.court)?.court ?? '' };
		} catch (e: any) {
			if (isCurrent()) detailError = e?.message || String(e);
		} finally {
			if (isCurrent()) detailLoading = false;
		}
	}

	async function acceptDispute() {
		if (!selectedCase || !acceptCourtId.trim()) return;
		deciding = true;
		decideError = '';
		try {
			await run('dispute_accept', { dispute: selectedCase.id, court: acceptCourtId.trim() });
			acceptCourtId = '';
			await loadLitigations();
		} catch (e: any) {
			decideError = e?.message || String(e);
		} finally {
			deciding = false;
		}
	}

	async function rejectDispute() {
		if (!selectedCase) return;
		deciding = true;
		decideError = '';
		try {
			await run('dispute_reject', { dispute: selectedCase.id });
			await loadLitigations();
		} catch (e: any) {
			decideError = e?.message || String(e);
		} finally {
			deciding = false;
		}
	}

	function closeCase() {
		selectedCase = null;
		caseDetail = null;
		detailLoading = false;
		detailError = '';
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
			// A verdict is drafted on the case, then issued by a sitting judge.
			const draft = await run('verdict_draft', {
				case: verdictCase.case_id,
				decision: verdictDecision.trim(),
				reasoning_ref: verdictReasoning.trim(),
			});
			try {
				await run('verdict_issue', { verdict: draft.verdict });
			} catch (e: any) {
				throw new Error(`Verdict ${draft.verdict} was drafted but not issued: ${e?.message || e}`);
			}
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
		createNote = '';
		createSuccess = false;
	}

	function statusColor(status: string) {
		switch (status) {
			case 'filed':
			case 'pending':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
			case 'accepted':
			case 'in_progress':
			case 'in_review':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
			case 'resolved':
			case 'closed':
			case 'executed':
			case 'paid':
			case 'final':
				return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
			case 'verdict_issued':
			case 'issued':
			case 'appealed':
				return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
		}
	}

	function statusLabel(s: string) {
		return s ? s.replaceAll('_', ' ') : 'unknown';
	}

	function capitalize(s: string) {
		return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
	}

	// "community_service" -> "Community service"
	function humanize(s: string) {
		return capitalize((s || '').replaceAll('_', ' '));
	}

	function formatAmount(amount: unknown, currency: string) {
		const n = Number(amount).toLocaleString('en-US', { maximumFractionDigits: 2 });
		return currency ? `${n} ${currency}` : n;
	}

	function levelLabel(level: string) {
		return COURT_LEVELS.find((l) => l.value === level)?.label ?? (level || 'unknown');
	}

	// Realm timestamps are seconds.
	function formatTime(sec: number) {
		if (!(sec > 0)) return '';
		return new Date(sec * 1000).toLocaleDateString('en-US', {
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

	// (Re)load whenever the signed-in principal changes.
	let lastLoadedFor: string | null = null;
	$effect(() => {
		const p = principal;
		untrack(() => {
			if (p === lastLoadedFor) return;
			lastLoadedFor = p;
			meLoaded = false;
			void loadLitigations();
		});
	});

	$effect(() => {
		if (tab === 'create' && !directoryLoaded) untrack(() => void loadDirectory());
	});

	$effect(() => {
		if (tab === 'courts') untrack(() => void loadDepartments());
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

	.case-row {
		cursor: pointer;
	}

	.case-open {
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.case-open:focus-visible {
		outline: 2px solid #6366f1;
		outline-offset: 2px;
		border-radius: 4px;
	}

	.case-detail {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.case-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.case-card {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 16px;
	}

	:global(.dark) .case-card {
		background: #1f2937;
		border-color: #374151;
	}

	.case-section-title {
		margin: 0 0 8px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
	}

	:global(.dark) .case-section-title {
		color: #9ca3af;
	}

	.case-subsection {
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid #e5e7eb;
	}

	:global(.dark) .case-subsection {
		border-top-color: #374151;
	}

	.case-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 8px;
	}

	.case-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.case-facts {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 8px 16px;
		margin: 0;
		font-size: 0.875rem;
	}

	.case-facts dt {
		color: #6b7280;
	}

	.case-facts dd {
		margin: 0;
		min-width: 0;
		color: #111827;
		overflow-wrap: anywhere;
	}

	:global(.dark) .case-facts dt {
		color: #9ca3af;
	}

	:global(.dark) .case-facts dd {
		color: #fff;
	}

	.pre-line {
		white-space: pre-line;
		overflow-wrap: anywhere;
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
				onclick={() => {
					tab = 'list';
					closeCase();
				}}
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
			{#if can('org.create')}
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
				{#if selectedCase}
					{@const c = selectedCase}
					{@const d = caseDetail}
					{@const backLabel = userProfile === 'admin' ? 'All litigations' : 'My litigations'}
					<div class="case-detail">
						<div>
							<button
								type="button"
								class="chrome-btn"
								onclick={closeCase}
								title={backLabel}
								aria-label={backLabel}
							>
								<span aria-hidden="true">←</span>
								<span class="chrome-label">{backLabel}</span>
							</button>
						</div>

						<div>
							<div class="case-header">
								<span class="font-mono text-xs text-indigo-600 dark:text-indigo-400">
									{c.id}
								</span>
								<span
									class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {statusColor(c.status)}"
								>
									{statusLabel(c.status)}
								</span>
							</div>
							<h3 class="mt-1 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
								{#if c.is_private && !c.locked}
									<svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Private">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								{/if}
								{c.case_title || '(untitled)'}
							</h3>
							{#if c.locked}
								<p class="mt-2 flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 italic">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
									Description encrypted — no access
								</p>
							{:else if c.description}
								<p class="pre-line mt-2 text-sm text-gray-700 dark:text-gray-300">{c.description}</p>
							{/if}
						</div>

						<div class="case-card">
							<dl class="case-facts">
								<dt>Case</dt>
								<dd class="font-mono text-xs">{c.case_id || '—'}</dd>
								{#if d?.court}
									<dt>Court</dt>
									<dd class="font-mono text-xs">{d.court}</dd>
								{/if}
								<dt>Requester</dt>
								<dd class="font-mono text-xs" title={c.requester_principal}>
									{truncatePrincipal(userLabel(c.requester_principal))}
								</dd>
								<dt>Defendant</dt>
								<dd>
									{#if c.defendant_kind === 'department'}
										<span
											class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 mr-1"
										>
											dept
										</span>
										{c.defendant_label}
									{:else}
										<span class="font-mono text-xs" title={c.defendant_principal || c.defendant_label}>
											{truncatePrincipal(c.defendant_label || c.defendant_principal)}
										</span>
									{/if}
								</dd>
							</dl>
						</div>

						{#if detailLoading}
							<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
								<svg class="animate-spin w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" aria-hidden="true">
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
								Loading case…
							</div>
						{:else if detailError}
							<div
								class="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm"
							>
								<span class="font-medium">Error:</span>
								{detailError}
							</div>
						{:else if d}
							<section>
								<h4 class="case-section-title">Verdict</h4>
								{#if d.verdicts?.length}
									<div class="case-list">
										{#each d.verdicts as v, i (v.id ?? i)}
											<div class="case-card">
												<div class="case-meta">
													<span class="font-semibold text-gray-900 dark:text-white">
														{capitalize(v.decision) || '—'}
													</span>
													{#if v.status}
														<span
															class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {statusColor(v.status)}"
														>
															{statusLabel(v.status)}
														</span>
													{/if}
													{#if v.issued_at}
														<span class="text-xs text-gray-500 dark:text-gray-400">
															{formatTime(v.issued_at)}
														</span>
													{/if}
												</div>
												{#if v.reasoning}
													<p class="pre-line mt-2 text-sm text-gray-700 dark:text-gray-300">{v.reasoning}</p>
												{/if}
												{#if v.penalties?.length}
													<div class="case-subsection">
														<h5 class="case-section-title">Penalties</h5>
														<div class="case-list">
															{#each v.penalties as p, j (p.id ?? j)}
																<div>
																	<div class="case-meta">
																		<span class="font-medium text-gray-900 dark:text-white">
																			{humanize(p.penalty_type) || 'Penalty'}
																		</span>
																		{#if Number(p.amount) > 0}
																			<span class="text-sm text-gray-700 dark:text-gray-300">
																				{formatAmount(p.amount, p.currency)}
																			</span>
																		{/if}
																		<span
																			class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {statusColor(p.status)}"
																		>
																			{statusLabel(p.status)}
																		</span>
																	</div>
																	{#if p.target}
																		<div class="case-meta mt-1 text-xs text-gray-500 dark:text-gray-400">
																			<span>Against {p.target}</span>
																			{#if p.invoice}
																				<span>Invoice {p.invoice}</span>
																			{/if}
																		</div>
																	{/if}
																</div>
															{/each}
														</div>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-sm text-gray-500 dark:text-gray-400">No verdict yet.</p>
								{/if}
							</section>

							<section>
								<h4 class="case-section-title">Appeals</h4>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									Appeals are not listed in this version.
								</p>
							</section>
						{/if}

						{#if c.status === 'filed' && (can('dispute.accept') || can('dispute.reject'))}
							<div class="case-card">
								<h4 class="case-section-title">Review</h4>
								<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
									Accepting the dispute opens a case at the court you name (e.g. COURT-1).
								</p>
								<div class="flex flex-wrap items-center gap-2">
									{#if can('dispute.accept')}
										<input
											type="text"
											bind:value={acceptCourtId}
											placeholder="Court ID"
											aria-label="Court ID"
											disabled={deciding}
											class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
										/>
										<button
											class="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											onclick={acceptDispute}
											disabled={deciding || !acceptCourtId.trim()}
										>
											Accept
										</button>
									{/if}
									{#if can('dispute.reject')}
										<button
											class="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
											onclick={rejectDispute}
											disabled={deciding}
										>
											Reject
										</button>
									{/if}
								</div>
								{#if decideError}
									<div
										class="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm"
									>
										<span class="font-medium">Error:</span>
										{decideError}
									</div>
								{/if}
							</div>
						{/if}

						{#if canVerdict(c)}
							<div>
								<button
									class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
									onclick={() => openVerdict(selectedCase)}
								>
									Execute Verdict
								</button>
							</div>
						{/if}
					</div>
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
									<button type="button" class="case-open min-w-0" onclick={() => openCase(lit)}>
										<span class="block font-mono text-xs text-indigo-600 dark:text-indigo-400">
											{lit.id}
										</span>
										<span class="block mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
											{lit.case_title || '(untitled)'}
										</span>
									</button>
									<span class="shrink-0 text-xs font-medium {statusColor(lit.status)} px-2 py-0.5">
										{statusLabel(lit.status)}
									</span>
								</div>
								{#if lit.case_id}
									<div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
										Case {lit.case_id}
									</div>
								{/if}
								<div class="mt-0.5 text-xs text-gray-400 font-mono">
									{truncatePrincipal(userLabel(lit.requester_principal))}
									{#if userProfile === 'admin'}
										→
										{#if lit.defendant_kind === 'department'}
											{lit.defendant_label}
										{:else}
											{truncatePrincipal(lit.defendant_label || lit.defendant_principal)}
										{/if}
									{/if}
								</div>
								{#if canVerdict(lit)}
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
									<th class="px-4 py-3 rounded-tl-lg">Dispute</th>
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
										class="case-row bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
										onclick={() => openCase(lit)}
									>
									<td class="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">
										{lit.id}
									</td>
										<td class="px-4 py-3">
											<button
												type="button"
												class="case-open"
												onclick={(e) => {
													e.stopPropagation();
													openCase(lit);
												}}
											>
												<span class="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
													{lit.case_title || '(untitled)'}
												</span>
											</button>
										</td>
										<td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
											{lit.case_id || '—'}
										</td>
										<td class="px-4 py-3">
											<span
												class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {statusColor(lit.status)}"
											>
												{statusLabel(lit.status)}
											</span>
										</td>
										<td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
											{truncatePrincipal(userLabel(lit.requester_principal))}
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
											{#if canVerdict(lit)}
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
						Submit a new litigation request. All fields are required. The description is
						encrypted in your browser and shared only with you and the justice department —
						no one else (not even the defendant) can read it. The title stays visible to the
						justice department and the parties.
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
									placeholder="Search this realm's users and departments, or paste a principal"
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
							{:else if crossRealmDefendant}
								<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									Parties in other realms cannot be named in this version.
								</p>
							{:else}
								<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									Search this realm's users and departments, or paste a principal.
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

						<p class="text-xs text-gray-500 dark:text-gray-400">
							The justice department picks the court when it accepts your dispute.
						</p>
					</div>

					{#if createNote}
						<div
							class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg text-sm"
						>
							{createNote}
						</div>
					{/if}

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
							<span class="font-medium">Success:</span> Litigation case {createdId} created!
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
							Set up the courts of this realm. Accepted disputes become cases at a court.
						</p>
					</div>
				</div>

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
									Run by (department)
								</label>
								<select
									id="jl-court-operator"
									bind:value={courtFormOperator}
									disabled={courtFormSaving}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
								>
									{#each departments as dep (dep)}
										<option value={dep}>{dep}</option>
									{/each}
								</select>
							</div>
						</div>

						<p class="mt-4 text-xs text-gray-500 dark:text-gray-400">
							Existing courts are not listed in this version; note the ID shown once a court is created.
						</p>

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
								disabled={courtFormSaving || courtFormName.trim().length < 2 || !courtFormOperator}
							>
								{courtFormSaving ? 'Creating…' : 'Create Court'}
							</button>
						</div>
				</div>

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
							Pending
						</p>
						<p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
							{pendingCount}
						</p>
					</div>
					<div
						class="bg-white dark:bg-gray-800 p-4 sm:border sm:border-gray-200 sm:dark:border-gray-700 sm:rounded-xl sm:p-5"
					>
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
							In Review
						</p>
						<p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
							{inReviewCount}
						</p>
					</div>
					<div
						class="bg-white dark:bg-gray-800 p-4 sm:border sm:border-gray-200 sm:dark:border-gray-700 sm:rounded-xl sm:p-5"
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
