import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { AiSignInError, fetchAsUser } from './aiClient.ts';

const realFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = realFetch;
});

/** Answers each call with the next status; returns the Authorization header of every call. */
function fakeService(...statuses: number[]) {
	const sent: (string | undefined)[] = [];
	globalThis.fetch = (async (_url: string, init?: RequestInit) => {
		sent.push((init?.headers as Record<string, string>).Authorization);
		return { status: statuses[Math.min(sent.length, statuses.length) - 1] };
	}) as typeof fetch;
	return sent;
}

const host = { session: async ({ renew = false } = {}) => ({ token: renew ? 'fresh' : 'stale' }) };

describe('fetchAsUser', () => {
	it('sends the Bearer token and keeps the caller headers', async () => {
		let headers: unknown;
		globalThis.fetch = (async (_url: string, init?: RequestInit) => {
			headers = init?.headers;
			return { status: 200 };
		}) as typeof fetch;

		await fetchAsUser(host, 'https://ai.example/api/ask', { headers: { Accept: 'text/plain' } });

		assert.deepEqual(headers, { Accept: 'text/plain', Authorization: 'Bearer stale' });
	});

	it('retries once with a fresh session on 401', async () => {
		const sent = fakeService(401, 200);

		const response = await fetchAsUser(host, 'https://ai.example/api/ask');

		assert.equal(response.status, 200);
		assert.deepEqual(sent, ['Bearer stale', 'Bearer fresh']);
	});

	it('gives up after that one retry', async () => {
		const sent = fakeService(401);

		assert.equal((await fetchAsUser(host, 'https://ai.example/api/ask')).status, 401);
		assert.equal(sent.length, 2);
	});

	it('says why the user cannot sign in, without calling the service', async () => {
		const sent = fakeService(200);
		const signedOut = {
			session: async () => {
				throw new Error('Sign in to use the AI assistant.');
			},
		};

		await assert.rejects(fetchAsUser(signedOut, 'https://ai.example/api/ask'), (err: Error) => {
			assert.ok(err instanceof AiSignInError);
			assert.equal(err.message, 'Sign in to use the AI assistant.');
			return true;
		});
		assert.equal(sent.length, 0);
	});

	it('asks for a realm update when the host has no AI sign-in', async () => {
		await assert.rejects(fetchAsUser(undefined, 'https://ai.example/api/ask'), AiSignInError);
	});
});
