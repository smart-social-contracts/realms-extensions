<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';

	let { ctx }: { ctx: any } = $props();

	const cn = $derived(ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' ')));

	let loading = $state(true);
	let error: string | null = $state(null);
	let data: any = $state(null);
	let expandedOrg: string | null = $state(null);
	let regenerating: string | null = $state(null);

	function addToast(text: string, type: 'success' | 'error' = 'success') {
		const level = type === 'error' ? 'error' : 'success';
		if (typeof ctx.notify === 'function') {
			ctx.notify(level, text);
			return;
		}
		console.warn('[extension]', level, text);
	}

	async function call(name: string, args: Record<string, unknown> = {}, read = true) {
		const res = await (read ? ctx.read(name, args) : ctx.run(name, args));
		if (!res.ok) throw new Error(res.error);
		return res;
	}

	async function pages(name: string, key: string, read = true): Promise<any[]> {
		const out: any[] = [];
		let from: number | null = 1;
		while (from) {
			const res = await call(name, { from, count: 500 }, read);
			out.push(...res[key]);
			from = res.next;
		}
		return out;
	}

	function projectInvite(i: any) {
		const now = Date.now() / 1000;
		return {
			id: i.id,
			code_hash: i.id.slice(0, 8),
			profile: i.profile,
			position: i.position,
			url: '',
			uses_count: i.uses,
			max_uses: i.max_uses,
			is_valid: !i.revoked && i.uses < i.max_uses && (!i.expires_at || now < i.expires_at),
			revoked: i.revoked,
		};
	}

	async function load() {
		loading = true;
		error = null;
		try {
			const [info, setup, directory, departments, invites, users] = await Promise.all([
				call('realm_info'),
				call('setup_state', {}, false),
				call('quarter_directory'),
				pages('department_list', 'departments'),
				pages('invite_list', 'invites', false),
				pages('user_list', 'users'),
			]);
			let profiles: string[] = [];
			ctx.userProfiles?.subscribe?.((v: string[]) => (profiles = v || []))?.();
			const nick = new Map(users.map((u) => [u.id, u.nickname]));
			const person = (principal: string) => ({ principal, nickname: nick.get(principal) || '' });
			const details = await Promise.all(departments.map((d) => call('department_get', { department: d.id })));
			const checklist = [...setup.done.map((id: string) => [id, true]), ...setup.todo.map((id: string) => [id, false])].map(
				([id, done]) => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' '), detail: '', done }),
			);
			data = {
				realm: { name: info.realm.name, status: info.realm.status },
				checklist,
				checklist_done: setup.done.length,
				checklist_total: checklist.length,
				quarters: directory.quarters.map((q: any) => ({ ...q, canister_id: q.id })),
				is_admin: profiles.includes('admin'),
				organizations: details
					.map(({ department, positions }) => {
						const holders = positions.flatMap((p: any) => p.holders.map((h: any) => h.user));
						const members = [...new Set([department.head, ...holders].filter(Boolean))].map(person);
						return {
							name: department.id,
							description: department.description,
							is_root: department.is_root,
							member_count: members.length,
							members,
							policy: { threshold_m: department.policy.m, threshold_n: department.policy.n },
							invites: invites.filter((i) => i.department === department.id).map(projectInvite),
							positions: positions.map((p: any) => ({
								key: p.id,
								title: p.title,
								profile: p.profile,
								headcount: p.headcount,
								filled: p.filled,
								salary_amount: p.salary,
								salary_period: p.salary_period,
								holders: p.holders.map((h: any) => person(h.user)),
							})),
						};
					})
					.sort((a, b) => Number(b.is_root) - Number(a.is_root) || a.name.localeCompare(b.name)),
			};
		} catch (e: any) {
			error = e?.message || 'Failed to load console data';
		} finally {
			loading = false;
		}
	}

	/** Copy text in portal iframes where Clipboard API is blocked by permissions policy. */
	async function copyTextToClipboard(text: string): Promise<boolean> {
		const execCopy = (): boolean => {
			try {
				const ta = document.createElement('textarea');
				ta.value = text;
				ta.setAttribute('readonly', '');
				ta.style.position = 'fixed';
				ta.style.left = '-9999px';
				document.body.appendChild(ta);
				ta.select();
				const ok = document.execCommand('copy');
				document.body.removeChild(ta);
				return ok;
			} catch {
				return false;
			}
		};

		if (execCopy()) return true;

		if (navigator.clipboard?.writeText) {
			try {
				await navigator.clipboard.writeText(text);
				return true;
			} catch {
				// Permissions policy blocks Clipboard API in embedded realm iframes.
			}
		}

		try {
			ctx.host?.dispatch?.({ type: 'clipboard.write', text });
			return true;
		} catch {
			return false;
		}
	}

	async function copyInviteUrl(invite: any) {
		if (!invite.url) {
			addToast('No URL available for this invite (frontend URL not configured)', 'error');
			return;
		}
		if (await copyTextToClipboard(invite.url)) {
			addToast(`Invite URL for ${invite.profile} copied`);
		} else {
			addToast('Could not copy to clipboard', 'error');
		}
	}

	/** Revoke the department's invites for ``profile`` and mint one replacement; its code is shown only now. */
	async function regenerate(orgName: string, profile: string) {
		regenerating = `${orgName}/${profile}`;
		try {
			const old = data.organizations
				.find((o: any) => o.name === orgName)
				.invites.filter((i: any) => i.profile === profile);
			for (const i of old.filter((i: any) => !i.revoked)) await call('invite_revoke', { invite: i.id }, false);
			const { invite } = await call(
				'invite_create',
				{ profile, department: orgName, position: old[0]?.position || '', max_uses: 100, expires_in: 720 * 3600 },
				false,
			);
			const url = `${location.origin}/join?invite=${invite.code}`;
			addToast(
				(await copyTextToClipboard(url))
					? `New invite generated for ${profile}; its URL is copied and will not be shown again`
					: `New invite generated for ${profile}: ${url} (it will not be shown again)`,
			);
			await load();
		} catch (e: any) {
			addToast(e?.message || 'Failed to regenerate invite', 'error');
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

	const progressPercent = $derived(
		data && data.checklist_total > 0
			? Math.round((data.checklist_done / data.checklist_total) * 100)
			: 0,
	);

	// Initial fetch on component init (no reactive dependencies).
	load();
</script>

<div class="w-full py-4 sm:py-6">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">Migration Console</h1>
		<p class="text-sm text-gray-500 mt-1">{extensionDescription}</p>
	</div>

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

		<!-- Migration status: citizens / quarters (currency is edited in Realm Settings) -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
			<div class="border border-gray-200 rounded-xl p-4">
				<h3 class="text-sm font-semibold text-gray-700 mb-2">Citizen import</h3>
				<p class="text-sm text-gray-400">Citizen import progress is not supported by this realm version.</p>
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
		</div>

		<!-- Citizen import panel (admin) -->
		{#if data.is_admin}
			<div class="border border-gray-200 rounded-xl p-4 sm:p-5 mb-6">
				<div class="flex items-center justify-between mb-2">
					<h2 class="text-lg font-semibold text-gray-800">Import citizens</h2>
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
						disabled
					>
						Import
					</button>
					<span class="text-xs text-amber-700">
						Importing citizens is not supported by this realm version: generate registration letters in
						Import &amp; Export, which mints one invite per citizen.
					</span>
				</div>
			</div>
		{/if}

		<!-- Departments -->
		<div class="space-y-4">
			<h2 class="text-lg font-semibold text-gray-800">
				Departments ({data.organizations.length})
			</h2>

			{#if data.organizations.length === 0}
				<p class="text-center text-gray-500 py-8">
					No departments yet — install a codex with a department template.
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

							<!-- Position seats with fill state (issue #241) -->
							{#if org.positions?.length > 0}
								<div>
									<h3 class="text-sm font-semibold text-gray-700 mb-2">Positions</h3>
									<div class="space-y-2">
										{#each org.positions as pos (pos.key)}
											<div class="flex items-center justify-between gap-2 p-2 bg-white border border-gray-200 rounded-lg">
												<div class="min-w-0">
													<span class="text-sm font-medium text-gray-800">{pos.title}</span>
													<span class="ml-2 text-xs text-gray-400">profile: {pos.profile}</span>
													{#if pos.salary_amount > 0}
														<span class="ml-2 text-xs text-gray-400">{pos.salary_amount}/{pos.salary_period}</span>
													{/if}
													{#if pos.holders?.length > 0}
														<div class="mt-1 flex flex-wrap gap-1">
															{#each pos.holders as h (h.principal)}
																<span class="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded-full text-gray-600" title={h.principal}>
																	{h.nickname || shortPrincipal(h.principal)}
																</span>
															{/each}
														</div>
													{/if}
												</div>
												<span class={cn(
													'text-xs font-medium shrink-0',
													pos.filled >= pos.headcount ? 'text-green-600' : 'text-amber-600'
												)}>
													{pos.filled}/{pos.headcount} filled
												</span>
											</div>
										{/each}
									</div>
								</div>
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
								<p class="text-xs text-gray-400">No invite codes for this department.</p>
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
