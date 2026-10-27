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

export type ApplyResultData = {
	created?: string[];
	updated?: string[];
	destroyed?: string[];
	proposals?: string[];
	errors?: string[];
	warnings?: string[];
};

export function formatApplyResult(result: { data?: ApplyResultData; error?: string | null }): string {
	const data = result?.data || {};
	const parts: string[] = [];
	if (data.created?.length) parts.push(`created ${data.created.join(', ')}`);
	if (data.updated?.length) parts.push(`updated ${data.updated.join(', ')}`);
	if (data.destroyed?.length) parts.push(`destroyed ${data.destroyed.join(', ')}`);
	if (data.proposals?.length) parts.push(`submitted as proposal ${data.proposals.join(', ')}`);
	if (data.errors?.length) parts.push(data.errors.join('; '));
	if (result?.error && !data.errors?.length) parts.push(result.error);
	return parts.join(' · ') || 'Department table applied';
}

/** Seat key for a table position: one per department and title. */
export function positionKey(department: string, title: string): string {
	return `${department}/${title}`;
}

type Reply = { ok: boolean; error?: string; [key: string]: any };
type OpCall = (write: boolean, name: string, args?: Record<string, unknown>) => Promise<Reply>;

function filed(reply: Reply): string {
	return reply.ok && reply.requires_vote && typeof reply.proposal === 'string' ? reply.proposal : '';
}

function text(value: unknown): string {
	return value == null ? '' : String(value).trim();
}

function list(value: unknown): DepartmentTableRow[] {
	return Array.isArray(value) ? value.filter(isObjectRow) : [];
}

/**
 * Apply a department table with the realm's operations: department_create / department_edit for each row,
 * position_create for its positions, appoint for its members and department_delete for destroy rows.
 * A governed call files a proposal instead of applying; its id is listed in ``proposals``.
 */
export async function applyDepartmentTable(doc: unknown, call: OpCall): Promise<ApplyResultData> {
	const out: Required<ApplyResultData> = {
		created: [],
		updated: [],
		destroyed: [],
		proposals: [],
		errors: [],
		warnings: [],
	};
	const listed = await call(false, 'department_list', { count: 500 });
	const existing = new Set<string>(
		listed.ok && Array.isArray(listed.departments) ? listed.departments.map((d: any) => String(d?.id ?? '')) : [],
	);
	const outcome = (label: string, reply: Reply, done: string[]): boolean => {
		const proposal = filed(reply);
		if (proposal) out.proposals.push(proposal);
		else if (reply.ok) done.push(label);
		else out.errors.push(`${label}: ${reply.error || 'not applied'}`);
		return reply.ok && !proposal;
	};

	for (const row of normalizeDepartmentRows(doc).rows) {
		const name = rowName(row);
		if (!name) continue;
		if (isDestroyRow(row)) {
			outcome(name, await call(true, 'department_delete', { department: name }), out.destroyed);
			continue;
		}
		const fields: Record<string, unknown> = {};
		if (text(row.description)) fields.description = text(row.description);
		if (text(row.parent)) fields.parent = text(row.parent);
		let ready: boolean;
		if (existing.has(name)) {
			ready = Object.keys(fields).length
				? outcome(name, await call(true, 'department_edit', { department: name, ...fields }), out.updated)
				: true;
		} else {
			ready = outcome(name, await call(true, 'department_create', { department: name, ...fields }), out.created);
		}
		const positions = list(row.positions);
		const members = list(row.members);
		if (!ready) {
			if (positions.length || members.length) {
				out.warnings.push(`${name}: positions and members wait until the department exists`);
			}
			continue;
		}
		let seats = new Set<string>();
		if (existing.has(name)) {
			const got = await call(false, 'department_get', { department: name });
			if (got.ok && Array.isArray(got.positions)) seats = new Set(got.positions.map((p: any) => String(p?.id ?? '')));
		}
		for (const pos of positions) {
			const title = text(pos.title ?? pos.name);
			if (!title) continue;
			const key = positionKey(name, title);
			if (seats.has(key)) continue;
			const args: Record<string, unknown> = { department: name, position: key, title };
			if (Number(pos.headcount) >= 1) args.headcount = Math.floor(Number(pos.headcount));
			if (text(pos.profile)) args.profile = text(pos.profile);
			if (outcome(key, await call(true, 'position_create', args), [])) seats.add(key);
		}
		for (const member of members) {
			const user = text(member.principal ?? member.user);
			const title = text(member.position);
			if (!user || !title) {
				out.warnings.push(`${name}: a member row needs principal and position`);
				continue;
			}
			outcome(`${user} in ${title}`, await call(true, 'appoint', { user, position: positionKey(name, title) }), []);
		}
		if (Array.isArray(row.permissions) && row.permissions.length) {
			out.warnings.push(`${name}: permissions come from the positions' profiles`);
		}
	}
	return out;
}

function isObjectRow(value: unknown): value is DepartmentTableRow {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}
