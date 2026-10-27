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

	interface RubricCriterion {
		id: string;
		label: string;
		weight: number;
	}

	interface BidPayload {
		amount?: string;
		description?: string;
		technical?: string;
		price?: number;
		nonce?: string;
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
			tip: 'Bids are unsealed and evaluators score each one on the rubric.',
		},
		{
			status: 'contracted',
			label: 'Contract',
			tip: 'The requester awards the best-scored bid (or justifies another) and a contract with the vendor is signed.',
		},
	];

	const MAX_MARK = 10;
	const LIFECYCLE_KEY = 'procurement-lifecycle-open';

	let { ctx }: { ctx: any } = $props();

	let me = $state('');
	ctx.principal?.subscribe?.((v: string) => (me = v || ''));

	// The caller's permissions from `me`; null when unknown, and the realm then decides on each action.
	let perms = $state<Set<string> | null>(null);
	let hasCrypto = $derived(!!ctx.crypto?.encryptForRecipients);

	let view: View = $state('list');
	let loading = $state(true);
	let notice = $state('');
	let actionMsg = $state('');
	let actionError = $state('');
	let busy = $state(false);
	let narrow = $state(isNarrowViewport());
	let lifecycleOpen = $state(readSessionFlag(LIFECYCLE_KEY) ?? !isNarrowViewport());
	let unsubNarrow = subscribeNarrowViewport((value) => {
		narrow = value;
	});

	let tenders = $state<any[]>([]);
	let selected = $state<any | null>(null);
	let bids = $state<any[]>([]);
	let events = $state<any[] | null>(null);
	let decryptedBids = $state<Record<string, BidPayload | null>>({});
	let departments = $state<any[]>([]);
	let organizations = $state<any[]>([]);

	let formTitle = $state('');
	let formDescription = $state('');
	let formOpens = $state('');
	let formCloses = $state('');
	let formDepartment = $state('');

	let bidVendor = $state('');
	let bidAmount = $state('');
	let bidDescription = $state('');
	let bidTechnical = $state('');

	let scoreInputs = $state<Record<string, Record<string, number>>>({});
	let winningBidId = $state('');
	let awardJustification = $state('');

	let detailStatus = $derived(selected?.status ?? 'draft');
	let canManage = $derived(can('tender.manage'));
	let biddingEnded = $derived(!!selected && (selected.closes_at || 0) * 1000 <= Date.now());

	function can(permission: string) {
		return !perms || perms.has('all') || perms.has(permission);
	}

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

	function rubricCriteria(rubric: Record<string, number> | undefined): RubricCriterion[] {
		return Object.entries(rubric ?? {}).map(([id, weight]) => ({
			id,
			label: id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '),
			weight: Number(weight) || 0,
		}));
	}

	function statusLabel(status: string) {
		const labels: Record<string, string> = {
			draft: 'Draft',
			open: 'Open bidding',
			closed: 'Closed',
			evaluation: 'Evaluation',
			contracted: 'Contract',
			cancelled: 'Cancelled',
		};
		return labels[status] ?? status ?? '';
	}

	function opLabel(op: string) {
		const labels: Record<string, string> = {
			tender_create: 'Created',
			tender_open: 'Opened for bidding',
			tender_close: 'Bidding closed',
			tender_cancel: 'Cancelled',
			bid_submit: 'Sealed bid submitted',
			bid_withdraw: 'Bid withdrawn',
			bids_reveal: 'Bids revealed',
			bid_score: 'Bid scored',
			tender_award: 'Awarded',
		};
		return labels[op] ?? op;
	}

	function parsePayloadRef(ref: string | undefined): { scope: string; ciphertext: string } | null {
		try {
			const parsed = JSON.parse(ref || '');
			return parsed?.scope && parsed?.ciphertext ? parsed : null;
		} catch {
			return null;
		}
	}

	function randomHex(bytes: number) {
		return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
	}

	async function sha256Hex(text: string) {
		const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
		return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
	}

	/** A realm read operation's reply, or null when it fails or is not available to the caller. */
	async function read(name: string, args: Record<string, unknown> = {}): Promise<any> {
		try {
			const reply = await ctx.read(name, args);
			if (reply?.ok) return reply;
			console.warn(`${name}:`, reply?.error);
		} catch (e) {
			console.warn(`${name} failed:`, e);
		}
		return null;
	}

	/** Run a realm operation that changes the realm; throws the realm's refusal. */
	async function run(name: string, args: Record<string, unknown>): Promise<any> {
		const reply = await ctx.run(name, args);
		if (!reply?.ok) throw new Error(reply?.error || `${name} was refused`);
		return reply;
	}

	/** A governed call may be filed as a proposal instead of taking effect now. */
	function outcome(reply: any, message: string) {
		return reply?.proposal ? `Submitted for approval as proposal ${reply.proposal}` : message;
	}

	async function loadContext() {
		const [mine, depts, orgs] = await Promise.all([
			read('me'),
			read('department_list', { count: 500 }),
			read('organization_list', { status: 'active', count: 500 }),
		]);
		if (mine) perms = new Set(mine.permissions ?? []);
		departments = depts?.departments ?? [];
		organizations = orgs?.organizations ?? [];
		formDepartment ||= (departments.find((d) => d.is_root) ?? departments[0])?.id ?? '';
		bidVendor ||= organizations[0]?.id ?? '';
	}

	async function loadTenders() {
		loading = true;
		const all: any[] = [];
		let from: number | null = 1;
		let available = true;
		for (let pages = 0; from != null && pages < 20; pages++) {
			const res = await read('tender_list', { from, count: 500 });
			if (!res) {
				available = false;
				break;
			}
			all.push(...(res.tenders ?? []));
			from = res.next ?? null;
		}
		tenders = all;
		notice = available ? '' : 'Requests are not available to you right now.';
		loading = false;
	}

	async function loadDetail(tenderId: string) {
		busy = true;
		actionError = '';
		decryptedBids = {};
		const [res, log] = await Promise.all([read('tender_get', { tender: tenderId }), read('events', { count: 500 })]);
		if (res?.tender) {
			selected = res.tender;
			bids = res.tender.bids ?? [];
		} else {
			bids = [];
			actionError = 'This request could not be opened.';
		}
		const bidIds = new Set(bids.map((b) => b.id));
		events = log
			? (log.events ?? []).filter(
					(e: any) => e.args?.tender === tenderId || e.result?.tender === tenderId || bidIds.has(e.args?.bid),
				)
			: null;
		busy = false;
		if (['evaluation', 'contracted'].includes(selected?.status)) await decryptVisibleBids();
	}

	async function decryptVisibleBids() {
		if (!ctx.crypto?.decryptScope) return;
		for (const bid of bids) {
			const ref = parsePayloadRef(bid.payload_ref);
			if (!ref) {
				decryptedBids[bid.id] = null;
				continue;
			}
			try {
				decryptedBids[bid.id] = await ctx.crypto.decryptScope<BidPayload>(ref.scope, ref.ciphertext);
			} catch {
				decryptedBids[bid.id] = null;
			}
		}
	}

	async function openDetail(tender: any) {
		selected = tender;
		view = 'detail';
		winningBidId = '';
		awardJustification = '';
		await loadDetail(tender.id);
	}

	async function createTender() {
		if (!formTitle.trim()) {
			actionError = 'Title is required';
			return;
		}
		if (!formDepartment) {
			actionError = 'Choose the requesting department';
			return;
		}
		busy = true;
		actionError = '';
		actionMsg = '';
		try {
			const res = await run('tender_create', {
				title: formTitle.trim(),
				description: formDescription.trim(),
				requester: formDepartment,
				opens_at: localInputToEpoch(formOpens),
				closes_at: localInputToEpoch(formCloses),
				rubric: { price: 50, quality: 50 },
			});
			actionMsg = outcome(res, `Created ${res.tender}`);
			formTitle = '';
			formDescription = '';
			view = 'list';
			await loadTenders();
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	/** Run a lifecycle operation on the selected request, then reload it and the list. */
	async function act(name: string, args: Record<string, unknown>, message: (reply: any) => string) {
		if (!selected) return;
		const tenderId = selected.id;
		busy = true;
		actionError = '';
		actionMsg = '';
		try {
			const res = await run(name, args);
			actionMsg = outcome(res, message(res));
			await loadDetail(tenderId);
			await loadTenders();
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	function publishTender() {
		return act('tender_open', { tender: selected?.id }, () => 'Request For Proposal published for bidding');
	}

	function closeTender() {
		return act('tender_close', { tender: selected?.id }, () => 'Bidding closed — reveal the bids to start evaluation');
	}

	function revealBids() {
		return act('bids_reveal', { tender: selected?.id }, (res) => `${res.revealed ?? 0} bid(s) revealed — evaluation started`);
	}

	/** Principals who can read bids on a request: the requesting department's head and seat holders. */
	async function requesterStaff(department: string): Promise<string[]> {
		const res = await read('department_get', { department });
		if (!res) return [];
		const holders = (res.positions ?? []).flatMap((p: any) => (p.holders ?? []).map((h: any) => h.user));
		return [res.department?.head, ...holders].filter(Boolean);
	}

	async function submitBid() {
		if (!selected || !hasCrypto) return;
		const price = Math.round(Number(bidAmount.replace(/[^0-9.]/g, '')));
		if (!bidVendor) {
			actionError = 'Choose the organization you bid for';
			return;
		}
		if (!bidAmount.trim() || !Number.isFinite(price)) {
			actionError = 'Enter the quoted amount as a number';
			return;
		}
		const tenderId = selected.id;
		busy = true;
		actionError = '';
		actionMsg = '';
		try {
			const nonce = randomHex(16);
			const recipients = [me, ...(await requesterStaff(selected.requester))].filter(Boolean);
			const payload: BidPayload = {
				amount: bidAmount,
				description: bidDescription,
				technical: bidTechnical,
				price,
				nonce,
			};
			const { ciphertext, wrappedDeks } = await ctx.crypto.encryptForRecipients(recipients, payload);
			const scope = `user:${me}:procurement:${tenderId}:${bidVendor}`;
			await ctx.crypto.grantScope(scope, wrappedDeks, { keep: [me] });

			const res = await run('bid_submit', {
				tender: tenderId,
				vendor: bidVendor,
				payload_ref: JSON.stringify({ scope, ciphertext }),
				payload_hash: `sha256:${await sha256Hex(`${price}:${nonce}`)}`,
			});
			actionMsg = outcome(res, `Sealed bid ${res.bid} submitted — it stays sealed until bidding closes`);
			bidAmount = '';
			bidDescription = '';
			bidTechnical = '';
			await loadDetail(tenderId);
		} catch (e: any) {
			actionError = e?.message ?? String(e);
		} finally {
			busy = false;
		}
	}

	function submitScoresForBid(bidId: string) {
		const marks = scoreInputs[bidId] ?? {};
		if (Object.keys(marks).length === 0) {
			actionError = `Enter at least one mark from 0 to ${MAX_MARK}`;
			return;
		}
		return act('bid_score', { bid: bidId, scores: marks }, (res) => `Scores saved for ${res.bid ?? bidId} — score ${res.score ?? 0}/100`);
	}

	function awardTender() {
		const args: Record<string, unknown> = { tender: selected?.id };
		if (winningBidId) args.bid = winningBidId;
		if (awardJustification.trim()) args.justification = awardJustification.trim();
		return act('tender_award', args, (res) => `Awarded to ${res.winner} — contract ${res.contract} signed`);
	}

	function statusClass(status: string) {
		const map: Record<string, string> = {
			draft: 'bg-gray-100 text-gray-700',
			open: 'bg-green-100 text-green-800',
			closed: 'bg-yellow-100 text-yellow-800',
			evaluation: 'bg-blue-100 text-blue-800',
			contracted: 'bg-emerald-100 text-emerald-800',
			cancelled: 'bg-red-50 text-red-700',
		};
		return map[status] ?? 'bg-gray-100 text-gray-700';
	}

	$effect(() => {
		formOpens = formOpens || defaultOpensLocal();
		formCloses = formCloses || defaultClosesLocal();
	});

	loadContext();
	loadTenders();
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
					onclick={() => {
						view = 'create';
						actionError = '';
						actionMsg = '';
					}}
					title="New request for proposal"
					aria-label="New request for proposal"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					<span class="chrome-label">New Request For Proposal</span>
				</button>
			{/if}
			{#if tenders.length > 0 || view !== 'list'}
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

	{#if notice}
		<div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">{notice}</div>
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
		{:else if tenders.length === 0}
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
					{#each tenders as tender}
						<article class="py-3">
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0">
									<div class="font-medium text-gray-900 dark:text-white">{tender.title}</div>
									<div class="mt-0.5 font-mono text-xs text-gray-400">{tender.id}</div>
								</div>
								<span class="shrink-0 text-xs {statusClass(tender.status)}">{statusLabel(tender.status)}</span>
							</div>
							<div class="mt-1 flex items-center justify-between text-xs text-gray-500">
								<span>Closes {new Date((tender.closes_at || 0) * 1000).toLocaleString()}</span>
								<button class="text-blue-600" onclick={() => openDetail(tender)}>Open</button>
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
							{#each tenders as tender}
								<tr class="border-t border-gray-100 dark:border-gray-700">
									<td class="px-4 py-3 font-mono text-xs">{tender.id}</td>
									<td class="truncate px-4 py-3">{tender.title}</td>
									<td class="px-4 py-3">
										<span class="rounded-full px-2 py-0.5 text-xs {statusClass(tender.status)}">{statusLabel(tender.status)}</span>
									</td>
									<td class="px-4 py-3 text-gray-500">{new Date((tender.closes_at || 0) * 1000).toLocaleString()}</td>
									<td class="px-4 py-3 text-right">
										<button class="text-blue-600 hover:underline" onclick={() => openDetail(tender)}>Open</button>
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
					<select class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" bind:value={formDepartment}>
						{#each departments as dept}
							<option value={dept.id}>{dept.id}</option>
						{/each}
					</select>
					{#if departments.length === 0}
						<span class="mt-1 block text-xs text-gray-500">A request is made on behalf of a department; none is listed yet.</span>
					{/if}
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
					from 0 to {MAX_MARK}. Price counts for 50% of the total score and Quality for 50%; the bid's score out of
					100 is the weighted average over evaluators.
				</p>
			</div>
			<button class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50" disabled={busy || !formDepartment} onclick={createTender}>
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
			{#if selected.description}
				<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{selected.description}</p>
			{/if}
			<p class="mt-1 text-xs text-gray-500">
				Requested by {selected.requester || '—'} · Opens {new Date((selected.opens_at || 0) * 1000).toLocaleString()} · Closes
				{new Date((selected.closes_at || 0) * 1000).toLocaleString()}
			</p>
			{#if selected.status === 'contracted' && selected.winner}
				<p class="mt-1 text-xs text-gray-500">
					Awarded to bid <span class="font-mono">{selected.winner}</span>{#if selected.contract}
						· contract <span class="font-mono">{selected.contract}</span>{/if}
				</p>
			{/if}

			<div class="mt-4 flex flex-wrap gap-2">
				{#if selected.status === 'draft' && canManage}
					<button class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white" disabled={busy} onclick={publishTender}>Publish</button>
				{/if}
				{#if selected.status === 'open' && !biddingEnded && canManage}
					<button class="rounded bg-yellow-600 px-3 py-1.5 text-sm text-white" disabled={busy} onclick={closeTender}>Close bidding</button>
				{/if}
				{#if (selected.status === 'closed' || (selected.status === 'open' && biddingEnded)) && canManage}
					<button class="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white" disabled={busy} onclick={revealBids}>Reveal bids &amp; start evaluation</button>
				{/if}
				{#if selected.status === 'evaluation' && canManage}
					<button class="rounded bg-purple-600 px-3 py-1.5 text-sm text-white" disabled={busy || bids.length === 0} onclick={awardTender}>Award</button>
				{/if}
			</div>
			{#if selected.status === 'evaluation' && canManage}
				<p class="mt-2 text-xs text-gray-500">
					Awarding signs the contract with the vendor. Without a selection the best-scored bid wins; choosing a
					lower-scored bid needs a justification.
				</p>
				<label class="mt-2 block text-sm">
					<span class="text-gray-600">Justification (optional)</span>
					<input class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" bind:value={awardJustification} />
				</label>
			{/if}
		</section>

		{#if selected.status === 'open' && !biddingEnded && can('bid.submit')}
			<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700">
				<h3 class="font-medium">Submit sealed bid</h3>
				<p class="text-xs text-gray-500">
					Encrypted with vetKeys for you and the requesting department's staff; the realm keeps it sealed until bidding
					closes.
				</p>
				<div class="mt-3 grid gap-3 md:grid-cols-2">
					<label class="block">
						<span class="text-sm">Bidding as</span>
						<select class="mt-1 w-full rounded border px-3 py-2 dark:border-gray-600 dark:bg-gray-900" bind:value={bidVendor}>
							{#each organizations as org}
								<option value={org.id}>{org.id}</option>
							{/each}
						</select>
						{#if organizations.length === 0}
							<span class="mt-1 block text-xs text-gray-500">Bids are placed for a registered organization you represent; none is registered yet.</span>
						{/if}
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
				<button class="mt-3 rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50" disabled={busy || !hasCrypto || !bidVendor} onclick={submitBid}>
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
								<span class="text-xs text-gray-500">vendor {bid.vendor} · {bid.sealed ? 'sealed' : 'revealed'}</span>
								{#if !bid.sealed && bid.score}
									<span class="text-sm font-medium">Score {bid.score}</span>
								{/if}
								{#if selected.winner === bid.id}
									<span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Winner</span>
								{/if}
							</div>

							{#if ['evaluation', 'contracted'].includes(selected.status)}
								{#if decryptedBids[bid.id]}
									<div class="mt-2 rounded bg-gray-50 p-2 text-sm dark:bg-gray-800">
										<div>Amount: {decryptedBids[bid.id]?.amount ?? '—'}</div>
										<div>{decryptedBids[bid.id]?.description ?? ''}</div>
									</div>
								{:else if decryptedBids[bid.id] === null}
									<p class="mt-2 text-xs text-gray-500">Contents are readable by the vendor and the requesting department's staff.</p>
								{/if}

								{#if selected.status === 'evaluation' && !bid.sealed && can('bid.evaluate')}
									<div class="mt-2 grid gap-2 md:grid-cols-2">
										{#each rubricCriteria(selected.rubric) as crit}
											<label class="block text-xs">
												{crit.label} (0–{MAX_MARK}, weight {crit.weight}%)
												<input
													type="number"
													min="0"
													max={MAX_MARK}
													class="mt-1 w-full rounded border px-2 py-1 dark:border-gray-600 dark:bg-gray-900"
													oninput={(e) => {
														const val = Number((e.target as HTMLInputElement).value);
														scoreInputs[bid.id] = { ...(scoreInputs[bid.id] ?? {}), [crit.id]: val };
													}}
												/>
											</label>
										{/each}
									</div>
									<button class="mt-2 text-xs text-blue-600 hover:underline" disabled={busy} onclick={() => submitScoresForBid(bid.id)}>Save scores</button>
								{/if}

								{#if selected.status === 'evaluation' && canManage}
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

		{#if events}
			<section class="sm:rounded-xl sm:border sm:border-gray-200 sm:p-4 sm:dark:border-gray-700">
				<h3 class="font-medium">Audit log</h3>
				{#if events.length === 0}
					<p class="text-sm text-gray-500">No activity recorded yet.</p>
				{:else}
					<ul class="mt-2 space-y-1 text-xs">
						{#each events as e}
							<li class="font-mono text-gray-600 dark:text-gray-300">
								{e.at ? new Date(e.at * 1000).toISOString() : '—'} · {opLabel(e.op)} · {shortPrincipal(e.user)}{#if e.result?.proposal}
									· proposal {e.result.proposal}{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}
	{/if}
</div>
