/**
 * Reusable CSV export utility for realm extensions.
 *
 * Usage (the extension's manifest declares the `realm_export` operation):
 *   import { exportCsv } from '../../../_shared/frontend/csv-export';
 *   await exportCsv({ backend: ctx, entity: 'LedgerEntry' });
 */

export interface ExportCsvOptions {
	/** Anything with `read(name, args)`: the extension's `ctx` (or a sandboxed bridge client). */
	backend: any;
	entity: string;
	pageSize?: number;
	order?: 'asc' | 'desc';
	filter?: (record: Record<string, any>) => boolean;
	columns?: string[];
	excludeColumns?: string[];
	filename?: string;
	onProgress?: (message: string) => void;
}

function csvEscape(val: any): string {
	if (val == null) return '';
	const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
	if (s.includes(',') || s.includes('"') || s.includes('\n')) {
		return '"' + s.replace(/"/g, '""') + '"';
	}
	return s;
}

export async function fetchAllRecords(
	backend: any,
	entity: string,
	pageSize: number,
	order: string,
	onProgress?: (message: string) => void,
): Promise<any[]> {
	const allRows: any[] = [];
	for (let from: number | null = 1, page = 1; from != null; page++) {
		onProgress?.(`Fetching page ${page}...`);
		const reply = await backend.read('realm_export', { entity, from, count: pageSize });
		if (!reply.ok) throw new Error(reply.error);
		allRows.push(...reply.rows);
		from = reply.next;
	}
	return order === 'desc' ? allRows.reverse() : allRows;
}

export function buildCsvBlob(
	records: Record<string, any>[],
	columns?: string[],
	excludeColumns?: string[],
): Blob {
	if (records.length === 0) {
		return new Blob([''], { type: 'text/csv;charset=utf-8;' });
	}

	const exclude = new Set(excludeColumns ?? []);
	const cols = columns ?? Object.keys(records[0]).filter(k => !k.startsWith('_') && !exclude.has(k));
	const header = cols.map(csvEscape).join(',');
	const rows = records.map(r => cols.map(c => csvEscape(r[c])).join(','));
	const content = header + '\n' + rows.join('\n');

	return new Blob([content], { type: 'text/csv;charset=utf-8;' });
}

export function triggerDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export async function exportCsv(opts: ExportCsvOptions): Promise<number> {
	const {
		backend,
		entity,
		pageSize = 50,
		order = 'desc',
		filter,
		columns,
		excludeColumns,
		filename,
		onProgress,
	} = opts;

	let records = await fetchAllRecords(backend, entity, pageSize, order, onProgress);

	if (filter) {
		records = records.filter(filter);
	}

	if (records.length === 0) {
		onProgress?.('No records to export.');
		return 0;
	}

	onProgress?.(`Building CSV (${records.length} records)...`);
	const blob = buildCsvBlob(records, columns, excludeColumns);
	const name = filename ?? `${entity}_${new Date().toISOString().slice(0, 10)}.csv`;
	triggerDownload(blob, name);
	onProgress?.(`Exported ${records.length} records.`);

	return records.length;
}
