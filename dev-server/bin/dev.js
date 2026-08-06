#!/usr/bin/env node
/**
 * CLI: realms-ext-dev [ext_id]
 *
 * Starts a Vite dev server for the given extension.
 * - In-process extensions (default): mounts frontend-rt via dev-entry.ts
 * - Sandboxed extensions (manifest runtime: "sandboxed"): mock host + iframe
 *
 * If ext_id is omitted, infers it from the cwd.
 */
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const devServerRoot = resolve(__dirname, '..');
const extensionsRoot = resolve(devServerRoot, '..', 'extensions');
const config = JSON.parse(readFileSync(resolve(devServerRoot, 'dev-config.json'), 'utf-8'));

const EXT_PORT = 5556;
const HOST_PORT = 5555;

function readManifest(extDir) {
	const manifestPath = resolve(extDir, 'manifest.json');
	if (!existsSync(manifestPath)) return null;
	return JSON.parse(readFileSync(manifestPath, 'utf-8'));
}

// Determine extension ID and path
let extId = process.argv[2];
let extDir;
let extFrontend;

if (extId) {
	extDir = resolve(extensionsRoot, extId);
} else {
	const cwd = process.cwd();
	if (cwd.endsWith('frontend') || cwd.endsWith('frontend-rt')) {
		extId = basename(dirname(cwd));
		extDir = dirname(cwd);
	} else if (existsSync(resolve(cwd, 'frontend'))) {
		extId = basename(cwd);
		extDir = cwd;
	} else if (existsSync(resolve(cwd, 'frontend-rt'))) {
		extId = basename(cwd);
		extDir = cwd;
	} else {
		console.error('Usage: realms-ext-dev [ext_id]');
		console.error('  Or run from inside an extension directory.');
		process.exit(1);
	}
}

const manifest = readManifest(extDir);
const isSandboxed = manifest?.runtime === 'sandboxed';

if (isSandboxed) {
	extFrontend = resolve(extDir, 'frontend');
	const indexHtml = resolve(extFrontend, 'index.html');
	if (!existsSync(indexHtml)) {
		console.error(`Sandboxed extension entry not found: ${indexHtml}`);
		process.exit(1);
	}
} else {
	extFrontend = resolve(extDir, 'frontend-rt');
	const indexTs = resolve(extFrontend, 'src', 'index.ts');
	if (!existsSync(indexTs)) {
		console.error(`Extension entry not found: ${indexTs}`);
		process.exit(1);
	}
}

console.log(`\n  Starting dev server for extension: ${extId}`);
console.log(`  Runtime: ${isSandboxed ? 'sandboxed (mock host + iframe)' : 'in-process'}`);
console.log(`  Source: ${extFrontend}/\n`);

if (isSandboxed) {
	const extServer = await createServer({
		configFile: false,
		root: extFrontend,
		plugins: [svelte({ compilerOptions: { dev: false } }), tailwindcss()],
		server: {
			port: EXT_PORT,
			strictPort: true,
			cors: true,
		},
	});

	const iframeUrl = `http://localhost:${EXT_PORT}/`;

	const hostServer = await createServer({
		configFile: false,
		root: devServerRoot,
		plugins: [tailwindcss()],
		define: {
			__EXT_ID__: JSON.stringify(extId),
			__EXT_IFRAME_URL__: JSON.stringify(iframeUrl),
			__MANIFEST__: JSON.stringify({
				runtime: manifest.runtime,
				sdk_version: manifest.sdk_version,
				capabilities: manifest.capabilities ?? [],
				entry_access: manifest.entry_access,
			}),
		},
		resolve: {
			alias: {
				'/__sandbox_dev_entry.ts': resolve(devServerRoot, 'sandbox-dev-entry.ts'),
			},
		},
		server: {
			port: HOST_PORT,
			strictPort: true,
			open: false,
		},
	});

	// Serve sandbox-host.html as the index page
	hostServer.middlewares.use((req, res, next) => {
		if (req.url === '/' || req.url === '/index.html') {
			const html = readFileSync(resolve(devServerRoot, 'sandbox-host.html'), 'utf-8');
			res.setHeader('Content-Type', 'text/html');
			res.end(html);
			return;
		}
		next();
	});

	await extServer.listen();
	await hostServer.listen();

	console.log(`  Extension iframe: ${iframeUrl}`);
	hostServer.printUrls();
} else {
	const indexTs = resolve(extFrontend, 'src', 'index.ts');

	const server = await createServer({
		configFile: false,
		root: devServerRoot,
		plugins: [svelte({ compilerOptions: { dev: false }, emitCss: false }), tailwindcss()],
		define: {
			__EXT_ID__: JSON.stringify(extId),
			__BACKEND_CANISTER_ID__: JSON.stringify(config.backendCanisterId),
			__FILE_REGISTRY_CANISTER_ID__: JSON.stringify(config.fileRegistryCanisterId),
		},
		resolve: {
			alias: {
				'/__ext_index__': indexTs,
				'/__dev_entry.ts': resolve(devServerRoot, 'dev-entry.ts'),
			},
			dedupe: ['svelte'],
		},
		server: {
			port: HOST_PORT,
			open: false,
			watch: { usePolling: true, interval: 500 },
			proxy: {
				'/api': { target: config.host, changeOrigin: true },
				'/custom': { target: config.canisterUrl, changeOrigin: true },
				'/images': { target: config.canisterUrl, changeOrigin: true },
			},
		},
	});

	await server.listen();
	server.printUrls();
}
