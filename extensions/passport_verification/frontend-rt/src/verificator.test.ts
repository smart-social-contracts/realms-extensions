import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	CHECKING_COPY,
	GO_HOME_ACTION,
	NOT_YET_VERIFIED_MODAL,
	canGoBack,
	canRestartFlow,
	decimalEventId,
	formatJsonApiErrors,
	interpretIdentityStatus,
	interpretVerificationLinkResult,
	interpretVerificationStatus,
	rarimeAppUrl,
	requestGoHome,
	showNotYetVerifiedModal,
	verifiedHeading,
} from './verificator.ts';

describe('interpretVerificationLinkResult', () => {
	it('accepts the live JSON:API verification_link body', () => {
		const result = interpretVerificationLinkResult({
			data: {
				id: 'alice',
				type: 'verification_link',
				attributes: {
					get_proof_params:
						'https://api.app.rarime.com/integrations/verificator-svc/public/proof-params/0xabc',
				},
			},
			included: [],
		});
		assert.equal(result.ok, true);
		if (result.ok) {
			assert.equal(result.id, 'alice');
			assert.equal(
				result.url,
				rarimeAppUrl(
					'https://api.app.rarime.com/integrations/verificator-svc/public/proof-params/0xabc',
				),
			);
		}
	});

	it('surfaces a JSON:API errors document instead of a format mismatch', () => {
		const result = interpretVerificationLinkResult({
			errors: [
				{
					title: 'Bad Request',
					status: '400',
					meta: { error: 'must be decimal and less than field modulo', field: 'data/attributes/event_id' },
				},
			],
		});
		assert.equal(result.ok, false);
		if (!result.ok) {
			assert.match(result.error, /event_id/);
			assert.match(result.error, /decimal/);
		}
	});

	it('surfaces an IC outcall error envelope', () => {
		const result = interpretVerificationLinkResult({
			success: false,
			error: 'SysTransient("Could not connect")',
		});
		assert.equal(result.ok, false);
		if (!result.ok) {
			assert.match(result.error, /SysTransient/);
		}
	});

	it('keeps the old invalid-format message for unrelated bodies', () => {
		const result = interpretVerificationLinkResult({ foo: 1 });
		assert.equal(result.ok, false);
		if (!result.ok) {
			assert.equal(result.error, 'Invalid response format from verification service');
		}
	});
});

describe('helpers', () => {
	it('keeps a decimal event id and replaces a non-decimal one', () => {
		assert.equal(decimalEventId('1750000000'), '1750000000');
		assert.match(decimalEventId('not-a-number'), /^\d+$/);
	});

	it('formats JSON:API field errors', () => {
		assert.equal(
			formatJsonApiErrors([
				{ meta: { field: 'data/id', error: 'cannot be blank' } },
			]),
			'data/id: cannot be blank',
		);
	});
});

describe('check-status outcomes', () => {
	it('treats a missing or in-progress status as pending', () => {
		assert.equal(interpretVerificationStatus({}), 'pending');
		assert.equal(
			interpretVerificationStatus({ data: { attributes: { status: 'not_verified' } } }),
			'pending',
		);
	});

	it('detects verified and failed statuses', () => {
		assert.equal(
			interpretVerificationStatus({ data: { attributes: { status: 'verified' } } }),
			'verified',
		);
		assert.equal(interpretVerificationStatus({ status: 'approved' }), 'verified');
		assert.equal(
			interpretVerificationStatus({ data: { attributes: { status: 'failed_verification' } } }),
			'failed',
		);
	});
});

describe('already-verified lock and back rules', () => {
	it('locks the Start→Scan flow once verified', () => {
		assert.equal(canRestartFlow('verified'), false);
		assert.equal(canRestartFlow('idle'), true);
		assert.equal(canRestartFlow('pending'), true);
		assert.equal(verifiedHeading(true), 'You are already verified');
		assert.equal(interpretIdentityStatus({ verified: true }).verified, true);
		assert.equal(interpretIdentityStatus({ verified: false }).verified, false);
	});

	it('allows back from Scan to Start, but not from Verified', () => {
		assert.equal(canGoBack('pending'), true);
		assert.equal(canGoBack('generating'), true);
		assert.equal(canGoBack('verified'), false);
		assert.equal(canGoBack('idle'), false);
	});
});

describe('not-yet-verified host modal', () => {
	it('opens the shared host modal with the waiting-finished error copy', async () => {
		const calls: unknown[] = [];
		await showNotYetVerifiedModal({
			openModal: async (payload) => {
				calls.push(payload);
				return { actionId: 'close' };
			},
		});
		assert.equal(calls.length, 1);
		assert.deepEqual(calls[0], {
			title: 'An error occurred',
			body: 'Your passport has not been verified yet. Are you sure you finished verification in the RariMe app?',
			actions: [{ id: 'close', label: 'Close', tone: 'secondary' }],
		});
		assert.match(NOT_YET_VERIFIED_MODAL.body, /RariMe/);
	});
});

describe('go home without coupling to another extension', () => {
	it('dispatches the generic host navigate.home action', () => {
		const actions: unknown[] = [];
		requestGoHome({ host: { dispatch: (action) => actions.push(action) } });
		assert.deepEqual(actions, [{ type: 'navigate.home' }]);
		assert.equal(GO_HOME_ACTION.type, 'navigate.home');
	});

	it('does not mention member_dashboard in passport sources', () => {
		const dir = dirname(fileURLToPath(import.meta.url));
		for (const file of ['PassportVerification.svelte', 'verificator.ts', 'index.ts']) {
			const source = readFileSync(join(dir, file), 'utf8');
			assert.equal(source.includes('member_dashboard'), false, file);
			assert.equal(source.includes('/extensions/'), false, file);
		}
	});
});

describe('mobile-width check-status waiting copy', () => {
	it('keeps the checking state visible (no sm:hidden / hidden)', () => {
		const dir = dirname(fileURLToPath(import.meta.url));
		const source = readFileSync(join(dir, 'PassportVerification.svelte'), 'utf8');
		assert.match(source, /data-testid="check-waiting"/);
		assert.match(source, /CHECKING_COPY\.title/);
		const waitingBlock = source.slice(
			source.indexOf('data-testid="check-waiting"'),
			source.indexOf('data-testid="check-waiting"') + 600,
		);
		assert.equal(waitingBlock.includes('hidden'), false);
		assert.equal(waitingBlock.includes('sm:hidden'), false);
		assert.match(CHECKING_COPY.title, /Checking verification status/);
		assert.match(CHECKING_COPY.subtitle, /Please wait/);
	});
});
