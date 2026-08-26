/** Defendant / quarter helpers for the create-litigation form.

Directory listings are typically the current quarter only. A pasted principal
that is not in that list needs an explicit quarter (canister id). If a
directory hit already carries a quarter id — federated listings — we send it
automatically and skip the picker.
*/

export type DirectoryEntry = {
	kind?: string;
	principal?: string;
	label?: string;
	id?: string;
	quarter_id?: string;
	quarter_canister_id?: string;
	assigned_quarter?: string;
};

export type QuarterInfo = {
	name?: string;
	canister_id?: string;
	id?: string;
	index?: number;
	is_capital?: boolean;
	status?: string;
};

export function normalizeQuarterId(raw: unknown): string {
	return String(raw ?? '').trim();
}

export function quarterCanisterId(q: QuarterInfo | null | undefined): string {
	if (!q) return '';
	return normalizeQuarterId(q.canister_id || q.id);
}

export function normalizeQuarters(raw: unknown): QuarterInfo[] {
	if (!Array.isArray(raw)) return [];
	const out: QuarterInfo[] = [];
	const seen = new Set<string>();
	for (const item of raw) {
		if (!item || typeof item !== 'object') continue;
		const q = item as QuarterInfo;
		const canisterId = quarterCanisterId(q);
		if (!canisterId || seen.has(canisterId)) continue;
		seen.add(canisterId);
		const next: QuarterInfo = {
			name: q.name || '',
			canister_id: canisterId,
			is_capital: !!q.is_capital,
		};
		if (typeof q.index === 'number') next.index = q.index;
		if (q.status) next.status = q.status;
		out.push(next);
	}
	return out;
}

export function quarterLabel(q: QuarterInfo): string {
	const name = (q.name || '').trim();
	if (q.is_capital && name) return name;
	if (q.index != null && name) return `${name} (${q.index})`;
	if (q.index != null) return `Quarter ${q.index}`;
	if (name) return name;
	const id = quarterCanisterId(q);
	return id ? `${id.slice(0, 8)}…` : 'Quarter';
}

export function quarterIdFromEntry(entry: DirectoryEntry | null | undefined): string {
	if (!entry) return '';
	return normalizeQuarterId(
		entry.quarter_id || entry.quarter_canister_id || entry.assigned_quarter,
	);
}

export function findDirectoryHit(
	directory: DirectoryEntry[] | null | undefined,
	principalOrLabel: string,
): DirectoryEntry | undefined {
	const v = principalOrLabel.trim();
	if (!v || !directory?.length) return undefined;
	const lower = v.toLowerCase();
	return (
		directory.find((e) => (e.principal || '') === v) ||
		directory.find((e) => (e.principal || '').toLowerCase() === lower)
	);
}

export function remoteQuarters(
	quarters: QuarterInfo[] | null | undefined,
	activeQuarterId: string,
): QuarterInfo[] {
	const active = normalizeQuarterId(activeQuarterId);
	return (quarters || []).filter((q) => {
		const id = quarterCanisterId(q);
		return id && (!active || id !== active);
	});
}

/** Show the compact quarter picker when a user-defendant is not in this
 *  quarter's directory and the realm has at least one other quarter. */
export function needsDefendantQuarterPicker(opts: {
	selectedEntry?: DirectoryEntry | null;
	directory?: DirectoryEntry[];
	defendantPrincipal?: string;
	quarters?: QuarterInfo[];
	activeQuarterId?: string;
}): boolean {
	if (remoteQuarters(opts.quarters, opts.activeQuarterId || '').length === 0) {
		return false;
	}
	const entry = opts.selectedEntry;
	if (entry?.kind === 'department') return false;
	const principal = normalizeQuarterId(entry?.principal || opts.defendantPrincipal);
	if (!principal) return false;
	const hit = entry || findDirectoryHit(opts.directory, principal);
	if (!hit) return true;
	// Local hit, department, or federated hit that already names a quarter.
	return false;
}

export function resolveDefendantQuarterId(opts: {
	selectedEntry?: DirectoryEntry | null;
	directory?: DirectoryEntry[];
	defendantPrincipal?: string;
	pickedQuarterId?: string;
	activeQuarterId?: string;
}): string {
	const active = normalizeQuarterId(opts.activeQuarterId);
	const fromEntry = quarterIdFromEntry(opts.selectedEntry);
	const fromHit = quarterIdFromEntry(
		findDirectoryHit(opts.directory, opts.defendantPrincipal || ''),
	);
	const picked = normalizeQuarterId(opts.pickedQuarterId);
	const known = fromEntry || fromHit || picked;
	if (!known) return '';
	if (active && known === active) return '';
	return known;
}

export function buildCreateLitigationParams(opts: {
	selectedEntry?: DirectoryEntry | null;
	defendantPrincipal?: string;
	courtId?: string;
	pickedQuarterId?: string;
	activeQuarterId?: string;
	directory?: DirectoryEntry[];
}): Record<string, unknown> {
	const e = opts.selectedEntry;
	const params: Record<string, unknown> =
		e && e.kind === 'department'
			? {
					defendant_kind: 'department',
					defendant_department: e.label || '',
					defendant_department_id: e.id || '',
				}
			: {
					defendant_kind: 'user',
					defendant_principal: (e?.principal || opts.defendantPrincipal || '').trim(),
				};

	if (!(e && e.kind === 'department')) {
		const quarterId = resolveDefendantQuarterId({
			selectedEntry: e,
			directory: opts.directory,
			defendantPrincipal: opts.defendantPrincipal,
			pickedQuarterId: opts.pickedQuarterId,
			activeQuarterId: opts.activeQuarterId,
		});
		if (quarterId) params.defendant_quarter_id = quarterId;
	}

	if (opts.courtId) params.court_id = opts.courtId;
	return params;
}
