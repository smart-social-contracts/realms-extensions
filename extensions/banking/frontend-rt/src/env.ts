// What every tab of the screen shares: the realm, the vault, the treasury the user acts for, and how to tell them.
import { decimalsOf } from './lib/order.ts';
import type { Realm, Treasury } from './lib/realm.ts';
import type { Vault } from './lib/vault.ts';

/** A bank account as its form holds it, every field text. ``iban`` where the account's country numbers accounts by
 * IBAN; otherwise ``number`` and the bank's clearing ``code`` (lib/countries.ts). */
export type AccountForm = {
	name: string; iban: string; number: string; code: string; bic: string;
	street: string; building: string; postCode: string; town: string; country: string;
};

export interface Env {
	realm: Realm;
	vault: Vault;
	treasury: Treasury;
	me: string;
	language: string;
	notify: (level: 'success' | 'info' | 'warning' | 'error', message: string) => void;
	version: string;
	/** Hand ``text`` to the member as a file to save. The frame may not start a download: the realm's page saves it,
	 * once Banking's backend confirms the file may leave (``download_allowed``: an order committed for the bank names
	 * its sha256). Rejects otherwise. */
	save: (name: string, text: string, type?: string) => Promise<void>;
}

export function errorText(e: unknown): string {
	return String((e as Error)?.message ?? e);
}

/** Minor units as a person reads them: 420000 CHF is "4,200.00". */
export function money(minor: number, currency: string): string {
	const decimals = decimalsOf(currency);
	return `${(minor / 10 ** decimals).toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${currency}`;
}
