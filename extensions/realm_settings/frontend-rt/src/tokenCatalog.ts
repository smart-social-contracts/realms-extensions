export type SetupTokenNetwork = 'test' | 'staging' | 'demo';

export const CUSTOM_TOKEN_ID = 'custom';
export const REALMS_TOKEN_ID = 'REALMS';

export interface SharedTokenOption {
	id: string;
	name: string;
	symbol: string;
	description: string;
	decimals: number;
	ledgers: Record<SetupTokenNetwork, string>;
	indexers?: Partial<Record<SetupTokenNetwork, string>>;
}

export const SHARED_TOKEN_CATALOG: SharedTokenOption[] = [
	{
		id: 'REALMS',
		name: 'REALMS Token',
		symbol: 'REALMS',
		description: 'The shared mundus-wide token, common to all realms',
		decimals: 8,
		ledgers: {
			staging: 'cj65k-laaaa-aaaac-bfxqq-cai',
			demo: 'xbkkh-syaaa-aaaah-qq3ya-cai',
			test: 'nusyl-jiaaa-aaaae-qj6mq-cai'
		}
	},
	{
		id: 'ckBTC',
		name: 'ckBTC',
		symbol: 'ckBTC',
		description: 'Chain-Key Bitcoin — IC-native Bitcoin twin',
		decimals: 8,
		ledgers: {
			staging: 'mxzaz-hqaaa-aaaar-qaada-cai',
			demo: 'mxzaz-hqaaa-aaaar-qaada-cai',
			test: 'mxzaz-hqaaa-aaaar-qaada-cai'
		},
		indexers: {
			staging: 'n5wcd-faaaa-aaaar-qaaea-cai',
			demo: 'n5wcd-faaaa-aaaar-qaaea-cai',
			test: 'n5wcd-faaaa-aaaar-qaaea-cai'
		}
	},
	{
		id: 'ckUSDC',
		name: 'ckUSDC',
		symbol: 'ckUSDC',
		description: 'Chain-Key USDC — IC-native USD stablecoin',
		decimals: 6,
		ledgers: {
			staging: 'xevnm-gaaaa-aaaar-qafnq-cai',
			demo: 'xevnm-gaaaa-aaaar-qafnq-cai',
			test: 'xevnm-gaaaa-aaaar-qafnq-cai'
		}
	},
	{
		id: 'ckEURC',
		name: 'ckEURC',
		symbol: 'ckEURC',
		description: 'Circle EURC on Ethereum, chain-key — IC-native euro stablecoin',
		decimals: 6,
		ledgers: {
			staging: 'pe5t5-diaaa-aaaar-qahwa-cai',
			demo: 'pe5t5-diaaa-aaaar-qahwa-cai',
			test: 'pe5t5-diaaa-aaaar-qahwa-cai'
		}
	}
];

export function setupTokenNetwork(hint = ''): SetupTokenNetwork {
	const value = (hint || '').toLowerCase();
	if (value === 'staging' || value.includes('staging.')) return 'staging';
	if (value === 'demo' || value.includes('demo.')) return 'demo';
	return 'test';
}

export function matchSharedToken(input: {
	symbol?: string;
	token_canister_id?: string;
}): SharedTokenOption | undefined {
	const canister = (input.token_canister_id || '').trim();
	if (canister) {
		const byLedger = SHARED_TOKEN_CATALOG.find((token) =>
			Object.values(token.ledgers).includes(canister)
		);
		if (byLedger) return byLedger;
	}
	const symbol = (input.symbol || '').trim().toUpperCase();
	if (!symbol) return undefined;
	return SHARED_TOKEN_CATALOG.find(
		(token) => token.id.toUpperCase() === symbol || token.symbol.toUpperCase() === symbol
	);
}

export function isTokenChoiceSelectable(choiceId: string, monetaryDisabled: boolean): boolean {
	if (!monetaryDisabled) return true;
	return (choiceId || '').trim().toUpperCase() === REALMS_TOKEN_ID;
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
