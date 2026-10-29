/**
 * The realm of dev-config.json, called as the deterministic test identity through its two
 * endpoints: `read` (query) and `run`, each taking an operation name and JSON arguments.
 */
import { Actor, HttpAgent } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { idlFactory } from './realm_backend.did.js';

export type Reply = { ok: true; [key: string]: any } | { ok: false; error: string };
type Operation = (name: string, args?: Record<string, unknown>) => Promise<Reply>;

/** Matches src/realm_frontend/src/lib/test-identities.js seed layout. */
function testIdentitySeed(index: number): Uint8Array {
	const seed = new Uint8Array(32);
	seed[0] = 0xed;
	seed[1] = 0x57;
	seed[2] = index & 0xff;
	seed[3] = (index >>> 8) & 0xff;
	seed[4] = (index >>> 16) & 0xff;
	seed[5] = (index >>> 24) & 0xff;
	return seed;
}

function normalizeTestIdentityIndex(index: number): number {
	const parsed = Math.floor(Number(index));
	if (!Number.isFinite(parsed)) return 0;
	return Math.max(0, Math.min(0xffffffff, parsed));
}

export function connectRealm(canisterId: string, identityIndex: number) {
	const identity = Ed25519KeyIdentity.generate(testIdentitySeed(normalizeTestIdentityIndex(identityIndex)));
	const agent = new HttpAgent({ identity, verifyQuerySignatures: false });
	// Created on the first call, so the extension still mounts when no canister is configured.
	let actor: any;
	const endpoint =
		(method: 'read' | 'run'): Operation =>
		async (name, args = {}) => {
			actor ??= Actor.createActor(idlFactory, { agent, canisterId });
			return JSON.parse(await actor[method](name, JSON.stringify(args)));
		};
	return { principal: identity.getPrincipal().toText(), read: endpoint('read'), run: endpoint('run') };
}

export type Realm = ReturnType<typeof connectRealm>;

/** `read` / `run` limited to the operations the extension's manifest declares, as the host does. */
export function declaredOperations(realm: Realm, extension: string, operations: string[]) {
	const declared = new Set(operations);
	const operation =
		(call: Operation): Operation =>
		async (name, args = {}) =>
			declared.has(name)
				? call(name, args)
				: { ok: false, error: `${extension} does not declare the operation ${name} in its manifest` };
	return { read: operation(realm.read), run: operation(realm.run) };
}

/** A backend function of `extension` through the realm's `extension_call`: its return value, or throws. */
export function backendCaller(realm: Realm, extension: string) {
	return async (fn: string, args: Record<string, unknown> = {}): Promise<unknown> => {
		const reply = await realm.run('extension_call', { extension, function: fn, args });
		if (!reply.ok) throw new Error(reply.error);
		return reply.result;
	};
}
