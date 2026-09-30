<script lang="ts">
	let { ctx }: { ctx: any } = $props();

	let items = $state<any[]>([]);
	let unreadCount = $state(0);
	let loading = $state(true);
	let selectedTab = $state<'all' | 'unread'>('all');
	let expandedId = $state<string | null>(null);

	$effect(() => {
		const u = ctx.notifications?.items?.subscribe?.((v: any) => {
			items = v ?? [];
		});
		return () => u?.();
	});

	$effect(() => {
		const u = ctx.notifications?.unreadCount?.subscribe?.((v: any) => {
			unreadCount = v ?? 0;
		});
		return () => u?.();
	});

	$effect(() => {
		ctx.notifications?.load?.().then(() => {
			loading = false;
		}).catch(() => {
			loading = false;
		});
	});

	let filtered = $derived(
		selectedTab === 'unread' ? items.filter((n) => !n.read) : items,
	);

	let localUnreadCount = $derived(items.filter((n) => !n.read).length);

	function handleNavigate(href: string) {
		ctx.navigate(href);
	}

	async function handleMarkAsRead(id: string) {
		await ctx.notifications?.markAsRead?.(id);
	}

	async function handleToggleRead(e: Event, notification: any) {
		e.stopPropagation();
		await ctx.notifications?.markAsRead?.(notification.id, !notification.read);
	}

	async function markAllAsRead() {
		const unread = items.filter((n) => !n.read);
		for (const n of unread) {
			await ctx.notifications?.markAsRead?.(n.id);
		}
	}

	function toggleExpand(id: string) {
		expandedId = expandedId === id ? null : id;
	}

	function getColorClass(color?: string) {
		switch (color) {
			case 'green': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
			case 'blue': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
			case 'purple': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
			case 'red': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
			default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
		}
	}

	function formatRelativeTime(ts: number | string): string {
		if (!ts) return '';
		const d = typeof ts === 'number' ? ts : Date.parse(String(ts));
		if (isNaN(d)) return String(ts);
		const diffMs = Date.now() - d;
		if (diffMs < 0) return 'just now';
		const seconds = Math.floor(diffMs / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d ago`;
		const months = Math.floor(days / 30);
		if (months < 12) return `${months}mo ago`;
		return `${Math.floor(months / 12)}y ago`;
	}

	function formatFullDate(ts: number | string): string {
		if (!ts) return '';
		const d = new Date(typeof ts === 'number' ? ts : Date.parse(String(ts)));
		if (isNaN(d.getTime())) return String(ts);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
	}
</script>

<div class="w-full py-6">
	<!-- Header -->
	<div class="flex flex-wrap justify-between items-center mb-6 gap-3">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				{localUnreadCount > 0
					? `${localUnreadCount} unread notification${localUnreadCount > 1 ? 's' : ''}`
					: 'No unread notifications'}
			</p>
		</div>
		{#if localUnreadCount > 0}
			<button
				onclick={markAllAsRead}
				class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				Mark all read
			</button>
		{/if}
	</div>

	<!-- Tabs -->
	<div class="flex border-b border-gray-200 dark:border-gray-700 mb-6">
		<button
			class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors {selectedTab === 'all'
				? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
				: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
			onclick={() => (selectedTab = 'all')}
		>
			All ({items.length})
		</button>
		<button
			class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors {selectedTab === 'unread'
				? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
				: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
			onclick={() => (selectedTab = 'unread')}
		>
			Unread ({localUnreadCount})
		</button>
	</div>

	<!-- Content -->
	{#if loading}
		<div class="flex items-center justify-center py-16">
			<svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
			<span class="ml-3 text-gray-500 dark:text-gray-400">Loading notifications...</span>
		</div>
	{:else if filtered.length === 0}
		<div class="text-center py-16">
			<svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
			</svg>
			<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
				{selectedTab === 'unread' ? 'No unread notifications' : 'No notifications'}
			</h3>
			<p class="text-gray-500 dark:text-gray-400">
				{selectedTab === 'unread'
					? "You're all caught up!"
					: 'Notifications will appear here when available.'}
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each filtered as notification (notification.id)}
				<div
					class="rounded-lg border bg-white dark:bg-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-750 {!notification.read
						? 'border-l-4 border-l-indigo-500 border-t border-r border-b border-gray-200 dark:border-gray-700'
						: 'border border-gray-200 dark:border-gray-700'}"
				>
					<button
						class="w-full text-left p-4"
						onclick={() => toggleExpand(notification.id)}
					>
						<div class="flex items-start gap-4">
							<!-- Icon -->
							<div class="flex-shrink-0">
								<div class="w-10 h-10 rounded-full flex items-center justify-center {getColorClass(notification.color)}">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
									</svg>
								</div>
							</div>

							<!-- Content -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
										{notification.title || notification.type || 'Notification'}
									</h4>
									{#if !notification.read}
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
											New
										</span>
									{/if}
								</div>
								{#if notification.timestamp_ms || notification.timestamp || notification.created_at}
									<span
										class="text-xs text-gray-400 dark:text-gray-500"
										title={formatFullDate(notification.timestamp_ms || notification.timestamp || notification.created_at)}
									>
										{formatRelativeTime(notification.timestamp_ms || notification.timestamp || notification.created_at)}
									</span>
								{/if}
							</div>

							<!-- Expand chevron -->
							<svg
								class="w-5 h-5 text-gray-400 transition-transform flex-shrink-0 {expandedId === notification.id ? 'rotate-180' : ''}"
								fill="none" stroke="currentColor" viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</div>
					</button>

					<!-- Expanded content -->
					{#if expandedId === notification.id}
						<div class="px-4 pb-4 pt-0">
							<div class="pl-14">
								{#if notification.message || notification.body}
									<p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3">
										{notification.message || notification.body}
									</p>
								{/if}

								{#if notification.href}
									<div class="border-t border-gray-100 dark:border-gray-700 pt-3 mb-3">
										<button
											onclick={() => handleNavigate(notification.href)}
											class="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
											</svg>
											{notification.href}
										</button>
									</div>
								{/if}

								<!-- Actions -->
								<div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
									<span class="text-xs text-gray-400 dark:text-gray-500">
										{notification.read ? 'Read' : 'Unread'}
									</span>
									<button
										onclick={(e) => handleToggleRead(e, notification)}
										class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {notification.read
											? 'bg-indigo-600'
											: 'bg-gray-300 dark:bg-gray-600'}"
									>
										<span
											class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform {notification.read ? 'translate-x-4.5' : 'translate-x-0.5'}"
										></span>
									</button>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
