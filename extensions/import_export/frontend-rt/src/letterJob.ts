/** Cursor + batching for postal registration letters (issue #359). No ZIP. */

export const LETTER_BATCH = 50;

export type CitizenRow = {
	id: string;
	name: string;
	address: string;
	raw: Record<string, unknown>;
};

export type MintedLetter = {
	id: string;
	name: string;
	address: string;
	code: string;
	join_path: string;
	/** Portal join URL built in the browser. Overrides join_path on the letter. */
	join_url?: string;
	reused?: boolean;
};

export type LetterJobState = {
	jsonFingerprint: string;
	rows: CitizenRow[];
	/** Next row index to render / download. */
	cursor: number;
	minted: Record<string, MintedLetter>;
	downloaded: string[];
	paused: boolean;
	startedAt: number;
	doneAt?: number;
};

export type ParseError = { index: number; error: string };

const ADDRESS_KEYS = ['address', 'postal_address', 'postalAddress'] as const;
const ADDRESS_PARTS = [
	'line1',
	'line2',
	'street',
	'street2',
	'city',
	'region',
	'state',
	'postal_code',
	'postcode',
	'zip',
	'country',
] as const;

function fromAddressValue(raw: unknown): string {
	if (typeof raw === 'string') return raw.trim();
	if (Array.isArray(raw)) {
		return raw.map((x) => String(x ?? '').trim()).filter(Boolean).join('\n');
	}
	if (raw && typeof raw === 'object') {
		const obj = raw as Record<string, unknown>;
		const parts = ADDRESS_PARTS.map((k) => String(obj[k] ?? '').trim()).filter(Boolean);
		if (parts.length) return parts.join('\n');
		return Object.values(obj)
			.map((v) => String(v ?? '').trim())
			.filter(Boolean)
			.join('\n');
	}
	return '';
}

export function postalAddress(row: Record<string, unknown>): string {
	for (const key of ADDRESS_KEYS) {
		const text = fromAddressValue(row[key]);
		if (text) return text;
	}
	const extra = row.extra;
	if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
		const obj = extra as Record<string, unknown>;
		for (const key of ADDRESS_KEYS) {
			const text = fromAddressValue(obj[key]);
			if (text) return text;
		}
	}
	return '';
}

export function parseCitizenRows(records: unknown[]): {
	rows: CitizenRow[];
	errors: ParseError[];
} {
	const rows: CitizenRow[] = [];
	const errors: ParseError[] = [];
	records.forEach((rec, index) => {
		if (!rec || typeof rec !== 'object' || Array.isArray(rec)) {
			errors.push({ index, error: 'record is not an object' });
			return;
		}
		const raw = rec as Record<string, unknown>;
		const id = String(raw.id ?? '').trim();
		if (!id) {
			errors.push({ index, error: "missing required field 'id'" });
			return;
		}
		const address = postalAddress(raw);
		if (!address) {
			errors.push({ index, error: 'postal address is required for a registration letter' });
			return;
		}
		rows.push({
			id,
			name: String(raw.name ?? '').trim(),
			address,
			raw,
		});
	});
	return { rows, errors };
}

/** Rows that still need a host mint, starting at `from`, capped at `batchSize`. */
export function nextMintBatch(
	rows: CitizenRow[],
	mintedIds: Iterable<string>,
	from = 0,
	batchSize = LETTER_BATCH,
): CitizenRow[] {
	const have = mintedIds instanceof Set ? mintedIds : new Set(mintedIds);
	const out: CitizenRow[] = [];
	for (let i = Math.max(0, from); i < rows.length && out.length < batchSize; i++) {
		const row = rows[i];
		if (row && !have.has(row.id)) out.push(row);
	}
	return out;
}

export function fingerprintJson(text: string): string {
	let hash = 2166136261;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(16);
}

export function emptyJob(rows: CitizenRow[], jsonFingerprint: string): LetterJobState {
	return {
		jsonFingerprint,
		rows,
		cursor: 0,
		minted: {},
		downloaded: [],
		paused: false,
		startedAt: Date.now(),
	};
}

export function etaSeconds(done: number, total: number, startedAt: number, now = Date.now()): number | null {
	if (done <= 0 || total <= done) return done >= total ? 0 : null;
	const elapsed = Math.max(1, now - startedAt);
	const rate = done / elapsed;
	return Math.round((total - done) / rate / 1000);
}

export function formatEta(seconds: number | null): string {
	if (seconds == null) return '…';
	if (seconds <= 0) return '0s';
	if (seconds < 60) return `${seconds}s`;
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}m ${s}s`;
}

export function safeLetterFilename(letter: { id: string; name?: string }): string {
	const id = String(letter.id || 'citizen').replace(/[^\w.-]+/g, '_').slice(0, 40);
	const name = String(letter.name || '')
		.replace(/[^\w.-]+/g, '_')
		.slice(0, 40);
	return name ? `letter-${id}-${name}.pdf` : `letter-${id}.pdf`;
}
