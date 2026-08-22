<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';

	let { ctx }: { ctx: any } = $props();

	type VerificationStep = 'idle' | 'generating' | 'pending' | 'verified' | 'failed' | 'error';

	let step = $state<VerificationStep>('idle');
	let verificationLink = $state('');
	let qrCodeUrl = $state('');
	let errorMessage = $state('');
	let verificationResult: any = $state(null);
	let sessionId = $state('');
	let eventId = $state('');
	let copied = $state(false);
	let checkingStatus = $state(false);
	let showDetails = $state(false);

	let currentStepIndex = $derived(
		step === 'idle' ? 0
		: step === 'generating' ? 1
		: step === 'pending' ? 2
		: 3,
	);

	const steps = [
		{ label: 'Start', index: 0 },
		{ label: 'Scan', index: 2 },
		{ label: 'Verified', index: 3 },
	];

	async function callSync(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callSync(fn, args);
	}

	async function callAsync(fn: string, args: Record<string, unknown> = {}) {
		return await ctx.callAsync(fn, args);
	}

	async function generateVerificationLink() {
		try {
			step = 'generating';
			errorMessage = '';

			const eventIdData = await callSync('get_current_application_id');
			eventId = eventIdData?.application_id ?? eventIdData?.data?.application_id ?? '';

			const userId = ctx.principal || '';
			const result = await callAsync('get_verification_link', { user_id: userId });

		if (result?.data?.attributes) {
			if (result.data.attributes.test_mode) {
				sessionId = result.data.id || userId;
				step = 'verified';
				verificationResult = result.data.attributes;
				await createPassportIdentity(result);
				return;
			}
			const verificationUrl =
				result.data.attributes.rarime_app_url || result.data.attributes.get_proof_params;
			verificationLink = verificationUrl;
			qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`;
			sessionId = result.data.id || userId;
			step = 'pending';
		} else if (result?.link || result?.data?.link) {
				verificationLink = result.link ?? result.data.link;
				qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationLink)}`;
				sessionId = userId;
				step = 'pending';
			} else {
				step = 'error';
				errorMessage = 'Invalid response format from verification service';
			}
		} catch (e: any) {
			step = 'error';
			errorMessage = e?.message || 'Network error occurred';
		}
	}

	async function checkVerificationStatus() {
		try {
			checkingStatus = true;
			const userId = ctx.principal || '';
			const result = await callAsync('check_verification_status', { user_id: userId });

			if (result?.data?.attributes) {
				const status = result.data.attributes.status;
				if (status === 'verified') {
					step = 'verified';
					verificationResult = result.data.attributes;
					await createPassportIdentity(result);
				} else if (status === 'failed') {
					step = 'failed';
					errorMessage = 'Passport verification failed';
				}
			} else {
				const st = result?.status ?? result?.verification_status ?? '';
				if (st === 'verified' || st === 'approved') {
					step = 'verified';
					verificationResult = result;
				}
			}
		} catch (e: any) {
			console.error('Error checking verification status:', e);
		} finally {
			checkingStatus = false;
		}
	}

	async function createPassportIdentity(verificationData: any) {
		try {
			await callSync('create_passport_identity', verificationData);
		} catch (e: any) {
			console.error('Error creating passport identity:', e);
		}
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(verificationLink);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			/* clipboard not available */
		}
	}

	function resetVerification() {
		step = 'idle';
		verificationLink = '';
		qrCodeUrl = '';
		errorMessage = '';
		verificationResult = null;
		sessionId = '';
		eventId = '';
		copied = false;
		showDetails = false;
	}
</script>

<div class="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<div class="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
			<svg class="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
			</svg>
		</div>
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Passport Verification</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">{extensionDescription}</p>
		</div>
	</div>

	<!-- Step Indicator -->
	{#if step !== 'error' && step !== 'failed'}
		<div class="flex items-center justify-between">
			{#each steps as { label, index: stepIdx }, i}
				<div class="flex items-center {i < steps.length - 1 ? 'flex-1' : ''}">
					<div class="flex flex-col items-center">
						<div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
							{currentStepIndex >= stepIdx ? 'bg-gray-800 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}">
							{#if currentStepIndex > stepIdx}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
							{:else}
								{i + 1}
							{/if}
						</div>
						<span class="text-xs mt-1 {currentStepIndex >= stepIdx ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 dark:text-gray-500'}">{label}</span>
					</div>
					{#if i < steps.length - 1}
						<div class="flex-1 h-0.5 mx-3 mb-5 {currentStepIndex > stepIdx ? 'bg-gray-800' : 'bg-gray-200 dark:bg-gray-700'}"></div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- IDLE STATE -->
	{#if step === 'idle'}
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 sm:p-6">
			<p class="text-sm text-gray-700 dark:text-gray-300">
				New to this? You need a free phone app called <strong class="font-medium text-gray-900 dark:text-white">RariMe</strong>.
				Install it first, then tap Start. RariMe reads your passport on your phone and this realm only gets a yes/no — not your passport details.
			</p>
			<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
				After you start, scan the QR code (or open the link) with RariMe.
			</p>
			<div class="mt-5 flex flex-col-reverse sm:flex-row gap-2">
				<a
					href="https://app.rarime.com/"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
				>
					Get RariMe
				</a>
				<button
					onclick={generateVerificationLink}
					class="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg"
				>
					Start verification
				</button>
			</div>
		</div>

	<!-- GENERATING STATE -->
	{:else if step === 'generating'}
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
			<svg class="animate-spin h-8 w-8 text-gray-700 dark:text-gray-300 mx-auto mb-4" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
			</svg>
			<p class="text-gray-600 dark:text-gray-400 font-medium">Generating verification link...</p>
			<p class="text-sm text-gray-400 dark:text-gray-500 mt-1">This may take a few seconds</p>
		</div>

	<!-- PENDING STATE -->
	{:else if step === 'pending'}
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
			<div class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-6 py-3 text-left">
				<p class="text-sm font-medium text-gray-800 dark:text-gray-200">Scan this code with the RariMe app on your phone</p>
				<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
					If you have not installed RariMe yet,
					<a href="https://app.rarime.com/" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 text-gray-800 dark:text-gray-200">get the app first</a>, then come back and scan.
				</p>
			</div>

			<div class="p-6 text-center">
				{#if qrCodeUrl}
					<div class="inline-block bg-white p-4 rounded-xl shadow-lg border border-gray-100 mb-4">
						<img src={qrCodeUrl} alt="Passport Verification QR Code" class="block" width="200" height="200" />
					</div>
				{/if}

				{#if verificationLink}
					<div class="flex items-center justify-center gap-2 flex-wrap mb-6">
						<a
							href={verificationLink}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 hover:underline"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
							Open verification link
						</a>
						<button
							onclick={copyToClipboard}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
						>
							{#if copied}
								<svg class="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
								Copied!
							{:else}
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
								Copy link
							{/if}
						</button>
					</div>
				{/if}

				<div class="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 text-left">
					<p class="text-sm text-gray-700 dark:text-gray-300">
						Open RariMe, scan the QR code (or tap the link), and finish the steps in the app. Your passport stays on your phone. When you are done, tap <strong>Check status</strong> below.
					</p>
				</div>
			</div>

			<!-- Collapsible Technical Details -->
			{#if sessionId || eventId}
				<div class="border-t border-gray-200 dark:border-gray-700">
					<button
						onclick={() => showDetails = !showDetails}
						class="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
					>
						<span>Technical Details</span>
						<svg class="w-4 h-4 transition-transform {showDetails ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
						</svg>
					</button>
					{#if showDetails}
						<div class="px-6 pb-4 space-y-1">
							{#if sessionId}
								<p class="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
									<strong>Session ID:</strong> {sessionId}
								</p>
							{/if}
							{#if eventId}
								<p class="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
									<strong>Event ID:</strong> {eventId}
								</p>
							{/if}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Action Buttons Footer -->
			<div class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex gap-3 justify-center">
				<button
					onclick={checkVerificationStatus}
					disabled={checkingStatus}
					class="px-6 py-2.5 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 disabled:opacity-50 rounded-lg flex items-center gap-2 transition-colors"
				>
					{#if checkingStatus}
						<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
						Checking...
					{:else}
						Check Status
					{/if}
				</button>
				<button
					onclick={resetVerification}
					class="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>

	<!-- VERIFIED STATE -->
	{:else if step === 'verified'}
		<div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
			<div class="w-16 h-16 mx-auto mb-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
				<svg class="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			</div>
			<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Passport Verified Successfully!</h2>

			{#if verificationResult}
				<div class="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 mb-4 max-w-sm mx-auto text-left space-y-2">
					{#if verificationResult.citizenship}
						<div>
							<p class="text-xs text-gray-500 dark:text-gray-400">Citizenship</p>
							<p class="text-sm font-semibold text-gray-800 dark:text-gray-200">{verificationResult.citizenship}</p>
						</div>
					{/if}
					{#if verificationResult.verified_at}
						<div>
							<p class="text-xs text-gray-500 dark:text-gray-400">Verified</p>
							<p class="text-sm font-semibold text-gray-800 dark:text-gray-200">{new Date(verificationResult.verified_at).toLocaleString()}</p>
						</div>
					{/if}
				</div>
			{/if}

			<p class="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
				Your passport has been verified. This realm only received a confirmation — not your passport details.
			</p>
		</div>

	<!-- FAILED STATE -->
	{:else if step === 'failed'}
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
			<div class="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center">
				<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			</div>
			<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h2>
			<p class="text-gray-600 dark:text-gray-400 mb-6">Passport verification was not successful. Please try again.</p>
			<button
				onclick={resetVerification}
				class="px-6 py-2.5 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors"
			>
				Try Again
			</button>
		</div>

	<!-- ERROR STATE -->
	{:else if step === 'error'}
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
			<div class="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center">
				<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			</div>
			<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Occurred</h2>
			<p class="text-gray-600 dark:text-gray-400 mb-6">{errorMessage}</p>
			<button
				onclick={resetVerification}
				class="px-6 py-2.5 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors"
			>
				Try Again
			</button>
		</div>
	{/if}
</div>
