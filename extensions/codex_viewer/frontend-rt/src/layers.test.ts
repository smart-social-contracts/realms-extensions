import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	ancestry,
	domainOf,
	heldChapters,
	inheritsAnything,
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

	it('only the outermost layer inherits nothing', () => {
		assert.equal(inheritsAnything('eu'), false);
		assert.equal(inheritsAnything('eu/es'), true);
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

	it('has no stack for a realm that runs no layered codex', () => {
		assert.deepEqual(stackOf(null), []);
		assert.deepEqual(stackOf({ id: 'agora@1.0.0' }), []);
	});
});

describe('the tree of a layer', () => {
	const held = heldChapters(VALENCIA) as DomainChapter[];
	const all = [...held, EU_PUBLISHED];

	it('inherited: every domain down to the layer, each shown by the chapter that governs', () => {
		const tree = treeFor(all, 'eu/es/vc/46250-valencia', true);
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
		const tax = treeFor(all, 'eu/es/vc/46250-valencia', true).find((row) => row.domain === 'tax');
		assert.equal(tax?.runs.layer, 'eu/es/vc/46250-valencia');
		assert.deepEqual(tax?.builds_on.map((entry) => entry.layer), ['eu/es/vc', 'eu/es']);
	});

	it('inherited: a domain only one layer defines has nothing under it', () => {
		const procedure = treeFor(all, 'eu/es/vc/46250-valencia', true).find((r) => r.domain === 'procedure');
		assert.deepEqual(procedure?.builds_on, []);
	});

	it('this layer alone: only what the layer itself publishes', () => {
		const tree = treeFor(all, 'eu/es/vc/46250-valencia', false);
		assert.deepEqual(tree.map((row) => [row.domain, row.runs.layer, row.builds_on.length]), [
			['tax', 'eu/es/vc/46250-valencia', 0],
		]);
	});

	it('a layer higher up shows what it governs at that depth, not what is below it', () => {
		const tree = treeFor(all, 'eu/es', true);
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

	it('the outermost layer shows what it publishes, inherited or not: it inherits nothing', () => {
		for (const inherited of [true, false]) {
			const tree = treeFor(all, 'eu', inherited);
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
