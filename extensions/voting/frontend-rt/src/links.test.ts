import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_LINKS, addLink, displayId, parseProposalRef, removeLink, replaceable, type Link } from './links.ts';

const ME = 'aaaaa-aa';
const OTHER = 'bbbbb-bb';

describe('replaceable', () => {
	const rows = [
		{ id: 'P-1', proposer: ME, status: 'withdrawn' },
		{ id: 'P-2', proposer: OTHER, status: 'withdrawn' },
		{ id: 'P-3', proposer: ME, status: 'voting' },
		{ id: 'P-4', proposer: ME, status: 'withdrawn', replaced_by: 'P-9' },
		{ id: 'P-5', proposer: ME, status: 'withdrawn', replaced_by: '' },
		{ id: 'P-6', proposer: ME, status: 'rejected' },
	];

	it('lists only my own withdrawn proposals that nothing replaces yet', () => {
		assert.deepEqual(
			replaceable(rows, ME, []).map((p) => p.id),
			['P-1', 'P-5'],
		);
	});

	it('leaves out the ones already linked', () => {
		const links: Link[] = [{ kind: 'relates_to', proposal: 'P-1' }];
		assert.deepEqual(
			replaceable(rows, ME, links).map((p) => p.id),
			['P-5'],
		);
	});

	it('is empty for someone who filed none', () => {
		assert.deepEqual(replaceable(rows, 'ccccc-cc', []), []);
	});
});

describe('addLink', () => {
	it('adds a link of either kind', () => {
		const first = addLink([], { kind: 'replaces', proposal: 'P-1' });
		assert.deepEqual(first, { ok: true, links: [{ kind: 'replaces', proposal: 'P-1' }] });
		assert.deepEqual(addLink((first as { links: Link[] }).links, { kind: 'relates_to', proposal: 'P-2' }), {
			ok: true,
			links: [
				{ kind: 'replaces', proposal: 'P-1' },
				{ kind: 'relates_to', proposal: 'P-2' },
			],
		});
	});

	it('names a proposal once, whatever the kind', () => {
		const links: Link[] = [{ kind: 'relates_to', proposal: 'P-1' }];
		assert.deepEqual(addLink(links, { kind: 'relates_to', proposal: 'P-1' }), { ok: false, reason: 'duplicate' });
		assert.deepEqual(addLink(links, { kind: 'replaces', proposal: 'P-1' }), { ok: false, reason: 'duplicate' });
	});

	it('allows 16 links and refuses the 17th', () => {
		let links: Link[] = [];
		for (let n = 1; n <= MAX_LINKS; n++) {
			const added = addLink(links, { kind: 'relates_to', proposal: `P-${n}` });
			assert.equal(added.ok, true, `link ${n}`);
			links = (added as { links: Link[] }).links;
		}
		assert.equal(links.length, 16);
		assert.deepEqual(addLink(links, { kind: 'relates_to', proposal: 'P-17' }), { ok: false, reason: 'full' });
		assert.equal(addLink(removeLink(links, 'P-3'), { kind: 'relates_to', proposal: 'P-17' }).ok, true);
	});

	it('does not change the list it is given', () => {
		const links: Link[] = [{ kind: 'relates_to', proposal: 'P-1' }];
		addLink(links, { kind: 'relates_to', proposal: 'P-2' });
		assert.equal(links.length, 1);
	});
});

describe('parseProposalRef', () => {
	it('reads a number, #number or P-number', () => {
		for (const text of ['7', '#7', 'p-7', 'P-7', ' P-7 ', '007']) assert.equal(parseProposalRef(text), 'P-7', text);
	});

	it('refuses anything else', () => {
		for (const text of ['', 'P-', 'seven', '7a', 'P-7-1', '-7', '1.5']) assert.equal(parseProposalRef(text), null, text);
	});
});

describe('displayId', () => {
	it('shows P-7 as #7 and leaves other ids alone', () => {
		assert.equal(displayId('P-7'), '#7');
		assert.equal(displayId('draft-1'), 'draft-1');
	});
});
