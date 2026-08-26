import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	buildCreateLitigationParams,
	findDirectoryHit,
	needsDefendantQuarterPicker,
	normalizeQuarters,
	quarterIdFromEntry,
	quarterLabel,
	resolveDefendantQuarterId,
} from './createLitigationParams.ts';

const Q0 = 'aaaaa-q0-capital';
const Q1 = 'bbbbb-q1-member';
const REMOTE_PRINCIPAL = 'z32zf-ic72u-jhtqq-ojjqp-jblhx-dxxin-vqelt-ljmo4-ymwmh-gcnzo-hae';
const LOCAL_PRINCIPAL = 'cybi7-lmxkc-lgijx-c6jqu-mzeh7-mamgq-vtorr-5qrvs-52frq-i6chg-2ae';

const quarters = normalizeQuarters([
	{ name: 'Capital', canister_id: Q0, index: 0, is_capital: true },
	{ name: 'Quarter 1', canister_id: Q1, index: 1 },
]);

describe('normalizeQuarters', () => {
	it('keeps canister id and drops duplicates / empty rows', () => {
		assert.deepEqual(
			normalizeQuarters([
				{ name: 'Capital', canister_id: Q0, index: 0, is_capital: true },
				{ name: 'dup', canister_id: Q0 },
				{ name: 'nameless' },
				null,
			]),
			[{ name: 'Capital', canister_id: Q0, index: 0, is_capital: true }],
		);
	});
});

describe('quarterLabel', () => {
	it('prefers capital name and includes index for other quarters', () => {
		assert.equal(quarterLabel(quarters[0]), 'Capital');
		assert.equal(quarterLabel(quarters[1]), 'Quarter 1 (1)');
	});
});

describe('quarterIdFromEntry / findDirectoryHit', () => {
	it('reads quarter_id, quarter_canister_id, or assigned_quarter', () => {
		assert.equal(quarterIdFromEntry({ quarter_id: Q0 }), Q0);
		assert.equal(quarterIdFromEntry({ quarter_canister_id: ` ${Q0} ` }), Q0);
		assert.equal(quarterIdFromEntry({ assigned_quarter: Q0 }), Q0);
		assert.equal(quarterIdFromEntry({ principal: LOCAL_PRINCIPAL }), '');
	});

	it('matches a pasted principal case-insensitively', () => {
		const hit = findDirectoryHit(
			[{ kind: 'user', principal: LOCAL_PRINCIPAL, label: 'Xiao' }],
			LOCAL_PRINCIPAL.toUpperCase(),
		);
		assert.equal(hit?.label, 'Xiao');
		assert.equal(findDirectoryHit([], REMOTE_PRINCIPAL), undefined);
	});
});

describe('needsDefendantQuarterPicker', () => {
	const localDirectory = [{ kind: 'user', principal: LOCAL_PRINCIPAL, label: 'Xiao' }];

	it('asks for a quarter when the pasted user is not in this quarter directory', () => {
		assert.equal(
			needsDefendantQuarterPicker({
				defendantPrincipal: REMOTE_PRINCIPAL,
				directory: localDirectory,
				quarters,
				activeQuarterId: Q1,
			}),
			true,
		);
	});

	it('hides the picker for a local directory hit', () => {
		assert.equal(
			needsDefendantQuarterPicker({
				selectedEntry: localDirectory[0],
				directory: localDirectory,
				quarters,
				activeQuarterId: Q1,
			}),
			false,
		);
	});

	it('hides the picker when a federated hit already includes a quarter id', () => {
		assert.equal(
			needsDefendantQuarterPicker({
				selectedEntry: {
					kind: 'user',
					principal: REMOTE_PRINCIPAL,
					label: 'Root member',
					quarter_id: Q0,
				},
				quarters,
				activeQuarterId: Q1,
			}),
			false,
		);
	});

	it('hides the picker for departments and single-quarter realms', () => {
		assert.equal(
			needsDefendantQuarterPicker({
				selectedEntry: { kind: 'department', label: 'Treasury', id: 't1' },
				quarters,
				activeQuarterId: Q1,
			}),
			false,
		);
		assert.equal(
			needsDefendantQuarterPicker({
				defendantPrincipal: REMOTE_PRINCIPAL,
				quarters: [quarters[1]],
				activeQuarterId: Q1,
			}),
			false,
		);
	});
});

describe('resolveDefendantQuarterId / buildCreateLitigationParams', () => {
	it('omits the quarter for a same-quarter user filing', () => {
		const params = buildCreateLitigationParams({
			defendantPrincipal: LOCAL_PRINCIPAL,
			directory: [{ kind: 'user', principal: LOCAL_PRINCIPAL, label: 'Xiao' }],
			activeQuarterId: Q1,
			courtId: '12',
		});
		assert.deepEqual(params, {
			defendant_kind: 'user',
			defendant_principal: LOCAL_PRINCIPAL,
			court_id: '12',
		});
	});

	it('sends defendant_quarter_id when a pasted principal lives on another quarter', () => {
		const params = buildCreateLitigationParams({
			defendantPrincipal: REMOTE_PRINCIPAL,
			pickedQuarterId: Q0,
			activeQuarterId: Q1,
		});
		assert.deepEqual(params, {
			defendant_kind: 'user',
			defendant_principal: REMOTE_PRINCIPAL,
			defendant_quarter_id: Q0,
		});
	});

	it('auto-sends a federated directory hit quarter when it is not the active quarter', () => {
		const params = buildCreateLitigationParams({
			selectedEntry: {
				kind: 'user',
				principal: REMOTE_PRINCIPAL,
				label: 'Root member',
				quarter_id: Q0,
			},
			activeQuarterId: Q1,
		});
		assert.deepEqual(params, {
			defendant_kind: 'user',
			defendant_principal: REMOTE_PRINCIPAL,
			defendant_quarter_id: Q0,
		});
	});

	it('omits a known quarter that matches the active quarter', () => {
		assert.equal(
			resolveDefendantQuarterId({
				selectedEntry: { principal: LOCAL_PRINCIPAL, quarter_id: Q1 },
				activeQuarterId: Q1,
			}),
			'',
		);
		assert.equal(
			resolveDefendantQuarterId({
				pickedQuarterId: Q1,
				activeQuarterId: Q1,
			}),
			'',
		);
	});

	it('does not attach a quarter to a department filing', () => {
		const params = buildCreateLitigationParams({
			selectedEntry: { kind: 'department', label: 'Treasury', id: 't1' },
			pickedQuarterId: Q0,
			activeQuarterId: Q1,
		});
		assert.deepEqual(params, {
			defendant_kind: 'department',
			defendant_department: 'Treasury',
			defendant_department_id: 't1',
		});
	});
});
