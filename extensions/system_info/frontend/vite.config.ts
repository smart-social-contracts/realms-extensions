import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
// svelte-package emits dist/*.svelte without lang="ts"; compile from source instead.
const extensionUiSrc = path.resolve(frontendRoot, '../../../../packages/extension-ui/src/lib');

export default defineConfig({
	plugins: [svelte(), tailwindcss()],
	resolve: {
		alias: {
			'@realmsgos/extension-ui': extensionUiSrc,
		},
	},
	base: './',
	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
});
