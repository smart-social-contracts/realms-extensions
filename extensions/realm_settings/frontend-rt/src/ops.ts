/** Calls to the realm's slim operations (ctx.read / ctx.run), declared in manifest.json "operations". */

export type Reply = { ok: boolean; error?: string; [key: string]: any };

export type OpCall = (write: boolean, name: string, args?: Record<string, unknown>) => Promise<Reply>;

/** A refusal for lack of permission: "<principal> needs <permission>" or "sign in first". */
const ACCESS_REFUSAL = /^\S+ needs (\S+)$/;

/** The permission a refused reply asks for ('' when the caller must sign in), or null for any other failure. */
export function refusedPermission(reply: Reply | null | undefined): string | null {
	const error = String(reply?.error ?? '');
	if (error === 'sign in first') return '';
	return error.match(ACCESS_REFUSAL)?.[1] ?? null;
}

/** The proposal id a governed operation filed instead of applying ("P-3"), or ''. */
export function proposalOf(reply: Reply | null | undefined): string {
	return reply?.ok && typeof reply.proposal === 'string' && reply.requires_vote ? reply.proposal : '';
}

/** An operation caller for ``ctx`` that never throws: failures come back as ``{ ok: false, error }``. */
export function opCaller(ctx: any): OpCall {
	return async (write, name, args = {}) => {
		try {
			const reply = await (write ? ctx.run(name, args) : ctx.read(name, args));
			if (reply && typeof reply === 'object') return reply as Reply;
		} catch (e: any) {
			return { ok: false, error: e?.message || `${name} did not answer` };
		}
		return { ok: false, error: `${name} did not answer` };
	};
}

/** A neutral sentence for a refused or failed write. */
export function refusalText(reply: Reply, fallback: string): string {
	const needs = refusedPermission(reply);
	if (needs === '') return 'Sign in to make this change.';
	if (needs) return `This change needs the ${needs} permission.`;
	return reply.error || fallback;
}

/**
 * The realm's settings row. ``realm_export`` (a read) gives every field; during setup the founder lacks
 * db.export, so ``setup_state`` (realm.configure) answers instead; anyone else gets the public ``realm_info``.
 * ``full`` is false when only the public fields are known.
 */
export async function loadRealmRow(call: OpCall): Promise<{ realm: Record<string, any>; full: boolean }> {
	const exported = await call(false, 'realm_export', { entity: 'Realm', count: 1 });
	const row = exported.ok && Array.isArray(exported.rows) ? exported.rows[0] : null;
	if (row && typeof row === 'object') return { realm: row, full: true };
	const setup = await call(true, 'setup_state');
	if (setup.ok && setup.realm && typeof setup.realm === 'object') {
		return { realm: { ...setup.realm, status: setup.status }, full: true };
	}
	const info = await call(false, 'realm_info');
	return { realm: info.ok && info.realm && typeof info.realm === 'object' ? info.realm : {}, full: false };
}
