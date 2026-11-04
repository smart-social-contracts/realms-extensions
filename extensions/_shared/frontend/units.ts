/** Token amounts: the realm keeps whole base units, people read and type amounts in tokens. */

/** ``amount`` base units as a decimal string with ``decimals`` places, trailing zeros dropped. */
export function formatUnits(amount: number | string, decimals: number): string {
	const digits = BigInt(amount).toString().padStart(decimals + 1, '0');
	if (!decimals) return digits;
	const frac = digits.slice(-decimals).replace(/0+$/, '');
	return frac ? `${digits.slice(0, -decimals)}.${frac}` : digits.slice(0, -decimals);
}

/** What a person typed (a decimal number of tokens) as base units; null when it is not an amount with at most ``decimals`` places. */
export function toBaseUnits(input: string, decimals: number): number | null {
	const trimmed = input.trim();
	if (!trimmed) return null;
	const parts = trimmed.split('.');
	if (parts.length > 2) return null;
	const whole = parts[0];
	const frac = parts[1] ?? '';
	if (!/^\d+$/.test(whole) || (frac && !/^\d+$/.test(frac))) return null;
	if (frac.length > decimals) return null;
	const padded = frac.padEnd(decimals, '0');
	const combined = decimals > 0 ? whole + padded : whole;
	const n = Number(combined);
	return Number.isFinite(n) && n >= 0 ? n : null;
}
