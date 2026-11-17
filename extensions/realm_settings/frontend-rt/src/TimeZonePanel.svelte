<script lang="ts">
	import { onMount } from 'svelte';
	import { UTC, formatInZone, formatWithUtc, isKnownZone, matchZone } from '../../../_shared/frontend/realm-time';
	import { t } from './lib/i18n';

	let {
		value = $bindable(),
		saved,
		choices,
		direct,
		policy,
		governedBy,
	}: {
		/** The zone as typed; saved with the other settings. */
		value: string;
		/** The realm's official time zone now. */
		saved: string;
		choices: string[];
		/** Whether the root department's policy lets a change apply at once. */
		direct: boolean;
		policy: string;
		governedBy: string;
	} = $props();

	let now = $state(Math.floor(Date.now() / 1000));

	onMount(() => {
		const tick = setInterval(() => (now = Math.floor(Date.now() / 1000)), 1000);
		return () => clearInterval(tick);
	});

	// A zone this browser does not know cannot be shown: its time is given in UTC.
	let shownZone = $derived(isKnownZone(saved) ? saved : UTC);
	let typed = $derived(matchZone(choices, value));
</script>

<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
	<h2 class="text-lg font-semibold text-gray-900 mb-1">{t('section_timezone')}</h2>
	<p class="text-sm text-gray-500 mb-5">{t('section_timezone_desc')}</p>
	<div class="space-y-5">
		<div class="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900" data-testid="official-time">
			{t('timezone_now', { time: formatWithUtc(now, shownZone) })}
		</div>
		<div>
			<label for="rs-timezone" class="block text-sm font-medium text-gray-700 mb-1">{t('timezone')}</label>
			<input
				id="rs-timezone"
				type="text"
				list="rs-timezones"
				autocomplete="off"
				bind:value
				placeholder={t('timezone_placeholder')}
				class="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			/>
			<datalist id="rs-timezones">
				{#each choices as zone (zone)}
					<option value={zone}></option>
				{/each}
			</datalist>
			{#if typed && typed !== saved}
				<p class="mt-2 text-xs text-gray-500" data-testid="timezone-preview">
					{t('timezone_preview', { zone: typed, time: formatInZone(now, typed) })}
				</p>
			{/if}
			<p class="mt-1 text-xs text-gray-500">
				{direct ? t('timezone_applies_now') : t('timezone_needs_vote', { department: governedBy, policy })}
			</p>
		</div>
	</div>
</section>
