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

/*
 * Ratios (a quorum, a threshold, an allocation share, a tender weight, a tax rate) are integers in
 * hundred-millionths: 100 % is 100 000 000. People read and type percentages, with up to six decimals.
 */

/** 1 %, in hundred-millionths. */
export const PERCENT = 1_000_000;
/** 100 %, in hundred-millionths. */
export const ONE = 100 * PERCENT;
const PERCENT_DECIMALS = 6;

/** A ratio as the percentage a person reads, without the sign: 100 000 is "0.1", 33 333 333 is "33.333333". */
export function formatPercent(ratio: number | null | undefined): string {
	return formatUnits(ratio ?? 0, PERCENT_DECIMALS);
}

/** A percentage a person typed as a ratio; null when it is not a percentage with at most six decimals. */
export function toRatio(percent: string | number | null | undefined): number | null {
	return toBaseUnits(String(percent ?? ''), PERCENT_DECIMALS);
}

/** A percentage held as a number, such as the value of a number input, as a ratio, rounded to the nearest hundred-millionth. */
export function fromPercent(percent: number | null | undefined): number {
	return Math.round((percent ?? 0) * PERCENT);
}
