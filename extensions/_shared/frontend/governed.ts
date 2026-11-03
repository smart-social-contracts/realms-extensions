/**
 * Helpers for extensions whose actions are governed realm operations: under a department's
 * policy of one approval the operation applies at once, under any other it opens a proposal.
 */

export interface Governor {
	name: string;
	policy: string;
	/** True when the department's policy needs no vote. */
	direct: boolean;
}

type Read = (name: string, args?: Record<string, unknown>) => Promise<any>;

/** The approval policy of ``department``, read through ``department_get``. */
export async function governorOf(read: Read, department: string): Promise<Governor> {
	const p = (await read('department_get', { department })).department.policy ?? {};
	const m = p.m ?? 1;
	const n = p.n ?? 1;
	const quorum = p.quorum_percent ?? 0;
	const veto = p.veto ?? [];
	const extras = [quorum ? `quorum ${quorum}%` : '', veto.length ? 'veto' : ''].filter(Boolean);
	return {
		name: department,
		policy: extras.length ? `${m}/${n} (${extras.join(', ')})` : `${m}/${n}`,
		direct: m <= 1 && n <= 1 && !quorum && !veto.length,
	};
}

/**
 * The reply of a governed operation: false after an error or when it opened a vote instead of
 * applying; the user is told which.
 */
export function applied(
	res: any,
	notify: (message: string, type?: 'success' | 'error') => void,
	failure: string,
	later = '',
): boolean {
	if (!res.ok) {
		notify(res.error || failure, 'error');
		return false;
	}
	if (res.requires_vote) {
		notify(`Proposal ${res.proposal} created — a vote is required${later}`);
		return false;
	}
	return true;
}
