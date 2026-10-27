<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	let { ctx }: { ctx: any } = $props();

	const cn = $derived(ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' ')));

	const PAGE = 500;
	const MAX_PAGES = 20;

	// Departments
	let departments: any[] = $state([]);
	let deptLoading = $state(true);
	let departmentsBlockedMessage: string | null = $state(null);
	let showNewDept = $state(false);
	let newDeptName = $state('');
	let newDeptDesc = $state('');
	let newDeptFund = $state('');
	let newThresholdM = $state('1');
	let newThresholdN = $state('1');
	let selectedDeptName = $state('');
	let addMemberPrincipal = $state('');
	let addMemberPosition = $state('');
	let addingMember = $state(false);
	let copiedMemberPrincipal: string | null = $state(null);
	// The realm's users from `user_list`: member autocomplete and nicknames.
	let directory: { principal: string; nickname: string; label: string }[] = $state([]);
	const nicknames = $derived(new Map(directory.map((e) => [e.principal, e.nickname])));
	let showMemberSuggestions = $state(false);
	let memberSuggestionIndex = $state(0);
	let memberSuggestions = $derived.by(() => {
		const q = addMemberPrincipal.trim().toLowerCase();
		if (!q) return [];
		return directory
			.filter(
				(e) =>
					(e.label || '').toLowerCase().includes(q) ||
					(e.principal || '').toLowerCase().includes(q),
			)
			.slice(0, 8);
	});
	let resolvedMemberPrincipal = $derived.by(() => {
		const raw = addMemberPrincipal.trim();
		if (!raw) return null;

		const exact = directory.find((e) => (e.principal || '').toLowerCase() === raw.toLowerCase());
		if (exact?.principal) return exact.principal;

		const labelMatches = directory.filter((e) => (e.label || '').toLowerCase() === raw.toLowerCase());
		if (labelMatches.length === 1 && labelMatches[0].principal) return labelMatches[0].principal;

		if (isValidIcPrincipal(raw)) return raw.toLowerCase();

		return null;
	});
	let memberPrincipalUnresolved = $derived(
		addMemberPrincipal.trim() !== '' && resolvedMemberPrincipal === null,
	);
	let policyDraft: Record<string, { m: string; n: string; quorum: string; veto: string }> = $state({});
	let authTarget = $state('');
	let authPerms = $state('org.appoint,org.expel,org.set_policy');
	let authRemoteQuarter = $state('');
	let revokeAuthorityId = $state('');

	const sortedDepartments = $derived(
		[...departments].sort((a, b) => {
			if (a.is_root && !b.is_root) return -1;
			if (!a.is_root && b.is_root) return 1;
			return (a.name || '').localeCompare(b.name || '');
		}),
	);

	const selectedDept = $derived(
		selectedDeptName ? departments.find((d) => d.name === selectedDeptName) ?? null : null,
	);

	type DeptTab = 'overview' | 'members' | 'permissions' | 'authority' | 'fund';
	// Fund tab (issue #260)
	let activeTab: DeptTab = $state('overview');
	let narrow = $state(isNarrowViewport());
	const unsubNarrow = subscribeNarrowViewport((value) => {
		narrow = value;
	});
	onDestroy(unsubNarrow);

	const deptTabs: { id: DeptTab; label: string }[] = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'members', label: 'Members' },
		{ id: 'permissions', label: 'Permissions' },
		{ id: 'authority', label: 'Authority' },
		{ id: 'fund', label: 'Fund' },
	];

	const boxClass = $derived(
		narrow
			? 'p-3 border-y border-gray-200 bg-white space-y-2'
			: 'p-4 border border-gray-200 rounded-xl bg-white space-y-2',
	);
	const nestedBoxClass = $derived(
		narrow
			? 'p-3 border border-gray-200 bg-white space-y-3'
			: 'p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3',
	);
	const metricClass = $derived(
		narrow
			? 'p-3 bg-white border border-gray-200'
			: 'p-3 bg-white border border-gray-200 rounded-lg',
	);
	let newFundCode = $state('');
	let fundBusy = $state(false);
	let payrollBusy = $state(false);
	const payrollPeriod = new Date().toISOString().slice(0, 7);

	function selectDepartment(name: string) {
		selectedDeptName = name;
		showNewPosition = null;
		editingPosition = null;
		assigningPosition = null;
		assignPrincipal = '';
		addMemberPosition = '';
	}

	function notify(message: string, type: 'success' | 'info' | 'error' = 'success') {
		const friendly = message.includes('Invalid delegation expiry') ||
			message.includes('delegation has expired') ||
			message.includes('Specified sender delegation has expired')
			? 'Your session expired. Please refresh the page to continue.'
			: message;
		if (typeof ctx.notify === 'function') {
			ctx.notify(type, friendly);
			return;
		}
		console.warn('[access_manager]', type, friendly);
	}

	async function confirmModal(opts: {
		title: string;
		body: string;
		confirmLabel?: string;
		danger?: boolean;
	}): Promise<boolean> {
		if (typeof ctx.openModal !== 'function') return true;
		try {
			const { actionId } = await ctx.openModal({
				title: opts.title,
				body: opts.body,
				actions: [
					{ id: 'cancel', label: 'Cancel', tone: 'secondary' },
					{
						id: 'confirm',
						label: opts.confirmLabel || 'Confirm',
						tone: opts.danger ? 'danger' : 'primary',
					},
				],
			});
			return actionId === 'confirm';
		} catch {
			return false;
		}
	}

	async function call(kind: 'read' | 'run', name: string, args: Record<string, unknown> = {}): Promise<any> {
		if (typeof ctx[kind] !== 'function') return { ok: false, error: 'This realm cannot run it here.' };
		try {
			const reply = await ctx[kind](name, args);
			return reply && typeof reply === 'object' ? reply : { ok: false, error: 'No reply.' };
		} catch (e: any) {
			return { ok: false, error: String(e?.message ?? e) };
		}
	}

	/** A realm read operation's reply, or null when it fails or is not available to the caller. */
	async function read(name: string, args: Record<string, unknown> = {}): Promise<any> {
		const reply = await call('read', name, args);
		if (reply.ok) return reply;
		console.warn(`[access_manager] ${name}:`, reply.error);
		return null;
	}

	/** Every row of a paginated read (``from`` / ``count`` / ``next``), and the refusal that stopped it, if any. */
	async function readAll(name: string, key: string): Promise<{ rows: any[]; error: string }> {
		const rows: any[] = [];
		let from: number | null = 1;
		for (let i = 0; i < MAX_PAGES && from != null; i++) {
			const reply = await call('read', name, { from, count: PAGE });
			if (!reply.ok) {
				console.warn(`[access_manager] ${name}:`, reply.error);
				return { rows, error: String(reply.error || `${name} is not available`) };
			}
			if (Array.isArray(reply[key])) rows.push(...reply[key]);
			from = typeof reply.next === 'number' ? reply.next : null;
		}
		return { rows, error: '' };
	}

	/** Run ``name`` without telling the user; the reply, ok or not. */
	async function attempt(name: string, args: Record<string, unknown>): Promise<any> {
		return await call('run', name, args);
	}

	/** Run ``name`` and report it; a governed call files a proposal instead of acting, which still counts as done. */
	async function change(
		name: string,
		args: Record<string, unknown>,
		done: (reply: any) => string,
	): Promise<any | null> {
		const reply = await attempt(name, args);
		if (!reply.ok) {
			notify(String(reply.error || `${name} was refused.`), 'error');
			return null;
		}
		if (reply.proposal) notify(proposalNotice(reply), 'info');
		else notify(done(reply));
		return reply;
	}

	function proposalNotice(reply: any): string {
		return `Submitted for a vote as proposal ${reply.proposal} (see Voting).`;
	}

	function unavailableMessage(error: string, what: string): string {
		return /needs \S+|sign in|denied|not allowed|permission/i.test(error)
			? `You don't have permission to view ${what}.`
			: `The realm could not list ${what} just now.`;
	}

	function int(value: string, fallback: number): number {
		const n = parseInt(String(value ?? '').trim(), 10);
		return Number.isFinite(n) ? n : fallback;
	}

	function person(principal: string): { principal: string; nickname: string } {
		return { principal, nickname: nicknames.get(principal) || '' };
	}

	// --- Departments: department_list rows, with policy and seats from department_chart ---
	function flattenChart(node: any, out: Map<string, any>) {
		if (!node || typeof node !== 'object') return;
		if (node.department) out.set(String(node.department), node);
		for (const child of Array.isArray(node.children) ? node.children : []) flattenChart(child, out);
	}

	function toPosition(p: any) {
		const holders = (Array.isArray(p?.holders) ? p.holders : []).map((h: any) => ({
			id: String(h.id ?? ''),
			principal: String(h.user ?? ''),
			kind: h.kind || 'substantive',
			agent: !!h.agent,
		}));
		return {
			key: String(p?.id ?? ''),
			title: p?.title || String(p?.id ?? ''),
			profile: p?.profile || '',
			headcount: Number(p?.headcount) || 1,
			salary_amount: Number(p?.salary) || 0,
			salary_period: p?.salary_period || 'monthly',
			status: p?.status || 'open',
			filled: holders.length,
			holders,
		};
	}

	function toDepartment(row: any, node: any) {
		const policy = node?.policy ?? {};
		const positions = (Array.isArray(node?.positions) ? node.positions : []).map(toPosition);
		const members: string[] = [
			...new Set<string>(positions.flatMap((p: any) => p.holders.map((h: any) => h.principal))),
		];
		return {
			name: String(row.id ?? ''),
			description: row.description || '',
			is_root: !!row.is_root,
			head: row.head || node?.head || '',
			policy: {
				threshold_m: Number(policy.m) || 1,
				threshold_n: Number(policy.n) || 1,
				quorum_percent: Number(policy.quorum_percent) || 0,
				veto_principals: Array.isArray(policy.veto) ? policy.veto.map(String) : [],
			},
			positions,
			members,
			member_count: members.length,
		};
	}

	async function loadDepartments() {
		deptLoading = true;
		departmentsBlockedMessage = null;
		try {
			const listed = await readAll('department_list', 'departments');
			if (listed.error && listed.rows.length === 0) {
				departments = [];
				selectedDeptName = '';
				departmentsBlockedMessage = unavailableMessage(listed.error, 'departments');
				return;
			}
			const chart = await read('department_chart');
			const nodes = new Map<string, any>();
			flattenChart(chart?.chart, nodes);
			departments = listed.rows.map((row) => toDepartment(row, nodes.get(String(row.id))));
			for (const d of departments) {
				policyDraft[d.name] = serverPolicyValues(d);
			}
			policyDraft = { ...policyDraft };

			// Keep selection when reloading; otherwise pick the first department.
			if (departments.length === 0) {
				selectedDeptName = '';
			} else if (!selectedDeptName || !departments.some((d) => d.name === selectedDeptName)) {
				const first = [...departments].sort((a, b) => {
					if (a.is_root && !b.is_root) return -1;
					if (!a.is_root && b.is_root) return 1;
					return (a.name || '').localeCompare(b.name || '');
				})[0];
				if (first) selectDepartment(first.name);
			}
		} finally {
			deptLoading = false;
		}
	}

	async function createDepartment() {
		const name = newDeptName.trim();
		if (!name) return;
		const m = int(newThresholdM, 1);
		const n = int(newThresholdN, 1);
		if (m < 1 || n < m) {
			notify('Approvals need 1 ≤ M ≤ N.', 'error');
			return;
		}
		const fund = newDeptFund.trim();
		const created = await attempt('department_create', { department: name, description: newDeptDesc.trim() });
		if (!created.ok) {
			notify(String(created.error || 'The department was not created.'), 'error');
			return;
		}
		newDeptName = ''; newDeptDesc = ''; newDeptFund = '';
		newThresholdM = '1'; newThresholdN = '1';
		showNewDept = false;
		if (created.proposal) {
			notify(proposalNotice(created), 'info');
			return;
		}
		const notes = [`Department "${name}" created.`];
		let refused = false;
		const follow = async (label: string, op: string, args: Record<string, unknown>) => {
			const reply = await attempt(op, args);
			if (!reply.ok) {
				refused = true;
				notes.push(`${label}: ${reply.error || 'refused'}`);
			} else if (reply.proposal) {
				notes.push(`${label}: submitted for a vote as proposal ${reply.proposal}.`);
			} else {
				notes.push(`${label}: done.`);
			}
		};
		if (m !== 1 || n !== 1) {
			await follow(`Policy ${m}/${n}`, 'department_set_policy', { department: name, m, n, quorum_percent: 0, veto: [] });
		}
		if (fund) await follow(`Fund ${fund}`, 'fund_create', { fund, name: fund, department: name });
		notify(notes.join(' '), refused ? 'info' : 'success');
		await loadDepartments();
		if (departments.some((d) => d.name === name)) selectDepartment(name);
	}

	// --- Positions (issue #241) ---
	let showNewPosition: string | null = $state(null);
	let newPosTitle = $state('');
	let newPosProfile = $state('');
	let newPosHeadcount = $state('1');
	let newPosSalary = $state('0');
	let editingPosition: string | null = $state(null);
	let assigningPosition: string | null = $state(null);
	let assignPrincipal = $state('');
	let posDraft: { title: string; headcount: string; salary: string } = $state({ title: '', headcount: '1', salary: '0' });

	function slug(text: string): string {
		return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
	}

	async function createPosition(deptName: string) {
		const title = newPosTitle.trim();
		if (!title) return;
		const args: Record<string, unknown> = {
			department: deptName,
			position: `${slug(deptName) || 'department'}.${slug(title) || Date.now().toString(36)}`,
			title,
			headcount: int(newPosHeadcount, 1),
			salary: int(newPosSalary, 0),
		};
		if (newPosProfile.trim()) args.profile = newPosProfile.trim();
		if (await change('position_create', args, () => `Position "${title}" created`)) {
			showNewPosition = null;
			newPosTitle = ''; newPosProfile = ''; newPosHeadcount = '1'; newPosSalary = '0';
			await loadDepartments();
		}
	}

	function startEditPosition(pos: any) {
		editingPosition = pos.key;
		posDraft = {
			title: pos.title,
			headcount: String(pos.headcount ?? 1),
			salary: String(pos.salary_amount ?? 0),
		};
	}

	async function saveEditPosition(pos: any) {
		const reply = await change('position_edit', {
			position: pos.key,
			title: posDraft.title.trim(),
			headcount: int(posDraft.headcount, pos.headcount),
			salary: int(posDraft.salary, pos.salary_amount),
		}, () => `Position "${pos.title}" updated`);
		if (reply) {
			editingPosition = null;
			await loadDepartments();
		}
	}

	/** Close an open or frozen seat (final, it must be empty), or reopen a frozen one. */
	async function togglePositionStatus(pos: any) {
		const reply = pos.status === 'frozen'
			? await change('position_edit', { position: pos.key, status: 'open' }, () => `Position "${pos.title}" reopened`)
			: await change('position_close', { position: pos.key }, () => `Position "${pos.title}" closed`);
		if (reply) await loadDepartments();
	}

	async function endAppointment(holder: { id: string }) {
		if (await change('appointment_end', { appointment: holder.id }, () => 'Appointment ended')) {
			await loadDepartments();
		}
	}

	async function appointMember(pos: any, principal: string) {
		if (!principal.trim()) return;
		if (await change('appoint', { position: pos.key, user: principal.trim() }, () => `Appointed to "${pos.title}"`)) {
			assigningPosition = null;
			assignPrincipal = '';
			await loadDepartments();
		}
	}

	function eligibleAppointees(pos: any) {
		const holders = new Set((pos.holders ?? []).map((h: any) => h.principal));
		return directory.filter((m) => m.principal && !holders.has(m.principal));
	}

	function startAssignPosition(pos: any) {
		assigningPosition = pos.key;
		editingPosition = null;
		const eligible = eligibleAppointees(pos);
		assignPrincipal = eligible[0]?.principal ?? '';
	}

	function openSeats(dept: any): any[] {
		return (dept.positions ?? []).filter((p: any) => p.status === 'open' && p.filled < p.headcount);
	}

	type PolicyDraft = { m: string; n: string; quorum: string; veto: string };

	function serverPolicyValues(dept: any): PolicyDraft {
		return {
			m: String(dept.policy?.threshold_m ?? 1),
			n: String(dept.policy?.threshold_n ?? 1),
			quorum: String(dept.policy?.quorum_percent ?? 0),
			veto: (dept.policy?.veto_principals ?? []).join(', '),
		};
	}

	function policyDraftDirty(name: string): boolean {
		const dept = departments.find((d) => d.name === name);
		const draft = policyDraft[name];
		if (!dept || !draft) return false;
		const server = serverPolicyValues(dept);
		return (
			draft.m !== server.m ||
			draft.n !== server.n ||
			draft.quorum !== server.quorum ||
			draft.veto !== server.veto
		);
	}

	function resetPolicyDraft(name: string) {
		const dept = departments.find((d) => d.name === name);
		if (!dept || !policyDraft[name]) return;
		policyDraft[name] = { ...serverPolicyValues(dept) };
		policyDraft = { ...policyDraft };
	}

	function validatePolicyDraft(draft: PolicyDraft): { valid: boolean; errors: { m?: string; n?: string; quorum?: string } } {
		const errors: { m?: string; n?: string; quorum?: string } = {};
		const mRaw = draft.m.trim();
		const nRaw = draft.n.trim();
		const quorumRaw = draft.quorum.trim();
		const m = parseInt(mRaw, 10);
		const n = parseInt(nRaw, 10);
		const quorum = parseInt(quorumRaw, 10);

		if (!/^\d+$/.test(mRaw) || m < 1) errors.m = 'Must be an integer ≥ 1';
		if (!/^\d+$/.test(nRaw) || n < 1) errors.n = 'Must be an integer ≥ 1';
		if (!/^\d+$/.test(quorumRaw) || quorum < 0 || quorum > 100) {
			errors.quorum = 'Must be an integer 0–100';
		}
		if (!errors.m && !errors.n && m > n) errors.m = 'M must be ≤ N';

		return { valid: Object.keys(errors).length === 0, errors };
	}

	function policyValidation(name: string) {
		const draft = policyDraft[name];
		if (!draft) return { valid: false, errors: {} as { m?: string; n?: string; quorum?: string } };
		return validatePolicyDraft(draft);
	}

	async function savePolicy(name: string) {
		const draft = policyDraft[name];
		if (!draft) return;
		if (!policyValidation(name).valid) return;
		const reply = await change('department_set_policy', {
			department: name,
			m: int(draft.m, 1),
			n: int(draft.n, 1),
			quorum_percent: int(draft.quorum, 0),
			veto: draft.veto.split(',').map((p) => p.trim()).filter(Boolean),
		}, () => `Policy saved for ${name}`);
		if (reply) await loadDepartments();
	}

	async function grantAuthority(deptName: string) {
		const quarter = authRemoteQuarter.trim();
		const local = authTarget.trim();
		if (!quarter && !local) {
			notify('Set a target department or a quarter canister id', 'error');
			return;
		}
		const operations = authPerms.split(',').map((p) => p.trim()).filter(Boolean);
		if (operations.length === 0) {
			notify('Name at least one permission to pass on', 'error');
			return;
		}
		const reply = await change('authority_grant', {
			department: deptName,
			target: quarter ? `Quarter:${quarter}` : `Department:${local}`,
			operations,
		}, (r) => (r.authority ? `Authority ${r.authority} granted` : 'Authority granted'));
		if (reply) {
			authTarget = '';
			authRemoteQuarter = '';
		}
	}

	async function revokeAuthority() {
		const id = revokeAuthorityId.trim();
		if (!id) return;
		const ok = await confirmModal({
			title: 'Revoke authority',
			body: `Revoke authority ${id}?`,
			confirmLabel: 'Revoke',
			danger: true,
		});
		if (!ok) return;
		if (await change('authority_revoke', { authority: id }, () => `Authority ${id} revoked`)) {
			revokeAuthorityId = '';
		}
	}

	async function deleteDepartment(name: string) {
		const ok = await confirmModal({
			title: 'Delete department',
			body: `Delete department "${name}"? This cannot be undone.`,
			confirmLabel: 'Delete',
			danger: true,
		});
		if (!ok) return;
		const reply = await change('department_delete', { department: name }, () => `Department "${name}" deleted`);
		if (reply) {
			if (!reply.proposal && selectedDeptName === name) selectedDeptName = '';
			await loadDepartments();
		}
	}

	async function loadDirectory() {
		const { rows } = await readAll('user_list', 'users');
		directory = rows
			.filter((u) => u?.id)
			.map((u) => {
				const principal = String(u.id);
				const nickname = String(u.nickname || '').trim();
				return { principal, nickname, label: nickname || principal };
			});
	}

	function isValidIcPrincipal(s: string): boolean {
		const lower = s.toLowerCase();
		return (
			/^[a-z2-7]{5}(-[a-z2-7]{5})+-[a-z2-7]{2,5}$/.test(lower) ||
			/^[a-z2-7]{5}-[a-z2-7]{2,5}$/.test(lower)
		);
	}

	function openMemberSuggestionsIfMatches() {
		const q = addMemberPrincipal.trim();
		if (q && memberSuggestions.length > 0) {
			showMemberSuggestions = true;
			memberSuggestionIndex = 0;
		} else {
			showMemberSuggestions = false;
			memberSuggestionIndex = 0;
		}
	}

	function selectMemberSuggestion(entry: any) {
		if (!entry) return;
		addMemberPrincipal = entry.principal || '';
		showMemberSuggestions = false;
		memberSuggestionIndex = 0;
	}

	function handleMemberPrincipalKeydown(e: KeyboardEvent) {
		if (e.key === 'Tab') {
			const q = addMemberPrincipal.trim();
			if (!q) return;

			e.preventDefault();

			if (!showMemberSuggestions || memberSuggestions.length === 0) {
				showMemberSuggestions = true;
				memberSuggestionIndex = 0;
				return;
			}

			const pick = memberSuggestions[memberSuggestionIndex];
			if (pick) selectMemberSuggestion(pick);
			return;
		}

		if (!showMemberSuggestions) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			memberSuggestionIndex = Math.min(memberSuggestionIndex + 1, memberSuggestions.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			memberSuggestionIndex = Math.max(memberSuggestionIndex - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const pick = memberSuggestions[memberSuggestionIndex];
			if (pick) selectMemberSuggestion(pick);
		} else if (e.key === 'Escape') {
			showMemberSuggestions = false;
			memberSuggestionIndex = 0;
		}
	}

	/** People belong to a department by holding one of its seats: adding someone appoints them to an open seat. */
	async function addMember(dept: any) {
		const principal = resolvedMemberPrincipal;
		const seat = openSeats(dept).find((p) => p.key === addMemberPosition) ?? openSeats(dept)[0];
		if (!principal || !seat || addingMember) return;
		addingMember = true;
		try {
			const reply = await change('appoint', { position: seat.key, user: principal }, () => `Member added as ${seat.title}`);
			if (reply) {
				addMemberPrincipal = '';
				await loadDepartments();
			}
		} finally {
			addingMember = false;
		}
	}

	async function copyMemberPrincipal(principal: string) {
		const markCopied = () => {
			copiedMemberPrincipal = principal;
			setTimeout(() => {
				if (copiedMemberPrincipal === principal) copiedMemberPrincipal = null;
			}, 1500);
		};
		if (typeof ctx.host?.dispatch === 'function') {
			try {
				ctx.host.dispatch({ type: 'clipboard.write', text: principal });
				markCopied();
				return;
			} catch {
				/* fall through to navigator */
			}
		}
		try {
			await navigator.clipboard.writeText(principal);
			markCopied();
		} catch {
			/* clipboard unavailable */
		}
	}

	async function removeMember(
		deptName: string,
		principal: string,
		member?: { nickname?: string; principal: string },
	) {
		const memberLabel = (member?.nickname || '').trim() || shortPrincipal(principal);
		const ok = await confirmModal({
			title: 'Remove member',
			body: `Remove ${memberLabel} from ${deptName}?`,
			confirmLabel: 'Remove',
			danger: true,
		});
		if (!ok) return;
		if (await change('department_expel', { department: deptName, user: principal }, () => 'Member removed')) {
			await loadDepartments();
		}
	}

	function positionProfiles(dept: any): string[] {
		return [...new Set<string>((dept.positions ?? []).map((p: any) => p.profile).filter(Boolean))].sort();
	}

	function selectTab(id: DeptTab) {
		activeTab = id;
	}

	async function runPayroll(deptName: string) {
		if (payrollBusy) return;
		payrollBusy = true;
		const period = payrollPeriod;
		try {
			await change('payroll_run', { department: deptName, period }, (r) => {
				const seats = Number(r.seats) || 0;
				return seats
					? `Payroll ${period}: ${seats} payment(s), ${formatAmount(Number(r.total) || 0)} in total`
					: `No salaried seats to pay for ${period}`;
			});
		} finally {
			payrollBusy = false;
		}
	}

	async function createFund(deptName: string) {
		const code = newFundCode.trim();
		if (!code || fundBusy) return;
		fundBusy = true;
		try {
			const reply = await change('fund_create', { fund: code, name: code, department: deptName }, () => `Fund "${code}" created`);
			if (reply) newFundCode = '';
		} finally {
			fundBusy = false;
		}
	}

	function formatAmount(n: number): string {
		return (n ?? 0).toLocaleString('en-US');
	}

	function shortPrincipal(p: string): string {
		if (!p || p.length < 12) return p;
		return p.slice(0, 5) + '...' + p.slice(-5);
	}

	function memberOptionLabel(m: { nickname?: string; principal: string }): string {
		const nickname = (m.nickname || '').trim();
		if (nickname) return `${nickname} (${shortPrincipal(m.principal)})`;
		return shortPrincipal(m.principal);
	}

	onMount(() => {
		void loadDepartments();
		void loadDirectory();
	});
</script>

{#snippet identityLabel(person: { nickname?: string; principal: string })}
	{#if (person.nickname || '').trim()}
		<span class="truncate inline-flex items-baseline gap-1.5 min-w-0">
			<span>{person.nickname}</span>
			<span class="text-gray-400 font-mono text-xs shrink-0">{shortPrincipal(person.principal)}</span>
		</span>
	{:else}
		<span class="truncate font-mono">{shortPrincipal(person.principal)}</span>
	{/if}
{/snippet}

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
		border: 1px solid #111827;
		background: #111827;
		color: #fff;
		cursor: pointer;
		flex-shrink: 0;
	}

	.chrome-btn.is-cancel {
		border-color: #d1d5db;
		background: #fff;
		color: #374151;
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
		color: #4b5563;
		cursor: pointer;
		flex-shrink: 0;
	}

	.chrome-tab.is-on {
		border-bottom-color: #111827;
		color: #111827;
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

<div class={cn('w-full min-h-full', narrow ? 'p-3' : 'p-4 sm:p-6 lg:p-8')}>
	<!-- Header: title on its own row -->
	<div class="flex flex-col gap-2 mb-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Departments</h1>
			<p class="text-sm text-gray-500 mt-1">{extensionDescription}</p>
		</div>
	</div>

	<div class="space-y-4">
		{#if departmentsBlockedMessage}
			<div class={cn('border border-amber-200 bg-amber-50 text-sm text-amber-900', narrow ? 'p-3' : 'p-4 rounded-xl')}>
				{departmentsBlockedMessage}
			</div>
		{/if}

		<div class={cn('flex gap-3', narrow ? 'flex-col' : 'flex-row items-end justify-between')}>
			{#if !departmentsBlockedMessage}
			<div class="flex-1 min-w-0">
				<label for="org-select" class="block text-xs font-medium text-gray-500 mb-1">
					Department
				</label>
				<select
					id="org-select"
					class="w-full max-w-xl px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 disabled:opacity-50"
					disabled={deptLoading || sortedDepartments.length === 0}
					bind:value={selectedDeptName}
					onchange={() => {
						if (selectedDeptName) selectDepartment(selectedDeptName);
					}}
				>
					{#if sortedDepartments.length === 0}
						<option value="">No departments</option>
					{:else}
						{#each sortedDepartments as dept (dept.name)}
							<option value={dept.name}>
								{dept.name}{dept.is_root ? ' (root)' : ''} — {dept.member_count} member{dept.member_count === 1 ? '' : 's'}
							</option>
						{/each}
					{/if}
				</select>
			</div>
			<button
				type="button"
				onclick={() => showNewDept = !showNewDept}
				class="chrome-btn {showNewDept ? 'is-cancel' : ''}"
				title={showNewDept ? 'Cancel' : 'New Department'}
				aria-label={showNewDept ? 'Cancel' : 'New Department'}
			>
				{#if showNewDept}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
				{/if}
				<span class="chrome-label">{showNewDept ? 'Cancel' : '+ New Department'}</span>
			</button>
			{/if}
		</div>

		{#if showNewDept}
			<div class={nestedBoxClass}>
				<input bind:value={newDeptName} placeholder="Department name" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
				<input bind:value={newDeptDesc} placeholder="Description (optional)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
				<input bind:value={newDeptFund} placeholder="Fund code (optional budget)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
				<div class="flex gap-2">
					<input bind:value={newThresholdM} placeholder="M" class="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
					<span class="self-center text-sm text-gray-500">of</span>
					<input bind:value={newThresholdN} placeholder="N" class="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
				</div>
				<p class="text-xs text-gray-500">The head is chosen later, among the people holding a seat in the department.</p>
				<button onclick={createDepartment} disabled={!newDeptName.trim()} class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50">
					Create
				</button>
			</div>
		{/if}

		{#if deptLoading}
			<div class="flex justify-center py-8">
				<svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			</div>
		{:else if departmentsBlockedMessage}
			<!-- Permission message shown above; skip empty-state placeholder -->
		{:else if departments.length === 0}
			<p class="text-center text-gray-500 py-8">No departments yet. Root is created on realm init.</p>
		{:else if selectedDept}
			{@const dept = selectedDept}
			<div class={cn('border border-gray-200 overflow-hidden', narrow ? '' : 'rounded-xl')}>
				<div class={cn('bg-white border-b border-gray-100 flex flex-wrap items-start justify-between gap-3', narrow ? 'px-3 py-3' : 'px-4 py-4 sm:px-6')}>
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2">
							<h2 class="text-lg font-semibold text-gray-900">{dept.name}</h2>
							{#if dept.is_root}
								<span class="text-xs font-semibold uppercase tracking-wide text-indigo-600">root</span>
							{/if}
						</div>
						{#if dept.description}
							<p class="text-sm text-gray-500 mt-1">{dept.description}</p>
						{/if}
					</div>
				</div>

				<!-- Tabs: icon-only on a narrow viewport -->
				<div class={cn('flex border-b border-gray-200 bg-white', narrow ? 'px-1' : 'px-4 sm:px-6')}>
					{#each deptTabs as tab (tab.id)}
						<button
							type="button"
							onclick={() => selectTab(tab.id)}
							class="chrome-tab {activeTab === tab.id ? 'is-on' : ''}"
							title={tab.label}
							aria-label={tab.label}
						>
							{#if tab.id === 'overview'}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
								</svg>
							{:else if tab.id === 'members'}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
							{:else if tab.id === 'permissions'}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
								</svg>
							{:else if tab.id === 'authority'}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							{/if}
							<span class="chrome-label">{tab.label}</span>
						</button>
					{/each}
				</div>

				{#if activeTab === 'overview'}
				<div class={cn('bg-gray-50 space-y-4', narrow ? 'px-3 py-3' : 'px-4 py-4 sm:px-6')}>
					{#if dept.head}
						<div class="text-sm">
							<span class="font-medium text-gray-700">Head:</span>
							{@render identityLabel(person(dept.head))}
						</div>
					{/if}

					{#if narrow}
						<div class="text-xs text-gray-500">
							Policy {dept.policy?.threshold_m ?? 1}/{dept.policy?.threshold_n ?? 1}
							{#if (dept.policy?.quorum_percent ?? 0) > 0}
								· Quorum {dept.policy?.quorum_percent}%
							{/if}
						</div>
					{:else}
						<div class="flex flex-wrap gap-1.5">
							<span class="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full font-medium">
								Policy {dept.policy?.threshold_m ?? 1}/{dept.policy?.threshold_n ?? 1}
							</span>
							{#if (dept.policy?.quorum_percent ?? 0) > 0}
								<span class="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-full font-medium">
									Quorum {dept.policy?.quorum_percent}%
								</span>
							{/if}
						</div>
					{/if}

					<!-- Policy -->
					{#if policyDraft[dept.name]}
						{@const pv = policyValidation(dept.name)}
						<div class="pt-2 border-t border-gray-200 space-y-2">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div class="flex items-center gap-2">
									<div class="text-sm font-medium text-gray-700">Policy</div>
									{#if policyDraftDirty(dept.name)}
										<span class="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 rounded-full font-medium">Unsaved changes</span>
									{/if}
								</div>
								{#if policyDraftDirty(dept.name)}
									<button
										type="button"
										onclick={() => resetPolicyDraft(dept.name)}
										class="px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
									>
										Reset
									</button>
								{/if}
							</div>
							<div class="grid grid-cols-3 gap-2">
								<label class="text-xs text-gray-500">M
									<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].m} />
									{#if pv.errors.m}
										<span class="block mt-0.5 text-[11px] text-red-600">{pv.errors.m}</span>
									{/if}
								</label>
								<label class="text-xs text-gray-500">N
									<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].n} />
									{#if pv.errors.n}
										<span class="block mt-0.5 text-[11px] text-red-600">{pv.errors.n}</span>
									{/if}
								</label>
								<label class="text-xs text-gray-500">Quorum %
									<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].quorum} />
									{#if pv.errors.quorum}
										<span class="block mt-0.5 text-[11px] text-red-600">{pv.errors.quorum}</span>
									{/if}
								</label>
							</div>
							<label class="block text-xs text-gray-500">Veto (seat holders, comma-separated)
								<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].veto} />
							</label>
							<button
								type="button"
								onclick={() => savePolicy(dept.name)}
								disabled={!policyDraftDirty(dept.name) || !pv.valid}
								class="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Save policy
							</button>
						</div>
					{/if}

					<!-- Positions -->
						<div class="pt-2 border-t border-gray-200">
							<div class="flex items-center justify-between mb-2">
								<div class="text-sm font-medium text-gray-700">Positions ({dept.positions?.length ?? 0})</div>
								<button
									onclick={() => { showNewPosition = showNewPosition === dept.name ? null : dept.name; }}
									class="px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
								>
									{showNewPosition === dept.name ? 'Cancel' : '+ Add position'}
								</button>
							</div>

							{#if showNewPosition === dept.name}
								<div class="mb-2 p-3 bg-white border border-gray-200 rounded-lg space-y-2">
									<div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
										<label class="text-xs text-gray-500">Title
											<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={newPosTitle} placeholder="e.g. inspector" />
										</label>
										<label class="text-xs text-gray-500">Profile (role)
											<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={newPosProfile} placeholder="existing profile (optional)" />
										</label>
										<label class="text-xs text-gray-500">Headcount
											<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={newPosHeadcount} />
										</label>
										<label class="text-xs text-gray-500">Salary / month
											<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={newPosSalary} />
										</label>
									</div>
									<div class="flex flex-wrap items-center gap-2">
										<button onclick={() => createPosition(dept.name)} class="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
											Create position
										</button>
										<span class="text-xs text-gray-400">
											Policy {dept.policy?.threshold_m ?? 1}/{dept.policy?.threshold_n ?? 1}
											{(dept.policy?.threshold_m ?? 1) > 1 || (dept.policy?.threshold_n ?? 1) > 1 || (dept.policy?.quorum_percent ?? 0) > 0
												? '— requires a vote'
												: '— applies immediately'}
										</span>
									</div>
								</div>
							{/if}

							{#if dept.positions?.length > 0}
								<div class={cn('grid gap-2', narrow ? 'grid-cols-1' : 'sm:grid-cols-2 xl:grid-cols-3')}>
									{#each dept.positions as pos (pos.key)}
										<div class={cn('px-3 py-2 bg-white border border-gray-200', narrow ? '' : 'rounded-lg')}>
											{#if editingPosition === pos.key}
												<div class="flex flex-wrap items-end gap-2">
													<label class="text-xs text-gray-500">Title
														<input class="mt-1 w-full min-w-[6rem] px-2 py-1 border border-gray-300 rounded text-sm" bind:value={posDraft.title} />
													</label>
													<label class="text-xs text-gray-500">Headcount
														<input class="mt-1 w-16 px-2 py-1 border border-gray-300 rounded text-sm" bind:value={posDraft.headcount} />
													</label>
													<label class="text-xs text-gray-500">Salary
														<input class="mt-1 w-20 px-2 py-1 border border-gray-300 rounded text-sm" bind:value={posDraft.salary} />
													</label>
													<button onclick={() => saveEditPosition(pos)} class="px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800">Save</button>
													<button onclick={() => { editingPosition = null; }} class="px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-100">Cancel</button>
												</div>
											{:else}
												<div class="flex items-start justify-between gap-2">
													<div class="min-w-0 text-sm">
														<span class="font-medium text-gray-800">{pos.title}</span>
														{#if pos.status === 'closed'}
															<span class="ml-2 text-xs text-red-500">closed</span>
														{:else if pos.status === 'frozen'}
															<span class="ml-2 text-xs text-amber-600">frozen</span>
														{/if}
														<div class="text-xs text-gray-400 mt-0.5">
															{#if pos.profile}profile: {pos.profile}{:else}no profile{/if}
															{#if pos.salary_amount > 0}
																· {pos.salary_amount}/{pos.salary_period}
															{/if}
														</div>
													</div>
													<div class="flex flex-col items-end gap-1 shrink-0">
														<span class={`text-xs font-medium ${pos.filled >= pos.headcount ? 'text-green-600' : 'text-amber-600'}`}>
															{pos.filled}/{pos.headcount} filled
														</span>
														{#if pos.status !== 'closed'}
														<div class="flex gap-1">
															{#if pos.status === 'open' && pos.filled < pos.headcount}
																<button onclick={() => startAssignPosition(pos)} class="px-1.5 py-0.5 text-xs border border-indigo-300 text-indigo-700 rounded hover:bg-indigo-50">Assign</button>
															{/if}
															<button onclick={() => startEditPosition(pos)} class="px-1.5 py-0.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100">Edit</button>
															<button
																onclick={() => togglePositionStatus(pos)}
																class="px-1.5 py-0.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100"
																title={pos.status === 'frozen' ? 'Reopen this seat' : 'Close this seat for good (it must be empty)'}
															>
																{pos.status === 'frozen' ? 'Reopen' : 'Close'}
															</button>
														</div>
														{/if}
													</div>
												</div>
												{#if pos.holders?.length > 0}
													<div class="mt-2 flex flex-wrap gap-1">
														{#each pos.holders as h (h.id || h.principal)}
															<span class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded-full text-gray-600" title={h.principal}>
																{@render identityLabel(person(h.principal))}
																{#if h.kind === 'acting'}
																	<span class="text-[10px] text-gray-400">acting</span>
																{/if}
																<button onclick={() => endAppointment(h)} class="text-gray-400 hover:text-red-600" title="End appointment">&times;</button>
															</span>
														{/each}
													</div>
												{/if}
												{#if assigningPosition === pos.key}
													{@const eligible = eligibleAppointees(pos)}
													<div class="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg space-y-2">
														{#if eligible.length === 0}
															<p class="text-xs text-gray-500">No other registered people to appoint.</p>
														{:else}
															<div class="flex flex-wrap items-end gap-2">
																<label class="text-xs text-gray-600 flex-1 min-w-[10rem]">
																	Member
																	<select bind:value={assignPrincipal} class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
																		<option value="">Select member…</option>
																		{#each eligible as m (m.principal)}
																			<option value={m.principal}>{memberOptionLabel(m)}</option>
																		{/each}
																	</select>
																</label>
																<button
																	onclick={() => appointMember(pos, assignPrincipal)}
																	disabled={!assignPrincipal}
																	class="px-2 py-1.5 text-xs bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 disabled:opacity-50"
																>
																	Assign
																</button>
																<button
																	onclick={() => { assigningPosition = null; assignPrincipal = ''; }}
																	class="px-2 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
																>
																	Cancel
																</button>
															</div>
														{/if}
													</div>
												{/if}
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-xs text-gray-400">No positions defined for this department.</p>
							{/if}
						</div>
				</div>
				{:else if activeTab === 'members'}
				<div class={cn('bg-gray-50 space-y-4', narrow ? 'px-3 py-3' : 'px-4 py-4 sm:px-6')}>
					{#if (dept.policy?.threshold_m ?? 1) > 1 || (dept.policy?.threshold_n ?? 1) > 1 || (dept.policy?.quorum_percent ?? 0) > 0}
						<p class="text-xs text-gray-500">
							Policy {dept.policy?.threshold_m ?? 1}/{dept.policy?.threshold_n ?? 1}
							{(dept.policy?.quorum_percent ?? 0) > 0 ? ` · quorum ${dept.policy?.quorum_percent}%` : ''}
							— add/remove requires a vote
						</p>
					{/if}
					{#if dept.members.length === 0}
						<p class="text-sm text-gray-400">No members</p>
					{:else}
						<div class="flex flex-col gap-1">
							{#each dept.members as m (m)}
								<div class={cn('flex items-center justify-between text-sm bg-white px-3 py-1.5 border border-gray-200', narrow ? '' : 'rounded-lg')}>
									<div class="min-w-0 flex-1">{@render identityLabel(person(m))}</div>
									<div class="flex items-center gap-0.5 shrink-0 ml-2">
										<button
											type="button"
											onclick={() => copyMemberPrincipal(m)}
											class="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
											aria-label="Copy principal"
											title="Copy principal"
										>
											{#if copiedMemberPrincipal === m}
												<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
													<path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
												</svg>
											{:else}
												<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
													<rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" />
													<path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
												</svg>
											{/if}
										</button>
										<button
											type="button"
											onclick={() => removeMember(dept.name, m, person(m))}
											class="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
											aria-label="Remove member"
											title="Remove member"
										>
											<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
												<path d="M3 4.5h10M6 4.5V3.5A1 1 0 0 1 7 2.5h2a1 1 0 0 1 1 1v1M5.5 4.5v8.5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
												<path d="M6.5 7.5v4M9.5 7.5v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
											</svg>
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					{#if openSeats(dept).length === 0}
						<p class="text-xs text-gray-500">
							People join a department by holding one of its seats. Open a position with a free seat in the Overview tab to add someone.
						</p>
					{:else}
					{@const seats = openSeats(dept)}
					<div class={cn('flex gap-2 max-w-2xl', narrow ? 'flex-col' : '')}>
						<div class="relative flex-1">
							<input
								bind:value={addMemberPrincipal}
								onkeydown={handleMemberPrincipalKeydown}
								oninput={openMemberSuggestionsIfMatches}
								onblur={() => setTimeout(() => (showMemberSuggestions = false), 200)}
								autocomplete="off"
								placeholder="Name or principal"
								aria-describedby="am-member-hint"
								class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
							/>
							{#if showMemberSuggestions && memberSuggestions.length > 0}
								<ul class="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1">
									{#each memberSuggestions as s, i (s.principal)}
										<li>
											<button
												type="button"
												onmousedown={() => selectMemberSuggestion(s)}
												class="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors {i === memberSuggestionIndex ? 'bg-indigo-50' : ''}"
											>
												<span class="block font-medium text-gray-900 truncate">{s.label}</span>
												{#if s.principal && s.principal !== s.label}
													<span class="block font-mono text-xs text-gray-500 truncate">{s.principal}</span>
												{/if}
											</button>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
						<select
							aria-label="Seat"
							value={seats.some((p) => p.key === addMemberPosition) ? addMemberPosition : seats[0].key}
							onchange={(e) => (addMemberPosition = e.currentTarget.value)}
							class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
						>
							{#each seats as seat (seat.key)}
								<option value={seat.key}>{seat.title} ({seat.filled}/{seat.headcount})</option>
							{/each}
						</select>
						<button
							type="button"
							onclick={() => addMember(dept)}
							disabled={!resolvedMemberPrincipal || addingMember}
							class="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{addingMember ? 'Adding…' : 'Add'}
						</button>
					</div>
					{#if memberPrincipalUnresolved}
						<p class="text-xs text-amber-700">
							Not a known member or valid principal — pick someone from the list or paste a full principal.
						</p>
					{/if}
					<p id="am-member-hint" class="text-xs text-gray-500">
						Type a name or principal to see matches, then pick the seat they take. Use arrow keys and Enter to pick; Tab also selects the highlighted match.
					</p>
					{/if}

					{#if !dept.is_root}
						<button
							type="button"
							onclick={() => deleteDepartment(dept.name)}
							class="px-3 py-1.5 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
						>
							Delete department
						</button>
					{/if}
				</div>
				{:else if activeTab === 'permissions'}
				{@const profiles = positionProfiles(dept)}
				<div class={cn('bg-gray-50 space-y-4', narrow ? 'px-3 py-3' : 'px-4 py-4 sm:px-6')}>
					<div class="text-sm font-medium text-gray-700">Profiles held through positions ({profiles.length})</div>
					{#if profiles.length > 0}
						<div class="flex flex-wrap gap-1">
							{#each profiles as profile (profile)}
								<span class="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full font-medium">{profile}</span>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-gray-400">None of this department's positions carries a profile yet.</p>
					{/if}
					<p class="text-xs text-gray-500">
						What a department may do comes from the profiles of its positions and from authority granted to it.
						Granting permissions to a department directly is not available here.
					</p>
				</div>
				{:else if activeTab === 'authority'}
				<div class={cn('bg-gray-50 space-y-4', narrow ? 'px-3 py-3' : 'px-4 py-4 sm:px-6')}>
					<div>
						<h3 class="text-sm font-semibold text-gray-800">Authority (department over department)</h3>
						<p class="text-sm text-gray-500 mt-1">Let {dept.name} pass on permissions over another department, or over a remote quarter.</p>
					</div>
					<div class={boxClass}>
						<input bind:value={authTarget} placeholder="Target department" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
						<input bind:value={authRemoteQuarter} placeholder="Or a remote quarter canister id" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
						<input bind:value={authPerms} placeholder="Permissions (comma-separated)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
						<button
							onclick={() => grantAuthority(dept.name)}
							disabled={!authTarget.trim() && !authRemoteQuarter.trim()}
							class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
						>
							Grant from {dept.name}
						</button>
					</div>
					<p class="text-xs text-gray-500">Existing grants are not listed here. To withdraw one, enter the authority id you received when it was granted.</p>
					<div class={cn('flex gap-2 max-w-xl', narrow ? 'flex-col' : '')}>
						<input bind:value={revokeAuthorityId} placeholder="Authority id" class="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
						<button
							type="button"
							onclick={revokeAuthority}
							disabled={!revokeAuthorityId.trim()}
							class="px-3 py-1.5 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
						>
							Revoke
						</button>
					</div>
				</div>
				{:else if activeTab === 'fund'}
				<div class={cn('bg-gray-50 space-y-4', narrow ? 'px-3 py-3' : 'px-4 py-4 sm:px-6')}>
					<div class={boxClass}>
						<div class="text-sm font-medium text-gray-700">Budget fund</div>
						<p class="text-xs text-gray-500">
							A department owns at most one fund. Create it here; balances and ledger entries are kept in the realm's treasury.
						</p>
						<div class={cn('flex gap-2 max-w-xl', narrow ? 'flex-col' : '')}>
							<input bind:value={newFundCode} placeholder="Fund code" class="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
							<button
								type="button"
								onclick={() => createFund(dept.name)}
								disabled={!newFundCode.trim() || fundBusy}
								class="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
							>
								{fundBusy ? 'Creating…' : 'Create fund'}
							</button>
						</div>
					</div>
					<div class={boxClass}>
						<div class="flex flex-wrap items-center justify-between gap-2">
							<div class="text-sm text-gray-600">
								<span class="font-medium text-gray-700">Payroll — {payrollPeriod}</span>
								<p class="text-xs text-gray-500 mt-0.5">Pays every salaried, non-agent seat holder from the department's fund, once per month.</p>
							</div>
							<button
								type="button"
								onclick={() => runPayroll(dept.name)}
								disabled={payrollBusy}
								class="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
							>
								{payrollBusy ? 'Running…' : 'Run payroll'}
							</button>
						</div>
						{#if (dept.policy?.threshold_m ?? 1) > 1 || (dept.policy?.threshold_n ?? 1) > 1 || (dept.policy?.quorum_percent ?? 0) > 0}
							<p class="text-xs text-gray-500">
								Policy {dept.policy?.threshold_m ?? 1}/{dept.policy?.threshold_n ?? 1} — running payroll requires a vote.
							</p>
						{/if}
					</div>
				</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
