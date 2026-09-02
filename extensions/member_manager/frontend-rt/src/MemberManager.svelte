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

	interface MemberSummary {
		principal: string;
		nickname: string;
		avatar: string;
		human_name: string;
		profiles: string[];
		has_member: boolean;
		identity_verification: string;
		tax_compliance: string;
		is_active: boolean;
	}

	interface NotificationItem {
		id: string;
		topic: string;
		title: string;
		message: string;
		sender: string;
		timestamp_ms: number;
		read: boolean;
	}

	let members = $state<MemberSummary[]>([]);
	let loadingList = $state(true);
	let listError = $state('');
	let search = $state('');
	let statusFilter = $state<'all' | 'active' | 'inactive' | 'verified' | 'unverified'>('all');

	let selected = $state<string | null>(null);
	let profile = $state<any>(null);
	let loadingProfile = $state(false);
	let profileError = $state('');
	let tab = $state<'profile' | 'status' | 'messages'>('profile');

	// Shared private data (consent-based decryption)
	let sharedData = $state<Record<string, string> | null>(null);
	let sharedState = $state<'idle' | 'loading' | 'no_access' | 'ready' | 'error'>('idle');
	let sharedError = $state('');

	// Notifications
	let notifications = $state<NotificationItem[]>([]);
	let loadingNotifs = $state(false);
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
				m.nickname.toLowerCase().includes(q) ||
				m.human_name.toLowerCase().includes(q);
			let matchesStatus = true;
			if (statusFilter === 'active') matchesStatus = m.is_active;
			else if (statusFilter === 'inactive') matchesStatus = !m.is_active;
			else if (statusFilter === 'verified') matchesStatus = m.identity_verification === 'verified';
			else if (statusFilter === 'unverified') matchesStatus = m.identity_verification !== 'verified';
			return matchesSearch && matchesStatus;
		})
	);

	async function loadMembers() {
		loadingList = true;
		listError = '';
		try {
			const res: any = await ctx.callSync('list_members');
			members = res?.data?.members ?? [];
		} catch (e: any) {
			listError = String(e?.message ?? e);
		} finally {
			loadingList = false;
		}
	}

	async function selectMember(principal: string) {
		selected = principal;
		tab = 'profile';
		profile = null;
		profileError = '';
		sharedData = null;
		sharedState = 'idle';
		loadingProfile = true;
		try {
			const res: any = await ctx.callSync('get_member_profile', { principal });
			if (res?.success === false) throw new Error(res.error || 'Failed to load profile');
			profile = res?.data ?? null;
			void loadSharedData();
			void loadNotifications();
		} catch (e: any) {
			profileError = String(e?.message ?? e);
		} finally {
			loadingProfile = false;
		}
	}

	async function loadSharedData() {
		if (!profile) return;
		const ciphertext: string = profile.private_data_ciphertext || '';
		if (!ciphertext) {
			sharedState = 'no_access';
			return;
		}
		sharedState = 'loading';
		sharedError = '';
		try {
			const env: any = await ctx.callSync('get_member_private_data_envelope', {
				principal: profile.principal
			});
			if (!env?.success) throw new Error(env?.error || 'envelope lookup failed');
			if (!env.has_access || !env.wrapped_dek) {
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

	async function loadNotifications() {
		if (!selected) return;
		loadingNotifs = true;
		try {
			const res: any = await ctx.callSync('get_member_notifications', { principal: selected });
			notifications = res?.data?.notifications ?? [];
		} catch {
			notifications = [];
		} finally {
			loadingNotifs = false;
		}
	}

	async function sendNotification() {
		if (!selected || !notifTitle.trim() || !notifMessage.trim()) return;
		sending = true;
		sendResult = '';
		try {
			const res: any = await ctx.callSync('send_member_notification', {
				principal: selected,
				title: notifTitle.trim(),
				message: notifMessage.trim()
			});
			if (res?.success === false) throw new Error(res.error || 'send failed');
			sendResult = 'Sent.';
			notifTitle = '';
			notifMessage = '';
			await loadNotifications();
		} catch (e: any) {
			sendResult = `Error: ${String(e?.message ?? e)}`;
		} finally {
			sending = false;
		}
	}

	function initials(m: { nickname: string; human_name: string; principal: string }): string {
		const base = m.human_name || m.nickname || m.principal;
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

	function fmtTime(ms: number): string {
		if (!ms) return '';
		try {
			return new Date(ms).toLocaleString();
		} catch {
			return '';
		}
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
										{m.nickname || m.human_name || 'Unnamed'}
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
			{:else if loadingProfile}
				<p class="text-sm text-gray-500">{t('loading_profile')}</p>
			{:else if profileError}
				<p class="text-sm text-red-600">{profileError}</p>
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
									<dt class="text-gray-500 dark:text-gray-400">Name</dt>
									<dd class="text-gray-900 dark:text-white">{profile.human?.name || '—'}</dd>
								</div>
								<div>
									<dt class="text-gray-500 dark:text-gray-400">Date of birth</dt>
									<dd class="text-gray-900 dark:text-white">{profile.human?.date_of_birth || '—'}</dd>
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
										{#each profile.identities ?? [] as id}
											<span
												class="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
												>{id.type}</span
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
							{#if profile.member}
								<div
									class="mb-4 p-3 rounded-lg {profile.member.is_active
										? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
										: 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'}"
								>
									<p class="text-sm font-medium {profile.member.is_active ? 'text-green-800 dark:text-green-200' : 'text-gray-600 dark:text-gray-300'}">
										{profile.member.is_active ? t('active_member') : t('inactive_member')}
									</p>
								</div>
								<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
									{#each [['Identity verification', profile.member.identity_verification], ['Tax compliance', profile.member.tax_compliance], ['Residence permit', profile.member.residence_permit], ['Voting eligibility', profile.member.voting_eligibility], ['Public benefits', profile.member.public_benefits_eligibility]] as [label, value]}
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

							{#if loadingNotifs}
								<p class="text-sm text-gray-500">{t('loading_messages')}</p>
							{:else if notifications.length === 0}
								<p class="text-sm text-gray-500">{t('no_messages')}</p>
							{:else}
								<ul class="space-y-2">
									{#each notifications as n (n.id)}
										<li class="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
											<div class="flex items-center justify-between">
												<span class="text-sm font-medium text-gray-900 dark:text-white">{n.title}</span>
												<span class="text-xs text-gray-400">{fmtTime(n.timestamp_ms)}</span>
											</div>
											<p class="text-sm text-gray-600 dark:text-gray-300 mt-1">{n.message}</p>
										</li>
									{/each}
								</ul>
							{/if}
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
	{/key}
</div>
