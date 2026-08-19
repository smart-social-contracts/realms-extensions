<script lang="ts">
	import { onMount } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';

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

	interface VaultSettings {
		maxRefreshAgeMs: number;
	}

	interface DirectoryEntry {
		kind: string;
		principal: string;
		label: string;
	}

	const DEFAULT_MAX_REFRESH_AGE_MS = 60 * 60 * 1000;
	const SETTINGS_KEY = 'vault_settings';
	const LAST_REFRESH_KEY = 'vault_last_refresh';
	const PRINCIPAL_RE = /^[a-z0-9]{5}(-[a-z0-9]{3,5})+$/;
	const SUBACCOUNT_RE = /^[0-9a-fA-F]{64}$/;

	let activeTab = $state<TabId>('activity');
	let loading = $state(false);
	let error = $state('');
	let accessDeniedOp = $state('');

	let profiles = $state<string[]>([]);
	let isAdmin = $derived(profiles.includes('admin'));

	let vaultPrincipal = $state('');

	let ledgerCanisters = $state<Record<string, TokenInfo>>({});
	let tokenBalances = $state<Record<string, number>>({});
	let tokensLoaded = $state(false);

	let allBalances = $state<any[]>([]);

	let transactions = $state<any[]>([]);
	let transferPagination = $state<any>(null);
	let currentPage = $state(0);
	const pageSize = 10;

	let lastRefreshTime = $state<Date | null>(null);
	let copiedText = $state('');

	let settings = $state<VaultSettings>(loadVaultSettings());
	let settingsInputMinutes = $state(Math.round(loadVaultSettings().maxRefreshAgeMs / 60000));

	let transferToken = $state('');
	let transferTo = $state('');
	let transferAmountHuman = $state('');
	let transferToSubaccount = $state('');
	let transferFromSubaccount = $state('');

	let lookupMode = $state<'user' | 'invoice' | 'raw'>('user');
	let lookupPrincipal = $state('');
	let lookupInvoiceId = $state('');
	let lookupRawHex = $state('');
	let lookupResult = $state<{ label: string; subaccount_hex: string; balances: Record<string, number> } | null>(null);
	let lookupLoading = $state(false);

	let directoryLabels = $state<Record<string, string>>({});
	let directoryEntries = $state<DirectoryEntry[]>([]);

	let tokenSymbols = $derived(Object.keys(ledgerCanisters));
	let directoryUsers = $derived(directoryEntries.filter((e) => e.kind === 'user'));

	let selectedTokenInfo = $derived(transferToken ? ledgerCanisters[transferToken] : undefined);
	let availableBalance = $derived(transferToken ? tokenBalances[transferToken] || 0 : 0);
	let transferFee = $derived(selectedTokenInfo?.fee ?? 0);
	let parsedTransferAmount = $derived(
		toBaseUnits(transferAmountHuman, selectedTokenInfo?.decimals ?? 8),
	);
	let recipientTrimmed = $derived(transferTo.trim());
	let recipientValid = $derived(recipientTrimmed !== '' && PRINCIPAL_RE.test(recipientTrimmed));
	let recipientLabel = $derived(directoryLabels[recipientTrimmed] || '');
	let toSubaccountValid = $derived(
		transferToSubaccount.trim() === '' || SUBACCOUNT_RE.test(transferToSubaccount.trim()),
	);
	let fromSubaccountValid = $derived(
		transferFromSubaccount.trim() === '' || SUBACCOUNT_RE.test(transferFromSubaccount.trim()),
	);
	let canSubmitTransfer = $derived(
		recipientValid &&
			parsedTransferAmount != null &&
			parsedTransferAmount > 0 &&
			toSubaccountValid &&
			fromSubaccountValid &&
			!loading,
	);

	function parseRaw(raw: any): any {
		return typeof raw === 'string' ? JSON.parse(raw) : raw;
	}

	function unwrapExtensionPayload(raw: any): any {
		if (raw && typeof raw === 'object' && raw.success === true && raw.data != null) {
			return raw.data;
		}
		return raw;
	}

	function walletTokenName(displayKey: string): string {
		return ledgerCanisters[displayKey]?.name ?? displayKey;
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

	function tokenInfoByName(name: string): TokenInfo {
		const key = tokenSymbols.find((s) => ledgerCanisters[s]?.name === name);
		if (key && ledgerCanisters[key]) return ledgerCanisters[key];
		return { ledger: '', indexer: '', decimals: 8, symbol: name, name, fee: 0 };
	}

	function loadVaultSettings(): VaultSettings {
		try {
			const raw = localStorage.getItem(SETTINGS_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (typeof parsed.maxRefreshAgeMs === 'number' && parsed.maxRefreshAgeMs > 0) {
					return { maxRefreshAgeMs: parsed.maxRefreshAgeMs };
				}
			}
		} catch {
			// ignore
		}
		return { maxRefreshAgeMs: DEFAULT_MAX_REFRESH_AGE_MS };
	}

	function saveVaultSettings(s: VaultSettings) {
		try {
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
		} catch {
			// ignore
		}
	}

	function updateSettingsFromInput() {
		const minutes = Math.max(1, Math.round(settingsInputMinutes || 1));
		settings = { maxRefreshAgeMs: minutes * 60000 };
		saveVaultSettings(settings);
	}

	function loadLastRefresh(): { timestamp: number; balances: Record<string, number> } | null {
		try {
			const raw = localStorage.getItem(LAST_REFRESH_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed.timestamp === 'number' && parsed.balances) {
					return { timestamp: parsed.timestamp, balances: parsed.balances };
				}
			}
		} catch {
			// ignore
		}
		return null;
	}

	function saveLastRefresh(timestamp: number, balances: Record<string, number>) {
		try {
			localStorage.setItem(LAST_REFRESH_KEY, JSON.stringify({ timestamp, balances }));
		} catch {
			// ignore
		}
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

	function parseTimestamp(timestamp: string | number): Date {
		const ts = String(timestamp);
		if (ts.includes('T') || ts.includes('-') || ts.includes(':')) return new Date(ts);
		try {
			return new Date(Number(BigInt(ts) / BigInt(1000000)));
		} catch {
			return new Date();
		}
	}

	function shortPrincipalMiddle(p: string, total = 20): string {
		if (p.length <= total) return p;
		const half = Math.floor((total - 1) / 2);
		return `${p.slice(0, half)}…${p.slice(-half)}`;
	}

	function partyLabel(p: string | undefined | null): { display: string; title: string; copyable: boolean } {
		if (!p) return { display: '—', title: '', copyable: false };
		if (p === 'minting_account') return { display: 'Mint', title: p, copyable: false };
		if (p === 'burn') return { display: 'Burned', title: p, copyable: false };
		if (p === vaultPrincipal) return { display: 'This vault', title: p, copyable: false };
		if (directoryLabels[p]) return { display: directoryLabels[p], title: p, copyable: false };
		return { display: shortPrincipalMiddle(p), title: p, copyable: true };
	}

	function typeLabel(kind: string): string {
		const k = kind || 'unknown';
		return k.charAt(0).toUpperCase() + k.slice(1);
	}

	function typeBadgeClass(kind: string): string {
		switch (kind) {
			case 'mint':
				return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300';
			case 'burn':
				return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300';
			case 'transfer':
				return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300';
			default:
				return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
		}
	}

	function txAmountDisplay(tx: any): { text: string; className: string; title: string } {
		const info = tokenInfoByName(tx.token);
		const amount = tx.amount || 0;
		const fee = tx.fee || 0;
		const formatted = formatWithSymbol(amount, info.decimals, info.symbol);
		const isIncoming = tx.principal_to === vaultPrincipal || tx.kind === 'mint';
		const isOutgoing = tx.principal_from === vaultPrincipal || tx.kind === 'burn';
		let text = formatted;
		let className = 'text-gray-600 dark:text-gray-400';
		if (isIncoming) {
			text = `+${formatted}`;
			className = 'text-emerald-600 dark:text-emerald-400';
		} else if (isOutgoing) {
			text = `−${formatted}`;
			className = 'text-rose-600 dark:text-rose-400';
		}
		const title =
			fee > 0 ? `${rawUnitsLabel(amount)} · Fee: ${rawUnitsLabel(fee)}` : rawUnitsLabel(amount);
		return { text, className, title };
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

	function lookupResultHeading(): string {
		if (!lookupResult) return '';
		if (lookupMode === 'user') {
			const label =
				directoryLabels[lookupPrincipal.trim()] || shortPrincipalMiddle(lookupPrincipal.trim());
			return `Member ${label}`;
		}
		if (lookupMode === 'invoice') return `Invoice ${lookupInvoiceId.trim()}`;
		const hex = lookupRawHex.trim();
		return `Subaccount ${hex.substring(0, 16)}…`;
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
		activeTab = 'send';
	}

	function fillMaxAmount() {
		if (!selectedTokenInfo) return;
		const max = Math.max(0, availableBalance - transferFee);
		transferAmountHuman = baseUnitsToHumanInput(max, selectedTokenInfo.decimals);
	}

	// ── Data loading ─────────────────────────────────────────

	async function loadDirectory() {
		if (typeof ctx.backend?.directory_list !== 'function') return;
		try {
			const raw = await ctx.backend.directory_list();
			const resp = parseRaw(raw);
			if (resp?.success && resp?.data?.message) {
				const parsed = JSON.parse(resp.data.message);
				const entries: DirectoryEntry[] = parsed.entries || [];
				const map: Record<string, string> = {};
				for (const entry of entries) {
					if (entry.principal && entry.label) map[entry.principal] = entry.label;
				}
				directoryEntries = entries;
				directoryLabels = map;
			}
		} catch {
			// fail silently
		}
	}

	async function loadTokens() {
		try {
			const resp = unwrapExtensionPayload(await ctx.callSync('get_active_tokens', {}));
			const tokens = resp?.ActiveTokens || [];
			const canisters: Record<string, TokenInfo> = {};
			const bals: Record<string, number> = {};

			for (const token of tokens) {
				const symbol = token.symbol || token.name;
				const ledger = token.ledger_canister_id ?? token.ledger ?? '';
				const indexer = token.indexer_canister_id ?? token.indexer ?? '';
				if (symbol) {
					canisters[symbol] = {
						ledger,
						indexer,
						decimals: token.decimals || 8,
						symbol,
						name: token.name,
						fee: token.fee || 0,
					};
					bals[symbol] = 0;
				}
			}

			ledgerCanisters = canisters;
			tokenBalances = bals;

			const last = loadLastRefresh();
			if (last?.balances) {
				for (const key of Object.keys(canisters)) {
					if (key in last.balances) bals[key] = last.balances[key];
				}
				tokenBalances = bals;
				lastRefreshTime = new Date(last.timestamp);
			}

			const syms = Object.keys(canisters);
			if (syms.length > 0 && !transferToken) transferToken = syms[0];
			tokensLoaded = true;
		} catch (e: any) {
			console.error('Failed to load tokens:', e);
		}
	}

	async function loadBalance() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const raw = await ctx.backend.get_objects_paginated('WalletBalance', 0, 100, 'asc');
			const resp = parseRaw(raw);
			if (resp?.success && resp?.data?.objectsListPaginated) {
				const data = resp.data.objectsListPaginated;
				allBalances = data.objects.map((s: string) => JSON.parse(s));
			} else {
				allBalances = [];
			}
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

	async function loadTransactions(page: number = currentPage) {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			if (!vaultPrincipal) {
				try {
					if (typeof ctx.backend.get_canister_id === 'function') {
						const r = await ctx.backend.get_canister_id();
						vaultPrincipal = r || '';
					}
				} catch {
					vaultPrincipal = '';
				}
			}
			const raw = await ctx.backend.get_objects_paginated('WalletTransfer', page, pageSize, 'desc');
			const resp = parseRaw(raw);
			if (resp?.success && resp?.data?.objectsListPaginated) {
				const data = resp.data.objectsListPaginated;
				transferPagination = data.pagination;
				transactions = data.objects.map((s: string) => JSON.parse(s));
			} else {
				transactions = [];
			}
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

	function displayKeyForTokenName(tokenName: string): string | undefined {
		return tokenSymbols.find((s) => ledgerCanisters[s]?.name === tokenName);
	}

	function applyRefreshBalances(perToken: Record<string, any>) {
		for (const [tokenName, tokenData] of Object.entries(perToken)) {
			const key = displayKeyForTokenName(tokenName) || tokenName;
			if (ledgerCanisters[key]) {
				tokenBalances[key] = (tokenData as any)?.balance || 0;
			}
		}
		tokenBalances = { ...tokenBalances };
	}

	async function loadVaultPrincipal() {
		try {
			if (typeof ctx.backend.get_canister_id === 'function') {
				vaultPrincipal = (await ctx.backend.get_canister_id()) || vaultPrincipal;
			}
		} catch {
			// keep existing value
		}
	}

	// ── Mutations ────────────────────────────────────────────

	async function refreshVault() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const refreshData = unwrapExtensionPayload(await ctx.callAsync('refresh', {}));
			if (refreshData?.TransactionSummary == null) {
				error = 'Failed to sync vault transactions';
				return;
			}
			applyRefreshBalances(refreshData.TransactionSummary.per_token || {});
			await loadVaultPrincipal();
			lastRefreshTime = new Date();
			saveLastRefresh(lastRefreshTime.getTime(), tokenBalances);
			await Promise.all([loadBalance(), loadTransactions(0)]);
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

	async function performTransfer() {
		if (!canSubmitTransfer || !selectedTokenInfo || parsedTransferAmount == null) return;

		const symbol = selectedTokenInfo.symbol;
		const humanDisplay = formatWithSymbol(parsedTransferAmount, selectedTokenInfo.decimals, symbol);
		const recipientDisplay = recipientLabel || recipientTrimmed;

		const ok = await confirmModal({
			title: 'Confirm send',
			body: `Send ${humanDisplay} to ${recipientDisplay}? This cannot be undone.`,
			confirmLabel: 'Send',
			danger: true,
		});
		if (!ok) return;

		loading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const args: any = {
				to_principal: recipientTrimmed,
				amount: parsedTransferAmount,
				token: walletTokenName(transferToken),
			};
			if (transferToSubaccount.trim()) args.to_subaccount = transferToSubaccount.trim();
			if (transferFromSubaccount.trim()) args.from_subaccount = transferFromSubaccount.trim();

			unwrapExtensionPayload(await ctx.callAsync('transfer', args));

			if (typeof ctx.notify === 'function') {
				ctx.notify('success', `Sent ${humanDisplay}`);
			}

			transferTo = '';
			transferAmountHuman = '';
			transferToSubaccount = '';
			transferFromSubaccount = '';
			await loadBalance();
			await loadTransactions();
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

	async function lookupSubaccountBalance() {
		lookupLoading = true;
		lookupResult = null;
		error = '';
		accessDeniedOp = '';
		try {
			const lookupArgs: any = {};
			if (lookupMode === 'user' && lookupPrincipal.trim()) {
				lookupArgs.principal = lookupPrincipal.trim();
			} else if (lookupMode === 'invoice' && lookupInvoiceId.trim()) {
				lookupArgs.invoice_id = lookupInvoiceId.trim();
			} else if (lookupMode === 'raw' && lookupRawHex.trim()) {
				lookupArgs.subaccount_hex = lookupRawHex.trim();
			} else {
				error = 'Please enter a value to look up';
				lookupLoading = false;
				return;
			}

			const data = unwrapExtensionPayload(await ctx.callAsync('lookup_balance', lookupArgs));
			if (data?.LookupBalance) {
				lookupResult = data.LookupBalance;
			} else {
				error = 'Lookup failed';
			}
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
			lookupLoading = false;
		}
	}

	// ── Pagination ───────────────────────────────────────────

	async function goToPage(page: number) {
		currentPage = page;
		await loadTransactions(page);
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
		{ id: 'send', label: 'Send' },
		{ id: 'lookup', label: 'Lookup' },
	];

	// ── Init ─────────────────────────────────────────────────

	onMount(() => {
		const unsubs: (() => void)[] = [];
		if (ctx.userProfiles?.subscribe) {
			unsubs.push(
				ctx.userProfiles.subscribe((v: string[]) => {
					profiles = v || [];
				}),
			);
		}

		(async () => {
			await Promise.all([loadTokens(), loadDirectory()]);
			const vaultSettings = loadVaultSettings();
			const last = loadLastRefresh();
			const now = Date.now();
			const shouldRefresh = !last || now - last.timestamp > vaultSettings.maxRefreshAgeMs;

			if (shouldRefresh) {
				await refreshVault();
			} else {
				await Promise.all([loadBalance(), loadTransactions(0)]);
			}
		})();

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

<div class={cn('max-w-4xl mx-auto p-6 space-y-6')}>
	<!-- Header -->
	<div class={cn('flex justify-between items-start gap-4')}>
		<div>
			<h1 class={cn('text-2xl font-bold text-gray-900 dark:text-gray-100')}>Vault</h1>
			<p class={cn('text-sm text-gray-500 dark:text-gray-400 mt-1')}>{extensionDescription}</p>
		</div>
		<button
			type="button"
			onclick={refreshVault}
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

	<!-- Hero balance card -->
	{#if tokensLoaded && tokenSymbols.length > 0}
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
							'flex items-center justify-between gap-4 bg-white/60 dark:bg-gray-800/40 rounded-lg p-4',
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
				On-chain ledger balance for this realm's vault
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
					{vaultPrincipal || 'Loading…'}
				</button>
				{#if copiedText === vaultPrincipal && vaultPrincipal}
					<span class={cn('text-xs text-green-600 dark:text-green-400')}>Copied!</span>
				{/if}
			</div>
			{#if lastRefreshTime}
				<div class={cn('text-xs text-gray-600 dark:text-gray-400')}>
					<span class={cn('font-medium')}>Last refresh:</span>
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
							{info.ledger}
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
							{info.indexer}
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
		{#if ctx.ui?.AccessDenied}
			{@const AccessDenied = ctx.ui.AccessDenied}
			<AccessDenied operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
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

	<!-- Tabs -->
	<nav class={cn('flex border-b border-gray-200 dark:border-gray-700')}>
		{#each everydayTabs as t (t.id)}
			<button
				type="button"
				onclick={() => {
					activeTab = t.id;
				}}
				class={cn(
					'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
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
					'ml-auto px-4 py-2.5 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-1.5',
					activeTab === 'admin'
						? 'border-gray-400 text-gray-700 dark:text-gray-300 dark:border-gray-500'
						: 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400',
				)}
			>
				{@render gearIcon()}
				Admin
			</button>
		{/if}
	</nav>

	<!-- Tab Content -->
	<div>
		{#if activeTab === 'activity'}
			<div
				class={cn(
					'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden',
				)}
			>
				<h2
					class={cn(
						'text-lg font-semibold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100',
					)}
				>
					Activity
				</h2>

				{#if loading && transactions.length === 0}
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
				{:else if transactions.length === 0}
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
							Transfers and ledger events will appear here after the vault syncs.
						</p>
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
											'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell',
										)}
									>
										From
									</th>
									<th
										class={cn(
											'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase',
										)}
									>
										To
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
								{#each transactions as tx (tx._id || tx.tx_id)}
									{@const txDate = tx.timestamp ? parseTimestamp(tx.timestamp) : null}
									{@const from = partyLabel(tx.principal_from)}
									{@const to = partyLabel(tx.principal_to)}
									{@const amt = txAmountDisplay(tx)}
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
												#{tx.tx_id || tx._id}
											</div>
										</td>
										<td class={cn('px-4 py-3')}>
											<span class={cn('px-2 py-0.5 rounded text-xs font-medium', typeBadgeClass(tx.kind))}>
												{typeLabel(tx.kind)}
											</span>
										</td>
										<td class={cn('px-4 py-3 hidden sm:table-cell')}>
											{#if from.copyable}
												<button
													type="button"
													onclick={() => copyToClipboard(tx.principal_from)}
													class={cn(
														'text-indigo-600 dark:text-indigo-400 hover:underline text-left text-xs',
													)}
													title={from.title}
												>
													{from.display}
												</button>
												{#if copiedText === tx.principal_from}
													<span class={cn('ml-1 text-xs text-green-600 dark:text-green-400')}>✓</span>
												{/if}
											{:else}
												<span class={cn('text-xs text-gray-700 dark:text-gray-300')} title={from.title}>
													{from.display}
												</span>
											{/if}
										</td>
										<td class={cn('px-4 py-3')}>
											{#if to.copyable}
												<button
													type="button"
													onclick={() => copyToClipboard(tx.principal_to)}
													class={cn(
														'text-indigo-600 dark:text-indigo-400 hover:underline text-left text-xs',
													)}
													title={to.title}
												>
													{to.display}
												</button>
												{#if copiedText === tx.principal_to}
													<span class={cn('ml-1 text-xs text-green-600 dark:text-green-400')}>✓</span>
												{/if}
											{:else}
												<span class={cn('text-xs text-gray-700 dark:text-gray-300')} title={to.title}>
													{to.display}
												</span>
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

				{#if transferPagination && transactions.length > 0}
					{@const total = Number(transferPagination.total_items_count)}
					{@const start = total > 0 ? currentPage * pageSize + 1 : 0}
					{@const end = Math.min((currentPage + 1) * pageSize, total)}
					{@const multiPage = Number(transferPagination.total_pages) > 1}
					<div
						class={cn(
							'p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3',
						)}
					>
						<span class={cn('text-xs text-gray-500 dark:text-gray-400')}>
							Showing {start}–{end} of {total}
							{#if multiPage}
								<span class={cn('ml-1')}
									>(Page {currentPage + 1} of {transferPagination.total_pages})</span
								>
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
								{#each paginationPages(Number(transferPagination.total_pages), currentPage) as p, i (i)}
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
									disabled={currentPage >= Number(transferPagination.total_pages) - 1}
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
					'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6',
				)}
			>
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
						<label for="v-to" class={cn('block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5')}>
							Recipient
						</label>
						<input
							id="v-to"
							type="text"
							bind:value={transferTo}
							placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
							class={cn(
								'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40',
							)}
						/>
						{#if recipientTrimmed && !recipientValid}
							<p class={cn('text-xs text-red-600 dark:text-red-400 mt-1')}>
								Enter a valid principal ID (e.g. xxxxx-xxxxx-xxxxx-xxxxx-xxx).
							</p>
						{:else if recipientLabel}
							<p class={cn('text-xs text-gray-600 dark:text-gray-400 mt-1')}>{recipientLabel}</p>
						{:else}
							<p class={cn('text-xs text-gray-500 dark:text-gray-400 mt-1')}>
								Principal ID of the recipient.
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
						{#if selectedTokenInfo}
							<p class={cn('text-xs text-gray-500 dark:text-gray-400 mt-1')}>
								Available {formatWithSymbol(availableBalance, selectedTokenInfo.decimals, selectedTokenInfo.symbol)}
								· Network fee {formatWithSymbol(transferFee, selectedTokenInfo.decimals, selectedTokenInfo.symbol)}
							</p>
						{/if}
						{#if parsedTransferAmount != null && parsedTransferAmount > 0}
							<p class={cn('text-xs text-gray-400 dark:text-gray-500 mt-0.5')}>
								= {rawUnitsLabel(parsedTransferAmount)}
							</p>
						{/if}
					</div>

					<details class={cn('rounded-lg border border-gray-200 dark:border-gray-700')}>
						<summary
							class={cn(
								'px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none',
							)}
						>
							Advanced (subaccounts)
						</summary>
						<div class={cn('px-3 pb-3 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3')}>
							<p class={cn('text-xs text-gray-500 dark:text-gray-400')}>
								Optional 64-character hex subaccount values for source or destination.
							</p>
							<div>
								<label
									for="v-to-sub"
									class={cn('block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1')}
								>
									To subaccount
								</label>
								<input
									id="v-to-sub"
									type="text"
									bind:value={transferToSubaccount}
									placeholder="64-character hex"
									class={cn(
										'w-full px-3 py-2 text-sm font-mono border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40',
										toSubaccountValid
											? 'border-gray-300 dark:border-gray-600'
											: 'border-red-400 dark:border-red-600',
									)}
								/>
								{#if !toSubaccountValid}
									<p class={cn('text-xs text-red-600 dark:text-red-400 mt-1')}>
										Must be exactly 64 hex characters.
									</p>
								{/if}
							</div>
							<div>
								<label
									for="v-from-sub"
									class={cn('block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1')}
								>
									From subaccount
								</label>
								<input
									id="v-from-sub"
									type="text"
									bind:value={transferFromSubaccount}
									placeholder="64-character hex"
									class={cn(
										'w-full px-3 py-2 text-sm font-mono border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40',
										fromSubaccountValid
											? 'border-gray-300 dark:border-gray-600'
											: 'border-red-400 dark:border-red-600',
									)}
								/>
								{#if !fromSubaccountValid}
									<p class={cn('text-xs text-red-600 dark:text-red-400 mt-1')}>
										Must be exactly 64 hex characters.
									</p>
								{/if}
							</div>
						</div>
					</details>

					<button
						type="submit"
						disabled={!canSubmitTransfer}
						class={cn(
							'w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg',
							'hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
						)}
					>
						{loading ? 'Sending…' : 'Send'}
					</button>
				</form>
			</div>

		{:else if activeTab === 'lookup'}
			<div
				class={cn(
					'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6',
				)}
			>
				<h2 class={cn('text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2')}>
					Look up a balance
				</h2>
				<p class={cn('text-sm text-gray-500 dark:text-gray-400 mb-4')}>
					The vault holds funds in separate compartments for each member and each invoice. Look up
					the balance in one of them.
				</p>

				<div class={cn('flex flex-wrap gap-2 mb-4')}>
					{#each [{ id: 'user', label: 'Member' }, { id: 'invoice', label: 'Invoice' }, { id: 'raw', label: 'Advanced' }] as mode (mode.id)}
						<button
							type="button"
							onclick={() => {
								lookupMode = mode.id as 'user' | 'invoice' | 'raw';
								lookupResult = null;
							}}
							class={cn(
								'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
								lookupMode === mode.id
									? 'bg-indigo-600 text-white'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
							)}
						>
							{mode.label}
						</button>
					{/each}
				</div>

				{#if lookupMode === 'raw'}
					<p class={cn('text-xs text-gray-500 dark:text-gray-400 mb-3')}>
						Enter a raw 64-character hex subaccount. Member and invoice compartments are derived
						from principal or invoice ID using internal prefixes.
					</p>
				{/if}

				<form
					onsubmit={(e) => {
						e.preventDefault();
						lookupSubaccountBalance();
					}}
					class={cn('flex gap-2 mb-4')}
				>
					{#if lookupMode === 'user'}
						<input
							type="text"
							list="member-list"
							bind:value={lookupPrincipal}
							placeholder="Member principal or pick from list"
							class={cn(
								'flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40',
							)}
						/>
						<datalist id="member-list">
							{#each directoryUsers as entry (entry.principal)}
								<option value={entry.principal}>{entry.label}</option>
							{/each}
						</datalist>
					{:else if lookupMode === 'invoice'}
						<input
							type="text"
							bind:value={lookupInvoiceId}
							placeholder="Invoice ID"
							class={cn(
								'flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40',
							)}
						/>
					{:else}
						<input
							type="text"
							bind:value={lookupRawHex}
							placeholder="64-character hex subaccount"
							class={cn(
								'flex-1 px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/40',
							)}
						/>
					{/if}
					<button
						type="submit"
						disabled={lookupLoading}
						class={cn(
							'px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2',
						)}
					>
						{#if lookupLoading}{@render spinner()}{/if}
						{lookupLoading ? 'Looking up…' : 'Look up'}
					</button>
				</form>

				{#if lookupResult}
					<div
						class={cn(
							'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3',
						)}
					>
						<div class={cn('flex items-center justify-between gap-3')}>
							<div>
								<div class={cn('text-sm font-semibold text-gray-800 dark:text-gray-200')}>
									{lookupResultHeading()}
								</div>
								{#if lookupMode === 'user' && directoryLabels[lookupPrincipal.trim()]}
									<div class={cn('text-xs text-gray-500 dark:text-gray-400 mt-0.5')}>
										{directoryLabels[lookupPrincipal.trim()]}
									</div>
								{/if}
							</div>
							<button
								type="button"
								onclick={() => copyToClipboard(lookupResult?.subaccount_hex || '')}
								class={cn('text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono')}
								title={lookupResult.subaccount_hex}
							>
								{lookupResult.subaccount_hex.substring(0, 16)}…
							</button>
						</div>
						<div class={cn('space-y-2')}>
							{#each Object.entries(lookupResult.balances) as [tokenName, bal] (tokenName)}
								{@const info = tokenInfoByName(tokenName)}
								<div
									class={cn(
										'flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3',
									)}
									title={rawUnitsLabel(Number(bal))}
								>
									<span class={cn('text-sm font-semibold text-gray-700 dark:text-gray-300')}>
										{info.symbol}
									</span>
									<div
										class={cn(
											'text-lg font-bold tabular-nums',
											Number(bal) > 0
												? 'text-green-700 dark:text-green-400'
												: 'text-gray-400 dark:text-gray-500',
										)}
									>
										{formatWithSymbol(Number(bal), info.decimals, info.symbol)}
									</div>
								</div>
							{/each}
						</div>
						{#if Object.values(lookupResult.balances).every((b) => Number(b) === 0)}
							<p class={cn('text-sm text-gray-500 italic')}>No balances found for this subaccount.</p>
						{/if}
					</div>
				{/if}
			</div>

		{:else if activeTab === 'admin'}
			<div
				class={cn(
					'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6',
				)}
			>
				<h2 class={cn('text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4')}>Vault Admin</h2>

				<div class={cn('mb-4')}>
					<button
						type="button"
						onclick={refreshVault}
						disabled={loading}
						class={cn(
							'px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2',
						)}
					>
						{#if loading}{@render spinner()}{/if}
						{loading ? 'Refreshing…' : 'Full Vault Refresh'}
					</button>
				</div>

				<div
					class={cn(
						'mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700',
					)}
				>
					<h3 class={cn('text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2')}>
						Auto-refresh settings
					</h3>
					<p class={cn('text-xs text-gray-500 dark:text-gray-400 mb-3')}>
						The Vault will only run an expensive full refresh on load if the last refresh is older
						than this threshold.
					</p>
					<div class={cn('flex items-center gap-3')}>
						<label for="v-refresh-age" class={cn('text-sm text-gray-700 dark:text-gray-300')}>
							Max refresh age:
						</label>
						<input
							id="v-refresh-age"
							type="number"
							min="1"
							bind:value={settingsInputMinutes}
							class={cn(
								'w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
							)}
						/>
						<span class={cn('text-sm text-gray-500 dark:text-gray-400')}>minutes</span>
						<button
							type="button"
							onclick={updateSettingsFromInput}
							class={cn(
								'px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/60',
							)}
						>
							Save
						</button>
					</div>
				</div>

				<div class={cn('space-y-6')}>
					<div>
						<h3 class={cn('font-semibold text-gray-700 dark:text-gray-300 mb-2')}>
							All Balances in System ({allBalances.length})
						</h3>
						{#if allBalances.length > 0}
							<div class={cn('space-y-2 max-h-80 overflow-auto')}>
								{#each allBalances as bal, i (bal._id ?? bal.principal ?? bal.id ?? i)}
									{@const info = tokenInfoByName(bal.token)}
									{@const principal = bal.principal || bal._id || bal.id}
									{@const pl = partyLabel(principal)}
									<div class={cn('p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg')}>
										<div class={cn('text-xs text-gray-600 dark:text-gray-400 mb-1')} title={pl.title}>
											{pl.display}
										</div>
										<div
											class={cn('text-sm font-semibold text-gray-800 dark:text-gray-200 tabular-nums')}
											title={rawUnitsLabel(bal.amount || 0)}
										>
											{formatWithSymbol(bal.amount || 0, info.decimals, info.symbol)}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class={cn('text-gray-500 dark:text-gray-400 text-sm')}>No balances found in system</p>
						{/if}
					</div>

					<div>
						<h3 class={cn('font-semibold text-gray-700 dark:text-gray-300 mb-2')}>
							All Transfers in System
						</h3>
						{#if transferPagination}
							<p class={cn('text-sm text-gray-600 dark:text-gray-400')}>
								Total transfers: {transferPagination.total_items_count}
							</p>
						{:else}
							<p class={cn('text-gray-500 dark:text-gray-400 text-sm')}>No transfer data available</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
