// The connectors: every few seconds, one pass over the ERP's payment runs that wait for the realm.
//
//   npm start -- erpnext          or   npm start -- odoo          (settings in .env: see README.md)
//   npm start -- odoo --once      one pass, then exit

import { readFileSync, existsSync } from 'node:fs';
import { erpNextAt } from './erpnext/client.ts';
import { step as erpnextStep } from './erpnext/run.ts';
import { odooAt } from './odoo/client.ts';
import { step as odooStep } from './odoo/run.ts';
import { connectRealm, identityAt } from './realm-client.ts';

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

const erp = process.argv[2];
if (erp !== 'erpnext' && erp !== 'odoo') throw new Error('name the ERP: npm start -- erpnext, or npm start -- odoo');
const config = settings(new URL('../.env', import.meta.url).pathname);
const identity = identityAt(need(config, 'REALM_IDENTITY'));
console.log(`${erp} connector, principal ${identity.getPrincipal().toText()}`);
const realm = await connectRealm(need(config, 'REALM_HOST'), need(config, 'REALM_CANISTER'), identity);
const treasury = config.REALM_TREASURY || 'Treasury';
const log = (line: string) => console.log(`${new Date().toISOString().slice(11, 19)} ${line}`);

let pass: () => Promise<void>;
if (erp === 'erpnext') {
	const env = {
		erp: erpNextAt(need(config, 'ERPNEXT_URL'), need(config, 'ERPNEXT_KEY'), need(config, 'ERPNEXT_SECRET')),
		realm, treasury, log, software: { name: 'Realms ERPNext connector', version: '0.1.0' }, now: () => new Date(),
	};
	pass = () => erpnextStep(env);
} else {
	const odoo = await odooAt(need(config, 'ODOO_URL'), need(config, 'ODOO_DB'), need(config, 'ODOO_LOGIN'), need(config, 'ODOO_PASSWORD'));
	pass = () => odooStep({ odoo, realm, treasury, log });
}

if (process.argv.includes('--once')) {
	await pass();
} else {
	const every = Number(config.POLL_SECONDS || 10) * 1000;
	for (;;) {
		await pass().catch((e) => log(`pass failed: ${(e as Error).message}`));
		await new Promise((r) => setTimeout(r, every));
	}
}
