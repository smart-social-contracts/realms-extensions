<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import LifecycleSteps, { type LifecycleStep } from './LifecycleSteps.svelte';

	type View = 'list' | 'create' | 'detail';

	interface RubricCriterion {
		id: string;
		label: string;
		weight: number;
		max_score: number;
	}

	interface BidPayload {
		amount?: string;
		description?: string;
		technical?: string;
	}

	const LIFECYCLE_STEPS: LifecycleStep[] = [
		{
			status: 'draft',
			label: 'Draft',
			tip: 'Prepare the request: title, description, bidding dates, and how bids will be scored.',
		},
		{
			status: 'open',
			label: 'Open bidding',
			tip: 'Vendors submit sealed bids encrypted on their device until the closing date.',
		},
		{
			status: 'closed',
			label: 'Closed',
			tip: 'The bidding window has ended; no new bids are accepted.',
		},
		{
			status: 'evaluation',
			label: 'Evaluation',
			tip: 'Evaluators score bids. Vendors share decryption keys so evaluators can read bid contents.',
		},
		{
			status: 'award',
			label: 'Award',
			tip: 'The approver selects the winning bid based on scores and records the award.',
		},
		{
			status: 'contract_execution',
			label: 'Contract',
			tip: 'The contract is recorded and execution begins (vault integration pending).',
		},
	];

	const DEMO_ADVANCE_KEY = 'procurement_demo_advance';

	let { ctx }: { ctx: any } = $props();

	let me = $state('');
	ctx.principal?.subscribe?.((v: string) => (me = v || ''));

	let profiles = $state<string[]>([]);
	ctx.userProfiles?.subscribe?.((v: string[]) => (profiles = v ?? []));

	let testMode = $state(false);
	ctx.realmInfo?.subscribe?.((info: { testMode?: boolean }) => {
		testMode = !!info?.testMode;
	});

	let isAdmin = $derived(profiles.includes('admin'));
	let hasCrypto = $derived(!!ctx.crypto?.encryptForRecipients);

	let view: View = $state('list');
	let loading = $state(true);
	let error = $state('');
	let actionMsg = $state('');
	let actionError = $state('');
	let busy = $state(false);
	let demoAdvanceEnabled = $state(false);

	let rfps = $state<any[]>([]);
	let selected = $state<any | null>(null);
	let bids = $state<any[]>([]);
	let transitions = $state<any[]>([]);
	let scores = $state<any[]>([]);
	let decryptedBids = $state<Record<string, BidPayload | null>>({});

	let formTitle = $state('');
	let formDescription = $state('');
	let formOpens = $state('');
	let formCloses = $state('');

	let bidAmount = $state('');
	let bidDescription = $state('');
	let bidTechnical = $state('');

	let scoreInputs = $state<Record<string, Record<string, number>>>({});
	let winningBidId = $state('');

	let isCreator = $derived(!!selected && selected.requester_id === me);
	let canDemoAdvance = $derived(
		testMode &&
			demoAdvanceEnabled &&
			isCreator &&
			selected &&
			selected.status !== 'contract_execution',
	);
	let detailStatus = $derived(selected?.status ?? 'draft');

	$effect(() => {
		if (typeof sessionStorage !== 'undefined') {
			demoAdvanceEnabled = sessionStorage.getItem(DEMO_ADVANCE_KEY) === '1';
		}
	});

	function setDemoAdvanceEnabled(enabled: boolean) {
		demoAdvanceEnabled = enabled;
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.setItem(DEMO_ADVANCE_KEY, enabled ? '1' : '0');
		}
	}

	function shortPrincipal(p: string) {
		if (!p || p.length <= 14) return p || '—';
		return p.slice(0, 6) + '…' + p.slice(-4);
	}

	function epochToLocalInput(epoch: number) {
		if (!epoch) return '';
		const d = new Date(epoch * 1000);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function localInputToEpoch(v: string) {
		if (!v) return 0;
		return Math.floor(new Date(v).getTime() / 1000);
	}

	function defaultOpensLocal() {
		return epochToLocalInput(Math.floor(Date.now() / 1000));
	}

	function defaultClosesLocal() {
		return epochToLocalInput(Math.floor(Date.now() / 1000) + 7 * 86400);
	}

	function parseRubric(json: string): RubricCriterion[] {
		try {
			return JSON.parse(json || '[]');
		} catch {
			return [];
		}
	}

	function statusLabel(status: string) {
		const labels: Record<string, string> = {
			draft: 'Draft',
			open: 'Open bidding',
			closed: 'Closed',
			evaluation: 'Evaluation',
			award: 'Award',
			contract_execution: 'Contract',
		};
		return labels[status] ?? status;
	}

	function nextStageLabel(status: string) {
		const next: Record<string, string> = {
			draft: 'Open bidding',
			open: 'Evaluation',
			closed: 'Evaluation',
			evaluation: 'Award',
			award: 'Contract',
		};
		return next[status] ?? 'Next stage';
	}

	async function callSync(fn: string, args: Record<string, unknown> = {}) {
		const raw = await ctx.callSync(fn, args);
		return typeof raw === 'string' ? JSON.parse(raw) : raw;
	}

	async function loadRfps() {
		loading = true;
		error = '';
		try {
			const res: any = await callSync('list_rfps');
			if (!res?.success) throw new Error(res?.error || 'Failed to load requests');
			rfps = res.rfps ?? [];
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			loading = false;
		}
	}

	async function loadDetail(rfpId: string) {
		busy = true;
		actionError = '';
		decryptedBids = {};
		try {
			const res: any = await callSync('get_rfp', { rfp_id: rfpId });
			if (!res?.success) throw new Error(res?.error || 'Failed to load request');
			selected = res.rfp;
			transitions = res.rfp?.transitions ?? [];

			const bres: any = await callSync('list_bids', { rfp_id: rfpId });
			bids = bres?.success ? bres.bids ?? [] : [];

			if (['evaluation', 'award', 'contract_execution'].includes(selected?.status)) {
				const sres: any = await callSync('list_scores', { rfp_id: rfpId });
				scores = sres?.success ? sres.scores ?? [] : [];
				await decryptVisibleBids();
			}
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function decryptVisibleBids() {
		if (!ctx.crypto?.decryptScope) return;
		for (const bid of bids) {
			if (!bid.bid_id) continue;
			try {
				const pres: any = await callSync('get_bid_payload', { bid_id: bid.bid_id });
				if (!pres?.success || !pres.ciphertext) {
					decryptedBids[bid.bid_id] = null;
					continue;
				}
				const plain = await ctx.crypto.decryptScope<BidPayload>(pres.scope, pres.ciphertext);
				decryptedBids[bid.bid_id] = plain;
			} catch {
				decryptedBids[bid.bid_id] = null;
			}
		}
	}

	async function openDetail(rfp: any) {
		selected = rfp;
		view = 'detail';
		await loadDetail(rfp.rfp_id);
	}

	async function createRfp() {
		if (!formTitle.trim()) {
			actionError = 'Title is required';
			return;
		}
		busy = true;
		actionError = '';
		actionMsg = '';
		const rubric = [
			{ id: 'price', label: 'Price', weight: 0.5, max_score: 100 },
			{ id: 'quality', label: 'Quality', weight: 0.5, max_score: 100 },
		];
		try {
			const res: any = await callSync('create_rfp', {
				title: formTitle.trim(),
				description: formDescription.trim(),
				opens_at: localInputToEpoch(formOpens),
				closes_at: localInputToEpoch(formCloses),
				rubric_json: rubric,
			});
			if (!res?.success) throw new Error(res?.error || 'Create failed');
			actionMsg = `Created ${res.rfp?.rfp_id}`;
			view = 'list';
			await loadRfps();
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function publishRfp() {
		if (!selected) return;
		busy = true;
		actionError = '';
		try {
			const res: any = await callSync('publish_rfp', { rfp_id: selected.rfp_id });
			if (!res?.success) throw new Error(res?.error || 'Publish failed');
			actionMsg = 'Request For Proposal published for bidding';
			await loadDetail(selected.rfp_id);
			await loadRfps();
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function closeRfp() {
		if (!selected) return;
		busy = true;
		actionError = '';
		try {
			const res: any = await callSync('close_rfp', { rfp_id: selected.rfp_id });
			if (!res?.success) throw new Error(res?.error || 'Close failed');
			actionMsg = 'Bidding closed — bids marked for evaluation';
			await loadDetail(selected.rfp_id);
			await loadRfps();
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function demoAdvanceStage() {
		if (!selected || !canDemoAdvance) return;
		busy = true;
		actionError = '';
		try {
			const res: any = await callSync('demo_advance_rfp', { rfp_id: selected.rfp_id });
			if (!res?.success) throw new Error(res?.error || 'Demo advance failed');
			actionMsg = `Advanced to ${statusLabel(res.rfp?.status ?? '')}`;
			await loadDetail(selected.rfp_id);
			await loadRfps();
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function submitBid() {
		if (!selected || !hasCrypto) return;
		busy = true;
		actionError = '';
		try {
			const shell: any = await callSync('create_bid_shell', { rfp_id: selected.rfp_id });
			if (!shell?.success) throw new Error(shell?.error || 'Could not create bid');

			const payload = {
				amount: bidAmount,
				description: bidDescription,
				technical: bidTechnical,
			};
			const { ciphertext, wrappedDeks } = await ctx.crypto.encryptForRecipients([me], payload);
			await ctx.crypto.grantScope(shell.scope, wrappedDeks, { keep: [me] });

			const setRes: any = await callSync('set_bid_payload', {
				bid_id: shell.bid_id,
				ciphertext,
				encryption_mode: 'vetkeys',
			});
			if (!setRes?.success) throw new Error(setRes?.error || 'Failed to store bid');

			actionMsg = `Sealed bid ${shell.bid_id} submitted (vetKeys — only you can read until shared)`;
			bidAmount = '';
			bidDescription = '';
			bidTechnical = '';
			await loadDetail(selected.rfp_id);
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function shareBidWithEvaluators(bid: any) {
		if (!selected || !ctx.crypto?.encryptForRecipients) return;
		busy = true;
		actionError = '';
		try {
			const evRes: any = await callSync('get_evaluator_principals');
			const evaluators: string[] = evRes?.principals ?? [];
			const recipients = Array.from(new Set([me, ...evaluators].filter(Boolean)));

			const pres: any = await callSync('get_bid_payload', { bid_id: bid.bid_id });
			if (!pres?.success) throw new Error(pres?.error || 'No payload');
			const plain = await ctx.crypto.decryptScope<BidPayload>(pres.scope, pres.ciphertext);
			if (!plain) throw new Error('Cannot decrypt your bid — missing key envelope');

			const { ciphertext, wrappedDeks } = await ctx.crypto.encryptForRecipients(recipients, plain);
			await callSync('set_bid_payload', {
				bid_id: bid.bid_id,
				ciphertext,
				encryption_mode: 'vetkeys',
			});
			await ctx.crypto.grantScope(pres.scope, wrappedDeks, { keep: [me] });

			actionMsg = `Bid shared with ${evaluators.length} evaluator(s)`;
			await loadDetail(selected.rfp_id);
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function submitScoresForBid(bidId: string) {
		busy = true;
		actionError = '';
		try {
			const res: any = await callSync('submit_scores', { bid_id: bidId, scores: scoreInputs[bidId] ?? {} });
			if (!res?.success) throw new Error(res?.error || 'Scoring failed');
			actionMsg = `Scores saved for ${bidId}`;
			await loadDetail(selected!.rfp_id);
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function computeTotals() {
		if (!selected) return;
		busy = true;
		actionError = '';
		try {
			const res: any = await callSync('compute_totals', { rfp_id: selected.rfp_id });
			if (!res?.success) throw new Error(res?.error || 'Compute failed');
			actionMsg = 'Totals computed';
			await loadDetail(selected.rfp_id);
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function awardRfp() {
		if (!selected || !winningBidId) {
			actionError = 'Select a winning bid';
			return;
		}
		busy = true;
		actionError = '';
		try {
			const res: any = await callSync('award_rfp', {
				rfp_id: selected.rfp_id,
				winning_bid_id: winningBidId,
			});
			if (!res?.success) throw new Error(res?.error || 'Award failed');
			actionMsg = `Awarded to ${winningBidId}`;
			await loadDetail(selected.rfp_id);
			await loadRfps();
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function executeContract() {
		if (!selected) return;
		busy = true;
		actionError = '';
		try {
			const res: any = await callSync('execute_contract', { rfp_id: selected.rfp_id });
			if (!res?.success) throw new Error(res?.error || 'Execute failed');
			actionMsg = 'Contract execution recorded (vault integration pending)';
			await loadDetail(selected.rfp_id);
			await loadRfps();
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	function statusClass(status: string) {
		const map: Record<string, string> = {
			draft: 'bg-gray-100 text-gray-700',
			open: 'bg-green-100 text-green-800',
			closed: 'bg-yellow-100 text-yellow-800',
			evaluation: 'bg-blue-100 text-blue-800',
			award: 'bg-purple-100 text-purple-800',
			contract_execution: 'bg-emerald-100 text-emerald-800',
		};
		return map[status] ?? 'bg-gray-100 text-gray-700';
	}

	$effect(() => {
		formOpens = formOpens || defaultOpensLocal();
		formCloses = formCloses || defaultClosesLocal();
	});

	loadRfps();
</script>

<div class="w-full max-w-none space-y-6 pb-8">
	<header class="flex flex-wrap items-start justify-between gap-4">
		<div class="min-w-0 flex-1">
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Procurement</h1>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{extensionDescription}</p>
		</div>
		<div class="flex shrink-0 flex-wrap gap-2">
			{#if view !== 'list'}
				<button
					class="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
					onclick={() => {
						view = 'list';
						selected = null;
					}}>← All requests</button
				>
			{/if}
			{#if view === 'list'}
				<button
					class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
					onclick={() => {
						view = 'create';
						actionError = '';
						actionMsg = '';
					}}>+ New Request For Proposal</button
				>
			{/if}
		</div>
	</header>

	{#if testMode}
		<div class="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
			<label class="flex cursor-pointer items-start gap-2">
				<input
					type="checkbox"
					class="mt-1"
					checked={demoAdvanceEnabled}
					onchange={(e) => setDemoAdvanceEnabled((e.target as HTMLInputElement).checked)}
				/>
				<span>
					<span class="font-medium">Demo: manual stage advance</span>
					<span class="mt-0.5 block text-xs text-amber-800">
						When enabled, the creator of a request can jump to the next lifecycle stage at any time
						(test mode only).
					</span>
				</span>
			</label>
		</div>
	{/if}

	{#if !hasCrypto}
		<div class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
			Crypto helpers unavailable — sealed bidding requires the host app&apos;s vetKeys integration.
		</div>
	{/if}

	{#if error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
	{/if}
	{#if actionMsg}
		<div class="rounded-lg bg-green-50 p-3 text-sm text-green-800">{actionMsg}</div>
	{/if}
	{#if actionError}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</div>
	{/if}

	{#if view === 'list'}
		<section>
			<h2 class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Lifecycle overview</h2>
			<LifecycleSteps steps={LIFECYCLE_STEPS} currentStatus="draft" compact />
		</section>

		{#if loading}
			<p class="text-gray-500">Loading requests…</p>
		{:else if rfps.length === 0}
			<p class="text-gray-500">No requests yet. Create a Request For Proposal to get started.</p>
		{:else}
			<div class="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
				<table class="w-full table-fixed text-sm">
					<thead class="bg-gray-50 text-left text-gray-600 dark:bg-gray-800 dark:text-gray-300">
						<tr>
							<th class="w-28 px-4 py-3">Reference</th>
							<th class="px-4 py-3">Title</th>
							<th class="w-36 px-4 py-3">Stage</th>
							<th class="w-48 px-4 py-3">Closes</th>
							<th class="w-20 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#each rfps as rfp}
							<tr class="border-t border-gray-100 dark:border-gray-700">
								<td class="px-4 py-3 font-mono text-xs">{rfp.rfp_id}</td>
								<td class="truncate px-4 py-3">{rfp.title}</td>
								<td class="px-4 py-3">
									<span class="rounded-full px-2 py-0.5 text-xs {statusClass(rfp.status)}">{statusLabel(rfp.status)}</span>
								</td>
								<td class="px-4 py-3 text-gray-500">{new Date((rfp.closes_at || 0) * 1000).toLocaleString()}</td>
								<td class="px-4 py-3 text-right">
									<button class="text-blue-600 hover:underline" onclick={() => openDetail(rfp)}>Open</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{:else if view === 'create'}
		<section>
			<h2 class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Lifecycle overview</h2>
			<LifecycleSteps steps={LIFECYCLE_STEPS} currentStatus="draft" />
		</section>

		<section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
			<h2 class="mb-3 text-lg font-medium">Create Request For Proposal</h2>
			<div class="grid gap-3 md:grid-cols-2">
				<label class="block md:col-span-2">
					<span class="text-sm text-gray-600">Title</span>
					<input class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" bind:value={formTitle} />
				</label>
				<label class="block md:col-span-2">
					<span class="text-sm text-gray-600">Description</span>
					<textarea class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" rows="3" bind:value={formDescription}></textarea>
				</label>
				<label class="block">
					<span class="text-sm text-gray-600">Opens</span>
					<input type="datetime-local" class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" bind:value={formOpens} />
				</label>
				<label class="block">
					<span class="text-sm text-gray-600">Closes</span>
					<input type="datetime-local" class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" bind:value={formCloses} />
				</label>
			</div>
			<div class="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
				<p class="font-medium text-gray-700 dark:text-gray-200">Default scoring rubric</p>
				<p class="mt-1">
					Evaluators score each bid on <strong>Price</strong> and <strong>Quality</strong>. Each criterion is rated
					from 0 to 100. Price counts for 50% of the total score and Quality for 50% (weighted average).
				</p>
			</div>
			<button class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50" disabled={busy} onclick={createRfp}>
				{busy ? 'Creating…' : 'Create draft'}
			</button>
		</section>
	{:else if view === 'detail' && selected}
		<section>
			<h2 class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Current stage</h2>
			<LifecycleSteps steps={LIFECYCLE_STEPS} currentStatus={detailStatus} />
		</section>

		<section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
			<div class="flex flex-wrap items-center gap-2">
				<h2 class="text-lg font-medium">{selected.title}</h2>
				<span class="rounded-full px-2 py-0.5 text-xs {statusClass(selected.status)}">{statusLabel(selected.status)}</span>
				<span class="font-mono text-xs text-gray-500">{selected.rfp_id}</span>
			</div>
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{selected.description}</p>
			<p class="mt-1 text-xs text-gray-500">
				Requester {shortPrincipal(selected.requester_id)} · Opens {new Date((selected.opens_at || 0) * 1000).toLocaleString()} · Closes
				{new Date((selected.closes_at || 0) * 1000).toLocaleString()}
			</p>

			<div class="mt-4 flex flex-wrap gap-2">
				{#if canDemoAdvance}
					<button
						class="rounded border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm text-amber-900 hover:bg-amber-100"
						disabled={busy}
						onclick={demoAdvanceStage}
					>
						Demo: advance to {nextStageLabel(selected.status)}
					</button>
				{/if}
				{#if selected.status === 'draft' && (isAdmin || selected.requester_id === me)}
					<button class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white" disabled={busy} onclick={publishRfp}>Publish</button>
				{/if}
				{#if selected.status === 'open' && isAdmin}
					<button class="rounded bg-yellow-600 px-3 py-1.5 text-sm text-white" disabled={busy} onclick={closeRfp}>Close bidding</button>
				{/if}
				{#if selected.status === 'evaluation'}
					<button class="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white" disabled={busy} onclick={computeTotals}>Compute totals</button>
				{/if}
				{#if selected.status === 'evaluation' && isAdmin}
					<button class="rounded bg-purple-600 px-3 py-1.5 text-sm text-white" disabled={busy} onclick={awardRfp}>Award</button>
				{/if}
				{#if selected.status === 'award' && isAdmin}
					<button class="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white" disabled={busy} onclick={executeContract}>Execute contract</button>
				{/if}
			</div>
		</section>

		{#if selected.status === 'open'}
			<section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
				<h3 class="font-medium">Submit sealed bid</h3>
				<p class="text-xs text-gray-500">Encrypted with vetKeys — only you can read until you share after close.</p>
				<div class="mt-3 grid gap-3 md:grid-cols-2">
					<label class="block">
						<span class="text-sm">Amount (quote)</span>
						<input class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" bind:value={bidAmount} />
					</label>
					<label class="block md:col-span-2">
						<span class="text-sm">Description</span>
						<textarea class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" rows="2" bind:value={bidDescription}></textarea>
					</label>
					<label class="block md:col-span-2">
						<span class="text-sm">Technical notes</span>
						<textarea class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" rows="2" bind:value={bidTechnical}></textarea>
					</label>
				</div>
				<button class="mt-3 rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50" disabled={busy || !hasCrypto} onclick={submitBid}>
					Submit sealed bid
				</button>
			</section>
		{/if}

		<section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
			<h3 class="font-medium">Bids ({bids.length})</h3>
			{#if bids.length === 0}
				<p class="text-sm text-gray-500">No bids yet.</p>
			{:else}
				<ul class="mt-2 space-y-3">
					{#each bids as bid}
						<li class="rounded-lg border border-gray-100 p-3 dark:border-gray-700">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<span class="font-mono text-xs">{bid.bid_id}</span>
								<span class="text-xs text-gray-500">vendor {shortPrincipal(bid.vendor_id)} · {bid.seal_status}</span>
								{#if bid.total_score}
									<span class="text-sm font-medium">Score {bid.total_score}</span>
								{/if}
							</div>

							{#if selected.status === 'evaluation' && bid.vendor_id === me && bid.seal_status === 'revealed'}
								<button class="mt-2 rounded border border-blue-300 px-2 py-1 text-xs text-blue-700" disabled={busy} onclick={() => shareBidWithEvaluators(bid)}>
									Share with evaluators
								</button>
							{/if}

							{#if ['evaluation', 'award', 'contract_execution'].includes(selected.status)}
								{#if decryptedBids[bid.bid_id]}
									<div class="mt-2 rounded bg-gray-50 p-2 text-sm dark:bg-gray-800">
										<div>Amount: {decryptedBids[bid.bid_id]?.amount ?? '—'}</div>
										<div>{decryptedBids[bid.bid_id]?.description ?? ''}</div>
									</div>
								{:else if decryptedBids[bid.bid_id] === null}
									<p class="mt-2 text-xs text-amber-700">Encrypted — waiting for vendor to share with evaluators.</p>
								{/if}

								{#if selected.status === 'evaluation' && (isAdmin || profiles.includes('member'))}
									<div class="mt-2 grid gap-2 md:grid-cols-2">
										{#each parseRubric(selected.rubric_json) as crit}
											<label class="block text-xs">
												{crit.label} (0–{crit.max_score})
												<input
													type="number"
													min="0"
													max={crit.max_score}
													class="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-900"
													oninput={(e) => {
														const val = Number((e.target as HTMLInputElement).value);
														scoreInputs[bid.bid_id] = { ...(scoreInputs[bid.bid_id] ?? {}), [crit.id]: val };
													}}
												/>
											</label>
										{/each}
									</div>
									<button class="mt-2 text-xs text-blue-600 hover:underline" onclick={() => submitScoresForBid(bid.bid_id)}>Save scores</button>
								{/if}

								{#if selected.status === 'evaluation' && isAdmin}
									<label class="mt-2 flex items-center gap-2 text-sm">
										<input type="radio" name="winner" value={bid.bid_id} bind:group={winningBidId} />
										Select as winner
									</label>
								{/if}
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
			<h3 class="font-medium">Audit log</h3>
			<ul class="mt-2 space-y-1 text-xs">
				{#each transitions as t}
					<li class="font-mono text-gray-600 dark:text-gray-300">
						{t.timestamp ? new Date(t.timestamp * 1000).toISOString() : '—'} · {t.from_status || '∅'} → {t.to_status} ·
						{shortPrincipal(t.actor_id)} · {t.note}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
