// The one place the Banking screen touches the plaintext of an encrypted record. Bank details (IBAN, name at the bank,
// postal address) and the files that carry them are sealed for the treasury's staff and opened only here.
//
// The screen runs in a sandboxed frame and holds no key: the realm's page seals and opens records for it (the bridge's
// capability ``vault``), with the member's vetKey, which never enters the frame.

export interface Sealed {
	ciphertext: string;
	/** principal → the record's key wrapped for that principal. */
	keys: Record<string, string>;
}

export interface Vault {
	/** ``data`` encrypted with a fresh key, wrapped for each of ``recipients``. */
	seal(recipients: string[], data: unknown): Promise<Sealed>;
	/** The record, opened with the key wrapped for the caller; null when the caller holds no key to it. */
	open<T>(wrappedKey: string, ciphertext: string): Promise<T | null>;
}

/** ``data`` as plain JSON: what crosses to the host is copied by ``postMessage``, which cannot copy the screen's reactive
 * state (Svelte's proxies), and what the realm stores is JSON anyway. */
export function plain<T>(data: T): T {
	return data === undefined ? data : JSON.parse(JSON.stringify(data));
}

/** The host's vault, through the bridge client of the sandboxed frame. */
export function bridgeVault(client: {
	vault: { seal(recipients: string[], data: unknown): Promise<Sealed>; open(wrappedKey: string, ciphertext: string): Promise<unknown> };
}): Vault {
	return {
		async seal(recipients, data) {
			const sealed = await client.vault.seal([...new Set(recipients)], plain(data));
			return { ciphertext: sealed.ciphertext, keys: sealed.keys };
		},
		async open<T>(wrappedKey: string, ciphertext: string) {
			if (!wrappedKey) return null;
			return ((await client.vault.open(wrappedKey, ciphertext)) ?? null) as T | null;
		},
	};
}
