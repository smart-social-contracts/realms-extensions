import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PENDING_RETRIES, PENDING_WAIT_MS, requestSignature } from './sign.ts';

const signed = { ok: true, day: '2026-11-09', status: 'signed', proof: {} };
const pending = { ok: true, day: '2026-11-09', status: 'pending' };

/** An `ask` that answers with `replies` in turn, the last again and again, and remembers the days it was asked about. */
function asker(...replies: any[]) {
	const days: string[] = [];
	const ask = async (day: string) => {
		days.push(day);
		const reply = replies[Math.min(days.length - 1, replies.length - 1)];
		if (reply instanceof Error) throw reply;
		return reply;
	};
	return { ask, days };
}

test('a day the realm signs at once is signed, after one ask and no wait', async () => {
	const { ask, days } = asker(signed);
	const waits: number[] = [];
	assert.deepEqual(await requestSignature(ask, '2026-11-09', () => {}, async (ms) => void waits.push(ms)), { state: 'signed' });
	assert.deepEqual(days, ['2026-11-09']);
	assert.deepEqual(waits, []);
});

test('a day another call is signing is asked about again after a wait, and is signed when the realm says so', async () => {
	const { ask, days } = asker(pending, pending, signed);
	const waits: number[] = [];
	let said = 0;
	const outcome = await requestSignature(ask, '2026-11-09', () => said++, async (ms) => void waits.push(ms));
	assert.deepEqual(outcome, { state: 'signed' });
	assert.equal(days.length, 3);
	assert.deepEqual(waits, [PENDING_WAIT_MS, PENDING_WAIT_MS]);
	assert.equal(said, 2); // the page says it is being signed each time it waits
});

test('a day that stays pending is given up as pending, after the retries and no more', async () => {
	const { ask, days } = asker(pending);
	assert.deepEqual(await requestSignature(ask, '2026-11-09', () => {}, async () => {}), { state: 'pending' });
	assert.equal(days.length, PENDING_RETRIES + 1);
});

test('a refusal is its reason, and is not asked again', async () => {
	const { ask, days } = asker({ ok: false, kind: 'conflict', error: 'the issue of 2026-11-09 is not closed' });
	assert.deepEqual(await requestSignature(ask, '2026-11-09', () => {}, async () => {}), {
		state: 'refused',
		reason: 'the issue of 2026-11-09 is not closed',
	});
	assert.equal(days.length, 1);
});

test('a failed call is a refusal with the error\'s message', async () => {
	const { ask } = asker(new Error('network down'));
	assert.deepEqual(await requestSignature(ask, '2026-11-09', () => {}, async () => {}), { state: 'refused', reason: 'network down' });
});

test('a reply that is no reply is a refusal with no reason', async () => {
	const { ask } = asker(undefined);
	assert.deepEqual(await requestSignature(ask, '2026-11-09', () => {}, async () => {}), { state: 'refused', reason: '' });
});
