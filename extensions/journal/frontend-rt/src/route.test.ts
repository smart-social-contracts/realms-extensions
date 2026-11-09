import assert from 'node:assert/strict';
import { test } from 'node:test';
import { basePath, parseRoute, pathFor, shiftDay } from './route.ts';

test('the journal page without a day is today', () => {
	assert.deepEqual(parseRoute('/extensions/journal'), { day: null, print: false });
	assert.deepEqual(parseRoute('/extensions/journal/'), { day: null, print: false });
});

test('a day, and its print route', () => {
	assert.deepEqual(parseRoute('/extensions/journal/2026-11-09'), { day: '2026-11-09', print: false });
	assert.deepEqual(parseRoute('/extensions/journal/2026-11-09/print'), { day: '2026-11-09', print: true });
});

test('a realm served under a prefix keeps it', () => {
	const path = '/r/agora/extensions/journal/2026-11-09/print';
	assert.equal(basePath(path), '/r/agora/extensions/journal');
	assert.deepEqual(parseRoute(path), { day: '2026-11-09', print: true });
	assert.equal(pathFor(basePath(path), { day: '2026-11-10', print: false }), '/r/agora/extensions/journal/2026-11-10');
});

test('a path that is no day is today', () => {
	assert.deepEqual(parseRoute('/extensions/journal/yesterday'), { day: null, print: false });
	assert.deepEqual(parseRoute('/extensions/journal/2026-11-09/other'), { day: null, print: false });
});

test('paths are built back from a route', () => {
	const base = '/extensions/journal';
	assert.equal(pathFor(base, { day: null, print: true }), base);
	assert.equal(pathFor(base, { day: '2026-11-09', print: true }), `${base}/2026-11-09/print`);
});

test('days are shifted on the calendar, across months, years and a leap day', () => {
	assert.equal(shiftDay('2026-11-09', 1), '2026-11-10');
	assert.equal(shiftDay('2026-11-30', 1), '2026-12-01');
	assert.equal(shiftDay('2026-01-01', -1), '2025-12-31');
	assert.equal(shiftDay('2028-02-28', 1), '2028-02-29');
	assert.equal(shiftDay('2026-03-29', 1), '2026-03-30');
});
