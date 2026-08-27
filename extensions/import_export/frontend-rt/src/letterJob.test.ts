import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	LETTER_BATCH,
	emptyJob,
	etaSeconds,
	fingerprintJson,
	nextMintBatch,
	parseCitizenRows,
	postalAddress,
	safeLetterFilename,
} from './letterJob.ts';

describe('postalAddress', () => {
	it('reads address, postal_address, or extra', () => {
		assert.equal(postalAddress({ address: '  1 Main St  ' }), '1 Main St');
		assert.equal(postalAddress({ postal_address: '2 Side Rd' }), '2 Side Rd');
		assert.equal(
			postalAddress({ extra: { address: { line1: '3 Ave', city: 'Town' } } }),
			'3 Ave\nTown',
		);
		assert.equal(postalAddress({ name: 'Ada' }), '');
	});
});

describe('parseCitizenRows', () => {
	it('requires id and postal address', () => {
		const { rows, errors } = parseCitizenRows([
			{ id: 'C-1', name: 'Ada', address: '1 Street' },
			{ name: 'No id', address: '2 Street' },
			{ id: 'C-3', name: 'No address' },
		]);
		assert.equal(rows.length, 1);
		assert.equal(rows[0]?.id, 'C-1');
		assert.equal(errors.length, 2);
	});
});

describe('nextMintBatch / resume cursor', () => {
	const rows = ['A', 'B', 'C', 'D', 'E'].map((id) => ({
		id,
		name: id,
		address: `${id} Road`,
		raw: { id, address: `${id} Road` },
	}));

	it('chunks and skips already-minted ids so resume does not remint', () => {
		const minted = new Set(['A', 'B']);
		const first = nextMintBatch(rows, minted, 0, 2);
		assert.deepEqual(first.map((r) => r.id), ['C', 'D']);
		for (const row of first) minted.add(row.id);
		const second = nextMintBatch(rows, minted, 0, 2);
		assert.deepEqual(second.map((r) => r.id), ['E']);
		assert.ok(!second.some((r) => r.id === 'A' || r.id === 'B'));
	});

	it('respects LETTER_BATCH', () => {
		const many = Array.from({ length: LETTER_BATCH + 3 }, (_, i) => ({
			id: `C-${i}`,
			name: `N${i}`,
			address: `${i} St`,
			raw: { id: `C-${i}` },
		}));
		assert.equal(nextMintBatch(many, [], 0).length, LETTER_BATCH);
	});
});

describe('job helpers', () => {
	it('fingerprints JSON stably and names files per letter', () => {
		assert.equal(fingerprintJson('[1]'), fingerprintJson('[1]'));
		assert.notEqual(fingerprintJson('[1]'), fingerprintJson('[2]'));
		assert.equal(safeLetterFilename({ id: 'C-1', name: 'Ada Lovelace' }), 'letter-C-1-Ada_Lovelace.pdf');
	});

	it('tracks a pause cursor on the job', () => {
		const parsed = parseCitizenRows([
			{ id: 'C-1', address: '1 St' },
			{ id: 'C-2', address: '2 St' },
		]);
		const job = emptyJob(parsed.rows, 'abc');
		job.cursor = 1;
		job.minted['C-1'] = {
			id: 'C-1',
			name: '',
			address: '1 St',
			code: 'already',
			join_path: '/join',
		};
		assert.equal(job.cursor, 1);
		const need = nextMintBatch(job.rows, Object.keys(job.minted), job.cursor);
		assert.deepEqual(need.map((r) => r.id), ['C-2']);
	});

	it('estimates remaining time after progress', () => {
		const eta = etaSeconds(10, 100, Date.now() - 10_000, Date.now());
		assert.ok(eta != null && eta >= 80 && eta <= 100);
	});
});
