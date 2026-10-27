export type Reply = { ok: boolean; error?: string; [key: string]: any };

const PAGE = 100;
const MAX_PAGES = 50;
const ACCESS_REFUSAL = /^\S+ needs (\S+)$/;

/** Call a realm operation declared in the manifest; never throws. */
export async function call(
	ctx: any,
	write: boolean,
	name: string,
	args: Record<string, unknown> = {},
): Promise<Reply> {
	try {
		const reply = await (write ? ctx.run(name, args) : ctx.read(name, args));
		if (reply && typeof reply === 'object') return reply;
	} catch (e: any) {
		return { ok: false, error: e?.message || `${name} did not answer` };
	}
	return { ok: false, error: `${name} did not answer` };
}

/** Every row under ``key`` of a paged read (``from``/``count``, continued by ``next``). */
export async function readPages(
	ctx: any,
	name: string,
	key: string,
	args: Record<string, unknown> = {},
): Promise<{ rows: any[]; error: string }> {
	const rows: any[] = [];
	let from: number | null = 1;
	for (let i = 0; from != null && i < MAX_PAGES; i++) {
		const reply = await call(ctx, false, name, { ...args, from, count: PAGE });
		if (!reply.ok) return { rows, error: reply.error || `${name} was refused` };
		if (Array.isArray(reply[key])) rows.push(...reply[key]);
		from = typeof reply.next === 'number' ? reply.next : null;
	}
	return { rows, error: '' };
}

/** The permission a refusal names ("x needs perm"), or null when the reply failed for another reason. */
export function refusedPermission(error: string | undefined, fallback: string): string | null {
	if (!error) return null;
	if (error === 'sign in first') return fallback;
	return error.match(ACCESS_REFUSAL)?.[1] ?? null;
}
