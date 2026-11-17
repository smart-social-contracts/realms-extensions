/**
 * Asking the realm to sign an issue: `journal_sign`, which anyone may call, signed in or not (realms-gos,
 * docs/codices/journal-signature.md). A realm signs an issue when someone asks, once, and keeps the signature.
 */

/** How asking ended: the issue is signed (now, or it was), the realm refused or could not, or it is still being signed. */
export type Outcome = { state: 'signed' } | { state: 'refused'; reason: string } | { state: 'pending' };

/** How many times a day being signed by another call is asked about again, and the wait between them. */
export const PENDING_RETRIES = 10;
export const PENDING_WAIT_MS = 3000;

const sleep = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

/**
 * Ask for the signature of `day` through `ask`, which calls `journal_sign`. The realm answers `signed` with the proof, or
 * `pending` while another call is signing that day: then ask again in a moment, which costs the realm nothing once it is
 * signed, and calls `waiting` so that the page can say so. A refusal (the day is not closed, the realm lacks cycles) or a
 * failed call is the reason to show. After `PENDING_RETRIES` more asks it gives up as `pending`.
 */
export async function requestSignature(
	ask: (day: string) => Promise<any>,
	day: string,
	waiting: () => void = () => {},
	wait: (ms: number) => Promise<void> = sleep,
): Promise<Outcome> {
	for (let attempt = 0; attempt <= PENDING_RETRIES; attempt++) {
		let reply: any;
		try {
			reply = await ask(day);
		} catch (error: any) {
			return { state: 'refused', reason: error?.message ?? String(error) };
		}
		if (!reply?.ok) return { state: 'refused', reason: reply?.error ?? '' };
		if (reply.status === 'signed') return { state: 'signed' };
		waiting();
		await wait(PENDING_WAIT_MS);
	}
	return { state: 'pending' };
}
