import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

// The screen is a page of its own, loaded in the realm's sandboxed iframe (index.html + assets/). Shared code under
// _shared/ resolves svelte and the bridge from here, so that the page has one copy of each.
export default defineConfig({
	plugins: [svelte(), tailwindcss()],
	base: './',
	resolve: { dedupe: ['svelte', '@realmsgos/extension-bridge'] },
	build: { outDir: 'dist', emptyOutDir: true, target: 'es2020' },
});
