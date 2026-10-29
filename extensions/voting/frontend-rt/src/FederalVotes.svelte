<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	let {
		ctx,
		onopenleg,
	}: {
		ctx: any;
		onopenleg?: (proposalId: string) => void;
	} = $props();

	type View = 'list' | 'form' | 'detail';

	let view: View = $state('list');
	let votes: any[] = $state.raw([]);
	let legs: any[] = $state.raw([]);
	let here = $state('');
	let listLoading = $state(true);
	let error = $state('');
	let accessDeniedOp = $state('');
	let successMsg = $state('');

	let selectedVoteId = $state('');
	let voteDetail: any = $state(null);
	let detailLoading = $state(false);
	let actionBusy = $state(false);

	let formTitle = $state('');
	let formFunction = $state('');
	let formArgsJson = $state('{}');
	let submitting = $state(false);

	async function exportRows(entity: string) {
		const rows: any[] = [];
		for (let from: number | null = 1; from; ) {
			const page = await ctx.read('realm_export', { entity, from, count: 500 });
			if (!page.ok) throw new Error(page.error);
			rows.push(...page.rows);
			from = page.next;
		}
		return rows;
	}

	function legsOf(voteId: string) {
		return legs.filter((leg) => leg.vote === voteId);
	}

	function localLeg(voteId: string) {
		return legsOf(voteId).find((leg) => leg.quarter === here);
	}

	function handleAccessDenied(e: any): boolean {
		const op = ctx.ui?.accessDeniedOperation?.(e);
		if (op != null) {
			accessDeniedOp = op;
			error = '';
			return true;
		}
		accessDeniedOp = '';
		return false;
	}

	function statusColor(s: string): string {
		if (!s) return 'bg-gray-100 text-gray-700';
		const sl = s.toLowerCase();
		if (sl === 'open') return 'bg-emerald-100 text-emerald-700';
		if (sl === 'reported') return 'bg-amber-100 text-amber-700';
		if (sl === 'passed') return 'bg-green-100 text-green-700';
		if (sl === 'failed' || sl === 'cancelled') return 'bg-red-100 text-red-700';
		return 'bg-gray-100 text-gray-700';
	}

	function statusLabel(s: string): string {
		if (!s) return 'Unknown';
		return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function parseEpochSeconds(value: any): number | null {
		if (value == null || value === '') return null;
		const n = typeof value === 'number' ? value : parseFloat(String(value));
		if (!Number.isFinite(n)) return null;
		return n > 1e12 ? Math.floor(n / 1000) : n;
	}

	function formatDateTime(value: any): string {
		const epoch = parseEpochSeconds(value);
		if (epoch == null) return 'N/A';
		const date = new Date(epoch * 1000);
		if (isNaN(date.getTime())) return 'N/A';
		return date.toLocaleString();
	}

	function truncateHash(hash: string): string {
		if (!hash || hash.length <= 16) return hash || '—';
		return hash.slice(0, 8) + '…' + hash.slice(-6);
	}

	function truncateId(id: string): string {
		if (!id || id.length <= 20) return id || '—';
		return id.slice(0, 10) + '…' + id.slice(-6);
	}

	function actionLabel(action: any): string {
		return action?.title || action?.op || '—';
	}

	function prettyJson(value: any): string {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value ?? '');
		}
	}

	function parseFederalIdFromUrl(): string | null {
		if (typeof window === 'undefined') return null;
		const params = new URLSearchParams(window.location.search);
		const queryId = params.get('federal');
		if (queryId) return decodeURIComponent(queryId);
		const match = window.location.pathname.match(/\/federal\/([^/?#]+)/);
		if (match) return decodeURIComponent(match[1]);
		return null;
	}

	async function loadVotes() {
		listLoading = true;
		error = '';
		accessDeniedOp = '';
		try {
			const [rows, legRows, status] = await Promise.all([
				exportRows('FederalVote'),
				exportRows('FederalVoteLeg'),
				ctx.read('status'),
			]);
			votes = rows.reverse();
			legs = legRows;
			here = status.ok ? status.canister : '';
		} catch (e: any) {
			if (!handleAccessDenied(e)) {
				error = e?.message ?? String(e);
			}
		} finally {
			listLoading = false;
		}
	}

	async function openVote(voteId: string) {
		selectedVoteId = voteId;
		view = 'detail';
		detailLoading = true;
		error = '';
		accessDeniedOp = '';
		successMsg = '';
		await loadVotes();
		voteDetail = votes.find((v) => v.id === voteId) ?? null;
		detailLoading = false;
		if (!voteDetail && !error) {
			error = 'Vote not found';
			goToList();
		}
	}

	function goToList() {
		view = 'list';
		selectedVoteId = '';
		voteDetail = null;
		successMsg = '';
	}

	function goToForm() {
		view = 'form';
		error = '';
		accessDeniedOp = '';
		successMsg = '';
	}

	function cancelForm() {
		formTitle = '';
		formFunction = '';
		formArgsJson = '{}';
		goToList();
	}

	async function submitPropose() {
		submitting = true;
		error = '';
		accessDeniedOp = '';
		successMsg = '';

		let args: Record<string, any>;
		try {
			args = JSON.parse(formArgsJson || '{}');
			if (args === null || typeof args !== 'object' || Array.isArray(args)) {
				throw new Error('Args must be a JSON object');
			}
		} catch (e: any) {
			error = `Invalid args JSON: ${e?.message ?? String(e)}`;
			submitting = false;
			return;
		}

		const op = formFunction.trim();
		const title = formTitle.trim();
		if (!op || !title) {
			error = 'Title and operation are required';
			submitting = false;
			return;
		}

		try {
			const res = await ctx.run('federal_vote_propose', { title, action: { op, args } });
			if (res.ok) {
				await openVote(res.vote);
			} else {
				error = res.error;
			}
		} catch (e: any) {
			if (!handleAccessDenied(e)) {
				error = e?.message ?? String(e);
			}
		} finally {
			submitting = false;
		}
	}

	async function advanceTally() {
		actionBusy = true;
		error = '';
		try {
			const res = await ctx.run('federal_vote_finalize', { vote: selectedVoteId });
			if (res.ok) {
				successMsg = 'Tally advanced.';
				await openVote(selectedVoteId);
			} else {
				error = res.error;
			}
		} catch (e: any) {
			if (!handleAccessDenied(e)) {
				error = e?.message ?? String(e);
			}
		} finally {
			actionBusy = false;
		}
	}

	async function cancelVote() {
		if (!selectedVoteId) return;
		actionBusy = true;
		error = '';
		try {
			const res = await ctx.run('federal_vote_cancel', { vote: selectedVoteId });
			if (res.ok) {
				successMsg = res.requires_vote ? 'A realm-wide vote on cancelling was opened.' : 'Federal vote cancelled.';
				await openVote(selectedVoteId);
			} else {
				error = res.error;
			}
		} catch (e: any) {
			if (!handleAccessDenied(e)) {
				error = e?.message ?? String(e);
			}
		} finally {
			actionBusy = false;
		}
	}

	function openLeg(proposalId: string) {
		onopenleg?.(proposalId);
	}

	let narrow = $state(isNarrowViewport());
	let unsubNarrow: (() => void) | undefined;

	onMount(() => {
		unsubNarrow = subscribeNarrowViewport((value) => {
			narrow = value;
		});
		const urlId = parseFederalIdFromUrl();
		if (urlId) {
			void openVote(urlId);
		} else {
			void loadVotes();
		}
	});

	onDestroy(() => {
		unsubNarrow?.();
	});
</script>

<style>
	.chrome-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 6px 12px;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 6px;
		border: 1px solid #d1d5db;
		background: #fff;
		color: #4b5563;
		cursor: pointer;
		flex-shrink: 0;
	}

	.chrome-btn.chrome-primary {
		background: #111827;
		border-color: #111827;
		color: #fff;
	}

	@media (max-width: 720px) {
		.chrome-label {
			display: none;
		}

		.chrome-btn {
			width: 32px;
			height: 32px;
			padding: 0;
		}
	}
</style>

<div class="px-3 py-3 sm:p-5">
	{#if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			{@const AccessDenied = ctx.ui.AccessDenied}
			<AccessDenied operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500 mb-4">You need additional permissions for this action.</p>
		{/if}
	{:else if error}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
			<svg class="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			<span>{error}</span>
			<button type="button" onclick={() => (error = '')} class="ml-auto text-red-400 hover:text-red-600">&times;</button>
		</div>
	{/if}

	{#if successMsg}
		<div class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
			<svg class="w-5 h-5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			<span>{successMsg}</span>
		</div>
	{/if}

	{#if view === 'detail'}
		<button
			type="button"
			onclick={goToList}
			class="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-1"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
			Back to list
		</button>

		{#if detailLoading && !voteDetail}
			<div class="flex items-center justify-center py-12">
				<svg class="animate-spin h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
				<span class="ml-3 text-gray-500 text-sm">Loading vote…</span>
			</div>
		{:else if voteDetail}
			{@const detailLegs = legsOf(voteDetail.id)}
			{@const detailLocal = localLeg(voteDetail.id)}
			<div class="space-y-5">
				<div>
					<div class="flex items-center gap-3 mb-2 flex-wrap">
						<h2 class="text-xl font-bold text-gray-900">Realm-wide vote</h2>
						<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold {statusColor(voteDetail.status)}">
							{statusLabel(voteDetail.status)}
						</span>
					</div>
					<div class="flex flex-wrap gap-4 text-sm text-gray-500">
						<span>ID: <code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{voteDetail.id}</code></span>
						<span>Deadline: {formatDateTime(voteDetail.deadline)}</span>
						<span>Quarters: {detailLegs.length}</span>
						<span>Hash: <code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{truncateHash(voteDetail.hash)}</code></span>
					</div>
				</div>

				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<h3 class="text-sm font-semibold text-gray-900 mb-2">Action</h3>
					<pre class="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-700">{prettyJson(voteDetail.action)}</pre>
				</div>

				{#if voteDetail.rule && Object.keys(voteDetail.rule).length}
					<div class="rounded-lg border border-gray-200 bg-white p-4">
						<h3 class="text-sm font-semibold text-gray-900 mb-2">Rule</h3>
						<pre class="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-700">{prettyJson(voteDetail.rule)}</pre>
					</div>
				{/if}

				{#if voteDetail.tally && Object.keys(voteDetail.tally).length}
					<div class="rounded-lg border border-gray-200 bg-white p-4">
						<h3 class="text-sm font-semibold text-gray-900 mb-3">Aggregate tally</h3>
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
							<div class="rounded-lg bg-gray-50 px-3 py-2">
								<div class="text-xs text-gray-500">Status</div>
								<div class="font-medium text-gray-900">{statusLabel(voteDetail.status)}</div>
							</div>
							<div class="rounded-lg bg-green-50 px-3 py-2">
								<div class="text-xs text-green-600">Yes weight</div>
								<div class="font-medium text-green-800">{voteDetail.tally.yes ?? 0}</div>
							</div>
							<div class="rounded-lg bg-red-50 px-3 py-2">
								<div class="text-xs text-red-600">No weight</div>
								<div class="font-medium text-red-800">{voteDetail.tally.no ?? 0}</div>
							</div>
							<div class="rounded-lg bg-gray-50 px-3 py-2">
								<div class="text-xs text-gray-500">Reported / absent</div>
								<div class="font-medium text-gray-900">
									{voteDetail.tally.quarters - voteDetail.tally.absent} / {voteDetail.tally.absent}
								</div>
							</div>
						</div>
					</div>
				{/if}

				{#if detailLocal?.proposal_id && onopenleg}
					<button
						type="button"
						onclick={() => openLeg(detailLocal.proposal_id)}
						class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
					>
						Vote on this quarter's ballot
					</button>
				{/if}

				{#if detailLegs.length}
					<div class="border-y border-gray-200 sm:rounded-lg sm:border overflow-hidden">
						<div class="px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200">
							<h3 class="text-sm font-semibold text-gray-900">Quarter legs</h3>
						</div>
						{#if narrow}
							<div class="divide-y divide-gray-100">
								{#each detailLegs as leg (leg.id)}
									<div class="px-3 py-3 text-sm">
										<div class="flex items-center justify-between gap-2">
											<code class="text-xs">{truncateId(leg.quarter)}</code>
											<span class="text-xs font-semibold {statusColor(leg.status)} px-2 py-0.5">
												{statusLabel(leg.status)}
											</span>
										</div>
										<div class="mt-1 text-xs text-gray-500">
											{statusLabel(leg.outcome) || '—'} · Y {leg.yes} · N {leg.no} · A {leg.abstain}
										</div>
										{#if leg.proposal_id}
											<div class="mt-1 text-xs text-gray-500">Proposal <code>{leg.proposal_id}</code></div>
										{/if}
									</div>
								{/each}
							</div>
						{:else}
							<div class="overflow-x-auto">
								<table class="min-w-full text-sm">
									<thead class="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
										<tr>
											<th class="px-4 py-2">Quarter</th>
											<th class="px-4 py-2">Status</th>
											<th class="px-4 py-2">Outcome</th>
											<th class="px-4 py-2">Yes</th>
											<th class="px-4 py-2">No</th>
											<th class="px-4 py-2">Abstain</th>
											<th class="px-4 py-2">Proposal</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-100">
										{#each detailLegs as leg (leg.id)}
											<tr class="hover:bg-gray-50">
												<td class="px-4 py-2 font-mono text-xs">{truncateId(leg.quarter)}</td>
												<td class="px-4 py-2">
													<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold {statusColor(leg.status)}">
														{statusLabel(leg.status)}
													</span>
												</td>
												<td class="px-4 py-2">{statusLabel(leg.outcome) || '—'}</td>
												<td class="px-4 py-2">{leg.yes}</td>
												<td class="px-4 py-2">{leg.no}</td>
												<td class="px-4 py-2">{leg.abstain}</td>
												<td class="px-4 py-2">
													{#if leg.proposal_id}
														<code class="text-xs bg-gray-100 px-1 py-0.5 rounded">{leg.proposal_id}</code>
													{:else}
														—
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</div>
				{/if}

				{#if (voteDetail.status || '').toLowerCase() === 'open'}
					<div class="flex flex-wrap gap-3 pt-2">
						<button
							type="button"
							onclick={advanceTally}
							disabled={actionBusy}
							class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							Advance tally
						</button>
						<button
							type="button"
							onclick={cancelVote}
							disabled={actionBusy}
							class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
						>
							Cancel
						</button>
					</div>
				{/if}
			</div>
		{/if}

	{:else if view === 'form'}
		<div class="mb-5">
			<h2 class="text-xl font-semibold text-gray-900 mb-1">Propose realm-wide vote</h2>
			<p class="text-sm text-gray-500">
				Every quarter votes locally. If the realm adopts, every quarter executes — including quarters that voted no.
			</p>
		</div>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				void submitPropose();
			}}
			class="space-y-4 max-w-2xl"
		>
			<div>
				<label for="fv-title" class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
				<input
					id="fv-title"
					type="text"
					bind:value={formTitle}
					required
					disabled={submitting}
					class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
				/>
			</div>

			<div>
				<label for="fv-function" class="block text-sm font-medium text-gray-700 mb-1">Operation *</label>
				<input
					id="fv-function"
					type="text"
					bind:value={formFunction}
					placeholder="realm_configure"
					required
					disabled={submitting}
					class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
				/>
			</div>

			<div>
				<label for="fv-args" class="block text-sm font-medium text-gray-700 mb-1">Args (JSON)</label>
				<textarea
					id="fv-args"
					bind:value={formArgsJson}
					rows="4"
					disabled={submitting}
					class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y disabled:bg-gray-50"
				></textarea>
			</div>

			<div class="flex justify-end gap-3 pt-2">
				<button
					type="button"
					onclick={cancelForm}
					disabled={submitting}
					class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={submitting}
					class="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-40"
				>
					{#if submitting}
						<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						Submitting…
					{:else}
						Propose vote
					{/if}
				</button>
			</div>
		</form>

	{:else}
		<div class="flex flex-col gap-2 mb-4">
			<h2 class="text-lg font-semibold text-gray-900">Realm-wide votes</h2>
			<div class="flex gap-2">
				<button
					type="button"
					onclick={() => loadVotes()}
					disabled={listLoading}
					class="chrome-btn"
					title={listLoading ? 'Loading' : 'Refresh'}
					aria-label={listLoading ? 'Loading' : 'Refresh'}
				>
					{#if listLoading}
						<div class="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
					{:else}
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
					{/if}
					<span class="chrome-label">{listLoading ? 'Loading…' : 'Refresh'}</span>
				</button>
				<button
					type="button"
					onclick={goToForm}
					class="chrome-btn chrome-primary"
					title="Propose realm-wide vote"
					aria-label="Propose realm-wide vote"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
					<span class="chrome-label">Propose realm-wide vote</span>
				</button>
			</div>
		</div>

		{#if listLoading && votes.length === 0}
			<div class="flex items-center justify-center py-12">
				<svg class="animate-spin h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
				<span class="ml-3 text-gray-500 text-sm">Loading votes…</span>
			</div>
		{:else if !listLoading && votes.length === 0}
			<div class="text-center py-12 text-gray-500 text-sm">No realm-wide votes yet.</div>
		{:else}
			<div class="space-y-3">
				{#each votes as vote (vote.id)}
					{@const local = localLeg(vote.id)}
					<div class="rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-200 transition-colors">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2 flex-wrap mb-1">
									<span class="font-medium text-gray-900">{actionLabel(vote.action)}</span>
									<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold {statusColor(vote.status)}">
										{statusLabel(vote.status)}
									</span>
								</div>
								<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
									<span>ID: <code class="bg-gray-100 px-1 rounded">{truncateId(vote.id)}</code></span>
									<span>Deadline: {formatDateTime(vote.deadline)}</span>
									<span>Hash: <code class="bg-gray-100 px-1 rounded">{truncateHash(vote.hash)}</code></span>
									<span>Quarters: {legsOf(vote.id).length}</span>
									{#if vote.tally?.yes != null}
										<span>Yes/No: {vote.tally.yes}/{vote.tally.no}</span>
										<span>Reported: {vote.tally.quarters - vote.tally.absent}, absent: {vote.tally.absent}</span>
									{/if}
								</div>
								{#if local?.proposal_id}
									<div class="mt-2 text-xs text-gray-600">
										Local leg: {statusLabel(local.status)}
										{#if local.outcome}
											· {statusLabel(local.outcome)}
										{/if}
										· {local.proposal_id}
									</div>
								{/if}
							</div>
							<div class="flex flex-col gap-2 shrink-0">
								<button
									type="button"
									onclick={() => openVote(vote.id)}
									class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
								>
									Open
								</button>
								{#if local?.proposal_id && onopenleg}
									<button
										type="button"
										onclick={() => openLeg(local.proposal_id)}
										class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
									>
										Vote on this quarter
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
