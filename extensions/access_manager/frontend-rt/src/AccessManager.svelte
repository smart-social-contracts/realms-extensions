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
	let expandedDept: string | null = $state(null);
	let addMemberPrincipal = $state('');
	let deptPermissions: Record<string, string[]> = $state({});
	let deptPermLoading: string | null = $state(null);
	let deptPermFilter = $state('');
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
		} catch (e: any) {
			addToast(e?.message || 'Failed to load organizations', 'error');
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
				addToast(`Organization "${newDeptName}" created`);
				newDeptName = ''; newDeptDesc = ''; newDeptHead = ''; newDeptFund = '';
				newThresholdM = '1'; newThresholdN = '1';
				showNewDept = false;
				await loadDepartments();
			} else {
				addToast(res?.error || 'Failed to create', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		}
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
			addToast('Set a local target or remote quarter + org', 'error');
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
		if (!confirm(`Delete organization "${name}"?`)) return;
		try {
			const res = await callExt('delete_department', { name });
			if (res?.success) {
				addToast(`Organization "${name}" deleted`);
				await loadDepartments();
			} else {
				addToast(res?.error || 'Failed', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
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
		try {
			const res = await ctx.callSync('get_all_operations');
			if (res?.success) {
				allOperations = res.data?.operations ?? [];
			}
		} catch {
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

	function shortPrincipal(p: string): string {
		if (!p || p.length < 12) return p;
		return p.slice(0, 5) + '...' + p.slice(-5);
	}

	$effect(() => {
		loadDepartments();
		loadAllOperations();
	});
</script>

<div class="max-w-5xl mx-auto p-4 sm:p-6">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">Organizations</h1>
		<p class="text-sm text-gray-500 mt-1">Root, policy (M/N), budget, and org-over-org authority</p>
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
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-800">Organizations ({departments.length})</h2>
			<button onclick={() => showNewDept = !showNewDept} class="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">
				{showNewDept ? 'Cancel' : '+ New Organization'}
			</button>
		</div>

		{#if showNewDept}
			<div class="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
				<input bind:value={newDeptName} placeholder="Organization name" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
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
			<p class="text-center text-gray-500 py-8">No organizations yet. Root is created on realm init.</p>
		{:else}
			{#each departments as dept (dept.name)}
				<div class="border border-gray-200 rounded-xl overflow-hidden">
					<button
						onclick={() => {
							const next = expandedDept === dept.name ? null : dept.name;
							expandedDept = next;
							if (next) { loadDeptPermissions(next); deptPermFilter = ''; deptPendingGrants = new Set(); deptPendingRevokes = new Set(); }
						}}
						class="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 text-left"
					>
						<div>
							<span class="font-medium text-gray-900">{dept.name}</span>
							{#if dept.is_root}
								<span class="ml-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">root</span>
							{/if}
							{#if dept.description}
								<span class="ml-2 text-sm text-gray-500">— {dept.description}</span>
							{/if}
						</div>
						<div class="flex items-center gap-3 text-sm text-gray-500">
							<span class="text-xs">{dept.policy?.threshold_m ?? 1}/{dept.policy?.threshold_n ?? 1}</span>
							<span>{dept.member_count} members</span>
							<span class="text-xs">{expandedDept === dept.name ? '▲' : '▼'}</span>
						</div>
					</button>

					{#if expandedDept === dept.name}
						<div class="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-3">
							{#if dept.head}
								<div class="text-sm"><span class="font-medium text-gray-700">Head:</span> {dept.head.nickname || shortPrincipal(dept.head.principal)}</div>
							{/if}
							{#if dept.extensions?.length > 0}
								<div class="text-sm"><span class="font-medium text-gray-700">Extensions:</span> {dept.extensions.join(', ')}</div>
							{/if}

							<!-- Policy + budget -->
							{#if policyDraft[dept.name]}
							<div class="mt-3 pt-3 border-t border-gray-200 space-y-2">
								<div class="text-sm font-medium text-gray-700">Policy & budget</div>
								<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
									<label class="text-xs text-gray-500">M
										<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].m} />
									</label>
									<label class="text-xs text-gray-500">N
										<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].n} />
									</label>
									<label class="text-xs text-gray-500">Quorum %
										<input class="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" bind:value={policyDraft[dept.name].quorum} />
									</label>
									<label class="text-xs text-gray-500">Fund code
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
							<div class="mt-3 pt-3 border-t border-gray-200">
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
									placeholder="Search permissions to add..."
									class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm mb-2"
								/>

								{#if deptPermFilter.trim()}
									{@const q = deptPermFilter.trim().toLowerCase()}
									{@const filtered = allOperations.filter((op: any) =>
										op.name.toLowerCase().includes(q) ||
										(op.category || '').toLowerCase().includes(q) ||
										(op.description || '').toLowerCase().includes(q)
									).slice(0, 15)}
									<div class="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
										{#each filtered as op (op.name)}
											{@const checked = isDeptPermChecked(op.name, dept.name)}
											<label class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0">
												<input
													type="checkbox"
													checked={checked}
													onchange={() => toggleDeptPerm(op.name, dept.name)}
													class="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
												/>
												<code class="text-xs font-medium text-gray-800">{op.name}</code>
												<span class="text-xs text-gray-400 truncate">{op.description || ''}</span>
											</label>
										{/each}
										{#if filtered.length === 0}
											<div class="px-3 py-2 text-xs text-gray-400">No matching permissions</div>
										{/if}
									</div>
								{/if}
							</div>

							<div class="text-sm font-medium text-gray-700 mt-2">Members:</div>
							{#if dept.members.length === 0}
								<p class="text-sm text-gray-400">No members</p>
							{:else}
								<div class="space-y-1">
									{#each dept.members as m (m.principal)}
										<div class="flex items-center justify-between text-sm bg-white px-3 py-1.5 rounded-lg">
											<span>{m.nickname || shortPrincipal(m.principal)}</span>
											<button onclick={() => removeMember(dept.name, m.principal)} class="text-red-500 hover:text-red-700 text-xs">Remove</button>
										</div>
									{/each}
								</div>
							{/if}

							<div class="flex gap-2 mt-2">
								<input bind:value={addMemberPrincipal} placeholder="User principal" class="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
								<button onclick={() => addMember(dept.name)} class="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">Add</button>
							</div>

							{#if !dept.is_root}
								<button onclick={() => deleteDepartment(dept.name)} class="mt-2 text-sm text-red-600 hover:text-red-800">Delete organization</button>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		{/if}

		<!-- Authority grants -->
		<div class="mt-8 pt-6 border-t border-gray-200 space-y-3">
			<h2 class="text-lg font-semibold text-gray-800">Authority (org over org)</h2>
			<p class="text-sm text-gray-500">Grant permissions from root (or another org) over a local or remote-quarter organization.</p>
			<div class="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-2">
				<input bind:value={authTarget} placeholder="Local target org name" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
				<input bind:value={authRemoteCanister} placeholder="Remote quarter canister id (optional)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
				<input bind:value={authRemoteOrg} placeholder="Remote org name (if cross-quarter)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
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
