<script lang="ts">
	import { onMount } from 'svelte';
	import { createExtensionClient, type ExtensionClient } from '@realmsgos/extension-bridge';
	import { Card, Button, EmptyState, AccessDenied } from '@realmsgos/extension-ui';
	import {
		bridgeErrorFields,
		citizenshipSteps,
		displayFirstName,
		cn,
		currenciesByNetwork,
		formatFullDate,
		formatInvoicePaidDate,
		formatRelativeTime,
		getGreeting,
		getPaymentCliCommand,
		getStatusColor,
		mdToHtml,
		networks,
		clipboardCopy,
		type ExtEnvelope,
	} from './lib/helpers';
	import { loadExtensionI18n, t } from './lib/i18n';

	type NotificationItem = {
		id: string;
		title?: string;
		message?: string;
		body?: string;
		sender?: string;
		timestamp_ms?: number;
		read?: boolean;
	};

	let bridgeReady = $state(false);
	let bridgeError = $state('');
	let principal = $state('');
	let isAuthenticated = $derived(!!principal);

	let summary: Record<string, unknown> | null = $state(null);
	let citizenship: Record<string, unknown> | null = $state(null);
	let notifications: NotificationItem[] = $state([]);
	let notificationsUnavailable = $state(false);
	let loading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');
	let notificationsLoading = $state(true);
	let expandedId: string | null = $state(null);

	let invoiceData: { invoices?: Record<string, unknown>[]; summary?: Record<string, unknown> } | null =
		$state(null);
	let invoiceLoading = $state(true);
	let invoiceError = $state('');
	let refreshingInvoiceId = $state<string | null>(null);

	let paymentAccounts: Record<string, unknown>[] = $state([]);
	let accountsLoading = $state(true);
	let accountsError = $state('');
	let showAddAccountForm = $state(false);
	let newAccountLabel = $state('');
	let newAccountAddress = $state('');
	let newAccountNetwork = $state('ICP');
	let newAccountCurrency = $state('ICP');
	let addingAccount = $state(false);

	let showPaymentModal = $state(false);
	let paymentInfo: Record<string, unknown> | null = $state(null);
	let paymentLoading = $state(false);
	let selectedRecord: Record<string, unknown> | null = $state(null);
	let copied = $state(false);

	let ctx: ExtensionClient | null = null;

	let availableCurrencies = $derived(currenciesByNetwork[newAccountNetwork] || []);
	let unreadCount = $derived(notifications.filter((n) => !n.read).length);
	let firstName = $derived(displayFirstName(summary, principal));
	let greetingLine = $derived(firstName ? `${getGreeting()}, ${firstName}` : getGreeting());
	let steps = $derived(citizenshipSteps(citizenship));

	$effect(() => {
		const currencies = currenciesByNetwork[newAccountNetwork] || [];
		if (currencies.length > 0 && !currencies.find((c) => c.value === newAccountCurrency)) {
			newAccountCurrency = currencies[0].value;
		}
	});

	function applyTheme(theme: 'light' | 'dark') {
		document.documentElement.classList.toggle('dark', theme === 'dark');
		document.documentElement.dataset.theme = theme;
	}

	function reportHeight() {
		ctx?.reportHeight(document.body.scrollHeight);
	}

	async function callExt<T>(fn: string, args: Record<string, unknown> = {}): Promise<ExtEnvelope<T>> {
		if (!ctx) return { success: false, error: 'Bridge not ready' };
		const raw = await ctx.callExtension<ExtEnvelope<T> | T>(fn, args);
		if (raw && typeof raw === 'object' && 'success' in raw) {
			return raw as ExtEnvelope<T>;
		}
		return { success: true, data: raw as T };
	}

	async function callExtAsync<T>(fn: string, args: Record<string, unknown> = {}): Promise<ExtEnvelope<T>> {
		if (!ctx) return { success: false, error: 'Bridge not ready' };
		const raw = await ctx.callExtensionAsync<ExtEnvelope<T> | T>(fn, args);
		if (raw && typeof raw === 'object' && 'success' in raw) {
			return raw as ExtEnvelope<T>;
		}
		return { success: true, data: raw as T };
	}

	async function loadDashboard() {
		if (!ctx || !principal) return;
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const args = { user_id: principal };
			const [sum, cit] = await Promise.all([
				callExt<Record<string, unknown>>('get_dashboard_summary', args).catch(() => ({
					success: false,
				})),
				callExt<Record<string, unknown>>('get_citizenship_status', args).catch(() => ({
					success: false,
				})),
			]);
			summary = (sum.data ?? sum) as Record<string, unknown> | null;
			citizenship = (cit.data ?? cit) as Record<string, unknown> | null;
		} catch (e) {
			const { code, message } = bridgeErrorFields(e);
			if (code === 'denied') {
				accessDeniedOp = message;
				error = '';
			} else {
				accessDeniedOp = '';
				error = message;
			}
		} finally {
			loading = false;
			queueMicrotask(reportHeight);
		}
	}

	async function loadNotifications() {
		notificationsLoading = true;
		notificationsUnavailable = true;
		notifications = [];
		notificationsLoading = false;
		queueMicrotask(reportHeight);
	}

	async function loadInvoices() {
		if (!ctx || !principal) return;
		invoiceLoading = true;
		invoiceError = '';
		try {
			const result = await callExt<{ invoices?: Record<string, unknown>[]; summary?: Record<string, unknown> }>(
				'get_invoice_information',
				{ user_id: principal },
			);
			if (result.success && result.data) {
				invoiceData = result.data;
			} else {
				invoiceError = result.error || 'Failed to load invoices';
			}
		} catch (e) {
			invoiceError = bridgeErrorFields(e).message;
		} finally {
			invoiceLoading = false;
			queueMicrotask(reportHeight);
		}
	}

	async function loadPaymentAccounts() {
		if (!ctx || !principal) return;
		accountsLoading = true;
		accountsError = '';
		try {
			const result = await callExt<Record<string, unknown>[]>('list_payment_accounts', {
				user_id: principal,
			});
			if (result.success && result.data) {
				paymentAccounts = result.data;
			} else {
				paymentAccounts = [];
			}
		} catch {
			paymentAccounts = [];
		} finally {
			accountsLoading = false;
			queueMicrotask(reportHeight);
		}
	}

	async function reloadAll() {
		if (!isAuthenticated || !principal) return;
		await Promise.all([loadDashboard(), loadNotifications(), loadInvoices(), loadPaymentAccounts()]);
	}

	function handleCitizenshipAction(id: 'verify_passport' | 'invoices') {
		if (id === 'verify_passport') {
			ctx?.navigate('/extensions/passport_verification');
			return;
		}
		document.getElementById('invoices')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	$effect(() => {
		if (!bridgeReady || !isAuthenticated || !principal) {
			if (!bridgeReady) return;
			loading = false;
			notificationsLoading = false;
			invoiceLoading = false;
			accountsLoading = false;
			return;
		}
		void reloadAll();
	});

	async function toggleRead(notif: NotificationItem) {
		try {
			const newRead = !notif.read;
			notifications = notifications.map((n) =>
				n.id === notif.id ? { ...n, read: newRead } : n,
			);
		} catch {
			/* cross-extension notifications unavailable in sandbox */
		}
	}

	async function deleteNotification(notif: NotificationItem) {
		notifications = notifications.filter((n) => n.id !== notif.id);
	}

	function toggleExpand(notif: NotificationItem) {
		if (expandedId === notif.id) {
			expandedId = null;
		} else {
			expandedId = notif.id;
			if (!notif.read) void toggleRead(notif);
		}
	}

	async function openPaymentModal(record: Record<string, unknown>) {
		selectedRecord = record;
		showPaymentModal = true;
		paymentLoading = true;
		paymentInfo = null;
		try {
			const result = await callExt<Record<string, unknown>>('get_invoice_deposit_address', {
				invoice_id: record.id,
			});
			if (result.success && result.data) paymentInfo = result.data;
		} catch {
			/* shown as empty state in modal */
		} finally {
			paymentLoading = false;
			queueMicrotask(reportHeight);
		}
	}

	async function copyCliCommand(text: string) {
		const ok = await clipboardCopy(text);
		if (ok) {
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}

	function invoicePaidBody(record: Record<string, unknown>, alreadyPaid: boolean): string {
		const desc = String(record.metadata || t('invoice_unnamed')).trim() || t('invoice_unnamed');
		const amount = record.amount != null && record.amount !== '' ? String(record.amount) : '';
		const currency = record.currency ? String(record.currency) : '';
		const amountBit = [amount, currency].filter(Boolean).join(' ');
		const paidOn = formatInvoicePaidDate(record.paid_on as string | null | undefined);
		const when = paidOn !== '—' ? t('invoice_paid_on', { date: paidOn }) : '';
		const key = alreadyPaid
			? amountBit
				? 'invoice_already_paid'
				: 'invoice_already_paid_no_amount'
			: amountBit
				? 'invoice_paid'
				: 'invoice_paid_no_amount';
		return t(key, { description: desc, amount: amountBit, when });
	}

	async function showInvoicePaidNotice(record: Record<string, unknown>, alreadyPaid: boolean) {
		const body = invoicePaidBody(record, alreadyPaid);
		if (ctx?.openModal) {
			await ctx.openModal({
				title: t('invoice_paid_title'),
				body,
				actions: [{ id: 'close', label: t('notice_close'), tone: 'primary' }],
			});
			return;
		}
		ctx?.notify('success', body);
	}

	async function refreshInvoice(record: Record<string, unknown>) {
		if (!ctx) return;
		const invoiceId = String(record.id);
		refreshingInvoiceId = invoiceId;
		try {
			const result = await callExtAsync<Record<string, unknown>>('check_invoice_payment', {
				invoice_id: record.id,
			});
			if (result.success) {
				await loadInvoices();
				const data = result.data ?? {};
				if (data.already_paid || data.paid) {
					const refreshed =
						invoiceData?.invoices?.find((inv) => String(inv.id) === invoiceId) ?? record;
					await showInvoicePaidNotice(refreshed, Boolean(data.already_paid));
				} else {
					const scanned = data.scanned_transactions;
					ctx.notify(
						'info',
						scanned == null
							? 'Payment not found yet. Wait a moment and try again.'
							: `Payment not found in the last ${scanned} treasury transfers.`,
					);
				}
			} else {
				ctx.notify('error', result.error || 'Failed to check payment');
			}
		} catch (e) {
			ctx.notify('error', bridgeErrorFields(e).message);
		} finally {
			refreshingInvoiceId = null;
			queueMicrotask(reportHeight);
		}
	}

	async function demoMarkAsPaid(record: Record<string, unknown>) {
		try {
			const result = await callExt('demo_mark_invoice_paid', { invoice_id: record.id });
			if (result.success) await loadInvoices();
		} catch {
			/* access denied surfaced on next load */
		}
	}

	async function addPaymentAccount() {
		if (!newAccountAddress || !newAccountLabel || !ctx) return;
		addingAccount = true;
		try {
			const result = await callExt('add_payment_account', {
				user_id: principal,
				address: newAccountAddress,
				label: newAccountLabel,
				network: newAccountNetwork,
				currency: newAccountCurrency,
			});
			if (result.success) {
				await loadPaymentAccounts();
				newAccountLabel = '';
				newAccountAddress = '';
				newAccountNetwork = 'ICP';
				newAccountCurrency = 'ICP';
				showAddAccountForm = false;
				ctx.notify('success', 'Payment account added');
			} else if (result.error) {
				ctx.notify('error', result.error);
			}
		} catch (e) {
			ctx?.notify('error', bridgeErrorFields(e).message);
		} finally {
			addingAccount = false;
			queueMicrotask(reportHeight);
		}
	}

	async function removePaymentAccount(accountId: string) {
		try {
			const result = await callExt('remove_payment_account', {
				user_id: principal,
				account_id: accountId,
			});
			if (result.success) {
				await loadPaymentAccounts();
				ctx?.notify('success', 'Payment account removed');
			}
		} catch {
			/* silent */
		}
	}

	async function initClient() {
		try {
			const client = await createExtensionClient();
			ctx = client;
			bridgeReady = true;

			client.onStateChange((state) => {
				principal = state.principal || '';
				applyTheme(state.theme);
				void loadExtensionI18n(state.locale || 'en');
				queueMicrotask(reportHeight);
			});
		} catch (e) {
			bridgeError = e instanceof Error ? e.message : String(e);
			loading = false;
		}
	}

	onMount(() => {
		void initClient();

		const observer = new ResizeObserver(() => reportHeight());
		observer.observe(document.body);
		queueMicrotask(reportHeight);

		return () => {
			observer.disconnect();
			ctx?.destroy();
		};
	});
</script>

<div class="dashboard mx-auto max-w-3xl space-y-6 px-4 pb-12 font-sans">
	{#if bridgeError}
		<Card title="Bridge error">
			{#snippet children()}
				<p class="text-sm text-red-600 dark:text-red-400">Handshake failed: {bridgeError}</p>
			{/snippet}
		</Card>
	{:else if !isAuthenticated}
		<header class="pt-1">
			<h1 class="text-[1.65rem] font-semibold tracking-tight text-slate-900 dark:text-white">
				{getGreeting()}
			</h1>
			<p class="mt-1.5 text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">{t('dashboard_lede')}</p>
		</header>
		<Card>
			{#snippet children()}
				<EmptyState
					title="Welcome to your Dashboard"
					message="Please log in to access your member dashboard, notifications, invoices, and more."
				>
					{#snippet actions()}
						<Button tone="primary" onclick={() => ctx?.navigate('/join')}>Log In</Button>
					{/snippet}
				</EmptyState>
			{/snippet}
		</Card>
	{:else}
		<header class="flex items-start justify-between gap-3 pt-1">
			<div class="min-w-0">
				<h1 class="text-[1.65rem] font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">
					{greetingLine}
				</h1>
				<p class="mt-1.5 max-w-md text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
					{t('dashboard_lede')}
				</p>
			</div>
			<button
				type="button"
				class="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-800 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
				disabled={loading}
				onclick={() => void reloadAll()}
				title={t('refresh')}
				aria-label={t('refresh')}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class:animate-spin={loading} aria-hidden="true">
					<path d="M21 12a9 9 0 1 1-3-6.7" />
					<path d="M21 3v6h-6" />
				</svg>
			</button>
		</header>

		{#if loading}
			<div class="space-y-3" aria-busy="true" aria-label="Loading dashboard">
				<div class="h-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
				<div class="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
			</div>
		{:else if accessDeniedOp}
			<Card>
				{#snippet children()}
					<AccessDenied
						message="You need additional permissions to view this page ({accessDeniedOp})."
					>
						{#snippet children()}
							<Button tone="secondary" size="sm" onclick={() => void loadDashboard()}>Retry</Button>
						{/snippet}
					</AccessDenied>
				{/snippet}
			</Card>
		{:else if error}
			<Card>
				{#snippet children()}
					<p class="text-sm text-red-700 dark:text-red-300">
						<span class="font-medium">Error:</span>
						{error}
					</p>
				{/snippet}
			</Card>
		{:else}
			{#if citizenship}
				<section class="overflow-hidden rounded-xl border border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-800">
					<div class="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
						<div>
							<h2 class="text-base font-semibold text-slate-900 dark:text-white">{t('citizenship_title')}</h2>
							<p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
								{t('citizenship_steps', { done: steps.done, total: steps.total })}
							</p>
						</div>
						{#if citizenship.status}
							<span
								class={cn(
									'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
									citizenship.status === 'active'
										? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
										: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
								)}
							>
								<span
									class={cn(
										'h-1.5 w-1.5 rounded-full',
										citizenship.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500',
									)}
									aria-hidden="true"
								></span>
								{citizenship.status === 'active'
									? t('membership_status_active')
									: t('membership_status_pending')}
							</span>
						{/if}
					</div>
					<div class="px-4 pb-2">
						<div class="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
							<div
								class="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
								style="width: {(steps.done / steps.total) * 100}%"
							></div>
						</div>
					</div>
					<ol class="divide-y divide-slate-100 dark:divide-slate-700">
						<li class="flex items-start gap-3 px-4 py-3">
							<div
								class={cn(
									'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
									steps.passport
										? 'bg-emerald-500 text-white'
										: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
								)}
							>
								{#if steps.passport}
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
								{:else}
									1
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between gap-3">
									<p class="font-medium text-slate-900 dark:text-white">{t('citizenship_passport')}</p>
									{#if !steps.passport}
										<Button tone="primary" size="sm" onclick={() => handleCitizenshipAction('verify_passport')}>
											{t('citizenship_verify_passport')}
										</Button>
									{/if}
								</div>
								<p class="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
									{steps.passport
										? t('citizenship_passport_done')
										: `${t('citizenship_passport_todo')} · ${t('citizenship_passport_hint')}`}
								</p>
							</div>
						</li>
						<li class="flex items-start gap-3 px-4 py-3">
							<div
								class={cn(
									'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
									steps.invoice
										? 'bg-emerald-500 text-white'
										: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
								)}
							>
								{#if steps.invoice}
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
								{:else}
									2
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between gap-3">
									<p class="font-medium text-slate-900 dark:text-white">{t('citizenship_invoice_step')}</p>
									{#if !steps.invoice}
										<Button
											tone={steps.passport ? 'primary' : 'secondary'}
											size="sm"
											onclick={() => handleCitizenshipAction('invoices')}
										>
											{t(Number(citizenship.total_invoices || 0) > 0 ? 'citizenship_pay_invoice' : 'citizenship_view_invoices')}
										</Button>
									{/if}
								</div>
								<p class="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
									{steps.invoice ? t('citizenship_invoice_done') : t('citizenship_invoice_todo')}
								</p>
							</div>
						</li>
					</ol>
					<div class="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 dark:divide-slate-700 dark:border-slate-700">
						<div class="px-4 py-2.5">
							<p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t('citizenship_total_invoices')}</p>
							<p class="text-base font-semibold tabular-nums text-slate-900 dark:text-white">{citizenship.total_invoices ?? 0}</p>
						</div>
						<div class="px-4 py-2.5">
							<p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">{t('citizenship_paid_invoices')}</p>
							<p class="text-base font-semibold tabular-nums text-slate-900 dark:text-white">{citizenship.paid_invoices ?? 0}</p>
						</div>
					</div>
				</section>
			{/if}

			<section class="space-y-3">
				<div class="flex items-center gap-2 px-0.5">
					<h2 class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{t('notifications_title')}</h2>
					{#if unreadCount > 0}
						<span
							class="inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white"
							>{unreadCount}</span
						>
					{/if}
				</div>

				{#if notificationsLoading}
					<Card>
						{#snippet children()}
							<div class="flex justify-center py-6">
								<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
							</div>
						{/snippet}
					</Card>
				{:else if notificationsUnavailable || notifications.length === 0}
					<div class="rounded-2xl border border-slate-200/80 bg-white px-5 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-800">
						<div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700">
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" /></svg>
						</div>
						<p class="text-sm font-medium text-slate-800 dark:text-slate-100">{t('notifications_empty_title')}</p>
						<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('notifications_empty_body')}</p>
					</div>
				{:else}
					<Card>
						{#snippet children()}
							<div class="overflow-x-auto">
								<table class="w-full">
									<thead>
										<tr
											class="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-750 dark:text-gray-400"
										>
											<th class="w-8 px-3 py-2"></th>
											<th class="px-3 py-2 text-left">Subject</th>
											<th class="hidden px-3 py-2 text-left whitespace-nowrap md:table-cell">From</th>
											<th class="hidden px-3 py-2 text-left whitespace-nowrap sm:table-cell">Date</th>
											<th class="w-24 px-3 py-2 text-right">Actions</th>
										</tr>
									</thead>
									<tbody>
										{#each notifications as notif (notif.id)}
											<tr
												onclick={() => toggleExpand(notif)}
												class={cn(
													'cursor-pointer border-b border-gray-100 transition-colors last:border-b-0 dark:border-gray-700',
													notif.read
														? 'hover:bg-gray-50 dark:hover:bg-gray-750'
														: 'bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20',
												)}
											>
												<td class="px-3 py-3 align-top">
													{#if !notif.read}
														<div class="mt-1.5 h-2 w-2 rounded-full bg-blue-500"></div>
													{/if}
												</td>
												<td class="px-3 py-3">
													<div
														class={cn(
															'truncate text-sm',
															notif.read
																? 'text-gray-600 dark:text-gray-400'
																: 'font-semibold text-gray-900 dark:text-white',
														)}
													>
														{notif.title || 'Notification'}
													</div>
													{#if expandedId === notif.id && (notif.message || notif.body)}
														<div
															class="mt-3 border-t border-gray-100 pt-3 text-sm leading-relaxed text-gray-700 dark:border-gray-700 dark:text-gray-300"
														>
															{@html mdToHtml(notif.message || notif.body || '')}
														</div>
													{/if}
												</td>
												<td
													class="hidden px-3 py-3 align-top text-xs whitespace-nowrap text-gray-500 md:table-cell dark:text-gray-400"
													>{notif.sender || '—'}</td
												>
												<td
													class="hidden px-3 py-3 align-top text-xs whitespace-nowrap text-gray-400 sm:table-cell dark:text-gray-500"
													title={formatFullDate(notif.timestamp_ms || 0)}
												>
													{formatRelativeTime(notif.timestamp_ms || 0)}
												</td>
												<td class="px-3 py-3 align-top">
													<!-- svelte-ignore a11y_click_events_have_key_events -->
													<div class="flex justify-end gap-1" onclick={(e: MouseEvent) => e.stopPropagation()}>
														<button
															onclick={() => toggleExpand(notif)}
															title={expandedId === notif.id ? 'Collapse' : 'Read message'}
															class={cn(
																'rounded p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600',
																expandedId === notif.id ? 'text-blue-500' : 'text-gray-400',
															)}
														>
															{expandedId === notif.id ? '👁‍🗨' : '👁'}
														</button>
														<button
															onclick={() => toggleRead(notif)}
															title={notif.read ? 'Mark as unread' : 'Mark as read'}
															class="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
														>
															{notif.read ? '✉' : '📬'}
														</button>
														<button
															onclick={() => deleteNotification(notif)}
															title="Delete"
															class="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
														>
															🗑
														</button>
													</div>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/snippet}
					</Card>
				{/if}
			</section>

			<section id="invoices" class="space-y-3 scroll-mt-4">
				<div class="px-0.5">
					<h2 class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{t('invoices_title')}</h2>
					<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('invoices_subtitle')}</p>
				</div>

				{#if invoiceLoading}
					<Card>
						{#snippet children()}
							<EmptyState title="Loading invoices…" />
						{/snippet}
					</Card>
				{:else if invoiceError}
					<Card>
						{#snippet children()}
							<p class="text-sm text-red-700 dark:text-red-300">{invoiceError}</p>
						{/snippet}
					</Card>
				{:else if invoiceData?.invoices && invoiceData.invoices.length > 0}
					<Card>
						{#snippet children()}
							<div class="overflow-x-auto">
								<table class="w-full text-left text-sm">
									<thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-750 dark:text-gray-400">
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
											<tr
												class="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-750"
											>
												<td class="px-4 py-3">
													<div class="text-sm font-medium text-gray-900 dark:text-white">
														{String(record.metadata || 'Invoice')}
													</div>
												</td>
												<td class="px-4 py-3 font-semibold text-gray-900 dark:text-white">{record.amount}</td>
												<td class="px-4 py-3 text-gray-700 dark:text-gray-300">{record.currency}</td>
												<td class="px-4 py-3">
													<span
														class={cn(
															'rounded-full px-2.5 py-0.5 text-xs font-medium',
															getStatusColor(String(record.status)),
														)}>{record.status}</span
													>
												</td>
												<td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
													{formatInvoicePaidDate(record.paid_on as string | null | undefined)}
												</td>
												<td class="px-4 py-3">
													{#if record.status === 'Pending' || record.status === 'Overdue'}
														<div class="flex flex-wrap items-center gap-2">
															<Button tone="primary" size="sm" onclick={() => openPaymentModal(record)}>
																💳 Pay
															</Button>
															<Button
																tone="secondary"
																size="sm"
																disabled={refreshingInvoiceId === String(record.id)}
																onclick={() => void refreshInvoice(record)}
															>
																{refreshingInvoiceId === String(record.id) ? 'Refreshing…' : '↻ Refresh'}
															</Button>
															<Button tone="secondary" size="sm" onclick={() => demoMarkAsPaid(record)}>
																Demo Pay
															</Button>
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
						{/snippet}
					</Card>
				{:else}
					<div class="rounded-2xl border border-slate-200/80 bg-white px-5 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-800">
						<p class="text-sm font-medium text-slate-800 dark:text-slate-100">{t('invoices_empty_title')}</p>
						<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('invoices_empty_body')}</p>
					</div>
				{/if}
			</section>

			{#if showPaymentModal}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onclick={() => {
						showPaymentModal = false;
						queueMicrotask(reportHeight);
					}}
				>
					<div
						class="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-gray-800"
						onclick={(e: MouseEvent) => e.stopPropagation()}
					>
						<div
							class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700"
						>
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white">💳 Payment Instructions</h3>
							<button
								onclick={() => {
									showPaymentModal = false;
									queueMicrotask(reportHeight);
								}}
								class="text-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button
							>
						</div>
						<div class="space-y-5 p-6">
							{#if paymentLoading}
								<div class="flex justify-center py-8">
									<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
								</div>
							{:else if paymentInfo}
								<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-750">
									<div class="grid grid-cols-2 gap-4 text-sm">
										<div>
											<span class="text-gray-500 dark:text-gray-400">Invoice ID:</span>
											<span class="ml-2 font-medium text-gray-900 dark:text-white"
												>{paymentInfo.invoice_id}</span
											>
										</div>
										<div>
											<span class="text-gray-500 dark:text-gray-400">Currency:</span>
											<span class="ml-2 font-bold text-gray-900 dark:text-white">{paymentInfo.currency}</span
											>
										</div>
									</div>
								</div>
								<div>
									<h4 class="mb-3 font-semibold text-gray-900 dark:text-white">Transfer Details</h4>
									<div class="space-y-3">
										<div>
											<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
												>Recipient (Canister ID)</label
											>
											<code
												class="block break-all rounded bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200"
												>{paymentInfo.principal}</code
											>
										</div>
										{#if paymentInfo.amount_human != null}
											<div>
												<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
													>Exact Amount to Send</label
												>
												<code
													class="block rounded border border-blue-200 bg-blue-50 px-3 py-2 font-mono text-lg font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
													>{paymentInfo.amount_human} {paymentInfo.currency}</code
												>
												<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
													The unique last digits identify your invoice — send this <strong>exact</strong> amount.
												</p>
											</div>
										{/if}
										{#if paymentInfo.subaccount}
											<div>
												<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
													>Subaccount (Hex)</label
												>
												<code
													class="block break-all rounded bg-gray-100 px-3 py-2 font-mono text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-200"
													>{paymentInfo.subaccount}</code
												>
											</div>
										{/if}
									</div>
								</div>
								{#if paymentInfo.note}
									<div
										class="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20"
									>
										<p class="text-sm text-amber-800 dark:text-amber-200">{paymentInfo.note}</p>
									</div>
								{/if}
								<div>
									<h4 class="mb-2 font-semibold text-gray-900 dark:text-white">DFX CLI Command</h4>
									<div class="relative rounded-lg bg-gray-900 p-4">
										<pre class="font-mono text-sm whitespace-pre-wrap text-green-400"
											>{getPaymentCliCommand(paymentInfo)}</pre
										>
										<button
											onclick={() => copyCliCommand(getPaymentCliCommand(paymentInfo))}
											class="absolute top-2 right-2 rounded p-2 text-sm text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
											>{copied ? '✓' : '📋'}</button
										>
									</div>
								</div>
							{:else}
								<p class="py-4 text-center text-red-600 dark:text-red-400">Failed to load payment details.</p>
							{/if}
						</div>
						<div
							class="flex justify-end border-t border-gray-200 px-6 py-4 dark:border-gray-700"
						>
							<Button
								tone="secondary"
								size="sm"
								onclick={() => {
									showPaymentModal = false;
									queueMicrotask(reportHeight);
								}}>Close</Button
							>
						</div>
					</div>
				</div>
			{/if}

			<section class="space-y-3">
				<div class="flex items-center justify-between gap-3 px-0.5">
					<h2 class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{t('accounts_title')}</h2>
					<Button tone="secondary" size="sm" onclick={() => (showAddAccountForm = !showAddAccountForm)}>
						+ Add Account
					</Button>
				</div>

				{#if showAddAccountForm}
					<Card title="Add payment account">
						{#snippet children()}
							<div class="space-y-4">
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Label</label>
									<input
										type="text"
										bind:value={newAccountLabel}
										placeholder="e.g. My ICP Wallet"
										class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									/>
								</div>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
											>Network</label
										>
										<select
											bind:value={newAccountNetwork}
											class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
										>
											{#each networks as net}
												<option value={net.value}>{net.label}</option>
											{/each}
										</select>
									</div>
									<div>
										<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
											>Currency</label
										>
										<select
											bind:value={newAccountCurrency}
											class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
										>
											{#each availableCurrencies as cur}
												<option value={cur.value}>{cur.label}</option>
											{/each}
										</select>
									</div>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label
									>
									<input
										type="text"
										bind:value={newAccountAddress}
										placeholder="Wallet address or IBAN"
										class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									/>
								</div>
								<div class="flex justify-end gap-2">
									<Button
										tone="secondary"
										size="sm"
										onclick={() => {
											showAddAccountForm = false;
											newAccountLabel = '';
											newAccountAddress = '';
										}}>Cancel</Button
									>
									<Button
										tone="primary"
										size="sm"
										disabled={addingAccount || !newAccountLabel || !newAccountAddress}
										onclick={() => addPaymentAccount()}
									>
										{addingAccount ? 'Saving…' : 'Save'}
									</Button>
								</div>
							</div>
						{/snippet}
					</Card>
				{/if}

				{#if accountsLoading && paymentAccounts.length === 0}
					<Card>
						{#snippet children()}
							<div class="flex justify-center py-6">
								<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
							</div>
						{/snippet}
					</Card>
				{:else if paymentAccounts.length === 0}
					<div class="rounded-2xl border border-slate-200/80 bg-white px-5 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-800">
						<p class="text-sm font-medium text-slate-800 dark:text-slate-100">{t('accounts_empty_title')}</p>
						<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('accounts_empty_body')}</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{#each paymentAccounts as account}
							<Card>
								{#snippet children()}
									<div class="flex items-center justify-between">
										<strong class="text-lg text-gray-900 dark:text-white">{account.label}</strong>
										{#if account.is_verified}
											<span
												class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400"
												>✓ Verified</span
											>
										{/if}
									</div>
									<div class="mt-2 flex gap-2">
										<span
											class="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
											>{account.network}</span
										>
										<span
											class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
											>{account.currency}</span
										>
									</div>
									<div class="mt-3 overflow-x-auto rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-750">
										<code class="break-all font-mono text-sm text-gray-700 dark:text-gray-300"
											>{account.address}</code
										>
									</div>
									<div class="mt-3 flex items-center justify-between">
										{#if account.created_at}
											<span class="text-xs text-gray-500 dark:text-gray-400"
												>Created: {new Date(String(account.created_at)).toLocaleDateString()}</span
											>
										{:else}
											<span></span>
										{/if}
										<button
											onclick={() => removePaymentAccount(String(account.id))}
											class="rounded px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
											>🗑 Remove</button
										>
									</div>
								{/snippet}
							</Card>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{/if}
</div>
