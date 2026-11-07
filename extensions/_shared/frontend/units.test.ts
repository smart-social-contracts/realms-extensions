import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ONE, PERCENT, formatPercent, fromPercent, toRatio } from './units.ts';

describe('formatPercent', () => {
	it('shows a ratio as a percentage with the decimals it has', () => {
		assert.equal(formatPercent(50 * PERCENT), '50');
		assert.equal(formatPercent(100_000), '0.1');
		assert.equal(formatPercent(33_333_333), '33.333333');
		assert.equal(formatPercent(ONE), '100');
		assert.equal(formatPercent(0), '0');
		assert.equal(formatPercent(null), '0');
	});
});

describe('toRatio', () => {
	it('reads what a person typed as the integer the realm stores', () => {
		assert.equal(toRatio('50'), 50_000_000);
		assert.equal(toRatio('0.1'), 100_000);
		assert.equal(toRatio('1.10'), 1_100_000);
		assert.equal(toRatio(0.123456), 123_456); // the value of a number input
		assert.equal(toRatio(' 2 '), 2_000_000);
	});

	it('refuses what is not a percentage, or has a seventh decimal', () => {
		for (const bad of ['', 'abc', '1.2.3', '-1', '0.1234567', null, undefined]) assert.equal(toRatio(bad), null, String(bad));
	});

	it('is the inverse of formatPercent', () => {
		for (const ratio of [0, 1, 123_456, 33_333_333, ONE]) assert.equal(toRatio(formatPercent(ratio)), ratio);
	});
});

describe('fromPercent', () => {
	it('rounds a percentage held as a number to the nearest hundred-millionth', () => {
		assert.equal(fromPercent(50), 50_000_000);
		assert.equal(fromPercent(1.1), 1_100_000); // 1.1 * 1e6 is 1100000.0000000002 in floating point
		assert.equal(fromPercent(0.1 + 0.2), 300_000);
		assert.equal(fromPercent(null), 0);
	});
});
