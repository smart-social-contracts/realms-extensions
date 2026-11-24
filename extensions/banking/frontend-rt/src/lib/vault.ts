// The one place the Banking screen touches keys and the plaintext of an encrypted record. Bank details (IBAN, name at
// the bank, postal address) and the files that carry them are sealed for the treasury's staff and opened only here.
//
// Today the screen runs in the realm's page and this is the host's ``ctx.crypto``, which derives the caller's vetKey
// in the page. If the extension is sandboxed, these two calls become host capabilities instead ("seal for these
// principals", "open this document for me"), so that the user's vetKey never enters the frame: swap ``hostVault`` for
// a bridge client and nothing else in the extension changes.

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

export class VaultUnavailable extends Error {}

export function hostVault(ctx: any): Vault {
	const crypto = ctx?.crypto;
	return {
		async seal(recipients, data) {
			if (typeof crypto?.encryptForRecipients !== 'function') throw new VaultUnavailable('this realm offers no encryption');
			const plan = await crypto.encryptForRecipients([...new Set(recipients)], data);
			return { ciphertext: plan.ciphertext, keys: plan.wrappedDeks };
		},
		async open<T>(wrappedKey: string, ciphertext: string) {
			if (!wrappedKey) return null;
			if (typeof crypto?.decryptWithEnvelope !== 'function') throw new VaultUnavailable('this realm offers no encryption');
			return (await crypto.decryptWithEnvelope(wrappedKey, ciphertext)) as T | null;
		},
	};
}
