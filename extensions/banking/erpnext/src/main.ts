// The connector: every few seconds, one pass over the ERPNext payment runs that wait for the realm.
//
//   npm start            (reads .env next to package.json: see README.md)
//   npm start -- --once  (one pass, then exit)

import { readFileSync, existsSync } from 'node:fs';
import { erpNextAt } from './erpnext.ts';
import { connectRealm, identityAt } from './realm-client.ts';
import { step } from './run.ts';

/** KEY=value lines of ``path`` under the environment, which wins. */
function settings(path: string): Record<string, string> {
	const file = existsSync(path) ? readFileSync(path, 'utf8') : '';
	const pairs = file.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/=(.*)/s));
	return { ...Object.fromEntries(pairs.map(([k, v]) => [k.trim(), (v ?? '').trim()])), ...(process.env as Record<string, string>) };
}

function need(config: Record<string, string>, key: string): string {
	if (!config[key]) throw new Error(`${key} is not set (in .env or the environment)`);
	return config[key];
}

const config = settings(new URL('../.env', import.meta.url).pathname);
const identity = identityAt(need(config, 'REALM_IDENTITY'));
console.log(`connector principal: ${identity.getPrincipal().toText()}`);
const env = {
	erp: erpNextAt(need(config, 'ERPNEXT_URL'), need(config, 'ERPNEXT_KEY'), need(config, 'ERPNEXT_SECRET')),
	realm: await connectRealm(need(config, 'REALM_HOST'), need(config, 'REALM_CANISTER'), identity),
	treasury: config.REALM_TREASURY || 'Treasury',
	software: { name: 'Realms ERPNext connector', version: '0.1.0' },
	now: () => new Date(),
	log: (line: string) => console.log(`${new Date().toISOString().slice(11, 19)} ${line}`),
};

if (process.argv.includes('--once')) {
	await step(env);
} else {
	const every = Number(config.POLL_SECONDS || 10) * 1000;
	for (;;) {
		await step(env).catch((e) => env.log(`pass failed: ${(e as Error).message}`));
		await new Promise((r) => setTimeout(r, every));
	}
}
