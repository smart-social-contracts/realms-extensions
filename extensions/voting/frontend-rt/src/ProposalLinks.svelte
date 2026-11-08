<script lang="ts">
	import { onMount } from 'svelte';
	import { displayId, type Link } from './links';
	import { t } from './lib/i18n';

	let {
		proposal,
		read,
		onopen,
	}: {
		proposal: { id: string; links: Link[]; replaced_by: string };
		/** A realm read operation's reply, or null when it fails. */
		read: (name: string, args: Record<string, unknown>) => Promise<any>;
		onopen: (id: string) => void;
	} = $props();

	// Proposals linking to this one come this many at a time.
	const PAGE = 10;

	let briefs: Record<string, { title: string; status: string }> = $state({});
	let linkedFrom: Link[] = $state([]);
	let next: number | null = $state(null);
	let loading = $state(false);

	let hasLinks = $derived(proposal.links.length > 0 || !!proposal.replaced_by || linkedFrom.length > 0);

	/** The title and status of the proposals named, so that a link says more than a number. */
	async function describe(ids: string[]) {
		await Promise.all(
			ids
				.filter((id) => !briefs[id])
				.map(async (id) => {
					const res = await read('proposal_get', { proposal: id, count: 1 });
					if (res?.proposal) briefs[id] = { title: String(res.proposal.title ?? ''), status: String(res.proposal.status ?? '') };
				}),
		);
	}

	async function loadLinkedFrom(from: number) {
		loading = true;
		try {
			const res = await read('proposal_linked_from', { proposal: proposal.id, from, count: PAGE });
			if (!res) return;
			const rows: Link[] = Array.isArray(res.links) ? res.links : [];
			linkedFrom = [...linkedFrom, ...rows];
			next = res.next != null && Number.isFinite(Number(res.next)) ? Number(res.next) : null;
			await describe(rows.map((row) => row.proposal));
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void describe([...proposal.links.map((link) => link.proposal), ...(proposal.replaced_by ? [proposal.replaced_by] : [])]);
		void loadLinkedFrom(1);
	});
</script>

{#snippet proposalRef(id: string)}
	<button type="button" onclick={() => onopen(id)} class="font-mono text-xs text-indigo-600 hover:text-indigo-800 underline">
		{displayId(id)}
	</button>
	{#if briefs[id]}
		<span class="text-gray-700">{briefs[id].title}</span>
		<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
			{briefs[id].status.replace(/_/g, ' ')}
		</span>
	{/if}
{/snippet}

{#if hasLinks}
	<div class="rounded-lg border border-gray-200 bg-white p-5" data-testid="proposal-links">
		<h3 class="text-base font-semibold text-gray-900 mb-3">{t('links_title')}</h3>
		<div class="space-y-4 text-sm">
			{#if proposal.replaced_by}
				<div>
					<div class="text-xs text-gray-500 mb-1">{t('replaced_by')}</div>
					<div class="flex flex-wrap items-center gap-2">{@render proposalRef(proposal.replaced_by)}</div>
				</div>
			{/if}

			{#if proposal.links.length}
				<div>
					<div class="text-xs text-gray-500 mb-1">{t('links_of_this')}</div>
					<ul class="space-y-1">
						{#each proposal.links as link (link.proposal)}
							<li class="flex flex-wrap items-center gap-2">
								<span class="font-semibold text-gray-700">{t(`link_kind_${link.kind}`)}</span>
								{@render proposalRef(link.proposal)}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if linkedFrom.length}
				<div>
					<div class="text-xs text-gray-500 mb-1">{t('linked_from')}</div>
					<ul class="space-y-1">
						{#each linkedFrom as link (link.proposal)}
							<li class="flex flex-wrap items-center gap-2">
								{@render proposalRef(link.proposal)}
								<span class="text-gray-500">{t(`linked_${link.kind}`)}</span>
							</li>
						{/each}
					</ul>
					{#if next != null}
						<button
							type="button"
							onclick={() => loadLinkedFrom(next!)}
							disabled={loading}
							class="mt-2 px-3 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
						>
							{t('load_more')}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
