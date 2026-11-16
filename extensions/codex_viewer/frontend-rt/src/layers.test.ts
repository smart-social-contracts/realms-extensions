import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	ancestry,
	domainOf,
	heldChapters,
	inheritsAnything,
	ownLayer,
	stackOf,
	treeFor,
	type DomainChapter,
} from './layers.ts';
import { type LayeredCodex } from './legislation.ts';

const chapter = (source: string, version: string, sha256: string) => ({
	source,
	version,
	sha256,
	vouched_by: 'x',
	route: 'capital',
});

/** A València realm: three layers run, `eu` above them is published but not installed here. */
const VALENCIA: LayeredCodex = {
	id: 'sha256:aa',
	status: 'active',
	layers: ['eu/es', 'eu/es/vc', 'eu/es/vc/46250-valencia'],
	chapters: {
		'eu/es/tax': chapter('eu/es', '2.6.0', 'sha256:es-tax'),
		'eu/es/procedure': chapter('eu/es', '2.6.0', 'sha256:es-proc'),
		'eu/es/data_protection': chapter('eu/es', '2.6.0', 'sha256:es-dp'),
		'eu/es/vc/tax': chapter('eu/es/vc', '1.1.0', 'sha256:vc-tax'),
		'eu/es/vc/46250-valencia/tax': chapter('eu/es/vc/46250-valencia', '', 'sha256:own-tax'),
	},
	previous: '',
	installed_at: 1_800_000_000,
	activates_at: null,
	proposal: '',
};

/**
 * A València realm that also syncs from EMSHI, the water consortium: `eu/es/vc/emshi` is a *sibling* of the realm's
 * own layer, not an ancestor of it. layered-codex.md §3.3: a source id does not place a layer in the path, and
 * `paths.py` puts the realm's own layer last.
 */
const VALENCIA_EMSHI: LayeredCodex = {
	...VALENCIA,
	layers: ['eu/es', 'eu/es/vc', 'eu/es/vc/emshi', 'eu/es/vc/46250-valencia'],
	chapters: {
		...VALENCIA.chapters,
		'eu/es/vc/emshi/water': chapter('eu/es/vc/emshi', '1.0.0', 'sha256:emshi-water'),
		'eu/es/vc/46250-valencia/realm': chapter('eu/es/vc/46250-valencia', '', 'sha256:own-realm'),
	},
};

/** What `eu` publishes, which this realm does not run: one chapter. */
const EU_PUBLISHED: DomainChapter = {
	id: 'eu/data_protection',
	name: 'eu/data_protection.py',
	kind: 'chapter',
	language: 'python',
	layer: 'eu',
	domain: 'data_protection',
	held: 'published',
	version: '1.0.1',
};

describe('where a layer sits', () => {
	it('reads the stack out of the layer id, outermost first', () => {
		assert.deepEqual(ancestry('eu/es/vc'), ['eu', 'eu/es', 'eu/es/vc']);
		assert.deepEqual(ancestry('eu'), ['eu']);
		assert.deepEqual(ancestry(''), []);
	});

	it('takes the domain off a chapter id, under the layer that publishes it', () => {
		assert.equal(domainOf('eu/es/tax', 'eu/es'), 'tax');
		assert.equal(domainOf('eu/es/vc/46250-valencia/tax', 'eu/es/vc/46250-valencia'), 'tax');
		// A layer that does not prefix the chapter leaves it whole rather than cutting it wrongly.
		assert.equal(domainOf('eu/es/tax', 'eu/fr'), 'eu/es/tax');
	});

	it('a layer inherits whenever something sits above it in the stack, whatever its id looks like', () => {
		// A realm whose own layer id has one segment and syncs from `eu/es`. By the ids alone `mm1` looks outermost
		// and would inherit nothing, which would disable the checkbox over a tree that does inherit Spain's chapters.
		const flat = stackOf({ ...VALENCIA, layers: ['eu/es', 'mm1'] } as LayeredCodex);
		assert.deepEqual(flat.map((layer) => [layer.id, layer.depth]), [
			['eu', 0],
			['eu/es', 1],
			['mm1', 0],
		]);
		assert.equal(inheritsAnything('mm1', flat), true);
		assert.equal(ancestry('mm1').length > 1, false, 'the id alone would say it inherits nothing');
	});

	it('keeps a running layer where `layers` puts it, even when another id is its prefix', () => {
		// `_chain` takes the path in record order (paths.py), and §3.3 says an id does not place a layer. Reading
		// the order out of the ids would make vc deeper than es here, and say vc's chapter governs.
		const odd = stackOf({ ...VALENCIA, layers: ['eu/es/vc', 'eu/es', 'eu/es/vc/46250-valencia'] } as LayeredCodex);
		assert.deepEqual(odd.map((layer) => layer.id), [
			'eu',
			'eu/es/vc',
			'eu/es',
			'eu/es/vc/46250-valencia',
		]);
		const held = heldChapters({ ...VALENCIA, layers: odd.map((l) => l.id) } as LayeredCodex) as DomainChapter[];
		const tax = treeFor(held, 'eu/es/vc/46250-valencia', true, odd).find((row) => row.domain === 'tax');
		assert.equal(tax?.runs.layer, 'eu/es/vc/46250-valencia');
		assert.deepEqual(tax?.builds_on.map((e) => e.layer), ['eu/es', 'eu/es/vc']);
	});

	it('only the layer at the top of the stack inherits nothing', () => {
		const stack = stackOf(VALENCIA);
		assert.equal(inheritsAnything('eu', stack), false);
		assert.equal(inheritsAnything('eu/es', stack), true);
		// A sibling sync source is not at the top, however few segments its id has.
		const siblings = stackOf(VALENCIA_EMSHI);
		assert.equal(inheritsAnything('eu/es/vc/emshi', siblings), true);
	});
});

describe('the stack of a realm', () => {
	it('shows every layer down to the deepest, and says which the realm runs', () => {
		assert.deepEqual(
			stackOf(VALENCIA).map((layer) => [layer.name, layer.installed]),
			[
				['eu', false],
				['es', true],
				['vc', true],
				['46250-valencia', true],
			],
		);
	});

	it('names each layer by its own segment, and the outermost by its whole id', () => {
		assert.deepEqual(stackOf(VALENCIA).map((layer) => layer.id), [
			'eu',
			'eu/es',
			'eu/es/vc',
			'eu/es/vc/46250-valencia',
		]);
	});

	it('carries the version the realm runs, and leaves the own layer without one', () => {
		const stack = stackOf(VALENCIA);
		assert.equal(stack.find((l) => l.id === 'eu/es')?.version, '2.6.0');
		assert.equal(stack.find((l) => l.id === 'eu/es/vc/46250-valencia')?.version, undefined);
	});

	it("takes the realm's own layer from the end of `layers`, not from how deep an id looks", () => {
		assert.equal(ownLayer(VALENCIA_EMSHI), 'eu/es/vc/46250-valencia');
		assert.equal(ownLayer(VALENCIA), 'eu/es/vc/46250-valencia');
		assert.equal(ownLayer(null), '');
	});

	it('keeps a sibling sync source and the own layer both, in the order the realm runs them', () => {
		// EMSHI and the realm's own layer have the same number of segments. Sorting by that drops one of them, and
		// with it the realm's own legislation: the order has to be the codex's.
		assert.deepEqual(stackOf(VALENCIA_EMSHI).map((layer) => [layer.id, layer.installed, layer.depth]), [
			['eu', false, 0],
			['eu/es', true, 1],
			['eu/es/vc', true, 2],
			['eu/es/vc/emshi', true, 3],
			['eu/es/vc/46250-valencia', true, 3],
		]);
	});

	it('has no stack for a realm that runs no layered codex', () => {
		assert.deepEqual(stackOf(null), []);
		assert.deepEqual(stackOf({ id: 'agora@1.0.0' }), []);
	});
});

describe('the tree of a layer', () => {
	const held = heldChapters(VALENCIA) as DomainChapter[];
	const all = [...held, EU_PUBLISHED];
	const stack = stackOf(VALENCIA);

	it('inherited: every domain down to the layer, each shown by the chapter that governs', () => {
		const tree = treeFor(all, 'eu/es/vc/46250-valencia', true, stack);
		assert.deepEqual(
			tree.map((row) => [row.domain, row.runs.layer]),
			[
				['data_protection', 'eu/es'],
				['procedure', 'eu/es'],
				['tax', 'eu/es/vc/46250-valencia'],
			],
		);
	});

	it('inherited: a domain several layers define keeps the others under it, deepest first', () => {
		const tax = treeFor(all, 'eu/es/vc/46250-valencia', true, stack).find((row) => row.domain === 'tax');
		assert.equal(tax?.runs.layer, 'eu/es/vc/46250-valencia');
		assert.deepEqual(tax?.builds_on.map((entry) => entry.layer), ['eu/es/vc', 'eu/es']);
	});

	it('inherited: a domain only one layer defines has nothing under it', () => {
		const procedure = treeFor(all, 'eu/es/vc/46250-valencia', true, stack).find((r) => r.domain === 'procedure');
		assert.deepEqual(procedure?.builds_on, []);
	});

	it('this layer alone: only what the layer itself publishes', () => {
		const tree = treeFor(all, 'eu/es/vc/46250-valencia', false, stack);
		assert.deepEqual(tree.map((row) => [row.domain, row.runs.layer, row.builds_on.length]), [
			['tax', 'eu/es/vc/46250-valencia', 0],
		]);
	});

	it('a layer higher up shows what it governs at that depth, not what is below it', () => {
		const tree = treeFor(all, 'eu/es', true, stack);
		assert.deepEqual(
			tree.map((row) => [row.domain, row.runs.layer]),
			[
				['data_protection', 'eu/es'],
				['procedure', 'eu/es'],
				['tax', 'eu/es'],
			],
		);
		// Spain's data_protection builds on the EU chapter, which this realm does not run.
		const dp = tree.find((row) => row.domain === 'data_protection');
		assert.deepEqual(dp?.builds_on.map((entry) => [entry.layer, entry.held]), [['eu', 'published']]);
	});

	it("a sibling source's chapters are inherited at the own layer, and the own chapters are there", () => {
		const siblings = stackOf(VALENCIA_EMSHI);
		const everything = [...(heldChapters(VALENCIA_EMSHI) as DomainChapter[]), EU_PUBLISHED];
		const tree = treeFor(everything, 'eu/es/vc/46250-valencia', true, siblings);
		// Domains in name order, each shown by the layer furthest down the path that defines it.
		assert.deepEqual(tree.map((row) => [row.domain, row.runs.layer]), [
			['data_protection', 'eu/es'],
			['procedure', 'eu/es'],
			['realm', 'eu/es/vc/46250-valencia'],
			['tax', 'eu/es/vc/46250-valencia'],
			// EMSHI's water is above the realm's own layer in the path, so the own layer inherits it.
			['water', 'eu/es/vc/emshi'],
		]);
	});

	it("a sibling source's own view shows its chapters, and not the layers under it", () => {
		const siblings = stackOf(VALENCIA_EMSHI);
		const everything = [...(heldChapters(VALENCIA_EMSHI) as DomainChapter[]), EU_PUBLISHED];
		const alone = treeFor(everything, 'eu/es/vc/emshi', false, siblings);
		assert.deepEqual(alone.map((row) => row.domain), ['water']);
		// Inherited, EMSHI sees what is above it in the path but nothing of the realm's own layer below.
		const inheritedTree = treeFor(everything, 'eu/es/vc/emshi', true, siblings);
		assert.deepEqual(inheritedTree.map((row) => [row.domain, row.runs.layer]), [
			['data_protection', 'eu/es'],
			['procedure', 'eu/es'],
			['tax', 'eu/es/vc'],
			['water', 'eu/es/vc/emshi'],
		]);
	});

	it('the outermost layer shows what it publishes, inherited or not: it inherits nothing', () => {
		for (const inherited of [true, false]) {
			const tree = treeFor(all, 'eu', inherited, stack);
			assert.deepEqual(tree.map((row) => [row.domain, row.runs.held]), [['data_protection', 'published']]);
			assert.deepEqual(tree[0].builds_on, []);
		}
	});
});

describe('the chapters the realm holds', () => {
	it('names each after its file and keeps the checksum that reads it', () => {
		const tax = heldChapters(VALENCIA).find((entry) => entry.id === 'eu/es/tax');
		assert.equal(tax?.name, 'eu/es/tax.py');
		assert.equal(tax?.domain, 'tax');
		assert.equal(tax?.layer, 'eu/es');
		assert.equal(tax?.held, 'realm');
		assert.equal(tax?.checksum, 'sha256:es-tax');
	});

	it('holds nothing for a realm with no layered codex', () => {
		assert.deepEqual(heldChapters(null), []);
	});
});
