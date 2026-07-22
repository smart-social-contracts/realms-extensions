<script lang="ts">
	let { ctx }: { ctx: Record<string, any> } = $props();

	const cn = ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' '));

	let isAuthenticated = $state(false);
	let principal = $state('');

	$effect(() => {
		const unsub = ctx.isAuthenticated?.subscribe?.((v: any) => {
			isAuthenticated = !!v;
		});
		return () => unsub?.();
	});

	$effect(() => {
		const unsub = ctx.principal?.subscribe?.((v: any) => {
			principal = v || '';
		});
		return () => unsub?.();
	});

	let summary: any = $state(null);
	let citizenship: any = $state(null);
	let notifications: any[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');
	let notificationsLoading = $state(true);
	let expandedId: string | null = $state(null);

	// Invoice state
	let invoiceData: any = $state(null);
	let invoiceLoading = $state(true);
	let invoiceError = $state('');

	// Payment accounts state
	let paymentAccounts: any[] = $state([]);
	let accountsLoading = $state(true);
	let accountsError = $state('');
	let showAddAccountForm = $state(false);
	let newAccountLabel = $state('');
	let newAccountAddress = $state('');
	let newAccountNetwork = $state('ICP');
	let newAccountCurrency = $state('ICP');
	let addingAccount = $state(false);

	// Payment modal state
	let showPaymentModal = $state(false);
	let paymentInfo: any = $state(null);
	let paymentLoading = $state(false);
	let selectedRecord: any = $state(null);
	let copied = $state(false);

	const networks = [
		{ value: 'ICP', label: 'Internet Computer (ICP)' },
		{ value: 'Bitcoin', label: 'Bitcoin' },
		{ value: 'Ethereum', label: 'Ethereum' },
		{ value: 'SEPA', label: 'SEPA Bank Transfer' },
	];

	const currenciesByNetwork: Record<string, Array<{ value: string; label: string }>> = {
		ICP: [{ value: 'ICP', label: 'ICP' }, { value: 'ckBTC', label: 'ckBTC' }, { value: 'ckETH', label: 'ckETH' }],
		Bitcoin: [{ value: 'BTC', label: 'Bitcoin (BTC)' }],
		Ethereum: [{ value: 'ETH', label: 'Ethereum (ETH)' }, { value: 'USDC', label: 'USDC' }, { value: 'USDT', label: 'USDT' }],
		SEPA: [{ value: 'EUR', label: 'Euro (EUR)' }],
	};

	let availableCurrencies = $derived(currenciesByNetwork[newAccountNetwork] || []);

	$effect(() => {
		const currencies = currenciesByNetwork[newAccountNetwork] || [];
		if (currencies.length > 0 && !currencies.find(c => c.value === newAccountCurrency)) {
			newAccountCurrency = currencies[0].value;
		}
	});

	function getGreeting(): string {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	}

	let unreadCount = $derived(notifications.filter(n => !n.read).length);

	async function callOtherExt(ext: string, fn: string, args: Record<string, unknown> = {}) {
		const raw = await ctx.backend.extension_sync_call(ext, fn, JSON.stringify(args));
		const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
		if (parsed?.success && parsed?.response) return JSON.parse(parsed.response);
		return parsed;
	}

	async function loadDashboard() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const args = { user_id: principal };
			const [sum, cit] = await Promise.all([
				ctx.callSync('get_dashboard_summary', args).catch(() => null),
				ctx.callSync('get_citizenship_status', args).catch(() => null),
			]);
			summary = sum?.data ?? sum;
			citizenship = cit?.data ?? cit;
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			loading = false;
		}
	}

	async function loadNotifications() {
		notificationsLoading = true;
		try {
			const args = { user_id: principal };
			const notif = await callOtherExt('notifications', 'get_notifications', args).catch(() => ({ data: [] }));
			const n = notif?.data ?? notif?.notifications ?? notif;
			notifications = Array.isArray(n) ? n : [];
		} catch {
			notifications = [];
		} finally {
			notificationsLoading = false;
		}
	}

	async function loadInvoices() {
		invoiceLoading = true;
		invoiceError = '';
		try {
			const result = await ctx.callSync('get_invoice_information', { user_id: principal });
			if (result?.success) {
				invoiceData = result.data;
			} else {
				invoiceError = result?.error || 'Failed to load invoices';
			}
		} catch (e: any) {
			invoiceError = e?.message || String(e);
		} finally {
			invoiceLoading = false;
		}
	}

	async function loadPaymentAccounts() {
		accountsLoading = true;
		accountsError = '';
		try {
			const result = await ctx.callSync('list_payment_accounts', { user_id: principal });
			if (result?.success && result?.data) {
				paymentAccounts = result.data;
			} else {
				paymentAccounts = [];
			}
		} catch {
			paymentAccounts = [];
		} finally {
			accountsLoading = false;
		}
	}

	$effect(() => {
		if (!isAuthenticated || !principal) {
			loading = false;
			notificationsLoading = false;
			invoiceLoading = false;
			accountsLoading = false;
			return;
		}
		void Promise.all([loadDashboard(), loadNotifications(), loadInvoices(), loadPaymentAccounts()]);
	});

	// Notification actions
	async function toggleRead(notif: any) {
		try {
			const newRead = !notif.read;
			await callOtherExt('notifications', 'mark_as_read', { id: notif.id, read: newRead });
			notifications = notifications.map(n => n.id === notif.id ? { ...n, read: newRead } : n);
		} catch {}
	}

	async function deleteNotification(notif: any) {
		try {
			await callOtherExt('notifications', 'delete_notification', { id: notif.id });
			notifications = notifications.filter(n => n.id !== notif.id);
		} catch {}
	}

	function toggleExpand(notif: any) {
		if (expandedId === notif.id) {
			expandedId = null;
		} else {
			expandedId = notif.id;
			if (!notif.read) toggleRead(notif);
		}
	}

	function mdToHtml(text: string): string {
		if (!text) return '';
		return text
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener">$1</a>')
			.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">$1</code>')
			.replace(/^\s*[-*]\s+(.+)$/gm, '<li class="ml-4">$1</li>')
			.replace(/(<li.*<\/li>\n?)+/g, m => '<ul class="list-disc ml-2 space-y-1">' + m + '</ul>')
			.replace(/\n{2,}/g, '</p><p class="mt-2">')
			.replace(/\n/g, '<br>')
			.replace(/^/, '<p>').replace(/$/, '</p>');
	}

	function formatRelativeTime(timestampMs: number): string {
		if (!timestampMs) return '';
		const diffMs = Date.now() - timestampMs;
		if (diffMs < 0) return 'just now';
		const s = Math.floor(diffMs / 1000);
		if (s < 60) return 'just now';
		const m = Math.floor(s / 60);
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		const d = Math.floor(h / 24);
		if (d < 30) return `${d}d ago`;
		const mo = Math.floor(d / 30);
		if (mo < 12) return `${mo}mo ago`;
		return `${Math.floor(mo / 12)}y ago`;
	}

	function formatFullDate(timestampMs: number): string {
		if (!timestampMs) return '';
		const d = new Date(timestampMs);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function formatInvoicePaidDate(paidOn: string | null | undefined): string {
		if (!paidOn) return '—';
		if (paidOn.startsWith('1970-01-01')) return '—';
		try {
			const d = new Date(paidOn);
			if (Number.isNaN(d.getTime()) || d.getTime() <= 0) return '—';
			return formatFullDate(d.getTime());
		} catch {
			return '—';
		}
	}

	// Invoice actions
	function getStatusColor(status: string): string {
		switch (status?.toLowerCase()) {
			case 'paid': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
			case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
			case 'overdue': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
			case 'processing': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
			default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
		}
	}

	function getPaymentCliCommand(info: any): string {
		if (!info) return '';
		if (info.amount_raw != null) {
			const token = (info.currency || 'token').toLowerCase();
			return `dfx canister call ${token}_backend icrc1_transfer '(record { to = record { owner = principal "${info.principal}" }; amount = ${info.amount_raw} })' --network ic`;
		}
		return `dfx canister call token_backend icrc1_transfer '(record { to = record { owner = principal "${info.principal}"; subaccount = opt blob "${info.subaccount}" }; amount = ${info.amount_raw || 0} })' --network ic`;
	}

	async function openPaymentModal(record: any) {
		selectedRecord = record;
		showPaymentModal = true;
		paymentLoading = true;
		paymentInfo = null;
		try {
			const result = await ctx.callSync('get_invoice_deposit_address', { invoice_id: record.id });
			if (result?.success) paymentInfo = result.data;
		} catch {} finally {
			paymentLoading = false;
		}
	}

	function clipboardCopy(text: string) {
		try {
			const ta = document.createElement('textarea');
			ta.value = text;
			ta.style.position = 'fixed';
			ta.style.left = '-9999px';
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
			copied = true;
			setTimeout(() => { copied = false; }, 2000);
		} catch {}
	}

	async function refreshInvoice(record: any) {
		try {
			const raw = await ctx.backend.refresh_invoice(JSON.stringify({ invoice_id: record.id }));
			const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (data?.success) await loadInvoices();
		} catch {}
	}

	async function demoMarkAsPaid(record: any) {
		try {
			const result = await ctx.callSync('demo_mark_invoice_paid', { invoice_id: record.id });
			if (result?.success) await loadInvoices();
		} catch {}
	}

	// Payment account actions
	async function addPaymentAccount() {
		if (!newAccountAddress || !newAccountLabel) return;
		addingAccount = true;
		try {
			const result = await ctx.callSync('add_payment_account', {
				user_id: principal,
				address: newAccountAddress,
				label: newAccountLabel,
				network: newAccountNetwork,
				currency: newAccountCurrency,
			});
			if (result?.success) {
				await loadPaymentAccounts();
				newAccountLabel = '';
				newAccountAddress = '';
				newAccountNetwork = 'ICP';
				newAccountCurrency = 'ICP';
				showAddAccountForm = false;
			}
		} catch {} finally {
			addingAccount = false;
		}
	}

	async function removePaymentAccount(accountId: string) {
		try {
			const result = await ctx.callSync('remove_payment_account', {
				user_id: principal,
				account_id: accountId,
			});
			if (result?.success) await loadPaymentAccounts();
		} catch {}
	}

	function entries(obj: any): [string, any][] {
		if (!obj || typeof obj !== 'object') return [];
		return Object.entries(obj).filter(([k]) => !k.startsWith('_'));
	}
</script>

<div class="w-full max-w-5xl mx-auto px-4 py-6 font-sans space-y-8">
	{#if !isAuthenticated}
		<!-- Unauthenticated -->
		<div class="flex flex-col items-center justify-center py-20 px-6">
			<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 max-w-md w-full text-center space-y-5">
				<div class="mx-auto w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-3xl">
					🔔
				</div>
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Welcome to your Dashboard</h2>
				<p class="text-gray-500 dark:text-gray-400">Please log in to access your member dashboard, notifications, invoices, and more.</p>
				<button
					onclick={() => ctx.navigate?.('/join')}
					class="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
				>Log In</button>
			</div>
		</div>
	{:else}
		<!-- Header / Greeting -->
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">
				{getGreeting()}{#if summary?.user_name && summary.user_name !== principal}, <span class="text-gray-500 dark:text-gray-400">{summary.user_name}</span>{/if}
			</h1>
		</div>

		{#if loading}
			<div class="flex flex-col justify-center items-center p-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
				<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
				<p class="mt-4 text-lg text-gray-500 dark:text-gray-400">Loading dashboard…</p>
			</div>
		{:else if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error}
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">
				<span class="font-medium">Error:</span> {error}
			</div>
		{:else}
			<!-- Citizenship Status -->
			{#if citizenship && entries(citizenship).length > 0}
				<section>
					<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
						<div class="flex items-center justify-between">
							<h2 class="text-xl font-bold text-gray-900 dark:text-white">Citizenship Status</h2>
							{#if citizenship.status}
								<span class={cn(
									'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold',
									citizenship.status === 'active'
										? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
										: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
								)}>
									{citizenship.status === 'active' ? '✓' : '✗'}
									{citizenship.status_label || citizenship.status}
								</span>
							{/if}
						</div>
						{#if entries(citizenship).filter(([k]) => k !== 'status' && k !== 'status_label').length > 0}
							<div class="mt-4 space-y-2">
								{#each entries(citizenship).filter(([k]) => k !== 'status' && k !== 'status_label') as [k, v]}
									<div class="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-1">
										<span class="text-gray-500 dark:text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span>
										<span class="font-medium text-gray-800 dark:text-gray-200">{typeof v === 'object' ? JSON.stringify(v) : v}</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</section>
			{/if}

			<!-- Notifications Inbox -->
			<section>
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-2">
						<h2 class="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
						{#if unreadCount > 0}
							<span class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">{unreadCount}</span>
						{/if}
					</div>
				</div>

				{#if notificationsLoading}
					<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex justify-center">
						<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
					</div>
				{:else if notifications.length === 0}
					<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
						<div class="text-3xl mb-2">🔔</div>
						No notifications
					</div>
				{:else}
					<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									<th class="w-8 px-3 py-2"></th>
									<th class="text-left px-3 py-2">Subject</th>
									<th class="text-left px-3 py-2 whitespace-nowrap hidden md:table-cell">From</th>
									<th class="text-left px-3 py-2 whitespace-nowrap hidden sm:table-cell">Date</th>
									<th class="w-24 px-3 py-2 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each notifications as notif (notif.id)}
									<tr
										onclick={() => toggleExpand(notif)}
										class={cn(
											'border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer transition-colors',
											notif.read
												? 'hover:bg-gray-50 dark:hover:bg-gray-750'
												: 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
										)}
									>
										<td class="px-3 py-3 align-top">
											{#if !notif.read}
												<div class="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
											{/if}
										</td>
										<td class="px-3 py-3">
											<div class={cn('truncate text-sm', notif.read ? 'text-gray-600 dark:text-gray-400' : 'font-semibold text-gray-900 dark:text-white')}>
												{notif.title || 'Notification'}
											</div>
											{#if expandedId === notif.id && (notif.message || notif.body)}
												<div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
													{@html mdToHtml(notif.message || notif.body)}
												</div>
											{/if}
										</td>
										<td class="px-3 py-3 align-top text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:table-cell">{notif.sender || '—'}</td>
										<td class="px-3 py-3 align-top text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap hidden sm:table-cell" title={formatFullDate(notif.timestamp_ms)}>
											{formatRelativeTime(notif.timestamp_ms)}
										</td>
										<td class="px-3 py-3 align-top">
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<div class="flex justify-end gap-1" onclick={(e: MouseEvent) => e.stopPropagation()}>
												<button
													onclick={() => toggleExpand(notif)}
													title={expandedId === notif.id ? 'Collapse' : 'Read message'}
													class={cn('p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors', expandedId === notif.id ? 'text-blue-500' : 'text-gray-400')}
												>
													{expandedId === notif.id ? '👁‍🗨' : '👁'}
												</button>
												<button
													onclick={() => toggleRead(notif)}
													title={notif.read ? 'Mark as unread' : 'Mark as read'}
													class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
												>
													{notif.read ? '✉' : '📬'}
												</button>
												<button
													onclick={() => deleteNotification(notif)}
													title="Delete"
													class="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
												>🗑</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</section>

			<!-- Invoices Section -->
			<section>
				<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">Invoices</h2>
				<p class="text-gray-500 dark:text-gray-400 text-sm mb-4">Manage your invoices and payment records</p>

				{#if invoiceLoading}
					<div class="flex flex-col justify-center items-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<p class="mt-4 text-gray-500 dark:text-gray-400">Loading invoices…</p>
					</div>
				{:else if invoiceError}
					<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-300">{invoiceError}</div>
				{:else if invoiceData?.invoices?.length > 0}
					<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
						<table class="w-full text-sm text-left">
							<thead class="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-750">
								<tr>
									<th class="px-4 py-3">Description</th>
									<th class="px-4 py-3">Amount</th>
									<th class="px-4 py-3">Currency</th>
									<th class="px-4 py-3">Status</th>
									<th class="px-4 py-3">Paid on</th>
									<th class="px-4 py-3">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each invoiceData.invoices as record}
									<tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
										<td class="px-4 py-3">
											<div class="font-medium text-gray-900 dark:text-white text-sm">{record.metadata || 'Invoice'}</div>
										</td>
									<td class="px-4 py-3 font-semibold text-gray-900 dark:text-white">{record.amount}</td>
									<td class="px-4 py-3 text-gray-700 dark:text-gray-300">{record.currency}</td>
										<td class="px-4 py-3">
											<span class={cn('px-2.5 py-0.5 text-xs font-medium rounded-full', getStatusColor(record.status))}>{record.status}</span>
										</td>
										<td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
											{formatInvoicePaidDate(record.paid_on)}
										</td>
										<td class="px-4 py-3">
											{#if record.status === 'Pending' || record.status === 'Overdue'}
												<div class="flex items-center gap-2 flex-wrap">
													<button
														onclick={() => openPaymentModal(record)}
														class="px-3 py-1 text-xs font-medium bg-gray-800 dark:bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
													>💳 Pay</button>
													<button
														onclick={() => refreshInvoice(record)}
														class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
													>↻ Refresh</button>
													<button
														onclick={() => demoMarkAsPaid(record)}
														class="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
													>Demo Pay</button>
												</div>
											{:else if record.status === 'Paid'}
												<span class="text-xs text-green-600 dark:text-green-400">Paid</span>
											{:else}
												<span class="text-xs text-gray-400 dark:text-gray-500">—</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
						No invoices yet.
					</div>
				{/if}
			</section>

			<!-- Payment Modal Overlay -->
			{#if showPaymentModal}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onclick={() => showPaymentModal = false}>
					<div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onclick={(e: MouseEvent) => e.stopPropagation()}>
						<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white">💳 Payment Instructions</h3>
							<button onclick={() => showPaymentModal = false} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">&times;</button>
						</div>
						<div class="p-6 space-y-5">
							{#if paymentLoading}
								<div class="flex justify-center py-8">
									<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
								</div>
							{:else if paymentInfo}
								<div class="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
									<div class="grid grid-cols-2 gap-4 text-sm">
										<div>
											<span class="text-gray-500 dark:text-gray-400">Invoice ID:</span>
											<span class="ml-2 font-medium text-gray-900 dark:text-white">{paymentInfo.invoice_id}</span>
										</div>
										<div>
											<span class="text-gray-500 dark:text-gray-400">Currency:</span>
											<span class="ml-2 font-bold text-gray-900 dark:text-white">{paymentInfo.currency}</span>
										</div>
									</div>
								</div>
								<div>
									<h4 class="font-semibold text-gray-900 dark:text-white mb-3">Transfer Details</h4>
									<div class="space-y-3">
										<div>
											<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient (Canister ID)</label>
											<code class="block px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm break-all text-gray-800 dark:text-gray-200">{paymentInfo.principal}</code>
										</div>
										{#if paymentInfo.amount_human != null}
											<div>
												<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exact Amount to Send</label>
												<code class="block px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded font-mono text-lg font-bold text-blue-800 dark:text-blue-200">{paymentInfo.amount_human} {paymentInfo.currency}</code>
												<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">The unique last digits identify your invoice — send this <strong>exact</strong> amount.</p>
											</div>
										{/if}
										{#if paymentInfo.subaccount}
											<div>
												<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subaccount (Hex)</label>
												<code class="block px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-xs break-all text-gray-800 dark:text-gray-200">{paymentInfo.subaccount}</code>
											</div>
										{/if}
									</div>
								</div>
								{#if paymentInfo.note}
									<div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
										<p class="text-sm text-amber-800 dark:text-amber-200">{paymentInfo.note}</p>
									</div>
								{/if}
								<div>
									<h4 class="font-semibold text-gray-900 dark:text-white mb-2">DFX CLI Command</h4>
									<div class="bg-gray-900 rounded-lg p-4 relative">
										<pre class="text-green-400 font-mono text-sm whitespace-pre-wrap">{getPaymentCliCommand(paymentInfo)}</pre>
										<button
											onclick={() => clipboardCopy(getPaymentCliCommand(paymentInfo))}
											class="absolute top-2 right-2 p-2 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-white text-sm"
										>{copied ? '✓' : '📋'}</button>
									</div>
								</div>
							{:else}
								<div class="text-red-600 dark:text-red-400 text-center py-4">Failed to load payment details.</div>
							{/if}
						</div>
						<div class="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700">
							<button onclick={() => showPaymentModal = false} class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">Close</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Payment Accounts Section -->
			<section>
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-bold text-gray-900 dark:text-white">Payment Accounts</h2>
					<button
						onclick={() => showAddAccountForm = !showAddAccountForm}
						class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
					>+ Add Account</button>
				</div>

				{#if showAddAccountForm}
					<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-4 space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label</label>
							<input
								type="text"
								bind:value={newAccountLabel}
								placeholder="e.g. My ICP Wallet"
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
							/>
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Network</label>
								<select
									bind:value={newAccountNetwork}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
								>
									{#each networks as net}
										<option value={net.value}>{net.label}</option>
									{/each}
								</select>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
								<select
									bind:value={newAccountCurrency}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
								>
									{#each availableCurrencies as cur}
										<option value={cur.value}>{cur.label}</option>
									{/each}
								</select>
							</div>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
							<input
								type="text"
								bind:value={newAccountAddress}
								placeholder="Wallet address or IBAN"
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
							/>
						</div>
						<div class="flex justify-end gap-2">
							<button
								onclick={() => { showAddAccountForm = false; newAccountLabel = ''; newAccountAddress = ''; }}
								class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
							>Cancel</button>
							<button
								onclick={addPaymentAccount}
								disabled={addingAccount || !newAccountLabel || !newAccountAddress}
								class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
							>{addingAccount ? 'Saving…' : 'Save'}</button>
						</div>
					</div>
				{/if}

				{#if accountsLoading && paymentAccounts.length === 0}
					<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex justify-center">
						<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
					</div>
				{:else if paymentAccounts.length === 0}
					<div class="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
						<p class="text-gray-600 dark:text-gray-400">No payment accounts yet.</p>
						<p class="text-sm text-gray-500 dark:text-gray-500 mt-2">Add a payment account to receive and send payments.</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each paymentAccounts as account}
							<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow">
								<div class="flex items-center justify-between mb-2">
									<strong class="text-lg text-gray-900 dark:text-white">{account.label}</strong>
									{#if account.is_verified}
										<span class="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">✓ Verified</span>
									{/if}
								</div>
								<div class="flex gap-2 mb-3">
									<span class="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">{account.network}</span>
									<span class="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">{account.currency}</span>
								</div>
								<div class="bg-gray-50 dark:bg-gray-750 rounded-lg px-3 py-2 mb-3 overflow-x-auto">
									<code class="font-mono text-sm text-gray-700 dark:text-gray-300 break-all">{account.address}</code>
								</div>
								<div class="flex items-center justify-between">
									{#if account.created_at}
										<span class="text-xs text-gray-500 dark:text-gray-400">Created: {new Date(account.created_at).toLocaleDateString()}</span>
									{:else}
										<span></span>
									{/if}
									<button
										onclick={() => removePaymentAccount(account.id)}
										class="text-xs px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
									>🗑 Remove</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{/if}
</div>
