<script module lang="ts">
	let pickers = 0;
</script>

<script lang="ts">
	import { MAX_TAGS, MAX_TAG_LENGTH, addTag, removeTag } from './tags';
	import { t } from './lib/i18n';

	let {
		tags = $bindable(),
		suggestions = [],
		max = MAX_TAGS,
		compact = false,
		disabled = false,
		onchange,
	}: {
		tags: string[];
		/** Tags offered while typing (the realm lists none: the ones the loaded proposals carry). */
		suggestions?: string[];
		max?: number;
		/** The filter above the list: the tags and a box to add one, without the box and the explanations of the form. */
		compact?: boolean;
		disabled?: boolean;
		/** Called after a tag is added or removed. */
		onchange?: () => void;
	} = $props();

	const inputClass =
		'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none';
	const compactInputClass =
		'text-xs border-gray-300 py-1.5 px-2.5 text-gray-700 focus:border-indigo-500 focus:ring-indigo-500';
	const addClass =
		'px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50';

	let typed = $state('');
	let problem = $state('');

	let full = $derived(tags.length >= max);
	const listId = `rt-tags-${++pickers}`;

	function add() {
		const added = addTag(tags, typed, max);
		if (!added.ok) {
			problem = t(`tags_problem_${added.reason}`, { max, length: MAX_TAG_LENGTH, tag: typed.trim() });
			return;
		}
		tags = added.tags;
		typed = '';
		problem = '';
		onchange?.();
	}

	function remove(tag: string) {
		tags = removeTag(tags, tag);
		problem = '';
		onchange?.();
	}
</script>

{#snippet chips()}
	{#if tags.length}
		<ul class="flex flex-wrap gap-2" data-testid="tag-chips">
			{#each tags as tag (tag)}
				<li
					class="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white py-1 pl-3 pr-1 text-xs"
					data-testid="tag-chip"
				>
					<span class="text-gray-700">{tag}</span>
					<button
						type="button"
						{disabled}
						onclick={() => remove(tag)}
						class="rounded-full px-1.5 text-gray-500 hover:bg-gray-100"
						title={t('tags_remove', { tag })}
						aria-label={t('tags_remove', { tag })}
					>
						&times;
					</button>
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

{#snippet box()}
	<input
		id="{listId}-input"
		type="text"
		list="{listId}-suggestions"
		bind:value={typed}
		placeholder={compact ? t('tags_filter_placeholder') : t('tags_placeholder')}
		aria-label={compact ? t('tags_filter_title') : undefined}
		title={compact ? t('tags_filter_hint', { max }) : undefined}
		disabled={disabled || full}
		onkeydown={(e) => {
			if (e.key === 'Enter') {
				// Enter adds the tag; it must not submit the form it is in.
				e.preventDefault();
				add();
			}
		}}
		class={compact ? compactInputClass : inputClass}
		data-testid="tag-input"
	/>
	<datalist id="{listId}-suggestions">
		{#each suggestions.filter((tag) => !tags.includes(tag)) as tag (tag)}
			<option value={tag}></option>
		{/each}
	</datalist>
	<button
		type="button"
		onclick={add}
		disabled={disabled || full || !typed.trim()}
		class={compact ? 'text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50' : addClass}
		data-testid="tag-add"
	>
		{t('tags_add')}
	</button>
{/snippet}

{#if compact}
	<div class="flex flex-wrap items-center gap-2" data-testid="tag-filter">
		{@render chips()}
		{@render box()}
		{#if problem}
			<p class="text-xs text-red-600" role="alert" data-testid="tag-problem">{problem}</p>
		{/if}
	</div>
{:else}
	<div class="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50" data-testid="tag-picker">
		<div>
			<label for="{listId}-input" class="block text-sm font-medium text-gray-700">{t('tags_title')}</label>
			<p class="text-xs text-gray-400 mt-1" data-testid="tags-hint">{t('tags_hint', { max, length: MAX_TAG_LENGTH })}</p>
		</div>
		{@render chips()}
		<div class="flex gap-2">
			{@render box()}
		</div>
		<p class="text-xs text-gray-500" data-testid="tags-count">{t('tags_count', { count: tags.length, max })}</p>
		{#if problem}
			<p class="text-xs text-red-600" role="alert" data-testid="tag-problem">{problem}</p>
		{/if}
	</div>
{/if}
