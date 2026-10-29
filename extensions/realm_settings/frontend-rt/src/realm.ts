/** Realm settings groups: each is a setup step and has its own realm_configure operation. */
export const CONFIGURE_OPS = {
	realm: 'realm_configure',
	branding: 'realm_configure_branding',
	tokens: 'realm_configure_tokens',
	infrastructure: 'realm_configure_infrastructure',
	trust_policy: 'realm_configure_trust_policy',
} as const;

export type SettingsGroup = keyof typeof CONFIGURE_OPS;

export interface Change {
	op: string;
	args: Record<string, unknown>;
}

/** During setup the founder sets a group with setup_step; once launched, its realm_configure operation (governed). */
export function configureChange(status: string, group: SettingsGroup, values: Record<string, unknown>): Change {
	return status === 'setup'
		? { op: 'setup_step', args: { step: group, ...values } }
		: { op: CONFIGURE_OPS[group], args: values };
}

/** The permission a refused call needed, from the realm's "<op> needs <permission>" error. */
export function neededPermission(error: string | undefined): string | null {
	return / needs (\S+)$/.exec(error ?? '')?.[1] ?? null;
}

export interface Policy {
	m?: number;
	n?: number;
	quorum_percent?: number;
	veto?: string[];
}

/** Whether a department's policy lets a governed call apply at once instead of becoming a proposal. */
export function isDirect(policy: Policy | null | undefined): boolean {
	const p = policy || {};
	return (p.m ?? 1) <= 1 && (p.n ?? 1) <= 1 && !p.quorum_percent && !p.veto?.length;
}

export function policyLabel(policy: Policy | null | undefined): string {
	return `${policy?.m ?? 1}/${policy?.n ?? 1}`;
}

/** The root department (id and policy), which governs realm configuration once the realm has launched. */
export async function rootDepartment(ctx: any): Promise<{ id: string; policy: Policy } | null> {
	let from: number | null = 1;
	while (from) {
		const page = await ctx.read('department_list', { from, count: 100 });
		if (!page.ok) return null;
		const root = page.departments.find((d: { is_root: boolean }) => d.is_root);
		if (root) {
			const reply = await ctx.read('department_get', { department: root.id });
			return reply.ok ? reply.department : null;
		}
		from = page.next;
	}
	return null;
}
