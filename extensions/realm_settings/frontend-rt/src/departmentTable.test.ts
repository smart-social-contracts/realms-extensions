import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	EXAMPLE_DEPARTMENT_TABLE,
	documentHasDestroy,
	formatApplyResult,
	isDestroyRow,
	normalizeDepartmentRows,
	parseDepartmentTableText,
	previewDepartmentTable,
	rowName,
} from './departmentTable.ts';

describe('realms #358 document shapes', () => {
	it('reads the issue example: upsert Finance, destroy Works', () => {
		const preview = previewDepartmentTable(EXAMPLE_DEPARTMENT_TABLE);
		assert.deepEqual(preview.upsert, ['Finance']);
		assert.deepEqual(preview.destroy, ['Works']);
		assert.equal(documentHasDestroy(EXAMPLE_DEPARTMENT_TABLE), true);
	});

	it('accepts a list of rows and destroy: true', () => {
		const preview = previewDepartmentTable([
			{ name: 'Works', destroy: true },
			{ name: 'Parks', description: 'green space' },
		]);
		assert.deepEqual(preview.destroy, ['Works']);
		assert.deepEqual(preview.upsert, ['Parks']);
	});

	it('accepts entity-import delete on a single Department row', () => {
		const row = { _type: 'Department', _action: 'delete', name: 'Works' };
		assert.equal(isDestroyRow(row), true);
		assert.equal(rowName(row), 'Works');
		assert.deepEqual(previewDepartmentTable(row).destroy, ['Works']);
	});

	it('treats action delete/remove as destroy', () => {
		assert.equal(isDestroyRow({ name: 'A', action: 'delete' }), true);
		assert.equal(isDestroyRow({ name: 'B', _action: 'remove' }), true);
		assert.equal(isDestroyRow({ name: 'C' }), false);
	});
});

describe('parseDepartmentTableText', () => {
	it('parses the #358 example JSON', () => {
		const parsed = parseDepartmentTableText(JSON.stringify(EXAMPLE_DEPARTMENT_TABLE, null, 2));
		assert.equal(parsed.ok, true);
		if (parsed.ok) {
			assert.deepEqual(parsed.preview.upsert, ['Finance']);
			assert.deepEqual(parsed.preview.destroy, ['Works']);
		}
	});

	it('rejects empty, invalid JSON, and nameless tables', () => {
		assert.equal(parseDepartmentTableText('').ok, false);
		assert.equal(parseDepartmentTableText('{').ok, false);
		const empty = parseDepartmentTableText('{"departments":[]}');
		assert.equal(empty.ok, false);
		if (!empty.ok) {
			assert.match(empty.error, /no named department rows/i);
		}
	});

	it('rejects a departments field that is not a list', () => {
		const parsed = parseDepartmentTableText('{"departments":{"name":"Finance"}}');
		assert.equal(parsed.ok, false);
		if (!parsed.ok) {
			assert.equal(parsed.error, 'departments must be a list');
		}
	});
});

describe('normalizeDepartmentRows', () => {
	it('uses _id when name is absent', () => {
		const { rows } = normalizeDepartmentRows({ _id: 'Finance', description: 'x' });
		assert.equal(rowName(rows[0]), 'Finance');
	});
});

describe('formatApplyResult', () => {
	it('summarizes created / updated / destroyed the way the host returns them', () => {
		assert.equal(
			formatApplyResult({
				data: {
					created: ['Finance'],
					updated: [],
					destroyed: ['Works'],
					errors: [],
				},
			}),
			'created Finance · destroyed Works',
		);
	});
});

describe('Settings wiring', () => {
	it('mounts apply/destroy on the Advanced tab, not Department Management', () => {
		const settings = readFileSync(new URL('./RealmSettings.svelte', import.meta.url), 'utf8');
		const panel = readFileSync(new URL('./DepartmentTablePanel.svelte', import.meta.url), 'utf8');
		assert.match(settings, /import DepartmentTablePanel/);
		assert.match(settings, /activeTab === 'advanced'[\s\S]*DepartmentTablePanel/);
		assert.match(panel, /Apply table/);
		assert.match(panel, /Destroy a department/);
		assert.match(panel, /apply_department_table/);
		assert.match(panel, /delete_department/);
		assert.match(panel, /Department tables \(JSON\)/);
		assert.match(panel, /not Department Management CRUD/);
	});
});
