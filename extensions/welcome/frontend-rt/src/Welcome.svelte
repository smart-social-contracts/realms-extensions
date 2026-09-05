<script lang="ts">
	import { loadExtensionI18n, t } from './lib/i18n';

	let { ctx }: { ctx: any } = $props();

	let i18nTick = $state(0);

	$effect(() => {
		const localeStore = ctx?.locale;
		if (!localeStore?.subscribe) {
			void loadExtensionI18n('en').then(() => {
				i18nTick++;
			});
			return;
		}
		const unsub = localeStore.subscribe((loc: string | null | undefined) => {
			void loadExtensionI18n(loc || 'en').then(() => {
				i18nTick++;
			});
		});
		return unsub;
	});

	let realmData = $state<any>({});
	let authenticated = $state(false);
	let loading = $state(true);

	let realmName = $derived(realmData?.realm_name || realmData?.name || '');
	let realmManifesto = $derived(realmData?.realm_manifesto || realmData?.manifesto || '');
	let welcomeMessage = $derived(realmData?.realm_welcome_message || realmData?.welcome_message || '');

	$effect(() => {
		const unsub = ctx.realmInfo?.subscribe?.((v: any) => {
			if (v && typeof v === 'object') {
				realmData = v;
				loading = !!v.loading;
			}
		});
		return () => unsub?.();
	});

	$effect(() => {
		const unsub = ctx.isAuthenticated?.subscribe?.((v: any) => {
			authenticated = !!v;
		});
		return () => unsub?.();
	});

	function handleCTA() {
		if (authenticated) {
			ctx.navigate?.('/');
		} else {
			ctx.navigate?.('/join');
		}
	}
</script>

{#key i18nTick}
<div class="relative w-full h-screen overflow-hidden flex items-center justify-center bg-black">
	<!-- Background image -->
	<div class="absolute inset-0 z-0">
		<img
			src="/images/background.png"
			alt={realmName ? `${realmName} background` : `${t('realm_default')} background`}
			class="w-full h-full object-cover opacity-80 transition-opacity duration-1000"
		/>
		<div class="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/70"></div>
	</div>

	<!-- Top bar with logo -->
	<div class="absolute top-0 left-0 w-full h-20 bg-black/50 backdrop-blur-md z-20 flex items-center px-6 md:px-10">
		<div class="flex items-center gap-3">
			<img
				src="/custom/logo.png"
				alt={realmName || t('realm_default')}
				class="h-10 md:h-12 lg:h-14 w-auto drop-shadow-lg"
			/>
		</div>
	</div>

	<!-- Main content -->
	<div class="relative z-10 w-full flex items-center justify-center md:justify-end px-4 md:px-10 lg:px-16">
		<div class="bg-black/55 backdrop-blur-lg rounded-2xl p-8 md:p-12 max-w-xl w-full text-white shadow-2xl border border-white/10">
			{#if loading}
				<div class="flex items-center justify-center py-8">
					<svg class="animate-spin h-8 w-8 text-white/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				</div>
			{:else}
				<div class="text-center md:text-left mb-8">
					<h1 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight tracking-tight drop-shadow-lg">
						{#if realmName}
							{t('welcome_to', { name: realmName })}
						{:else}
							{t('welcome')}
						{/if}
					</h1>

					{#if welcomeMessage}
						<p class="text-lg md:text-xl font-medium text-white/90 mb-3 leading-relaxed">
							{welcomeMessage}
						</p>
					{/if}

				{#if realmManifesto}
					<p class="text-base text-white/75 leading-relaxed">
						{realmManifesto}
					</p>
				{/if}
				</div>

				<div class="flex flex-col items-center md:items-center gap-3">
					<button
						onclick={handleCTA}
						class="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-base tracking-wide transition-all duration-300 bg-blue-500/90 hover:bg-blue-500 text-white border-2 border-blue-400 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(59,130,246,0.5)] cursor-pointer"
					>
						{#if authenticated}
							{t('enter_realm')}
						{:else}
							{t('join_this_realm')}
						{/if}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Powered by badge -->
	<div class="absolute bottom-6 right-4 md:bottom-8 md:right-6 z-20">
		<a
			href="https://realmsgos.org"
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center gap-1.5 bg-black/60 backdrop-blur-lg rounded-lg px-3 py-2 text-white text-xs md:text-sm no-underline hover:text-white/80 transition-colors"
		>
			Powered by
			<img src="/images/logo_horizontal_white.svg" alt="Realms GOS" class="h-5 md:h-6 inline-block" />
		</a>
	</div>
</div>
{/key}
