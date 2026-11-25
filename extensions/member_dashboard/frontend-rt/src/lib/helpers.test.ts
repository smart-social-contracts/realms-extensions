import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	PASSPORT_VERIFICATION_PATH,
	citizenshipActionTarget,
	citizenshipFromRealm,
	citizenshipNextActions,
	citizenshipSteps,
	isPassportVerificationAvailable,
	membershipStatus,
} from './helpers.ts';

const agoraInstalled = ['member_dashboard', 'welcome', 'voting', 'role_manager'];
const syntropiaInstalled = [...agoraInstalled, 'passport_verification'];

const pendingMembership = {
	status: 'pending',
	invoice_paid: false,
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
		assert.equal(steps.invoice, false);
		assert.equal(steps.done, 0);
		assert.equal(steps.total, 1);
	});

	it('with passport_verification: the passport is offered, not counted as a step', () => {
		const steps = citizenshipSteps(pendingMembership, { installed: syntropiaInstalled });
		assert.equal(steps.showPassport, true);
		assert.equal(steps.invoice, false);
		assert.equal(steps.done, 0);
		assert.equal(steps.total, 1);
	});

	it('a paid invoice completes the steps, with or without passport_verification', () => {
		for (const installed of [agoraInstalled, syntropiaInstalled]) {
			const steps = citizenshipSteps({ ...pendingMembership, invoice_paid: true, paid_invoices: 1 }, { installed });
			assert.equal(steps.showPassport, installed === syntropiaInstalled);
			assert.equal(steps.invoice, true);
			assert.equal(steps.done, 1);
			assert.equal(steps.total, 1);
		}
	});

	it('does not offer the passport when the extension is absent', () => {
		const steps = citizenshipSteps(
			{ ...pendingMembership, invoice_paid: true, paid_invoices: 1 },
			{ installed: agoraInstalled },
		);
		assert.equal(steps.showPassport, false);
		assert.equal(steps.invoice, true);
		assert.equal(steps.done, 1);
		assert.equal(steps.total, 1);
	});

	it('a member who was never billed has no invoice step', () => {
		const steps = citizenshipSteps(citizenshipFromRealm({ status: 'active' }, [], agoraInstalled), {
			installed: agoraInstalled,
		});
		assert.equal(steps.showInvoice, false);
		assert.equal(steps.total, 0);
	});
});

const invoice = (status: string) => ({ id: `INV-${status}`, amount: 5, symbol: 'AGR', status });

describe('membershipStatus', () => {
	it('is the realm\'s record of the member', () => {
		assert.equal(membershipStatus('active'), 'active');
		assert.equal(membershipStatus('inactive'), 'pending');
		assert.equal(membershipStatus('suspended'), 'suspended');
		assert.equal(membershipStatus('banned'), 'banned');
		assert.equal(membershipStatus(''), '');
	});
});

describe('citizenshipFromRealm', () => {
	it('a member with no invoice is active and owes nothing', () => {
		const card = citizenshipFromRealm({ status: 'active' }, [], agoraInstalled);
		assert.equal(card.status, 'active');
		assert.equal(card.invoice_paid, true);
		assert.equal(card.total_invoices, 0);
	});

	it('an unpaid invoice is owed and does not change the activation', () => {
		for (const status of ['pending', 'overdue']) {
			const card = citizenshipFromRealm({ status: 'active' }, [invoice('paid'), invoice(status)], agoraInstalled);
			assert.equal(card.status, 'active');
			assert.equal(card.invoice_paid, false);
			assert.equal(card.owed_invoices, 1);
			assert.equal(card.paid_invoices, 1);
		}
	});

	it('a cancelled invoice is not owed', () => {
		const card = citizenshipFromRealm({ status: 'active' }, [invoice('cancelled')], agoraInstalled);
		assert.equal(card.invoice_paid, true);
		assert.equal(citizenshipSteps(card, { installed: agoraInstalled }).showInvoice, false);
	});

	it('paying does not activate a member the realm holds inactive', () => {
		const card = citizenshipFromRealm({ status: 'inactive' }, [invoice('paid')], agoraInstalled);
		assert.equal(card.status, 'pending');
		assert.equal(card.invoice_paid, true);
	});

	it('passport_verification never holds an active member back: nothing read says a passport was verified', () => {
		assert.equal(citizenshipFromRealm({ status: 'active' }, [], syntropiaInstalled).status, 'active');
		assert.equal(citizenshipFromRealm({ status: 'inactive' }, [], syntropiaInstalled).status, 'pending');
	});
});

describe('citizenshipNextActions', () => {
	it('an active member who owes an invoice is still asked to pay it', () => {
		const card = citizenshipFromRealm({ status: 'active' }, [invoice('pending')], agoraInstalled);
		assert.deepEqual(
			citizenshipNextActions(card, { installed: agoraInstalled }).map((action) => action.labelKey),
			['citizenship_pay_invoice'],
		);
		assert.deepEqual(citizenshipNextActions(citizenshipFromRealm({ status: 'active' }, [], agoraInstalled)), []);
	});


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
		assert.match(source, /steps\.showInvoice/);
		assert.match(source, /citizenshipActionTarget/);
		assert.equal(source.includes("ctx?.navigate('/extensions/passport_verification')"), false);
	});
});
