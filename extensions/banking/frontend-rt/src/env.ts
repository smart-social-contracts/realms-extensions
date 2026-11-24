// What every tab of the screen shares: the realm, the vault, the treasury the user acts for, and how to tell them.
import { decimalsOf } from './lib/order.ts';
import type { Realm, Treasury } from './lib/realm.ts';
import type { Vault } from './lib/vault.ts';

/** A bank account as its form holds it, every field text. */
export type AccountForm = {
	name: string; iban: string; bic: string; street: string; building: string; postCode: string; town: string; country: string;
};

export interface Env {
	realm: Realm;
	vault: Vault;
	treasury: Treasury;
	me: string;
	language: string;
	notify: (level: 'success' | 'info' | 'warning' | 'error', message: string) => void;
	version: string;
}

/** Hand ``text`` to the browser as a file to save. In the realm's page a download needs nothing more; a sandboxed
 * frame would ask the host to save it (the frame may not start a download). */
export function saveFile(name: string, text: string, type = 'application/xml') {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function errorText(e: unknown): string {
	return String((e as Error)?.message ?? e);
}

/** Minor units as a person reads them: 420000 CHF is "4,200.00". */
export function money(minor: number, currency: string): string {
	const decimals = decimalsOf(currency);
	return `${(minor / 10 ** decimals).toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${currency}`;
}
