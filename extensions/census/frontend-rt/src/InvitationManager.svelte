<script lang="ts">
	import qrcode from 'qrcode-generator';

	let { ctx }: { ctx: any } = $props();

	const cn = ctx.theme?.cn ?? ((...classes: string[]) => classes.filter(Boolean).join(' '));

	interface RegistrationCode {
		code_hash: string;
		profile: string;
		uses_count: number;
		max_uses: number;
		revoked: boolean;
		expires_at: string | null;
	}

	let profile = $state('member');
	let maxUses = $state(1);
	let expiresInHours = $state(24);
	let generating = $state(false);
	let generatedLink: string | null = $state(null);
	let generatedQuarterId: string | null = $state(null);
	let linkCopied = $state(false);
	let qrSvg: string | null = $state(null);

	// Codes list
	let codes: RegistrationCode[] = $state([]);
	let listLoading = $state(false);
	let listNote = $state('');
	let revokingHash: string | null = $state(null);

	function addToast(message: string, type: 'success' | 'error' = 'success') {
		const level = type === 'error' ? 'error' : 'success';
		if (typeof ctx.notify === 'function') {
			ctx.notify(level, message);
			return;
		}
		console.warn('[extension]', level, message);
	}

	/** A realm operation's reply; never throws, failures come back as ``{ ok: false, error }``. */
	async function call(kind: 'read' | 'run', name: string, args: Record<string, unknown> = {}): Promise<any> {
		try {
			return (await ctx[kind](name, args)) ?? { ok: false, error: `${name} returned no reply` };
		} catch (e: any) {
			return { ok: false, error: e?.message ?? String(e) };
		}
	}

	function deniedPermission(message: string): string | null {
		const m = /^\S+ needs (\S+)$/.exec(message.trim());
		return m ? m[1] : null;
	}

	/** The canister of the quarter answering this tab: quarter_directory lists itself first. */
	async function answeringQuarter(): Promise<string> {
		const reply = await call('read', 'quarter_directory');
		const first = reply?.ok && Array.isArray(reply.quarters) ? reply.quarters[0] : null;
		return typeof first?.id === 'string' ? first.id : '';
	}

	async function generateInvitation() {
		generating = true;
		generatedLink = null;
		generatedQuarterId = null;
		qrSvg = null;
		linkCopied = false;

		try {
			const uses = Math.max(1, Math.floor(Number(maxUses) || 1));
			const hours = Number(expiresInHours) || 0;
			const args: Record<string, unknown> = { profile, max_uses: uses };
			if (hours > 0) args.expires_in = Math.round(hours * 3600);

			// The invite lives on the quarter this admin tab is pointed at, so the link targets that quarter only.
			const [reply, quarterId] = await Promise.all([call('run', 'invite_create', args), answeringQuarter()]);
			const code = reply?.ok ? String(reply.invite?.code ?? '') : '';
			if (!code) {
				addToast(`Could not generate the invitation: ${reply?.error || 'no code was returned'}`, 'error');
				return;
			}

			generatedQuarterId = quarterId || null;
			const quarterParam = quarterId ? `&quarter=${encodeURIComponent(quarterId)}` : '';
			const link = `${window.location.origin}/join?invite=${encodeURIComponent(code)}${quarterParam}`;
			generatedLink = link;
			qrSvg = generateQrSvg(link);
			addToast('Invitation code generated successfully');
			await loadCodes();
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

	function toCode(row: any): RegistrationCode {
		const expires = Number(row?.expires_at) || 0;
		return {
			code_hash: String(row?.id ?? ''),
			profile: String(row?.profile || 'member'),
			uses_count: Number(row?.uses) || 0,
			max_uses: Number(row?.max_uses) || 0,
			revoked: !!row?.revoked,
			// Realm times are seconds; 0 means the invite never expires.
			expires_at: expires > 0 ? new Date(expires * 1000).toISOString() : null,
		};
	}

	async function loadCodes() {
		listLoading = true;
		listNote = '';
		try {
			const rows: RegistrationCode[] = [];
			let from: number | null = 1;
			for (let pages = 0; from != null && pages < 1000; pages++) {
				const reply = await call('read', 'invite_list', { from, count: 500 });
				if (!reply?.ok) {
					const message = String(reply?.error ?? '');
					const perm = deniedPermission(message);
					listNote = perm
						? `Viewing invitations needs the ${perm} permission.`
						: `Invitations could not be listed${message ? `: ${message}` : '.'}`;
					codes = [];
					return;
				}
				for (const row of Array.isArray(reply.invites) ? reply.invites : []) rows.push(toCode(row));
				from = typeof reply.next === 'number' ? reply.next : null;
			}
			codes = rows.filter((c) => c.code_hash);
		} finally {
			listLoading = false;
		}
	}

	async function revokeCode(codeHash: string) {
		revokingHash = codeHash;
		try {
			const reply = await call('run', 'invite_revoke', { invite: codeHash });
			if (!reply?.ok) {
				addToast(`Could not revoke the invitation: ${reply?.error || 'no reply'}`, 'error');
				return;
			}
			addToast('Invitation revoked');
			await loadCodes();
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

	$effect(() => {
		loadCodes();
	});
</script>

<div class="space-y-6">
	<!-- Generate New Invitation -->
	<div class="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Generate New Invitation</h2>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
			<div>
				<label for="inv-profile" class="block text-sm font-medium text-gray-700 mb-1">Profile</label>
				<select
					id="inv-profile"
					bind:value={profile}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
				>
					<option value="member">Member</option>
					<option value="admin">Administrator</option>
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
			disabled={generating}
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
			{#if generatedQuarterId}
				<p class="mt-1 text-xs text-gray-600">
					This invitation is valid only on quarter
					<code class="font-mono">{generatedQuarterId}</code>. Switch the quarter selector in the top bar to issue codes for a different quarter.
				</p>
			{/if}

			{#if qrSvg}
				<div class="mt-4 pt-4 border-t border-blue-200">
					<div class="flex items-start gap-4">
						<div class="bg-white border border-gray-200 rounded-lg p-2 shrink-0" style="width: 200px; height: 200px;">
							{@html qrSvg}
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
	<div class="bg-white shadow-sm rounded-lg border border-gray-200">
		<div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900">Invitations</h2>
			<button
				onclick={loadCodes}
				disabled={listLoading}
				class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
				title="Refresh"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			</button>
		</div>

		{#if listLoading}
			<div class="text-center py-10">
				<div class="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
				<p class="mt-2 text-gray-600">Loading invitations…</p>
			</div>
		{:else if listNote}
			<div class="text-center py-10">
				<p class="text-gray-500">{listNote}</p>
			</div>
		{:else if codes.length === 0}
			<div class="text-center py-10">
				<p class="text-gray-500">No invitation codes found.</p>
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
						{#each codes as code}
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
									<span class={cn(
										'px-2 py-0.5 rounded-full text-xs font-medium',
										code.profile === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
									)}>
										{code.profile === 'admin' ? 'Admin' : code.profile === 'member' ? 'Member' : code.profile}
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
