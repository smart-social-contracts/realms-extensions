<script lang="ts">
	let {
		ctx,
		open = false,
		title = '',
		description = '',
		codeInline = '',
		deniedOperation = '',
		onclose = () => {},
	}: {
		ctx: any;
		open: boolean;
		title: string;
		description: string;
		codeInline: string;
		deniedOperation: string;
		onclose: () => void;
	} = $props();

	let submitting = $state(false);
	let submitted = $state(false);
	let error = $state('');
	let accessDeniedOp = $state('');
	let proposalId = $state('');

	async function submitProposal() {
		submitting = true;
		error = '';
		accessDeniedOp = '';
		try {
			const raw = await ctx.backend.extension_async_call(
				'voting',
				'submit_proposal',
				JSON.stringify({
					title,
					description,
					proposal_type: 'code_execution',
					source: codeInline,
					requested_permissions: [],
				}),
			);
			const envelope = typeof raw === 'string' ? JSON.parse(raw) : raw;
			if (envelope?.success === false) {
				error = envelope.response ?? 'Failed to submit proposal';
				return;
			}
			const res = envelope?.response ? (typeof envelope.response === 'string' ? JSON.parse(envelope.response) : envelope.response) : envelope;
			if (res?.success) {
				submitted = true;
				proposalId = res.data?.id || '';
			} else {
				error = res?.error || 'Failed to submit proposal';
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			submitting = false;
		}
	}

	function handleClose() {
		submitted = false;
		error = '';
		accessDeniedOp = '';
		proposalId = '';
		onclose();
	}

	function goToVoting() {
		ctx.navigate?.('/extensions/voting');
		handleClose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
		onkeydown={(e) => e.key === 'Escape' && handleClose()}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
		>
			{#if submitted}
				<!-- Success state -->
				<div class="p-6 text-center">
					<div class="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
						<svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-2">Proposal Created</h3>
					<p class="text-gray-600 mb-1">
						Your proposal <strong>{proposalId}</strong> has been submitted and voting is now open.
					</p>
					<p class="text-sm text-gray-500 mb-6">Realm members can now vote on this proposal in the Voting page.</p>
					<div class="flex justify-center gap-3">
						<button
							onclick={goToVoting}
							class="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
						>Go to Voting</button>
						<button
							onclick={handleClose}
							class="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
						>Close</button>
					</div>
				</div>
			{:else}
				<!-- Proposal form -->
				<div class="px-6 py-4 border-b border-gray-200">
					<div class="flex items-start justify-between">
						<div>
							<h3 class="text-lg font-bold text-gray-900">Create Governance Proposal</h3>
							<p class="text-sm text-gray-500 mt-0.5">You don't have the <code class="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{deniedOperation}</code> permission. Submit a proposal for the realm to vote on.</p>
						</div>
						<button onclick={handleClose} class="text-gray-400 hover:text-gray-600 p-1">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<div class="p-6 space-y-4">
					<div>
						<div class="text-sm font-medium text-gray-700 mb-1">Proposal Title</div>
						<div class="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-800">{title}</div>
					</div>

					<div>
						<div class="text-sm font-medium text-gray-700 mb-1">Description</div>
						<div class="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap">{description}</div>
					</div>

					<div>
						<div class="flex items-center gap-2 mb-1">
							<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
							</svg>
							<span class="text-sm font-medium text-gray-700">Code to Execute</span>
						</div>
						<div class="bg-gray-900 rounded-lg overflow-hidden">
							<pre class="p-4 overflow-x-auto text-sm"><code class="text-gray-100">{codeInline}</code></pre>
						</div>
					</div>

					<div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
						<p class="text-xs text-amber-800">
							<strong>How it works:</strong> This will create a proposal visible to all realm members.
							Once enough members vote "Yes" (meeting the threshold and quorum), the code above will be
							executed automatically on the realm backend.
						</p>
					</div>

					{#if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error}
						<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
					{/if}
				</div>

				<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
					<button
						onclick={handleClose}
						disabled={submitting}
						class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm disabled:opacity-50 transition-colors"
					>Cancel</button>
					<button
						onclick={submitProposal}
						disabled={submitting}
						class="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
					>
						{#if submitting}
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							Submitting...
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
							Create Proposal & Start Voting
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
