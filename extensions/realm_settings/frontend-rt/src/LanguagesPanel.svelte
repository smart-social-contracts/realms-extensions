<script lang="ts">
	import {
		HOST_LANGUAGE_CATALOG,
		addRealmLanguage,
		languageLabel,
		localesAvailableToAdd,
		removeRealmLanguage,
		setPrimaryLanguage,
		validateRealmLanguages,
	} from './languages';

	let {
		languages = $bindable(),
		primaryLanguage = $bindable(),
	}: {
		languages: string[];
		primaryLanguage: string;
	} = $props();

	let panelError = $state('');
	let addLocale = $state('');

	let available = $derived(localesAvailableToAdd(languages));
	let validity = $derived(
		validateRealmLanguages({ languages, primary_language: primaryLanguage }),
	);

	$effect(() => {
		if (available.length > 0 && !available.some((l) => l.id === addLocale)) {
			addLocale = available[0]?.id ?? '';
		}
		if (available.length === 0) addLocale = '';
	});

	function apply(result: ReturnType<typeof addRealmLanguage>) {
		if (!result.ok) {
			panelError = result.error;
			return;
		}
		panelError = '';
		languages = result.state.languages;
		primaryLanguage = result.state.primary_language;
	}

	function addSelected() {
		if (!addLocale) return;
		apply(addRealmLanguage({ languages, primary_language: primaryLanguage }, addLocale));
	}

	function removeLocale(id: string) {
		apply(removeRealmLanguage({ languages, primary_language: primaryLanguage }, id));
	}

	function choosePrimary(id: string) {
		apply(setPrimaryLanguage({ languages, primary_language: primaryLanguage }, id));
	}
</script>

<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
	<h2 class="text-lg font-semibold text-gray-900 mb-1">Languages</h2>
	<p class="text-sm text-gray-500 mb-5">
		Locales this realm offers. The primary language is the default UI until a member chooses their own
		in user settings. Valencià is <code class="bg-gray-100 px-1 rounded">ca-valencia</code> — not a
		second Catalan catalog.
	</p>

	{#if languages.length === 0}
		<p class="text-sm text-gray-600 mb-4" data-testid="languages-empty">
			No languages configured yet. Add one from the host catalog to enable a primary.
		</p>
	{:else}
		<ul class="divide-y divide-gray-100 border border-gray-200 rounded-lg mb-5" data-testid="languages-list">
			{#each languages as id (id)}
				<li class="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium text-gray-900">{languageLabel(id)}</div>
						<div class="text-xs text-gray-500 font-mono">{id}</div>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						{#if id === primaryLanguage}
							<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
								Primary
							</span>
						{:else}
							<button
								type="button"
								onclick={() => choosePrimary(id)}
								class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
							>
								Set as primary
							</button>
						{/if}
						<button
							type="button"
							onclick={() => removeLocale(id)}
							disabled={id === primaryLanguage && languages.length > 1}
							title={id === primaryLanguage && languages.length > 1
								? 'Set a different primary language before removing this one'
								: `Remove ${languageLabel(id)}`}
							class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Remove
						</button>
					</div>
				</li>
			{/each}
		</ul>

		<div class="mb-5">
			<label for="rs-primary-language" class="block text-sm font-medium text-gray-700 mb-1">Primary language</label>
			<select
				id="rs-primary-language"
				value={primaryLanguage}
				onchange={(e) => choosePrimary((e.currentTarget as HTMLSelectElement).value)}
				class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				{#each languages as id (id)}
					<option value={id}>{languageLabel(id)}</option>
				{/each}
			</select>
			<p class="mt-1 text-xs text-gray-500">Must stay in the enabled list.</p>
		</div>
	{/if}

	{#if available.length > 0}
		<div>
			<label for="rs-add-language" class="block text-sm font-medium text-gray-700 mb-1">Add language</label>
			<div class="flex flex-col sm:flex-row gap-2 max-w-lg">
				<select
					id="rs-add-language"
					bind:value={addLocale}
					class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					{#each available as loc (loc.id)}
						<option value={loc.id}>{loc.name} ({loc.id})</option>
					{/each}
				</select>
				<button
					type="button"
					onclick={addSelected}
					disabled={!addLocale}
					class="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
				>
					Add
				</button>
			</div>
			<p class="mt-1 text-xs text-gray-500">
				Catalog: {HOST_LANGUAGE_CATALOG.map((l) => l.name).join(', ')}.
			</p>
		</div>
	{:else}
		<p class="text-xs text-gray-500">Every catalog locale is enabled.</p>
	{/if}

	{#if panelError}
		<p class="mt-3 text-xs text-red-600">{panelError}</p>
	{/if}
	{#if !validity.ok}
		<p class="mt-3 text-xs text-red-600">{validity.error}</p>
	{/if}
</section>
