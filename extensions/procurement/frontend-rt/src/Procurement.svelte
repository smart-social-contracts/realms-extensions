<script lang="ts">
	import { onDestroy } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';
	import LifecycleSteps, { type LifecycleStep } from './LifecycleSteps.svelte';
	import {
		isNarrowViewport,
		persistSessionFlag,
		readSessionFlag,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	type View = 'list' | 'create' | 'detail';

	interface BidPayload {
		price?: number;
		nonce?: string;
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
			tip: 'The requester reveals the bids with the openings vendors sent them, then evaluators score each bid.',
		},
		{
			status: 'contracted',
			label: 'Award',
			tip: 'The approver awards the best-scored bid, or justifies another, which signs the contract.',
		},
	];

	const LIFECYCLE_KEY = 'procurement-lifecycle-open';
	const RUBRIC = { price: 50, quality: 50 };
	const MAX_MARK = 10;
	const PAGE = 500;

	let { ctx }: { ctx: any } = $props();

	let me = $state('');
	ctx.principal?.subscribe?.((v: string) => (me = v || ''));

	let permissions = $state<string[]>([]);
	let canManage = $derived(permissions.includes('tender.manage'));
	let canEvaluate = $derived(permissions.includes('bid.evaluate'));
	let hasCrypto = $derived(!!ctx.crypto?.encryptForRecipients);

	let view: View = $state('list');
	let loading = $state(true);
	let error = $state('');
	let actionMsg = $state('');
	let actionError = $state('');
	let busy = $state(false);
	let narrow = $state(isNarrowViewport());
	let lifecycleOpen = $state(readSessionFlag(LIFECYCLE_KEY) ?? !isNarrowViewport());
	let unsubNarrow = subscribeNarrowViewport((value) => {
		narrow = value;
	});

	let rfps = $state<any[]>([]);
	let departments = $state<any[]>([]);
	let selected = $state<any | null>(null);
	let bids = $state<any[]>([]);
	let decryptedBids = $state<Record<string, BidPayload | null>>({});

	let formTitle = $state('');
	let formDescription = $state('');
	let formRequester = $state('');
	let formOpens = $state('');
	let formCloses = $state('');

	let bidVendor = $state('');
	let bidAmount = $state('');
	let bidDescription = $state('');
	let bidTechnical = $state('');

	let openings = $state<Record<string, { price: string; nonce: string }>>({});
	let scoreInputs = $state<Record<string, Record<string, number>>>({});
	let winningBidId = $state('');
	let justification = $state('');

	let detailStatus = $derived(selected?.status ?? 'draft');

	function toggleLifecycle() {
		lifecycleOpen = !lifecycleOpen;
		persistSessionFlag(LIFECYCLE_KEY, lifecycleOpen);
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

	function statusLabel(status: string) {
		const labels: Record<string, string> = {
			draft: 'Draft',
			open: 'Open bidding',
			closed: 'Closed',
			evaluation: 'Evaluation',
			contracted: 'Contracted',
			cancelled: 'Cancelled',
		};
		return labels[status] ?? status;
	}

	function hex(bytes: ArrayBuffer | Uint8Array) {
		return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
	}

	async function seal(price: number, nonce: string) {
		return 'sha256:' + hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${price}:${nonce}`)));
	}

	async function readAll(op: string, key: string) {
		const out: any[] = [];
		let from: number | null = 1;
		while (from !== null) {
			const res = await ctx.read(op, { from, count: PAGE });
			if (!res.ok) throw new Error(res.error);
			out.push(...res[key]);
			from = res.next;
		}
		return out;
	}

	async function run(op: string, args: Record<string, unknown>) {
		const res = await ctx.run(op, args);
		if (!res.ok) throw new Error(res.error);
		return res;
	}

	function outcome(res: any, message: string) {
		actionMsg = res.requires_vote ? `Submitted for a vote as ${res.proposal}` : message;
	}

	async function loadRfps() {
		loading = true;
		error = '';
		try {
			const [list, mine] = await Promise.all([readAll('tender_list', 'tenders'), ctx.read('me')]);
			rfps = list;
			if (mine.ok) permissions = mine.permissions;
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			loading = false;
		}
	}

	async function loadDetail(tenderId: string) {
		busy = true;
		actionError = '';
		decryptedBids = {};
		try {
			const res = await ctx.read('tender_get', { tender: tenderId });
			if (!res.ok) throw new Error(res.error);
			selected = res.tender;
			bids = res.tender.bids;
			await decryptVisibleBids();
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function decryptVisibleBids() {
		if (!ctx.crypto?.decryptScope) return;
		for (const bid of bids) {
			if (bid.sealed) continue;
			try {
				const { scope, ciphertext } = JSON.parse(bid.payload_ref);
				decryptedBids[bid.id] = await ctx.crypto.decryptScope<BidPayload>(scope, ciphertext);
			} catch {
				decryptedBids[bid.id] = null;
			}
		}
	}

	async function openDetail(rfp: any) {
		selected = rfp;
		view = 'detail';
		openings = {};
		await loadDetail(rfp.id);
	}

	async function openCreate() {
		view = 'create';
		actionError = '';
		actionMsg = '';
		try {
			departments = await readAll('department_list', 'departments');
			formRequester = formRequester || departments[0]?.id || '';
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		}
	}

	async function createRfp() {
		if (!formTitle.trim()) {
			actionError = 'Title is required';
			return;
		}
		busy = true;
		actionError = '';
		actionMsg = '';
		try {
			const res = await run('tender_create', {
				title: formTitle.trim(),
				description: formDescription.trim(),
				requester: formRequester,
				opens_at: localInputToEpoch(formOpens),
				closes_at: localInputToEpoch(formCloses),
				rubric: RUBRIC,
			});
			outcome(res, `Created ${res.tender}`);
			view = 'list';
			await loadRfps();
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function transition(op: string, message: string) {
		if (!selected) return;
		busy = true;
		actionError = '';
		try {
			outcome(await run(op, { tender: selected.id }), message);
			await loadDetail(selected.id);
			await loadRfps();
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function requesterStaff(department: string): Promise<string[]> {
		const res = await ctx.read('department_get', { department });
		if (!res.ok) throw new Error(res.error);
		return [res.department.head, ...res.positions.flatMap((p: any) => p.holders.map((h: any) => h.user))].filter(
			Boolean,
		);
	}

	async function submitBid() {
		if (!selected || !hasCrypto) return;
		const price = Number(bidAmount);
		if (!Number.isInteger(price) || price < 0) {
			actionError = 'The amount must be a whole number';
			return;
		}
		busy = true;
		actionError = '';
		try {
			const nonce = hex(crypto.getRandomValues(new Uint8Array(16)));
			const scope = `user:${me}:bid:${selected.id}`;
			const recipients = [me, ...(await requesterStaff(selected.requester))];
			const { ciphertext, wrappedDeks } = await ctx.crypto.encryptForRecipients(recipients, {
				price,
				nonce,
				description: bidDescription,
				technical: bidTechnical,
			});
			await ctx.crypto.grantScope(scope, wrappedDeks, { keep: [me] });
			const res = await run('bid_submit', {
				tender: selected.id,
				vendor: bidVendor.trim(),
				payload_ref: JSON.stringify({ scope, ciphertext }),
				payload_hash: await seal(price, nonce),
			});
			actionMsg = `Sealed bid ${res.bid} submitted. Once bidding closes, send the requester its opening: price ${price}, nonce ${nonce}.`;
			bidAmount = '';
			bidDescription = '';
			bidTechnical = '';
			await loadDetail(selected.id);
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function revealBids() {
		if (!selected) return;
		busy = true;
		actionError = '';
		try {
			const given = Object.entries(openings)
				.filter(([, o]) => o.nonce.trim())
				.map(([id, o]) => [id, { price: Number(o.price), nonce: o.nonce.trim() }]);
			const res = await run('bids_reveal', { tender: selected.id, openings: Object.fromEntries(given) });
			outcome(res, `Revealed ${res.revealed} bid(s)`);
			await loadDetail(selected.id);
			await loadRfps();
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
			const res = await run('bid_score', { bid: bidId, scores: scoreInputs[bidId] ?? {} });
			actionMsg = `Scores saved for ${bidId}: ${res.score}/100`;
			await loadDetail(selected!.id);
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	async function awardRfp() {
		if (!selected) return;
		busy = true;
		actionError = '';
		try {
			const res = await run('tender_award', {
				tender: selected.id,
				...(winningBidId && { bid: winningBidId }),
				...(justification.trim() && { justification: justification.trim() }),
			});
			outcome(res, `Awarded to ${res.winner} — contract ${res.contract}`);
			await loadDetail(selected.id);
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
			contracted: 'bg-emerald-100 text-emerald-800',
			cancelled: 'bg-red-100 text-red-800',
		};
		return map[status] ?? 'bg-gray-100 text-gray-700';
	}

	$effect(() => {
		formOpens = formOpens || defaultOpensLocal();
		formCloses = formCloses || defaultClosesLocal();
	});

	loadRfps();
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
		padding: 8px 12px;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 6px;
		border: 1px solid #d1d5db;
		background: #fff;
		color: #374151;
		cursor: pointer;
		flex-shrink: 0;
	}

	.chrome-btn.chrome-primary {
		background: #2563eb;
		border-color: #2563eb;
		color: #fff;
	}

	.chrome-btn.is-on {
		background: #eef2ff;
		border-color: #6366f1;
		color: #4338ca;
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

<div class="w-full max-w-none space-y-4 px-3 pb-8 sm:space-y-6 sm:px-0">
	<header class="flex flex-col gap-2">
		<div class="min-w-0">
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Procurement</h1>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{extensionDescription}</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			{#if view !== 'list'}
				<button
					class="chrome-btn"
					onclick={() => {
						view = 'list';
						selected = null;
					}}
					title="All requests"
					aria-label="All requests"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					<span class="chrome-label">All requests</span>
				</button>
			{/if}
			{#if view === 'list'}
				<button
					class="chrome-btn chrome-primary"
					onclick={openCreate}
					title="New request for proposal"
					aria-label="New request for proposal"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					<span class="chrome-label">New Request For Proposal</span>
				</button>
			{/if}
			{#if rfps.length > 0 || view !== 'list'}
				<button
					type="button"
					class="chrome-btn"
					class:is-on={lifecycleOpen}
					onclick={toggleLifecycle}
					title={lifecycleOpen ? 'Hide lifecycle' : 'Show lifecycle'}
					aria-label={lifecycleOpen ? 'Hide lifecycle' : 'Show lifecycle'}
					aria-pressed={lifecycleOpen}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
					<span class="chrome-label">Lifecycle</span>
				</button>
			{/if}
		</div>
	</header>

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
		{#if loading}
			<p class="text-gray-500">Loading requests…</p>
		{:else if rfps.length === 0}
			<div class="empty-page py-16 text-center">
				<p class="text-gray-500">No requests yet. Create a Request For Proposal to get started.</p>
			</div>
		{:else}
			{#if lifecycleOpen}
				<section class="mb-4">
					<h2 class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Lifecycle overview</h2>
					<LifecycleSteps steps={LIFECYCLE_STEPS} currentStatus="draft" compact />
				</section>
			{/if}
			{#if narrow}
				<div class="divide-y divide-gray-200 dark:divide-gray-700">
					{#each rfps as rfp}
						<article class="py-3">
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0">
									<div class="font-medium text-gray-900 dark:text-white">{rfp.title}</div>
									<div class="mt-0.5 font-mono text-xs text-gray-400">{rfp.id}</div>
								</div>
								<span class="shrink-0 text-xs {statusClass(rfp.status)}">{statusLabel(rfp.status)}</span>
							</div>
							<div class="mt-1 flex items-center justify-between text-xs text-gray-500">
								<span>Closes {new Date((rfp.closes_at || 0) * 1000).toLocaleString()}</span>
								<button class="text-blue-600" onclick={() => openDetail(rfp)}>Open</button>
							</div>
						</article>
					{/each}
				</div>
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
									<td class="px-4 py-3 font-mono text-xs">{rfp.id}</td>
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
		{/if}
	{:else if view === 'create'}
		{#if lifecycleOpen}
			<section>
				<h2 class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Lifecycle overview</h2>
				<LifecycleSteps steps={LIFECYCLE_STEPS} currentStatus="draft" />
			</section>
		{/if}

		<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700">
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
				<label class="block md:col-span-2">
					<span class="text-sm text-gray-600">Requesting department</span>
					<select class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" bind:value={formRequester}>
						{#each departments as d (d.id)}
							<option value={d.id}>{d.id}</option>
						{/each}
					</select>
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
					from 0 to {MAX_MARK}. Price counts for 50% of the total score and Quality for 50% (weighted average).
				</p>
			</div>
			<button class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50" disabled={busy || !formRequester} onclick={createRfp}>
				{busy ? 'Creating…' : 'Create draft'}
			</button>
		</section>
	{:else if view === 'detail' && selected}
		{#if lifecycleOpen}
			<section>
				<h2 class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Current stage</h2>
				<LifecycleSteps steps={LIFECYCLE_STEPS} currentStatus={detailStatus} />
			</section>
		{/if}

		<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700">
			<div class="flex flex-wrap items-center gap-2">
				<h2 class="text-lg font-medium">{selected.title}</h2>
				<span class="rounded-full px-2 py-0.5 text-xs {statusClass(selected.status)}">{statusLabel(selected.status)}</span>
				<span class="font-mono text-xs text-gray-500">{selected.id}</span>
			</div>
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{selected.description}</p>
			<p class="mt-1 text-xs text-gray-500">
				Requester {selected.requester} · Opens {new Date((selected.opens_at || 0) * 1000).toLocaleString()} · Closes
				{new Date((selected.closes_at || 0) * 1000).toLocaleString()}
			</p>
			{#if selected.contract}
				<p class="mt-1 text-xs text-gray-500">Awarded to {selected.winner} · contract {selected.contract}</p>
			{/if}

			<div class="mt-4 flex flex-wrap items-center gap-2">
				{#if selected.status === 'draft' && canManage}
					<button class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white" disabled={busy} onclick={() => transition('tender_open', 'Request For Proposal published for bidding')}>Publish</button>
				{/if}
				{#if selected.status === 'open' && canManage}
					<button class="rounded bg-yellow-600 px-3 py-1.5 text-sm text-white" disabled={busy} onclick={() => transition('tender_close', 'Bidding closed')}>Close bidding</button>
				{/if}
				{#if ['open', 'closed'].includes(selected.status) && canManage && bids.length > 0}
					<button class="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white" disabled={busy} onclick={revealBids}>Reveal bids</button>
				{/if}
				{#if selected.status === 'evaluation' && canManage}
					<input
						class="rounded border px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
						placeholder="Justification (if not the best score)"
						bind:value={justification}
					/>
					<button class="rounded bg-purple-600 px-3 py-1.5 text-sm text-white" disabled={busy} onclick={awardRfp}>Award</button>
				{/if}
			</div>
		</section>

		{#if selected.status === 'open'}
			<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700">
				<h3 class="font-medium">Submit sealed bid</h3>
				<p class="text-xs text-gray-500">
					Encrypted with vetKeys for you and the requesting department; the realm keeps it sealed until the reveal.
				</p>
				<div class="mt-3 grid gap-3 md:grid-cols-2">
					<label class="block">
						<span class="text-sm">Vendor organization</span>
						<input class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" bind:value={bidVendor} />
					</label>
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
				<button class="mt-3 rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50" disabled={busy || !hasCrypto || !bidVendor.trim()} onclick={submitBid}>
					Submit sealed bid
				</button>
			</section>
		{/if}

		<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700">
			<h3 class="font-medium">Bids ({bids.length})</h3>
			{#if bids.length === 0}
				<p class="text-sm text-gray-500">No bids yet.</p>
			{:else}
				<ul class="mt-2 space-y-3">
					{#each bids as bid}
						<li class="rounded-lg border border-gray-100 p-3 dark:border-gray-700">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<span class="font-mono text-xs">{bid.id}</span>
								<span class="text-xs text-gray-500">vendor {shortPrincipal(bid.vendor)} · {bid.sealed ? 'sealed' : 'revealed'}</span>
								{#if !bid.sealed}
									<span class="text-sm font-medium">Price {bid.price} · Score {bid.score}</span>
								{/if}
							</div>

							{#if bid.sealed && ['open', 'closed'].includes(selected.status) && canManage}
								<div class="mt-2 grid gap-2 md:grid-cols-2">
									<label class="block text-xs">
										Opening price
										<input
											type="number"
											min="0"
											class="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-900"
											oninput={(e) => {
												openings[bid.id] = { nonce: '', ...openings[bid.id], price: (e.target as HTMLInputElement).value };
											}}
										/>
									</label>
									<label class="block text-xs">
										Opening nonce
										<input
											class="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-900"
											oninput={(e) => {
												openings[bid.id] = { price: '', ...openings[bid.id], nonce: (e.target as HTMLInputElement).value };
											}}
										/>
									</label>
								</div>
							{/if}

							{#if ['evaluation', 'contracted'].includes(selected.status)}
								{#if decryptedBids[bid.id]}
									<div class="mt-2 rounded bg-gray-50 p-2 text-sm dark:bg-gray-800">
										<div>Amount: {decryptedBids[bid.id]?.price ?? '—'}</div>
										<div>{decryptedBids[bid.id]?.description ?? ''}</div>
									</div>
								{:else if decryptedBids[bid.id] === null}
									<p class="mt-2 text-xs text-amber-700">Encrypted — not shared with you.</p>
								{/if}

								{#if selected.status === 'evaluation' && canEvaluate && !bid.sealed}
									<div class="mt-2 grid gap-2 md:grid-cols-2">
										{#each Object.keys(selected.rubric) as crit}
											<label class="block text-xs">
												{crit} (0–{MAX_MARK})
												<input
													type="number"
													min="0"
													max={MAX_MARK}
													class="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-900"
													oninput={(e) => {
														const val = Number((e.target as HTMLInputElement).value);
														scoreInputs[bid.id] = { ...(scoreInputs[bid.id] ?? {}), [crit]: val };
													}}
												/>
											</label>
										{/each}
									</div>
									<button class="mt-2 text-xs text-blue-600 hover:underline" onclick={() => submitScoresForBid(bid.id)}>Save scores</button>
								{/if}

								{#if selected.status === 'evaluation' && canManage && !bid.sealed}
									<label class="mt-2 flex items-center gap-2 text-sm">
										<input type="radio" name="winner" value={bid.id} bind:group={winningBidId} />
										Select as winner
									</label>
								{/if}
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700">
			<h3 class="font-medium">Audit log</h3>
			<p class="mt-2 text-xs text-gray-500">The audit log of a request is not supported by this realm version.</p>
		</section>
	{/if}
</div>
