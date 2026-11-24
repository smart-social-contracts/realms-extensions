import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { el, find, leaf, parse, serialize, textAt } from './xml.ts';

describe('serialize', () => {
	it('escapes text, and leaves out empty elements and elements with nothing left in them', () => {
		const doc = el('A', leaf('B', 'Fish & <Chips>'), leaf('C', ''), el('D', leaf('E', undefined)), leaf('F', 0));
		assert.equal(
			serialize(doc!, { xmlns: 'urn:x' }),
			'<?xml version="1.0" encoding="UTF-8"?>\n<A xmlns="urn:x">\n  <B>Fish &amp; &lt;Chips&gt;</B>\n  <F>0</F>\n</A>\n',
		);
	});
});

describe('parse', () => {
	it('reads elements, attributes, entities and CDATA, without namespace prefixes', () => {
		const root = parse('<?xml version="1.0"?><!-- c --><x:Doc xmlns:x="urn:x"><x:Amt Ccy="CHF">1.50</x:Amt>' +
			'<N>A &amp; B &#233;</N><C><![CDATA[<raw>]]></C><E/></x:Doc>');
		assert.equal(root.name, 'Doc');
		assert.equal(find(root, 'Amt')?.attrs.Ccy, 'CHF');
		assert.equal(textAt(root, 'N'), 'A & B é');
		assert.equal(textAt(root, 'C'), '<raw>');
		assert.ok(find(root, 'E'));
	});

	it('refuses a DOCTYPE and a document that is not well-formed', () => {
		assert.throws(() => parse('<!DOCTYPE x [<!ENTITY a "b">]><x>&a;</x>'), /DOCTYPE/);
		assert.throws(() => parse('<a><b></a>'));
		assert.throws(() => parse('<a>'));
		assert.throws(() => parse('<a/><b/>'));
		assert.throws(() => parse('<a>&nope;</a>'), /unknown entity/);
	});
});
