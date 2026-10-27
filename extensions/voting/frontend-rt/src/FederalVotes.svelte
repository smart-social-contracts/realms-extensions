<script lang="ts">
	import { onMount } from 'svelte';

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
	let listLoading = $state(true);
	let listUnavailable = $state(false);
	let error = $state('');
	let successMsg = $state('');

	let selectedVoteId = $state('');
	let voteDetail: any = $state(null);
	let detailLoading = $state(false);
	let actionBusy = $state(false);
	/** Outcomes reported by federal_vote_finalize this session, by vote id. */
	let decided: Record<string, string> = $state({});

	let formTitle = $state('');
	let formOperation = $state('');
	let formArgsJson = $state('{}');
	let submitting = $state(false);
	let formMsg = $state('');

	// The local leg of federal vote FV-n is a realm-wide proposal titled "FV-n: <title>".
	const LEG_TITLE = /^(FV-\d+):\s*(.*)$/;
	const LIST_PAGES = 20;

	async function read(name: string, args: Record<string, unknown> = {}): Promise<any> {
		try {
			const reply = await ctx.read(name, args);
			return reply?.ok ? reply : null;
		} catch {
			return null;
		}
	}

	async function run(name: string, args: Record<string, unknown> = {}): Promise<any> {
		try {
			const reply = await ctx.run(name, args);
			return reply ?? { ok: false, error: `${name} returned no reply` };
		} catch (e: any) {
			return { ok: false, error: e?.message ?? String(e) };
		}
	}

	function voteStatus(legStatus: string, voteId: string): string {
		if (decided[voteId]) return decided[voteId];
		if (legStatus === 'voting') return 'open';
		if (legStatus === 'withdrawn') return 'cancelled';
		return legStatus || 'open';
	}

	function legToVote(row: any): any | null {
		const match = String(row?.title ?? '').match(LEG_TITLE);
		if (!match) return null;
		const legStatus = String(row.status ?? '');
		return {
			vote_id: match[1],
			title: match[2] || match[1],
			deadline: row.deadline,
			status: voteStatus(legStatus, match[1]),
			local_leg: { proposal_id: String(row.id ?? ''), status: legStatus },
		};
	}

	function statusColor(s: string): string {
		if (!s) return 'bg-gray-100 text-gray-700';
		const sl = s.toLowerCase();
		if (sl === 'open' || sl === 'voting') return 'bg-emerald-100 text-emerald-700';
		if (sl === 'pending_review' || sl === 'pending_vote' || sl === 'armed') {
			return 'bg-amber-100 text-amber-700';
		}
		if (sl === 'adopted' || sl === 'accepted' || sl === 'executed' || sl === 'passed') {
			return 'bg-green-100 text-green-700';
		}
		if (sl === 'executing') return 'bg-purple-100 text-purple-700';
		if (sl === 'rejected' || sl === 'failed' || sl === 'expired') {
			return 'bg-red-100 text-red-700';
		}
		if (sl === 'no_quorum') return 'bg-orange-100 text-orange-700';
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

	function voteNumber(vote: any): number {
		const match = String(vote?.vote_id ?? '').match(/^FV-(\d+)$/);
		return match ? parseInt(match[1], 10) : 0;
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

	/** Federal votes, found through their local legs among the realm's proposals. */
	async function loadVotes() {
		listLoading = true;
		error = '';
		try {
			const found = new Map<string, any>();
			let from: number | null = 1;
			let reachable = false;
			for (let i = 0; i < LIST_PAGES && from != null; i++) {
				const res = await read('proposal_list', { from, count: 500 });
				if (!res) break;
				reachable = true;
				for (const row of Array.isArray(res.proposals) ? res.proposals : []) {
					const vote = legToVote(row);
					if (vote && !found.has(vote.vote_id)) found.set(vote.vote_id, vote);
				}
				const next = Number(res.next);
				from = res.next != null && Number.isFinite(next) ? next : null;
			}
			listUnavailable = !reachable;
			votes = [...found.values()].sort((a, b) => voteNumber(b) - voteNumber(a));
		} finally {
			listLoading = false;
		}
	}

	async function openVote(voteId: string) {
		selectedVoteId = voteId;
		view = 'detail';
		detailLoading = true;
		voteDetail = null;
		error = '';
		successMsg = '';
		try {
			if (!votes.some((v) => v.vote_id === voteId)) await loadVotes();
			const vote = votes.find((v) => v.vote_id === voteId);
			if (!vote) {
				goToList();
				error = `Realm-wide vote ${voteId} was not found on this realm.`;
				return;
			}
			const leg = await read('proposal_get', { proposal: vote.local_leg.proposal_id, count: 1 });
			const tally = leg?.tally ?? {};
			const legStatus = String(leg?.proposal?.status ?? vote.local_leg.status);
			voteDetail = {
				...vote,
				status: voteStatus(legStatus, voteId),
				local_leg: {
					...vote.local_leg,
					status: legStatus,
					loaded: !!leg,
					yes: Number(tally.yes) || 0,
					no: Number(tally.no) || 0,
					abstain: Number(tally.abstain) || 0,
					eligible: Number(leg?.eligible) || 0,
				},
			};
		} finally {
			detailLoading = false;
		}
	}

	function goToList() {
		view = 'list';
		selectedVoteId = '';
		voteDetail = null;
		formMsg = '';
		successMsg = '';
	}

	function goToForm() {
		view = 'form';
		error = '';
		formMsg = '';
		successMsg = '';
	}

	function resetForm() {
		formTitle = '';
		formOperation = '';
		formArgsJson = '{}';
	}

	function cancelForm() {
		resetForm();
		formMsg = '';
		goToList();
	}

	async function submitPropose() {
		error = '';
		formMsg = '';
		successMsg = '';

		const title = formTitle.trim();
		const operation = formOperation.trim();
		if (!title || !operation) {
			error = 'Title and operation are required';
			return;
		}

		let args: Record<string, any>;
		try {
			args = JSON.parse(formArgsJson || '{}');
			if (args === null || typeof args !== 'object' || Array.isArray(args)) {
				throw new Error('Args must be a JSON object');
			}
		} catch (e: any) {
			error = `Invalid args JSON: ${e?.message ?? String(e)}`;
			return;
		}

		submitting = true;
		try {
			const res = await run('federal_vote_propose', { title, action: { op: operation, args } });
			if (!res?.ok) {
				error = res?.error || 'The realm-wide vote was not opened.';
				return;
			}
			resetForm();
			const voteId = String(res.vote ?? '');
			await loadVotes();
			if (voteId && votes.some((v) => v.vote_id === voteId)) {
				await openVote(voteId);
			} else {
				goToList();
			}
			successMsg = voteId ? `Realm-wide vote ${voteId} is open.` : 'The realm-wide vote is open.';
		} finally {
			submitting = false;
		}
	}

	async function finalizeVote() {
		const voteId = selectedVoteId;
		if (!voteId) return;
		actionBusy = true;
		error = '';
		try {
			const res = await run('federal_vote_finalize', { vote: voteId });
			if (!res?.ok) {
				error = res?.error || 'The vote could not be finalized yet.';
				return;
			}
			if (res.status) decided = { ...decided, [voteId]: String(res.status) };
			await loadVotes();
			await openVote(voteId);
			if (res.status) {
				successMsg = `Realm-wide vote ${statusLabel(String(res.status)).toLowerCase()}.`;
			} else if (res.reported) {
				successMsg = `This quarter's result (${statusLabel(String(res.leg ?? ''))}) was reported to the capital.`;
			} else {
				successMsg = `This quarter's result (${statusLabel(String(res.leg ?? ''))}) is recorded; the capital has not confirmed it yet.`;
			}
		} finally {
			actionBusy = false;
		}
	}

	async function cancelVote() {
		const voteId = selectedVoteId;
		if (!voteId) return;
		actionBusy = true;
		error = '';
		try {
			const res = await run('federal_vote_cancel', { vote: voteId });
			if (!res?.ok) {
				error = res?.error || 'The vote was not cancelled.';
				return;
			}
			if (!res.requires_vote) decided = { ...decided, [voteId]: 'cancelled' };
			await loadVotes();
			await openVote(voteId);
			if (res.requires_vote && res.proposal) {
				successMsg = `Cancelling needs a realm-wide decision: proposal ${res.proposal} was filed.`;
				formMsg = String(res.proposal);
			} else {
				successMsg = 'Realm-wide vote cancelled.';
			}
		} finally {
			actionBusy = false;
		}
	}

	function openLeg(proposalId: string) {
		onopenleg?.(proposalId);
	}

	onMount(() => {
		const urlId = parseFederalIdFromUrl();
		if (urlId) {
			void openVote(urlId);
		} else {
			void loadVotes();
		}
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
	{#if error}
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
			{#if formMsg && onopenleg}
				<button
					type="button"
					onclick={() => openLeg(formMsg)}
					class="ml-2 text-indigo-600 hover:text-indigo-800 underline text-sm"
				>
					Open proposal
				</button>
			{/if}
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
			<div class="space-y-5">
				<div>
					<div class="flex items-center gap-3 mb-2 flex-wrap">
						<h2 class="text-xl font-bold text-gray-900">{voteDetail.title}</h2>
						<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold {statusColor(voteDetail.status)}">
							{statusLabel(voteDetail.status)}
						</span>
					</div>
					<div class="flex flex-wrap gap-4 text-sm text-gray-500">
						<span>ID: <code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{voteDetail.vote_id}</code></span>
						<span>Deadline: {formatDateTime(voteDetail.deadline)}</span>
						<span>Local ballot: <code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{voteDetail.local_leg.proposal_id}</code></span>
					</div>
				</div>

				{#if voteDetail.local_leg.loaded}
					<div class="rounded-lg border border-gray-200 bg-white p-4">
						<h3 class="text-sm font-semibold text-gray-900 mb-3">This realm's ballot</h3>
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
							<div class="rounded-lg bg-gray-50 px-3 py-2">
								<div class="text-xs text-gray-500">Status</div>
								<div class="font-medium text-gray-900">{statusLabel(voteDetail.local_leg.status)}</div>
							</div>
							<div class="rounded-lg bg-green-50 px-3 py-2">
								<div class="text-xs text-green-600">Yes</div>
								<div class="font-medium text-green-800">{voteDetail.local_leg.yes}</div>
							</div>
							<div class="rounded-lg bg-red-50 px-3 py-2">
								<div class="text-xs text-red-600">No</div>
								<div class="font-medium text-red-800">{voteDetail.local_leg.no}</div>
							</div>
							<div class="rounded-lg bg-gray-50 px-3 py-2">
								<div class="text-xs text-gray-500">Abstain / eligible</div>
								<div class="font-medium text-gray-900">
									{voteDetail.local_leg.abstain} / {voteDetail.local_leg.eligible}
								</div>
							</div>
						</div>
					</div>
				{/if}

				{#if voteDetail.local_leg?.proposal_id && onopenleg}
					<button
						type="button"
						onclick={() => openLeg(voteDetail.local_leg.proposal_id)}
						class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
					>
						Vote on this quarter's ballot
					</button>
				{/if}

				<p class="text-xs text-gray-400">
					The vote's action, rule and other quarters' results are kept by the capital and are not shown here.
				</p>

				{#if (voteDetail.status || '').toLowerCase() === 'open'}
					<div class="flex flex-wrap gap-3 pt-2">
						<button
							type="button"
							onclick={finalizeVote}
							disabled={actionBusy}
							class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							Finalize tally
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
					placeholder="What the realm is deciding"
					required
					disabled={submitting}
					class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
				/>
			</div>

			<div>
				<label for="fv-operation" class="block text-sm font-medium text-gray-700 mb-1">Operation *</label>
				<input
					id="fv-operation"
					type="text"
					bind:value={formOperation}
					placeholder="governance_update"
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
			<div class="text-center py-12 text-gray-500 text-sm">
				{listUnavailable ? 'Realm-wide votes are not available to you right now.' : 'No realm-wide votes yet.'}
			</div>
		{:else}
			<div class="space-y-3">
				{#each votes as vote (vote.vote_id)}
					<div class="rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-200 transition-colors">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2 flex-wrap mb-1">
									<span class="font-medium text-gray-900">{vote.title}</span>
									<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold {statusColor(vote.status)}">
										{statusLabel(vote.status)}
									</span>
								</div>
								<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
									<span>ID: <code class="bg-gray-100 px-1 rounded">{vote.vote_id}</code></span>
									<span>Deadline: {formatDateTime(vote.deadline)}</span>
								</div>
								{#if vote.local_leg?.proposal_id}
									<div class="mt-2 text-xs text-gray-600">
										Local vote: {statusLabel(vote.local_leg.status)} · {vote.local_leg.proposal_id}
									</div>
								{/if}
							</div>
							<div class="flex flex-col gap-2 shrink-0">
								<button
									type="button"
									onclick={() => openVote(vote.vote_id)}
									class="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
								>
									Open
								</button>
								{#if vote.local_leg?.proposal_id && onopenleg}
									<button
										type="button"
										onclick={() => openLeg(vote.local_leg.proposal_id)}
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
