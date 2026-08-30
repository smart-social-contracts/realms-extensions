import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	PASSPORT_VERIFICATION_PATH,
	citizenshipActionTarget,
	citizenshipNextActions,
	citizenshipSteps,
	isPassportVerificationAvailable,
} from './helpers.ts';

const agoraInstalled = ['member_dashboard', 'welcome', 'voting', 'role_manager'];
const syntropiaInstalled = [...agoraInstalled, 'passport_verification'];

const pendingMembership = {
	status: 'pending',
	invoice_paid: false,
	passport_verified: false,
	total_invoices: 1,
};

describe('isPassportVerificationAvailable', () => {
	it('agora-like: absent extension and no passport_zk requirement → hidden', () => {
		assert.equal(isPassportVerificationAvailable({ installed: agoraInstalled }), false);
		assert.equal(isPassportVerificationAvailable({ installed: [] }), false);
		assert.equal(isPassportVerificationAvailable({}), false);
	});

	it('Syntropia-like: installed passport_verification → available', () => {
		assert.equal(isPassportVerificationAvailable({ installed: syntropiaInstalled }), true);
	});

	it('treats identity_requirements passport_zk as equivalent', () => {
		assert.equal(
			isPassportVerificationAvailable({
				installed: agoraInstalled,
				identityRequirements: ['registration_code', 'passport_zk'],
			}),
			true,
		);
	});

	it('reads installed_extensions from the citizenship payload (runtime, no rebuild)', () => {
		assert.equal(
			isPassportVerificationAvailable({}, { installed_extensions: syntropiaInstalled }),
			true,
		);
		assert.equal(
			isPassportVerificationAvailable({}, { installed_extensions: agoraInstalled }),
			false,
		);
	});
});

describe('citizenshipSteps', () => {
	it('agora-like: no verify_passport step; invoice is the only step', () => {
		const steps = citizenshipSteps(pendingMembership, { installed: agoraInstalled });
		assert.equal(steps.showPassport, false);
		assert.equal(steps.passport, false);
		assert.equal(steps.invoice, false);
		assert.equal(steps.done, 0);
		assert.equal(steps.total, 1);
	});

	it('Syntropia-like: passport step is shown and counted', () => {
		const steps = citizenshipSteps(pendingMembership, { installed: syntropiaInstalled });
		assert.equal(steps.showPassport, true);
		assert.equal(steps.passport, false);
		assert.equal(steps.invoice, false);
		assert.equal(steps.done, 0);
		assert.equal(steps.total, 2);
	});

	it('does not count an unverified passport when the extension is absent', () => {
		const steps = citizenshipSteps(
			{ ...pendingMembership, passport_verified: true, invoice_paid: true },
			{ installed: agoraInstalled },
		);
		assert.equal(steps.showPassport, false);
		assert.equal(steps.passport, false);
		assert.equal(steps.invoice, true);
		assert.equal(steps.done, 1);
		assert.equal(steps.total, 1);
	});
});

describe('citizenshipNextActions', () => {
	it('agora-like: no verify_passport action; invoices stay available', () => {
		const actions = citizenshipNextActions(pendingMembership, { installed: agoraInstalled });
		assert.deepEqual(
			actions.map((action) => action.id),
			['invoices'],
		);
		assert.equal(actions[0]?.tone, 'primary');
	});

	it('Syntropia-like: verify_passport is shown and still navigates to the extension', () => {
		const actions = citizenshipNextActions(pendingMembership, { installed: syntropiaInstalled });
		assert.equal(actions[0]?.id, 'verify_passport');
		assert.equal(actions[1]?.id, 'invoices');
		assert.deepEqual(citizenshipActionTarget('verify_passport'), {
			kind: 'navigate',
			path: PASSPORT_VERIFICATION_PATH,
		});
		assert.equal(PASSPORT_VERIFICATION_PATH, '/extensions/passport_verification');
	});
});

describe('App.svelte wires the runtime gate', () => {
	it('renders the passport step only when showPassport is true', () => {
		const dir = dirname(fileURLToPath(import.meta.url));
		const source = readFileSync(join(dir, '..', 'App.svelte'), 'utf8');
		assert.match(source, /steps\.showPassport/);
		assert.match(source, /citizenshipActionTarget/);
		assert.equal(source.includes("ctx?.navigate('/extensions/passport_verification')"), false);
	});
});
