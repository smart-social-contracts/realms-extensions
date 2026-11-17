/** ``raw`` base units of ``symbol`` as the page shows money: ``decimals`` places from the token, at most four read. */
export function formatMoney(raw: number, decimals: number, symbol: string): string {
	const value = (raw ?? 0) / 10 ** decimals;
	return `${value.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${symbol}`;
}
