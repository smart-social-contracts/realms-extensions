import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const locale = (name: string) => JSON.parse(read(`../../frontend/i18n/locales/extensions/codex_viewer/${name}.json`));

// The CLFO's wording for the demo, word for word (.ceo/clfo/launch/demo-environment.md, item 8).
test('the AI line is the approved wording in English and Spanish', () => {
	assert.equal(locale('en').ai_answers_can_be_wrong, 'Answers are written by an AI and can be wrong');
	assert.equal(locale('es').ai_answers_can_be_wrong, 'Las respuestas las escribe una IA y pueden ser erróneas');
});

test('the viewer shows the AI line wherever it offers Explain', () => {
	const viewer = read('./CodexViewer.svelte');
	assert.match(viewer, /\{#if aiAssistantEnabled\}\s*<!--[^>]*-->\s*<p class="ai-notice">\{t\('ai_answers_can_be_wrong'\)\}<\/p>/);
});
