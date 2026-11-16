import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { citedLegislation, explainQuestion, MOST_CITATION_CHARS, MOST_CITATIONS } from './explain.ts';

describe('citedLegislation', () => {
	it('reads the legislation a chapter cites, in order and without repeats', () => {
		const code = [
			'class DataProtection(above("data_protection")):',
			'    @rule(legislation="GDPR Art. 5")',
			'    def minimise(self): ...',
			"    @rule(legislation='GDPR Art. 6')",
			'    @rule(legislation="GDPR Art. 5")',
			'    def lawful(self): ...',
		].join('\n');

		assert.deepEqual(citedLegislation(code), ['GDPR Art. 5', 'GDPR Art. 6']);
	});

	it("cuts a citation long enough to push the question's own words out", () => {
		// The citation is written in the chapter, so its length is the chapter author's; the question is the
		// reader's voice, and the portal cuts the whole message at 2,000 characters.
		const long = 'Ley ' + 'muy largo '.repeat(500);
		const [cited] = citedLegislation(`@rule(legislation="${long}")`);

		assert.equal(cited.length, MOST_CITATION_CHARS);
		assert.ok(cited.endsWith('…'));
		assert.ok(long.startsWith(cited.slice(0, -1)));

		const question = explainQuestion({ file: 'eu/es/tax.py', layer: 'eu/es', standing: 'runs', legislation: [cited] });
		assert.ok(question.length < 300);
		assert.match(question, /what it allows, what it forbids, and why\.$/);
	});

	it('never cuts a citation in the middle of a character', () => {
		// Cut by code point: half of a surrogate pair would travel to the assistant's backend inside the question,
		// and some OpenAI-compatible backends refuse a request that holds a lone surrogate.
		const [cited] = citedLegislation(`@rule(legislation="${'L'.repeat(78)}𝔸 and more")`);

		assert.equal(Array.from(cited).length, MOST_CITATION_CHARS);
		assert.ok(cited.endsWith('…'));
		assert.ok(cited.isWellFormed());
	});

	it('writes a citation on one line, whatever spacing it was written with', () => {
		// A citation cannot hold a newline: the `legislation="…"` match stops at one, so it is never found at all.
		// Runs of spaces and tabs can be in one, and the question is one line of the reader's own voice.
		assert.deepEqual(citedLegislation('@rule(legislation="Ley 7/1985,\t  Art. 25")'), ['Ley 7/1985, Art. 25']);
		assert.deepEqual(citedLegislation('@rule(legislation="Ley 7/1985,\n   Art. 25")'), []);
	});

	it('stops at the few it names', () => {
		const code = ['a', 'b', 'c', 'd', 'e']
			.map((letter) => `@rule(legislation="Law ${letter}")`)
			.join('\n');

		assert.equal(citedLegislation(code).length, MOST_CITATIONS);
		assert.deepEqual(citedLegislation(code, 2), ['Law a', 'Law b']);
	});

	it('finds nothing in a chapter that cites nothing', () => {
		assert.deepEqual(citedLegislation('def allow(): return True'), []);
		assert.deepEqual(citedLegislation(''), []);
		assert.deepEqual(citedLegislation('legislation = None'), []);
	});
});

describe('explainQuestion', () => {
	it('asks about the whole chapter by its file, its layer and what it cites', () => {
		assert.equal(
			explainQuestion({
				file: 'eu/data_protection.py',
				layer: 'eu',
				standing: 'runs',
				legislation: ['GDPR Art. 5', 'GDPR Art. 6'],
			}),
			'Explain eu/data_protection.py (layer eu, runs here; cites GDPR Art. 5, GDPR Art. 6): ' +
				'what it allows, what it forbids, and why.',
		);
	});

	it('asks about the lines selected', () => {
		assert.equal(
			explainQuestion({
				file: 'eu/es/tax.py',
				layer: 'eu/es',
				standing: 'runs',
				range: { startLine: 9, endLine: 31 },
			}),
			'Explain lines 9-31 of eu/es/tax.py (layer eu/es, runs here): ' +
				'what they allow, what they forbid, and why.',
		);
	});

	it('asks about one line as one line', () => {
		assert.match(
			explainQuestion({
				file: 'eu/es/tax.py',
				layer: 'eu/es',
				standing: 'runs',
				range: { startLine: 9, endLine: 9 },
			}),
			/^Explain line 9 of eu\/es\/tax\.py .*what it allows/,
		);
	});

	it('says a chapter is what the running one builds on — never that it is overridden', () => {
		const question = explainQuestion({
			file: 'eu/data_protection.py',
			layer: 'eu',
			standing: 'builds_on',
			runsFile: 'eu/es/data_protection.py',
		});

		assert.match(question, /layer eu, what eu\/es\/data_protection\.py builds on/);
		assert.doesNotMatch(question, /overrid/i);
	});

	it('says when the realm does not run the layer at all', () => {
		assert.match(
			explainQuestion({ file: 'eu/procedure.py', layer: 'eu', standing: 'not_run' }),
			/\(layer eu, a layer this realm does not run\)/,
		);
	});

	it('asks a calendar what dates it sets, not what it allows', () => {
		const question = explainQuestion({
			file: 'eu/es/calendar.json',
			layer: 'eu/es',
			standing: 'runs',
			language: 'json',
		});

		assert.match(question, /what dates it sets and what they are for/);
		assert.doesNotMatch(question, /forbids/);
	});

	it('says of a codex of the earlier kind that the realm no longer runs it', () => {
		// Not "an earlier codex": a reverted row is usually the newer version, and the realm does not run it either.
		const question = explainQuestion({ file: 'agora@1.1.0', layer: '', standing: 'no_longer_run' });

		assert.equal(
			question,
			'Explain agora@1.1.0 (a codex this realm no longer runs): what it allows, what it forbids, and why.',
		);
		assert.doesNotMatch(question, /runs here/);
		assert.doesNotMatch(question, /overrid/i);
	});

	it('says when the text is not there because it failed its check', () => {
		const question = explainQuestion({
			file: 'eu/tax.py',
			layer: 'eu',
			standing: 'not_run',
			unverified: true,
		});

		assert.match(question, /^Explain eu\/tax\.py \(layer eu, a layer this realm does not run\): /);
		assert.match(question, /did not match the digest its release pins, so it is not here\.$/);
	});

	it('leaves out a layer a codex of the earlier kind does not have', () => {
		assert.equal(
			explainQuestion({ file: 'tax_collection.py', layer: '', standing: 'runs' }),
			'Explain tax_collection.py (runs here): what it allows, what it forbids, and why.',
		);
	});
});
