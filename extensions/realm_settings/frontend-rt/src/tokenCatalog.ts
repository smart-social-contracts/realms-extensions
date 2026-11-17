/**
 * Treasury token picker for realm settings.
 *
 * The catalog — which shared ledgers exist, with indexer and decimals — is
 * whatever the realm reports: the `token_catalog` operation (a list) and the
 * realm's `shared_tokens_json` (a symbol → entry map). This module holds no
 * canister ids: only card descriptions and the test-mode selectability rules.
 */

export const CUSTOM_TOKEN_ID = 'custom';

export interface SharedTokenCatalogEntry {
	ledger: string;
	indexer?: string;
	decimals?: number;
	name?: string;
	symbol?: string;
	description?: string;
	monetary?: boolean;
}

export interface SharedTokenOption {
	id: string;
	name: string;
	symbol: string;
	description: string;
	decimals: number;
	ledger: string;
	indexer?: string;
	monetary?: boolean;
}

const TOKEN_INFO: Record<string, { name: string; description: string }> = {
	RLM: { name: 'Realms Token', description: 'The shared mundus-wide token, common to all realms' },
	REALMS: { name: 'REALMS Token', description: 'The shared mundus-wide token, common to all realms' },
	CKBTC: { name: 'ckBTC', description: 'Chain-Key Bitcoin — IC-native Bitcoin twin' },
	CKUSDC: { name: 'ckUSDC', description: 'Chain-Key USDC — IC-native USD stablecoin' },
	CKEURC: {
		name: 'ckEURC',
		description: 'Circle EURC on Ethereum, chain-key — IC-native euro stablecoin'
	}
};

/** Symbols that are not real money and stay selectable when monetary tokens are disabled. */
const NON_MONETARY = new Set(['RLM', 'REALMS']);

export function sharedTokenOptions(
	catalog: Record<string, SharedTokenCatalogEntry> | SharedTokenCatalogEntry[] | null | undefined
): SharedTokenOption[] {
	const out: SharedTokenOption[] = [];
	const entries: [string, SharedTokenCatalogEntry][] = Array.isArray(catalog)
		? catalog.map((entry) => [String(entry?.symbol || ''), entry])
		: Object.entries(catalog || {});
	for (const [symbol, entry] of entries) {
		const ledger = String(entry?.ledger || '').trim();
		if (!symbol.trim() || !ledger) continue;
		if (out.some((token) => token.id.toUpperCase() === symbol.toUpperCase())) continue;
		const info = TOKEN_INFO[symbol.toUpperCase()];
		out.push({
			id: symbol,
			symbol,
			name: entry.name || info?.name || symbol,
			description: entry.description || info?.description || `Shared ${symbol} ledger`,
			decimals: entry.decimals ?? 8,
			ledger,
			indexer: String(entry.indexer || '').trim() || undefined,
			monetary: typeof entry.monetary === 'boolean' ? entry.monetary : undefined
		});
	}
	return out;
}

export function matchSharedToken(
	options: SharedTokenOption[],
	input: { symbol?: string; token_canister_id?: string }
): SharedTokenOption | undefined {
	const canister = (input.token_canister_id || '').trim();
	if (canister) {
		const byLedger = options.find((token) => token.ledger === canister);
		if (byLedger) return byLedger;
	}
	const symbol = (input.symbol || '').trim().toUpperCase();
	if (!symbol) return undefined;
	return options.find(
		(token) => token.id.toUpperCase() === symbol || token.symbol.toUpperCase() === symbol
	);
}

export function isTokenChoiceSelectable(
	choiceId: string,
	monetaryDisabled: boolean,
	monetary?: boolean
): boolean {
	if (!monetaryDisabled) return true;
	if (monetary === false) return true;
	return NON_MONETARY.has((choiceId || '').trim().toUpperCase());
}

export function monetaryUnavailableLabel(locale: string): string {
	const id = (locale || '').trim().toLowerCase();
	if (id === 'es' || id.startsWith('es-')) return 'No disponible en esta demo';
	return 'Not available in this demo';
}

export function resolveDisableMonetaryTokens(
	explicit: boolean | null | undefined,
	network?: string | null
): boolean {
	if (typeof explicit === 'boolean') return explicit;
	const n = (network || '').trim().toLowerCase();
	return n === 'staging' || n === 'demo' || n === 'test';
}
