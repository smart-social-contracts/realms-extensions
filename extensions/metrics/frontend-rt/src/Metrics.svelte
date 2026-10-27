<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';
	import { buildCsvBlob, triggerDownload } from '../../../_shared/frontend/csv-export';
	import { isNarrowViewport, subscribeNarrowViewport } from '../../../_shared/frontend/mobile-chrome';
	import { SvelteSet } from 'svelte/reactivity';

	let { ctx }: { ctx: Record<string, any> } = $props();

	function cn(...classes: string[]) {
		const merge = ctx.theme?.cn ?? ((...c: string[]) => c.filter(Boolean).join(' '));
		return merge(...classes);
	}

	let tab = $state<'accounting' | 'records' | 'visualizations'>('accounting');
	let narrow = $state(isNarrowViewport());
	const unsubNarrow = subscribeNarrowViewport((value) => {
		narrow = value;
	});
	onDestroy(() => {
		unsubNarrow();
	});

	type Line = { kind: string; category: string; debit: number; credit: number; symbol: string; flow: string };

	let permissions = $state<Set<string> | null>(null);
	let accountingCurrency = $state('');
	let tokenIds: string[] = $state([]);
	let decimalsBySymbol: Record<string, number> = $state({});
	let fundBalances: Record<string, Record<string, number>> = $state({});
	let ledgerEntries: any[] = $state([]);
	let ledgerTruncated = $state(false);
	let financialReports: any[] = $state([]);
	let reportCache: Record<string, { report: any }> = $state({});
	let budgetRows: any[] = $state([]);
	let treasuryReadable = $state(false);
	let budgetsReadable = $state(false);
	let selectedReport = $state('working');
	let draftBusy = $state(false);
	let draftError = $state('');
	let loading = $state(true);

	const categoryColors: Record<string, string> = {
		cash: '#1E40AF', receivable: '#1D4ED8', equipment: '#2563EB', land: '#3B82F6',
		bond: '#60A5FA', payable: '#1D4ED8', deferred_revenue: '#2563EB', fund_balance: '#1E40AF',
		tax: '#1E40AF', fee: '#1D4ED8', grant: '#2563EB', personnel: '#3B82F6',
		supplies: '#60A5FA', services: '#1D4ED8', debt: '#2563EB', capital: '#1E40AF',
		operating: '#93C5FD', general: '#1E40AF', special_revenue: '#2563EB', capital_projects: '#60A5FA',
	};

	const PAGE_COUNT = 500;
	const LEDGER_MAX = 10_000;

	/** Without a readable `me`, every feature is tried and simply stays empty if refused. */
	function can(permission: string): boolean {
		return permissions === null || permissions.has('all') || permissions.has(permission);
	}

	/** A realm read operation's reply, or null when it fails or is not available to the caller. */
	async function read(name: string, args: Record<string, unknown> = {}): Promise<any> {
		try {
			const reply = await ctx.read(name, args);
			if (reply?.ok) return reply;
			console.warn(`${name}:`, reply?.error);
		} catch (e) {
			console.warn(`${name} failed:`, e);
		}
		return null;
	}

	/** The rows under `key` of every page of a read (following `next`), up to `max`; null if refused. */
	async function readAll(name: string, key: string, args: Record<string, unknown> = {}, max = 2000) {
		const rows: any[] = [];
		let from: number | null = 1;
		let more = false;
		while (from != null) {
			if (rows.length >= max) {
				more = true;
				break;
			}
			const reply = await read(name, { ...args, from, count: PAGE_COUNT });
			if (!reply) {
				if (from === 1) return null;
				break;
			}
			if (Array.isArray(reply[key])) rows.push(...reply[key]);
			from = reply.next ?? null;
		}
		return { rows, more };
	}

	async function loadTreasury() {
		const funds: Record<string, Record<string, number>> = {};
		let tokens: any[] = [];
		let from: number | null = 1;
		while (from != null) {
			const reply = await read('treasury_view', { from, count: PAGE_COUNT });
			if (!reply) {
				if (from === 1) return null;
				break;
			}
			Object.assign(funds, reply.funds ?? {});
			if (Array.isArray(reply.tokens)) tokens = reply.tokens;
			from = reply.next ?? null;
		}
		return { funds, tokens };
	}

	function setDecimals(map: Record<string, number>, symbol: unknown, decimals: unknown) {
		const key = String(symbol ?? '').trim();
		const d = Number(decimals);
		if (key && Number.isInteger(d) && d >= 0) map[key] = d;
	}

	async function loadData() {
		loading = true;
		try {
			const [self, info, catalog] = await Promise.all([read('me'), read('realm_info'), read('token_catalog')]);
			permissions = Array.isArray(self?.permissions) ? new Set(self.permissions.map(String)) : null;
			accountingCurrency = String(info?.realm?.accounting_currency ?? '').trim();

			const treasuryAllowed = can('treasury.view');
			const [treasury, ledger, reports, budgets] = await Promise.all([
				treasuryAllowed ? loadTreasury() : null,
				treasuryAllowed ? readAll('ledger_view', 'entries', {}, LEDGER_MAX) : null,
				treasuryAllowed ? readAll('report_view', 'reports') : null,
				can('db.export') ? readAll('realm_export', 'rows', { entity: 'Budget' }) : null,
			]);

			const decimals: Record<string, number> = {};
			for (const t of catalog?.tokens ?? []) setDecimals(decimals, t?.symbol, t?.decimals);
			for (const t of treasury?.tokens ?? []) setDecimals(decimals, t?.id, t?.decimals);
			decimalsBySymbol = decimals;
			tokenIds = (treasury?.tokens ?? []).map((t: any) => String(t?.id ?? '')).filter(Boolean);
			treasuryReadable = treasury !== null;
			fundBalances = treasury?.funds ?? {};
			ledgerEntries = ledger?.rows ?? [];
			ledgerTruncated = ledger?.more ?? false;
			financialReports = reports?.rows ?? [];
			budgetsReadable = budgets !== null;
			budgetRows = budgets?.rows ?? [];
		} catch (e) {
			console.warn('Financial data could not be read:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadData();
	});

	// The realm currency, else the first registered token, as the backend books it.
	let accountingSymbol = $derived(accountingCurrency || tokenIds[0] || '');

	function toHumanAmount(amount: unknown, currency: unknown): number {
		const n = Number(amount);
		if (!Number.isFinite(n)) return 0;
		const decimals = decimalsBySymbol[String(currency ?? '').trim()] ?? 8;
		return n / 10 ** decimals;
	}

	function fmt(n: any): string {
		if (n == null) return '—';
		const num = Number(n);
		if (isNaN(num)) return String(n);
		return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function fmtCompact(amount: number): string {
		if (!Number.isFinite(amount)) amount = 0;
		if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
		if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
		return amount.toLocaleString();
	}

	function formatRecValue(value: unknown, col = ''): string {
		if (value == null || value === '') return '—';
		if (typeof value === 'object') return JSON.stringify(value);
		if (typeof value === 'number') {
			if (col === 'at' || col === 'as_of' || col.endsWith('_at')) return formatHumanDate(value);
			return Number.isInteger(value) ? value.toLocaleString() : fmt(value);
		}
		return String(value);
	}

	function formatCategory(cat: string): string {
		return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
	}

	function reportRefId(ref: unknown): string {
		if (!ref) return '';
		if (typeof ref === 'string') return ref;
		if (typeof ref === 'number') return String(ref);
		if (typeof ref === 'object' && ref !== null && 'id' in ref) return String((ref as { id: unknown }).id);
		return '';
	}

	// Realm timestamps are seconds.
	function formatHumanDate(value: unknown): string {
		const n = Number(value);
		if (!value || !Number.isFinite(n) || n <= 0) return '—';
		const d = new Date(n < 1e12 ? n * 1000 : n);
		return d.toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function shortId(id: string): string {
		return id.length > 16 ? `${id.slice(0, 5)}…${id.slice(-3)}` : id;
	}

	// Ledger entries carry no tags: a transaction touching a capital or debt category classifies its cash.
	const INVESTING = /capital|equipment|land|invest/;
	const FINANCING = /bond|debt|loan|financ/;

	let workingLines: Line[] = $derived.by(() => {
		const flowOf: Record<string, string> = {};
		for (const e of ledgerEntries) {
			const cat = String(e.category ?? '');
			const tx = String(e.transaction ?? '');
			if (INVESTING.test(cat)) flowOf[tx] = 'investing';
			else if (FINANCING.test(cat) && flowOf[tx] !== 'investing') flowOf[tx] = 'financing';
		}
		return ledgerEntries.map((e) => ({
			kind: String(e.kind ?? ''),
			category: String(e.category || 'other'),
			debit: Number(e.debit) || 0,
			credit: Number(e.credit) || 0,
			symbol: String(e.symbol ?? '').trim(),
			flow: flowOf[String(e.transaction ?? '')] ?? 'operating',
		}));
	});

	/** A frozen report's statements: `accounts` keyed "kind:category:symbol" with debit and credit totals. */
	function reportLines(report: any): Line[] | null {
		let statements = report?.statements;
		if (typeof statements === 'string') {
			try {
				statements = JSON.parse(statements);
			} catch {
				return null;
			}
		}
		const accounts = statements?.accounts;
		if (!accounts || typeof accounts !== 'object') return null;
		return Object.entries(accounts).map(([key, totals]: [string, any]) => {
			const [kind = '', category = '', ...rest] = key.split(':');
			return {
				kind,
				category: category || 'other',
				symbol: rest.join(':'),
				debit: Number(totals?.debit) || 0,
				credit: Number(totals?.credit) || 0,
				flow: 'operating',
			};
		});
	}

	function buildStatements(lines: Line[]) {
		const assets: Record<string, number> = {};
		const liabilities: Record<string, number> = {};
		const equity: Record<string, number> = {};
		const revenues: Record<string, number> = {};
		const expenses: Record<string, number> = {};
		const add = (bucket: Record<string, number>, cat: string, v: number) => {
			bucket[cat] = (bucket[cat] || 0) + v;
		};
		let operating = 0, investing = 0, financing = 0;
		for (const l of lines) {
			const d = toHumanAmount(l.debit, l.symbol);
			const c = toHumanAmount(l.credit, l.symbol);
			switch (l.kind) {
				case 'asset': add(assets, l.category, d - c); break;
				case 'liability': add(liabilities, l.category, c - d); break;
				case 'equity': add(equity, l.category, c - d); break;
				case 'revenue': add(revenues, l.category, c - d); break;
				case 'expense': add(expenses, l.category, d - c); break;
			}
			if (l.category === 'cash') {
				if (l.flow === 'investing') investing += d - c;
				else if (l.flow === 'financing') financing += d - c;
				else operating += d - c;
			}
		}
		const sum = (items: Record<string, number>) => Object.values(items).reduce((a, b) => a + b, 0);
		const totalAssets = sum(assets);
		const totalLiabilities = sum(liabilities);
		const totalRevenues = sum(revenues);
		const totalExpenses = sum(expenses);
		return {
			balanceSheet: {
				assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity: sum(equity),
				netPosition: totalAssets - totalLiabilities,
			},
			incomeStatement: { revenues, expenses, totalRevenues, totalExpenses, netIncome: totalRevenues - totalExpenses },
			cashFlow: { operating, investing, financing, netChange: operating + investing + financing },
		};
	}

	function currenciesOf(lines: Line[]): string[] {
		return [...new Set(lines.map((l) => l.symbol).filter(Boolean))].sort();
	}

	function isMixed(currencies: string[]): boolean {
		if (currencies.length > 1) return true;
		return currencies.length === 1 && !!accountingSymbol && currencies[0] !== accountingSymbol;
	}

	let ledgerCurrencies = $derived(currenciesOf(workingLines));
	let ledgerCurrencyMixed = $derived(isMixed(ledgerCurrencies));

	let supersededReportIds = $derived.by(() => {
		const ids = new SvelteSet<string>();
		for (const r of financialReports) {
			const sup = reportRefId(r.supersedes);
			if (sup) ids.add(sup);
		}
		return ids;
	});

	let officialReportsSorted = $derived(
		[...financialReports].sort((a, b) => (Number(b.as_of) || 0) - (Number(a.as_of) || 0))
	);

	let selectedReportRow = $derived(
		selectedReport === 'working' ? null : financialReports.find((r) => String(r.id) === selectedReport) ?? null
	);

	// Report lists carry no statements: the selected report is opened on demand.
	$effect(() => {
		const id = selectedReport;
		if (id === 'working') return;
		untrack(() => {
			if (reportCache[id]) return;
			const row = financialReports.find((r) => String(r.id) === id);
			void read('report_view', { report: row?.id ?? id }).then((reply) => {
				reportCache[id] = { report: reply?.report ?? null };
			});
		});
	});

	function reportOptionLabel(report: any): string {
		const date = formatHumanDate(report.as_of);
		const period = reportRefId(reportCache[String(report.id)]?.report?.period);
		let label: string;
		if (report.kind === 'draft') {
			label = `Draft · ${date}`;
		} else if (report.kind === 'period_close') {
			label = period ? `Period ${period} · issued ${date}` : `Period close · issued ${date}`;
		} else {
			label = `${formatCategory(String(report.kind || 'report'))} · issued ${date}`;
		}
		if (supersededReportIds.has(String(report.id))) label += ' (superseded)';
		return label;
	}

	let selectedLines: Line[] | null = $derived.by(() => {
		if (selectedReport === 'working') return workingLines;
		const cached = reportCache[selectedReport];
		return cached?.report ? reportLines(cached.report) : null;
	});

	let statementNote = $derived.by(() => {
		if (selectedReport === 'working') return '';
		const cached = reportCache[selectedReport];
		if (!cached) return 'Opening report…';
		if (!cached.report) return "This report's statements are not available.";
		if (!selectedLines) return 'This report holds no statement data.';
		return '';
	});

	let reportStatusLine = $derived.by(() => {
		if (selectedReport === 'working') return 'Unofficial working books. Not an issued report.';
		const report = selectedReportRow;
		if (!report) return '';
		if (report.kind === 'draft') {
			return `Draft snapshot · generated ${formatHumanDate(report.as_of)}`;
		}
		const kindLabel =
			report.kind === 'period_close' ? 'Period close' :
			report.kind === 'as_of' ? 'As-of' :
			formatCategory(String(report.kind || 'report'));
		return `Official · issued ${formatHumanDate(report.as_of)} · ${kindLabel}`;
	});

	// Ledger entries come in booking order: the latest one tied to a fiscal period names it.
	let draftPeriod = $derived.by(() => {
		for (let i = ledgerEntries.length - 1; i >= 0; i--) {
			const period = reportRefId(ledgerEntries[i]?.period);
			if (period) return period;
		}
		return '';
	});

	let draftUnavailableNote = $derived(
		!can('treasury.manage')
			? 'Draft snapshots are issued by treasury managers.'
			: !draftPeriod
				? 'Draft snapshots become available once a fiscal period has ledger activity.'
				: ''
	);

	async function generateDraftSnapshot() {
		if (draftUnavailableNote) return;
		draftBusy = true;
		draftError = '';
		try {
			let reply: any = null;
			try {
				reply = await ctx.run('report_issue', { period: draftPeriod, kind: 'draft' });
			} catch (e) {
				console.warn('report_issue failed:', e);
			}
			if (!reply?.ok) {
				if (reply) console.warn('report_issue:', reply.error);
				draftError = 'The draft snapshot could not be generated right now.';
				ctx.notify?.('error', draftError);
				return;
			}
			await loadData();
			const id = reportRefId(reply.report);
			if (id && officialReportsSorted.some((r) => r.id === id)) selectedReport = id;
			ctx.notify?.('success', 'Draft snapshot generated.');
		} finally {
			draftBusy = false;
		}
	}

	// --- Financial statement computations (accounting tab display) ---
	let statementLines: Line[] = $derived(selectedLines ?? []);
	let statements = $derived(buildStatements(statementLines));
	let workingStatements = $derived(buildStatements(workingLines));
	let balanceSheet = $derived(statements.balanceSheet);
	let incomeStatement = $derived(statements.incomeStatement);
	let cashFlow = $derived(statements.cashFlow);
	let statementCurrencies = $derived(currenciesOf(statementLines));
	let statementCurrencyMixed = $derived(isMixed(statementCurrencies));

	// --- Funds and budgets ---
	let funds = $derived(
		Object.entries(fundBalances).map(([code, balances]) => ({
			code,
			balances: Object.entries(balances ?? {}).map(([symbol, amount]) => ({
				symbol,
				amount: toHumanAmount(amount, symbol),
			})),
		}))
	);

	// Budget amounts are booked in the accounting currency.
	let budgets = $derived(
		budgetRows.map((b) => {
			const category = String(b.category || 'other');
			const fund = reportRefId(b.fund);
			const kind = String(b.kind || '');
			const period = reportRefId(b.period);
			return {
				id: String(b.id ?? ''),
				name: fund ? `${fund} · ${formatCategory(category)}` : formatCategory(category),
				detail: [kind || 'expense', period].filter(Boolean).join(' · '),
				category,
				budget_type: kind,
				planned_amount: toHumanAmount(b.planned, accountingSymbol),
				actual_amount: toHumanAmount(b.actual, accountingSymbol),
				status: String(b.status || ''),
			};
		})
	);

	// --- Visualization data ---
	const PALETTE = ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#1D4ED8'];

	let taxAllocationData = $derived.by(() => {
		// An amended budget's spending carries over to its replacement, so only current versions count.
		const byLabel: Record<string, { label: string; category: string; amount: number }> = {};
		for (const b of budgets) {
			if (b.budget_type !== 'expense' || !(b.actual_amount > 0) || b.status === 'amended') continue;
			byLabel[b.name] ??= { label: b.name, category: b.category, amount: 0 };
			byLabel[b.name].amount += b.actual_amount;
		}
		let source = Object.values(byLabel);
		if (source.length === 0) {
			source = Object.entries(workingStatements.incomeStatement.expenses)
				.filter(([, amount]) => amount > 0)
				.map(([cat, amount]) => ({ label: formatCategory(cat), category: cat, amount }));
		}
		return source.map((s, i) => ({
			label: s.label,
			amount: s.amount,
			color: categoryColors[s.category] || `hsl(217, 91%, ${Math.min(30 + i * 10, 80)}%)`,
		}));
	});

	let assetPortfolioData = $derived(
		funds
			.flatMap((f) => f.balances.map((b) => ({ name: f.code, symbol: b.symbol, balance: b.amount })))
			.filter((item) => item.balance > 0)
			.map((item, i) => ({ ...item, color: PALETTE[i % PALETTE.length] }))
	);

	let taxContributionData = $derived.by(() => {
		const contribs: Record<string, { key: string; name: string; type: string; contribution: number; color: string }> = {};
		for (const e of ledgerEntries) {
			if (e.kind !== 'revenue' || !(Number(e.credit) > 0)) continue;
			const user = reportRefId(e.user);
			const key = user ? `user:${user}` : `category:${e.category || 'other'}`;
			contribs[key] ??= {
				key,
				name: user ? shortId(user) : formatCategory(String(e.category || 'other')),
				type: user ? 'citizen' : 'other',
				contribution: 0,
				color: user ? '#3B82F6' : '#10B981',
			};
			contribs[key].contribution += toHumanAmount(e.credit, e.symbol);
		}
		return Object.values(contribs).sort((a, b) => b.contribution - a.contribution);
	});

	let cashFlowBreakdown = $derived.by(() => {
		const revByCat: Record<string, number> = {};
		const expByCat: Record<string, number> = {};
		for (const e of ledgerEntries) {
			const cat = e.category || 'other';
			if (e.kind === 'revenue' && Number(e.credit) > 0) {
				revByCat[cat] = (revByCat[cat] || 0) + toHumanAmount(e.credit, e.symbol);
			} else if (e.kind === 'expense' && Number(e.debit) > 0) {
				expByCat[cat] = (expByCat[cat] || 0) + toHumanAmount(e.debit, e.symbol);
			}
		}
		const income = Object.entries(revByCat).map(([cat, amt]) => ({ category: formatCategory(cat), amount: amt }));
		const expenses = Object.entries(expByCat).map(([cat, amt]) => ({ category: formatCategory(cat), amount: amt }));
		const totalIncome = income.reduce((s, i) => s + i.amount, 0);
		const totalExpenses = expenses.reduce((s, i) => s + i.amount, 0);
		return { income, expenses, totalIncome, totalExpenses, net: totalIncome - totalExpenses };
	});

	function barWidth(value: number, max: number): string {
		if (!(max > 0) || !Number.isFinite(value)) return '0%';
		return `${Math.min(100, (value / max) * 100).toFixed(1)}%`;
	}

	// --- Records tab ---
	const ENTITY_TYPES = ['LedgerEntry', 'Budget', 'Fund', 'FiscalPeriod', 'FinancialReport'] as const;
	const PAGE_SIZE = 50;

	let recEntity = $state<string>('LedgerEntry');
	let recPage = $state(0);
	let recStarts: number[] = [1];
	let recNext: number | null = $state(null);
	let recItems: any[] = $state([]);
	let recLoading = $state(false);
	let recUnavailable = $state(false);
	let recColumns: string[] = $state([]);
	let recAllowed = $derived(can('db.export'));

	let csvBusy = $state(false);
	let csvProgress = $state('');

	async function loadRecordsPage() {
		recLoading = true;
		try {
			let from: number | null = recStarts[recPage] ?? 1;
			let reply: any = null;
			// Cursor pages can come back empty while more follow; skip a bounded number of them.
			for (let hops = 0; hops < 20 && from != null; hops++) {
				reply = await read('realm_export', { entity: recEntity, from, count: PAGE_SIZE });
				if (!reply || (Array.isArray(reply.rows) && reply.rows.length > 0)) break;
				from = reply.next ?? null;
			}
			recUnavailable = !reply;
			const rows: any[] = Array.isArray(reply?.rows) ? reply.rows : [];
			recItems = rows;
			recNext = rows.length > 0 ? reply?.next ?? null : null;
			recColumns = rows.length > 0 ? Object.keys(rows[0]).filter((k) => !k.startsWith('_')) : [];
		} finally {
			recLoading = false;
		}
	}

	function recFirst() {
		recPage = 0;
		void loadRecordsPage();
	}

	function recPrev() {
		if (recPage === 0) return;
		recPage -= 1;
		void loadRecordsPage();
	}

	function recNextPage() {
		if (recNext == null) return;
		recStarts[recPage + 1] = recNext;
		recPage += 1;
		void loadRecordsPage();
	}

	function recChangeEntity(entity: string) {
		recEntity = entity;
		recPage = 0;
		recStarts = [1];
		void loadRecordsPage();
	}

	async function downloadCsv() {
		csvBusy = true;
		csvProgress = 'Exporting…';
		try {
			const result = await readAll('realm_export', 'rows', { entity: recEntity }, 100_000);
			if (!result) {
				csvProgress = 'Export is not available right now.';
				return;
			}
			const records = result.rows.map((row) =>
				Object.fromEntries(
					Object.entries(row ?? {}).map(([k, v]) => [k, v != null && typeof v === 'object' ? JSON.stringify(v) : v])
				)
			);
			if (records.length === 0) {
				csvProgress = 'No data to export.';
				return;
			}
			triggerDownload(buildCsvBlob(records), `${recEntity}.csv`);
			csvProgress = `Exported ${records.length} records.`;
		} catch (e) {
			console.warn('CSV export failed:', e);
			csvProgress = 'Export is not available right now.';
		} finally {
			csvBusy = false;
		}
	}

	let recTabInitialized = false;
	$effect(() => {
		if (tab === 'records' && !loading && !recTabInitialized) {
			recTabInitialized = true;
			untrack(() => {
				if (recAllowed) void loadRecordsPage();
			});
		}
	});

	let panelClass = $derived(
		narrow
			? 'bg-white dark:bg-gray-800 overflow-hidden mb-6 border-y border-gray-200 dark:border-gray-700'
			: 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6'
	);
	let panelHeadClass = $derived(
		narrow
			? 'bg-gray-50 dark:bg-gray-750 px-3 py-3 border-b border-gray-200 dark:border-gray-700'
			: 'bg-gray-50 dark:bg-gray-750 px-6 py-4 border-b border-gray-200 dark:border-gray-700'
	);
	let panelBodyClass = $derived(narrow ? 'p-3' : 'p-6');
</script>

<div class={cn('w-full font-sans', narrow ? 'py-4' : 'py-6')}>
	<div class={narrow ? 'mb-4' : 'mb-6'}>
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{extensionDescription}</p>
	</div>

	<div class="flex border-b border-gray-200 dark:border-gray-700 mb-4">
		<button
			type="button"
			class="chrome-tab {tab === 'accounting' ? 'is-on' : ''}"
			onclick={() => (tab = 'accounting')}
			title="Accounting"
			aria-label="Accounting"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m-6 4h6m-6 4h4M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
			</svg>
			<span class="chrome-label">Accounting</span>
		</button>
		<button
			type="button"
			class="chrome-tab {tab === 'visualizations' ? 'is-on' : ''}"
			onclick={() => (tab = 'visualizations')}
			title="Visualizations"
			aria-label="Visualizations"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
			</svg>
			<span class="chrome-label">Visualizations</span>
		</button>
		<button
			type="button"
			class="chrome-tab {tab === 'records' ? 'is-on' : ''}"
			onclick={() => (tab = 'records')}
			title="Records"
			aria-label="Records"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
			</svg>
			<span class="chrome-label">Records</span>
		</button>
	</div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="mt-3 text-gray-500 dark:text-gray-400">Loading metrics…</span>
		</div>

	{:else if tab === 'accounting'}
		<!-- ===== ACCOUNTING TAB ===== -->

		<div class="mb-6">
			<label for="report-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report</label>
			<div class="flex flex-wrap items-center gap-2 max-w-2xl">
				<select
					id="report-select"
					bind:value={selectedReport}
					class="flex-1 min-w-[12rem] border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
				>
					<option value="working">Working books</option>
					{#each officialReportsSorted as report (report.id)}
						<option value={report.id}>{reportOptionLabel(report)}</option>
					{/each}
				</select>
				<button
					type="button"
					onclick={generateDraftSnapshot}
					disabled={draftBusy || !!draftUnavailableNote}
					class="chrome-btn chrome-btn-primary shrink-0"
					title={draftBusy ? 'Generating…' : 'Generate draft snapshot'}
					aria-label={draftBusy ? 'Generating draft snapshot' : 'Generate draft snapshot'}
				>
					{#if draftBusy}
						<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					{/if}
					<span class="chrome-label">{draftBusy ? 'Generating…' : 'Generate draft snapshot'}</span>
				</button>
			</div>
			{#if draftError}
				<p class="text-sm text-red-600 dark:text-red-400 mt-1">{draftError}</p>
			{:else if draftUnavailableNote}
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{draftUnavailableNote}</p>
			{/if}
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">{reportStatusLine}</p>
			{#if selectedReport === 'working' && ledgerTruncated}
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Working books cover the first {ledgerEntries.length} ledger entries.</p>
			{/if}
			{#if statementNote}
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{statementNote}</p>
			{/if}
		</div>

		{#if ledgerEntries.length === 0 && funds.length === 0 && budgets.length === 0 && financialReports.length === 0}
			<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
				<p class="text-gray-700 dark:text-gray-300 font-medium">No accounting data available yet.</p>
				{#if treasuryReadable}
					<p class="text-gray-500 dark:text-gray-400 text-sm mt-2">Financial data will appear here once transactions are recorded.</p>
				{:else}
					<p class="text-gray-500 dark:text-gray-400 text-sm mt-2">Treasury figures are shown to members who can view the treasury.</p>
				{/if}
			</div>
		{:else}

			{#snippet statementCurrencyNote()}
				{#if statementCurrencyMixed}
					<span class="text-xs text-amber-700 dark:text-amber-400/90 font-normal">
						Entries span {statementCurrencies.join(', ')}
					</span>
				{:else if accountingSymbol}
					<span class="text-sm font-normal text-gray-500 dark:text-gray-400">({accountingSymbol})</span>
				{/if}
			{/snippet}

			<!-- Summary Cards -->
			<div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
				<span class="text-xs text-gray-500 dark:text-gray-400">Summary</span>
				{@render statementCurrencyNote()}
			</div>
			<div
				class={narrow
					? 'grid grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700 mb-6'
					: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'}
			>
				<div class={narrow ? 'bg-white dark:bg-gray-800 p-4' : 'bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm'}>
					<div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Assets</div>
					<div class="text-2xl font-bold text-gray-800 dark:text-white">{fmtCompact(balanceSheet.totalAssets)}</div>
				</div>
				<div class={narrow ? 'bg-white dark:bg-gray-800 p-4' : 'bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm'}>
					<div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Liabilities</div>
					<div class="text-2xl font-bold text-gray-600 dark:text-gray-300">{fmtCompact(balanceSheet.totalLiabilities)}</div>
				</div>
				<div class={narrow ? 'bg-white dark:bg-gray-800 p-4' : 'bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm'}>
					<div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Net Position</div>
					<div class="text-2xl font-bold text-gray-800 dark:text-white">{fmtCompact(balanceSheet.netPosition)}</div>
				</div>
				<div class={narrow ? 'bg-white dark:bg-gray-800 p-4' : 'bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm'}>
					<div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Net Income</div>
					<div class={cn('text-2xl font-bold', incomeStatement.netIncome >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
						{incomeStatement.netIncome >= 0 ? '+' : ''}{fmtCompact(incomeStatement.netIncome)}
					</div>
				</div>
			</div>

			<!-- Balance Sheet -->
			<div class={panelClass}>
				<div class={panelHeadClass}>
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
						<h3 class="text-lg font-semibold text-gray-800 dark:text-white">📋 Balance Sheet</h3>
						{@render statementCurrencyNote()}
					</div>
				</div>
				<div class={panelBodyClass}>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div>
							<h4 class="font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center">
								<span class="w-3 h-3 bg-blue-800 dark:bg-blue-500 rounded-full mr-2"></span> Assets
							</h4>
							<div class="space-y-2">
								{#each Object.entries(balanceSheet.assets) as [cat, amt] (cat)}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">{formatCategory(cat)}</span>
										<span class="font-medium text-gray-800 dark:text-gray-200">{fmtCompact(amt as number)}</span>
									</div>
								{/each}
								<div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-semibold">
									<span class="text-gray-700 dark:text-gray-300">Total Assets</span>
									<span class="text-blue-800 dark:text-blue-400">{fmtCompact(balanceSheet.totalAssets)}</span>
								</div>
							</div>
						</div>
						<div>
							<h4 class="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center">
								<span class="w-3 h-3 bg-red-500 rounded-full mr-2"></span> Liabilities
							</h4>
							<div class="space-y-2">
								{#each Object.entries(balanceSheet.liabilities) as [cat, amt] (cat)}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">{formatCategory(cat)}</span>
										<span class="font-medium text-gray-800 dark:text-gray-200">{fmtCompact(amt as number)}</span>
									</div>
								{/each}
								<div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-semibold">
									<span class="text-gray-700 dark:text-gray-300">Total Liabilities</span>
									<span class="text-red-600 dark:text-red-400">{fmtCompact(balanceSheet.totalLiabilities)}</span>
								</div>
							</div>
						</div>
						<div>
							<h4 class="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center">
								<span class="w-3 h-3 bg-blue-400 rounded-full mr-2"></span> Fund Balance
							</h4>
							<div class="space-y-2">
								{#each Object.entries(balanceSheet.equity) as [cat, amt] (cat)}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">{formatCategory(cat)}</span>
										<span class="font-medium text-gray-800 dark:text-gray-200">{fmtCompact(amt as number)}</span>
									</div>
								{/each}
								<div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-semibold">
									<span class="text-gray-700 dark:text-gray-300">Net Position</span>
									<span class="text-blue-800 dark:text-blue-400">{fmtCompact(balanceSheet.netPosition)}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Income Statement -->
			<div class={panelClass}>
				<div class={panelHeadClass}>
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
						<h3 class="text-lg font-semibold text-gray-800 dark:text-white">📈 Income Statement</h3>
						{@render statementCurrencyNote()}
					</div>
				</div>
				<div class={panelBodyClass}>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h4 class="font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center">
								<span class="w-3 h-3 bg-blue-800 dark:bg-blue-500 rounded-full mr-2"></span> Revenues
							</h4>
							<div class="space-y-2">
								{#each Object.entries(incomeStatement.revenues) as [cat, amt] (cat)}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">{formatCategory(cat)}</span>
										<span class="font-medium text-blue-700 dark:text-blue-400">+{fmtCompact(amt as number)}</span>
									</div>
								{/each}
								<div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-semibold">
									<span class="text-gray-700 dark:text-gray-300">Total Revenues</span>
									<span class="text-blue-800 dark:text-blue-400">{fmtCompact(incomeStatement.totalRevenues)}</span>
								</div>
							</div>
						</div>
						<div>
							<h4 class="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center">
								<span class="w-3 h-3 bg-red-500 rounded-full mr-2"></span> Expenses
							</h4>
							<div class="space-y-2">
								{#each Object.entries(incomeStatement.expenses) as [cat, amt] (cat)}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">{formatCategory(cat)}</span>
										<span class="font-medium text-red-500 dark:text-red-400">-{fmtCompact(amt as number)}</span>
									</div>
								{/each}
								<div class="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-semibold">
									<span class="text-gray-700 dark:text-gray-300">Total Expenses</span>
									<span class="text-red-600 dark:text-red-400">{fmtCompact(incomeStatement.totalExpenses)}</span>
								</div>
							</div>
						</div>
					</div>
					<div class={cn('mt-6 p-4', narrow ? 'border-t border-blue-200 dark:border-blue-800' : 'rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800')}>
						<div class="flex justify-between items-center">
							<span class="font-semibold text-blue-700 dark:text-blue-300">
								Net Income ({incomeStatement.netIncome >= 0 ? 'Surplus' : 'Deficit'})
							</span>
							<span class={cn('text-xl font-bold', incomeStatement.netIncome >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-red-600 dark:text-red-400')}>
								{incomeStatement.netIncome >= 0 ? '+' : ''}{fmtCompact(incomeStatement.netIncome)}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Cash Flow Statement -->
			<div class={panelClass}>
				<div class={panelHeadClass}>
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
						<h3 class="text-lg font-semibold text-gray-800 dark:text-white">💰 Cash Flow Statement</h3>
						{@render statementCurrencyNote()}
					</div>
				</div>
				<div class={cn(panelBodyClass, 'space-y-4')}>
					{#each [
						{ label: 'Operating Activities', sub: 'Day-to-day operations', value: cashFlow.operating },
						{ label: 'Investing Activities', sub: 'Capital expenditures', value: cashFlow.investing },
						{ label: 'Financing Activities', sub: 'Bonds and debt', value: cashFlow.financing },
					] as item (item.label)}
						<div class={cn('flex justify-between items-center p-3', narrow ? 'border-b border-gray-100 dark:border-gray-700 last:border-0' : 'bg-gray-50 dark:bg-gray-750 rounded-lg')}>
							<div>
								<span class="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
								<p class="text-xs text-gray-500 dark:text-gray-400">{item.sub}</p>
							</div>
							<span class={cn('text-lg font-semibold', item.value >= 0 ? 'text-blue-800 dark:text-blue-400' : 'text-red-600 dark:text-red-400')}>
								{item.value >= 0 ? '+' : ''}{fmtCompact(item.value)}
							</span>
						</div>
					{/each}
					<div class="border-t dark:border-gray-600 pt-4 flex justify-between items-center">
						<span class="font-semibold text-gray-800 dark:text-gray-200">Net Change in Cash</span>
						<span class={cn('text-xl font-bold', cashFlow.netChange >= 0 ? 'text-blue-800 dark:text-blue-400' : 'text-red-600 dark:text-red-400')}>
							{cashFlow.netChange >= 0 ? '+' : ''}{fmtCompact(cashFlow.netChange)}
						</span>
					</div>
				</div>
			</div>

			<!-- Funds Overview -->
			{#if funds.length > 0}
				<div class={panelClass}>
					<div class={panelHeadClass}>
						<h3 class="text-lg font-semibold text-gray-800 dark:text-white">🏦 Funds Overview</h3>
					</div>
					<div class={panelBodyClass}>
						<div class={narrow ? 'divide-y divide-gray-200 dark:divide-gray-700' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
							{#each funds as fund (fund.code)}
								<div class={narrow ? 'py-3' : 'p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600'}>
									<div class="flex items-center justify-between mb-2">
										<span class="font-semibold text-gray-800 dark:text-gray-200">{fund.code}</span>
										<span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">fund</span>
									</div>
									{#if fund.balances.length === 0}
										<p class="text-sm text-gray-600 dark:text-gray-400">No balance yet</p>
									{:else}
										{#each fund.balances as bal (bal.symbol)}
											<p class="text-sm text-gray-600 dark:text-gray-400 flex justify-between gap-3">
												<span>{bal.symbol}</span>
												<span class="tabular-nums">{fmt(bal.amount)}</span>
											</p>
										{/each}
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Budget Performance -->
			{#if budgets.length > 0}
				<div class={panelClass}>
					<div class={panelHeadClass}>
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
							<h3 class="text-lg font-semibold text-gray-800 dark:text-white">📊 Budget Performance</h3>
							{@render statementCurrencyNote()}
						</div>
					</div>
					<div class={narrow ? 'px-3 py-1' : 'p-6 overflow-x-auto'}>
						{#if narrow}
							<div class="divide-y divide-gray-200 dark:divide-gray-700">
								{#each budgets as budget (budget.id ?? budget.name ?? budget.category)}
									{@const variance = (budget.actual_amount || 0) - (budget.planned_amount || 0)}
									{@const variancePercent = budget.planned_amount ? ((variance / budget.planned_amount) * 100).toFixed(1) : '0'}
									<article class="py-3">
										<div class="flex items-start justify-between gap-2">
											<div class="min-w-0">
												<div class="font-medium text-gray-800 dark:text-gray-200">{budget.name || budget.category}</div>
												<div class="text-xs text-gray-500 dark:text-gray-400">{budget.detail}</div>
											</div>
											<span class={cn(
												'shrink-0 text-xs px-2 py-0.5',
												budget.status === 'adopted' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
												budget.status === 'draft' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
												'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
											)}>
												{budget.status || 'draft'}
											</span>
										</div>
										<dl class="mt-2 space-y-1 text-sm">
											<div class="flex justify-between gap-3">
												<dt class="text-gray-500 dark:text-gray-400">
													Planned{#if accountingSymbol && !ledgerCurrencyMixed}<span> ({accountingSymbol})</span>{/if}
												</dt>
												<dd class="text-gray-600 dark:text-gray-300 tabular-nums">{fmtCompact(budget.planned_amount || 0)}</dd>
											</div>
											<div class="flex justify-between gap-3">
												<dt class="text-gray-500 dark:text-gray-400">
													Actual{#if accountingSymbol && !ledgerCurrencyMixed}<span> ({accountingSymbol})</span>{/if}
												</dt>
												<dd class="text-gray-800 dark:text-gray-200 font-medium tabular-nums">{fmtCompact(budget.actual_amount || 0)}</dd>
											</div>
											<div class="flex justify-between gap-3">
												<dt class="text-gray-500 dark:text-gray-400">
													Variance{#if accountingSymbol && !ledgerCurrencyMixed}<span> ({accountingSymbol})</span>{/if}
												</dt>
												<dd class={cn('tabular-nums', variance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-500 dark:text-red-400')}>
													{variance >= 0 ? '+' : ''}{fmtCompact(variance)} ({variancePercent}%)
												</dd>
											</div>
										</dl>
									</article>
								{/each}
							</div>
						{:else}
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b border-gray-200 dark:border-gray-600">
										<th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Category</th>
										<th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
											Planned{#if accountingSymbol && !ledgerCurrencyMixed}<span class="font-normal text-gray-500 dark:text-gray-400"> ({accountingSymbol})</span>{/if}
										</th>
										<th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
											Actual{#if accountingSymbol && !ledgerCurrencyMixed}<span class="font-normal text-gray-500 dark:text-gray-400"> ({accountingSymbol})</span>{/if}
										</th>
										<th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
											Variance{#if accountingSymbol && !ledgerCurrencyMixed}<span class="font-normal text-gray-500 dark:text-gray-400"> ({accountingSymbol})</span>{/if}
										</th>
										<th class="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
									</tr>
								</thead>
								<tbody>
									{#each budgets as budget (budget.id ?? budget.name ?? budget.category)}
										{@const variance = (budget.actual_amount || 0) - (budget.planned_amount || 0)}
										{@const variancePercent = budget.planned_amount ? ((variance / budget.planned_amount) * 100).toFixed(1) : '0'}
										<tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
											<td class="py-3 px-4">
												<div class="font-medium text-gray-800 dark:text-gray-200">{budget.name || budget.category}</div>
												<div class="text-xs text-gray-500 dark:text-gray-400">{budget.detail}</div>
											</td>
											<td class="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{fmtCompact(budget.planned_amount || 0)}</td>
											<td class="py-3 px-4 text-right text-gray-800 dark:text-gray-200 font-medium">{fmtCompact(budget.actual_amount || 0)}</td>
											<td class={cn('py-3 px-4 text-right', variance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-500 dark:text-red-400')}>
												{variance >= 0 ? '+' : ''}{fmtCompact(variance)} ({variancePercent}%)
											</td>
											<td class="py-3 px-4 text-center">
												<span class={cn(
													'px-2 py-1 text-xs rounded-full',
													budget.status === 'adopted' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
													budget.status === 'draft' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
													'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
												)}>
													{budget.status || 'draft'}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>
				</div>
			{/if}

			<div class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
				{ledgerEntries.length}{ledgerTruncated ? '+' : ''} ledger entries · {funds.length} funds{#if budgetsReadable} · {budgets.length} budgets{/if}
			</div>
		{/if}

	{:else if tab === 'records' && !recAllowed}
		<!-- ===== RECORDS TAB ===== -->
		<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
			<p class="text-gray-700 dark:text-gray-300 font-medium">Accounting records are browsed by members who can export realm data.</p>
		</div>

	{:else if tab === 'records'}
		<div class="mb-4 flex flex-wrap items-center gap-4">
			<div class="flex items-center gap-2">
				<label for="entity-select" class="text-sm font-medium text-gray-700 dark:text-gray-300">Entity</label>
				<select
					id="entity-select"
					onchange={(e) => recChangeEntity((e.target as HTMLSelectElement).value)}
					class="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
				>
					{#each ENTITY_TYPES as et (et)}
						<option value={et} selected={et === recEntity}>{et}</option>
					{/each}
				</select>
			</div>
			<button
				type="button"
				onclick={downloadCsv}
				disabled={csvBusy}
				class="chrome-btn chrome-btn-primary"
				title={csvBusy ? csvProgress : 'Download CSV'}
				aria-label={csvBusy ? csvProgress : 'Download CSV'}
			>
				{#if csvBusy}
					<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				{:else}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
					</svg>
				{/if}
				<span class="chrome-label">{csvBusy ? csvProgress : 'Download CSV'}</span>
			</button>
			{#if csvProgress && !csvBusy}
				<span class="text-sm text-gray-500 dark:text-gray-400">{csvProgress}</span>
			{/if}
			<span class="ml-auto text-sm text-gray-500 dark:text-gray-400">{recItems.length} records on this page</span>
		</div>

		{#if recLoading}
			<div class="flex flex-col items-center justify-center py-12">
				<div class="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
				<span class="mt-3 text-gray-500 dark:text-gray-400 text-sm">Reading page {recPage + 1}…</span>
			</div>
		{:else if recItems.length === 0}
			<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
				<p class="text-gray-700 dark:text-gray-300 font-medium">
					{recUnavailable ? `${recEntity} records are not available right now.` : `No ${recEntity} records found.`}
				</p>
			</div>
		{:else}
			{#if narrow}
				<div class="divide-y divide-gray-200 dark:divide-gray-700 mb-4">
					{#each recItems as row, i (row.id ?? i)}
						<article class="py-3">
							{#if recColumns[0]}
								<div class="font-medium text-gray-900 dark:text-white truncate" title={formatRecValue(row[recColumns[0]], recColumns[0])}>
									{formatRecValue(row[recColumns[0]], recColumns[0])}
								</div>
							{/if}
							<dl class="mt-1 space-y-1">
								{#each recColumns.slice(1) as col (col)}
									<div class="flex justify-between gap-3 text-sm">
										<dt class="text-gray-500 dark:text-gray-400 shrink-0">{col}</dt>
										<dd class="text-gray-700 dark:text-gray-300 text-right min-w-0 truncate" title={formatRecValue(row[col], col)}>
											{formatRecValue(row[col], col)}
										</dd>
									</div>
								{/each}
							</dl>
						</article>
					{/each}
				</div>
			{:else}
				<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-750">
									{#each recColumns as col (col)}
										<th class="text-left py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{col}</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each recItems as row, i (row.id ?? i)}
									<tr class={cn('border-b border-gray-100 dark:border-gray-700', i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750')}>
										{#each recColumns as col (col)}
											<td class="py-2 px-3 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-xs truncate" title={formatRecValue(row[col], col)}>
												{#if typeof row[col] === 'object' && row[col] !== null}
													<span class="text-xs text-gray-500 dark:text-gray-400">{formatRecValue(row[col], col)}</span>
												{:else}
													{formatRecValue(row[col], col)}
												{/if}
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			<!-- Pagination controls -->
			<div class="flex items-center justify-center gap-2">
				<button
					onclick={recFirst}
					disabled={recPage === 0}
					class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
				>First</button>
				<button
					onclick={recPrev}
					disabled={recPage === 0}
					class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
				>Prev</button>
				<span class="text-sm text-gray-600 dark:text-gray-400 px-2">Page {recPage + 1}</span>
				<button
					onclick={recNextPage}
					disabled={recNext == null}
					class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
				>Next</button>
			</div>
		{/if}

	{:else if tab === 'visualizations'}
		<!-- ===== VISUALIZATIONS TAB ===== -->

		{#if ledgerEntries.length === 0 && budgets.length === 0}
			<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
				<p class="text-gray-700 dark:text-gray-300 font-medium">No data available for visualizations.</p>
				{#if !treasuryReadable}
					<p class="text-gray-500 dark:text-gray-400 text-sm mt-2">Treasury figures are shown to members who can view the treasury.</p>
				{/if}
			</div>
		{:else}
			<div class={narrow ? 'space-y-4 mb-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'}>
				<!-- Tax Allocation (bar chart) -->
				<div class={narrow ? 'py-1' : 'bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'}>
					<h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">📊 Tax Allocation Breakdown</h4>
					{#if taxAllocationData.length === 0}
						<p class="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No expense budgets with actual amounts</p>
					{:else}
						{@const maxAlloc = Math.max(...taxAllocationData.map(d => d.amount))}
						<div class="space-y-3">
							{#each taxAllocationData as item (item.label)}
								<div>
									<div class="flex justify-between text-sm mb-1">
										<span class="text-gray-700 dark:text-gray-300">{item.label}</span>
										<span class="font-medium text-gray-800 dark:text-gray-200">{fmtCompact(item.amount)}</span>
									</div>
									<div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4">
										<div class="h-4 rounded-full transition-all" style="width: {barWidth(item.amount, maxAlloc)}; background: {item.color}"></div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Asset Portfolio (bar chart) -->
				<div class={narrow ? 'py-1' : 'bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'}>
					<h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">💰 Asset Portfolio</h4>
					{#if assetPortfolioData.length === 0}
						<p class="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No fund balance data</p>
					{:else}
						{@const maxPortfolio = Math.max(...assetPortfolioData.map(d => d.balance))}
						{@const totalPortfolio = assetPortfolioData.reduce((s, d) => s + d.balance, 0)}
						<div class="text-center mb-4">
							<span class="text-2xl font-bold text-gray-800 dark:text-white">{fmtCompact(totalPortfolio)}</span>
							<span class="text-sm text-gray-500 dark:text-gray-400 ml-1">total</span>
						</div>
						<div class="space-y-3">
							{#each assetPortfolioData as item (`${item.name}:${item.symbol}`)}
								<div>
									<div class="flex justify-between text-sm mb-1">
										<span class="text-gray-700 dark:text-gray-300">{item.name} ({item.symbol})</span>
										<span class="font-medium text-gray-800 dark:text-gray-200">{fmtCompact(item.balance)}</span>
									</div>
									<div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4">
										<div class="h-4 rounded-full transition-all" style="width: {barWidth(item.balance, maxPortfolio)}; background: {item.color}"></div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Tax Contribution (data table) -->
			<div class={narrow ? 'py-1 mb-6' : 'bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6'}>
				<h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">🌳 Tax Contribution Analysis</h4>
				{#if taxContributionData.length === 0}
					<p class="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No revenue contribution data</p>
				{:else}
					{@const maxContrib = Math.max(...taxContributionData.map(d => d.contribution))}
					<div class="space-y-3">
						{#each taxContributionData as item (item.key)}
							<div>
								<div class="flex justify-between text-sm mb-1">
									<span class="text-gray-700 dark:text-gray-300 flex items-center gap-2">
										{item.name}
										<span class={cn(
											'text-xs px-1.5 py-0.5 rounded',
											item.type === 'citizen' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
										)}>{item.type}</span>
									</span>
									<span class="font-medium text-gray-800 dark:text-gray-200">{fmtCompact(item.contribution)}</span>
								</div>
								<div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
									<div class="h-3 rounded-full transition-all" style="width: {barWidth(item.contribution, maxContrib)}; background: {item.color}"></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Cash Flow Breakdown -->
			<div class={narrow ? 'py-1 mb-6' : 'bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6'}>
				<h4 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">💰 Cash Flow Breakdown</h4>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class={narrow ? 'py-2' : 'bg-white dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600'}>
						<div class="flex items-center justify-between mb-3">
							<span class="text-sm font-medium text-blue-700 dark:text-blue-400">📈 Income</span>
							<span class="text-lg font-bold text-blue-800 dark:text-blue-300">+{fmtCompact(cashFlowBreakdown.totalIncome)}</span>
						</div>
						<div class="space-y-1 text-xs">
							{#each cashFlowBreakdown.income as item (item.category)}
								<div class="flex justify-between text-gray-600 dark:text-gray-400">
									<span>{item.category}</span>
									<span>{fmtCompact(item.amount)}</span>
								</div>
							{/each}
						</div>
					</div>
					<div class={narrow ? 'py-2' : 'bg-white dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600'}>
						<div class="flex items-center justify-between mb-3">
							<span class="text-sm font-medium text-red-600 dark:text-red-400">📉 Expenses</span>
							<span class="text-lg font-bold text-red-500 dark:text-red-400">-{fmtCompact(cashFlowBreakdown.totalExpenses)}</span>
						</div>
						<div class="space-y-1 text-xs">
							{#each cashFlowBreakdown.expenses as item (item.category)}
								<div class="flex justify-between text-gray-600 dark:text-gray-400">
									<span>{item.category}</span>
									<span>{fmtCompact(item.amount)}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
				<div class={cn('mt-4 p-3', narrow ? 'border-t border-blue-200 dark:border-blue-800' : 'bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800')}>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-blue-700 dark:text-blue-300">💰 Net Flow</span>
						<span class={cn('text-lg font-bold', cashFlowBreakdown.net >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-red-600 dark:text-red-400')}>
							{cashFlowBreakdown.net >= 0 ? '+' : ''}{fmtCompact(cashFlowBreakdown.net)}
						</span>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.chrome-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 6px 12px;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 6px;
		border: 1px solid #d1d5db;
		background: #fff;
		color: #374151;
		cursor: pointer;
		flex-shrink: 0;
	}

	.chrome-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.chrome-btn-primary {
		background: #111827;
		border-color: #111827;
		color: #fff;
	}

	.chrome-tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
	}

	.chrome-tab.is-on {
		border-bottom-color: #111827;
		color: #111827;
	}

	:global(.dark) .chrome-btn {
		background: #1f2937;
		border-color: #4b5563;
		color: #e5e7eb;
	}

	:global(.dark) .chrome-btn-primary {
		background: #f9fafb;
		border-color: #f9fafb;
		color: #111827;
	}

	:global(.dark) .chrome-tab {
		color: #9ca3af;
	}

	:global(.dark) .chrome-tab.is-on {
		border-bottom-color: #f9fafb;
		color: #f9fafb;
	}

	@media (max-width: 720px) {
		.chrome-label {
			display: none;
		}

		.chrome-btn {
			width: 32px;
			height: 32px;
			padding: 0;
		}

		.chrome-tab {
			width: 40px;
			justify-content: center;
			padding: 10px 0;
		}
	}
</style>
