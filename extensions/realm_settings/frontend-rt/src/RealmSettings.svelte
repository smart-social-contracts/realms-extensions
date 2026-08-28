<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import ProposalModal from './ProposalModal.svelte';
	import QuartersPanel from './QuartersPanel.svelte';
	import SandboxPanel from './SandboxPanel.svelte';
	import TrustPolicyPanel from './TrustPolicyPanel.svelte';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';
	import {
		CUSTOM_TOKEN_ID,
		SHARED_TOKEN_CATALOG,
		isTokenChoiceSelectable,
		matchSharedToken,
		monetaryUnavailableLabel,
		resolveDisableMonetaryTokens,
		setupTokenNetwork,
	} from './tokenCatalog';

	let { ctx }: { ctx: any } = $props();

	let narrow = $state(isNarrowViewport());
	$effect(() => subscribeNarrowViewport((value) => { narrow = value; }));

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
let realmSettingsTokenIndexerId = $state('');
let realmSettingsNftCanisterId = $state('');
let governanceVotingWindowDays = $state<number | null>(null);
let liveVotingWindowSeconds = $state<number | null>(null);
let tokenResolving = $state(false);
let tokenChoice = $state('REALMS');
let monetaryTokensDisabled = $state(false);
let tokenPickerLocale = $state('en');
let tokenNetwork = $state(setupTokenNetwork());

// Email notification configuration (issue #266): realm-level on/off toggle.
// Sender identity is derived from realm settings; SMTP credentials stay on the server.
let realmSettingsEmailEnabled = $state(true);
let savedEmailEnabled = $state(true);
let adminEmail = $state('');
let testFlagsEnabled = $state(false);
let emailDirty = $derived(realmSettingsEmailEnabled !== savedEmailEnabled);
let inhabitantEmails = $state('');
let sendingJoinLink = $state(false);
let joinLinkHref = $state('');

	// Governed-action confirmation (issue #262): when the root org policy is
	// not 1/1, update_realm_config returns requires_confirmation and the
	// change must go through a proposal + vote.
	let governedConfirm = $state<any>(null);
	let governedSubmitting = $state(false);
	let governedRetry = $state<(() => Promise<void>) | null>(null);

type SettingsTab = 'general' | 'governance' | 'treasury' | 'infrastructure' | 'notifications' | 'advanced';
let activeTab: SettingsTab = $state('general');

	async function callExt(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

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

	let governanceDirty = $derived(
		liveVotingWindowSeconds != null &&
			governanceVotingWindowDays != null &&
			Number.isFinite(governanceVotingWindowDays) &&
			Math.round(governanceVotingWindowDays * 86400) !== liveVotingWindowSeconds,
	);
	let tokenResolveMessage = $state('');
	let tokenResolveError = $state('');

	// Lifecycle state
	let lifecycleLoading = $state(true);
	let lifecycleAdvancing = $state(false);
	let lifecycleError = $state('');
	let currentStage = $state('alpha');
	let stageIndex = $state(0);
	let lifecycleData: any = $state({});
	const STAGES = ['alpha', 'beta', 'production', 'deprecation', 'terminated'];
	const STAGE_LABELS: Record<string, string> = {
		alpha: 'Alpha',
		beta: 'Beta',
		production: 'Production',
		deprecation: 'Deprecation',
		terminated: 'Terminated',
	};
	const STAGE_DESCRIPTIONS: Record<string, string> = {
		alpha: 'Gathering interest, deposits refundable',
		beta: 'Deposits locked, infrastructure preparation',
		production: 'Fully operational',
		deprecation: 'Winding down, no new members',
		terminated: 'Closed, read-only archive',
	};

	let proposalModalOpen = $state(false);
	let proposalModalTitle = $state('');
	let proposalModalDescription = $state('');
	let proposalModalCode = $state('');
	let proposalModalOperation = $state('');

	function addToast(message: string, type: 'success' | 'error' = 'success') {
		const level = type === 'error' ? 'error' : 'success';
		if (typeof ctx.notify === 'function') {
			ctx.notify(level, message);
			return;
		}
		console.warn('[extension]', level, message);
	}

	function buildTokenWalletProposalLines(): string[] {
		const lines: string[] = [];
		if (!realmSettingsTokenCanisterId || !realmSettingsCurrency.trim()) {
			return lines;
		}
		const indexer = realmSettingsTokenIndexerId.trim() || realmSettingsTokenCanisterId.trim();
		const sym = realmSettingsCurrency.trim();
		const decimals = Number(realmSettingsCurrencyDecimals) || 0;
		lines.push('');
		lines.push('from ggg import Token');
		lines.push(`_sym = ${JSON.stringify(sym)}`);
		lines.push(`_existing = Token[_sym]`);
		lines.push('if _existing:');
		lines.push(`    _existing.ledger = ${JSON.stringify(realmSettingsTokenCanisterId.trim())}`);
		lines.push(`    _existing.indexer = ${JSON.stringify(indexer)}`);
		lines.push(`    _existing.decimals = ${decimals}`);
		lines.push(`    _existing.symbol = _sym`);
		lines.push('else:');
		lines.push(
			`    _t = Token(name=_sym, ledger=${JSON.stringify(realmSettingsTokenCanisterId.trim())}, indexer=${JSON.stringify(indexer)}, decimals=${decimals})`,
		);
		lines.push('    _t.symbol = _sym');
		return lines;
	}

	function isValidHexColor(value: string): boolean {
		return /^#[0-9A-Fa-f]{6}$/.test(value);
	}

	function buildRealmConfigCode(): string {
		const lines = ['from ggg import Realm', '', 'realm = Realm.load("1")'];
		if (realmSettingsName) lines.push(`realm.name = ${JSON.stringify(realmSettingsName)}`);
		if (realmSettingsManifesto) lines.push(`realm.manifesto = ${JSON.stringify(realmSettingsManifesto)}`);
		lines.push(`realm.welcome_message = ${JSON.stringify(realmSettingsWelcome)}`);
		if (realmSettingsLogoUrl) lines.push(`realm.logo_url = ${JSON.stringify(realmSettingsLogoUrl)}`);
		if (realmSettingsBackgroundUrl) lines.push(`realm.background_image_url = ${JSON.stringify(realmSettingsBackgroundUrl)}`);
		lines.push(`realm.open_registration = ${realmSettingsOpenRegistration ? 'True' : 'False'}`);
		lines.push(`realm.ai_assistant_enabled = ${realmSettingsAiAssistantEnabled ? 'True' : 'False'}`);
		if (realmSettingsTokenCanisterId.trim()) {
			lines.push(`realm.token_canister_id = ${JSON.stringify(realmSettingsTokenCanisterId.trim())}`);
		}
		if (realmSettingsNftCanisterId.trim()) {
			lines.push(`realm.nft_canister_id = ${JSON.stringify(realmSettingsNftCanisterId.trim())}`);
		}
		if (realmSettingsFileRegistryId) lines.push(`realm.file_registry_canister_id = ${JSON.stringify(realmSettingsFileRegistryId)}`);
		if (realmSettingsMarketplaceId) lines.push(`realm.marketplace_canister_id = ${JSON.stringify(realmSettingsMarketplaceId)}`);
		lines.push(...buildTokenWalletProposalLines());
		lines.push('');
		lines.push('import json');
		lines.push('_md = json.loads(realm.manifest_data or "{}")');
		lines.push('_setup = _md.get("setup") or {}');
		lines.push('if not isinstance(_setup, dict):');
		lines.push('    _setup = {}');
		lines.push('_branding = _setup.get("branding") or {}');
		lines.push('if not isinstance(_branding, dict):');
		lines.push('    _branding = {}');
		lines.push('_colors = _branding.get("colors") or {}');
		lines.push('if not isinstance(_colors, dict):');
		lines.push('    _colors = {}');
		lines.push(`_colors["primary"] = ${JSON.stringify(realmSettingsPrimaryColor)}`);
		lines.push('_branding["colors"] = _colors');
		lines.push('_setup["branding"] = _branding');
		lines.push('_md["setup"] = _setup');
		lines.push('realm.manifest_data = json.dumps(_md)');
		return lines.join('\n');
	}

	function openProposalForSettings(deniedOp: string) {
		proposalModalTitle = 'Update realm settings';
		proposalModalDescription = 'This proposal updates the realm configuration (identity, branding, registration, currency, and infrastructure) as specified in the code below.';
		proposalModalCode = buildRealmConfigCode();
		proposalModalOperation = deniedOp;
		proposalModalOpen = true;
	}

	async function loadRealmSettings() {
		settingsLoading = true;
		settingsError = '';
		try {
			const resp = await ctx.backend.status();
			if (resp?.success && resp?.data?.status) {
				const s = resp.data.status;
				realmSettingsName = s.realm_name || '';
				realmSettingsManifesto = s.realm_manifesto || '';
				realmSettingsWelcome = s.realm_welcome_message || '';
				realmSettingsLogoUrl = s.logo_url || '';
				realmSettingsBackgroundUrl = s.background_image_url || '';
				realmSettingsPrimaryColor =
					typeof s.primary_color === 'string' && isValidHexColor(s.primary_color)
						? s.primary_color
						: '#3b82f6';
				realmSettingsOpenRegistration = !!s.open_registration;
				realmSettingsAiAssistantEnabled = s.ai_assistant_enabled !== false;
				realmSettingsFileRegistryId = s.file_registry_canister_id || '';
				realmSettingsMarketplaceId = s.marketplace_canister_id || '';
				realmSettingsCurrency = s.accounting_currency || '';
				realmSettingsCurrencyDecimals = Number(s.accounting_currency_decimals ?? 8);
				realmSettingsTokenIndexerId = s.token_indexer_canister_id || '';
				const token = (s.canisters || []).find(
					(c: { canister_type?: string }) => c.canister_type === 'token_backend',
				);
				realmSettingsTokenCanisterId = token?.canister_id || '';
				if (!realmSettingsTokenIndexerId && realmSettingsTokenCanisterId) {
					realmSettingsTokenIndexerId = realmSettingsTokenCanisterId;
				}
				const matched = matchSharedToken({
					symbol: realmSettingsCurrency,
					token_canister_id: realmSettingsTokenCanisterId,
				});
				tokenChoice = matched?.id ?? (realmSettingsTokenCanisterId ? CUSTOM_TOKEN_ID : 'REALMS');
				const network = String(s.network || tokenNetwork || '');
				let explicitDisable: boolean | undefined;
				if (typeof s.test_mode_disable_monetary_tokens === 'boolean') {
					explicitDisable = s.test_mode_disable_monetary_tokens;
				} else if (typeof ctx.realmInfo?.testModeDisableMonetaryTokens === 'boolean') {
					explicitDisable = ctx.realmInfo.testModeDisableMonetaryTokens;
				} else {
					try {
						const flagsRaw = await ctx.backend.get_runtime_flags();
						const flags = typeof flagsRaw === 'string' ? JSON.parse(flagsRaw) : flagsRaw;
						if (typeof flags?.test_mode_disable_monetary_tokens === 'boolean') {
							explicitDisable = flags.test_mode_disable_monetary_tokens;
						}
						if (flags?.primary_language) tokenPickerLocale = String(flags.primary_language);
						if (flags?.network) tokenNetwork = setupTokenNetwork(String(flags.network));
					} catch {
						// keep host default from network
					}
				}
				monetaryTokensDisabled = resolveDisableMonetaryTokens(explicitDisable, network);
				tokenPickerLocale = String(
					s.primary_language || ctx.realmInfo?.primaryLanguage || tokenPickerLocale,
				);
				if (s.network) tokenNetwork = setupTokenNetwork(String(s.network));
				const nft = (s.canisters || []).find(
					(c: { canister_type?: string }) => c.canister_type === 'nft_backend',
				);
				realmSettingsNftCanisterId = nft?.canister_id || '';
				testFlagsEnabled = s.test_mode === true || ctx.realmInfo?.testMode === true;
			}
			const gov = await callExt('get_governance_settings');
			if (gov?.success && gov.data) {
				liveVotingWindowSeconds = Number(gov.data.voting_window_seconds ?? 604_800);
				governanceVotingWindowDays = Number(gov.data.voting_window_days ?? liveVotingWindowSeconds / 86400);
			}
			if (realmSettingsTokenCanisterId && isValidCanisterId(realmSettingsTokenCanisterId)) {
				await resolveTokenLedger({ silent: true });
			}
		} catch (e: any) {
			settingsError = e?.message || String(e);
		} finally {
			settingsLoading = false;
		}
	}

	function selectTokenChoice(id: string) {
		if (!isTokenChoiceSelectable(id, monetaryTokensDisabled)) return;
		tokenChoice = id;
		if (id === CUSTOM_TOKEN_ID) return;
		const token = SHARED_TOKEN_CATALOG.find((item) => item.id === id);
		if (!token) return;
		const network = tokenNetwork;
		realmSettingsTokenCanisterId = token.ledgers[network] || Object.values(token.ledgers)[0] || '';
		realmSettingsCurrency = token.symbol;
		realmSettingsCurrencyDecimals = token.decimals;
		realmSettingsTokenIndexerId =
			token.indexers?.[network] || Object.values(token.indexers || {})[0] || realmSettingsTokenCanisterId;
	}

	async function resolveTokenLedger(opts?: { silent?: boolean }) {
		const silent = opts?.silent ?? false;
		tokenResolveError = '';
		if (!silent) {
			tokenResolveMessage = '';
		}
		const ledger = realmSettingsTokenCanisterId.trim();
		if (!ledger || !isValidCanisterId(ledger)) {
			tokenResolveError = 'Enter a valid treasury ledger canister ID first';
			return;
		}
		tokenResolving = true;
		try {
			const raw = await ctx.backend.resolve_token_ledger(ledger);
			const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (result?.success) {
				realmSettingsCurrency = result.symbol || realmSettingsCurrency;
				realmSettingsCurrencyDecimals = Number(result.decimals ?? realmSettingsCurrencyDecimals);
				if (result.indexer_canister_id) {
					realmSettingsTokenIndexerId = result.indexer_canister_id;
				}
				if (!silent) {
					tokenResolveMessage = `Resolved ${result.symbol} (${result.decimals} decimals) from ledger`;
				}
			} else {
				tokenResolveError = result?.error || 'Could not resolve token metadata';
			}
		} catch (e: any) {
			tokenResolveError = e?.message || String(e);
		} finally {
			tokenResolving = false;
		}
	}

	async function saveRealmSettings(confirmProposal = false) {
		settingsSaving = true;
		settingsMessage = '';
		settingsError = '';
		try {
			const config: Record<string, unknown> = {
				...(confirmProposal ? { confirm: true } : {}),
				name: realmSettingsName,
				manifesto: realmSettingsManifesto,
				welcome_message: realmSettingsWelcome,
				logo_url: realmSettingsLogoUrl,
				background_image_url: realmSettingsBackgroundUrl,
				primary_color: realmSettingsPrimaryColor,
				open_registration: realmSettingsOpenRegistration,
				ai_assistant_enabled: realmSettingsAiAssistantEnabled,
				token_canister_id: realmSettingsTokenCanisterId.trim(),
				token_indexer_canister_id:
					realmSettingsTokenIndexerId.trim() || realmSettingsTokenCanisterId.trim(),
				nft_canister_id: realmSettingsNftCanisterId.trim(),
				file_registry_canister_id: realmSettingsFileRegistryId,
				marketplace_canister_id: realmSettingsMarketplaceId,
				email_service_config: {
					enabled: realmSettingsEmailEnabled,
				},
				config_overrides: {
					governance: {
						voting_window_days: Number(
							governanceVotingWindowDays ?? (liveVotingWindowSeconds != null ? liveVotingWindowSeconds / 86400 : 7),
						),
					},
				},
			};
			const raw = await ctx.backend.update_realm_config(JSON.stringify(config));
			const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (result?.applied === 'proposal') {
				governedConfirm = null;
				settingsMessage = `Proposal ${result.proposal_id} created — the change applies after the vote passes (see the Voting page).`;
				addToast(`Proposal ${result.proposal_id} created`);
			} else if (result?.requires_confirmation) {
				governedConfirm = result;
				governedRetry = () => saveRealmSettings(true);
			} else if (result?.success) {
				settingsMessage = 'Realm settings saved successfully.';
				addToast('Realm settings updated');
				savedEmailEnabled = realmSettingsEmailEnabled;
				const gov = await callExt('get_governance_settings');
				if (gov?.success && gov.data) {
					liveVotingWindowSeconds = Number(gov.data.voting_window_seconds ?? 604_800);
					governanceVotingWindowDays = Number(gov.data.voting_window_days ?? liveVotingWindowSeconds / 86400);
				}
				await ctx.realmInfo?.fetch?.();
			} else if (result?.denied_operation) {
				openProposalForSettings(result.denied_operation);
			} else {
				settingsError = result?.error || 'Failed to save settings';
				if (result?.error_code === 'ledger_unresolvable') {
					tokenResolveError = result.error || settingsError;
				}
			}
		} catch (e: any) {
			const msg = e?.message || String(e);
			if (msg.includes('Access denied') && msg.includes("lacks permission")) {
				const match = msg.match(/lacks permission '([^']+)'/);
				openProposalForSettings(match?.[1] || 'realm.configure');
			} else {
				settingsError = msg;
			}
		} finally {
			settingsSaving = false;
		}
	}

	async function submitGovernedProposal() {
		if (!governedRetry) return;
		governedSubmitting = true;
		try {
			await governedRetry();
		} finally {
			governedSubmitting = false;
		}
	}

	function isValidCanisterId(value: string): boolean {
		if (!value) return true;
		return /^[a-z0-9]{5}(-[a-z0-9]{5})*-cai$/.test(value);
	}

	let fileRegistryIdValid = $derived(isValidCanisterId(realmSettingsFileRegistryId));
	let marketplaceIdValid = $derived(isValidCanisterId(realmSettingsMarketplaceId));
	let tokenCanisterIdValid = $derived(isValidCanisterId(realmSettingsTokenCanisterId));
	let tokenIndexerIdValid = $derived(isValidCanisterId(realmSettingsTokenIndexerId));
	let nftCanisterIdValid = $derived(isValidCanisterId(realmSettingsNftCanisterId));
	let currencyValid = $derived(
		!!realmSettingsCurrency.trim() &&
			realmSettingsCurrency.trim().length <= 16 &&
			Number.isInteger(Number(realmSettingsCurrencyDecimals)) &&
			Number(realmSettingsCurrencyDecimals) >= 0 &&
			Number(realmSettingsCurrencyDecimals) <= 18 &&
			(!realmSettingsTokenCanisterId.trim() || tokenCanisterIdValid),
	);
	let tokensValid = $derived(
		tokenCanisterIdValid &&
			tokenIndexerIdValid &&
			nftCanisterIdValid &&
			(!realmSettingsTokenCanisterId.trim() || !!realmSettingsCurrency.trim()),
	);
	let infraValid = $derived(fileRegistryIdValid && marketplaceIdValid && currencyValid && tokensValid);

	let nextStage = $derived(
		stageIndex < STAGES.length - 1 ? STAGES[stageIndex + 1] : null
	);

	async function loadLifecycle() {
		lifecycleLoading = true;
		lifecycleError = '';
		try {
		const raw = await ctx.backend.extension_sync_call(
			'realm_settings',
			'get_realm_stage',
			'{}',
		);
			const envelope = typeof raw === 'string' ? JSON.parse(raw) : raw;
			const res = envelope?.response
				? typeof envelope.response === 'string'
					? JSON.parse(envelope.response)
					: envelope.response
				: envelope;
			if (res?.success && res?.data) {
				currentStage = res.data.stage || 'alpha';
				stageIndex = res.data.stage_index ?? 0;
				lifecycleData = res.data.lifecycle || {};
			} else {
				lifecycleError = res?.error || 'Failed to load lifecycle';
			}
		} catch (e: any) {
			lifecycleError = e?.message || String(e);
		} finally {
			lifecycleLoading = false;
		}
	}

	async function advanceStage(confirmProposal = false) {
		if (!nextStage) return;
		lifecycleAdvancing = true;
		lifecycleError = '';
		try {
		const raw = await ctx.backend.extension_sync_call(
			'realm_settings',
			'set_realm_stage',
			JSON.stringify({
				stage: nextStage,
				reason: 'Admin advancement via Settings',
				...(confirmProposal ? { confirm: true } : {}),
			}),
		);
			const envelope = typeof raw === 'string' ? JSON.parse(raw) : raw;
			const res = envelope?.response
				? typeof envelope.response === 'string'
					? JSON.parse(envelope.response)
					: envelope.response
				: envelope;
			if (res?.applied === 'proposal') {
				governedConfirm = null;
				addToast(`Proposal ${res.proposal_id} created — stage advances after the vote passes`);
			} else if (res?.requires_confirmation) {
				governedConfirm = res;
				governedRetry = () => advanceStage(true);
			} else if (res?.success) {
				addToast(`Stage advanced to ${STAGE_LABELS[nextStage]}`);
				await loadLifecycle();
			} else if (res?.denied_operation) {
				openProposalForStageAdvance(res.denied_operation);
			} else {
				lifecycleError = res?.error || 'Failed to advance stage';
			}
		} catch (e: any) {
			const msg = e?.message || String(e);
			if (msg.includes('Access denied') && msg.includes("lacks permission")) {
				const match = msg.match(/lacks permission '([^']+)'/);
				openProposalForStageAdvance(match?.[1] || 'realm.lifecycle.advance');
			} else {
				lifecycleError = msg;
			}
		} finally {
			lifecycleAdvancing = false;
		}
	}

	function openProposalForStageAdvance(deniedOp: string) {
		if (!nextStage) return;
		proposalModalTitle = `Advance realm to ${STAGE_LABELS[nextStage]} stage`;
		proposalModalDescription = `This proposal advances the realm from "${STAGE_LABELS[currentStage]}" to "${STAGE_LABELS[nextStage]}". ${STAGE_DESCRIPTIONS[nextStage]}.`;
		proposalModalCode = [
			'from ggg import Realm',
			'',
			'realm = Realm.load("1")',
			`realm.status = "${nextStage}"`,
		].join('\n');
		proposalModalOperation = deniedOp;
		proposalModalOpen = true;
	}

	function parseExtensionEnvelope(raw: unknown) {
		const envelope = typeof raw === 'string' ? JSON.parse(raw) : raw;
		return envelope?.response
			? typeof envelope.response === 'string'
				? JSON.parse(envelope.response)
				: envelope.response
			: envelope;
	}

	async function loadEmailConfig() {
		try {
			const raw = await ctx.backend.extension_sync_call(
				'realm_settings',
				'get_email_config',
				'{}',
			);
			const res = parseExtensionEnvelope(raw);
			if (res?.success && res?.data) {
				realmSettingsEmailEnabled = res.data.enabled !== false;
				savedEmailEnabled = res.data.enabled !== false;
			}

			const userEmailRaw = await ctx.backend.extension_sync_call(
				'notifications',
				'get_user_email',
				'{}',
			);
			const userRes = parseExtensionEnvelope(userEmailRaw);
			if (userRes?.success && userRes?.data) {
				adminEmail = userRes.data.email || '';
			}
		} catch (e: any) {
			console.error('Failed to load email config:', e?.message || String(e));
		}
	}

	async function sendInhabitantJoinLink() {
		settingsMessage = '';
		settingsError = '';
		joinLinkHref = '';
		const emails = inhabitantEmails
			.split(/[\n,;]+/)
			.map((value) => value.trim())
			.filter(Boolean);
		if (emails.length === 0) {
			settingsError = 'Enter one or more inhabitant email addresses.';
			return;
		}
		sendingJoinLink = true;
		try {
			const raw = await ctx.backend.extension_sync_call(
				'notifications',
				'send_join_link',
				JSON.stringify({ emails }),
			);
			const res = parseExtensionEnvelope(raw);
			if (res?.success) {
				const data = res.data || {};
				const queued = data.queued ?? emails.length;
				joinLinkHref = data.href || '';
				settingsMessage = `Join link queued to ${queued} inhabitant${queued === 1 ? '' : 's'}.`;
				addToast(settingsMessage);
			} else {
				settingsError = res?.error || 'Failed to queue join-link emails';
			}
		} catch (e: any) {
			settingsError = e?.message || String(e);
		} finally {
			sendingJoinLink = false;
		}
	}

	async function sendTestEmail() {
		settingsMessage = '';
		settingsError = '';
		try {
			const raw = await ctx.backend.extension_sync_call(
				'notifications',
				'send_test_email',
				JSON.stringify({
					subject: 'Realms email test',
					body: 'If you received this message, the realm email service is configured correctly.',
				}),
			);
			const res = parseExtensionEnvelope(raw);
			if (res?.success) {
				const dest = adminEmail.trim() || 'your address';
				settingsMessage = `Test email queued to ${dest}.`;
				addToast(`Test email queued to ${dest}`);
			} else {
				settingsError = res?.error || 'Failed to queue test email';
			}
		} catch (e: any) {
			settingsError = e?.message || String(e);
		}
	}

	$effect(() => {
		loadRealmSettings();
		loadLifecycle();
		loadEmailConfig();
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
			<div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">{settingsMessage}</div>
		{/if}
		{#if settingsError}
			<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{settingsError}</div>
		{/if}
		<button
			type="button"
			onclick={() => saveRealmSettings()}
			disabled={activeTab === 'notifications'
				? settingsSaving || !emailDirty
				: settingsSaving || !infraValid || governanceVotingWindowDays == null}
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
			onclick={() => (activeTab = 'notifications')}
			class="chrome-tab {activeTab === 'notifications' ? 'is-on' : ''}"
			title="Notifications"
			aria-label="Notifications"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
			<span class="chrome-label">Notifications</span>
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
				href="https://github.com/smart-social-contracts/realms/blob/main/docs/reference/REALM_LIFECYCLE.md"
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
				<div class="absolute top-[18px] left-[10%] right-[10%] h-0.5 bg-gray-200 -z-0"></div>
				<div
					class="absolute top-[18px] left-[10%] h-0.5 bg-green-500 -z-0 transition-all duration-500"
					style="width: {stageIndex / (STAGES.length - 1) * 80}%"
				></div>
			</div>

			<!-- Lifecycle metrics -->
			{#if currentStage === 'alpha' || currentStage === 'beta'}
				{#if narrow}
					<div class="grid grid-cols-2 mb-5 border-y border-gray-200">
						<div class="px-3 py-2 border-b border-r border-gray-200">
							<div class="text-xs text-gray-500">Registered Users</div>
							<div class="text-lg font-bold text-gray-900">{lifecycleData.registered_users?.toLocaleString() ?? '—'}</div>
						</div>
						<div class="px-3 py-2 border-b border-gray-200">
							<div class="text-xs text-gray-500">Critical Mass</div>
							<div class="text-lg font-bold text-gray-900">{lifecycleData.critical_mass?.toLocaleString() ?? '—'}</div>
						</div>
						<div class="px-3 py-2 border-r border-gray-200">
							<div class="text-xs text-gray-500">Deposits Locked</div>
							<div class={cn('text-lg font-bold', lifecycleData.deposits_locked ? 'text-amber-600' : 'text-gray-400')}>
								{lifecycleData.deposits_locked ? 'Yes' : 'No'}
							</div>
						</div>
						<div class="px-3 py-2">
							<div class="text-xs text-gray-500">Progress</div>
							<div class="text-lg font-bold text-blue-600">
								{lifecycleData.critical_mass
									? Math.min(100, Math.round((lifecycleData.registered_users / lifecycleData.critical_mass) * 100))
									: 0}%
							</div>
						</div>
					</div>
				{:else}
					<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
						<div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
							<div class="text-xs text-gray-500 mb-1">Registered Users</div>
							<div class="text-lg font-bold text-gray-900">{lifecycleData.registered_users?.toLocaleString() ?? '—'}</div>
						</div>
						<div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
							<div class="text-xs text-gray-500 mb-1">Critical Mass</div>
							<div class="text-lg font-bold text-gray-900">{lifecycleData.critical_mass?.toLocaleString() ?? '—'}</div>
						</div>
						<div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
							<div class="text-xs text-gray-500 mb-1">Deposits Locked</div>
							<div class={cn('text-lg font-bold', lifecycleData.deposits_locked ? 'text-amber-600' : 'text-gray-400')}>
								{lifecycleData.deposits_locked ? 'Yes' : 'No'}
							</div>
						</div>
						<div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
							<div class="text-xs text-gray-500 mb-1">Progress</div>
							<div class="text-lg font-bold text-blue-600">
								{lifecycleData.critical_mass
									? Math.min(100, Math.round((lifecycleData.registered_users / lifecycleData.critical_mass) * 100))
									: 0}%
							</div>
						</div>
					</div>
				{/if}
			{/if}

			{#if currentStage === 'beta'}
				<div class={cn('mb-5', narrow ? 'grid grid-cols-1 gap-0 border-y border-gray-200 divide-y divide-gray-200' : 'grid grid-cols-3 gap-3')}>
					<div class={cn(narrow ? 'px-3 py-2' : 'rounded-lg p-3 border', !narrow && (lifecycleData.land_acquired ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'))}>
						<div class="text-xs text-gray-500 mb-1">Land Acquired</div>
						<div class={cn('text-sm font-semibold', lifecycleData.land_acquired ? 'text-green-700' : 'text-gray-400')}>
							{lifecycleData.land_acquired ? 'Ready' : 'Pending'}
						</div>
					</div>
					<div class={cn(narrow ? 'px-3 py-2' : 'rounded-lg p-3 border', !narrow && (lifecycleData.infrastructure_ready ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'))}>
						<div class="text-xs text-gray-500 mb-1">Infrastructure</div>
						<div class={cn('text-sm font-semibold', lifecycleData.infrastructure_ready ? 'text-green-700' : 'text-gray-400')}>
							{lifecycleData.infrastructure_ready ? 'Ready' : 'Pending'}
						</div>
					</div>
					<div class={cn(narrow ? 'px-3 py-2' : 'rounded-lg p-3 border', !narrow && (lifecycleData.providers_ready ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'))}>
						<div class="text-xs text-gray-500 mb-1">Providers</div>
						<div class={cn('text-sm font-semibold', lifecycleData.providers_ready ? 'text-green-700' : 'text-gray-400')}>
							{lifecycleData.providers_ready ? 'Ready' : 'Pending'}
						</div>
					</div>
				</div>
			{/if}

			<!-- Advance button -->
			{#if nextStage && currentStage !== 'terminated'}
				<div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-gray-100">
					<button
						onclick={() => advanceStage()}
						disabled={lifecycleAdvancing}
						class={cn(
							'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
							currentStage === 'production'
								? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
								: 'bg-[var(--color-primary-600,#2563eb)] text-white hover:bg-[var(--color-primary-700,#1d4ed8)]',
							'disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed'
						)}
					>
						{#if lifecycleAdvancing}
							<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
						{/if}
						Advance to {STAGE_LABELS[nextStage]}
					</button>
					<span class="text-xs text-gray-500">{STAGE_DESCRIPTIONS[nextStage]}</span>
				</div>
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

		<!-- Branding -->
		<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-1">Branding</h2>
			<p class="text-sm text-gray-500 mb-5">Logo, background imagery, and primary color used across the realm UI — including main action buttons.</p>
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
					min="0.0001"
					step="any"
					bind:value={governanceVotingWindowDays}
					class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
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
		</section>

		{@render saveBar()}
	{:else if activeTab === 'treasury'}
		<!-- Currency -->
		<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-1">Currency token</h2>
			<p class="text-sm text-gray-500 mb-5">
				Fungible treasury token used for balances, invoices, and transfers in this realm.
				Changing ledger or indexer requires <code class="bg-gray-100 px-1 rounded">realm.configure.tokens</code>.
			</p>
			<div class="space-y-3 mb-5">
				{#each SHARED_TOKEN_CATALOG as token (token.id)}
					{@const selectable = isTokenChoiceSelectable(token.id, monetaryTokensDisabled)}
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
				{@const customSelectable = isTokenChoiceSelectable(CUSTOM_TOKEN_ID, monetaryTokensDisabled)}
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
					<div class="flex flex-col sm:flex-row gap-2">
						<input
							id="rs-token-ledger"
							type="text"
							bind:value={realmSettingsTokenCanisterId}
							onblur={resolveTokenLedger}
							placeholder="e.g. cj65k-laaaa-aaaac-bfxqq-cai"
							disabled={monetaryTokensDisabled && tokenChoice !== 'REALMS'}
							class={cn(
								'flex-1 px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:border-blue-500',
								realmSettingsTokenCanisterId && !tokenCanisterIdValid
									? 'border-red-300 focus:ring-red-300'
									: 'border-gray-300 focus:ring-blue-500',
							)}
						/>
						<button
							type="button"
							onclick={resolveTokenLedger}
							disabled={tokenResolving || !realmSettingsTokenCanisterId.trim() || (monetaryTokensDisabled && tokenChoice !== 'REALMS')}
							class="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
						>{tokenResolving ? 'Resolving…' : 'Resolve from ledger'}</button>
					</div>
					<p class="mt-1 text-xs text-gray-500">ICRC-1 ledger for treasury balances and transfers.</p>
				</div>
				<div>
					<label for="rs-token-indexer" class="block text-sm font-medium text-gray-700 mb-1">Token indexer canister</label>
					<input
						id="rs-token-indexer"
						type="text"
						bind:value={realmSettingsTokenIndexerId}
						placeholder="Defaults to ledger when blank"
						class={cn(
							'w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:border-blue-500',
							realmSettingsTokenIndexerId && !tokenIndexerIdValid
								? 'border-red-300 focus:ring-red-300'
								: 'border-gray-300 focus:ring-blue-500',
						)}
					/>
					<p class="mt-1 text-xs text-gray-500">ICRC-1 indexer for invoice payment detection (ckBTC uses a separate index canister).</p>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
				<div>
					<label for="rs-currency" class="block text-sm font-medium text-gray-700 mb-1">Currency symbol</label>
					<input id="rs-currency" type="text" bind:value={realmSettingsCurrency} placeholder="REALMS" maxlength="16" readonly
						class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700" />
					<p class="mt-1 text-xs text-gray-500">Auto-filled from the ledger canister metadata.</p>
				</div>
				<div>
					<label for="rs-decimals" class="block text-sm font-medium text-gray-700 mb-1">Decimals</label>
					<input id="rs-decimals" type="number" bind:value={realmSettingsCurrencyDecimals} min="0" max="18" step="1" readonly
						class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700" />
					<p class="mt-1 text-xs text-gray-500">Auto-filled from the ledger canister metadata.</p>
				</div>
			</div>
			{#if tokenResolveMessage}
				<p class="mt-3 text-xs text-green-700">{tokenResolveMessage}</p>
			{/if}
			{#if tokenResolveError}
				<p class="mt-3 text-xs text-red-600">{tokenResolveError}</p>
			{/if}
			{#if !currencyValid}
				<p class="mt-3 text-xs text-red-600">Resolve a valid ledger canister to populate symbol and decimals.</p>
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
					placeholder="e.g. 27sff-mqaaa-aaaah-quntq-cai"
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
						placeholder="e.g. uq2mu-kaaaa-aaaah-avqcq-cai"
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
						placeholder="e.g. u4hsn-kaaaa-aaaah-avqda-cai"
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
	{:else if activeTab === 'notifications'}
		<!-- Email notifications -->
		<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-1">Email notifications</h2>
			<p class="text-sm text-gray-500 mb-5">
				When enabled, every notification emails members who have a verified address.
				Mail is sent using the realm name as the sender; SMTP credentials stay on the server and are not stored in the realm.
			</p>

			<div class="space-y-5">
				<div class="flex items-center gap-3">
					<label for="rs-email-enabled" class="relative inline-flex items-center cursor-pointer">
						<input id="rs-email-enabled" type="checkbox" bind:checked={realmSettingsEmailEnabled} class="sr-only peer" />
						<div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
					</label>
					<div>
						<span class="text-sm font-medium text-gray-700">Enable email notifications</span>
						<p class="text-xs text-gray-500">When off, no emails are sent regardless of user preferences.</p>
					</div>
				</div>

				<div class="pt-5 border-t border-gray-100">
					<h3 class="text-sm font-semibold text-gray-900">Send join link to inhabitants</h3>
					<p class="mt-1 text-sm text-gray-500">
						Email the realm join URL to inhabitants (citizens), including people who are not members yet.
						Civil servants are not the only audience — anyone you list here receives the same public join link.
					</p>
					<label for="rs-inhabitant-emails" class="mt-3 block text-sm font-medium text-gray-700">
						Inhabitant email addresses
					</label>
					<textarea
						id="rs-inhabitant-emails"
						bind:value={inhabitantEmails}
						rows="4"
						placeholder="one@example.com&#10;two@example.com"
						class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					></textarea>
					<p class="mt-1 text-xs text-gray-500">Separate addresses with commas, semicolons, or new lines.</p>
					<button
						type="button"
						onclick={sendInhabitantJoinLink}
						disabled={sendingJoinLink || !inhabitantEmails.trim()}
						class="mt-3 px-6 py-2.5 bg-[var(--color-primary-600,#2563eb)] text-white rounded-lg hover:bg-[var(--color-primary-700,#1d4ed8)] disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
					>
						{sendingJoinLink ? 'Sending…' : 'Send link'}
					</button>
					{#if joinLinkHref}
						<p class="mt-2 text-xs text-gray-600">
							Queued path: <code class="font-mono">{joinLinkHref}</code>
							(the mail worker prefixes the public realm URL).
						</p>
					{/if}
				</div>

				{#if testFlagsEnabled}
					<div class="pt-2 border-t border-gray-100">
						<button
							type="button"
							onclick={sendTestEmail}
							disabled={!adminEmail.trim()}
							class="px-6 py-2.5 bg-[var(--color-primary-600,#2563eb)] text-white rounded-lg hover:bg-[var(--color-primary-700,#1d4ed8)] disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
						>
							Send test email to {adminEmail || 'my address'}
						</button>
						{#if !adminEmail.trim()}
							<p class="mt-2 text-xs text-gray-500">Add your email in user Settings to send a test message.</p>
						{/if}
					</div>
				{/if}
			</div>
		</section>

		{@render saveBar()}
	{:else if activeTab === 'advanced'}
		<QuartersPanel {ctx} {addToast} />
		<TrustPolicyPanel {ctx} {addToast} />
		<SandboxPanel {ctx} {addToast} />
	{/if}
</div>

<ProposalModal
	{ctx}
	open={proposalModalOpen}
	title={proposalModalTitle}
	description={proposalModalDescription}
	codeInline={proposalModalCode}
	deniedOperation={proposalModalOperation}
	onclose={() => proposalModalOpen = false}
/>

{#if governedConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
		<div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
			<div class="flex items-start gap-3 mb-4">
				<div class="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
					<svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m0 3.75h.008M4.5 19.5h15a1.5 1.5 0 001.3-2.25l-7.5-13a1.5 1.5 0 00-2.6 0l-7.5 13a1.5 1.5 0 001.3 2.25z"/>
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-900">A vote is required</h3>
					<p class="text-sm text-gray-600 mt-1">
						{governedConfirm.summary || 'This change'} is governed by
						<span class="font-medium">{governedConfirm.governed_by}</span>
						(policy {governedConfirm.governed_policy || governedConfirm.policy}).
						It will only apply after the proposal passes on the Voting page.
					</p>
				</div>
			</div>
			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={() => { governedConfirm = null; governedRetry = null; }}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
				>Cancel</button>
				<button
					type="button"
					onclick={submitGovernedProposal}
					disabled={governedSubmitting}
					class="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-600,#2563eb)] rounded-lg hover:bg-[var(--color-primary-700,#1d4ed8)] disabled:bg-gray-400 transition-colors"
				>{governedSubmitting ? 'Submitting…' : 'Submit proposal'}</button>
			</div>
		</div>
	</div>
{/if}
