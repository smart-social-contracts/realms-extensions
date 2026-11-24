import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	chapterEntries,
	chapterFile,
	chapterLanguage,
	emptyState,
	packageEntries,
	sourceEntries,
	type HistoryRow,
	type SourceEntry,
} from './source.ts';
import { type LayeredCodex } from './legislation.ts';

/** A layered codex as `codex_status` gives it: chapters across three layers, and one layer's calendar. */
const layered: LayeredCodex = {
	id: 'sha256:bc54c13dba2e4fcebce19b',
	status: 'active',
	layers: ['eu/es', 'eu/es/vc', 'eu/es/vc/46250-valencia'],
	chapters: {
		'eu/es/vc/tax': { source: 'eu/es/vc', version: '1.1.0', sha256: 'sha256:cc', vouched_by: 'eu/es', route: 'https' },
		'eu/es/procedure': { source: 'eu/es', version: '2.6.0', sha256: 'sha256:bb', vouched_by: 'eu/es', route: 'capital' },
		'eu/es/calendar': { source: 'eu/es', version: '2.6.0', sha256: 'sha256:ca', vouched_by: 'eu/es', route: 'capital' },
		'eu/es/vc/46250-valencia/tax': { source: 'eu/es/vc/46250-valencia', version: '', sha256: 'sha256:dd', vouched_by: '', route: 'https' },
	},
	previous: 'sha256:edbcc6c22312cedf8a2f58',
	installed_at: 1_800_000_000,
	activates_at: null,
	proposal: 'P-12',
};

/** The install history of a realm that runs legacy codex packages. */
const history: HistoryRow[] = [
	{ id: 'agora@1.2.0', version: '1.2.0', status: 'active', installed_at: 300 },
	{ id: 'agora@1.1.0', version: '1.1.0', status: 'inactive', installed_at: 200 },
	{ id: 'dominion@0.9.0', version: '0.9.0', status: 'inactive', installed_at: 100 },
];

describe('a chapter as a file', () => {
	it('names a chapter after its id, with the suffix of what it holds', () => {
		assert.equal(chapterFile('eu/es/procedure'), 'eu/es/procedure.py');
		assert.equal(chapterFile('eu/es/calendar'), 'eu/es/calendar.json');
	});

	it('reads a calendar as JSON and every other chapter as Python', () => {
		assert.equal(chapterLanguage('eu/es/procedure'), 'python');
		assert.equal(chapterLanguage('eu/es/calendar'), 'json');
		// A domain whose name merely ends in the word is still a chapter.
		assert.equal(chapterLanguage('eu/es/school_calendar'), 'python');
	});
});

describe('the files of a layered codex', () => {
	it('lists every chapter, by the order the layers run in and by id within a layer', () => {
		assert.deepEqual(
			chapterEntries(layered).map((entry) => entry.name),
			[
				'eu/es/calendar.json',
				'eu/es/procedure.py',
				'eu/es/vc/tax.py',
				'eu/es/vc/46250-valencia/tax.py',
			],
		);
	});

	it('gives each file the checksum that reads it, so legislation_chapter can be called', () => {
		const procedure = chapterEntries(layered).find((entry) => entry.name === 'eu/es/procedure.py');
		assert.equal(procedure?.kind, 'chapter');
		assert.equal(procedure?.checksum, 'sha256:bb');
		assert.equal(procedure?.version, '2.6.0');
		assert.equal(procedure?.language, 'python');
	});

	it("leaves an own layer's missing version out rather than showing an empty one", () => {
		const own = chapterEntries(layered).find((entry) => entry.name.includes('46250-valencia'));
		assert.equal(own?.version, undefined);
	});

	it('keeps a chapter whose layer the codex does not list, at the end', () => {
		const orphan: LayeredCodex = {
			...layered,
			layers: ['eu/es'],
			chapters: {
				'eu/es/procedure': layered.chapters['eu/es/procedure'],
				'eu/es/vc/tax': layered.chapters['eu/es/vc/tax'],
			},
		};
		assert.deepEqual(
			chapterEntries(orphan).map((entry) => entry.name),
			['eu/es/procedure.py', 'eu/es/vc/tax.py'],
		);
	});
});

describe('the files of a legacy codex', () => {
	it('keeps the package and version that address the file registry', () => {
		const [first] = packageEntries(history);
		assert.equal(first.kind, 'package');
		assert.equal(first.name, 'agora');
		assert.equal(first.package, 'agora');
		assert.equal(first.version, '1.2.0');
	});

	it('puts the active codex first, then the most recently installed, each id once', () => {
		assert.deepEqual(
			packageEntries([...history, ...history]).map((entry) => entry.id),
			['agora@1.2.0', 'agora@1.1.0', 'dominion@0.9.0'],
		);
	});
});

describe('which layout a realm gets', () => {
	// The control for the fix: 1.4.0 lists the chapters of a layered codex. 1.3.0 had only the legacy path, which
	// resolved a layered codex id ("sha256:…", no "@") to package "sha256:…" with no version and so could read
	// nothing at all — this assertion fails on it.
	it('lists the chapters when the active codex is layered, never the history', () => {
		const entries = sourceEntries(layered, history);
		assert.equal(entries.length, 4);
		assert.ok(entries.every((entry) => entry.kind === 'chapter'));
		assert.ok(entries.every((entry) => !!entry.checksum));
		assert.ok(!entries.some((entry) => entry.id.includes('@')));
	});

	it('lists the history when the realm runs legacy packages', () => {
		const entries = sourceEntries(null, history);
		assert.equal(entries.length, 3);
		assert.ok(entries.every((entry) => entry.kind === 'package'));
	});

	it('lists nothing for a realm with no codex at all', () => {
		assert.deepEqual(sourceEntries(null, []), []);
	});
});

describe('why the editor is empty', () => {
	const chapter: SourceEntry = {
		id: 'eu/es/procedure',
		name: 'eu/es/procedure.py',
		kind: 'chapter',
		language: 'python',
		checksum: 'sha256:bb',
	};
	const pkg: SourceEntry = { id: 'agora@1.2.0', name: 'agora', kind: 'package', language: 'python', package: 'agora' };

	it('names the file when the realm holds no text for a chapter', () => {
		assert.equal(emptyState(chapter, false), 'The realm has no text stored for eu/es/procedure.py.');
	});

	it('says a package is missing from the registry when there is one', () => {
		assert.equal(emptyState(pkg, true), 'No code available for agora in the file registry.');
	});

	it('says the realm has no file registry when it has none', () => {
		assert.match(emptyState(pkg, false), /no file registry configured/);
	});

	it('asks for a choice when nothing is selected', () => {
		assert.equal(emptyState(null, true), 'Select a file to read it.');
	});
});
