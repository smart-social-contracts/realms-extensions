/**
 * What the codex page reads of a layered codex (docs/codices/layered-codex.md §9, §11), as the realm's `codex_status`
 * and `codex_views` give it, and the plain rules the page applies to it. No DOM: `legislation.test.ts` runs on node.
 */

export type Flag = 'compliant' | 'unknown' | { NonCompliant: { since: number; stale: string[] } };

export interface Release {
	source: string;
	version: string;
	effective_from: number;
	/** An older release than the one the realm runs: the source went back to it (§11.6). */
	step_back?: boolean;
}

/**
 * What a flag does not say about a layer the realm runs and a source's record does not list (§11.6): `unlisted`, a version
 * the source does not list whose place against what it lists cannot be told (releases are ordered by when they were
 * published, never by effective date); `went_back`, the source vouched for what the realm runs and now lists only releases
 * published earlier. `lists` is the newest release the record has of the layer.
 */
export interface Note {
	source: string;
	kind: 'unlisted' | 'went_back';
	runs: string;
	lists: string;
}

export interface SyncSource {
	/** The sync source's key: its capital, or the address of its stand-in record. */
	source: string;
	name: string;
	/** The source id of the record's own layer, which a codex's `vouched_by` names; absent from an older realm. */
	layer?: string;
	compliance: Flag;
	checked_at: number;
	error: string;
	installable: Release[];
	/** Absent from a realm that does not say them (before §11.6 compared by effective date). */
	notes?: Note[];
}

export interface Chapter {
	source: string;
	version: string;
	sha256: string;
	vouched_by: string;
	route: string;
	/** When the publisher published the release this layer came from, when the realm kept it. */
	published?: number;
}

export interface LayeredCodex {
	id: string;
	status: string;
	layers: string[];
	chapters: Record<string, Chapter>;
	previous: string;
	installed_at: number | null;
	activates_at: number | null;
	proposal: string;
}

export interface InstallJob {
	id: string;
	proposal: string;
	step: string;
	status: 'running' | 'paused' | 'failed' | 'done';
	error: string;
	started_at: number;
	finished_at: number | null;
}

export interface Failure {
	count: number;
	error: string;
	at: number;
}

/** A chapter file's failing methods: `{file: {method: failure}}`. */
export type Failures = Record<string, Record<string, Failure>>;

export interface CodexStatus {
	codex: (LayeredCodex & Record<string, unknown>) | null;
	healthy: boolean;
	failures: Failures;
	pending: LayeredCodex | null;
	job: InstallJob | null;
	it_team: string;
	sync_sources: SyncSource[];
	check: { interval: number; due: number };
}

/** One public member of a domain's resolved chapter, as the flattened view lists it (§5.9). */
export interface ViewRow {
	name: string;
	kind: string;
	mark: string | null;
	layers: { source: string; legislation: string | null; value?: unknown }[];
	value?: unknown;
}

export interface DomainView {
	domain: string;
	path: string[];
	members: ViewRow[];
}

/** The permissions that let a member act; the controllers and admins hold `all` (core.auth.permissions). */
export function can(permissions: string[], permission: string): boolean {
	return permissions.includes('all') || permissions.includes(permission);
}

/** Whether the realm runs a layered codex: a legacy one has no layers. */
export function isLayered(codex: unknown): codex is LayeredCodex {
	return !!codex && Array.isArray((codex as LayeredCodex).layers);
}

/** `sha256:3f1c9a7b…`: enough of a checksum to tell codices apart; a legacy codex's `name@version` stays whole. */
export function shortId(id: string): string {
	const prefix = 'sha256:';
	return /^sha256:[0-9a-f]{9,}$/.test(id) ? `${id.slice(0, prefix.length + 8)}…` : id;
}

/** What a compliance flag says: its state, since when and which layers are behind. */
export function complianceOf(flag: Flag): { state: 'compliant' | 'non_compliant' | 'unknown'; since: number | null; stale: string[] } {
	if (flag === 'compliant' || flag === 'unknown') return { state: flag, since: null, stale: [] };
	const behind = flag?.NonCompliant;
	if (!behind) return { state: 'unknown', since: null, stale: [] };
	return { state: 'non_compliant', since: behind.since, stale: behind.stale };
}

/** A layer of the running codex: its version, the domains it has a chapter in, and who vouched for them. */
export interface LayerRow {
	source: string;
	/** The realm's own layer, the last: nobody vouches for it. */
	own: boolean;
	version: string;
	domains: string[];
	vouchedBy: string[];
}

/**
 * How to show who vouched for a layer: the name of the sync source whose record it is (`vouched_by` names the record's own
 * layer, or the source's key in a realm that wrote the key), else the id as it stands.
 */
export function sourceName(id: string, sources: SyncSource[] = []): string {
	const found = sources.find((source) => (source.layer && source.layer === id) || source.source === id);
	return found?.name || id;
}

/** The chapters of `codex` grouped by layer, in the order of its layers. A chapter id is `<source>/<domain>`. */
export function layerRows(codex: LayeredCodex, sources: SyncSource[] = []): LayerRow[] {
	return codex.layers.map((source, at) => {
		const own = Object.entries(codex.chapters).filter(([, chapter]) => chapter.source === source);
		const versions = [...new Set(own.map(([, chapter]) => chapter.version))];
		return {
			source,
			own: at === codex.layers.length - 1,
			version: versions.join(', '),
			domains: own.map(([id]) => id.slice(source.length + 1)).sort(),
			vouchedBy: [...new Set(own.map(([, chapter]) => chapter.vouched_by).filter(Boolean).map((id) => sourceName(id, sources)))],
		};
	});
}

/** A failing method of a chapter file. */
export interface FailureRow extends Failure {
	file: string;
	method: string;
}

/** The failures of the running codex, the most recent first. */
export function failureRows(failures: Failures): FailureRow[] {
	return Object.entries(failures)
		.flatMap(([file, methods]) => Object.entries(methods).map(([method, failure]) => ({ file, method, ...failure })))
		.sort((a, b) => b.at - a.at || a.file.localeCompare(b.file) || a.method.localeCompare(b.method));
}

/**
 * Where a view row comes from: the layer whose definition applies and the layers above it that it overrides, with the
 * legislation cited. Every layer of an `extension` runs, so the row names them all and gathers all their citations.
 */
export function rowOrigin(row: ViewRow): { applies: string; overrides: string[]; legislation: string | null } {
	const layers = row.layers;
	if (row.mark === 'extension') {
		const cited = [...new Set(layers.map((layer) => layer.legislation).filter((text): text is string => !!text))];
		return { applies: layers.map((layer) => layer.source).join(' + '), overrides: [], legislation: cited.join('; ') || null };
	}
	const winner = layers[layers.length - 1];
	return {
		applies: winner?.source ?? '',
		overrides: layers.slice(0, -1).map((layer) => layer.source),
		legislation: winner?.legislation ?? null,
	};
}

/** A setting's value as one line: numbers and words as they are, lists and records as JSON. */
export function valueText(value: unknown): string {
	if (value === null || value === undefined) return '—';
	return typeof value === 'string' ? value : JSON.stringify(value);
}

/** The most hours and the fewest that the realm allows between two checks (api.sync_checks). */
export const LEAST_INTERVAL = 1;
export const MOST_INTERVAL = 7 * 24;

/** The interval typed into the form, in whole hours, or null when the realm would refuse it. */
export function parseInterval(text: string): number | null {
	if (!/^\d+$/.test(text.trim())) return null;
	const hours = Number(text.trim());
	return hours >= LEAST_INTERVAL && hours <= MOST_INTERVAL ? hours : null;
}

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

/**
 * The title and description of the proposal "Propose install" files for `release` (§11.4), in the filer's language. A step
 * back says so, and names the release the realm runs (`runs`): a vote on it must not read as catching up.
 */
export function installProposal(t: Translate, release: Release, runs = ''): { title: string; description: string } {
	const vars = { source: release.source, version: release.version, runs };
	return release.step_back
		? { title: t('step_back_title', vars), description: t('step_back_description', vars) }
		: { title: t('install_title', vars), description: t('install_description', vars) };
}

/** The note of a source about layer `source` of `kind`, if it has one. */
export function noteOf(notes: Note[] | undefined, source: string, kind?: Note['kind']): Note | undefined {
	return (notes ?? []).find((note) => note.source === source && (kind === undefined || note.kind === kind));
}
