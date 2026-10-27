<script lang="ts">
	import { onMount } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';
	import AccessDenied from '../../../_shared/frontend-rt/AccessDenied.svelte';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	let { ctx }: { ctx: any } = $props();

	const cn = ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' '));

	type TabId = 'activity' | 'send' | 'lookup' | 'admin';

	interface TokenInfo {
		ledger: string;
		indexer: string;
		decimals: number;
		symbol: string;
		name: string;
		fee: number;
	}

	interface LedgerRow {
		id: string;
		transaction: string;
		kind: string;
		category: string;
		debit: number;
		credit: number;
		symbol: string;
		at: number;
		description: string;
		user: string;
		fund: string;
	}

	type Reply = { ok: boolean; error?: string; [key: string]: any };
	type Outcome = { tone: 'success' | 'info' | 'warning'; text: string };

	const PAGE_COUNT = 500;
	const LEDGER_MAX = 10_000;
	const DIRECTORY_MAX = 2_000;
	const ACCESS_REFUSAL = /^\S+ needs (\S+)$/;
	const PRINCIPAL_RE = /^[a-z0-9]{5}(-[a-z0-9]{3,5})+$/;

	let activeTab = $state<TabId>('activity');
	let loading = $state(true);
	let sending = $state(false);
	let error = $state('');
	let accessDeniedOp = $state('');

	let profiles = $state<string[]>([]);
	let isAdmin = $derived(profiles.includes('admin'));

	let vaultPrincipal = $state('');

	let treasuryState = $state<'ok' | 'denied' | 'unavailable'>('ok');
	let treasuryPermission = $state('');

	let ledgerCanisters = $state<Record<string, TokenInfo>>({});
	let fundBalances = $state<Record<string, Record<string, number>>>({});
	let tokensLoaded = $state(false);

	let entries = $state<LedgerRow[]>([]);
	let ledgerTruncated = $state(false);
	let txCategory = $state<Record<string, string>>({});
	let currentPage = $state(0);
	const pageSize = 10;

	let lastRefreshTime = $state<Date | null>(null);
	let copiedText = $state('');

	let transferToken = $state('');
	let transferFund = $state('');
	let transferTo = $state('');
	let transferAmountHuman = $state('');
	let sendOutcome = $state<Outcome | null>(null);

	let lookupInvoiceId = $state('');
	let lookupResult = $state<{ invoice: string; status: string } | null>(null);
	let lookupNote = $state('');
	let lookupLoading = $state(false);

	let invoiceCheckBusy = $state(false);
	let invoiceCheckNote = $state('');

	let directoryLabels = $state<Record<string, string>>({});
	let directoryUsers = $state<{ principal: string; label: string }[]>([]);

	let tokenSymbols = $derived(Object.keys(ledgerCanisters));
	let fundIds = $derived(Object.keys(fundBalances));
	// The treasury's books: each token's balance summed over every fund.
	let tokenBalances = $derived.by(() => {
		const totals: Record<string, number> = {};
		for (const symbol of tokenSymbols) totals[symbol] = 0;
		for (const held of Object.values(fundBalances)) {
			for (const [symbol, amount] of Object.entries(held ?? {})) {
				if (symbol in totals) totals[symbol] += num(amount);
			}
		}
		return totals;
	});
	let totalPages = $derived(Math.max(1, Math.ceil(entries.length / pageSize)));
	let pageEntries = $derived(entries.slice(currentPage * pageSize, (currentPage + 1) * pageSize));

	let selectedTokenInfo = $derived(transferToken ? ledgerCanisters[transferToken] : undefined);
	let availableBalance = $derived(
		transferToken && transferFund ? num(fundBalances[transferFund]?.[transferToken]) : 0,
	);
	let transferFee = $derived(selectedTokenInfo?.fee ?? 0);
	let parsedTransferAmount = $derived(
		toBaseUnits(transferAmountHuman, selectedTokenInfo?.decimals ?? 8),
	);
	let recipientTrimmed = $derived(transferTo.trim());
	let recipientLabel = $derived(directoryLabels[recipientTrimmed] || '');
	let recipientValid = $derived(
		recipientTrimmed !== '' && (PRINCIPAL_RE.test(recipientTrimmed) || recipientLabel !== ''),
	);
	let canSubmitTransfer = $derived(
		recipientValid &&
			parsedTransferAmount != null &&
			parsedTransferAmount > 0 &&
			!!selectedTokenInfo &&
			transferFund !== '' &&
			!sending,
	);

	function num(value: unknown): number {
		const n = Number(value);
		return Number.isFinite(n) ? n : 0;
	}

	function formatAmount(raw: number, decimals: number): string {
		return (raw / Math.pow(10, decimals)).toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: Math.min(decimals, 8),
		});
	}

	function formatWithSymbol(raw: number, decimals: number, symbol: string): string {
		return `${formatAmount(raw, decimals)} ${symbol}`;
	}

	function rawUnitsLabel(raw: number): string {
		return `${raw.toLocaleString()} base units`;
	}

	function toBaseUnits(input: string, decimals: number): number | null {
		const trimmed = input.trim();
		if (!trimmed) return null;
		const parts = trimmed.split('.');
		if (parts.length > 2) return null;
		const whole = parts[0];
		const frac = parts[1] ?? '';
		if (!/^\d+$/.test(whole) || (frac && !/^\d+$/.test(frac))) return null;
		if (frac.length > decimals) return null;
		const padded = frac.padEnd(decimals, '0');
		const combined = decimals > 0 ? whole + padded : whole;
		const n = Number(combined);
		return Number.isFinite(n) && n >= 0 ? n : null;
	}

	function baseUnitsToHumanInput(raw: number, decimals: number): string {
		const s = String(raw).padStart(decimals + 1, '0');
		if (decimals === 0) return s;
		const whole = s.slice(0, -decimals) || '0';
		let frac = s.slice(-decimals).replace(/0+$/, '');
		return frac ? `${whole}.${frac}` : whole;
	}

	function tokenInfo(symbol: string): TokenInfo {
		return (
			ledgerCanisters[symbol] ?? { ledger: '', indexer: '', decimals: 8, symbol, name: symbol, fee: 0 }
		);
	}

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedText = text;
			setTimeout(() => (copiedText = ''), 2000);
		} catch {}
	}

	function timeAgo(date: Date): string {
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return `${Math.floor(hours / 24)}d ago`;
	}

	function entryDate(e: LedgerRow): Date | null {
		return e.at > 0 ? new Date(e.at * 1000) : null;
	}

	function shortPrincipalMiddle(p: string, total = 20): string {
		if (p.length <= total) return p;
		const half = Math.floor((total - 1) / 2);
		return `${p.slice(0, half)}…${p.slice(-half)}`;
	}

	function partyLabel(p: string | undefined | null): { display: string; title: string; copyable: boolean } {
		if (!p) return { display: '—', title: '', copyable: false };
		if (p === vaultPrincipal) return { display: 'This vault', title: p, copyable: false };
		if (directoryLabels[p]) return { display: directoryLabels[p], title: p, copyable: false };
		return { display: shortPrincipalMiddle(p), title: p, copyable: true };
	}

	// A cash entry's type: the other side of its transaction (transfer, payroll, tax, …).
	function entryKind(e: LedgerRow): string {
		if (e.description.startsWith('reversal of ')) return 'reversal';
		return txCategory[e.transaction] || (e.category === 'cash' ? 'allocation' : e.category) || 'cash';
	}

	function typeLabel(kind: string): string {
		const k = (kind || 'cash').replace(/_/g, ' ');
		return k.charAt(0).toUpperCase() + k.slice(1);
	}

	function typeBadgeClass(e: LedgerRow): string {
		if (entryKind(e) === 'reversal') {
			return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300';
		}
		const net = e.debit - e.credit;
		if (net > 0) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300';
		if (net < 0) return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300';
		return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
	}

	function entryAmountDisplay(e: LedgerRow): { text: string; className: string; title: string } {
		const info = tokenInfo(e.symbol);
		const net = e.debit - e.credit;
		const formatted = formatWithSymbol(Math.abs(net), info.decimals, info.symbol);
		if (net > 0) {
			return { text: `+${formatted}`, className: 'text-emerald-600 dark:text-emerald-400', title: rawUnitsLabel(net) };
		}
		if (net < 0) {
			return { text: `−${formatted}`, className: 'text-rose-600 dark:text-rose-400', title: rawUnitsLabel(-net) };
		}
		return { text: formatted, className: 'text-gray-600 dark:text-gray-400', title: rawUnitsLabel(0) };
	}

	function errorSummary(msg: string): string {
		try {
			const parsed = JSON.parse(msg);
			if (parsed && typeof parsed.error === 'string') return parsed.error;
		} catch {
			// not a JSON payload
		}
		const rejected = msg.match(/Reject text:\s*([^\n]+?)(?:\s+Error code|\s+Call context|$)/);
		if (rejected) return rejected[1].trim();
		const firstLine = msg.split('\n')[0].trim();
		return firstLine.length > 200 ? `${firstLine.slice(0, 200)}…` : firstLine;
	}

	async function confirmModal(opts: {
		title: string;
		body: string;
		confirmLabel?: string;
		danger?: boolean;
	}): Promise<boolean> {
		if (typeof ctx.openModal !== 'function') return true;
		try {
			const { actionId } = await ctx.openModal({
				title: opts.title,
				body: opts.body,
				actions: [
					{ id: 'cancel', label: 'Cancel', tone: 'secondary' },
					{
						id: 'confirm',
						label: opts.confirmLabel || 'Confirm',
						tone: opts.danger ? 'danger' : 'primary',
					},
				],
			});
			return actionId === 'confirm';
		} catch {
			return false;
		}
	}

	function openSendWithToken(symbol: string) {
		transferToken = symbol;
		if (!transferFund || !(transferFund in fundBalances)) {
			const richest = [...fundIds].sort(
				(a, b) => num(fundBalances[b]?.[symbol]) - num(fundBalances[a]?.[symbol]),
			)[0];
			transferFund = richest ?? '';
		}
		sendOutcome = null;
		activeTab = 'send';
	}

	function fillMaxAmount() {
		if (!selectedTokenInfo) return;
		const max = Math.max(0, availableBalance - transferFee);
		transferAmountHuman = baseUnitsToHumanInput(max, selectedTokenInfo.decimals);
	}

	// ── Data loading ─────────────────────────────────────────

	/** A realm operation's reply; a thrown call becomes `{ ok: false }` like a refusal. */
	async function call(kind: 'read' | 'run', name: string, args: Record<string, unknown> = {}): Promise<Reply> {
		try {
			const reply = await ctx[kind](name, args);
			if (reply && typeof reply === 'object') return reply;
			return { ok: false, error: `${name} gave no reply` };
		} catch (e: any) {
			console.warn(`${name} failed:`, e);
			return { ok: false, error: e?.message ?? String(e) };
		}
	}

	/** The permission an access refusal names ('' when signing in is needed), or null for other failures. */
	function refusedPermission(message: unknown): string | null {
		const text = String(message ?? '');
		if (text === 'sign in first') return '';
		return text.match(ACCESS_REFUSAL)?.[1] ?? null;
	}

	function showActionFailure(message: unknown) {
		const permission = refusedPermission(message);
		accessDeniedOp = permission ?? '';
		error = permission == null ? String(message ?? '') || 'The realm refused the request.' : '';
	}

	/** Every page of a paginated read (following `next`) up to `max` rows; null if the first page is refused. */
	async function readAll(name: string, key: string, max: number, args: Record<string, unknown> = {}) {
		const rows: any[] = [];
		let from: number | null = 1;
		let more = false;
		while (from != null) {
			if (rows.length >= max) {
				more = true;
				break;
			}
			const reply = await call('read', name, { ...args, from, count: PAGE_COUNT });
			if (!reply.ok) {
				if (from === 1) return { reply, rows: null, more: false };
				break;
			}
			if (Array.isArray(reply[key])) rows.push(...reply[key]);
			from = reply.next ?? null;
		}
		return { reply: null, rows, more };
	}

	async function loadDirectory() {
		const { rows } = await readAll('user_list', 'users', DIRECTORY_MAX);
		const labels: Record<string, string> = {};
		const users: { principal: string; label: string }[] = [];
		for (const u of rows ?? []) {
			const id = String(u?.id ?? '');
			if (!id) continue;
			const nickname = String(u?.nickname ?? '').trim();
			if (nickname) labels[id] = nickname;
			users.push({ principal: id, label: nickname || id });
		}
		directoryLabels = labels;
		directoryUsers = users;
	}

	async function loadTreasury(): Promise<Reply> {
		const funds: Record<string, Record<string, number>> = {};
		let tokens: any[] = [];
		let from: number | null = 1;
		while (from != null) {
			const reply = await call('read', 'treasury_view', { from, count: PAGE_COUNT });
			if (!reply.ok) {
				if (from === 1) return reply;
				break;
			}
			Object.assign(funds, reply.funds ?? {});
			if (Array.isArray(reply.tokens)) tokens = reply.tokens;
			from = reply.next ?? null;
		}
		return { ok: true, funds, tokens };
	}

	async function loadLedger() {
		const { rows, more } = await readAll('ledger_view', 'entries', LEDGER_MAX);
		const categories: Record<string, string> = {};
		const cash: LedgerRow[] = [];
		for (const raw of rows ?? []) {
			const e: LedgerRow = {
				id: String(raw?.id ?? ''),
				transaction: String(raw?.transaction ?? ''),
				kind: String(raw?.kind ?? ''),
				category: String(raw?.category ?? ''),
				debit: num(raw?.debit),
				credit: num(raw?.credit),
				symbol: String(raw?.symbol ?? ''),
				at: num(raw?.at),
				description: String(raw?.description ?? ''),
				user: String(raw?.user ?? ''),
				fund: String(raw?.fund ?? ''),
			};
			if (e.kind === 'asset') cash.push(e);
			else if (e.category && e.category !== 'ledger_fee' && !categories[e.transaction]) {
				categories[e.transaction] = e.category;
			}
		}
		txCategory = categories;
		entries = cash.reverse();
		ledgerTruncated = more;
		if (currentPage >= totalPages) currentPage = 0;
	}

	async function loadAll() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const [status, catalog, treasury] = await Promise.all([
				call('read', 'status'),
				call('read', 'token_catalog'),
				loadTreasury(),
				loadDirectory(),
			]);
			vaultPrincipal = String((status.ok && status.canister) || ctx.config?.canisterId || '');

			const names: Record<string, string> = {};
			for (const t of catalog.ok && Array.isArray(catalog.tokens) ? catalog.tokens : []) {
				if (t?.symbol && t?.name) names[String(t.symbol)] = String(t.name);
			}

			if (!treasury.ok) {
				const permission = refusedPermission(treasury.error);
				treasuryState = permission == null ? 'unavailable' : 'denied';
				treasuryPermission = permission ?? '';
				ledgerCanisters = {};
				fundBalances = {};
				entries = [];
				return;
			}

			treasuryState = 'ok';
			const canisters: Record<string, TokenInfo> = {};
			for (const t of treasury.tokens ?? []) {
				const symbol = String(t?.id ?? '');
				if (!symbol) continue;
				const decimals = Number(t?.decimals);
				canisters[symbol] = {
					ledger: String(t?.ledger ?? ''),
					indexer: String(t?.indexer ?? ''),
					decimals: Number.isInteger(decimals) && decimals >= 0 ? decimals : 8,
					symbol,
					name: names[symbol] || symbol,
					fee: num(t?.fee),
				};
			}
			ledgerCanisters = canisters;
			fundBalances = treasury.funds ?? {};
			if (!transferToken || !(transferToken in canisters)) transferToken = Object.keys(canisters)[0] ?? '';
			if (!transferFund || !(transferFund in fundBalances)) transferFund = Object.keys(fundBalances)[0] ?? '';

			await loadLedger();
		} finally {
			tokensLoaded = true;
			lastRefreshTime = new Date();
			loading = false;
		}
	}

	// ── Mutations ────────────────────────────────────────────

	function invoiceRefusal(message: unknown): string {
		const permission = refusedPermission(message);
		if (permission == null) return errorSummary(String(message ?? ''));
		return permission ? `Checking invoices needs the ${permission} permission.` : 'Sign in to check invoices.';
	}

	/** Ask the ledgers whether open invoices were paid (one batch); paid ones are booked into the treasury. */
	async function checkInvoicePayments() {
		invoiceCheckBusy = true;
		invoiceCheckNote = '';
		try {
			const reply = await call('run', 'invoice_refresh');
			if (!reply.ok) {
				invoiceCheckNote = invoiceRefusal(reply.error);
				return;
			}
			const checked = num(reply.checked);
			const paid = num(reply.paid);
			invoiceCheckNote =
				checked === 0
					? 'No open invoices to check.'
					: `Checked ${checked} open invoice${checked === 1 ? '' : 's'}; ${paid} newly paid.` +
						(reply.next != null ? ' More remain: run it again.' : '');
			if (paid > 0) await loadAll();
		} finally {
			invoiceCheckBusy = false;
		}
	}

	async function performTransfer() {
		if (!canSubmitTransfer || !selectedTokenInfo || parsedTransferAmount == null) return;

		const symbol = selectedTokenInfo.symbol;
		const humanDisplay = formatWithSymbol(parsedTransferAmount, selectedTokenInfo.decimals, symbol);
		const recipientDisplay = recipientLabel || recipientTrimmed;

		const ok = await confirmModal({
			title: 'Confirm send',
			body: `Send ${humanDisplay} from fund ${transferFund} to ${recipientDisplay}? This cannot be undone.`,
			confirmLabel: 'Send',
			danger: true,
		});
		if (!ok) return;

		sending = true;
		error = '';
		accessDeniedOp = '';
		sendOutcome = null;
		try {
			const reply = await call('run', 'transfer_create', {
				fund: transferFund,
				to: recipientTrimmed,
				amount: parsedTransferAmount,
				symbol,
			});
			if (!reply.ok) {
				showActionFailure(reply.error);
				return;
			}
			const id = String(reply.transfer ?? '');
			if (reply.proposal) {
				sendOutcome = {
					tone: 'info',
					text: `Submitted for a vote as proposal ${reply.proposal}. The payment is made once it is approved.`,
				};
			} else if (reply.status === 'completed') {
				sendOutcome = { tone: 'success', text: `Sent ${humanDisplay} to ${recipientDisplay}.` };
			} else if (reply.status === 'pending') {
				sendOutcome = {
					tone: 'warning',
					text: `Transfer ${id} is pending: the ledger call did not go through, so the amount stays reserved.`,
				};
			} else {
				sendOutcome = {
					tone: 'warning',
					text: `The ledger did not accept transfer ${id}; the fund was refunded.`,
				};
			}
			if (typeof ctx.notify === 'function') {
				ctx.notify(sendOutcome.tone, sendOutcome.text);
			}
			if (reply.proposal || reply.status === 'completed') {
				transferTo = '';
				transferAmountHuman = '';
			}
			await loadAll();
		} finally {
			sending = false;
		}
	}

	async function lookupInvoice() {
		const invoice = lookupInvoiceId.trim();
		lookupResult = null;
		lookupNote = '';
		if (!invoice) {
			lookupNote = 'Enter an invoice ID to check.';
			return;
		}
		lookupLoading = true;
		try {
			const reply = await call('run', 'invoice_refresh', { invoice });
			if (!reply.ok) {
				lookupNote = invoiceRefusal(reply.error);
				return;
			}
			const statuses = reply.invoices && typeof reply.invoices === 'object' ? reply.invoices : {};
			const status = statuses[invoice] ?? Object.values(statuses)[0];
			lookupResult = { invoice, status: String(status ?? 'unknown') };
			if (num(reply.paid) > 0) await loadAll();
		} finally {
			lookupLoading = false;
		}
	}

	// ── Pagination ───────────────────────────────────────────

	function goToPage(page: number) {
		currentPage = Math.max(0, Math.min(page, totalPages - 1));
	}

	function paginationPages(total: number, current: number): (number | '...')[] {
		if (total <= 7) return Array.from({ length: total }, (_, i) => i);
		const pages: (number | '...')[] = [0];
		if (current > 3) pages.push('...');
		for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) pages.push(i);
		if (current < total - 4) pages.push('...');
		pages.push(total - 1);
		return pages;
	}

	const everydayTabs: { id: TabId; label: string }[] = [
		{ id: 'activity', label: 'Activity' },
		{ id: 'lookup', label: 'Lookup' },
	];

	let narrow = $state(isNarrowViewport());

	// ── Init ─────────────────────────────────────────────────

	onMount(() => {
		const unsubs: (() => void)[] = [subscribeNarrowViewport((value) => {
			narrow = value;
		})];
		if (ctx.userProfiles?.subscribe) {
			unsubs.push(
				ctx.userProfiles.subscribe((v: string[]) => {
					profiles = v || [];
				}),
			);
		}

		void loadAll();

		return () => {
			for (const unsub of unsubs) unsub();
		};
	});
</script>

{#snippet spinner()}
	<svg
		class="inline-block w-4 h-4 animate-spin"
		viewBox="0 0 24 24"
		fill="none"
		aria-hidden="true"
	>
		<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
		<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
	</svg>
{/snippet}

{#snippet refreshIcon()}
	<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M4 4v5h5M20 20v-5h-5M4.93 4.93a10 10 0 0114.14 0M19.07 19.07a10 10 0 01-14.14 0"
		/>
	</svg>
{/snippet}

{#snippet gearIcon()}
	<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M12 15a3 3 0 100-6 3 3 0 000 6z"
		/>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
		/>
	</svg>
{/snippet}

<div class={cn('w-full py-3 sm:py-6 space-y-4 sm:space-y-6')}>
	<!-- Header: title on its own row -->
	<div class={cn('flex flex-col gap-2')}>
		<div class={cn('flex justify-between items-start gap-4')}>
		<div>
			<h1 class={cn('text-2xl font-bold text-gray-900 dark:text-gray-100')}>Vault</h1>
			<p class={cn('text-sm text-gray-500 dark:text-gray-400 mt-1')}>{extensionDescription}</p>
		</div>
		<button
			type="button"
			onclick={loadAll}
			disabled={loading}
			aria-label="Refresh"
			title="Refresh"
			class={cn(
				'p-2 rounded-lg text-gray-500 dark:text-gray-400',
				'hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200',
				'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
			)}
		>
			<span class={cn(loading ? 'inline-block animate-spin' : '')}>
				{@render refreshIcon()}
			</span>
		</button>
		</div>
	</div>

	<!-- Hero balance card -->
	{#if treasuryState === 'denied'}
		<div
			class={cn(
				'border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center',
				'bg-gray-50 dark:bg-gray-800/50',
			)}
		>
			<p class={cn('text-sm font-medium text-gray-600 dark:text-gray-300')}>Treasury not visible to you</p>
			<p class={cn('text-xs text-gray-500 dark:text-gray-400 mt-1')}>
				Viewing the vault needs the {treasuryPermission || 'signed-in'} permission.
			</p>
		</div>
	{:else if treasuryState === 'unavailable'}
		<div
			class={cn(
				'border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center',
				'bg-gray-50 dark:bg-gray-800/50',
			)}
		>
			<p class={cn('text-sm font-medium text-gray-600 dark:text-gray-300')}>Treasury unavailable</p>
			<p class={cn('text-xs text-gray-500 dark:text-gray-400 mt-1')}>
				The realm did not return its treasury just now. Use refresh to try again.
			</p>
		</div>
	{:else if tokensLoaded && tokenSymbols.length > 0}
		<div
			class={cn(
				'bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20',
				'border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5',
			)}
		>
			<div class={cn('space-y-3')}>
				{#each tokenSymbols as token (token)}
					{@const info = ledgerCanisters[token]}
					{@const bal = tokenBalances[token] || 0}
					<div
						class={cn(
							'flex items-center justify-between gap-4 py-3 sm:bg-white/60 sm:dark:bg-gray-800/40 sm:rounded-lg sm:p-4',
							'border-b border-indigo-200/60 last:border-0 dark:border-indigo-800/40 sm:border-0',
						)}
						title={rawUnitsLabel(bal)}
					>
						<div>
							<div class={cn('text-sm font-semibold text-indigo-900 dark:text-indigo-200')}>
								{info.symbol}
							</div>
							<div class={cn('text-xs text-indigo-600/70 dark:text-indigo-400/70')}>{info.name}</div>
						</div>
						<div class={cn('flex items-center gap-4')}>
							<div
								class={cn('text-2xl font-bold text-indigo-900 dark:text-indigo-100 tabular-nums')}
							>
								{formatWithSymbol(bal, info.decimals, info.symbol)}
							</div>
							<button
								type="button"
								onclick={() => openSendWithToken(token)}
								class={cn(
									'px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg',
									'hover:bg-indigo-700 transition-colors shrink-0',
								)}
							>
								Send
							</button>
						</div>
					</div>
				{/each}
			</div>
			<p class={cn('mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium')}>
				Booked balance across the treasury's {fundIds.length} fund{fundIds.length === 1 ? '' : 's'}
			</p>
		</div>
	{:else if tokensLoaded}
		<div
			class={cn(
				'border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center',
				'bg-gray-50 dark:bg-gray-800/50',
			)}
		>
			<p class={cn('text-sm font-medium text-gray-600 dark:text-gray-300')}>No token configured</p>
			<p class={cn('text-xs text-gray-500 dark:text-gray-400 mt-1')}>
				This realm's treasury has no active token yet, so the vault holds no balance.
			</p>
		</div>
	{/if}

	<!-- Technical details -->
	<details class={cn('rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50')}>
		<summary
			class={cn(
				'px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none',
			)}
		>
			Technical details
		</summary>
		<div class={cn('px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3')}>
			<div class={cn('flex flex-wrap items-center gap-2')}>
				<span class={cn('text-xs font-medium text-gray-500 dark:text-gray-400')}>Vault Principal:</span>
				<button
					type="button"
					onclick={() => copyToClipboard(vaultPrincipal)}
					class={cn('font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:underline')}
					title={vaultPrincipal}
				>
					{vaultPrincipal || '—'}
				</button>
				{#if copiedText === vaultPrincipal && vaultPrincipal}
					<span class={cn('text-xs text-green-600 dark:text-green-400')}>Copied!</span>
				{/if}
			</div>
			{#if lastRefreshTime}
				<div class={cn('text-xs text-gray-600 dark:text-gray-400')}>
					<span class={cn('font-medium')}>Last loaded:</span>
					<span class={cn('ml-1')}>
						{lastRefreshTime.toLocaleString()} ({timeAgo(lastRefreshTime)})
					</span>
				</div>
			{/if}
			{#each tokenSymbols as token (token)}
				{@const info = ledgerCanisters[token]}
				<div
					class={cn('text-xs space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700 first:border-0 first:pt-0')}
				>
					<div class={cn('font-semibold text-gray-700 dark:text-gray-300')}>{info.symbol}</div>
					<div class={cn('text-gray-500 dark:text-gray-400')}>Name: {info.name}</div>
					<div class={cn('text-gray-500 dark:text-gray-400')}>Decimals: {info.decimals}</div>
					<div class={cn('text-gray-500 dark:text-gray-400')}>
						Transfer fee: {formatWithSymbol(info.fee, info.decimals, info.symbol)}
					</div>
					<div class={cn('flex flex-wrap items-center gap-2')}>
						<span class={cn('text-gray-500 dark:text-gray-400')}>Ledger:</span>
						<button
							type="button"
							onclick={() => copyToClipboard(info.ledger)}
							class={cn('font-mono text-indigo-600 dark:text-indigo-400 hover:underline')}
						>
							{info.ledger || '—'}
						</button>
						{#if copiedText === info.ledger}
							<span class={cn('text-green-600 dark:text-green-400')}>Copied!</span>
						{/if}
					</div>
					<div class={cn('flex flex-wrap items-center gap-2')}>
						<span class={cn('text-gray-500 dark:text-gray-400')}>Indexer:</span>
						<button
							type="button"
							onclick={() => copyToClipboard(info.indexer)}
							class={cn('font-mono text-indigo-600 dark:text-indigo-400 hover:underline')}
						>
							{info.indexer || '—'}
						</button>
						{#if copiedText === info.indexer}
							<span class={cn('text-green-600 dark:text-green-400')}>Copied!</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</details>

	<!-- Error -->
	{#if accessDeniedOp}
		<AccessDenied operation={accessDeniedOp} />
	{:else if error}
		<div
			class={cn(
				'p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-300',
			)}
		>
			<p class={cn('font-medium')}>{errorSummary(error)}</p>
			{#if errorSummary(error) !== error}
				<details class={cn('mt-2')}>
					<summary class={cn('text-xs cursor-pointer select-none opacity-80')}>Show details</summary>
					<pre
						class={cn(
							'mt-2 text-xs whitespace-pre-wrap break-words max-h-48 overflow-auto opacity-90',
						)}>{error}</pre>
				</details>
			{/if}
		</div>
	{/if}

	<!-- Tabs: Activity + Lookup. Send is only the balance-card CTA. -->
	<nav class={cn('flex border-b border-gray-200 dark:border-gray-700')}>
		{#each everydayTabs as t (t.id)}
			<button
				type="button"
				onclick={() => {
					activeTab = t.id;
				}}
				class={cn(
					'px-3 py-2.5 sm:px-4 text-sm font-medium border-b-2 transition-colors',
					activeTab === t.id
						? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
						: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
				)}
			>
				{t.label}
			</button>
		{/each}
		{#if isAdmin}
			<button
				type="button"
				onclick={() => {
					activeTab = 'admin';
				}}
				class={cn(
					'ml-auto px-3 py-2.5 sm:px-4 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-1.5',
					activeTab === 'admin'
						? 'border-gray-400 text-gray-700 dark:text-gray-300 dark:border-gray-500'
						: 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400',
				)}
				title="Admin"
				aria-label="Admin"
			>
				{@render gearIcon()}
				<span class="hidden sm:inline">Admin</span>
			</button>
		{/if}
	</nav>

	<!-- Tab Content -->
	<div>
		{#if activeTab === 'activity'}
			<div
				class={cn(
					'bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 overflow-hidden sm:border sm:rounded-xl',
				)}
			>
				<h2
					class={cn(
						'text-lg font-semibold px-4 py-3 sm:p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100',
					)}
				>
					Activity
				</h2>

				{#if loading && entries.length === 0}
					<div class={cn('divide-y divide-gray-100 dark:divide-gray-700')}>
						{#each Array(4) as _, i (i)}
							<div class={cn('px-4 py-4 animate-pulse flex gap-4')}>
								<div class={cn('h-4 bg-gray-200 dark:bg-gray-700 rounded w-20')}></div>
								<div class={cn('h-4 bg-gray-200 dark:bg-gray-700 rounded w-16')}></div>
								<div class={cn('h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 hidden sm:block')}></div>
								<div class={cn('h-4 bg-gray-200 dark:bg-gray-700 rounded w-24')}></div>
								<div class={cn('h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto')}></div>
							</div>
						{/each}
					</div>
				{:else if treasuryState !== 'ok'}
					<div class={cn('px-6 py-12 text-center')}>
						<p class={cn('text-sm font-medium text-gray-500 dark:text-gray-400')}>No activity to show</p>
						<p class={cn('text-xs text-gray-400 dark:text-gray-500 mt-1')}>
							Treasury activity is shown to members who may view the treasury.
						</p>
					</div>
				{:else if entries.length === 0}
					<div class={cn('px-6 py-12 text-center')}>
						<svg
							class={cn('w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3')}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/>
						</svg>
						<p class={cn('text-sm font-medium text-gray-500 dark:text-gray-400')}>No activity yet</p>
						<p class={cn('text-xs text-gray-400 dark:text-gray-500 mt-1')}>
							Payments into and out of the treasury's funds will appear here.
						</p>
					</div>
				{:else if narrow}
					<div class={cn('divide-y divide-gray-100 dark:divide-gray-700')}>
						{#each pageEntries as e (e.id)}
							{@const txDate = entryDate(e)}
							{@const who = partyLabel(e.user)}
							{@const amt = entryAmountDisplay(e)}
							<article class={cn('px-4 py-3')}>
								<div class={cn('flex items-start justify-between gap-3')}>
									<div class={cn('min-w-0')}>
										<div class={cn('inline-block px-1.5 rounded text-xs font-medium', typeBadgeClass(e))}>
											{typeLabel(entryKind(e))}
										</div>
										<div class={cn('mt-1 text-xs text-gray-500 dark:text-gray-400 break-words')}>
											{e.description || '—'}
										</div>
										<div class={cn('mt-0.5 text-xs text-gray-400')}>
											Fund {e.fund || '—'}
											{#if e.user}
												·
												{#if who.copyable}
													<button
														type="button"
														onclick={() => copyToClipboard(e.user)}
														class={cn('text-indigo-600 dark:text-indigo-400 hover:underline')}
														title={who.title}
													>
														{who.display}
													</button>
												{:else}
													<span title={who.title}>{who.display}</span>
												{/if}
											{/if}
										</div>
									</div>
									<div class={cn('text-right shrink-0')}>
										<div class={cn('font-medium tabular-nums text-sm', amt.className)} title={amt.title}>
											{amt.text}
										</div>
										{#if txDate}
											<button
												type="button"
												onclick={() => copyToClipboard(txDate.toLocaleString())}
												class={cn('text-xs text-gray-400 hover:underline')}
												title={txDate.toLocaleString()}
											>
												{timeAgo(txDate)}
											</button>
										{/if}
									</div>
								</div>
							</article>
						{/each}
					</div>
				{:else}
					<div class={cn('overflow-x-auto')}>
						<table class={cn('w-full text-sm')}>
							<thead class={cn('bg-gray-50 dark:bg-gray-700/50')}>
								<tr>
									<th
										class={cn(
											'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase',
										)}
									>
										When
									</th>
									<th
										class={cn(
											'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase',
										)}
									>
										Type
									</th>
									<th
										class={cn(
											'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase',
										)}
									>
										Fund
									</th>
									<th
										class={cn(
											'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase',
										)}
									>
										Details
									</th>
									<th
										class={cn(
											'px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase',
										)}
									>
										Amount
									</th>
								</tr>
							</thead>
							<tbody class={cn('divide-y divide-gray-100 dark:divide-gray-700')}>
								{#each pageEntries as e (e.id)}
									{@const txDate = entryDate(e)}
									{@const who = partyLabel(e.user)}
									{@const amt = entryAmountDisplay(e)}
									<tr class={cn('hover:bg-gray-50 dark:hover:bg-gray-700/30')}>
										<td class={cn('px-4 py-3')}>
											{#if txDate}
												<button
													type="button"
													onclick={() => copyToClipboard(txDate.toLocaleString())}
													class={cn(
														'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left',
													)}
													title={txDate.toLocaleString()}
												>
													{timeAgo(txDate)}
												</button>
												{#if copiedText === txDate.toLocaleString()}
													<span class={cn('ml-1 text-xs text-green-600 dark:text-green-400')}>✓</span>
												{/if}
											{:else}
												<span class={cn('text-gray-400')}>—</span>
											{/if}
											<div class={cn('text-xs text-gray-400 dark:text-gray-500 mt-0.5')}>
												{e.transaction || e.id}
											</div>
										</td>
										<td class={cn('px-4 py-3')}>
											<span class={cn('px-2 py-0.5 rounded text-xs font-medium', typeBadgeClass(e))}>
												{typeLabel(entryKind(e))}
											</span>
										</td>
										<td class={cn('px-4 py-3')}>
											<span class={cn('text-xs text-gray-700 dark:text-gray-300')}>{e.fund || '—'}</span>
										</td>
										<td class={cn('px-4 py-3')}>
											<div class={cn('text-xs text-gray-700 dark:text-gray-300')}>{e.description || '—'}</div>
											{#if e.user}
												{#if who.copyable}
													<button
														type="button"
														onclick={() => copyToClipboard(e.user)}
														class={cn(
															'text-indigo-600 dark:text-indigo-400 hover:underline text-left text-xs',
														)}
														title={who.title}
													>
														{who.display}
													</button>
													{#if copiedText === e.user}
														<span class={cn('ml-1 text-xs text-green-600 dark:text-green-400')}>✓</span>
													{/if}
												{:else}
													<span class={cn('text-xs text-gray-500 dark:text-gray-400')} title={who.title}>
														{who.display}
													</span>
												{/if}
											{/if}
										</td>
										<td class={cn('px-4 py-3 text-right')}>
											<span class={cn('font-medium tabular-nums', amt.className)} title={amt.title}>
												{amt.text}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}

				{#if treasuryState === 'ok' && entries.length > 0}
					{@const total = entries.length}
					{@const start = currentPage * pageSize + 1}
					{@const end = Math.min((currentPage + 1) * pageSize, total)}
					{@const multiPage = totalPages > 1}
					<div
						class={cn(
							'p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3',
						)}
					>
						<span class={cn('text-xs text-gray-500 dark:text-gray-400')}>
							Showing {start}–{end} of {total}
							{#if multiPage}
								<span class={cn('ml-1')}
									>(Page {currentPage + 1} of {totalPages})</span
								>
							{/if}
							{#if ledgerTruncated}
								<span class={cn('ml-1')}>· from the first {LEDGER_MAX.toLocaleString()} ledger entries</span>
							{/if}
						</span>
						{#if multiPage}
							<div class={cn('flex items-center gap-1')}>
								<button
									type="button"
									onclick={() => goToPage(currentPage - 1)}
									disabled={currentPage === 0}
									class={cn(
										'px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed',
									)}
								>
									Prev
								</button>
								{#each paginationPages(totalPages, currentPage) as p, i (i)}
									{#if p === '...'}
										<span class={cn('px-1.5 text-xs text-gray-400')}>…</span>
									{:else}
										<button
											type="button"
											onclick={() => goToPage(p as number)}
											class={cn(
												'px-2.5 py-1 text-xs border rounded',
												currentPage === p
													? 'bg-indigo-600 text-white border-indigo-600'
													: 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
											)}
										>
											{(p as number) + 1}
										</button>
									{/if}
								{/each}
								<button
									type="button"
									onclick={() => goToPage(currentPage + 1)}
									disabled={currentPage >= totalPages - 1}
									class={cn(
										'px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed',
									)}
								>
									Next
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>

		{:else if activeTab === 'send'}
			<div
				class={cn(
					'bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 p-4 sm:border sm:rounded-xl sm:p-6',
				)}
			>
				<button
					type="button"
					onclick={() => {
						activeTab = 'activity';
					}}
					class={cn('text-sm text-indigo-600 dark:text-indigo-400 mb-3 inline-flex items-center gap-1')}
				>
					← Activity
				</button>
				<h2 class={cn('text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4')}>Send tokens</h2>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						performTransfer();
					}}
					class={cn('space-y-4')}
				>
					<div>
						<span class={cn('block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5')}>
							Token
						</span>
						{#if tokenSymbols.length === 0}
							<p class={cn('text-sm text-gray-500 dark:text-gray-400')}>
								No token is configured for this realm's treasury, so nothing can be sent yet.
							</p>
						{:else if tokenSymbols.length === 1}
							<p class={cn('text-sm text-gray-900 dark:text-gray-100')}>
								Sending {ledgerCanisters[tokenSymbols[0]].symbol}
							</p>
						{:else}
							<select
								id="v-token"
								bind:value={transferToken}
								class={cn(
									'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40',
								)}
							>
								{#each tokenSymbols as token (token)}
									<option value={token}>{ledgerCanisters[token].symbol}</option>
								{/each}
							</select>
						{/if}
					</div>

					<div>
						<span class={cn('block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5')}>
							From fund
						</span>
						{#if fundIds.length === 0}
							<p class={cn('text-sm text-gray-500 dark:text-gray-400')}>
								The treasury has no fund yet, so nothing can be sent.
							</p>
						{:else if fundIds.length === 1}
							<p class={cn('text-sm text-gray-900 dark:text-gray-100')}>Paying from fund {fundIds[0]}</p>
						{:else}
							<select
								id="v-fund"
								bind:value={transferFund}
								class={cn(
									'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40',
								)}
							>
								{#each fundIds as fund (fund)}
									<option value={fund}>{fund}</option>
								{/each}
							</select>
						{/if}
					</div>

					<div>
						<label for="v-to" class={cn('block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5')}>
							Recipient
						</label>
						<input
							id="v-to"
							type="text"
							list="v-member-list"
							bind:value={transferTo}
							placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
							class={cn(
								'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40',
							)}
						/>
						<datalist id="v-member-list">
							{#each directoryUsers as entry (entry.principal)}
								<option value={entry.principal}>{entry.label}</option>
							{/each}
						</datalist>
						{#if recipientTrimmed && !recipientValid}
							<p class={cn('text-xs text-red-600 dark:text-red-400 mt-1')}>
								Enter a valid principal ID (e.g. xxxxx-xxxxx-xxxxx-xxxxx-xxx).
							</p>
						{:else if recipientLabel}
							<p class={cn('text-xs text-gray-600 dark:text-gray-400 mt-1')}>{recipientLabel}</p>
						{:else}
							<p class={cn('text-xs text-gray-500 dark:text-gray-400 mt-1')}>
								Principal ID of the recipient, or pick a member.
							</p>
						{/if}
					</div>

					<div>
						<div class={cn('flex items-center justify-between mb-1.5')}>
							<label
								for="v-amount"
								class={cn('text-sm font-medium text-gray-700 dark:text-gray-300')}
							>
								Amount{selectedTokenInfo ? ` (${selectedTokenInfo.symbol})` : ''}
							</label>
							<button
								type="button"
								onclick={fillMaxAmount}
								disabled={!selectedTokenInfo || availableBalance <= transferFee}
								class={cn(
									'text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40',
								)}
							>
								Max
							</button>
						</div>
						<input
							id="v-amount"
							type="text"
							inputmode="decimal"
							bind:value={transferAmountHuman}
							placeholder="0.00"
							class={cn(
								'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40',
							)}
						/>
						{#if selectedTokenInfo && transferFund}
							<p class={cn('text-xs text-gray-500 dark:text-gray-400 mt-1')}>
								Available in {transferFund}: {formatWithSymbol(availableBalance, selectedTokenInfo.decimals, selectedTokenInfo.symbol)}
								· Network fee {formatWithSymbol(transferFee, selectedTokenInfo.decimals, selectedTokenInfo.symbol)}
							</p>
						{/if}
						{#if parsedTransferAmount != null && parsedTransferAmount > 0}
							<p class={cn('text-xs text-gray-400 dark:text-gray-500 mt-0.5')}>
								= {rawUnitsLabel(parsedTransferAmount)}
							</p>
						{/if}
					</div>

					<p class={cn('text-xs text-gray-400 dark:text-gray-500')}>
						Payments go to the recipient's main account; subaccount transfers are not offered by this realm.
						A governed fund files the payment as a proposal for a vote.
					</p>

					<button
						type="submit"
						disabled={!canSubmitTransfer}
						class={cn(
							'w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg',
							'hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
						)}
					>
						{sending ? 'Sending…' : 'Send'}
					</button>
				</form>
				{#if sendOutcome}
					<div
						class={cn(
							'mt-4 p-3 rounded-lg border text-sm',
							sendOutcome.tone === 'success'
								? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
								: sendOutcome.tone === 'info'
									? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300'
									: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
						)}
					>
						{sendOutcome.text}
					</div>
				{/if}
			</div>

		{:else if activeTab === 'lookup'}
			<div
				class={cn(
					'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6',
				)}
			>
				<h2 class={cn('text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2')}>
					Check an invoice
				</h2>
				<p class={cn('text-sm text-gray-500 dark:text-gray-400 mb-4')}>
					Each invoice has its own account on the token ledger. Checking asks the ledger whether it was
					paid and books the payment into the treasury if so.
				</p>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						lookupInvoice();
					}}
					class={cn('flex gap-2 mb-4')}
				>
					<input
						type="text"
						bind:value={lookupInvoiceId}
						placeholder="Invoice ID (e.g. INV-1)"
						class={cn(
							'flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40',
						)}
					/>
					<button
						type="submit"
						disabled={lookupLoading}
						class={cn(
							'px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2',
						)}
					>
						{#if lookupLoading}{@render spinner()}{/if}
						{lookupLoading ? 'Checking…' : 'Check'}
					</button>
				</form>

				{#if lookupNote}
					<p class={cn('text-sm text-gray-600 dark:text-gray-400 mb-4')}>{lookupNote}</p>
				{/if}

				{#if lookupResult}
					<div
						class={cn(
							'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-center justify-between gap-3',
						)}
					>
						<div class={cn('text-sm font-semibold text-gray-800 dark:text-gray-200')}>
							Invoice {lookupResult.invoice}
						</div>
						<span
							class={cn(
								'px-2 py-0.5 rounded text-xs font-medium',
								lookupResult.status === 'paid'
									? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
									: lookupResult.status === 'overdue'
										? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
										: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
							)}
						>
							{typeLabel(lookupResult.status)}
						</span>
					</div>
				{/if}

				<p class={cn('mt-4 text-xs text-gray-400 dark:text-gray-500')}>
					Per-member and raw subaccount balances are not kept by this realm, so they cannot be looked up here.
				</p>
			</div>

		{:else if activeTab === 'admin'}
			<div
				class={cn(
					'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6',
				)}
			>
				<h2 class={cn('text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4')}>Vault Admin</h2>

				<div class={cn('mb-6')}>
					<button
						type="button"
						onclick={checkInvoicePayments}
						disabled={invoiceCheckBusy}
						class={cn(
							'px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2',
						)}
					>
						{#if invoiceCheckBusy}{@render spinner()}{/if}
						{invoiceCheckBusy ? 'Checking…' : 'Check invoice payments'}
					</button>
					<p class={cn('mt-2 text-xs text-gray-500 dark:text-gray-400')}>
						{invoiceCheckNote ||
							'Asks the token ledgers whether open invoices were paid, a batch at a time, and books the payments.'}
					</p>
				</div>

				<div class={cn('space-y-6')}>
					<div>
						<h3 class={cn('font-semibold text-gray-700 dark:text-gray-300 mb-2')}>
							Balances by fund ({fundIds.length})
						</h3>
						{#if fundIds.length > 0}
							<div class={cn('space-y-2 max-h-80 overflow-auto')}>
								{#each fundIds as fund (fund)}
									{@const held = Object.entries(fundBalances[fund] ?? {})}
									<div class={cn('p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg')}>
										<div class={cn('text-xs text-gray-600 dark:text-gray-400 mb-1')}>{fund}</div>
										{#each held as [symbol, amount] (symbol)}
											{@const info = tokenInfo(symbol)}
											<div
												class={cn('text-sm font-semibold text-gray-800 dark:text-gray-200 tabular-nums')}
												title={rawUnitsLabel(num(amount))}
											>
												{formatWithSymbol(num(amount), info.decimals, info.symbol)}
											</div>
										{:else}
											<div class={cn('text-sm text-gray-400 dark:text-gray-500')}>Empty</div>
										{/each}
									</div>
								{/each}
							</div>
						{:else}
							<p class={cn('text-gray-500 dark:text-gray-400 text-sm')}>No funds in the treasury yet</p>
						{/if}
					</div>

					<div>
						<h3 class={cn('font-semibold text-gray-700 dark:text-gray-300 mb-2')}>
							Cash movements on the books
						</h3>
						<p class={cn('text-sm text-gray-600 dark:text-gray-400')}>
							Total: {entries.length.toLocaleString()}{ledgerTruncated ? '+' : ''}
						</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
