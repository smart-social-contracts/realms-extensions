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

	/** The realm's public user card (user_list / user_get). */
	interface MemberCard {
		id: string;
		nickname: string;
		avatar: string;
		home_quarter: string;
		status: string;
		profiles: string[];
	}

	interface SentNotification {
		id: string;
		title: string;
		message: string;
		timestamp_ms: number;
	}

	type Reply = { ok?: boolean; error?: unknown; [key: string]: unknown };

	let members = $state<MemberCard[]>([]);
	let loadingList = $state(true);
	let listError = $state('');
	let search = $state('');
	let statusFilter = $state<'all' | 'active' | 'inactive'>('all');

	let selected = $state<string | null>(null);
	let profile = $state<MemberCard | null>(null);
	let loadingProfile = $state(false);
	let profileError = $state('');
	let tab = $state<'profile' | 'status' | 'messages'>('profile');

	// The realm keeps no history of what was sent to another member that we may read; show this session's.
	let sentByMember = $state<Record<string, SentNotification[]>>({});
	const notifications = $derived(selected ? (sentByMember[selected] ?? []) : []);
	let notifTitle = $state('');
	let notifMessage = $state('');
	let sending = $state(false);
	let sendResult = $state('');

	const filtered = $derived(
		members.filter((m) => {
			const q = search.trim().toLowerCase();
			const matchesSearch =
				!q || m.id.toLowerCase().includes(q) || m.nickname.toLowerCase().includes(q);
			let matchesStatus = true;
			if (statusFilter === 'active') matchesStatus = m.status === 'active';
			else if (statusFilter === 'inactive') matchesStatus = m.status !== 'active';
			return matchesSearch && matchesStatus;
		})
	);

	/** A declared realm operation: its reply, or an Error carrying the realm's message. */
	async function op<T = Reply>(name: string, args: Record<string, unknown> = {}, read = true): Promise<T> {
		const reply = (await (read ? ctx.read(name, args) : ctx.run(name, args))) as Reply;
		if (!reply?.ok) throw new Error(String(reply?.error ?? `${name} did not answer`));
		return reply as T;
	}

	function asCard(raw: any): MemberCard {
		return {
			id: String(raw?.id ?? ''),
			nickname: String(raw?.nickname ?? ''),
			avatar: String(raw?.avatar ?? ''),
			home_quarter: String(raw?.home_quarter ?? ''),
			status: String(raw?.status ?? ''),
			profiles: Array.isArray(raw?.profiles) ? raw.profiles.map(String) : []
		};
	}

	function reason(e: unknown): string {
		return String((e as { message?: unknown })?.message ?? e);
	}

	async function loadMembers() {
		loadingList = true;
		listError = '';
		try {
			const all: MemberCard[] = [];
			let from: number | null = 1;
			for (let pages = 0; from != null && pages < 20; pages++) {
				const res: { users?: unknown[]; next?: number | null } = await op('user_list', { from, count: 500 });
				all.push(...(res.users ?? []).map(asCard).filter((m) => m.id));
				from = res.next ?? null;
			}
			members = all;
		} catch (e) {
			members = [];
			listError = reason(e);
		} finally {
			loadingList = false;
		}
	}

	async function selectMember(principal: string) {
		selected = principal;
		tab = 'profile';
		profile = null;
		profileError = '';
		sendResult = '';
		loadingProfile = true;
		try {
			const res: { user?: unknown } = await op('user_get', { user: principal });
			profile = asCard(res.user);
		} catch (e) {
			profileError = reason(e);
		} finally {
			loadingProfile = false;
		}
	}

	async function sendNotification() {
		const to = selected;
		const title = notifTitle.trim();
		const message = notifMessage.trim();
		if (!to || !title || !message) return;
		sending = true;
		sendResult = '';
		try {
			const res: { notification?: unknown } = await op(
				'notification_send',
				{ recipient: `User:${to}`, title, body: message, topic: 'admin', href: '/notifications' },
				false
			);
			const sent: SentNotification = {
				id: String(res.notification ?? `${Date.now()}`),
				title,
				message,
				timestamp_ms: Date.now()
			};
			sentByMember = { ...sentByMember, [to]: [sent, ...(sentByMember[to] ?? [])] };
			sendResult = t('notification_sent');
			notifTitle = '';
			notifMessage = '';
		} catch (e) {
			sendResult = t('send_failed', { reason: reason(e) });
		} finally {
			sending = false;
		}
	}

	function initials(m: { nickname: string; id: string }): string {
		const base = m.nickname || m.id;
		return base.slice(0, 2).toUpperCase();
	}

	function badgeColor(value: string): string {
		if (value === 'active')
			return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
		if (value === 'suspended')
			return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
		if (value === 'banned')
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
				</select>
			</div>

			{#if loadingList}
				<p class="text-sm text-gray-500">{t('loading_members')}</p>
			{:else if listError}
				<p class="text-sm text-gray-600 dark:text-gray-300">{t('members_unavailable')}</p>
				<p class="text-xs text-gray-400 break-words">{listError}</p>
			{:else if filtered.length === 0}
				<p class="text-sm text-gray-500">{t('no_members_match')}</p>
			{:else}
				<ul class="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
					{#each filtered as m (m.id)}
						<li>
							<button
								class="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 transition-colors {selected ===
								m.id
									? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
									: 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'}"
								onclick={() => selectMember(m.id)}
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
									<span class="block truncate text-xs font-mono text-gray-400">{m.id}</span>
								</span>
								<span class="flex-shrink-0 flex flex-col items-end gap-1">
									{#if m.status === 'active'}
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
				<p class="text-sm text-gray-600 dark:text-gray-300">{t('profile_unavailable')}</p>
				<p class="text-xs text-gray-400 break-words">{profileError}</p>
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
										{profile.id}
										<button
											class="text-xs text-blue-600 hover:underline"
											onclick={() => copy(profile?.id ?? '')}>copy</button
										>
									</dd>
								</div>
								<div>
									<dt class="text-gray-500 dark:text-gray-400">Nickname</dt>
									<dd class="text-gray-900 dark:text-white">{profile.nickname || '—'}</dd>
								</div>
								<div>
									<dt class="text-gray-500 dark:text-gray-400">Home quarter</dt>
									<dd class="text-gray-900 dark:text-white">{profile.home_quarter || '—'}</dd>
								</div>
								<div class="sm:col-span-2">
									<dt class="text-gray-500 dark:text-gray-400">Profiles</dt>
									<dd class="flex flex-wrap gap-1 mt-1">
										{#each profile.profiles as p}
											<span class="px-2 py-0.5 rounded text-xs {badgeColor('')}">{p}</span>
										{:else}
											<span class="text-gray-400">—</span>
										{/each}
									</dd>
								</div>
							</dl>

							<!-- Private data: the realm hands another member's ciphertext to nobody but them. -->
							<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
								<div class="flex items-center justify-between mb-2">
									<h4 class="text-sm font-semibold text-gray-900 dark:text-white">
										Private data
									</h4>
								</div>
								<div
									class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
								>
									<p class="text-sm text-gray-600 dark:text-gray-300">{t('private_data_unavailable')}</p>
								</div>
							</div>
						{:else if tab === 'status'}
							{#if profile.status}
								<div
									class="mb-4 p-3 rounded-lg {profile.status === 'active'
										? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
										: 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'}"
								>
									<p class="text-sm font-medium {profile.status === 'active' ? 'text-green-800 dark:text-green-200' : 'text-gray-600 dark:text-gray-300'}">
										{profile.status === 'active' ? t('active_member') : t('inactive_member')}
									</p>
								</div>
								<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
									<div>
										<dt class="text-gray-500 dark:text-gray-400">{t('membership_status')}</dt>
										<dd class="mt-1">
											<span class="px-2 py-0.5 rounded text-xs {badgeColor(profile.status)}">{profile.status}</span>
										</dd>
									</div>
								</dl>
								<p class="mt-4 text-xs text-gray-500 dark:text-gray-400">{t('status_details_unavailable')}</p>
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

							<p class="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('messages_history_note')}</p>
							{#if notifications.length === 0}
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
