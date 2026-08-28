import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	buildLetterJoinUrl,
	isRawCanisterHost,
	letterJoinUrlFromWindow,
	parseRealmSlugFromPath,
	resolveLetterJoinLocation,
} from './letterJoinUrl.ts';
import { encodeJoinQr } from './letterQr.ts';
import { letterPrintModel, prepareLetterForPdf } from './letterPdf.ts';

describe('parseRealmSlugFromPath / canister host', () => {
	it('reads /r/<slug> and ignores canister hosts', () => {
		assert.equal(parseRealmSlugFromPath('/r/acme-demo/extensions/import_export'), 'acme-demo');
		assert.equal(parseRealmSlugFromPath('/extensions/import_export'), null);
		assert.equal(isRawCanisterHost('abcd-cai.icp0.io'), true);
		assert.equal(isRawCanisterHost('staging.gos.earth'), false);
		assert.equal(isRawCanisterHost('test.gos.earth'), false);
	});
});

describe('letter join URL', () => {
	it('prints portal host+slug /join?code= from the page the realm is served on', () => {
		const staging = resolveLetterJoinLocation({
			origin: 'https://staging.gos.earth',
			pathname: '/r/acme-demo/extensions/import_export',
		});
		assert.equal(staging.via, 'portal');
		assert.equal(
			buildLetterJoinUrl('ONE-USE-1', staging),
			'https://staging.gos.earth/r/acme-demo/join?code=ONE-USE-1',
		);

		const testHost = resolveLetterJoinLocation({
			origin: 'https://test.gos.earth',
			pathname: '/r/acme-demo/join',
		});
		assert.equal(
			buildLetterJoinUrl('ONE-USE-1', testHost),
			'https://test.gos.earth/r/acme-demo/join?code=ONE-USE-1',
		);

		const custom = resolveLetterJoinLocation({
			origin: 'https://portal.example.org',
			pathname: '/r/acme-demo/extensions/import_export',
		});
		assert.equal(
			buildLetterJoinUrl('ONE-USE-1', custom),
			'https://portal.example.org/r/acme-demo/join?code=ONE-USE-1',
		);
	});

	it('uses parent portal host+slug when the letter UI is the canister iframe', () => {
		const loc = resolveLetterJoinLocation({
			origin: 'https://frontend-cai.icp0.io',
			pathname: '/extensions/import_export',
			search: '?portal=1&slug=acme-demo',
			ancestorOrigins: ['https://staging.gos.earth'],
			referrer: 'https://staging.gos.earth/r/acme-demo/extensions/import_export',
			portalUrl: 'https://staging.gos.earth',
		});
		assert.equal(loc.via, 'portal');
		assert.equal(loc.slug, 'acme-demo');
		assert.equal(
			buildLetterJoinUrl('ABC', loc),
			'https://staging.gos.earth/r/acme-demo/join?code=ABC',
		);
	});

	it('does not invent gos.earth on a CLI-only canister (no portal host/slug)', () => {
		const loc = resolveLetterJoinLocation({
			origin: 'https://frontend-cai.icp0.io',
			pathname: '/extensions/import_export',
			search: '',
			portalUrl: 'https://staging.gos.earth',
		});
		assert.equal(loc.via, 'fallback');
		assert.equal(loc.slug, null);
		const url = buildLetterJoinUrl('CLI-1', loc);
		assert.equal(url, 'https://frontend-cai.icp0.io/join?code=CLI-1');
		assert.ok(!url.includes('gos.earth'));
		assert.ok(!url.includes('/r/'));
	});

	it('ignores baked portal_url unless the iframe is actually embedded', () => {
		const loc = resolveLetterJoinLocation({
			origin: 'https://frontend-cai.icp0.io',
			pathname: '/extensions/import_export',
			search: '',
			portalUrl: 'https://staging.gos.earth',
		});
		assert.equal(buildLetterJoinUrl('X', loc), 'https://frontend-cai.icp0.io/join?code=X');
	});

	it('may use configured portal_url only when portal=1 and slug are present', () => {
		const loc = resolveLetterJoinLocation({
			origin: 'https://frontend-cai.icp0.io',
			pathname: '/extensions/import_export',
			search: '?portal=1&slug=acme-demo',
			portalUrl: 'https://test.gos.earth',
		});
		assert.equal(
			buildLetterJoinUrl('Z', loc),
			'https://test.gos.earth/r/acme-demo/join?code=Z',
		);
	});

	it('overrides a raw canister join_path from the host mint', () => {
		const joinUrl = letterJoinUrlFromWindow('HOST-1', {
			location: {
				origin: 'https://frontend-cai.icp0.io',
				pathname: '/extensions/import_export',
				search: '?portal=1&slug=acme-demo',
				ancestorOrigins: ['https://staging.gos.earth'],
			},
			document: { referrer: 'https://staging.gos.earth/r/acme-demo/extensions/import_export' },
		});
		assert.equal(joinUrl, 'https://staging.gos.earth/r/acme-demo/join?code=HOST-1');
		const printed = letterPrintModel({
			id: 'C-1',
			name: 'Ada',
			address: '1 Street',
			code: 'HOST-1',
			join_path: 'https://frontend-cai.icp0.io/join',
			join_url: joinUrl,
		});
		assert.equal(printed.joinUrl, 'https://staging.gos.earth/r/acme-demo/join?code=HOST-1');
		assert.ok(!printed.joinUrl.includes('icp0.io'));
	});
});

describe('local QR', () => {
	it('encodes the same portal URL without calling the network', () => {
		const url = 'https://staging.gos.earth/r/acme-demo/join?code=ONE-USE-1';
		const calls: unknown[][] = [];
		const original = globalThis.fetch;
		globalThis.fetch = ((...args: unknown[]) => {
			calls.push(args);
			throw new Error('QR must not fetch');
		}) as typeof fetch;
		try {
			const qr = encodeJoinQr(url);
			assert.ok(qr.size >= 21);
			assert.equal(qr.modules.length, qr.size);
			assert.equal(qr.modules[0]?.length, qr.size);
			assert.equal(qr.modules[0]?.[0], true);
			assert.equal(calls.length, 0);

			const prepared = prepareLetterForPdf({
				id: 'C-1',
				name: 'Ada',
				address: '1 Street',
				code: 'ONE-USE-1',
				join_path: 'https://frontend-cai.icp0.io/join',
				join_url: url,
			});
			assert.equal(prepared.join_url, url);
			assert.equal(prepared.qr.size, qr.size);
			assert.equal(calls.length, 0);
		} finally {
			globalThis.fetch = original;
		}
	});
});
