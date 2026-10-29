<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { loadExtensionI18n, t } from './lib/i18n';

	let { ctx }: { ctx: any } = $props();

	let i18nTick = $state(0);

	$effect(() => {
		const localeStore = ctx?.locale;
		if (!localeStore?.subscribe) {
			void loadExtensionI18n('en').then(() => {
				i18nTick++;
			});
			return;
		}
		const unsub = localeStore.subscribe((loc: string | null | undefined) => {
			void loadExtensionI18n(loc || 'en').then(() => {
				i18nTick++;
			});
		});
		return unsub;
	});

	const TAB_KEYS = ['profile', 'status', 'messages'] as const;

	function tabLabel(tabKey: typeof TAB_KEYS[number]): string {
		void i18nTick;
		return t(`tab_${tabKey}`);
	}

	interface Identity {
		kind: string;
		status: string;
	}

	interface MemberSummary {
		principal: string;
		nickname: string;
		avatar: string;
		home_quarter: string;
		status: string;
		profiles: string[];
		date_of_birth: string;
		identities: Identity[];
		identity_verification: string;
		is_active: boolean;
	}

	let members = $state<MemberSummary[]>([]);
	let loadingList = $state(true);
	let listError = $state('');
	let search = $state('');
	let statusFilter = $state<'all' | 'active' | 'inactive' | 'verified' | 'unverified'>('all');

	let selected = $state<string | null>(null);
	let profile = $state<any>(null);
	let tab = $state<'profile' | 'status' | 'messages'>('profile');

	// Shared private data (consent-based decryption)
	let sharedData = $state<Record<string, string> | null>(null);
	let sharedState = $state<'idle' | 'loading' | 'no_access' | 'ready' | 'error'>('idle');
	let sharedError = $state('');

	// Notifications
	let notifTitle = $state('');
	let notifMessage = $state('');
	let sending = $state(false);
	let sendResult = $state('');

	const filtered = $derived(
		members.filter((m) => {
			const q = search.trim().toLowerCase();
			const matchesSearch =
				!q ||
				m.principal.toLowerCase().includes(q) ||
				m.nickname.toLowerCase().includes(q);
			let matchesStatus = true;
			if (statusFilter === 'active') matchesStatus = m.is_active;
			else if (statusFilter === 'inactive') matchesStatus = !m.is_active;
			else if (statusFilter === 'verified') matchesStatus = m.identity_verification === 'verified';
			else if (statusFilter === 'unverified') matchesStatus = m.identity_verification !== 'verified';
			return matchesSearch && matchesStatus;
		})
	);

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

	async function loadMembers() {
		loadingList = true;
		listError = '';
		try {
			const [users, humans, identities] = await Promise.all([
				pages('user_list', 'users'),
				pages('realm_export', 'rows', { entity: 'Human' }),
				pages('realm_export', 'rows', { entity: 'Identity' })
			]);
			const userOf = new Map<string, string>(humans.map((h) => [h.id, h.user]));
			const birth = new Map<string, string>(humans.map((h) => [h.user, h.date_of_birth]));
			const held = new Map<string, Identity[]>();
			for (const i of identities) {
				const user = userOf.get(i.human) ?? '';
				held.set(user, [...(held.get(user) ?? []), { kind: i.kind, status: i.status }]);
			}
			members = users.map((u) => {
				const ids = held.get(u.id) ?? [];
				return {
					principal: u.id,
					nickname: u.nickname,
					avatar: u.avatar,
					home_quarter: u.home_quarter,
					status: u.status,
					profiles: u.profiles,
					date_of_birth: birth.get(u.id) ?? '',
					identities: ids,
					identity_verification: ids.some((i) => i.status === 'verified')
						? 'verified'
						: ids.some((i) => i.status === 'pending')
							? 'pending'
							: '',
					is_active: u.status === 'active'
				};
			});
		} catch (e: any) {
			listError = String(e?.message ?? e);
		} finally {
			loadingList = false;
		}
	}

	async function privateData(principal: string): Promise<string> {
		for (let from: number | null = 1; from; ) {
			const page = await ctx.read('realm_export', { entity: 'User', from, count: 100 });
			if (!page.ok) throw new Error(page.error);
			const row = page.rows.find((u: any) => u.id === principal);
			if (row) return row.private_data;
			from = page.next;
		}
		return '';
	}

	function selectMember(principal: string) {
		selected = principal;
		tab = 'profile';
		sharedData = null;
		sharedState = 'idle';
		profile = members.find((m) => m.principal === principal) ?? null;
		void loadSharedData();
	}

	async function loadSharedData() {
		if (!profile) return;
		sharedState = 'loading';
		sharedError = '';
		try {
			const ciphertext = await privateData(profile.principal);
			if (!ciphertext) {
				sharedState = 'no_access';
				return;
			}
			const env = await ctx.read('crypto_envelope', { scope: `user:${profile.principal}:private` });
			if (!env.ok || !env.wrapped_dek) {
				sharedState = 'no_access';
				return;
			}
			const decrypted = await ctx.crypto.decryptWithEnvelope(env.wrapped_dek, ciphertext);
			if (decrypted) {
				sharedData = decrypted;
				sharedState = 'ready';
			} else {
				sharedState = 'error';
				sharedError = 'Could not decrypt shared data with your key.';
			}
		} catch (e: any) {
			sharedState = 'error';
			sharedError = String(e?.message ?? e);
		}
	}

	async function sendNotification() {
		if (!selected || !notifTitle.trim() || !notifMessage.trim()) return;
		sending = true;
		sendResult = '';
		try {
			const res = await ctx.run('notification_send', {
				recipient: `User:${selected}`,
				title: notifTitle.trim(),
				body: notifMessage.trim(),
				topic: 'admin',
				href: '/notifications'
			});
			if (!res.ok) throw new Error(res.error);
			sendResult = 'Sent.';
			notifTitle = '';
			notifMessage = '';
		} catch (e: any) {
			sendResult = `Error: ${String(e?.message ?? e)}`;
		} finally {
			sending = false;
		}
	}

	function initials(m: { nickname: string; principal: string }): string {
		const base = m.nickname || m.principal;
		return base.slice(0, 2).toUpperCase();
	}

	function badgeColor(value: string): string {
		if (value === 'verified' || value === 'compliant' || value === 'eligible')
			return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
		if (value === 'pending')
			return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
		if (value === 'suspended' || value === 'revoked')
			return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
		return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
	}

	function copy(text: string) {
		try {
			navigator.clipboard?.writeText(text);
		} catch {
			/* ignore */
		}
	}

	$effect(() => {
		loadMembers();
	});
</script>

<div class="p-4">
	{#key i18nTick}
	<div class="mb-4">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">{t('page_title')}</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400">{extensionDescription}</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
		<!-- Left: roster -->
		<div class="lg:col-span-1">
			<div class="mb-3 space-y-2">
				<input
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
					placeholder={t('search_placeholder')}
					bind:value={search}
				/>
				<select
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
					bind:value={statusFilter}
				>
					<option value="all">{t('filter_all')}</option>
					<option value="active">{t('filter_active')}</option>
					<option value="inactive">{t('filter_inactive')}</option>
					<option value="verified">{t('filter_verified')}</option>
					<option value="unverified">{t('filter_unverified')}</option>
				</select>
			</div>

			{#if loadingList}
				<p class="text-sm text-gray-500">{t('loading_members')}</p>
			{:else if listError}
				<p class="text-sm text-red-600">{listError}</p>
			{:else if filtered.length === 0}
				<p class="text-sm text-gray-500">{t('no_members_match')}</p>
			{:else}
				<ul class="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
					{#each filtered as m (m.principal)}
						<li>
							<button
								class="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 transition-colors {selected ===
								m.principal
									? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
									: 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'}"
								onclick={() => selectMember(m.principal)}
							>
								<span
									class="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center text-xs font-semibold"
								>
									{initials(m)}
								</span>
								<span class="min-w-0 flex-1">
									<span class="block truncate text-sm font-medium text-gray-900 dark:text-white">
										{m.nickname || 'Unnamed'}
									</span>
									<span class="block truncate text-xs font-mono text-gray-400">{m.principal}</span>
								</span>
								<span class="flex-shrink-0 flex flex-col items-end gap-1">
									{#if m.is_active}
										<span class="w-2 h-2 rounded-full bg-green-500" title="Active"></span>
									{:else}
										<span class="w-2 h-2 rounded-full bg-gray-400" title="Inactive"></span>
									{/if}
								</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<!-- Right: detail -->
		<div class="lg:col-span-2">
			{#if !selected}
				<div
					class="flex items-center justify-center h-64 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400"
				>
					{t('select_member')}
				</div>
			{:else if profile}
				<div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
					<!-- Tabs -->
					<div class="flex border-b border-gray-200 dark:border-gray-700">
						{#each TAB_KEYS as tabKey}
							<button
								class="px-4 py-2 text-sm font-medium capitalize {tab === tabKey
									? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
									: 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}"
								onclick={() => (tab = tabKey)}
							>
								{tabLabel(tabKey)}
							</button>
						{/each}
					</div>

					<div class="p-4">
						{#if tab === 'profile'}
							<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
								<div class="sm:col-span-2">
									<dt class="text-gray-500 dark:text-gray-400">Principal</dt>
									<dd class="flex items-center gap-2 font-mono break-all text-gray-900 dark:text-white">
										{profile.principal}
										<button
											class="text-xs text-blue-600 hover:underline"
											onclick={() => copy(profile.principal)}>copy</button
										>
									</dd>
								</div>
								<div>
									<dt class="text-gray-500 dark:text-gray-400">Nickname</dt>
									<dd class="text-gray-900 dark:text-white">{profile.nickname || '—'}</dd>
								</div>
								<div>
									<dt class="text-gray-500 dark:text-gray-400">Date of birth</dt>
									<dd class="text-gray-900 dark:text-white">{profile.date_of_birth || '—'}</dd>
								</div>
								<div>
									<dt class="text-gray-500 dark:text-gray-400">Home quarter</dt>
									<dd class="text-gray-900 dark:text-white">{profile.home_quarter || '—'}</dd>
								</div>
								<div class="sm:col-span-2">
									<dt class="text-gray-500 dark:text-gray-400">Profiles</dt>
									<dd class="flex flex-wrap gap-1 mt-1">
										{#each profile.profiles ?? [] as p}
											<span class="px-2 py-0.5 rounded text-xs {badgeColor('')}">{p}</span>
										{:else}
											<span class="text-gray-400">—</span>
										{/each}
									</dd>
								</div>
								<div class="sm:col-span-2">
									<dt class="text-gray-500 dark:text-gray-400">Verified identities</dt>
									<dd class="flex flex-wrap gap-1 mt-1">
										{#each profile.identities.filter((i: Identity) => i.status === 'verified') as id}
											<span
												class="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
												>{id.kind}</span
											>
										{:else}
											<span class="text-gray-400">None</span>
										{/each}
									</dd>
								</div>
							</dl>

							<!-- Shared private data -->
							<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
								<div class="flex items-center justify-between mb-2">
									<h4 class="text-sm font-semibold text-gray-900 dark:text-white">
										Private data
									</h4>
									{#if sharedState === 'ready'}
										<span
											class="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
											>Shared with you</span
										>
									{/if}
								</div>
								{#if sharedState === 'loading'}
									<p class="text-sm text-gray-500">Decrypting…</p>
								{:else if sharedState === 'ready' && sharedData}
									<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
										{#each Object.entries(sharedData) as [k, v]}
											<div>
												<dt class="text-gray-500 dark:text-gray-400 capitalize">{k.replace(/_/g, ' ')}</dt>
												<dd class="text-gray-900 dark:text-white break-words">{v || '—'}</dd>
											</div>
										{/each}
									</dl>
								{:else if sharedState === 'no_access'}
									<div
										class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
									>
										<p class="text-sm text-gray-600 dark:text-gray-300">
											This member's private data is end-to-end encrypted and has not been shared with
											you. Ask the member to enable data sharing with administrators.
										</p>
									</div>
								{:else if sharedState === 'error'}
									<p class="text-sm text-red-600">{sharedError}</p>
								{/if}
							</div>
						{:else if tab === 'status'}
							{#if profile.status}
								<div
									class="mb-4 p-3 rounded-lg {profile.is_active
										? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
										: 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'}"
								>
									<p class="text-sm font-medium {profile.is_active ? 'text-green-800 dark:text-green-200' : 'text-gray-600 dark:text-gray-300'}">
										{profile.is_active ? t('active_member') : t('inactive_member')}
									</p>
								</div>
								<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
									{#each [['Membership status', profile.status], ['Identity verification', profile.identity_verification]] as [label, value]}
										<div>
											<dt class="text-gray-500 dark:text-gray-400">{label}</dt>
											<dd class="mt-1">
												<span class="px-2 py-0.5 rounded text-xs {badgeColor(value)}">{value || '—'}</span>
											</dd>
										</div>
									{/each}
								</dl>
							{:else}
								<p class="text-sm text-gray-500">{t('not_member')}</p>
							{/if}
						{:else if tab === 'messages'}
							<div class="mb-4 space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
								<input
									class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
									placeholder={t('notif_title_placeholder')}
									bind:value={notifTitle}
								/>
								<textarea
									class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
									rows="2"
									placeholder={t('notif_message_placeholder')}
									bind:value={notifMessage}
								></textarea>
								<div class="flex items-center gap-3">
									<button
										class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
										onclick={sendNotification}
										disabled={sending || !notifTitle.trim() || !notifMessage.trim()}
									>
										{sending ? t('sending') : t('send_notification')}
									</button>
									{#if sendResult}
										<span class="text-sm text-gray-500">{sendResult}</span>
									{/if}
								</div>
							</div>

							<p class="text-sm text-gray-500">
								A member's message history is not supported by this realm version.
							</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
	{/key}
</div>
