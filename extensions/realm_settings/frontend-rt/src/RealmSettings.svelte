<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount } from 'svelte';
	import ProposalModal from './ProposalModal.svelte';
	import QuartersPanel from './QuartersPanel.svelte';
	import TrustPolicyPanel from './TrustPolicyPanel.svelte';
	import DepartmentTablePanel from './DepartmentTablePanel.svelte';
	import { loadRealmRow, opCaller, proposalOf, refusalText, refusedPermission } from './ops';
	import { isValidHexColor, snapshotEquals } from '../../../_shared/frontend/branding';
	import {
		CUSTOM_TOKEN_ID,
		isTokenChoiceSelectable,
		matchSharedToken,
		monetaryUnavailableLabel,
		resolveDisableMonetaryTokens,
		sharedTokenOptions,
		type SharedTokenOption,
	} from './tokenCatalog';

	let { ctx }: { ctx: any } = $props();

	const call = opCaller(ctx);
	const cn = ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' '));

	let settingsLoading = $state(true);
	let settingsSaving = $state(false);
	let settingsMessage = $state('');
	let settingsError = $state('');
	let realmSettingsName = $state('');
	let realmSettingsManifesto = $state('');
	let realmSettingsWelcome = $state('');
	let realmSettingsLogoUrl = $state('');
	let realmSettingsBackgroundUrl = $state('');
	let realmSettingsPrimaryColor = $state('#3b82f6');
	let realmSettingsOpenRegistration = $state(false);
	let realmSettingsAiAssistantEnabled = $state(true);
	let realmSettingsFileRegistryId = $state('');
	let realmSettingsMarketplaceId = $state('');
	let realmSettingsCurrency = $state('');
	let realmSettingsCurrencyDecimals = $state(8);
	let realmSettingsTokenCanisterId = $state('');
	let realmSettingsNftCanisterId = $state('');
	let governanceVotingWindowDays = $state<number | null>(null);
	let liveVotingWindowSeconds = $state<number | null>(null);
	let tokenChoice = $state('');
	let monetaryTokensDisabled = $state(false);
	let tokenPickerLocale = $state('en');
	let tokenOptions = $state<SharedTokenOption[]>([]);
	const customSelectable = $derived(isTokenChoiceSelectable(CUSTOM_TOKEN_ID, monetaryTokensDisabled));

	let savePreview = $state<null | { appliesDirectly: boolean; policy: string; governedBy: string }>(null);
	let governanceAppliesDirectly = $state(true);
	let governancePolicyLabel = $state('1/1');
	let governanceGovernedBy = $state('root');
	let savedSnapshot: Record<string, unknown> | null = $state(null);
	let showPublicPreviewLink = $state(false);

	type SettingsTab = 'general' | 'governance' | 'treasury' | 'infrastructure' | 'advanced';
	let activeTab: SettingsTab = $state('general');

	function formatDuration(seconds: number): string {
		if (!Number.isFinite(seconds) || seconds <= 0) return 'unknown';
		if (seconds >= 86400) {
			const days = seconds / 86400;
			return Number.isInteger(days) ? `${days} days` : `${days.toFixed(2)} days`;
		}
		if (seconds >= 3600) return `${Math.round(seconds / 3600)} hours`;
		if (seconds >= 60) return `${Math.round(seconds / 60)} minutes`;
		return `${Math.round(seconds)} seconds`;
	}

	let votingWindowKnown = $derived(liveVotingWindowSeconds != null);
	let votingWindowValid = $derived(
		!votingWindowKnown ||
			(governanceVotingWindowDays != null &&
				Number.isFinite(governanceVotingWindowDays) &&
				Math.round(governanceVotingWindowDays * 86400) >= 1),
	);
	let governanceDirty = $derived(
		liveVotingWindowSeconds != null &&
			governanceVotingWindowDays != null &&
			Number.isFinite(governanceVotingWindowDays) &&
			Math.round(governanceVotingWindowDays * 86400) !== liveVotingWindowSeconds,
	);

	// Lifecycle state
	let lifecycleLoading = $state(true);
	let lifecycleAdvancing = $state(false);
	let lifecycleError = $state('');
	let confirmLaunch = $state(false);
	let currentStage = $state('alpha');
	const STAGES = ['setup', 'alpha', 'beta', 'production', 'deprecation', 'terminated'];
	const STAGE_LABELS: Record<string, string> = {
		setup: 'Setup',
		alpha: 'Alpha',
		beta: 'Beta',
		production: 'Production',
		deprecation: 'Deprecation',
		terminated: 'Terminated',
	};
	const STAGE_DESCRIPTIONS: Record<string, string> = {
		setup: 'The founder is configuring the realm',
		alpha: 'Gathering interest, deposits refundable',
		beta: 'Deposits locked, infrastructure preparation',
		production: 'Fully operational',
		deprecation: 'Winding down, no new members',
		terminated: 'Closed, read-only archive',
	};
	const stageIndex = $derived(Math.max(0, STAGES.indexOf(currentStage)));

	let proposalModalOpen = $state(false);
	let proposalModalTitle = $state('');
	let proposalModalDescription = $state('');
	let proposalModalActions = $state<Change[]>([]);
	let proposalModalOperation = $state('');

	function addToast(message: string, type: 'success' | 'error' = 'success') {
		const level = type === 'error' ? 'error' : 'success';
		if (typeof ctx.notify === 'function') {
			ctx.notify(level, message);
			return;
		}
		console.warn('[extension]', level, message);
	}

	/** The realm operation and arguments one group of settings is saved with. */
	type Change = { op: string; args: Record<string, unknown> };

	const SETTING_GROUPS: { op: string; keys: readonly string[] }[] = [
		{ op: 'realm_configure', keys: ['name', 'manifesto', 'welcome_message', 'open_registration', 'ai_assistant_enabled'] },
		{ op: 'realm_configure_branding', keys: ['logo_url', 'background_image_url', 'primary_color'] },
		{
			op: 'realm_configure_tokens',
			keys: ['accounting_currency', 'accounting_currency_decimals', 'token_canister_id', 'nft_canister_id'],
		},
		{ op: 'realm_configure_infrastructure', keys: ['file_registry_canister_id', 'marketplace_canister_id'] },
		{ op: 'governance_update', keys: ['voting_window'] },
	];

	function currentSettingsSnapshot(): Record<string, unknown> {
		return {
			name: realmSettingsName,
			manifesto: realmSettingsManifesto,
			welcome_message: realmSettingsWelcome,
			logo_url: realmSettingsLogoUrl,
			background_image_url: realmSettingsBackgroundUrl,
			primary_color: realmSettingsPrimaryColor,
			open_registration: realmSettingsOpenRegistration,
			ai_assistant_enabled: realmSettingsAiAssistantEnabled,
			accounting_currency: realmSettingsCurrency.trim(),
			accounting_currency_decimals: Number(realmSettingsCurrencyDecimals),
			token_canister_id: realmSettingsTokenCanisterId.trim(),
			nft_canister_id: realmSettingsNftCanisterId.trim(),
			file_registry_canister_id: realmSettingsFileRegistryId.trim(),
			marketplace_canister_id: realmSettingsMarketplaceId.trim(),
			voting_window:
				votingWindowKnown && governanceVotingWindowDays != null
					? Math.round(governanceVotingWindowDays * 86400)
					: null,
		};
	}

	function rememberSettingsSnapshot() {
		savedSnapshot = currentSettingsSnapshot();
	}

	/** One change per operation whose settings differ from the saved ones; the token group goes whole. */
	function buildChanges(): Change[] {
		const next = currentSettingsSnapshot();
		const prev = savedSnapshot || {};
		const changes: Change[] = [];
		for (const { op, keys } of SETTING_GROUPS) {
			const dirty = keys.filter((key) => !snapshotEquals(prev[key], next[key]));
			if (!dirty.length) continue;
			const sent = op === 'realm_configure_tokens' ? keys : dirty;
			changes.push({ op, args: Object.fromEntries(sent.map((key) => [key, next[key]])) });
		}
		return changes;
	}

	function keysOf(op: string): readonly string[] {
		return SETTING_GROUPS.find((group) => group.op === op)?.keys ?? [];
	}

	function openProposalForSettings(actions: Change[], permissions: string) {
		proposalModalTitle = 'Update realm settings';
		proposalModalDescription =
			'This proposal updates the realm configuration with the operations listed below.';
		proposalModalActions = actions;
		proposalModalOperation = permissions;
		proposalModalOpen = true;
	}

	function snapshotRealmInfo(): Record<string, unknown> | null {
		const info = ctx.realmInfo;
		if (!info) return null;
		if (typeof info.subscribe === 'function') {
			let current: Record<string, unknown> | null = null;
			const unsub = info.subscribe((value: unknown) => {
				if (value && typeof value === 'object') current = value as Record<string, unknown>;
			});
			unsub?.();
			return current;
		}
		return typeof info === 'object' ? info as Record<string, unknown> : null;
	}

	/** Who must approve a realm-wide change, read from the root department's policy. */
	async function loadGovernancePolicy(status: string) {
		governanceAppliesDirectly = true;
		governancePolicyLabel = '1/1';
		governanceGovernedBy = 'root';
		if (status === 'setup') return;
		const listed = await call(false, 'department_list', { count: 500 });
		const root = listed.ok && Array.isArray(listed.departments) ? listed.departments.find((d: any) => d?.is_root) : null;
		if (!root) return;
		governanceGovernedBy = String(root.id);
		const got = await call(false, 'department_get', { department: root.id });
		const policy = got.ok ? got.department?.policy : null;
		if (!policy || typeof policy !== 'object') return;
		const m = Number(policy.m ?? 1);
		const n = Number(policy.n ?? 1);
		governancePolicyLabel = `${m}/${n}`;
		governanceAppliesDirectly = m <= 1 && n <= 1 && !policy.quorum_percent && !(policy.veto?.length > 0);
	}

	async function loadRealmSettings() {
		settingsLoading = true;
		settingsError = '';
		try {
			const [{ realm }, catalog] = await Promise.all([
				loadRealmRow(call),
				call(false, 'token_catalog'),
			]);
			realmSettingsName = realm.name || '';
			realmSettingsManifesto = realm.manifesto || '';
			realmSettingsWelcome = realm.welcome_message || '';
			realmSettingsLogoUrl = realm.logo_url || '';
			realmSettingsBackgroundUrl = realm.background_image_url || '';
			realmSettingsPrimaryColor =
				typeof realm.primary_color === 'string' && isValidHexColor(realm.primary_color)
					? realm.primary_color
					: '#3b82f6';
			realmSettingsOpenRegistration = !!realm.open_registration;
			realmSettingsAiAssistantEnabled = realm.ai_assistant_enabled !== false;
			realmSettingsFileRegistryId = realm.file_registry_canister_id || '';
			realmSettingsMarketplaceId = realm.marketplace_canister_id || '';
			realmSettingsCurrency = realm.accounting_currency || '';
			realmSettingsCurrencyDecimals = Number(realm.accounting_currency_decimals ?? 8);
			realmSettingsTokenCanisterId = realm.token_canister_id || '';
			realmSettingsNftCanisterId = realm.nft_canister_id || '';

			tokenOptions = sharedTokenOptions(catalog.ok ? catalog.tokens : null);
			if (!tokenOptions.length) tokenOptions = sharedTokenOptions(realm.shared_tokens_json);
			const matched = matchSharedToken(tokenOptions, {
				symbol: realmSettingsCurrency,
				token_canister_id: realmSettingsTokenCanisterId,
			});
			tokenChoice =
				matched?.id ??
				(realmSettingsTokenCanisterId ? CUSTOM_TOKEN_ID : tokenOptions[0]?.id ?? CUSTOM_TOKEN_ID);

			const info = snapshotRealmInfo();
			const flag = realm.test_flags?.test_mode_disable_monetary_tokens;
			const explicitDisable =
				typeof flag === 'boolean'
					? flag
					: typeof info?.testModeDisableMonetaryTokens === 'boolean'
						? info.testModeDisableMonetaryTokens
						: undefined;
			monetaryTokensDisabled = resolveDisableMonetaryTokens(explicitDisable, String(realm.network || ''));
			tokenPickerLocale = String(info?.primaryLanguage || 'en');

			liveVotingWindowSeconds = null;
			governanceVotingWindowDays = null;
			if (full) {
				const exported = await call(false, 'realm_export', { entity: 'Calendar', count: 1 });
				const seconds = Number(exported.ok && Array.isArray(exported.rows) ? exported.rows[0]?.voting_window : NaN);
				if (Number.isFinite(seconds) && seconds > 0) {
					liveVotingWindowSeconds = seconds;
					governanceVotingWindowDays = seconds / 86400;
				}
			}
			await loadGovernancePolicy(String(realm.status || ''));
			rememberSettingsSnapshot();
		} catch (e: any) {
			settingsError = e?.message || String(e);
		} finally {
			settingsLoading = false;
		}
	}

	function selectTokenChoice(id: string) {
		const option = tokenOptions.find((item) => item.id === id);
		if (!isTokenChoiceSelectable(id, monetaryTokensDisabled, option?.monetary)) return;
		tokenChoice = id;
		if (!option) return;
		realmSettingsTokenCanisterId = option.ledger;
		realmSettingsCurrency = option.symbol;
		realmSettingsCurrencyDecimals = option.decimals;
	}

	// Typing a ledger of one's own turns a catalog choice into a custom token.
	function onLedgerInput() {
		const chosen = tokenOptions.find((item) => item.id === tokenChoice);
		if (chosen && chosen.ledger !== realmSettingsTokenCanisterId.trim()) tokenChoice = CUSTOM_TOKEN_ID;
	}

	const ledgerLocked = $derived(
		monetaryTokensDisabled &&
			!isTokenChoiceSelectable(
				tokenChoice,
				true,
				tokenOptions.find((item) => item.id === tokenChoice)?.monetary,
			),
	);

	async function saveRealmSettings() {
		settingsSaving = true;
		settingsMessage = '';
		settingsError = '';
		try {
			const changes = buildChanges();
			if (changes.length === 0) {
				settingsError = 'No changes to save.';
				return;
			}
			const proposals: string[] = [];
			const refused: Change[] = [];
			const permissions = new Set<string>();
			const failures: string[] = [];
			let applied = 0;
			for (const change of changes) {
				const res = await call(true, change.op, change.args);
				const proposal = proposalOf(res);
				if (proposal) {
					proposals.push(proposal);
				} else if (res.ok) {
					applied += 1;
					const next = currentSettingsSnapshot();
					savedSnapshot = {
						...(savedSnapshot || {}),
						...Object.fromEntries(keysOf(change.op).map((key) => [key, next[key]])),
					};
					if (change.op === 'governance_update') liveVotingWindowSeconds = Number(next.voting_window);
				} else {
					const needs = refusedPermission(res);
					if (needs) {
						refused.push(change);
						permissions.add(needs);
					} else {
						failures.push(refusalText(res, 'A setting was not saved'));
					}
				}
			}
			if (refused.length) {
				openProposalForSettings(refused, [...permissions].join(', '));
			} else if (applied || proposals.length) {
				await loadRealmSettings();
			}
			const parts: string[] = [];
			if (applied) parts.push('Realm settings saved.');
			if (proposals.length) {
				parts.push(`Submitted as proposal ${proposals.join(', ')}: the change applies once the vote passes.`);
			}
			if (parts.length) {
				settingsMessage = parts.join(' ');
				addToast(settingsMessage);
			}
			if (failures.length) settingsError = failures.join(' ');
			if (applied) {
				showPublicPreviewLink = true;
				await ctx.realmInfo?.fetch?.();
			}
		} finally {
			settingsSaving = false;
		}
	}

	async function requestSavePreview() {
		settingsError = '';
		settingsMessage = '';
		if (!isValidHexColor(realmSettingsPrimaryColor)) {
			settingsError = 'The primary color must look like #1E6B52.';
			return;
		}
		if (buildChanges().length === 0) {
			settingsError = 'No changes to save.';
			return;
		}
		savePreview = {
			appliesDirectly: governanceAppliesDirectly,
			policy: governancePolicyLabel,
			governedBy: governanceGovernedBy,
		};
	}

	async function confirmSavePreview() {
		savePreview = null;
		await saveRealmSettings();
	}

	function isValidCanisterId(value: string): boolean {
		if (!value) return true;
		return /^[a-z0-9]{5}(-[a-z0-9]{5})*-cai$/.test(value);
	}

	let fileRegistryIdValid = $derived(isValidCanisterId(realmSettingsFileRegistryId.trim()));
	let marketplaceIdValid = $derived(isValidCanisterId(realmSettingsMarketplaceId.trim()));
	let tokenCanisterIdValid = $derived(isValidCanisterId(realmSettingsTokenCanisterId.trim()));
	let nftCanisterIdValid = $derived(isValidCanisterId(realmSettingsNftCanisterId.trim()));
	let currencyValid = $derived(
		realmSettingsCurrency.trim().length <= 16 &&
			Number.isInteger(Number(realmSettingsCurrencyDecimals)) &&
			Number(realmSettingsCurrencyDecimals) >= 0 &&
			Number(realmSettingsCurrencyDecimals) <= 18,
	);
	let tokensValid = $derived(
		tokenCanisterIdValid &&
			nftCanisterIdValid &&
			(!realmSettingsTokenCanisterId.trim() || !!realmSettingsCurrency.trim()),
	);
	let infraValid = $derived(fileRegistryIdValid && marketplaceIdValid && currencyValid && tokensValid);

	const nextStage = $derived(currentStage === 'setup' ? 'alpha' : null);

	async function loadLifecycle() {
		lifecycleLoading = true;
		lifecycleError = '';
		const info = await call(false, 'realm_info');
		if (info.ok && info.realm?.status) {
			currentStage = String(info.realm.status);
		} else {
			lifecycleError = 'The realm stage could not be loaded.';
		}
		lifecycleLoading = false;
	}

	async function advanceStage() {
		if (!nextStage) return;
		if (!confirmLaunch) {
			confirmLaunch = true;
			return;
		}
		lifecycleAdvancing = true;
		lifecycleError = '';
		const res = await call(true, 'setup_launch');
		if (res.ok) {
			addToast('The realm has launched');
			await Promise.all([loadLifecycle(), loadRealmSettings()]);
		} else {
			lifecycleError = refusalText(res, 'The realm was not launched');
		}
		confirmLaunch = false;
		lifecycleAdvancing = false;
	}

	onMount(() => {
		loadRealmSettings();
		loadLifecycle();
	});
</script>

<style>
	.chrome-tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		white-space: nowrap;
	}

	.chrome-tab.is-on {
		border-bottom-color: #111827;
		color: #111827;
	}

	@media (max-width: 720px) {
		.chrome-label {
			display: none;
		}

		.chrome-tab {
			width: 40px;
			justify-content: center;
			padding: 10px 0;
		}
	}
</style>

{#snippet saveBar()}
	<div class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
		{#if settingsMessage}
			<div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
				{settingsMessage}
				{#if showPublicPreviewLink}
					<button
						type="button"
						class="ml-2 text-green-800 underline font-medium"
						onclick={() => ctx.navigate?.('/extensions/public_dashboard')}
					>View public page</button>
				{/if}
			</div>
		{/if}
		{#if settingsError}
			<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{settingsError}</div>
		{/if}
		<button
			type="button"
			onclick={() => requestSavePreview()}
			disabled={settingsSaving || !infraValid || !votingWindowValid}
			class="px-6 py-2.5 bg-[var(--color-primary-600,#2563eb)] text-white rounded-lg hover:bg-[var(--color-primary-700,#1d4ed8)] disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
		>{settingsSaving ? 'Saving…' : 'Save Settings'}</button>
	</div>
{/snippet}

<div class="w-full px-3 sm:px-4 max-w-none">
	<div class="flex flex-col gap-2 mb-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Settings</h1>
			<p class="text-gray-600 mt-1">{extensionDescription}</p>
		</div>
	</div>

	<div class="flex mb-6 border-b border-gray-200 overflow-x-auto">
		<button
			type="button"
			onclick={() => (activeTab = 'general')}
			class="chrome-tab {activeTab === 'general' ? 'is-on' : ''}"
			title="General"
			aria-label="General"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
			<span class="chrome-label">General</span>
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'governance')}
			class="chrome-tab {activeTab === 'governance' ? 'is-on' : ''}"
			title="Governance"
			aria-label="Governance"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
			<span class="chrome-label">Governance</span>
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'treasury')}
			class="chrome-tab {activeTab === 'treasury' ? 'is-on' : ''}"
			title="Treasury"
			aria-label="Treasury"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			<span class="chrome-label">Treasury</span>
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'infrastructure')}
			class="chrome-tab {activeTab === 'infrastructure' ? 'is-on' : ''}"
			title="Infrastructure"
			aria-label="Infrastructure"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
			<span class="chrome-label">Infrastructure</span>
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'advanced')}
			class="chrome-tab {activeTab === 'advanced' ? 'is-on' : ''}"
			title="Advanced"
			aria-label="Advanced"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
			<span class="chrome-label">Advanced</span>
		</button>
	</div>

	{#if settingsLoading && activeTab !== 'advanced'}
		<div class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
			<div class="flex items-center justify-center py-10">
				<div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
			</div>
		</div>
	{:else if activeTab === 'general'}
	<div class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-1">Realm Lifecycle</h2>
		<p class="text-sm text-gray-500 mb-5">
			Current operational stage of this realm.
			<a
				href="https://github.com/smart-social-contracts/realms-gos/blob/main/docs/glossary.md"
				target="_blank"
				rel="noopener noreferrer"
				class="ml-1 text-blue-600 hover:underline"
			>Learn about stages ↗</a>
		</p>

		{#if lifecycleLoading}
			<div class="flex items-center justify-center py-6">
				<div class="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full"></div>
			</div>
		{:else}
			<!-- Stage timeline -->
			<div class="relative mb-6 overflow-x-auto">
				<div class="flex items-center justify-between">
					{#each STAGES as stage, i}
						{@const isCurrent = i === stageIndex}
						{@const isPast = i < stageIndex}
						<div class="flex flex-col items-center relative z-10" style="flex: 1;">
							<div class={cn(
								'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
								isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' :
								isPast ? 'bg-green-500 border-green-500 text-white' :
								'bg-gray-100 border-gray-300 text-gray-400'
							)}>
								{#if isPast}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
								{:else}
									{i + 1}
								{/if}
							</div>
							<span class={cn(
								'text-xs mt-2 font-medium text-center',
								isCurrent ? 'text-blue-700' : isPast ? 'text-green-600' : 'text-gray-400'
							)}>{STAGE_LABELS[stage]}</span>
							{#if isCurrent}
								<span class="text-[10px] text-gray-500 mt-0.5 text-center max-w-[90px]">{STAGE_DESCRIPTIONS[stage]}</span>
							{/if}
						</div>
					{/each}
				</div>
				<!-- Progress line behind circles -->
				<div class="absolute top-[18px] left-[8.33%] right-[8.33%] h-0.5 bg-gray-200 -z-0"></div>
				<div
					class="absolute top-[18px] left-[8.33%] h-0.5 bg-green-500 -z-0 transition-all duration-500"
					style="width: {stageIndex / (STAGES.length - 1) * 83.33}%"
				></div>
			</div>

			<!-- Advance button -->
			{#if nextStage}
				<div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-gray-100">
					<button
						onclick={() => advanceStage()}
						disabled={lifecycleAdvancing}
						class={cn(
							'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
							'bg-[var(--color-primary-600,#2563eb)] text-white hover:bg-[var(--color-primary-700,#1d4ed8)]',
							'disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed'
						)}
					>
						{#if lifecycleAdvancing}
							<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
						{/if}
						{confirmLaunch ? 'Confirm launch' : 'Launch realm'}
					</button>
					<span class="text-xs text-gray-500">
						{confirmLaunch
							? 'Launching ends the founder setup rights: settings are governed from then on.'
							: STAGE_DESCRIPTIONS[nextStage]}
					</span>
				</div>
			{:else if currentStage !== 'terminated'}
				<p class="pt-2 border-t border-gray-100 text-xs text-gray-500">
					Advancing to the next stage is not available in this realm version.
				</p>
			{/if}

			{#if lifecycleError}
				<div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{lifecycleError}</div>
			{/if}
		{/if}
	</div>

		<!-- Identity -->
		<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-1">Identity</h2>
			<p class="text-sm text-gray-500 mb-5">How this realm presents itself to members and visitors.</p>
			<div class="space-y-5">
				<div>
					<label for="rs-name" class="block text-sm font-medium text-gray-700 mb-1">Realm Name</label>
					<input id="rs-name" type="text" bind:value={realmSettingsName}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
				</div>
				<div>
					<label for="rs-desc" class="block text-sm font-medium text-gray-700 mb-1">Manifesto</label>
					<textarea id="rs-desc" bind:value={realmSettingsManifesto} rows="2"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"></textarea>
				</div>
				<div>
					<label for="rs-welcome" class="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
					<textarea id="rs-welcome" bind:value={realmSettingsWelcome} rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"></textarea>
				</div>
			</div>
		</section>

		<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-1">Languages</h2>
			<p class="text-sm text-gray-500">Not available in this realm version.</p>
		</section>

		<!-- Branding -->
		<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-1">Branding</h2>
			<p class="text-sm text-gray-500 mb-5">
				Logo, background, and primary color for the public hero, join page, and primary buttons.
				Paste the address of an image hosted elsewhere.
				Requires <code class="bg-gray-100 px-1 rounded">realm.configure.branding</code>.
			</p>
			<div class="space-y-5">
				<div>
					<label for="rs-logo" class="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
					<input id="rs-logo" type="url" bind:value={realmSettingsLogoUrl} placeholder="https://example.com/logo.png"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
					{#if realmSettingsLogoUrl}
						<div class="mt-2 flex items-center gap-3">
							<img src={realmSettingsLogoUrl} alt="Logo preview" class="h-12 w-12 object-contain rounded border border-gray-200 bg-gray-50" />
							<span class="text-xs text-gray-500">Preview</span>
						</div>
					{/if}
				</div>
				<div>
					<label for="rs-bg" class="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
					<input id="rs-bg" type="url" bind:value={realmSettingsBackgroundUrl} placeholder="https://example.com/background.png"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
					{#if realmSettingsBackgroundUrl}
						<div class="mt-2">
							<img src={realmSettingsBackgroundUrl} alt="Background preview" class="h-24 w-full object-cover rounded border border-gray-200" />
							<span class="text-xs text-gray-500">Preview</span>
						</div>
					{/if}
				</div>
				<div>
					<label for="rs-primary-color" class="block text-sm font-medium text-gray-700 mb-1">Primary color</label>
					<div class="flex items-center gap-3">
						<input
							id="rs-primary-color"
							type="color"
							bind:value={realmSettingsPrimaryColor}
							class="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1"
						/>
						<input
							type="text"
							bind:value={realmSettingsPrimaryColor}
							placeholder="#3b82f6"
							maxlength="7"
							class="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
						<div
							class="h-10 w-10 rounded border border-gray-200 shrink-0"
							style="background-color: {isValidHexColor(realmSettingsPrimaryColor) ? realmSettingsPrimaryColor : '#3b82f6'}"
							title="Preview"
						></div>
					</div>
					<p class="mt-1 text-xs text-gray-500">Hex color for primary buttons and accents (e.g. #3b82f6).</p>
				</div>
			</div>
		</section>

		<!-- Registration & features -->
		<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-1">Registration &amp; features</h2>
			<p class="text-sm text-gray-500 mb-5">Membership access and optional realm features.</p>
			<div class="space-y-5">
				<div class="flex items-center gap-3">
					<label for="rs-open-reg" class="relative inline-flex items-center cursor-pointer">
						<input id="rs-open-reg" type="checkbox" bind:checked={realmSettingsOpenRegistration} class="sr-only peer" />
						<div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
					</label>
					<div>
						<span class="text-sm font-medium text-gray-700">Open Registration</span>
						<p class="text-xs text-gray-500">When enabled, anyone can join without an invite code.</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<label for="rs-ai-assistant" class="relative inline-flex items-center cursor-pointer">
						<input id="rs-ai-assistant" type="checkbox" bind:checked={realmSettingsAiAssistantEnabled} class="sr-only peer" />
						<div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
					</label>
					<div>
						<span class="text-sm font-medium text-gray-700">AI Assistant</span>
						<p class="text-xs text-gray-500">Enable Explain actions and realm-context hooks. Chat UI lives on the mundus Realms Assistant (registry portal).</p>
					</div>
				</div>
			</div>
		</section>

		{@render saveBar()}
	{:else if activeTab === 'governance'}
		<section id="governance" class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-1">Voting window</h2>
			<p class="text-sm text-gray-500 mb-5">
				How long new proposals stay open for voting. Applies to proposals created after you save.
				Use decimals for short test windows (for example, <code class="bg-gray-100 px-1 rounded">0.0012</code> ≈ 104 seconds).
			</p>
			{#if !votingWindowKnown}
				<p class="text-sm text-gray-500">The voting window is shown to realm administrators.</p>
			{:else}
			{#if liveVotingWindowSeconds != null}
				<div class="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
					Effective now:
					<span class="font-medium">{liveVotingWindowSeconds} seconds ({formatDuration(liveVotingWindowSeconds)})</span>
				</div>
			{/if}
			<div>
				<label for="rs-voting-window" class="block text-sm font-medium text-gray-700 mb-1">Voting window (days)</label>
				<input
					id="rs-voting-window"
					type="number"
					min="0"
					step="any"
					bind:value={governanceVotingWindowDays}
					class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
				<p class="mt-1 text-xs text-gray-500">0: a realm-wide vote stays open until its outcome is certain.</p>
				{#if governanceVotingWindowDays != null && Number.isFinite(governanceVotingWindowDays)}
					<p class="mt-2 text-xs text-gray-500">
						{#if governanceDirty}
							Unsaved preview:
							<span class="font-medium text-amber-700">
								{Math.round(governanceVotingWindowDays * 86400)} seconds ({formatDuration(Math.round(governanceVotingWindowDays * 86400))})
							</span>
						{:else}
							Matches the effective window above.
						{/if}
					</p>
				{/if}
			</div>
			{/if}
		</section>

		{#if votingWindowKnown}
			{@render saveBar()}
		{/if}
	{:else if activeTab === 'treasury'}
		<!-- Currency -->
		<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-1">Currency token</h2>
			<p class="text-sm text-gray-500 mb-5">
				Fungible treasury token used for balances, invoices, and transfers in this realm.
				Changing the ledger requires <code class="bg-gray-100 px-1 rounded">realm.configure.tokens</code>.
			</p>
			<div class="space-y-3 mb-5">
				{#each tokenOptions as token (token.id)}
					{@const selectable = isTokenChoiceSelectable(token.id, monetaryTokensDisabled, token.monetary)}
					<label
						class={cn(
							'flex items-start gap-3 rounded-lg border p-3',
							tokenChoice === token.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200',
							!selectable && 'opacity-60 cursor-not-allowed bg-gray-100',
						)}
					>
						<input
							type="radio"
							name="rs-token-choice"
							value={token.id}
							checked={tokenChoice === token.id}
							disabled={!selectable}
							onchange={() => selectTokenChoice(token.id)}
							class="mt-1"
						/>
						<div>
							<strong class="text-sm text-gray-900">{token.name}</strong>
							<p class="text-xs text-gray-600">{token.description}</p>
							{#if !selectable}
								<p class="text-xs text-gray-500 mt-1">{monetaryUnavailableLabel(tokenPickerLocale)}</p>
							{/if}
						</div>
					</label>
				{/each}
				<label
					class={cn(
						'flex items-start gap-3 rounded-lg border p-3',
						tokenChoice === CUSTOM_TOKEN_ID ? 'border-gray-900 bg-gray-50' : 'border-gray-200',
						!customSelectable && 'opacity-60 cursor-not-allowed bg-gray-100',
					)}
				>
					<input
						type="radio"
						name="rs-token-choice"
						value={CUSTOM_TOKEN_ID}
						checked={tokenChoice === CUSTOM_TOKEN_ID}
						disabled={!customSelectable}
						onchange={() => selectTokenChoice(CUSTOM_TOKEN_ID)}
						class="mt-1"
					/>
					<div>
						<strong class="text-sm text-gray-900">Custom token</strong>
						<p class="text-xs text-gray-600">Your own ICRC-1 ledger canister.</p>
						{#if !customSelectable}
							<p class="text-xs text-gray-500 mt-1">{monetaryUnavailableLabel(tokenPickerLocale)}</p>
						{/if}
					</div>
				</label>
			</div>
			<div class="space-y-4">
				<div>
					<label for="rs-token-ledger" class="block text-sm font-medium text-gray-700 mb-1">Treasury ledger canister</label>
					<input
						id="rs-token-ledger"
						type="text"
						bind:value={realmSettingsTokenCanisterId}
						oninput={onLedgerInput}
						placeholder="xxxxx-xxxxx-xxxxx-xxxxx-cai"
						disabled={ledgerLocked}
						class={cn(
							'w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:border-blue-500',
							realmSettingsTokenCanisterId && !tokenCanisterIdValid
								? 'border-red-300 focus:ring-red-300'
								: 'border-gray-300 focus:ring-blue-500',
						)}
					/>
					<p class="mt-1 text-xs text-gray-500">ICRC-1 ledger for treasury balances and transfers.</p>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
				<div>
					<label for="rs-currency" class="block text-sm font-medium text-gray-700 mb-1">Currency symbol</label>
					<input id="rs-currency" type="text" bind:value={realmSettingsCurrency} placeholder="REALMS" maxlength="16"
						readonly={tokenChoice !== CUSTOM_TOKEN_ID}
						class={cn(
							'w-full px-3 py-2 border rounded-lg text-sm',
							tokenChoice !== CUSTOM_TOKEN_ID ? 'border-gray-200 bg-gray-50 text-gray-700' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
						)} />
					<p class="mt-1 text-xs text-gray-500">{tokenChoice === CUSTOM_TOKEN_ID ? 'Symbol of your custom token.' : 'Filled in from the token you chose.'}</p>
				</div>
				<div>
					<label for="rs-decimals" class="block text-sm font-medium text-gray-700 mb-1">Decimals</label>
					<input id="rs-decimals" type="number" bind:value={realmSettingsCurrencyDecimals} min="0" max="18" step="1"
						readonly={tokenChoice !== CUSTOM_TOKEN_ID}
						class={cn(
							'w-full px-3 py-2 border rounded-lg text-sm',
							tokenChoice !== CUSTOM_TOKEN_ID ? 'border-gray-200 bg-gray-50 text-gray-700' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
						)} />
					<p class="mt-1 text-xs text-gray-500">{tokenChoice === CUSTOM_TOKEN_ID ? 'Decimals of your custom token (0–18).' : 'Filled in from the token you chose.'}</p>
				</div>
			</div>
			{#if !currencyValid}
				<p class="mt-3 text-xs text-red-600">Enter a symbol of up to 16 characters and decimals between 0 and 18.</p>
			{:else if realmSettingsTokenCanisterId.trim() && !realmSettingsCurrency.trim()}
				<p class="mt-3 text-xs text-red-600">Enter the token's symbol.</p>
			{/if}
		</section>

		<!-- Land NFT -->
		<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-1">Land NFT collection</h2>
			<p class="text-sm text-gray-500 mb-5">
				Non-fungible token canister for land deeds minted from the Land Registry extension.
			</p>
			<div>
				<label for="rs-nft-canister" class="block text-sm font-medium text-gray-700 mb-1">Realm NFT canister</label>
				<input
					id="rs-nft-canister"
					type="text"
					bind:value={realmSettingsNftCanisterId}
					placeholder="xxxxx-xxxxx-xxxxx-xxxxx-cai"
					class={cn(
						'w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:border-blue-500',
						realmSettingsNftCanisterId && !nftCanisterIdValid
							? 'border-red-300 focus:ring-red-300'
							: 'border-gray-300 focus:ring-blue-500',
					)}
				/>
				<p class="mt-1 text-xs text-gray-500">Shared platform NFT canister for this network. The realm backend must be an authorized minter.</p>
			</div>
		</section>

		{@render saveBar()}
	{:else if activeTab === 'infrastructure'}
		<!-- Infrastructure -->
		<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-1">Infrastructure</h2>
			<p class="text-sm text-gray-500 mb-5">
				Where this realm downloads and purchases extensions, codices, and assistants.
				Changing these requires the <code class="bg-gray-100 px-1 rounded">realm.configure.infrastructure</code> permission.
			</p>
			<div class="space-y-4">
				<div>
					<label for="rs-file-registry" class="block text-sm font-medium text-gray-700 mb-1">File Registry Canister ID</label>
					<input id="rs-file-registry" type="text" bind:value={realmSettingsFileRegistryId}
						placeholder="xxxxx-xxxxx-xxxxx-xxxxx-cai"
						class={cn(
							'w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:border-blue-500',
							realmSettingsFileRegistryId && !fileRegistryIdValid
								? 'border-red-300 focus:ring-red-300'
								: 'border-gray-300 focus:ring-blue-500'
						)} />
					{#if realmSettingsFileRegistryId && !fileRegistryIdValid}
						<p class="mt-1 text-xs text-red-600">Invalid canister ID format. Expected format: xxxxx-xxxxx-...-cai</p>
					{/if}
					<p class="mt-1 text-xs text-gray-500">Stores extension, codex, and assistant artifact files.</p>
				</div>
				<div>
					<label for="rs-marketplace" class="block text-sm font-medium text-gray-700 mb-1">Marketplace Canister ID</label>
					<input id="rs-marketplace" type="text" bind:value={realmSettingsMarketplaceId}
						placeholder="xxxxx-xxxxx-xxxxx-xxxxx-cai"
						class={cn(
							'w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:border-blue-500',
							realmSettingsMarketplaceId && !marketplaceIdValid
								? 'border-red-300 focus:ring-red-300'
								: 'border-gray-300 focus:ring-blue-500'
						)} />
					{#if realmSettingsMarketplaceId && !marketplaceIdValid}
						<p class="mt-1 text-xs text-red-600">Invalid canister ID format. Expected format: xxxxx-xxxxx-...-cai</p>
					{/if}
					<p class="mt-1 text-xs text-gray-500">Marketplace for discovering and purchasing packages.</p>
				</div>
			</div>
		</section>

		{@render saveBar()}
	{:else if activeTab === 'advanced'}
		<DepartmentTablePanel {ctx} {addToast} />
		<QuartersPanel {ctx} {addToast} />
		<TrustPolicyPanel {ctx} {addToast} />
	{/if}
</div>

<ProposalModal
	{ctx}
	open={proposalModalOpen}
	title={proposalModalTitle}
	description={proposalModalDescription}
	actions={proposalModalActions}
	deniedOperation={proposalModalOperation}
	onclose={() => proposalModalOpen = false}
/>

{#if savePreview}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
		<div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-2">
				{savePreview.appliesDirectly ? 'Applies immediately' : `Needs a root vote (policy ${savePreview.policy})`}
			</h3>
			<p class="text-sm text-gray-600 mb-5">
				{#if savePreview.appliesDirectly}
					Root policy is {savePreview.policy}, so this save will take effect as soon as you continue.
				{:else}
					Root department <span class="font-medium">{savePreview.governedBy}</span> uses
					policy {savePreview.policy}. Continuing files that proposal.
					The change applies only after the vote passes.
				{/if}
			</p>
			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={() => { savePreview = null; }}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
				>Cancel</button>
				<button
					type="button"
					onclick={confirmSavePreview}
					class="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-600,#2563eb)] rounded-lg hover:bg-[var(--color-primary-700,#1d4ed8)] transition-colors"
				>Continue</button>
			</div>
		</div>
	</div>
{/if}
