<script lang="ts">
	import ProposalModal from './ProposalModal.svelte';
	import QuartersPanel from './QuartersPanel.svelte';

	let { ctx }: { ctx: any } = $props();

	const cn = ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' '));

	interface Toast {
		id: number;
		type: 'success' | 'error';
		text: string;
	}

	let toasts: Toast[] = $state([]);
	let toastCounter = $state(0);

	let settingsLoading = $state(true);
	let settingsSaving = $state(false);
	let settingsMessage = $state('');
	let settingsError = $state('');
	let realmSettingsName = $state('');
	let realmSettingsManifesto = $state('');
	let realmSettingsWelcome = $state('');
	let realmSettingsLogoUrl = $state('');
	let realmSettingsBackgroundUrl = $state('');
	let realmSettingsOpenRegistration = $state(false);
	let realmSettingsAiAssistantEnabled = $state(true);
	let realmSettingsFileRegistryId = $state('');
	let realmSettingsMarketplaceId = $state('');

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
		const id = ++toastCounter;
		toasts = [...toasts, { id, text: message, type }];
		setTimeout(() => {
			toasts = toasts.filter(t => t.id !== id);
		}, 4000);
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
		if (realmSettingsFileRegistryId) lines.push(`realm.file_registry_canister_id = ${JSON.stringify(realmSettingsFileRegistryId)}`);
		if (realmSettingsMarketplaceId) lines.push(`realm.marketplace_canister_id = ${JSON.stringify(realmSettingsMarketplaceId)}`);
		return lines.join('\n');
	}

	function openProposalForSettings(deniedOp: string) {
		proposalModalTitle = 'Update realm settings';
		proposalModalDescription = 'This proposal updates the realm configuration (name, manifesto, welcome message, branding, and registration settings) as specified in the code below.';
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
				realmSettingsOpenRegistration = !!s.open_registration;
				realmSettingsAiAssistantEnabled = s.ai_assistant_enabled !== false;
				realmSettingsFileRegistryId = s.file_registry_canister_id || '';
				realmSettingsMarketplaceId = s.marketplace_canister_id || '';
			}
		} catch (e: any) {
			settingsError = e?.message || String(e);
		} finally {
			settingsLoading = false;
		}
	}

	async function saveRealmSettings() {
		settingsSaving = true;
		settingsMessage = '';
		settingsError = '';
		try {
			const config: Record<string, unknown> = {
				name: realmSettingsName,
				manifesto: realmSettingsManifesto,
				welcome_message: realmSettingsWelcome,
				logo_url: realmSettingsLogoUrl,
				background_image_url: realmSettingsBackgroundUrl,
				open_registration: realmSettingsOpenRegistration,
				ai_assistant_enabled: realmSettingsAiAssistantEnabled,
				file_registry_canister_id: realmSettingsFileRegistryId,
				marketplace_canister_id: realmSettingsMarketplaceId,
			};
			const raw = await ctx.backend.update_realm_config(JSON.stringify(config));
			const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (result?.success) {
				settingsMessage = 'Realm settings saved successfully.';
				addToast('Realm settings updated');
				await ctx.realmInfo?.fetch?.();
			} else if (result?.denied_operation) {
				openProposalForSettings(result.denied_operation);
			} else {
				settingsError = result?.error || 'Failed to save settings';
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

	function isValidCanisterId(value: string): boolean {
		if (!value) return true;
		return /^[a-z0-9]{5}(-[a-z0-9]{5})*-cai$/.test(value);
	}

	let fileRegistryIdValid = $derived(isValidCanisterId(realmSettingsFileRegistryId));
	let marketplaceIdValid = $derived(isValidCanisterId(realmSettingsMarketplaceId));
	let infraValid = $derived(fileRegistryIdValid && marketplaceIdValid);

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

	async function advanceStage() {
		if (!nextStage) return;
		lifecycleAdvancing = true;
		lifecycleError = '';
		try {
		const raw = await ctx.backend.extension_sync_call(
			'realm_settings',
			'set_realm_stage',
			JSON.stringify({ stage: nextStage, reason: 'Admin advancement via Settings' }),
		);
			const envelope = typeof raw === 'string' ? JSON.parse(raw) : raw;
			const res = envelope?.response
				? typeof envelope.response === 'string'
					? JSON.parse(envelope.response)
					: envelope.response
				: envelope;
			if (res?.success) {
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

	$effect(() => {
		loadRealmSettings();
		loadLifecycle();
	});
</script>

{#if toasts.length > 0}
	<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
		{#each toasts as toast (toast.id)}
			<div class={cn(
				'px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all',
				toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
			)}>
				{toast.text}
			</div>
		{/each}
	</div>
{/if}

<div class="w-full px-4 max-w-none">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Settings</h1>
			<p class="text-gray-600 mt-1">Configure your realm's name, manifesto, branding, and registration settings.</p>
		</div>
	</div>

	<!-- Realm Lifecycle Stage -->
	<div class="bg-white shadow-sm rounded-lg p-6 mb-6">
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
			<div class="relative mb-6">
				<div class="flex items-center justify-between">
					{#each STAGES as stage, i}
						{@const isCurrent = i === stageIndex}
						{@const isPast = i < stageIndex}
						{@const isFuture = i > stageIndex}
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

			{#if currentStage === 'beta'}
				<div class="grid grid-cols-3 gap-3 mb-5">
					<div class={cn('rounded-lg p-3 border', lifecycleData.land_acquired ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100')}>
						<div class="text-xs text-gray-500 mb-1">Land Acquired</div>
						<div class={cn('text-sm font-semibold', lifecycleData.land_acquired ? 'text-green-700' : 'text-gray-400')}>
							{lifecycleData.land_acquired ? 'Ready' : 'Pending'}
						</div>
					</div>
					<div class={cn('rounded-lg p-3 border', lifecycleData.infrastructure_ready ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100')}>
						<div class="text-xs text-gray-500 mb-1">Infrastructure</div>
						<div class={cn('text-sm font-semibold', lifecycleData.infrastructure_ready ? 'text-green-700' : 'text-gray-400')}>
							{lifecycleData.infrastructure_ready ? 'Ready' : 'Pending'}
						</div>
					</div>
					<div class={cn('rounded-lg p-3 border', lifecycleData.providers_ready ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100')}>
						<div class="text-xs text-gray-500 mb-1">Providers</div>
						<div class={cn('text-sm font-semibold', lifecycleData.providers_ready ? 'text-green-700' : 'text-gray-400')}>
							{lifecycleData.providers_ready ? 'Ready' : 'Pending'}
						</div>
					</div>
				</div>
			{/if}

			<!-- Advance button -->
			{#if nextStage && currentStage !== 'terminated'}
				<div class="flex items-center gap-3 pt-2 border-t border-gray-100">
					<button
						onclick={advanceStage}
						disabled={lifecycleAdvancing}
						class={cn(
							'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
							currentStage === 'production'
								? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
								: 'bg-blue-600 text-white hover:bg-blue-700',
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

	<!-- Quarters & Auto-Scaling -->
	<QuartersPanel {ctx} {addToast} />

	<div class="bg-white shadow-sm rounded-lg p-6">
		{#if settingsLoading}
			<div class="flex items-center justify-center py-10">
				<div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
			</div>
		{:else}
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

				<!-- Infrastructure: Registry & Marketplace -->
				<div class="border-t border-gray-200 pt-5 mt-2">
					<h3 class="text-base font-semibold text-gray-900 mb-1">Registry & Marketplace</h3>
					<p class="text-xs text-gray-500 mb-4">
						Configure where this realm downloads and purchases extensions, codices, and assistants.
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
							<p class="mt-1 text-xs text-gray-500">The canister that stores extension, codex, and assistant artifact files.</p>
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
							<p class="mt-1 text-xs text-gray-500">The canister that hosts the marketplace for discovering and purchasing packages.</p>
						</div>
					</div>
				</div>

				{#if settingsMessage}
					<div class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">{settingsMessage}</div>
				{/if}
				{#if settingsError}
					<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{settingsError}</div>
				{/if}

				<div class="pt-2">
					<button
						onclick={saveRealmSettings}
						disabled={settingsSaving || !infraValid}
						class="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
					>{settingsSaving ? 'Saving…' : 'Save Settings'}</button>
				</div>
			</div>
		{/if}
	</div>
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
