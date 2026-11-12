import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { MAX_ZONES, NO_ZONE, inZone, isDefinedZone, isHomeCell, licencesByParcel, planningZones, sameZones, toggleZone, zoneName, zonesOf } from './planning.ts';

const HOME = '871f1d489ffffff'; // a member's home cell, an h3 index
const SEAFRONT = { id: 'seafront', name: 'Seafront', kind: 'planning' };
const OLD_TOWN = { id: 'old-town', name: 'Old town', kind: 'heritage' };

describe('isHomeCell', () => {
	it('knows an h3 index, as members set it, from a zone the realm defines', () => {
		for (const cell of [HOME, '8001fffffffffff', '8928308280fffff']) assert.equal(isHomeCell(cell), true, cell);
		for (const zone of ['seafront', 'district-3', 'old town', '', '871f1d489fffff', '871f1d489ffffffe', '171f1d489ffffff', '871f1d489fffffg']) assert.equal(isHomeCell(zone), false, zone);
	});
});

describe('isDefinedZone', () => {
	it('believes the realm when it says whether it defined the zone, whatever the id looks like', () => {
		assert.equal(isDefinedZone({ id: 'seafront', defined: true }), true);
		assert.equal(isDefinedZone({ id: HOME, defined: false }), false);
		assert.equal(isDefinedZone({ id: HOME, defined: true }), true);
		assert.equal(isDefinedZone({ id: 'cell-0', defined: false }), false);
	});

	it('reads the shape of the id when the realm does not say', () => {
		assert.equal(isDefinedZone({ id: 'seafront' }), true);
		assert.equal(isDefinedZone({ id: HOME }), false);
		assert.equal(isDefinedZone({ id: 'seafront', defined: 'yes' }), true);
		assert.equal(isDefinedZone(null), true);
	});
});

describe('planningZones', () => {
	it('keeps the zones the realm defines, by name, and leaves the home cells to the map', () => {
		const rows = [{ id: HOME, name: '', kind: 'residential', population: 1 }, OLD_TOWN, SEAFRONT, { id: 'no-name' }, { name: 'no id' }, null];
		assert.deepEqual(planningZones(rows), [{ id: 'no-name', name: '', kind: '' }, OLD_TOWN, SEAFRONT]);
	});

	it('lists the zones the realm says it defined, and not the ones it says are home cells', () => {
		const rows = [
			{ id: 'cell-0', name: 'A cell the realm calls a home', kind: 'x', defined: false },
			{ id: HOME, name: 'Defined with an index for an id', kind: 'planning', defined: true },
		];
		assert.deepEqual(planningZones(rows), [{ id: HOME, name: 'Defined with an index for an id', kind: 'planning' }]);
	});

	it('lists none for a realm that defines none', () => {
		assert.deepEqual(planningZones([]), []);
		assert.deepEqual(planningZones([{ id: HOME, name: 'Home', kind: 'x' }]), []);
	});
});

describe('zonesOf and zoneName', () => {
	it('read the zones a parcel lies in, none for a row without a list of text', () => {
		assert.deepEqual(zonesOf(['seafront', 'old-town']), ['seafront', 'old-town']);
		assert.deepEqual(zonesOf(['seafront', 3, null]), ['seafront']);
		for (const raw of [undefined, null, 'seafront', {}]) assert.deepEqual(zonesOf(raw), []);
	});

	it('name a zone, or give its id when the realm lists no such zone', () => {
		assert.equal(zoneName([SEAFRONT], 'seafront'), 'Seafront');
		assert.equal(zoneName([SEAFRONT], 'gone'), 'gone');
		assert.equal(zoneName([{ id: 'x', name: '', kind: '' }], 'x'), 'x');
	});
});

describe('toggleZone and sameZones', () => {
	it('puts a zone in and takes it out', () => {
		assert.deepEqual(toggleZone([], 'seafront'), ['seafront']);
		assert.deepEqual(toggleZone(['seafront', 'old-town'], 'seafront'), ['old-town']);
	});

	it('refuses a ninth zone, and still lets one out', () => {
		const full = Array.from({ length: MAX_ZONES }, (_, i) => `z${i}`);
		assert.deepEqual(toggleZone(full, 'one-more'), full);
		assert.deepEqual(toggleZone(full, 'z0'), full.slice(1));
	});

	it('compares lists of zones whatever the order', () => {
		assert.equal(sameZones(['a', 'b'], ['b', 'a']), true);
		assert.equal(sameZones(['a'], ['a', 'b']), false);
		assert.equal(sameZones([], []), true);
	});
});

describe('inZone', () => {
	const lands = [
		{ id: 'L-1', zones: ['seafront'] },
		{ id: 'L-2', zones: ['seafront', 'old-town'] },
		{ id: 'L-3', zones: [] },
	];
	it('keeps the parcels that lie in the zone, in none, or all of them', () => {
		assert.deepEqual(inZone(lands, 'seafront').map((l) => l.id), ['L-1', 'L-2']);
		assert.deepEqual(inZone(lands, 'old-town').map((l) => l.id), ['L-2']);
		assert.deepEqual(inZone(lands, NO_ZONE).map((l) => l.id), ['L-3']);
		assert.deepEqual(inZone(lands, '').map((l) => l.id), ['L-1', 'L-2', 'L-3']);
		assert.deepEqual(inZone(lands, 'gone'), []);
	});
});

describe('licencesByParcel', () => {
	it('groups the licences that name a parcel, and leaves out the ones that name none', () => {
		const rows = [
			{ id: 'LIC-1', kind: 'building', holder: 'Organization:Clinic B', status: 'active', expires_at: 1_900_000_000, land: 'L-1' },
			{ id: 'LIC-2', kind: 'health', holder: 'User:alice', status: 'active', expires_at: 0, land: '' },
			{ id: 'LIC-3', kind: 'demolition', holder: 'User:bob', status: 'applied', land: 'L-1' },
			{ id: 'LIC-4', kind: 'building', holder: 'User:bob', status: 'suspended', expires_at: null, land: 'L-2' },
			{ kind: 'no id', land: 'L-1' },
			null,
		];
		const byParcel = licencesByParcel(rows);
		assert.deepEqual([...byParcel.keys()], ['L-1', 'L-2']);
		assert.deepEqual(byParcel.get('L-1')?.map((l) => [l.id, l.status, l.expires_at]), [['LIC-1', 'active', 1_900_000_000], ['LIC-3', 'applied', 0]]);
		assert.equal(byParcel.get('L-2')?.[0].expires_at, 0);
	});

	it('is empty for a realm with no licences', () => {
		assert.equal(licencesByParcel([]).size, 0);
	});
});

describe('the strings in every language', () => {
	const dir = '../../frontend/i18n/locales/extensions/land_registry';
	const strings = (locale: string): Record<string, string> => JSON.parse(readFileSync(new URL(`${dir}/${locale}.json`, import.meta.url), 'utf8'));
	const english = strings('en');
	const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

	it('have the keys and the placeholders of English', () => {
		for (const locale of ['es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia']) {
			const other = strings(locale);
			assert.deepEqual(Object.keys(other).sort(), Object.keys(english).sort(), locale);
			for (const key of Object.keys(english)) assert.deepEqual(placeholders(other[key]), placeholders(english[key]), `${locale} ${key}`);
		}
	});
});
