<script lang="ts">
	let { ctx }: { ctx: any } = $props();

	const cn = $derived(ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' ')));

	interface Toast { id: number; type: 'success' | 'error'; text: string; }

	let loading = $state(true);
	let error: string | null = $state(null);
	let data: any = $state(null);
	let toasts: Toast[] = $state([]);
	let toastCounter = 0;
	let expandedOrg: string | null = $state(null);
	let regenerating: string | null = $state(null);

	function addToast(text: string, type: 'success' | 'error' = 'success') {
		const id = ++toastCounter;
		toasts = [...toasts, { id, text, type }];
		setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); }, 4000);
	}

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await ctx.callSync('get_console_data', {});
			if (res?.success) {
				data = res.data;
			} else {
				error = res?.error || 'Failed to load console data';
			}
		} catch (e: any) {
			error = e?.message || 'Failed to load console data';
		} finally {
			loading = false;
		}
	}

	async function copyInviteUrl(invite: any) {
		if (!invite.url) {
			addToast('No URL available for this invite (frontend URL not configured)', 'error');
			return;
		}
		try {
			await navigator.clipboard.writeText(invite.url);
			addToast(`Invite URL for ${invite.profile} copied`);
		} catch {
			addToast('Could not copy to clipboard', 'error');
		}
	}

	async function regenerate(orgName: string, profile: string) {
		regenerating = `${orgName}/${profile}`;
		try {
			const res = await ctx.callSync('regenerate_invite', { department: orgName, profile });
			if (res?.success) {
				addToast(`New invite generated for ${profile}`);
				await load();
			} else {
				addToast(res?.error || 'Failed to regenerate invite', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Error', 'error');
		} finally {
			regenerating = null;
		}
	}

	function shortPrincipal(p: string): string {
		if (!p || p.length < 12) return p;
		return p.slice(0, 5) + '...' + p.slice(-5);
	}

	// --- Citizen import ---
	let importJson = $state('');
	let importing = $state(false);
	let importReport: any = $state(null);
	let pendingInvites: any[] = $state([]);
	let pendingTotal = $state(0);
	let pendingLoading = $state(false);
	let showPending = $state(false);

	async function runImport() {
		let records: any;
		try {
			records = JSON.parse(importJson);
		} catch {
			addToast('Invalid JSON — expected an array of citizen records', 'error');
			return;
		}
		if (!Array.isArray(records)) {
			addToast('Expected a JSON array of citizen records', 'error');
			return;
		}
		importing = true;
		importReport = null;
		try {
			const res = await ctx.callSync('import_citizens', { citizens: records });
			if (res?.success) {
				importReport = res.data;
				addToast(`${res.data.created_count} citizens imported, ${res.data.skipped_count} skipped`);
				importJson = '';
				await load();
				if (showPending) await loadPending();
			} else {
				addToast(res?.error || 'Import failed', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Import failed', 'error');
		} finally {
			importing = false;
		}
	}

	async function loadPending() {
		pendingLoading = true;
		try {
			const res = await ctx.callSync('list_citizen_invites', { only_pending: true, limit: 50 });
			if (res?.success) {
				pendingInvites = res.data.citizens ?? [];
				pendingTotal = res.data.total ?? 0;
			} else {
				addToast(res?.error || 'Failed to load pending invites', 'error');
			}
		} catch (e: any) {
			addToast(e?.message || 'Failed to load pending invites', 'error');
		} finally {
			pendingLoading = false;
		}
	}

	async function togglePending() {
		showPending = !showPending;
		if (showPending && pendingInvites.length === 0) await loadPending();
	}

	async function copyCitizenUrl(row: any) {
		if (!row.url) {
			addToast('No URL available (frontend URL not configured)', 'error');
			return;
		}
		try {
			await navigator.clipboard.writeText(row.url);
			addToast(`Invite URL for ${row.name || row.id} copied`);
		} catch {
			addToast('Could not copy to clipboard', 'error');
		}
	}

	const claimPercent = $derived(
		data?.citizen_import?.total > 0
			? Math.round((data.citizen_import.claimed / data.citizen_import.total) * 100)
			: 0,
	);

	const progressPercent = $derived(
		data && data.checklist_total > 0
			? Math.round((data.checklist_done / data.checklist_total) * 100)
			: 0,
	);

	// Initial fetch on component init (no reactive dependencies).
	load();
</script>

<div class="max-w-5xl mx-auto p-4 sm:p-6">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">Migration Console</h1>
		<p class="text-sm text-gray-500 mt-1">
			Readiness, organizations, and staff onboarding for the incumbent migration
		</p>
	</div>

	<!-- Toasts -->
	{#if toasts.length > 0}
		<div class="fixed top-4 right-4 z-50 space-y-2">
			{#each toasts as toast (toast.id)}
				<div class={cn(
					'px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all',
					toast.type === 'success'
						? 'bg-green-50 text-green-800 border border-green-200'
						: 'bg-red-50 text-red-800 border border-red-200'
				)}>
					{toast.text}
				</div>
			{/each}
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center py-12">
			<svg class="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
		</div>
	{:else if error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
			{error}
		</div>
	{:else if data}
		<!-- Readiness checklist -->
		<div class="border border-gray-200 rounded-xl p-4 sm:p-5 mb-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-lg font-semibold text-gray-800">
					Readiness — {data.realm?.name}
					{#if data.realm?.status}
						<span class="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full uppercase">
							{data.realm.status}
						</span>
					{/if}
				</h2>
				<span class="text-sm text-gray-500">{data.checklist_done} / {data.checklist_total}</span>
			</div>
			<div class="w-full bg-gray-100 rounded-full h-2 mb-4">
				<div class="bg-green-500 h-2 rounded-full transition-all" style="width: {progressPercent}%"></div>
			</div>
			<ul class="space-y-2">
				{#each data.checklist as item (item.id)}
					<li class="flex items-start gap-3">
						<span class={cn(
							'mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0',
							item.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
						)}>
							{item.done ? '✓' : '·'}
						</span>
						<div>
							<span class={cn('text-sm font-medium', item.done ? 'text-gray-800' : 'text-gray-500')}>
								{item.label}
							</span>
							<span class="ml-2 text-xs text-gray-400">{item.detail}</span>
						</div>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Migration status: citizens / quarters / currency -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
			<div class="border border-gray-200 rounded-xl p-4">
				<h3 class="text-sm font-semibold text-gray-700 mb-2">Citizen import</h3>
				{#if data.citizen_import?.total > 0}
					<p class="text-2xl font-bold text-gray-900">
						{data.citizen_import.claimed}
						<span class="text-sm font-normal text-gray-400">of {data.citizen_import.total} claimed</span>
					</p>
					<div class="w-full bg-gray-100 rounded-full h-1.5 mt-2">
						<div class="bg-blue-500 h-1.5 rounded-full transition-all" style="width: {claimPercent}%"></div>
					</div>
					<p class="text-xs text-gray-400 mt-1">{data.citizen_import.pending} pending</p>
				{:else}
					<p class="text-sm text-gray-400">No citizens imported yet.</p>
				{/if}
			</div>
			<div class="border border-gray-200 rounded-xl p-4">
				<h3 class="text-sm font-semibold text-gray-700 mb-2">Quarters</h3>
				{#if data.quarters?.length > 0}
					<ul class="space-y-1">
						{#each data.quarters as q (q.canister_id)}
							<li class="flex justify-between text-sm">
								<span class="text-gray-700">#{q.index} {q.name}</span>
								<span class="text-gray-400">{q.population} · {q.status}</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-sm text-gray-400">Single-quarter realm (autoscale adds more under load).</p>
				{/if}
			</div>
			<div class="border border-gray-200 rounded-xl p-4">
				<h3 class="text-sm font-semibold text-gray-700 mb-2">Currency</h3>
				<p class="text-2xl font-bold text-gray-900">{data.currency?.accounting_currency || '—'}</p>
				<p class="text-xs mt-1 {data.currency?.token_canister_id ? 'text-green-600' : 'text-amber-600'}">
					{data.currency?.token_canister_id
						? `token canister ${data.currency.token_canister_id}`
						: 'token canister not linked'}
				</p>
			</div>
		</div>

		<!-- Citizen import panel (admin) -->
		{#if data.is_admin}
			<div class="border border-gray-200 rounded-xl p-4 sm:p-5 mb-6">
				<div class="flex items-center justify-between mb-2">
					<h2 class="text-lg font-semibold text-gray-800">Import citizens</h2>
					<button
						class="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
						onclick={togglePending}
					>
						{showPending ? 'Hide pending invites' : 'Show pending invites'}
					</button>
				</div>
				<p class="text-xs text-gray-500 mb-3">
					Paste a JSON array of citizen records:
					<code class="bg-gray-100 px-1 rounded">{'[{"id": "C-1001", "name": "Ada", "quarter": "North Quarter", "email": ""}]'}</code>
					— up to 200 per batch. Each citizen gets a single-use personal invite URL; logging in with
					Internet Identity binds their record to their principal.
				</p>
				<textarea
					bind:value={importJson}
					rows="4"
					placeholder="[ &#123;&quot;id&quot;: &quot;C-1001&quot;, &quot;name&quot;: &quot;Ada Lovelace&quot;&#125;, … ]"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
				></textarea>
				<div class="mt-2 flex items-center gap-3">
					<button
						class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
						disabled={importing || !importJson.trim()}
						onclick={runImport}
					>
						{importing ? 'Importing…' : 'Import'}
					</button>
					{#if importReport}
						<span class="text-xs text-gray-500">
							{importReport.created_count} created · {importReport.skipped_count} skipped ·
							{importReport.error_count} errors
						</span>
					{/if}
				</div>
				{#if importReport?.errors?.length > 0}
					<ul class="mt-2 text-xs text-red-600 space-y-0.5">
						{#each importReport.errors as err, idx (idx)}
							<li>Record {err.index}{err.id ? ` (${err.id})` : ''}: {err.error}</li>
						{/each}
					</ul>
				{/if}

				{#if showPending}
					<div class="mt-4 border-t border-gray-100 pt-3">
						<h3 class="text-sm font-semibold text-gray-700 mb-2">
							Pending invites {pendingTotal > 50 ? `(first 50 of ${pendingTotal})` : `(${pendingTotal})`}
						</h3>
						{#if pendingLoading}
							<p class="text-sm text-gray-400">Loading…</p>
						{:else if pendingInvites.length === 0}
							<p class="text-sm text-gray-400">Every imported citizen has claimed their record.</p>
						{:else}
							<div class="space-y-1 max-h-64 overflow-y-auto">
								{#each pendingInvites as row (row.id)}
									<div class="flex items-center justify-between gap-2 p-1.5 bg-gray-50 border border-gray-100 rounded">
										<span class="text-xs text-gray-700 truncate">
											{row.id}{row.name ? ` — ${row.name}` : ''}{row.quarter ? ` · ${row.quarter}` : ''}
										</span>
										<button
											class="px-2 py-0.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 shrink-0"
											disabled={!row.url}
											onclick={() => copyCitizenUrl(row)}
										>
											Copy URL
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Organizations -->
		<div class="space-y-4">
			<h2 class="text-lg font-semibold text-gray-800">
				Organizations ({data.organizations.length})
			</h2>

			{#if data.organizations.length === 0}
				<p class="text-center text-gray-500 py-8">
					No organizations yet — install a codex with a department template.
				</p>
			{/if}

			{#each data.organizations as org (org.name)}
				<div class="border border-gray-200 rounded-xl overflow-hidden">
					<button
						class="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 text-left"
						onclick={() => (expandedOrg = expandedOrg === org.name ? null : org.name)}
					>
						<div class="flex items-center gap-3">
							<span class="font-medium text-gray-900">{org.name}</span>
							{#if org.is_root}
								<span class="px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-full">root</span>
							{/if}
							<span class="text-xs text-gray-400">
								{org.member_count} member{org.member_count === 1 ? '' : 's'}
								· policy {org.policy.threshold_m}/{org.policy.threshold_n}
								{#if org.fund}
									· fund {org.fund.code}
								{/if}
							</span>
						</div>
						<span class="text-gray-400 text-sm">{expandedOrg === org.name ? '▾' : '▸'}</span>
					</button>

					{#if expandedOrg === org.name}
						<div class="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-4">
							{#if org.description}
								<p class="text-sm text-gray-600">{org.description}</p>
							{/if}

							<!-- Staff invites -->
							{#if org.invites.length > 0}
								<div>
									<h3 class="text-sm font-semibold text-gray-700 mb-2">Staff invite URLs</h3>
									<div class="space-y-2">
										{#each org.invites as invite (invite.code_hash)}
											<div class="flex items-center justify-between gap-2 p-2 bg-white border border-gray-200 rounded-lg">
												<div class="min-w-0">
													<span class="text-sm font-medium text-gray-800">{invite.profile}</span>
													<span class={cn(
														'ml-2 text-xs',
														invite.is_valid ? 'text-green-600' : 'text-red-500'
													)}>
														{invite.revoked ? 'revoked' : invite.is_valid ? 'active' : 'expired/used up'}
													</span>
													<span class="ml-2 text-xs text-gray-400">
														{invite.uses_count} / {invite.max_uses} redeemed
													</span>
												</div>
												<div class="flex gap-2 shrink-0">
													<button
														class="px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
														disabled={!invite.url || !invite.is_valid}
														onclick={() => copyInviteUrl(invite)}
													>
														Copy URL
													</button>
													{#if data.is_admin}
														<button
															class="px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50"
															disabled={regenerating === `${org.name}/${invite.profile}`}
															onclick={() => regenerate(org.name, invite.profile)}
														>
															{regenerating === `${org.name}/${invite.profile}` ? '…' : 'Regenerate'}
														</button>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>
							{:else if !org.is_root}
								<p class="text-xs text-gray-400">No invite codes for this organization.</p>
							{/if}

							<!-- Members -->
							{#if org.members.length > 0}
								<div>
									<h3 class="text-sm font-semibold text-gray-700 mb-2">Members</h3>
									<div class="flex flex-wrap gap-1.5">
										{#each org.members as m (m.principal)}
											<span class="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded-full text-gray-600" title={m.principal}>
												{m.nickname || shortPrincipal(m.principal)}
											</span>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
