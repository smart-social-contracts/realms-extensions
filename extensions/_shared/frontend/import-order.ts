/**
 * Client-side entity import ordering — mirrors core.entity_import (Python).
 * Uses field-level relation metadata from get_import_type_graph.
 */

export type ImportRecord = Record<string, unknown> & { _type?: string; _id?: string | number };

export type TypeDependencyGraph = Record<string, string[]>;

export type FieldDependencyGraph = Record<string, Record<string, string[]>>;

export type ImportDependencyGraph = {
	dependencies: TypeDependencyGraph;
	fields: FieldDependencyGraph;
};

const DEFAULT_BATCH_SIZE = 200;

function recordKey(record: ImportRecord): string | null {
	const type = record._type;
	const id = record._id;
	if (!type || id === undefined || id === null || id === '') return null;
	return `${type}\0${String(id)}`;
}

function refIds(value: unknown): string[] {
	if (value == null) return [];
	if (Array.isArray(value)) {
		return value.flatMap((v) => refIds(v));
	}
	if (typeof value === 'object') {
		const id = (value as ImportRecord)._id;
		return id === undefined || id === null ? [] : [String(id)];
	}
	return [String(value)];
}

function topologicalSortTypes(
	typesPresent: Set<string>,
	graph: TypeDependencyGraph
): string[] {
	const deps = new Map<string, Set<string>>();
	for (const t of typesPresent) {
		deps.set(
			t,
			new Set((graph[t] || []).filter((p) => typesPresent.has(p)))
		);
	}
	const reverse = new Map<string, Set<string>>();
	for (const [dependent, parents] of deps) {
		for (const parent of parents) {
			if (!reverse.has(parent)) reverse.set(parent, new Set());
			reverse.get(parent)!.add(dependent);
		}
	}
	const ready = [...typesPresent].filter((t) => deps.get(t)!.size === 0).sort();
	const order: string[] = [];
	while (ready.length) {
		const node = ready.shift()!;
		order.push(node);
		for (const child of [...(reverse.get(node) || [])].sort()) {
			const set = deps.get(child)!;
			set.delete(node);
			if (set.size === 0) ready.push(child);
		}
		ready.sort();
	}
	if (order.length < typesPresent.size) {
		for (const t of [...typesPresent].sort()) {
			if (!order.includes(t)) order.push(t);
		}
	}
	return order;
}

function recordDependencies(
	record: ImportRecord,
	batchKeys: Set<string>,
	fieldGraph: FieldDependencyGraph
): string[] {
	const entityType = String(record._type || '');
	const fieldMap = fieldGraph[entityType];
	if (!fieldMap) return [];

	const deps: string[] = [];
	for (const [fieldName, targetTypes] of Object.entries(fieldMap)) {
		if (!(fieldName in record)) continue;
		for (const refId of refIds(record[fieldName])) {
			for (const targetType of targetTypes) {
				const key = `${targetType}\0${refId}`;
				if (batchKeys.has(key)) deps.push(key);
			}
		}
	}
	return deps;
}

/** Sort records: referenced types/records before dependents. */
export function topologicalSortRecords(
	records: ImportRecord[],
	graph: ImportDependencyGraph
): { sorted: ImportRecord[]; warnings: string[] } {
	if (!records.length) return { sorted: [], warnings: [] };

	const keyed = records.map((record, origIndex) => ({
		origIndex,
		record,
		key: recordKey(record),
	})).filter((x) => x.key) as Array<{ origIndex: number; record: ImportRecord; key: string }>;

	const unkeyed = records.filter((r) => !recordKey(r));

	if (!keyed.length) {
		const warnings: string[] = [];
		if (unkeyed.length) {
			warnings.push(`${unkeyed.length} record(s) missing _type/_id — cannot import as entities`);
		}
		return { sorted: unkeyed, warnings };
	}

	const batchKeys = new Set(keyed.map((x) => x.key));
	const typesPresent = new Set(keyed.map((x) => x.key.split('\0')[0]));
	const typeOrder = topologicalSortTypes(typesPresent, graph.dependencies);
	const typeRank = new Map(typeOrder.map((t, i) => [t, i]));

	const keyToIdx = new Map<string, number>();
	keyed.forEach((x, idx) => keyToIdx.set(x.key, idx));

	const prereqs = keyed.map(() => new Set<number>());
	for (let idx = 0; idx < keyed.length; idx++) {
		const { record, key } = keyed[idx];
		for (const depKey of recordDependencies(record, batchKeys, graph.fields)) {
			const depIdx = keyToIdx.get(depKey);
			if (depIdx !== undefined && depIdx !== idx) prereqs[idx].add(depIdx);
		}
	}

	const remainingIn = prereqs.map((s) => s.size);
	const reverse = new Map<number, Set<number>>();
	prereqs.forEach((parents, idx) => {
		for (const p of parents) {
			if (!reverse.has(p)) reverse.set(p, new Set());
			reverse.get(p)!.add(idx);
		}
	});

	const sortKey = (idx: number) => {
		const { origIndex, key } = keyed[idx];
		const t = key.split('\0')[0];
		return [typeRank.get(t) ?? typeOrder.length, origIndex] as const;
	};

	const cmp = (a: number, b: number) => {
		const [ta, oa] = sortKey(a);
		const [tb, ob] = sortKey(b);
		return ta - tb || oa - ob;
	};

	const ready = keyed.map((_, idx) => idx).filter((idx) => remainingIn[idx] === 0).sort(cmp);
	const sortedIdx: number[] = [];
	const warnings: string[] = [];

	while (ready.length) {
		const idx = ready.shift()!;
		sortedIdx.push(idx);
		for (const child of [...(reverse.get(idx) || [])].sort(cmp)) {
			remainingIn[child] -= 1;
			if (remainingIn[child] === 0) ready.push(child);
		}
		ready.sort(cmp);
	}

	if (sortedIdx.length < keyed.length) {
		const rest = keyed
			.map((_, idx) => idx)
			.filter((idx) => !sortedIdx.includes(idx))
			.sort(cmp);
		warnings.push(`Record dependency cycle; ${rest.length} record(s) appended in stable order`);
		sortedIdx.push(...rest);
	}

	if (unkeyed.length) {
		warnings.push(`${unkeyed.length} record(s) missing _type/_id — appended last`);
	}

	return {
		sorted: [...sortedIdx.map((i) => keyed[i].record), ...unkeyed],
		warnings,
	};
}

export function chunkRecords(records: ImportRecord[], batchSize = DEFAULT_BATCH_SIZE): ImportRecord[][] {
	const batches: ImportRecord[][] = [];
	for (let i = 0; i < records.length; i += batchSize) {
		batches.push(records.slice(i, i + batchSize));
	}
	return batches;
}

export function planImportBatches(
	records: ImportRecord[],
	graph: ImportDependencyGraph,
	batchSize = DEFAULT_BATCH_SIZE
) {
	const { sorted, warnings } = topologicalSortRecords(records, graph);
	const batches = chunkRecords(sorted, batchSize);
	return { sorted, batches, warnings, batchSize, batchCount: batches.length };
}

export { DEFAULT_BATCH_SIZE as IMPORT_BATCH_SIZE };
