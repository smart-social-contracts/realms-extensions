<script lang="ts">
	import { JOURNAL_SIGNING, type JournalSigning } from './journalSigning';
	import { t } from './lib/i18n';

	let {
		value = $bindable(),
		direct,
		policy,
		governedBy,
	}: {
		/** The mode as chosen; saved with the other settings. */
		value: JournalSigning;
		/** Whether the root department's policy lets a change apply at once. */
		direct: boolean;
		policy: string;
		governedBy: string;
	} = $props();
</script>

<section class="bg-white py-4 mb-6 sm:shadow-sm sm:rounded-lg sm:p-6">
	<h2 class="text-lg font-semibold text-gray-900 mb-1">{t('section_journal_signing')}</h2>
	<p class="text-sm text-gray-500 mb-5">{t('section_journal_signing_desc')}</p>
	<fieldset>
		<legend class="block text-sm font-medium text-gray-700 mb-2">{t('journal_signing')}</legend>
		<div class="space-y-3">
			{#each JOURNAL_SIGNING as mode (mode)}
				<label class="flex items-start gap-3 text-sm text-gray-800">
					<input type="radio" name="rs-journal-signing" value={mode} bind:group={value} class="mt-1" />
					<span>
						<span class="font-medium">{t(`journal_signing_${mode}`)}</span>
						<span class="block text-xs text-gray-500">{t(`journal_signing_${mode}_note`)}</span>
					</span>
				</label>
			{/each}
		</div>
		<p class="mt-3 text-xs text-gray-500">
			{direct ? t('journal_signing_applies_now') : t('journal_signing_needs_vote', { department: governedBy, policy })}
		</p>
	</fieldset>
</section>
