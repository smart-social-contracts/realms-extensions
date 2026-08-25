/** Browser client + parsers for RariMe verificator-svc. */

export const RARIMO_API_BASE = 'https://api.app.rarime.com';
export const VERIFICATION_LINK_PATH =
	'/integrations/verificator-svc/private/verification-link';
export const VERIFICATION_STATUS_PATH =
	'/integrations/verificator-svc/private/verification-status';

export type JsonApiError = {
	title?: string;
	detail?: string;
	status?: string;
	meta?: { error?: string; field?: string };
};

export type VerificationLinkOk = {
	ok: true;
	id: string;
	url: string;
	testMode?: boolean;
	attributes: Record<string, unknown>;
};

export type VerificationLinkErr = {
	ok: false;
	error: string;
};

export function readPrincipal(ctx: { principal?: unknown } | null | undefined): string {
	const p = ctx?.principal;
	if (typeof p === 'string') return p;
	if (p && typeof (p as { subscribe?: unknown }).subscribe === 'function') {
		let value = '';
		const unsub = (
			p as { subscribe: (fn: (v: string) => void) => unknown }
		).subscribe((v) => {
			value = v || '';
		});
		if (typeof unsub === 'function') unsub();
		return value;
	}
	return '';
}

export function decimalEventId(raw: string): string {
	if (/^\d{1,76}$/.test(raw)) return raw;
	return String(Math.floor(Date.now() / 1000));
}

export function rarimeAppUrl(proofParamsUrl: string): string {
	return `https://app.rarime.com/external?type=proof-request&proof_params_url=${encodeURIComponent(proofParamsUrl)}`;
}

export function formatJsonApiErrors(errors: unknown): string {
	if (!Array.isArray(errors) || errors.length === 0) {
		return 'Verification service rejected the request';
	}
	const parts: string[] = [];
	for (const err of errors) {
		if (!err || typeof err !== 'object') continue;
		const item = err as JsonApiError;
		const field = item.meta?.field;
		const msg = item.meta?.error || item.detail || item.title;
		if (field && msg) parts.push(`${field}: ${msg}`);
		else if (msg) parts.push(String(msg));
	}
	return parts.join('; ') || 'Verification service rejected the request';
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

export function interpretVerificationLinkResult(
	result: unknown,
	fallbackId = '',
): VerificationLinkOk | VerificationLinkErr {
	const rec = asRecord(result);
	if (!rec) {
		return { ok: false, error: 'Invalid response format from verification service' };
	}

	if (rec.success === false) {
		const message =
			typeof rec.error === 'string' && rec.error.trim()
				? rec.error
				: formatJsonApiErrors(rec.errors);
		return { ok: false, error: message };
	}

	if (Array.isArray(rec.errors) && rec.errors.length > 0) {
		return { ok: false, error: formatJsonApiErrors(rec.errors) };
	}

	const data = asRecord(rec.data);
	const attributes = asRecord(data?.attributes);
	if (attributes) {
		if (attributes.test_mode) {
			return {
				ok: true,
				id: String(data?.id || fallbackId),
				url: String(attributes.rarime_app_url || ''),
				testMode: true,
				attributes,
			};
		}
		const proofParams =
			typeof attributes.get_proof_params === 'string' ? attributes.get_proof_params : '';
		const appUrl =
			typeof attributes.rarime_app_url === 'string' ? attributes.rarime_app_url : '';
		const url = appUrl || (proofParams ? rarimeAppUrl(proofParams) : '');
		if (url) {
			return {
				ok: true,
				id: String(data?.id || fallbackId),
				url,
				attributes,
			};
		}
	}

	const link =
		(typeof rec.link === 'string' && rec.link) ||
		(typeof data?.link === 'string' && data.link) ||
		'';
	if (link) {
		return { ok: true, id: fallbackId, url: link, attributes: attributes ?? {} };
	}

	return { ok: false, error: 'Invalid response format from verification service' };
}

export async function requestVerificationLink(opts: {
	userId: string;
	eventId: string;
}): Promise<unknown> {
	if (!opts.userId) {
		throw new Error('Sign in to start verification');
	}
	const payload = {
		data: {
			id: opts.userId,
			type: 'user',
			attributes: {
				age_lower_bound: 18,
				uniqueness: true,
				nationality: '',
				nationality_check: false,
				event_id: decimalEventId(opts.eventId),
			},
		},
	};
	const response = await fetch(`${RARIMO_API_BASE}${VERIFICATION_LINK_PATH}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/vnd.api+json, application/json',
		},
		body: JSON.stringify(payload),
	});
	const raw = await response.text();
	let parsed: unknown;
	try {
		parsed = raw ? JSON.parse(raw) : {};
	} catch {
		throw new Error(
			`Verification service returned non-JSON (HTTP ${response.status})`,
		);
	}
	if (!response.ok) {
		const rec = asRecord(parsed);
		throw new Error(
			(rec && Array.isArray(rec.errors) && formatJsonApiErrors(rec.errors)) ||
				`Verification service HTTP ${response.status}`,
		);
	}
	return parsed;
}

export async function requestVerificationStatus(userId: string): Promise<unknown> {
	if (!userId) {
		throw new Error('Sign in to check verification status');
	}
	const response = await fetch(
		`${RARIMO_API_BASE}${VERIFICATION_STATUS_PATH}/${encodeURIComponent(userId)}`,
		{
			headers: { Accept: 'application/vnd.api+json, application/json' },
		},
	);
	const raw = await response.text();
	let parsed: unknown;
	try {
		parsed = raw ? JSON.parse(raw) : {};
	} catch {
		throw new Error(
			`Verification service returned non-JSON (HTTP ${response.status})`,
		);
	}
	if (!response.ok) {
		const rec = asRecord(parsed);
		throw new Error(
			(rec && Array.isArray(rec.errors) && formatJsonApiErrors(rec.errors)) ||
				`Verification service HTTP ${response.status}`,
		);
	}
	return parsed;
}
