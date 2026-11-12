import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The DOM tests (*.dom.test.ts) mount the page in jsdom. The other tests run on node:test (npm test).
export default defineConfig({
	plugins: [svelte({ emitCss: false })],
	resolve: { conditions: ['browser'] },
	test: { environment: 'jsdom', include: ['src/**/*.dom.test.ts'] },
});
