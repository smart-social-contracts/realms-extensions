<script lang="ts">
	import { onDestroy } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	let { ctx }: { ctx: any } = $props();

	const cn = $derived(ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' ')));

	let loading = $state(false);

	// Departments
	let departments: any[] = $state([]);
	let users: { principal: string; nickname: string }[] = $state([]);
	let deptLoading = $state(false);
	let departmentsBlockedMessage: string | null = $state(null);
	let authoritiesBlockedMessage: string | null = $state(null);
	let deptPermissionsBlocked: string | null = $state(null);
	let showNewDept = $state(false);
	let newDeptName = $state('');
	let newDeptDesc = $state('');
	let newDeptFund = $state('');
	let newThresholdM = $state('1');
	let newThresholdN = $state('1');
	let selectedDeptName = $state('');
	let copiedMemberPrincipal: string | null = $state(null);
	let deptPermissions: Record<string, string[]> = $state({});
	let policyDraft: Record<string, { m: string; n: string; quorum: string; veto: string; fund: string }> = $state({});
	let authorities: any[] = $state([]);
	let authTarget = $state('');
	let authPerms = $state('org.appoint,org.expel,org.set_policy');
	let authRemoteCanister = $state('');

	const rootDept = $derived(departments.find((d) => d.is_root)?.name ?? '');

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
	let authFilter = $state('');
	let expandedAuthRows: Set<string> = $state(new Set());
	let fundLoading = $state(false);
	let fundData: any = $state.raw(null);
	let payrollData: any = $state.raw(null);
	let payrollBusy = $state(false);

	function selectDepartment(name: string) {
		selectedDeptName = name;
		showNewPosition = null;
		editingPosition = null;
		assigningPosition = null;
		assignPrincipal = '';
		fundData = null;
		payrollData = null;
		if (activeTab === 'fund') void loadFund(name);
	}

	function notify(message: string, type: 'success' | 'error' = 'success') {
		const friendly = message.includes('Invalid delegation expiry') ||
			message.includes('delegation has expired') ||
			message.includes('Specified sender delegation has expired')
			? 'Your session expired. Please refresh the page to continue.'
			: message;
		if (typeof ctx.notify === 'function') {
			ctx.notify(type === 'error' ? 'error' : 'success', friendly);
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

	async function pages(name: string, key: string, args: Record<string, unknown> = {}) {
		const rows: any[] = [];
		for (let from: number | null = 1; from; ) {
			const page = await ctx.read(name, { ...args, from, count: 500 });
			if (!page.ok) throw new Error(page.error);
			rows.push(...page[key]);
			from = page.next;
		}
		return rows;
	}

	function exportRows(entity: string) {
		return pages('realm_export', 'rows', { entity });
	}

	/** Runs a governed operation; a department whose policy needs approvals turns it into a proposal. */
	async function apply(name: string, args: Record<string, unknown>, done: string): Promise<boolean> {
		const res = await ctx.run(name, args);
		if (!res.ok) {
			notify(res.error, 'error');
			return false;
		}
		notify(res.requires_vote ? `Proposal ${res.proposal} created — it needs a vote (see Voting)` : done);
		return true;
	}

	function person(principal: string) {
		return { principal, nickname: users.find((u) => u.principal === principal)?.nickname ?? '' };
	}

	function toDept(d: any, detail: any, fund: string, extensions: any[]) {
		const policy = detail.department.policy ?? {};
		const positions = detail.positions.map((p: any) => ({
			key: p.id,
			title: p.title || p.id,
			profile: p.profile,
			headcount: p.headcount,
			salary_amount: p.salary,
			salary_period: p.salary_period,
			status: p.status,
			filled: p.filled,
			holders: p.holders.map((h: any) => ({ ...person(h.user), appointment: h.id, kind: h.kind })),
		}));
		const seated = [...new Set(positions.flatMap((p: any) => p.holders.map((h: any) => h.principal)))] as string[];
		const members = seated.map(person);
		return {
			name: d.id,
			description: d.description,
			is_root: d.is_root,
			head: d.head ? person(d.head) : null,
			policy: {
				threshold_m: policy.m ?? 1,
				threshold_n: policy.n ?? 1,
				quorum_percent: policy.quorum_percent ?? 0,
				veto_principals: policy.veto ?? [],
			},
			fund: fund ? { code: fund } : null,
			extensions: extensions.filter((e) => e.access.departments.includes(d.id)).map((e) => e.id),
			members,
			member_count: members.length,
			positions,
		};
	}

	// --- Departments ---
	async function loadDepartments() {
		deptLoading = true;
		departmentsBlockedMessage = null;
		authoritiesBlockedMessage = null;
		try {
			const [list, userRows, extensions] = await Promise.all([
				pages('department_list', 'departments'),
				pages('user_list', 'users'),
				pages('extension_list', 'extensions'),
			]);
			users = userRows.map((u) => ({ principal: u.id, nickname: u.nickname }));
			const [details, deptRows] = await Promise.all([
				Promise.all(
					list.map(async (d) => {
						const detail = await ctx.read('department_get', { department: d.id });
						if (!detail.ok) throw new Error(detail.error);
						return detail;
					}),
				),
				exportRows('Department').catch(() => []),
			]);
			const fundOf = new Map<string, string>(deptRows.map((r) => [r.id, r.fund ?? '']));
			departments = list.map((d, i) => toDept(d, details[i], fundOf.get(d.id) ?? '', extensions));
			for (const d of departments) {
				policyDraft[d.name] = serverPolicyValues(d);
			}
			policyDraft = { ...policyDraft };

			try {
				authorities = (await exportRows('Authority')).map((a) => {
					const [kind, key] = a.target.split(/:(.*)/);
					return {
						id: a.id,
						grantor: a.grantor,
						target: kind === 'Department' ? key : '',
						target_quarter_canister_id: kind === 'Quarter' ? key : '',
						permissions: a.operations,
					};
				});
			} catch (e: any) {
				authorities = [];
				authoritiesBlockedMessage = e?.message ?? String(e);
			}
			try {
				const perms = await exportRows('Permission');
				deptPermissions = Object.fromEntries(
					departments.map((d) => [d.name, perms.filter((p) => (p.departments ?? []).includes(d.name)).map((p) => p.id)]),
				);
				deptPermissionsBlocked = null;
			} catch (e: any) {
				deptPermissionsBlocked = e?.message ?? String(e);
			}

			// Keep selection when reloading; otherwise pick the first department.
			if (departments.length === 0) {
				selectedDeptName = '';
			} else if (!selectedDeptName || !departments.some((d) => d.name === selectedDeptName)) {
				const first = sortedDepartments[0];
				if (first) selectDepartment(first.name);
			}
		} catch (e: any) {
			departments = [];
			selectedDeptName = '';
			authorities = [];
			departmentsBlockedMessage = e?.message || 'Failed to load departments';
		} finally {
			deptLoading = false;
		}
	}

	async function createDepartment() {
		const name = newDeptName.trim();
		if (!name) return;
		try {
			if (!(await apply('department_create', { department: name, description: newDeptDesc.trim() }, `Department "${name}" created`))) {
				return;
			}
			const m = parseInt(newThresholdM || '1', 10);
			const n = parseInt(newThresholdN || '1', 10);
			if (m !== 1 || n !== 1) {
				await apply('department_set_policy', { department: name, m, n }, `Policy set for ${name}`);
			}
			if (newDeptFund.trim()) {
				await apply('fund_create', { fund: newDeptFund.trim(), department: name }, `Fund ${newDeptFund.trim()} created`);
			}
			newDeptName = ''; newDeptDesc = ''; newDeptFund = '';
			newThresholdM = '1'; newThresholdN = '1';
			showNewDept = false;
			await loadDepartments();
			if (departments.some((d) => d.name === name)) selectDepartment(name);
		} catch (e: any) {
			notify(e?.message || 'Error', 'error');
		}
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
		return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
	}

	async function createPosition(deptName: string) {
		if (!newPosTitle.trim()) return;
		const title = newPosTitle.trim();
		const args: Record<string, unknown> = {
			department: deptName,
			position: `${slug(deptName)}.${slug(title)}`,
			title,
			headcount: parseInt(newPosHeadcount || '1', 10),
			salary: parseInt(newPosSalary || '0', 10),
		};
		if (newPosProfile.trim()) args.profile = newPosProfile.trim();
		try {
			if (await apply('position_create', args, `Position "${title}" created`)) {
				showNewPosition = null;
				newPosTitle = ''; newPosProfile = ''; newPosHeadcount = '1'; newPosSalary = '0';
				await loadDepartments();
			}
		} catch (e: any) {
			notify(e?.message || 'Error', 'error');
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
		try {
			const done = await apply('position_edit', {
				position: pos.key,
				title: posDraft.title.trim(),
				headcount: parseInt(posDraft.headcount || '1', 10),
				salary: parseInt(posDraft.salary || '0', 10),
			}, `Position "${pos.title}" updated`);
			if (done) {
				editingPosition = null;
				await loadDepartments();
			}
		} catch (e: any) {
			notify(e?.message || 'Error', 'error');
		}
	}

	async function closePosition(pos: any) {
		try {
			if (await apply('position_close', { position: pos.key }, `Position "${pos.title}" closed`)) {
				await loadDepartments();
			}
		} catch (e: any) {
			notify(e?.message || 'Error', 'error');
		}
	}

	async function endAppointment(pos: any, principal: string) {
		const holder = pos.holders.find((h: any) => h.principal === principal);
		try {
			if (await apply('appointment_end', { appointment: holder.appointment }, 'Appointment ended')) {
				await loadDepartments();
			}
		} catch (e: any) {
			notify(e?.message || 'Error', 'error');
		}
	}

	async function appointMember(pos: any, principal: string) {
		if (!principal.trim()) return;
		try {
			if (await apply('appoint', { position: pos.key, user: principal.trim() }, `Appointed to "${pos.title}"`)) {
				assigningPosition = null;
				assignPrincipal = '';
				await loadDepartments();
			}
		} catch (e: any) {
			notify(e?.message || 'Error', 'error');
		}
	}

	function eligibleAppointees(pos: any, members: any[]) {
		const holders = new Set((pos.holders ?? []).map((h: any) => h.principal));
		return members.filter((m) => m.principal && !holders.has(m.principal));
	}

	function startAssignPosition(pos: any) {
		assigningPosition = pos.key;
		editingPosition = null;
		const eligible = eligibleAppointees(pos, users);
		assignPrincipal = eligible[0]?.principal ?? '';
	}

	type PolicyDraft = { m: string; n: string; quorum: string; veto: string; fund: string };

	function serverPolicyValues(dept: any): PolicyDraft {
		return {
			m: String(dept.policy?.threshold_m ?? 1),
			n: String(dept.policy?.threshold_n ?? 1),
			quorum: String(dept.policy?.quorum_percent ?? 0),
			veto: (dept.policy?.veto_principals ?? []).join(', '),
			fund: dept.fund?.code ?? '',
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
			draft.veto !== server.veto ||
			draft.fund !== server.fund
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
		const dept = departments.find((d) => d.name === name);
		const draft = policyDraft[name];
		if (!dept || !draft) return;
		if (!policyValidation(name).valid) return;
		const fund = draft.fund.trim();
		if (dept.fund && fund !== dept.fund.code) {
			notify('Moving a department to another fund is not supported by this realm version', 'error');
			return;
		}
		const server = serverPolicyValues(dept);
		try {
			if (draft.m !== server.m || draft.n !== server.n || draft.quorum !== server.quorum || draft.veto !== server.veto) {
				const policySaved = await apply('department_set_policy', {
					department: name,
					m: parseInt(draft.m || '1', 10),
					n: parseInt(draft.n || '1', 10),
					quorum_percent: parseInt(draft.quorum || '0', 10),
					veto: draft.veto.split(',').map((p) => p.trim()).filter(Boolean),
				}, `Policy saved for ${name}`);
				if (!policySaved) return;
			}
			if (fund && !dept.fund) {
				await apply('fund_create', { fund, department: name }, `Fund ${fund} created for ${name}`);
			}
			await loadDepartments();
		} catch (e: any) {
			notify(e?.message || 'Error', 'error');
		}
	}

	async function grantAuthorityFromRoot() {
		if (!authTarget.trim() && !authRemoteCanister.trim()) {
			notify('Set a local target department or a remote quarter', 'error');
			return;
		}
		try {
			const done = await apply('authority_grant', {
				department: rootDept,
				target: authRemoteCanister.trim() ? `Quarter:${authRemoteCanister.trim()}` : `Department:${authTarget.trim()}`,
				operations: authPerms.split(',').map((p) => p.trim()).filter(Boolean),
			}, 'Authority granted');
			if (done) {
				authTarget = ''; authRemoteCanister = '';
				await loadDepartments();
			}
		} catch (e: any) {
			notify(e?.message || 'Error', 'error');
		}
	}

	async function revokeAuthority(id: string) {
		const auth = authorities.find((a) => a.id === id);
		if (!auth) return;
		const permCount = (auth.permissions ?? []).length;
		const ok = await confirmModal({
			title: 'Revoke authority',
			body: `Revoke authority from ${auth.grantor} → ${authTargetLabel(auth)} (${permCount} permission${permCount === 1 ? '' : 's'})?`,
			confirmLabel: 'Revoke',
			danger: true,
		});
		if (!ok) return;
		try {
			if (await apply('authority_revoke', { authority: id }, 'Authority revoked')) {
				await loadDepartments();
			}
		} catch (e: any) {
			notify(e?.message || 'Error', 'error');
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
		try {
			if (await apply('department_delete', { department: name }, `Department "${name}" deleted`)) {
				if (selectedDeptName === name) selectedDeptName = '';
				await loadDepartments();
			}
		} catch (e: any) {
			notify(e?.message || 'Error', 'error');
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
			body: `Remove ${memberLabel} from ${deptName}? This ends every seat they hold there.`,
			confirmLabel: 'Remove',
			danger: true,
		});
		if (!ok) return;
		try {
			if (await apply('department_expel', { department: deptName, user: principal }, 'Member removed')) {
				await loadDepartments();
			}
		} catch (e: any) {
			notify(e?.message || 'Error', 'error');
		}
	}

	function authTargetLabel(auth: any): string {
		return auth.target || `quarter ${shortPrincipal(auth.target_quarter_canister_id)}`;
	}

	function authorityMatchesFilter(auth: any, filter: string): boolean {
		const q = filter.trim().toLowerCase();
		if (!q) return true;
		const from = (auth.grantor || '').toLowerCase();
		const to = (auth.target || '').toLowerCase();
		const remote = (auth.target_quarter_canister_id || '').toLowerCase();
		const perms = (auth.permissions || []).join(' ').toLowerCase();
		return from.includes(q) || to.includes(q) || remote.includes(q) || perms.includes(q);
	}

	function toggleAuthRowExpanded(id: string) {
		if (expandedAuthRows.has(id)) {
			expandedAuthRows = new Set([...expandedAuthRows].filter((rowId) => rowId !== id));
		} else {
			expandedAuthRows = new Set([...expandedAuthRows, id]);
		}
	}

	// --- Fund & payroll (issue #260) ---
	const LEDGER_SHOWN = 100;

	function payrollPeriod(): string {
		return new Date().toISOString().slice(0, 7);
	}

	async function loadFund(deptName: string) {
		const dept = departments.find((d) => d.name === deptName);
		fundLoading = true;
		try {
			if (!dept?.fund) {
				fundData = null;
				payrollData = null;
				return;
			}
			const code = dept.fund.code;
			const period = payrollPeriod();
			const [funds, entries, transfers] = await Promise.all([
				exportRows('Fund'),
				pages('ledger_view', 'entries', { fund: code }),
				exportRows('Transfer'),
			]);
			const fund = funds.find((f) => f.id === code);
			const cash = entries.filter((e) => e.kind === 'asset');
			const inflows = cash.reduce((sum, e) => sum + e.debit, 0);
			const outflows = cash.reduce((sum, e) => sum + e.credit, 0);
			const byCategory = (kind: string, side: 'debit' | 'credit') =>
				entries
					.filter((e) => e.kind === kind)
					.reduce((acc: Record<string, number>, e) => ({ ...acc, [e.category]: (acc[e.category] ?? 0) + e[side] }), {});
			fundData = {
				fund: { code, name: fund?.name ?? code, fund_type: fund?.kind ?? '' },
				totals: { inflows, outflows, cash_balance: inflows - outflows },
				inflows_by_category: byCategory('revenue', 'credit'),
				outflows_by_category: byCategory('expense', 'debit'),
				entries: entries.slice(-LEDGER_SHOWN).reverse().map((e) => ({
					id: e.id,
					entry_date: new Date(e.at * 1000).toISOString(),
					entry_type: e.kind,
					category: e.category,
					description: e.description,
					debit: e.debit,
					credit: e.credit,
				})),
				entries_total: entries.length,
				truncated: entries.length > LEDGER_SHOWN,
			};

			const paid = transfers.filter((t) => t.payroll === `payroll ${period} ${deptName}`);
			const payments = dept.positions
				.filter((p: any) => p.salary_amount > 0)
				.flatMap((p: any) =>
					p.holders.map((h: any) => {
						const t = paid.find((x) => x.to === h.principal);
						return {
							position: p.title,
							principal: h.principal,
							amount: p.salary_amount,
							status: t ? (t.status === 'sending' ? 'pending' : t.status) : 'not_started',
						};
					}),
				);
			const counts: Record<string, number> = {};
			for (const p of payments) counts[p.status] = (counts[p.status] ?? 0) + 1;
			payrollData = {
				period,
				total_seats: payments.length,
				total_amount: payments.reduce((sum: number, p: any) => sum + p.amount, 0),
				settled_amount: payments
					.filter((p: any) => p.status === 'completed')
					.reduce((sum: number, p: any) => sum + p.amount, 0),
				currency: paid[0]?.symbol ?? '',
				counts,
				payments,
			};
		} catch (e: any) {
			notify(e?.message || 'Failed to load fund data', 'error');
		} finally {
			fundLoading = false;
		}
	}

	function openFundTab() {
		activeTab = 'fund';
		if (selectedDeptName) void loadFund(selectedDeptName);
	}

	function selectTab(id: DeptTab) {
		if (id === 'fund') openFundTab();
		else activeTab = id;
	}

	async function runPayroll(deptName: string) {
		payrollBusy = true;
		try {
			const period = payrollPeriod();
			if (await apply('payroll_run', { department: deptName, period }, `Payroll for ${period} sent`)) {
				await loadFund(deptName);
			}
		} catch (e: any) {
			notify(e?.message || 'Error', 'error');
		} finally {
			payrollBusy = false;
		}
	}

	function formatAmount(n: number): string {
		return (n ?? 0).toLocaleString('en-US');
	}

	const payrollStatusStyles: Record<string, string> = {
		completed: 'bg-green-50 text-green-700',
		pending: 'bg-amber-50 text-amber-700',
		failed: 'bg-red-50 text-red-700',
		not_started: 'bg-gray-100 text-gray-600',
	};

	function shortPrincipal(p: string): string {
		if (!p || p.length < 12) return p;
		return p.slice(0, 5) + '...' + p.slice(-5);
	}

	function memberOptionLabel(m: { nickname?: string; principal: string }): string {
		const nickname = (m.nickname || '').trim();
		if (nickname) return `${nickname} (${shortPrincipal(m.principal)})`;
		return shortPrincipal(m.principal);
	}

	$effect(() => {
		loadDepartments();
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
							{@render identityLabel(dept.head)}
						</div>
					{/if}
					{#if dept.extensions?.length > 0}
						<div class="text-sm"><span class="font-medium text-gray-700">Extensions:</span> {dept.extensions.join(', ')}</div>
					{/if}

					{#if narrow}
						<div class="text-xs text-gray-500">
							Policy {dept.policy?.threshold_m ?? 1}/{dept.policy?.threshold_n ?? 1}
							{#if (dept.policy?.quorum_percent ?? 0) > 0}
								· Quorum {dept.policy?.quorum_percent}%
							{/if}
							{#if dept.fund}
								· Fund {dept.fund.code}
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
							{#if dept.fund}
								<span class="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 rounded-full font-medium">
									Fund {dept.fund.code}
								</span>
							{/if}
						</div>
					{/if}

					<!-- Policy + budget -->
					{#if policyDraft[dept.name]}
						{@const pv = policyValidation(dept.name)}
						<div class="pt-2 border-t border-gray-200 space-y-2">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div class="flex items-center gap-2">
									<div class="text-sm font-medium text-gray-700">Policy & budget</div>
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
							<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
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
								<label class="text-xs text-gray-500 sm:col-span-2 lg:col-span-2">Fund code
									<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].fund} />
								</label>
							</div>
							<label class="block text-xs text-gray-500">Veto principals (comma-separated)
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
					{#if !dept.is_root}
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
											<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={newPosProfile} placeholder="optional" />
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
														{/if}
														<div class="text-xs text-gray-400 mt-0.5">
															profile: {pos.profile}
															{#if pos.salary_amount > 0}
																· {pos.salary_amount}/{pos.salary_period}
															{/if}
														</div>
													</div>
													<div class="flex flex-col items-end gap-1 shrink-0">
														<span class={`text-xs font-medium ${pos.filled >= pos.headcount ? 'text-green-600' : 'text-amber-600'}`}>
															{pos.filled}/{pos.headcount} filled
														</span>
														<div class="flex gap-1">
															{#if pos.status !== 'closed' && pos.filled < pos.headcount}
																<button onclick={() => startAssignPosition(pos)} class="px-1.5 py-0.5 text-xs border border-indigo-300 text-indigo-700 rounded hover:bg-indigo-50">Assign</button>
															{/if}
															<button onclick={() => startEditPosition(pos)} class="px-1.5 py-0.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100">Edit</button>
															{#if pos.status !== 'closed'}
																<button onclick={() => closePosition(pos)} class="px-1.5 py-0.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100">
																	Close
																</button>
															{/if}
														</div>
													</div>
												</div>
												{#if pos.holders?.length > 0}
													<div class="mt-2 flex flex-wrap gap-1">
														{#each pos.holders as h (h.principal)}
															<span class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded-full text-gray-600" title={h.principal}>
																{@render identityLabel(h)}
																{#if h.kind === 'acting'}
																	<span class="text-[10px] text-gray-400">acting</span>
																{/if}
																<button onclick={() => endAppointment(pos, h.principal)} class="text-gray-400 hover:text-red-600" title="End appointment">&times;</button>
															</span>
														{/each}
													</div>
												{/if}
												{#if assigningPosition === pos.key}
													{@const eligible = eligibleAppointees(pos, users)}
													<div class="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg space-y-2">
														{#if eligible.length === 0}
															<p class="text-xs text-gray-500">Everyone in the realm already holds this position.</p>
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
					{/if}
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
							{#each dept.members as m (m.principal)}
								<div class={cn('flex items-center justify-between text-sm bg-white px-3 py-1.5 border border-gray-200', narrow ? '' : 'rounded-lg')}>
									<div class="min-w-0 flex-1">{@render identityLabel(m)}</div>
									<div class="flex items-center gap-0.5 shrink-0 ml-2">
										<button
											type="button"
											onclick={() => copyMemberPrincipal(m.principal)}
											class="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
											aria-label="Copy principal"
											title="Copy principal"
										>
											{#if copiedMemberPrincipal === m.principal}
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
											onclick={() => removeMember(dept.name, m.principal, m)}
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

					<p class="text-xs text-gray-500">
						Members are the people holding a position here: appoint someone from the Overview tab.
						Adding a member without a position is not supported by this realm version.
					</p>

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
				<div class={cn('bg-gray-50 space-y-4', narrow ? 'px-3 py-3' : 'px-4 py-4 sm:px-6')}>
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div class="text-sm font-medium text-gray-700">Permissions ({(deptPermissions[dept.name] ?? []).length})</div>
					</div>
					<p class="text-xs text-gray-500">Granting or revoking a department's permissions is not supported by this realm version.</p>

					{#if deptPermissionsBlocked}
						<p class="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
							{deptPermissionsBlocked}
						</p>
					{:else if (deptPermissions[dept.name] ?? []).length > 0}
						<div class="flex flex-wrap gap-1">
							{#each deptPermissions[dept.name] ?? [] as perm (perm)}
								<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full font-medium">
									{perm}
								</span>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-gray-400">No permissions granted to this department yet.</p>
					{/if}
				</div>
				{:else if activeTab === 'authority'}
				<div class={cn('bg-gray-50 space-y-4', narrow ? 'px-3 py-3' : 'px-4 py-4 sm:px-6')}>
					<div>
						<h3 class="text-sm font-semibold text-gray-800">Authority (department over department)</h3>
						<p class="text-sm text-gray-500 mt-1">Grant permissions from root (or another department) over a local or remote-quarter department.</p>
					</div>
					<div class={boxClass}>
						<input bind:value={authTarget} placeholder="Local target department name" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
						<input bind:value={authRemoteCanister} placeholder="Remote quarter canister id (instead of a local department)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
						<input bind:value={authPerms} placeholder="Permissions (comma-separated)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
						<button onclick={grantAuthorityFromRoot} class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">Grant from root</button>
					</div>
					{#if authoritiesBlockedMessage}
						<p class="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
							{authoritiesBlockedMessage}
						</p>
					{:else if authorities.length === 0}
						<p class="text-sm text-gray-400">No authority grants yet.</p>
					{:else}
						{@const filteredAuthorities = authorities.filter((auth) => authorityMatchesFilter(auth, authFilter))}
						<input
							type="text"
							bind:value={authFilter}
							placeholder="Filter by source, target, remote quarter, or permission…"
							class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
						/>
						{#if filteredAuthorities.length === 0}
							<p class="text-sm text-gray-400">No authority grants match your filter.</p>
						{:else if narrow}
							<div class="divide-y divide-gray-200 border-y border-gray-200 bg-white">
								{#each filteredAuthorities as auth (auth.id)}
									{@const perms = auth.permissions ?? []}
									{@const expanded = expandedAuthRows.has(auth.id)}
									{@const visiblePerms = expanded ? perms : perms.slice(0, 3)}
									<article class="py-3">
										<div class="flex items-start justify-between gap-3">
											<div class="min-w-0">
												<div class="text-xs text-gray-500">From {auth.grantor}</div>
												<div class="font-medium text-gray-900">{authTargetLabel(auth)}</div>
												{#if auth.target_quarter_canister_id}
													<div class="text-xs text-gray-400 font-mono">{shortPrincipal(auth.target_quarter_canister_id)}</div>
												{/if}
											</div>
											<button type="button" onclick={() => revokeAuthority(auth.id)} class="shrink-0 text-red-500 hover:text-red-700 text-xs">Revoke</button>
										</div>
										<div class="mt-1 text-xs text-gray-600 break-words">
											{visiblePerms.join(', ')}
											{#if perms.length > 3}
												<button
													type="button"
													onclick={() => toggleAuthRowExpanded(auth.id)}
													class="ml-1 text-indigo-600 hover:text-indigo-800"
												>
													{expanded ? 'Show less' : `+${perms.length - 3} more`}
												</button>
											{/if}
										</div>
									</article>
								{/each}
							</div>
						{:else}
							<div class="overflow-x-auto border border-gray-200 rounded-lg bg-white">
								<table class="w-full text-sm min-w-[36rem]">
									<thead class="bg-gray-50 text-gray-500 text-xs">
										<tr>
											<th class="px-3 py-2 text-left font-medium">From</th>
											<th class="px-3 py-2 text-left font-medium">To</th>
											<th class="px-3 py-2 text-left font-medium">Permissions</th>
											<th class="px-3 py-2 text-right font-medium">Actions</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-100">
										{#each filteredAuthorities as auth (auth.id)}
											{@const perms = auth.permissions ?? []}
											{@const expanded = expandedAuthRows.has(auth.id)}
											{@const visiblePerms = expanded ? perms : perms.slice(0, 3)}
											<tr>
												<td class="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{auth.grantor}</td>
												<td class="px-3 py-2 text-gray-700">
													<div class="font-medium">{authTargetLabel(auth)}</div>
													{#if auth.target_quarter_canister_id}
														<div class="text-xs text-gray-400 font-mono">{shortPrincipal(auth.target_quarter_canister_id)}</div>
													{/if}
												</td>
												<td class="px-3 py-2">
													<div class="flex flex-wrap gap-1">
														{#each visiblePerms as perm (perm)}
															<span class="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{perm}</span>
														{/each}
														{#if perms.length > 3}
															<button
																type="button"
																onclick={() => toggleAuthRowExpanded(auth.id)}
																class="px-1.5 py-0.5 text-xs text-indigo-600 hover:text-indigo-800"
															>
																{expanded ? 'Show less' : `+${perms.length - 3} more`}
															</button>
														{/if}
													</div>
												</td>
												<td class="px-3 py-2 text-right whitespace-nowrap">
													<button onclick={() => revokeAuthority(auth.id)} class="text-red-500 hover:text-red-700 text-xs">Revoke</button>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					{/if}
				</div>
				{:else if activeTab === 'fund'}
				<!-- Fund tab: inflows, outflows, balance, payroll (issue #260) -->
				<div class={cn('bg-gray-50 space-y-4', narrow ? 'px-3 py-3' : 'px-4 py-4 sm:px-6')}>
					{#if fundLoading}
						<div class="flex justify-center py-8">
							<div class="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
						</div>
					{:else if !fundData?.fund}
						<p class="text-sm text-gray-500 py-4">
							No fund linked to this department yet. Set a <strong>Fund code</strong> under
							Policy &amp; budget in the Overview tab — all department inflows and outflows
							are then recorded against it.
						</p>
					{:else}
						<div class="flex flex-wrap items-center justify-between gap-2">
							<div class="text-sm text-gray-600">
								<span class="font-medium text-gray-800">{fundData.fund.name || fundData.fund.code}</span>
								<span class="ml-2 font-mono text-xs text-gray-400">{fundData.fund.code}</span>
								{#if fundData.fund.fund_type}
									<span class={narrow ? 'ml-2 text-xs text-indigo-600' : 'ml-2 px-1.5 py-0.5 text-xs bg-indigo-50 text-indigo-600 rounded-full'}>{fundData.fund.fund_type}</span>
								{/if}
							</div>
							<button
								type="button"
								onclick={() => loadFund(dept.name)}
								class="px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100"
								title="Refresh"
								aria-label="Refresh"
							>
								{#if narrow}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
									</svg>
								{:else}
									Refresh
								{/if}
							</button>
						</div>

						<!-- Totals -->
						<div class={cn('grid gap-2', narrow ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3')}>
							<div class={metricClass}>
								<div class="text-xs text-gray-500">Inflows</div>
								<div class="text-lg font-semibold text-green-700">+{formatAmount(fundData.totals?.inflows)}</div>
							</div>
							<div class={metricClass}>
								<div class="text-xs text-gray-500">Outflows</div>
								<div class="text-lg font-semibold text-red-700">-{formatAmount(fundData.totals?.outflows)}</div>
							</div>
							<div class={metricClass}>
								<div class="text-xs text-gray-500">Cash balance</div>
								<div class={`text-lg font-semibold ${(fundData.totals?.cash_balance ?? 0) >= 0 ? 'text-gray-900' : 'text-red-700'}`}>
									{formatAmount(fundData.totals?.cash_balance)}
								</div>
							</div>
						</div>

						{#if Object.keys(fundData.inflows_by_category ?? {}).length > 0 || Object.keys(fundData.outflows_by_category ?? {}).length > 0}
							<div class="flex flex-wrap gap-1 text-xs">
								{#each Object.entries(fundData.inflows_by_category ?? {}) as [cat, amt] (cat)}
									<span class="px-2 py-0.5 bg-green-50 text-green-700 rounded-full">{cat} +{formatAmount(amt as number)}</span>
								{/each}
								{#each Object.entries(fundData.outflows_by_category ?? {}) as [cat, amt] (cat)}
									<span class="px-2 py-0.5 bg-red-50 text-red-700 rounded-full">{cat} -{formatAmount(amt as number)}</span>
								{/each}
							</div>
						{/if}

						<!-- Payroll -->
						{#if payrollData}
							<div class="pt-2 border-t border-gray-200 space-y-2">
								<div class="flex flex-wrap items-center justify-between gap-2">
									<div class="text-sm font-medium text-gray-700">
										Payroll — {payrollData.period}
										{#if payrollData.run_active}
											<span class="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
												<span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
												run in progress
											</span>
										{/if}
									</div>
									<button
										onclick={() => runPayroll(dept.name)}
										disabled={payrollBusy || payrollData.run_active || payrollData.total_seats === 0}
										class="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
									>
										{#if payrollBusy}
											<div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										{/if}
										Run payroll
									</button>
								</div>
								<div class="text-xs text-gray-500">
									{payrollData.total_seats} salaried seat{payrollData.total_seats === 1 ? '' : 's'}
									· settled {formatAmount(payrollData.settled_amount)} / {formatAmount(payrollData.total_amount)} {payrollData.currency}
									{#if (dept.policy?.threshold_m ?? 1) > 1 || (dept.policy?.threshold_n ?? 1) > 1 || (dept.policy?.quorum_percent ?? 0) > 0}
										· policy {dept.policy?.threshold_m ?? 1}/{dept.policy?.threshold_n ?? 1} — running payroll requires a vote
									{/if}
								</div>
								<div class="flex flex-wrap gap-1 text-xs">
									{#each Object.entries(payrollData.counts ?? {}) as [status, count] (status)}
										{#if (count as number) > 0}
											<span class={cn('px-2 py-0.5 rounded-full', payrollStatusStyles[status] ?? 'bg-gray-100 text-gray-600')}>
												{status.replace('_', ' ')}: {count}
											</span>
										{/if}
									{/each}
								</div>
								<p class="text-xs text-gray-500">Automatic payroll is not supported by this realm version.</p>
								{#if (payrollData.payments ?? []).length > 0}
									<div class="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-50">
										{#each payrollData.payments as p (p.position + p.principal)}
											<div class="flex items-center justify-between px-3 py-1.5 text-xs">
												<div class="min-w-0 truncate">
													<span class="font-medium text-gray-700">{p.position}</span>
													<span class="ml-2 font-mono text-gray-400">{shortPrincipal(p.principal)}</span>
												</div>
												<div class="flex items-center gap-2 shrink-0">
													<span class="text-gray-600">{formatAmount(p.amount)}</span>
													<span class={cn('px-1.5 py-0.5 rounded-full', payrollStatusStyles[p.status] ?? 'bg-gray-100 text-gray-600')}>
														{p.status.replace('_', ' ')}
													</span>
												</div>
											</div>
										{/each}
									</div>
									{#if payrollData.payments_truncated}
										<p class="text-xs text-gray-400">Showing the first {payrollData.payments.length} of {payrollData.total_seats} seats.</p>
									{/if}
								{/if}
							</div>
						{/if}

						<!-- Ledger entries -->
						<div class="pt-2 border-t border-gray-200 space-y-2">
							<div class="text-sm font-medium text-gray-700">
								Ledger entries ({fundData.entries_total ?? fundData.entries.length})
							</div>
							{#if fundData.entries.length === 0}
								<p class="text-xs text-gray-400">
									No ledger entries yet. Inflows (e.g. litigation fines) and outflows
									(e.g. salaries) appear here once recorded against this fund.
								</p>
							{:else if narrow}
								<div class="max-h-72 overflow-y-auto divide-y divide-gray-200 border-y border-gray-200 bg-white">
									{#each fundData.entries as entry (entry.id)}
										<article class="py-2.5">
											<div class="flex items-start justify-between gap-3">
												<div class="min-w-0">
													<div class="text-xs text-gray-500">{(entry.entry_date || '').slice(0, 10)}</div>
													<div class="text-sm text-gray-900">
														{entry.entry_type} · {entry.category}
													</div>
													{#if entry.description}
														<div class="text-xs text-gray-500 break-words">{entry.description}</div>
													{/if}
												</div>
												<div class="shrink-0 text-right font-mono text-xs text-gray-700">
													{#if entry.debit}
														<div>Dr {formatAmount(entry.debit)}</div>
													{/if}
													{#if entry.credit}
														<div>Cr {formatAmount(entry.credit)}</div>
													{/if}
												</div>
											</div>
										</article>
									{/each}
								</div>
							{:else}
								<div class="max-h-72 overflow-y-auto border border-gray-200 rounded-lg bg-white">
									<table class="w-full text-xs">
										<thead class="sticky top-0 bg-gray-50 text-gray-500">
											<tr>
												<th class="px-3 py-2 text-left font-medium">Date</th>
												<th class="px-3 py-2 text-left font-medium">Type</th>
												<th class="px-3 py-2 text-left font-medium">Category</th>
												<th class="px-3 py-2 text-left font-medium">Description</th>
												<th class="px-3 py-2 text-right font-medium">Debit</th>
												<th class="px-3 py-2 text-right font-medium">Credit</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-gray-50">
											{#each fundData.entries as entry (entry.id)}
												<tr>
													<td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{(entry.entry_date || '').slice(0, 10)}</td>
													<td class="px-3 py-1.5">
														<span class={cn(
															'px-1.5 py-0.5 rounded-full',
															entry.entry_type === 'revenue' ? 'bg-green-50 text-green-700'
															: entry.entry_type === 'expense' ? 'bg-red-50 text-red-700'
															: 'bg-gray-100 text-gray-600'
														)}>
															{entry.entry_type}
														</span>
													</td>
													<td class="px-3 py-1.5 text-gray-600">{entry.category}</td>
													<td class="px-3 py-1.5 text-gray-600 max-w-[16rem] truncate" title={entry.description}>{entry.description}</td>
													<td class="px-3 py-1.5 text-right font-mono text-gray-700">{entry.debit ? formatAmount(entry.debit) : ''}</td>
													<td class="px-3 py-1.5 text-right font-mono text-gray-700">{entry.credit ? formatAmount(entry.credit) : ''}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
								{#if fundData.truncated}
									<p class="text-xs text-gray-400">Showing the most recent {fundData.entries.length} of {fundData.entries_total} entries.</p>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
