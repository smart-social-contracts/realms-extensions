// The realm as the connector reaches it: the realm backend's two methods, ``read`` (a query) and ``run`` (an update),
// each taking an operation's name and its arguments as JSON, called with the connector's own key. The replies are
// handed to the Banking extension's realmOf, so a refusal is the same Refused error the screen sees.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { realmOf, type Realm } from '../../frontend-rt/src/lib/realm.ts';

const idlFactory = ({ IDL }: { IDL: any }) =>
	IDL.Service({
		read: IDL.Func([IDL.Text, IDL.Text], [IDL.Text], ['query']),
		run: IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
	});

/** The connector's key, made on first use and kept in ``path``: the realm knows the connector by its principal. */
export function identityAt(path: string): Ed25519KeyIdentity {
	if (!existsSync(path)) writeFileSync(path, JSON.stringify(Ed25519KeyIdentity.generate().toJSON()), { mode: 0o600 });
	return Ed25519KeyIdentity.fromJSON(readFileSync(path, 'utf8'));
}

/** The realm at ``host`` (a local replica fetches its root key; mainnet does not). */
export async function connectRealm(host: string, canisterId: string, identity: Ed25519KeyIdentity): Promise<Realm> {
	const local = /^http:\/\/(127\.0\.0\.1|localhost)/.test(host);
	const agent = await HttpAgent.create({ host, identity, shouldFetchRootKey: local });
	const actor: any = Actor.createActor(idlFactory, { agent, canisterId });
	const call = (method: 'read' | 'run') => async (name: string, args: Record<string, unknown> = {}) =>
		JSON.parse(await actor[method](name, JSON.stringify(args)));
	return realmOf({ read: call('read'), run: call('run') });
}
