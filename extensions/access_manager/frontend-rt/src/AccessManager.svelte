<script lang="ts">
	let { ctx }: { ctx: any } = $props();

	const cn = $derived(ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' ')));

	interface Toast { id: number; type: 'success' | 'error'; text: string; }

	let loading = $state(false);
	let toasts: Toast[] = $state([]);
	let toastCounter = $state(0);

	// Departments
	let departments: any[] = $state([]);
	let deptLoading = $state(false);
	let showNewDept = $state(false);
	let newDeptName = $state('');
	let newDeptDesc = $state('');
	let newDeptHead = $state('');
	let newDeptFund = $state('');
	let newThresholdM = $state('1');
	let newThresholdN = $state('1');
	let selectedDeptName = $state('');
	let addMemberPrincipal = $state('');
	// Member principal autocomplete — realm directory from host `directory_list`.
	let directory: any[] = $state([]);
	let directoryLoaded = $state(false);
	let directoryLoading = $state(false);
	let showMemberSuggestions = $state(false);
	let memberSuggestionIndex = $state(0);
	let memberSuggestions = $derived.by(() => {
		const q = addMemberPrincipal.trim().toLowerCase();
		if (!q) return [];
		return directory
			.filter(
				(e) =>
					e.kind === 'user' &&
					((e.label || '').toLowerCase().includes(q) ||
						(e.principal || '').toLowerCase().includes(q)),
			)
			.slice(0, 8);
	});
	let deptPermissions: Record<string, string[]> = $state({});
	let deptPermLoading: string | null = $state(null);
	let deptPermFilter = $state('');
	// Collapsed/expanded state of permission categories, keyed "<dept>/<category>".
	let openPermCats: Record<string, boolean> = $state({});
	let deptPendingGrants: Set<string> = $state(new Set());
	let deptPendingRevokes: Set<string> = $state(new Set());
	let deptPermApplying = $state(false);
	let allOperations: any[] = $state([]);
	let policyDraft: Record<string, { m: string; n: string; quorum: string; veto: string; fund: string }> = $state({});
	let authorities: any[] = $state([]);
	let authTarget = $state('');
	let authPerms = $state('org.appoint,org.expel,org.set_policy');
	let authRemoteCanister = $state('');
	let authRemoteOrg = $state('');

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

	function selectDepartment(name: string) {
		selectedDeptName = name;
		showNewPosition = null;
		editingPosition = null;
		assigningPosition = null;
		assignPrincipal = '';
		deptPermFilter = '';
		deptPendingGrants = new Set();
		deptPendingRevokes = new Set();
		void loadDeptPermissions(name);
	}

	function addToast(message: string, type: 'success' | 'error' = 'success') {
		const id = ++toastCounter;
		toasts = [...toasts, { id, text: message, type }];
		setTimeout(() => { toasts = toasts.filter(t => t.id !== id); }, 4000);
	}

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	// --- Departments ---
	async function loadDepartments() {
		deptLoading = true;
		try {
			const res = await callExt('list_departments');
			departments = res?.data?.departments ?? [];
			for (const d of departments) {
				policyDraft[d.name] = {
					m: String(d.policy?.threshold_m ?? 1),
					n: String(d.policy?.threshold_n ?? 1),
					quorum: String(d.policy?.quorum_percent ?? 0),
					veto: (d.policy?.veto_principals ?? []).join(', '),
					fund: d.fund?.code ?? '',
				};
			}
			policyDraft = { ...policyDraft };
			const authRes = await callExt('list_authorities');
			authorities = authRes?.data?.authorities ?? [];

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
		} catch (e: any) {
			addToast(e?.message || 'Failed to load departments', 'error');
		} finally {
			deptLoading = false;
		}
	}

	async function createDepartment() {
		if (!newDeptName.trim()) return;
		try {
			const res = await callExt('create_department', {
				name: newDeptName.trim(),
				description: newDeptDesc.trim(),
				head_principal: newDeptHead.trim() || undefined,
				fund_code: newDeptFund.trim() || undefined,
				threshold_m: parseInt(newThresholdM || '1', 10),
				threshold_n: parseInt(newThresholdN || '1', 10),
			});
			if (res?.success) {
				addToast(`Department "${newDeptName}" created`);
				const createdName = newDeptName.trim();
				newDeptName = ''; newDeptDesc = ''; newDeptHead = ''; newDeptFund = '';
				newThresholdM = '1'; newThresholdN = '1';
				showNewDept = false;
				await loadDepartments();
				selectDepartment(createdName);
			} else {
				addToast(res?.error || 'Failed to create', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
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

	function handlePositionResult(res: any, successMsg: string): boolean {
		if (!res?.success) {
			addToast(res?.error || 'Position action failed', 'error');
			return false;
		}
		if (res.data?.applied === 'proposal') {
			addToast(`Proposal ${res.data.proposal_id} created — department members must vote (see Voting)`);
		} else {
			addToast(successMsg);
		}
		return true;
	}

	async function createPosition(deptName: string) {
		if (!newPosTitle.trim()) return;
		try {
			const res = await callExt('manage_position', {
				action: 'create',
				department: deptName,
				title: newPosTitle.trim(),
				profile: newPosProfile.trim() || newPosTitle.trim(),
				headcount: parseInt(newPosHeadcount || '1', 10),
				salary_amount: parseInt(newPosSalary || '0', 10),
			});
			if (handlePositionResult(res, `Position "${newPosTitle}" created`)) {
				showNewPosition = null;
				newPosTitle = ''; newPosProfile = ''; newPosHeadcount = '1'; newPosSalary = '0';
				await loadDepartments();
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
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
			const res = await callExt('manage_position', {
				action: 'update',
				key: pos.key,
				new_title: posDraft.title.trim(),
				headcount: parseInt(posDraft.headcount || '1', 10),
				salary_amount: parseInt(posDraft.salary || '0', 10),
			});
			if (handlePositionResult(res, `Position "${pos.title}" updated`)) {
				editingPosition = null;
				await loadDepartments();
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

	async function togglePositionStatus(pos: any) {
		const action = pos.status === 'closed' ? 'reopen' : 'close';
		try {
			const res = await callExt('manage_position', { action, key: pos.key });
			if (handlePositionResult(res, `Position "${pos.title}" ${action}${action === 'close' ? 'd' : 'ed'}`)) {
				await loadDepartments();
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

	async function endAppointment(pos: any, principal: string) {
		try {
			const res = await callExt('manage_position', {
				action: 'end_appointment',
				key: pos.key,
				principal,
			});
			if (handlePositionResult(res, 'Appointment ended')) {
				await loadDepartments();
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

	async function appointMember(pos: any, principal: string) {
		if (!principal.trim()) return;
		try {
			const res = await callExt('manage_position', {
				action: 'appoint',
				key: pos.key,
				principal: principal.trim(),
			});
			if (handlePositionResult(res, `Appointed to "${pos.title}"`)) {
				assigningPosition = null;
				assignPrincipal = '';
				await loadDepartments();
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

	function eligibleAppointees(pos: any, members: any[]) {
		const holders = new Set((pos.holders ?? []).map((h: any) => h.principal));
		return members.filter((m) => m.principal && !holders.has(m.principal));
	}

	function startAssignPosition(pos: any, dept: any) {
		assigningPosition = pos.key;
		editingPosition = null;
		const eligible = eligibleAppointees(pos, dept.members ?? []);
		assignPrincipal = eligible[0]?.principal ?? '';
	}

	async function savePolicy(name: string) {
		const draft = policyDraft[name];
		if (!draft) return;
		try {
			const res = await callExt('update_department', {
				name,
				threshold_m: parseInt(draft.m || '1', 10),
				threshold_n: parseInt(draft.n || '1', 10),
				quorum_percent: parseInt(draft.quorum || '0', 10),
				veto_principals: draft.veto,
				fund_code: draft.fund.trim(),
			});
			if (res?.success) {
				addToast(`Policy saved for ${name}`);
				await loadDepartments();
			} else {
				addToast(res?.error || 'Failed to save policy', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

	async function grantAuthorityFromRoot() {
		if (!authTarget.trim() && !(authRemoteCanister.trim() && authRemoteOrg.trim())) {
			addToast('Set a local target or remote quarter + department', 'error');
			return;
		}
		try {
			const args: Record<string, unknown> = {
				grantor: 'root',
				permissions: authPerms.split(',').map((p) => p.trim()).filter(Boolean),
			};
			if (authRemoteCanister.trim()) {
				args.target_quarter_canister_id = authRemoteCanister.trim();
				args.target_org_name = authRemoteOrg.trim();
			} else {
				args.target = authTarget.trim();
			}
			const res = await callExt('grant_authority', args);
			if (res?.success) {
				addToast('Authority granted');
				authTarget = ''; authRemoteCanister = ''; authRemoteOrg = '';
				await loadDepartments();
			} else {
				addToast(res?.error || 'Failed', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

	async function revokeAuthority(id: string) {
		try {
			const res = await callExt('revoke_authority', { id });
			if (res?.success) {
				addToast('Authority revoked');
				await loadDepartments();
			} else {
				addToast(res?.error || 'Failed', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

	async function deleteDepartment(name: string) {
		if (!confirm(`Delete department "${name}"?`)) return;
		try {
			const res = await callExt('delete_department', { name });
			if (res?.success) {
				addToast(`Department "${name}" deleted`);
				if (selectedDeptName === name) selectedDeptName = '';
				await loadDepartments();
			} else {
				addToast(res?.error || 'Failed', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

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
			console.warn('[access_manager] directory load failed', e);
		} finally {
			directoryLoading = false;
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
			void loadDirectory();

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
		} else if (e.key === 'Escape') {
			showMemberSuggestions = false;
			memberSuggestionIndex = 0;
		}
	}

	async function addMember(deptName: string) {
		if (!addMemberPrincipal.trim()) return;
		try {
			const res = await callExt('add_department_member', {
				department: deptName,
				user_principal: addMemberPrincipal.trim(),
			});
			if (res?.success) {
				addToast('Member added');
				addMemberPrincipal = '';
				await loadDepartments();
			} else {
				addToast(res?.error || 'Failed', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

	async function removeMember(deptName: string, principal: string) {
		try {
			const res = await callExt('remove_department_member', {
				department: deptName,
				user_principal: principal,
			});
			if (res?.success) {
				addToast('Member removed');
				await loadDepartments();
			} else {
				addToast(res?.error || 'Failed', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
	}

	async function loadDeptPermissions(deptName: string) {
		deptPermLoading = deptName;
		try {
			const res = await callExt('get_department_permissions', { department: deptName });
			if (res?.success) {
				deptPermissions = { ...deptPermissions, [deptName]: (res.data?.permissions ?? []).map((p: any) => p.name) };
			}
		} catch (e: any) {
			addToast(e?.message || 'Failed to load permissions', 'error');
		} finally {
			deptPermLoading = null;
		}
	}

	async function loadAllOperations() {
		// The permission catalog lives in role_manager, not in this extension —
		// ctx.callSync scopes to access_manager, so call the host backend directly.
		try {
			const raw = await ctx.backend.extension_sync_call('role_manager', 'get_all_operations', '{}');
			const envelope = typeof raw === 'string' ? JSON.parse(raw) : raw;
			const inner = envelope?.response ?? envelope;
			const res = typeof inner === 'string' ? JSON.parse(inner) : inner;
			if (res?.success) {
				allOperations = res.data?.operations ?? [];
			}
		} catch {
			// Catalog stays empty; the UI shows a hint instead of the browser.
		}
	}

	async function applyDeptPermChanges(deptName: string) {
		deptPermApplying = true;
		try {
			const toGrant = [...deptPendingGrants];
			const toRevoke = [...deptPendingRevokes];
			if (toGrant.length > 0) {
				const res = await callExt('batch_grant_department_permissions', {
					department: deptName,
					permission_names: toGrant,
				});
				if (!res?.success) {
					addToast(res?.error || 'Failed to grant', 'error');
					deptPermApplying = false;
					return;
				}
			}
			if (toRevoke.length > 0) {
				const res = await callExt('batch_revoke_department_permissions', {
					department: deptName,
					permission_names: toRevoke,
				});
				if (!res?.success) {
					addToast(res?.error || 'Failed to revoke', 'error');
					deptPermApplying = false;
					return;
				}
			}
			addToast(`${toGrant.length} granted, ${toRevoke.length} revoked`);
			deptPendingGrants = new Set();
			deptPendingRevokes = new Set();
			await loadDeptPermissions(deptName);
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		} finally {
			deptPermApplying = false;
		}
	}

	function toggleDeptPerm(opName: string, deptName: string) {
		const current = deptPermissions[deptName] ?? [];
		const isGranted = current.includes(opName);
		if (isGranted) {
			if (deptPendingRevokes.has(opName)) {
				deptPendingRevokes = new Set([...deptPendingRevokes].filter(n => n !== opName));
			} else {
				deptPendingRevokes = new Set([...deptPendingRevokes, opName]);
				deptPendingGrants = new Set([...deptPendingGrants].filter(n => n !== opName));
			}
		} else {
			if (deptPendingGrants.has(opName)) {
				deptPendingGrants = new Set([...deptPendingGrants].filter(n => n !== opName));
			} else {
				deptPendingGrants = new Set([...deptPendingGrants, opName]);
				deptPendingRevokes = new Set([...deptPendingRevokes].filter(n => n !== opName));
			}
		}
	}

	function isDeptPermChecked(opName: string, deptName: string): boolean {
		const current = deptPermissions[deptName] ?? [];
		if (deptPendingGrants.has(opName)) return true;
		if (deptPendingRevokes.has(opName)) return false;
		return current.includes(opName);
	}

	/** Permission catalog grouped by category, optionally narrowed by a filter. */
	function groupedOps(filter: string): { category: string; ops: any[] }[] {
		const q = filter.trim().toLowerCase();
		const ops = q
			? allOperations.filter((op: any) =>
				op.name.toLowerCase().includes(q) ||
				(op.category || '').toLowerCase().includes(q) ||
				(op.description || '').toLowerCase().includes(q))
			: allOperations;
		const byCat: Record<string, any[]> = {};
		for (const op of ops) (byCat[op.category || 'Other'] ??= []).push(op);
		return Object.keys(byCat).sort().map((category) => ({
			category,
			ops: [...byCat[category]].sort((a: any, b: any) => a.name.localeCompare(b.name)),
		}));
	}

	function shortPrincipal(p: string): string {
		if (!p || p.length < 12) return p;
		return p.slice(0, 5) + '...' + p.slice(-5);
	}

	$effect(() => {
		loadDepartments();
		loadAllOperations();
		loadDirectory();
	});
</script>

<div class="w-full min-h-full p-4 sm:p-6 lg:p-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">Departments</h1>
		<p class="text-sm text-gray-500 mt-1">Root, policy (M/N), budget, positions, and department-over-department authority</p>
	</div>

	<!-- Toasts -->
	{#if toasts.length > 0}
		<div class="fixed top-4 right-4 z-50 space-y-2">
			{#each toasts as toast (toast.id)}
				<div class={cn(
					'px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all',
					toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
				)}>
					{toast.text}
				</div>
			{/each}
		</div>
	{/if}

	<div class="space-y-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
			<button onclick={() => showNewDept = !showNewDept} class="shrink-0 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">
				{showNewDept ? 'Cancel' : '+ New Department'}
			</button>
		</div>

		{#if showNewDept}
			<div class="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
				<input bind:value={newDeptName} placeholder="Department name" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
				<input bind:value={newDeptDesc} placeholder="Description (optional)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
				<input bind:value={newDeptHead} placeholder="Head principal (optional)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
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
		{:else if departments.length === 0}
			<p class="text-center text-gray-500 py-8">No departments yet. Root is created on realm init.</p>
		{:else if selectedDept}
			{@const dept = selectedDept}
			<div class="border border-gray-200 rounded-xl overflow-hidden">
				<div class="px-4 py-4 sm:px-6 bg-white border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
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
					<div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 shrink-0">
						<span>Policy {dept.policy?.threshold_m ?? 1}/{dept.policy?.threshold_n ?? 1}</span>
						<span>{dept.member_count} member{dept.member_count === 1 ? '' : 's'}</span>
						{#if dept.fund}
							<span>Fund {dept.fund.code}</span>
						{/if}
					</div>
				</div>

				<div class="px-4 py-4 sm:px-6 bg-gray-50 space-y-4">
					{#if dept.head}
						<div class="text-sm"><span class="font-medium text-gray-700">Head:</span> {dept.head.nickname || shortPrincipal(dept.head.principal)}</div>
					{/if}
					{#if dept.extensions?.length > 0}
						<div class="text-sm"><span class="font-medium text-gray-700">Extensions:</span> {dept.extensions.join(', ')}</div>
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
											<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={newPosProfile} placeholder="defaults to title" />
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
								<div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
									{#each dept.positions as pos (pos.key)}
										<div class="px-3 py-2 bg-white border border-gray-200 rounded-lg">
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
																<button onclick={() => startAssignPosition(pos, dept)} class="px-1.5 py-0.5 text-xs border border-indigo-300 text-indigo-700 rounded hover:bg-indigo-50">Assign</button>
															{/if}
															<button onclick={() => startEditPosition(pos)} class="px-1.5 py-0.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100">Edit</button>
															<button onclick={() => togglePositionStatus(pos)} class="px-1.5 py-0.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100">
																{pos.status === 'closed' ? 'Reopen' : 'Close'}
															</button>
														</div>
													</div>
												</div>
												{#if pos.holders?.length > 0}
													<div class="mt-2 flex flex-wrap gap-1">
														{#each pos.holders as h (h.principal)}
															<span class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded-full text-gray-600" title={h.principal}>
																{h.nickname || shortPrincipal(h.principal)}
																<button onclick={() => endAppointment(pos, h.principal)} class="text-gray-400 hover:text-red-600" title="End appointment">&times;</button>
															</span>
														{/each}
													</div>
												{/if}
												{#if assigningPosition === pos.key}
													{@const eligible = eligibleAppointees(pos, dept.members ?? [])}
													<div class="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg space-y-2">
														{#if eligible.length === 0}
															<p class="text-xs text-gray-500">Add department members first, then assign them to this position.</p>
														{:else}
															<div class="flex flex-wrap items-end gap-2">
																<label class="text-xs text-gray-600 flex-1 min-w-[10rem]">
																	Member
																	<select bind:value={assignPrincipal} class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
																		<option value="">Select member…</option>
																		{#each eligible as m (m.principal)}
																			<option value={m.principal}>{m.nickname || shortPrincipal(m.principal)}</option>
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

					<!-- Policy + budget -->
					{#if policyDraft[dept.name]}
						<div class="pt-2 border-t border-gray-200 space-y-2">
							<div class="text-sm font-medium text-gray-700">Policy & budget</div>
							<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
								<label class="text-xs text-gray-500">M
									<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].m} />
								</label>
								<label class="text-xs text-gray-500">N
									<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].n} />
								</label>
								<label class="text-xs text-gray-500">Quorum %
									<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].quorum} />
								</label>
								<label class="text-xs text-gray-500 sm:col-span-2 lg:col-span-2">Fund code
									<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].fund} />
								</label>
							</div>
							<label class="block text-xs text-gray-500">Veto principals (comma-separated)
								<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].veto} />
							</label>
							<button onclick={() => savePolicy(dept.name)} class="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">Save policy</button>
						</div>
					{/if}

					<!-- Permissions -->
					<div class="pt-2 border-t border-gray-200">
						<div class="flex items-center justify-between mb-2">
							<div class="text-sm font-medium text-gray-700">Permissions ({(deptPermissions[dept.name] ?? []).length})</div>
							{#if deptPendingGrants.size > 0 || deptPendingRevokes.size > 0}
								<div class="flex items-center gap-2">
									<span class="text-xs text-gray-500">
										{#if deptPendingGrants.size > 0}<span class="text-green-600 font-medium">+{deptPendingGrants.size}</span>{/if}
										{#if deptPendingGrants.size > 0 && deptPendingRevokes.size > 0}&nbsp;/&nbsp;{/if}
										{#if deptPendingRevokes.size > 0}<span class="text-red-600 font-medium">-{deptPendingRevokes.size}</span>{/if}
									</span>
									<button onclick={() => { deptPendingGrants = new Set(); deptPendingRevokes = new Set(); }} class="text-xs text-gray-500 hover:text-gray-700">Discard</button>
									<button onclick={() => applyDeptPermChanges(dept.name)} disabled={deptPermApplying} class="px-2 py-1 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Apply</button>
								</div>
							{/if}
						</div>

						{#if (deptPermissions[dept.name] ?? []).length > 0}
							<div class="flex flex-wrap gap-1 mb-2">
								{#each deptPermissions[dept.name] ?? [] as perm (perm)}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full font-medium">
										{perm}
										<button onclick={() => toggleDeptPerm(perm, dept.name)} class="text-amber-400 hover:text-red-600" title="Revoke">&times;</button>
									</span>
								{/each}
							</div>
						{/if}

						<input
							type="text"
							bind:value={deptPermFilter}
							placeholder="Filter permissions (name, category, description)..."
							class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm mb-2"
						/>

						<!-- Browsable catalog: every permission, grouped by category, so
						     admins can discover what exists instead of guessing names.
						     Filtering auto-expands the matching categories. -->
						{#if allOperations.length === 0}
							<p class="text-xs text-gray-400">Permission catalog unavailable — the role_manager extension is not installed or you lack permission.view.</p>
						{:else}
							{@const groups = groupedOps(deptPermFilter)}
							{@const filtering = deptPermFilter.trim().length > 0}
							<div class="max-h-72 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
								{#each groups as group (group.category)}
									{@const catKey = `${dept.name}/${group.category}`}
									{@const isOpen = filtering || openPermCats[catKey]}
									{@const grantedCount = group.ops.filter((op: any) => isDeptPermChecked(op.name, dept.name)).length}
									<div>
										<button
											type="button"
											onclick={() => openPermCats = { ...openPermCats, [catKey]: !openPermCats[catKey] }}
											class="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
										>
											<span class="font-medium text-gray-700">{group.category}</span>
											<span class="flex items-center gap-2 text-xs text-gray-400">
												{#if grantedCount > 0}
													<span class="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">{grantedCount} granted</span>
												{/if}
												<span>{group.ops.length}</span>
												<svg class="w-3.5 h-3.5 transition-transform {isOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
											</span>
										</button>
										{#if isOpen}
											{#each group.ops as op (op.name)}
												{@const checked = isDeptPermChecked(op.name, dept.name)}
												<label class="flex items-start gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm border-t border-gray-50">
													<input
														type="checkbox"
														checked={checked}
														onchange={() => toggleDeptPerm(op.name, dept.name)}
														class="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
													/>
													<span class="min-w-0">
														<code class="text-xs font-medium text-gray-800">{op.name}</code>
														{#if op.description}
															<span class="block text-xs text-gray-400">{op.description}</span>
														{/if}
													</span>
												</label>
											{/each}
										{/if}
									</div>
								{/each}
								{#if groups.length === 0}
									<div class="px-3 py-2 text-xs text-gray-400">No matching permissions</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Members -->
					<div class="pt-2 border-t border-gray-200">
						<div class="text-sm font-medium text-gray-700 mb-2">Members</div>
						{#if dept.members.length === 0}
							<p class="text-sm text-gray-400 mb-2">No members</p>
						{:else}
							<div class="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 mb-2">
								{#each dept.members as m (m.principal)}
									<div class="flex items-center justify-between text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-200">
										<span class="truncate">{m.nickname || shortPrincipal(m.principal)}</span>
										<button onclick={() => removeMember(dept.name, m.principal)} class="text-red-500 hover:text-red-700 text-xs shrink-0 ml-2">Remove</button>
									</div>
								{/each}
							</div>
						{/if}

						<div class="flex gap-2 max-w-2xl">
							<div class="relative flex-1">
								<input
									bind:value={addMemberPrincipal}
									onkeydown={handleMemberPrincipalKeydown}
									oninput={() => {
										showMemberSuggestions = false;
										memberSuggestionIndex = 0;
									}}
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
							<button onclick={() => addMember(dept.name)} class="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 shrink-0">Add</button>
						</div>
						<p id="am-member-hint" class="mt-1 text-xs text-gray-500">
							Type a name or principal, then press
							<kbd class="mx-0.5 px-1 py-0.5 rounded border border-gray-300 bg-gray-100 text-[10px] font-mono text-gray-600">Tab</kbd>
							to open autocomplete.
						</p>
					</div>

					{#if !dept.is_root}
						<button onclick={() => deleteDepartment(dept.name)} class="text-sm text-red-600 hover:text-red-800">Delete department</button>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Authority grants -->
		<div class="mt-8 pt-6 border-t border-gray-200 space-y-3">
			<h2 class="text-lg font-semibold text-gray-800">Authority (department over department)</h2>
			<p class="text-sm text-gray-500">Grant permissions from root (or another department) over a local or remote-quarter department.</p>
			<div class="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-2">
				<input bind:value={authTarget} placeholder="Local target department name" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
				<input bind:value={authRemoteCanister} placeholder="Remote quarter canister id (optional)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
				<input bind:value={authRemoteOrg} placeholder="Remote department name (if cross-quarter)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
				<input bind:value={authPerms} placeholder="Permissions (comma-separated)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
				<button onclick={grantAuthorityFromRoot} class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">Grant from root</button>
			</div>
			{#if authorities.length === 0}
				<p class="text-sm text-gray-400">No authority grants yet.</p>
			{:else}
				<div class="space-y-2">
					{#each authorities as auth (auth.id)}
						<div class="flex items-center justify-between text-sm bg-white border border-gray-200 px-3 py-2 rounded-lg">
							<div>
								<span class="font-medium">{auth.grantor}</span>
								<span class="text-gray-400"> → </span>
								<span class="font-medium">{auth.target || `${auth.target_org_name}@${shortPrincipal(auth.target_quarter_canister_id)}`}</span>
								<div class="text-xs text-gray-500">{(auth.permissions || []).join(', ')}</div>
							</div>
							<button onclick={() => revokeAuthority(auth.id)} class="text-red-500 hover:text-red-700 text-xs">Revoke</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
