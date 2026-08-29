/** Founder department-table JSON — same document as realms #358 host verbs. */

export const DESTROY_ACTIONS = new Set(['destroy', 'delete', 'remove']);

/** Example from realms #358 — upsert Finance, destroy Works. */
export const EXAMPLE_DEPARTMENT_TABLE = {
	departments: [
		{
			name: 'Finance',
			description: 'treasury clerks',
			positions: [{ title: 'clerk', profile: 'clerk', headcount: 2 }],
			members: [{ principal: 'ana-principal', profile: 'clerk', position: 'clerk' }],
			permissions: ['budget.read'],
		},
		{ name: 'Works', action: 'destroy' },
	],
} as const;

export type DepartmentTableRow = Record<string, unknown>;

export type DepartmentTablePreview = {
	upsert: string[];
	destroy: string[];
	warnings: string[];
};

export type ParseDepartmentTableResult =
	| { ok: true; doc: unknown; preview: DepartmentTablePreview }
	| { ok: false; error: string };

export function rowName(row: unknown): string {
	if (!row || typeof row !== 'object') return '';
	const rec = row as DepartmentTableRow;
	return String(rec.name ?? rec._id ?? '').trim();
}

export function isDestroyRow(row: unknown): boolean {
	if (!row || typeof row !== 'object') return false;
	const rec = row as DepartmentTableRow;
	if (rec.destroy === true) return true;
	const action = String(rec.action ?? rec._action ?? '')
		.trim()
		.toLowerCase();
	return DESTROY_ACTIONS.has(action);
}

export function documentHasDestroy(doc: unknown): boolean {
	const { rows } = normalizeDepartmentRows(doc);
	return rows.some(isDestroyRow);
}

export function normalizeDepartmentRows(doc: unknown): {
	rows: DepartmentTableRow[];
	warnings: string[];
} {
	const warnings: string[] = [];
	if (typeof doc === 'string') {
		try {
			doc = doc.trim() ? JSON.parse(doc) : {};
		} catch {
			return { rows: [], warnings: ['document is not valid JSON'] };
		}
	}
	if (doc == null) return { rows: [], warnings };
	if (Array.isArray(doc)) {
		return { rows: doc.filter(isObjectRow), warnings };
	}
	if (typeof doc === 'object') {
		const rec = doc as DepartmentTableRow;
		if ('departments' in rec) {
			const rows = rec.departments;
			if (!Array.isArray(rows)) {
				return { rows: [], warnings: ['departments must be a list'] };
			}
			return { rows: rows.filter(isObjectRow), warnings };
		}
		return { rows: [rec], warnings };
	}
	return { rows: [], warnings: ['document must be an object or list'] };
}

export function previewDepartmentTable(doc: unknown): DepartmentTablePreview {
	const { rows, warnings } = normalizeDepartmentRows(doc);
	const upsert: string[] = [];
	const destroy: string[] = [];
	const extra = [...warnings];
	for (const row of rows) {
		const name = rowName(row);
		if (!name) {
			extra.push('row missing name');
			continue;
		}
		if (isDestroyRow(row)) destroy.push(name);
		else upsert.push(name);
	}
	return { upsert, destroy, warnings: extra };
}

export function parseDepartmentTableText(text: string): ParseDepartmentTableResult {
	const raw = text.trim();
	if (!raw) {
		return { ok: false, error: 'Paste a department-table JSON document' };
	}
	let doc: unknown;
	try {
		doc = JSON.parse(raw);
	} catch {
		return { ok: false, error: 'document is not valid JSON' };
	}
	const preview = previewDepartmentTable(doc);
	if (preview.warnings.includes('document must be an object or list')) {
		return { ok: false, error: 'document must be an object or list' };
	}
	if (preview.warnings.includes('departments must be a list')) {
		return { ok: false, error: 'departments must be a list' };
	}
	if (!preview.upsert.length && !preview.destroy.length) {
		return { ok: false, error: preview.warnings[0] || 'table has no named department rows' };
	}
	return { ok: true, doc, preview };
}

export function formatApplyResult(result: {
	data?: {
		created?: string[];
		updated?: string[];
		destroyed?: string[];
		errors?: string[];
		warnings?: string[];
	};
	error?: string | null;
}): string {
	const data = result?.data || {};
	const parts: string[] = [];
	if (data.created?.length) parts.push(`created ${data.created.join(', ')}`);
	if (data.updated?.length) parts.push(`updated ${data.updated.join(', ')}`);
	if (data.destroyed?.length) parts.push(`destroyed ${data.destroyed.join(', ')}`);
	if (data.errors?.length) parts.push(data.errors.join('; '));
	if (result?.error && !data.errors?.length) parts.push(result.error);
	return parts.join(' · ') || 'Department table applied';
}

function isObjectRow(value: unknown): value is DepartmentTableRow {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}
