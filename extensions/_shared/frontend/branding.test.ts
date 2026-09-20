import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	CUSTOM_BACKGROUND,
	CUSTOM_LOGO,
	isValidHexColor,
	resolvePublicAssetUrl,
	snapshotEquals,
} from './branding.ts';

describe('resolvePublicAssetUrl', () => {
	it('prefers the saved URL over the same-origin fallback', () => {
		assert.equal(
			resolvePublicAssetUrl('https://example.com/park.png', CUSTOM_BACKGROUND),
			'https://example.com/park.png',
		);
	});

	it('falls back when the saved URL is empty', () => {
		assert.equal(resolvePublicAssetUrl('', CUSTOM_LOGO), CUSTOM_LOGO);
		assert.equal(resolvePublicAssetUrl('   ', CUSTOM_BACKGROUND), CUSTOM_BACKGROUND);
		assert.equal(resolvePublicAssetUrl(undefined, CUSTOM_LOGO), CUSTOM_LOGO);
	});
});

describe('isValidHexColor', () => {
	it('accepts #RRGGBB', () => {
		assert.equal(isValidHexColor('#F73036'), true);
		assert.equal(isValidHexColor('#3b82f6'), true);
	});

	it('rejects short or named colors', () => {
		assert.equal(isValidHexColor('#fff'), false);
		assert.equal(isValidHexColor('red'), false);
	});
});

describe('snapshotEquals', () => {
	it('compares JSON-stable values', () => {
		assert.equal(snapshotEquals(['en'], ['en']), true);
		assert.equal(snapshotEquals(['en'], ['de']), false);
	});
});
