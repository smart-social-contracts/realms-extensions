import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	decimalEventId,
	formatJsonApiErrors,
	interpretVerificationLinkResult,
	rarimeAppUrl,
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
