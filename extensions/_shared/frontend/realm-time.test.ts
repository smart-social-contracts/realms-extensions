import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	formatInZone,
	formatOffset,
	formatUtc,
	formatWithUtc,
	isKnownZone,
	matchZone,
	offsetMinutes,
	resolveLocalTime,
	timeZoneChoices,
} from './realm-time.ts';

const seconds = (iso: string) => Date.parse(iso) / 1000;

describe('resolveLocalTime', () => {
	it('reads a time of day in the realm zone, in winter and in summer', () => {
		assert.deepEqual(resolveLocalTime('2026-01-15T12:00', 'Europe/Madrid'), {
			kind: 'ok',
			epoch: seconds('2026-01-15T11:00:00Z'),
		});
		assert.deepEqual(resolveLocalTime('2026-07-15T12:00', 'Europe/Madrid'), {
			kind: 'ok',
			epoch: seconds('2026-07-15T10:00:00Z'),
		});
		assert.deepEqual(resolveLocalTime('2026-11-08T12:00', 'UTC'), { kind: 'ok', epoch: seconds('2026-11-08T12:00:00Z') });
		assert.deepEqual(resolveLocalTime('2026-11-08T12:00', 'Asia/Kolkata'), {
			kind: 'ok',
			epoch: seconds('2026-11-08T06:30:00Z'),
		});
	});

	describe('Europe/Madrid, where the clocks go forward on 29 March 2026 and back on 25 October 2026', () => {
		it('reads the minutes around the spring change', () => {
			assert.deepEqual(resolveLocalTime('2026-03-29T01:59', 'Europe/Madrid'), {
				kind: 'ok',
				epoch: seconds('2026-03-29T00:59:00Z'),
			});
			assert.deepEqual(resolveLocalTime('2026-03-29T03:00', 'Europe/Madrid'), {
				kind: 'ok',
				epoch: seconds('2026-03-29T01:00:00Z'),
			});
		});

		it('refuses a time the clocks skip', () => {
			assert.deepEqual(resolveLocalTime('2026-03-29T02:00', 'Europe/Madrid'), { kind: 'gap' });
			assert.deepEqual(resolveLocalTime('2026-03-29T02:30', 'Europe/Madrid'), { kind: 'gap' });
		});

		it('gives both readings of a time the clocks repeat', () => {
			assert.deepEqual(resolveLocalTime('2026-10-25T02:30', 'Europe/Madrid'), {
				kind: 'twice',
				first: seconds('2026-10-25T00:30:00Z'), // still summer time, UTC+02:00
				second: seconds('2026-10-25T01:30:00Z'), // winter time, UTC+01:00
			});
		});

		it('reads the minutes around the autumn change', () => {
			assert.deepEqual(resolveLocalTime('2026-10-25T01:59', 'Europe/Madrid'), {
				kind: 'ok',
				epoch: seconds('2026-10-24T23:59:00Z'),
			});
			assert.deepEqual(resolveLocalTime('2026-10-25T03:00', 'Europe/Madrid'), {
				kind: 'ok',
				epoch: seconds('2026-10-25T02:00:00Z'),
			});
		});
	});

	describe('Australia/Sydney, in the southern summer: forward on 4 October 2026, back on 5 April 2026', () => {
		it('refuses a time the clocks skip, and reads the one after it', () => {
			assert.deepEqual(resolveLocalTime('2026-10-04T02:30', 'Australia/Sydney'), { kind: 'gap' });
			assert.deepEqual(resolveLocalTime('2026-10-04T03:00', 'Australia/Sydney'), {
				kind: 'ok',
				epoch: seconds('2026-10-03T16:00:00Z'),
			});
		});

		it('gives both readings of a time the clocks repeat', () => {
			assert.deepEqual(resolveLocalTime('2026-04-05T02:30', 'Australia/Sydney'), {
				kind: 'twice',
				first: seconds('2026-04-04T15:30:00Z'), // UTC+11:00
				second: seconds('2026-04-04T16:30:00Z'), // UTC+10:00
			});
		});

		it('reads the same wall-clock time 10 or 11 hours ahead of UTC with the season', () => {
			assert.deepEqual(resolveLocalTime('2026-01-15T12:00', 'Australia/Sydney'), {
				kind: 'ok',
				epoch: seconds('2026-01-15T01:00:00Z'),
			});
			assert.deepEqual(resolveLocalTime('2026-07-15T12:00', 'Australia/Sydney'), {
				kind: 'ok',
				epoch: seconds('2026-07-15T02:00:00Z'),
			});
		});
	});

	it('finds that midnight does not exist in a zone that changes at midnight', () => {
		assert.deepEqual(resolveLocalTime('2026-09-06T00:30', 'America/Santiago'), { kind: 'gap' });
	});

	it('refuses what is not a time of day, or a zone the browser does not know', () => {
		for (const bad of ['', '2026-11-08', '2026-11-08 12:00', '2026-02-30T10:00', '2026-11-08T24:00', '2026-11-08T12:60']) {
			assert.deepEqual(resolveLocalTime(bad, 'UTC'), { kind: 'invalid' }, bad);
		}
		assert.deepEqual(resolveLocalTime('2026-11-08T12:00', 'Nowhere/Land'), { kind: 'invalid' });
	});
});

describe('formatting', () => {
	const instant = seconds('2026-11-08T11:00:00Z');

	it('shows an instant in the realm zone with its offset, and in UTC', () => {
		assert.equal(formatInZone(instant, 'Europe/Madrid'), '2026-11-08 12:00 Europe/Madrid (UTC+01:00)');
		assert.equal(formatInZone(seconds('2026-07-15T10:00:00Z'), 'Europe/Madrid'), '2026-07-15 12:00 Europe/Madrid (UTC+02:00)');
		assert.equal(formatInZone(instant, 'Australia/Sydney'), '2026-11-08 22:00 Australia/Sydney (UTC+11:00)');
		assert.equal(formatInZone(instant, 'Asia/Kolkata'), '2026-11-08 16:30 Asia/Kolkata (UTC+05:30)');
		assert.equal(formatUtc(instant), '2026-11-08 11:00 UTC');
		assert.equal(formatInZone(instant, 'UTC'), '2026-11-08 11:00 UTC');
	});

	it('adds the UTC instant to a time in the realm zone, once for a UTC realm', () => {
		assert.equal(
			formatWithUtc(instant, 'Europe/Madrid'),
			'2026-11-08 12:00 Europe/Madrid (UTC+01:00) · 2026-11-08 11:00 UTC',
		);
		assert.equal(formatWithUtc(instant, 'UTC'), '2026-11-08 11:00 UTC');
	});

	it('shows midnight as 00:00, not 24:00', () => {
		assert.equal(formatUtc(seconds('2026-11-08T00:00:00Z')), '2026-11-08 00:00 UTC');
		assert.equal(formatInZone(seconds('2026-11-07T23:00:00Z'), 'Europe/Madrid'), '2026-11-08 00:00 Europe/Madrid (UTC+01:00)');
	});

	it('is the inverse of resolveLocalTime', () => {
		for (const zone of ['Europe/Madrid', 'Australia/Sydney', 'America/St_Johns', 'Pacific/Chatham']) {
			const resolved = resolveLocalTime('2026-12-24T18:45', zone);
			assert.equal(resolved.kind, 'ok');
			assert.ok(formatInZone((resolved as { epoch: number }).epoch, zone).startsWith('2026-12-24 18:45 '), zone);
		}
	});

	it('writes an offset as UTC+hh:mm', () => {
		assert.equal(formatOffset(0), 'UTC+00:00');
		assert.equal(formatOffset(60), 'UTC+01:00');
		assert.equal(formatOffset(-210), 'UTC-03:30');
		assert.equal(offsetMinutes(instant * 1000, 'Pacific/Chatham'), 13 * 60 + 45);
	});
});

describe('zone choices', () => {
	it('offers UTC first, then the browser zones in order, each once', () => {
		const choices = timeZoneChoices();
		assert.equal(choices[0], 'UTC');
		assert.equal(choices.filter((zone) => zone === 'UTC').length, 1);
		assert.ok(choices.includes('Europe/Madrid') && choices.includes('Australia/Sydney'));
		assert.deepEqual(choices.slice(1), [...choices.slice(1)].sort());
		assert.ok(choices.every(isKnownZone));
	});

	it('finds the choice a person typed, ignoring case and spaces', () => {
		const choices = ['UTC', 'Europe/Madrid', 'Asia/Tokyo'];
		assert.equal(matchZone(choices, ' europe/madrid '), 'Europe/Madrid');
		assert.equal(matchZone(choices, 'utc'), 'UTC');
		assert.equal(matchZone(choices, 'Madrid'), null);
		assert.equal(matchZone(choices, ''), null);
	});
});
