<script lang="ts">
	import qrcode from 'qrcode-generator';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	let { ctx }: { ctx: any } = $props();

	let narrow = $state(isNarrowViewport());
	$effect(() => subscribeNarrowViewport((value) => { narrow = value; }));

	const cn = $derived(ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' ')));

	interface RegistrationCode {
		code_hash: string;
		profile: string;
		uses_count: number;
		max_uses: number;
		revoked: boolean;
		expires_at: string | null;
		created_at?: string;
	}

	interface ProfileDef {
		name: string;
		allowed_to: string[];
	}

	// Generate form
	let profile = $state('member');
	let profiles: ProfileDef[] = $state([]);
	let profilesLoading = $state(false);
	let maxUses = $state(1);
	let expiresInHours = $state(24);
	let generating = $state(false);
	let generatedLink: string | null = $state(null);
	let linkCopied = $state(false);
	let qrSvg: string | null = $state(null);
	const qrDataUrl = $derived(
		qrSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}` : null
	);

	// Codes list
	let codes: RegistrationCode[] = $state([]);
	let listLoading = $state(false);
	let revokingHash: string | null = $state(null);

	function addToast(message: string, type: 'success' | 'error' = 'success') {
		const level = type === 'error' ? 'error' : 'success';
		if (typeof ctx.notify === 'function') {
			ctx.notify(level, message);
			return;
		}
		console.warn('[extension]', level, message);
	}

	function generateRandomCode(length: number): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const values = crypto.getRandomValues(new Uint8Array(length));
		return Array.from(values, v => chars[v % chars.length]).join('');
	}

	async function hashCode(code: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(code);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	}

	async function generateInvitation() {
		generating = true;
		generatedLink = null;
		qrSvg = null;
		linkCopied = false;

		try {
			const code = generateRandomCode(16);
			const codeHash = await hashCode(code);

			await ctx.callSync('generate_registration_url', {
				code_hash: codeHash,
				profile,
				max_uses: maxUses,
				expires_in_hours: expiresInHours,
				user_id: 'admin',
				created_by: 'admin',
				frontend_url: '',
			});

			const link = `${window.location.origin}/join?invite=${code}`;
			generatedLink = link;
			qrSvg = generateQrSvg(link);
			addToast('Invitation code generated successfully');
			await loadCodes();
		} catch (e: any) {
			addToast(`Failed to generate invitation: ${e?.message || String(e)}`, 'error');
		} finally {
			generating = false;
		}
	}

	async function copyLink() {
		if (!generatedLink) return;
		await navigator.clipboard.writeText(generatedLink);
		linkCopied = true;
		addToast('Link copied to clipboard');
		setTimeout(() => { linkCopied = false; }, 3000);
	}

	function generateQrSvg(url: string): string {
		const qr = qrcode(0, 'M');
		qr.addData(url);
		qr.make();
		const moduleCount = qr.getModuleCount();
		const margin = 4;
		const size = moduleCount + margin * 2;
		const rects: string[] = [];
		for (let row = 0; row < moduleCount; row++) {
			for (let col = 0; col < moduleCount; col++) {
				if (qr.isDark(row, col)) {
					rects.push(`<rect x="${col + margin}" y="${row + margin}" width="1" height="1"/>`);
				}
			}
		}
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
			`<rect width="${size}" height="${size}" fill="#fff"/>` +
			`<g fill="#000">${rects.join('')}</g></svg>`;
	}

	function downloadQrPng() {
		if (!qrSvg) return;
		const size = 400;
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctxCanvas = canvas.getContext('2d')!;
		const img = new Image();
		const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		img.onload = () => {
			ctxCanvas.fillStyle = '#fff';
			ctxCanvas.fillRect(0, 0, size, size);
			ctxCanvas.drawImage(img, 0, 0, size, size);
			URL.revokeObjectURL(url);
			const a = document.createElement('a');
			a.download = 'invite-qr.png';
			a.href = canvas.toDataURL('image/png');
			a.click();
			addToast('QR code downloaded');
		};
		img.src = url;
	}

	async function loadCodes() {
		listLoading = true;
		try {
			const result = await ctx.callSync('get_registration_codes', { include_used: true });
			const data = result?.data ?? result;
			codes = Array.isArray(data) ? data : (data?.codes ?? []);
		} catch (e: any) {
			addToast(`Failed to load codes: ${e?.message || String(e)}`, 'error');
			codes = [];
		} finally {
			listLoading = false;
		}
	}

	async function revokeCode(codeHash: string) {
		revokingHash = codeHash;
		try {
			await ctx.callSync('revoke_registration_code', { code_hash: codeHash });
			addToast('Invitation revoked');
			await loadCodes();
		} catch (e: any) {
			addToast(`Failed to revoke: ${e?.message || String(e)}`, 'error');
		} finally {
			revokingHash = null;
		}
	}

	function getStatus(code: RegistrationCode): { label: string; color: string } {
		if (code.revoked) return { label: 'Revoked', color: 'bg-red-100 text-red-700' };
		if (code.max_uses > 0 && code.uses_count >= code.max_uses) return { label: 'Used', color: 'bg-gray-100 text-gray-700' };
		if (code.expires_at && new Date(code.expires_at) < new Date()) return { label: 'Expired', color: 'bg-yellow-100 text-yellow-700' };
		return { label: 'Active', color: 'bg-green-100 text-green-700' };
	}

	function formatExpiry(expiresAt: string | null): string {
		if (!expiresAt) return 'Never';
		const date = new Date(expiresAt);
		const now = new Date();
		const diff = date.getTime() - now.getTime();

		if (diff < 0) return 'Expired';
		if (diff < 3600000) return `${Math.round(diff / 60000)}m remaining`;
		if (diff < 86400000) return `${Math.round(diff / 3600000)}h remaining`;
		return date.toLocaleDateString();
	}

	function formatProfileLabel(name: string): string {
		return name
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	async function loadProfiles() {
		profilesLoading = true;
		try {
			const res = await ctx.callSync('get_available_profiles');
			if (res?.success) {
				profiles = res.data?.profiles ?? [];
				if (profiles.length > 0) {
					const hasMember = profiles.some((p) => p.name === 'member');
					if (!profiles.some((p) => p.name === profile)) {
						profile = hasMember ? 'member' : profiles[0].name;
					}
				}
			} else {
				profiles = [];
				addToast('Failed to load profiles', 'error');
			}
		} catch (e: any) {
			profiles = [];
			addToast(`Failed to load profiles: ${e?.message || String(e)}`, 'error');
		} finally {
			profilesLoading = false;
		}
	}

	$effect(() => {
		loadCodes();
		loadProfiles();
	});
</script>

<div class="space-y-6">
	<!-- Generate New Invitation -->
	<div class="bg-white p-0 sm:p-6 sm:shadow-sm sm:rounded-lg sm:border sm:border-gray-200">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Generate New Invitation</h2>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
			<div>
				<label for="inv-profile" class="block text-sm font-medium text-gray-700 mb-1">Profile</label>
				<select
					id="inv-profile"
					bind:value={profile}
					disabled={profilesLoading || profiles.length === 0}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
				>
					{#each profiles as p (p.name)}
						<option value={p.name}>{formatProfileLabel(p.name)}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="inv-max-uses" class="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
				<input
					id="inv-max-uses"
					type="number"
					min="1"
					bind:value={maxUses}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label for="inv-expiry" class="block text-sm font-medium text-gray-700 mb-1">Expires in (hours)</label>
				<input
					id="inv-expiry"
					type="number"
					min="1"
					bind:value={expiresInHours}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<button
			onclick={generateInvitation}
			disabled={generating || profilesLoading || profiles.length === 0}
			class="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
		>
			{generating ? 'Generating…' : 'Generate Invitation'}
		</button>

		{#if generatedLink}
			<div class="mt-4 border border-blue-200 bg-blue-50 rounded-lg p-4">
				<div class="flex items-center gap-2 mb-2">
					<span class="text-blue-800 font-medium text-sm">Invitation Link</span>
				</div>
				<div class="flex items-center gap-2">
					<code class="flex-1 bg-white border border-blue-200 rounded px-3 py-2 text-sm font-mono break-all select-all">
						{generatedLink}
					</code>
					<button
						onclick={copyLink}
						class={cn(
							'px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0',
							linkCopied
								? 'bg-green-600 text-white'
								: 'bg-blue-600 text-white hover:bg-blue-700'
						)}
					>
						{linkCopied ? 'Copied!' : 'Copy'}
					</button>
				</div>
			<p class="mt-2 text-sm text-amber-700 font-medium">
				⚠ Copy this link now — it cannot be retrieved later.
			</p>

			{#if qrSvg}
				<div class="mt-4 pt-4 border-t border-blue-200">
					<div class="flex flex-col sm:flex-row items-start gap-4">
						<div class="bg-white border border-gray-200 rounded-lg p-2 shrink-0" style="width: 200px; height: 200px;">
							{#if qrDataUrl}
								<img src={qrDataUrl} alt="Invitation QR code" class="w-full h-full" />
							{/if}
						</div>
						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium text-blue-800">QR Code</span>
							<p class="text-xs text-gray-600">
								Scan to open the invitation link. Share via screenshot, print, or display on screen.
							</p>
							<button
								onclick={downloadQrPng}
								class="mt-1 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors w-fit"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
								</svg>
								Download QR
							</button>
						</div>
					</div>
				</div>
			{/if}
			</div>
		{/if}
	</div>

	<!-- Active Invitations -->
	<div class="bg-white border-y border-gray-200 sm:shadow-sm sm:rounded-lg sm:border">
		<div class="flex flex-col gap-2 px-0 py-3 sm:px-6 sm:py-4 sm:border-b sm:border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900">Invitations</h2>
			<button
				type="button"
				onclick={loadCodes}
				disabled={listLoading}
				class="self-start p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
				title="Refresh"
				aria-label="Refresh"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			</button>
		</div>

		{#if listLoading}
			<div class="text-center py-10">
				<div class="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
				<p class="mt-2 text-gray-600">Loading invitations…</p>
			</div>
		{:else if codes.length === 0}
			<div class="text-center py-10">
				<p class="text-gray-500">No invitation codes found.</p>
			</div>
		{:else if narrow}
			<div class="divide-y divide-gray-200">
				{#each codes as code (code.code_hash)}
					{@const status = getStatus(code)}
					<article class="py-3">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<span
									class="font-mono text-xs bg-gray-100 px-2 py-1 rounded cursor-help"
									title={code.code_hash}
								>
									{code.code_hash.slice(0, 12)}…
								</span>
								<div class="mt-2 flex flex-wrap items-center gap-1.5">
									<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
										{formatProfileLabel(code.profile)}
									</span>
									<span class={cn('px-2 py-0.5 rounded-full text-xs font-medium', status.color)}>
										{status.label}
									</span>
								</div>
								<div class="mt-1 text-xs text-gray-500">
									{code.uses_count} / {code.max_uses || '∞'} uses · {formatExpiry(code.expires_at)}
								</div>
							</div>
							{#if !code.revoked && !(code.max_uses > 0 && code.uses_count >= code.max_uses)}
								<button
									onclick={() => revokeCode(code.code_hash)}
									disabled={revokingHash === code.code_hash}
									class="shrink-0 px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{revokingHash === code.code_hash ? 'Revoking…' : 'Revoke'}
								</button>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="px-4 py-3 text-left font-medium text-gray-600">Code Hash</th>
							<th class="px-4 py-3 text-left font-medium text-gray-600">Profile</th>
							<th class="px-4 py-3 text-left font-medium text-gray-600">Uses</th>
							<th class="px-4 py-3 text-left font-medium text-gray-600">Status</th>
							<th class="px-4 py-3 text-left font-medium text-gray-600">Expires</th>
							<th class="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each codes as code (code.code_hash)}
							{@const status = getStatus(code)}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-4 py-3">
									<span
										class="font-mono text-xs bg-gray-100 px-2 py-1 rounded cursor-help"
										title={code.code_hash}
									>
										{code.code_hash.slice(0, 12)}…
									</span>
								</td>
								<td class="px-4 py-3">
									<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
										{formatProfileLabel(code.profile)}
									</span>
								</td>
								<td class="px-4 py-3 text-gray-700">
									{code.uses_count} / {code.max_uses || '∞'}
								</td>
								<td class="px-4 py-3">
									<span class={cn('px-2 py-0.5 rounded-full text-xs font-medium', status.color)}>
										{status.label}
									</span>
								</td>
								<td class="px-4 py-3 text-gray-600 text-xs">
									{formatExpiry(code.expires_at)}
								</td>
								<td class="px-4 py-3 text-right">
									{#if !code.revoked && !(code.max_uses > 0 && code.uses_count >= code.max_uses)}
										<button
											onclick={() => revokeCode(code.code_hash)}
											disabled={revokingHash === code.code_hash}
											class="px-3 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										>
											{revokingHash === code.code_hash ? 'Revoking…' : 'Revoke'}
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
