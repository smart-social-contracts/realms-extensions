export function cn(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(' ');
}

export function bridgeErrorFields(err: unknown): { code: string; message: string } {
	if (err instanceof Error) {
		const code = (err as Error & { code?: string }).code ?? 'failed';
		return { code, message: err.message };
	}
	return { code: 'failed', message: String(err) };
}

export type RealmReply = { ok: boolean; error?: string; [key: string]: unknown };

export type RealmInvoice = {
	id: string;
	amount: number | string;
	symbol: string;
	status: string;
	reason?: string;
	paid_at?: number;
	pay_to?: { owner: string; subaccount: string };
};

export type RealmNotification = {
	id: string;
	title?: string;
	body?: string;
	sender?: string;
	at?: number;
	read?: boolean;
};

/** ``amount`` base units as a decimal string with ``decimals`` places, trailing zeros dropped. */
export function formatUnits(amount: number | string, decimals: number): string {
	const digits = BigInt(amount).toString().padStart(decimals + 1, '0');
	if (!decimals) return digits;
	const frac = digits.slice(-decimals).replace(/0+$/, '');
	return frac ? `${digits.slice(0, -decimals)}.${frac}` : digits.slice(0, -decimals);
}

function capitalize(s: string): string {
	return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** A ``my_invoices`` row as the dashboard shows it; ``decimals`` by symbol (raw units when unknown). */
export function invoiceFromRealm(inv: RealmInvoice, decimals: Map<string, number>): Record<string, unknown> {
	const places = decimals.get(inv.symbol);
	const human = places == null ? String(inv.amount) : formatUnits(inv.amount, places);
	return {
		id: inv.id,
		amount: human,
		currency: inv.symbol,
		status: capitalize(inv.status),
		metadata: inv.reason ?? '',
		paid_on: inv.paid_at ? new Date(inv.paid_at * 1000).toISOString() : null,
		payment: {
			invoice_id: inv.id,
			principal: inv.pay_to?.owner ?? '',
			subaccount: inv.pay_to?.subaccount ?? '',
			amount_human: human,
			amount_raw: String(inv.amount),
			currency: inv.symbol,
		},
	};
}

export function notificationFromRealm(n: RealmNotification) {
	return {
		id: n.id,
		title: n.title,
		message: n.body,
		sender: n.sender,
		timestamp_ms: (n.at ?? 0) * 1000,
		read: Boolean(n.read),
	};
}

/** Membership activation from ``me``'s card, ``my_invoices`` and the installed extension ids. */
export function citizenshipFromRealm(
	user: Record<string, unknown>,
	invoices: RealmInvoice[],
	installed: string[],
): Record<string, unknown> {
	const paid = invoices.filter((i) => i.status === 'paid').length;
	const invoicePaid = invoices.length > 0 && paid === invoices.length;
	const passportRequired = installed.includes(PASSPORT_VERIFICATION_ID);
	// No realm read reports a member's own verified identities yet.
	const passportVerified = false;
	return {
		status: invoicePaid && (passportVerified || !passportRequired) ? 'active' : 'pending',
		member_status: user.status ?? '',
		invoice_paid: invoicePaid,
		passport_verified: passportVerified,
		passport_verification_installed: passportRequired,
		installed_extensions: installed,
		total_invoices: invoices.length,
		paid_invoices: paid,
	};
}

export function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
}

export function displayFirstName(
	summary: Record<string, unknown> | null,
	principal: string,
): string {
	const raw = summary?.user_name;
	if (typeof raw !== 'string') return '';
	const name = raw.trim();
	if (!name || name === principal) return '';
	return name.split(/\s+/)[0] ?? '';
}

export const PASSPORT_VERIFICATION_ID = 'passport_verification';
export const PASSPORT_VERIFICATION_PATH = '/extensions/passport_verification';
export const PASSPORT_ZK_REQUIREMENT = 'passport_zk';

/** Runtime signals from the realm: installed extensions/packages, or codex requirements. */
export type RealmCitizenshipContext = {
	installed?: readonly string[];
	identityRequirements?: readonly string[];
};

function stringList(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function lowerSet(values: readonly string[] | undefined): Set<string> {
	return new Set((values ?? []).map((item) => item.toLowerCase()));
}

export function isPassportVerificationAvailable(
	ctx: RealmCitizenshipContext = {},
	citizenship: Record<string, unknown> | null = null,
): boolean {
	const installed = lowerSet([
		...stringList(ctx.installed),
		...stringList(citizenship?.installed_extensions),
		...stringList(citizenship?.runtime_extensions),
		...stringList(citizenship?.installed_packages),
	]);
	if (installed.has(PASSPORT_VERIFICATION_ID)) return true;
	if (citizenship?.passport_verification_installed === true) return true;

	const requirements = lowerSet([
		...stringList(ctx.identityRequirements),
		...stringList(citizenship?.identity_requirements),
	]);
	return requirements.has(PASSPORT_ZK_REQUIREMENT);
}

export function citizenshipSteps(
	citizenship: Record<string, unknown> | null,
	ctx: RealmCitizenshipContext = {},
): {
	showPassport: boolean;
	passport: boolean;
	invoice: boolean;
	done: number;
	total: number;
} {
	const showPassport = isPassportVerificationAvailable(ctx, citizenship);
	const passport = showPassport && Boolean(citizenship?.passport_verified);
	const invoice = Boolean(citizenship?.invoice_paid);
	const total = Number(showPassport) + 1;
	return { showPassport, passport, invoice, done: Number(passport) + Number(invoice), total };
}

export function citizenshipActionTarget(id: 'verify_passport' | 'invoices'): {
	kind: 'navigate' | 'scroll';
	path?: string;
	elementId?: string;
} {
	if (id === 'verify_passport') {
		return { kind: 'navigate', path: PASSPORT_VERIFICATION_PATH };
	}
	return { kind: 'scroll', elementId: 'invoices' };
}

export function mdToHtml(text: string): string {
	if (!text) return '';
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+?)\*/g, '<em>$1</em>')
		.replace(
			/\[([^\]]+)\]\(([^)]+)\)/g,
			'<a href="$2" class="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener">$1</a>',
		)
		.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">$1</code>')
		.replace(/^\s*[-*]\s+(.+)$/gm, '<li class="ml-4">$1</li>')
		.replace(/(<li.*<\/li>\n?)+/g, (m) => '<ul class="list-disc ml-2 space-y-1">' + m + '</ul>')
		.replace(/\n{2,}/g, '</p><p class="mt-2">')
		.replace(/\n/g, '<br>')
		.replace(/^/, '<p>')
		.replace(/$/, '</p>');
}

export function formatRelativeTime(timestampMs: number): string {
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

export function formatFullDate(timestampMs: number): string {
	if (!timestampMs) return '';
	const d = new Date(timestampMs);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatInvoicePaidDate(paidOn: string | null | undefined): string {
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

export function getStatusColor(status: string): string {
	switch (status?.toLowerCase()) {
		case 'paid':
			return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
		case 'pending':
			return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
		case 'overdue':
			return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
		case 'processing':
			return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
		default:
			return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
	}
}

export function getPaymentCliCommand(info: Record<string, unknown> | null): string {
	if (!info) return '';
	const token = String(info.currency || 'token').toLowerCase();
	const subaccount = info.subaccount ? `; subaccount = opt blob "${hexToBlob(String(info.subaccount))}"` : '';
	return `dfx canister call ${token}_backend icrc1_transfer '(record { to = record { owner = principal "${info.principal}"${subaccount} }; amount = ${info.amount_raw ?? 0} })' --network ic`;
}

function hexToBlob(hex: string): string {
	return hex.replace(/../g, (b) => `\\${b}`);
}

export function entries(obj: unknown): [string, unknown][] {
	if (!obj || typeof obj !== 'object') return [];
	return Object.entries(obj).filter(([k]) => !k.startsWith('_'));
}

export const CITIZENSHIP_FIELDS = [
	{ key: 'invoice_paid', labelKey: 'citizenship_invoice_paid', kind: 'bool' },
	{ key: 'passport_verified', labelKey: 'citizenship_passport_verified', kind: 'bool' },
	{ key: 'total_invoices', labelKey: 'citizenship_total_invoices', kind: 'number' },
	{ key: 'paid_invoices', labelKey: 'citizenship_paid_invoices', kind: 'number' },
] as const;

export type CitizenshipAction = {
	id: 'verify_passport' | 'invoices';
	labelKey: 'citizenship_verify_passport' | 'citizenship_pay_invoice' | 'citizenship_view_invoices';
	tone: 'primary' | 'secondary';
};

export function citizenshipNextActions(
	citizenship: Record<string, unknown> | null,
	ctx: RealmCitizenshipContext = {},
): CitizenshipAction[] {
	if (!citizenship || citizenship.status === 'active') return [];
	const actions: CitizenshipAction[] = [];
	if (isPassportVerificationAvailable(ctx, citizenship) && !citizenship.passport_verified) {
		actions.push({
			id: 'verify_passport',
			labelKey: 'citizenship_verify_passport',
			tone: 'primary',
		});
	}
	if (!citizenship.invoice_paid) {
		const hasInvoice = Number(citizenship.total_invoices || 0) > 0;
		actions.push({
			id: 'invoices',
			labelKey: hasInvoice ? 'citizenship_pay_invoice' : 'citizenship_view_invoices',
			tone: actions.length ? 'secondary' : 'primary',
		});
	}
	return actions;
}

export async function clipboardCopy(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed';
		ta.style.left = '-9999px';
		document.body.appendChild(ta);
		ta.select();
		document.execCommand('copy');
		document.body.removeChild(ta);
		return true;
	} catch {
		return false;
	}
}
