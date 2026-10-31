/**
 * Calls to the AI assistant service as the signed-in user.
 *
 * The realm frontend signs the user in (`ctx.ai.session()`) and hands over only a token for this
 * service. Every call except the public persona list sends it as a Bearer token.
 */

export type AiHost = {
	session: (options?: { renew?: boolean }) => Promise<{ token: string }>;
};

/** The user cannot be signed in to the assistant: signed out, or the service refused the proof. */
export class AiSignInError extends Error {}

const OUTDATED_REALM_MESSAGE = 'This realm needs updating before the AI assistant can sign you in.';

async function bearerToken(ai: AiHost | undefined, renew: boolean): Promise<string> {
	if (!ai) throw new AiSignInError(OUTDATED_REALM_MESSAGE);
	try {
		return (await ai.session({ renew })).token;
	} catch (err) {
		throw new AiSignInError(err instanceof Error ? err.message : String(err));
	}
}

/** `fetch` with the user's Bearer token; one retry with a fresh session if the service says 401. */
export async function fetchAsUser(
	ai: AiHost | undefined,
	url: string,
	init: RequestInit = {},
): Promise<Response> {
	const send = async (renew: boolean) =>
		fetch(url, {
			...init,
			headers: { ...init.headers, Authorization: `Bearer ${await bearerToken(ai, renew)}` },
		});
	const response = await send(false);
	return response.status === 401 ? send(true) : response;
}
