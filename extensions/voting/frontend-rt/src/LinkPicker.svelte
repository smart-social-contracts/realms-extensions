<script lang="ts">
	import { MAX_LINKS, addLink, displayId, parseProposalRef, removeLink, replaceable, type Link, type Replaceable } from './links';
	import { t } from './lib/i18n';

	let {
		links = $bindable(),
		withdrawn,
		me,
		suggestions,
		find,
		disabled,
	}: {
		links: Link[];
		/** Withdrawn proposals, among which the member's own can be replaced. */
		withdrawn: Replaceable[];
		me: string;
		/** Proposals offered when typing the one a link relates to. */
		suggestions: { id: string; title: string }[];
		/** The proposal ``id``, or null when the realm has none. */
		find: (id: string) => Promise<{ id: string; title: string } | null>;
		disabled: boolean;
	} = $props();

	const inputClass =
		'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none';
	const addClass =
		'px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50';

	let titles: Record<string, string> = $state({});
	let replacing = $state('');
	let relating = $state('');
	let problem = $state('');
	let looking = $state(false);

	let candidates = $derived(replaceable(withdrawn, me, links));
	let full = $derived(links.length >= MAX_LINKS);

	function add(link: Link, title: string): boolean {
		const added = addLink(links, link);
		if (!added.ok) {
			problem =
				added.reason === 'full'
					? t('links_full', { max: MAX_LINKS })
					: t('links_duplicate', { id: displayId(link.proposal) });
			return false;
		}
		links = added.links;
		titles[link.proposal] = title;
		problem = '';
		return true;
	}

	function addReplaces() {
		const target = candidates.find((p) => p.id === replacing);
		if (target && add({ kind: 'replaces', proposal: target.id }, target.title ?? '')) replacing = '';
	}

	async function addRelatesTo() {
		const id = parseProposalRef(relating);
		if (!id) {
			problem = t('links_bad_ref');
			return;
		}
		looking = true;
		try {
			const found = await find(id);
			if (!found) {
				problem = t('links_not_found', { id: displayId(id) });
			} else if (add({ kind: 'relates_to', proposal: id }, found.title)) {
				relating = '';
			}
		} finally {
			looking = false;
		}
	}
</script>

<div class="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50">
	<div>
		<h3 class="block text-sm font-medium text-gray-700">{t('links_title')}</h3>
		<p class="text-xs text-gray-400 mt-1">{t('links_hint', { max: MAX_LINKS })}</p>
	</div>

	{#if links.length}
		<ul class="flex flex-wrap gap-2">
			{#each links as link (link.proposal)}
				<li class="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white py-1 pl-3 pr-1 text-xs">
					<span class="font-semibold text-gray-700">{t(`link_kind_${link.kind}`)}</span>
					<span class="font-mono text-gray-500">{displayId(link.proposal)}</span>
					{#if titles[link.proposal]}
						<span class="text-gray-700">{titles[link.proposal]}</span>
					{/if}
					<button
						type="button"
						{disabled}
						onclick={() => (links = removeLink(links, link.proposal))}
						class="rounded-full px-1.5 text-gray-500 hover:bg-gray-100"
						title={t('links_remove')}
						aria-label={t('links_remove')}
					>
						&times;
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<div>
		<label for="rt-link-replaces" class="block text-sm font-medium text-gray-700 mb-1">{t('link_kind_replaces')}</label>
		<div class="flex gap-2">
			<select id="rt-link-replaces" bind:value={replacing} disabled={disabled || full || !candidates.length} class={inputClass}>
				<option value="">{candidates.length ? t('links_replaces_pick') : t('links_replaces_none')}</option>
				{#each candidates as p (p.id)}
					<option value={p.id}>{displayId(p.id)} {p.title ?? ''}</option>
				{/each}
			</select>
			<button type="button" onclick={addReplaces} disabled={disabled || full || !replacing} class={addClass}>{t('links_add')}</button>
		</div>
		<p class="text-xs text-gray-400 mt-1">{t('links_replaces_help')}</p>
	</div>

	<div>
		<label for="rt-link-relates" class="block text-sm font-medium text-gray-700 mb-1">{t('link_kind_relates_to')}</label>
		<div class="flex gap-2">
			<input
				id="rt-link-relates"
				type="text"
				list="rt-link-suggestions"
				bind:value={relating}
				placeholder={t('links_relates_placeholder')}
				disabled={disabled || full}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						void addRelatesTo();
					}
				}}
				class={inputClass}
			/>
			<datalist id="rt-link-suggestions">
				{#each suggestions as s (s.id)}
					<option value={displayId(s.id)}>{s.title}</option>
				{/each}
			</datalist>
			<button type="button" onclick={addRelatesTo} disabled={disabled || full || looking || !relating.trim()} class={addClass}>
				{t('links_add')}
			</button>
		</div>
		<p class="text-xs text-gray-400 mt-1">{t('links_relates_help')}</p>
	</div>

	<p class="text-xs text-gray-500">{t('links_count', { count: links.length, max: MAX_LINKS })}</p>
	{#if problem}
		<p class="text-xs text-red-600" role="alert">{problem}</p>
	{/if}
</div>
