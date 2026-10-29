<script lang="ts">
	import { onDestroy } from 'svelte';
	import { tick } from 'svelte';
	import { description as extensionDescription } from '../../manifest.json';
	import {
		isNarrowViewport,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	let { ctx }: { ctx: any } = $props();

	const cn = (...classes: (string | false | null | undefined)[]) =>
		typeof ctx.theme?.cn === 'function' ? ctx.theme.cn(...classes) : classes.filter(Boolean).join(' ');

	interface DeptInfo {
		name: string;
		description: string;
		can_manage: boolean;
		members: string[];
	}

	interface DocMeta {
		id: string;
		title: string;
		department: string;
		scope: string;
		created_by: string;
		created_at: string;
		can_manage: boolean;
	}

	type DocReshareStatus = 'pending' | 'in_progress' | 'done' | 'skipped' | 'failed';

	interface DocReshareProgress {
		doc: DocMeta;
		status: DocReshareStatus;
		error?: string;
	}

	const principalStore = ctx.principal;
	let me = $state('');
	principalStore?.subscribe?.((v: string) => (me = v || ''));

	let departments = $state<DeptInfo[]>([]);
	let documents = $state<DocMeta[]>([]);
	let loading = $state(true);
	let error = $state('');

	let selectedDept = $state<string>('');
	let searchQuery = $state('');
	let narrow = $state(isNarrowViewport());
	let unsubNarrow: (() => void) | undefined;
	let openMenuKey = $state<string | null>(null);
	let menuOpenUp = $state(false);
	let docListEl = $state<HTMLUListElement | null>(null);

	let directoryLabels = $state<Map<string, string>>(new Map());

	let openDoc = $state<DocMeta | null>(null);
	let openState = $state<'idle' | 'loading' | 'no_access' | 'ready' | 'error'>('idle');
	let openContent = $state<{ title: string; body: string } | null>(null);
	let openError = $state('');

	let composerMode = $state<'create' | 'edit' | null>(null);
	let editingDocId = $state<string | null>(null);
	let formTitle = $state('');
	let formBody = $state('');
	let pristineTitle = $state('');
	let pristineBody = $state('');
	let saving = $state(false);
	let saveError = $state('');

	let reshareDialogOpen = $state(false);
	let reshareTargetDept = $state('');
	let reshareDocProgress = $state<DocReshareProgress[]>([]);
	let reshareRunning = $state(false);
	let reshareCancelled = $state(false);
	let reshareCompletedDocIds = $state<Set<string>>(new Set());

	const visibleDocs = $derived(
		selectedDept ? documents.filter((d) => d.department === selectedDept) : documents,
	);

	const filteredDocs = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return visibleDocs;
		return visibleDocs.filter(
			(doc) =>
				doc.title.toLowerCase().includes(q) ||
				authorLabel(doc.created_by).toLowerCase().includes(q),
		);
	});

	const currentDept = $derived(departments.find((d) => d.name === selectedDept) || null);
	const canManageSelected = $derived(!!currentDept?.can_manage);
	const reshareDialogDept = $derived(
		departments.find((d) => d.name === reshareTargetDept) || null,
	);

	const reshareProgressCounts = $derived.by(() => {
		const total = reshareDocProgress.length;
		const done = reshareDocProgress.filter(
			(p) => p.status === 'done' || p.status === 'skipped',
		).length;
		const failed = reshareDocProgress.filter((p) => p.status === 'failed').length;
		const inProgress = reshareDocProgress.some((p) => p.status === 'in_progress');
		return { total, done, failed, inProgress };
	});

	const reshareAllFinished = $derived(
		reshareDocProgress.length > 0 &&
			reshareDocProgress.every(
				(p) =>
					p.status === 'done' || p.status === 'skipped' || p.status === 'failed',
			),
	);

	function deptDocCount(name: string): number {
		return documents.filter((d) => d.department === name).length;
	}

	const memberShareHint = $derived.by(() => {
		const n = currentDept?.members.length ?? 0;
		if (n === 1) return 'Shared with 1 department member.';
		return `Shared with ${n} department members.`;
	});

	const hasDraft = $derived(
		composerMode !== null &&
			(formTitle.trim() !== pristineTitle.trim() || formBody.trim() !== pristineBody.trim()),
	);

	function clearComposerForm() {
		formTitle = '';
		formBody = '';
		pristineTitle = '';
		pristineBody = '';
	}

	function seedComposerForm(title: string, body: string) {
		formTitle = title;
		formBody = body;
		pristineTitle = title;
		pristineBody = body;
	}

	function truncatePrincipal(p: string): string {
		if (!p || p.length <= 10) return p;
		return `${p.slice(0, 5)}…${p.slice(-3)}`;
	}

	function authorLabel(principal: string): string {
		if (!principal) return 'Unknown';
		if (principal === me) return 'You';
		return directoryLabels.get(principal) ?? truncatePrincipal(principal);
	}

	function parseCreatedAt(raw: string): number | null {
		const ms = Date.parse(raw);
		return Number.isNaN(ms) ? null : ms;
	}

	function formatRelativeTime(timestampMs: number): string {
		if (!timestampMs) return '';
		const diffMs = Date.now() - timestampMs;
		if (diffMs < 0) return 'just now';
		const s = Math.floor(diffMs / 1000);
		if (s < 60) return 'just now';
		const m = Math.floor(s / 60);
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		const d = Math.floor(h / 24);
		if (d < 30) return `${d}d ago`;
		const mo = Math.floor(d / 30);
		if (mo < 12) return `${mo}mo ago`;
		return `${Math.floor(mo / 12)}y ago`;
	}

	function formatFullUtc(timestampMs: number): string {
		const d = new Date(timestampMs);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
	}

	function escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function safeLinkUrl(url: string): string | null {
		const trimmed = url.trim();
		try {
			const parsed = new URL(trimmed);
			if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return trimmed;
		} catch {
			/* reject */
		}
		return null;
	}

	function mdToHtml(text: string): string {
		if (!text) return '';

		const codeBlocks: string[] = [];
		let src = escapeHtml(text);
		src = src.replace(/```([\s\S]*?)```/g, (_m, code: string) => {
			const idx = codeBlocks.length;
			codeBlocks.push(
				`<pre class="my-2 overflow-x-auto rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-sm"><code>${code}</code></pre>`,
			);
			return `\x00CB${idx}\x00`;
		});

		const lines = src.split('\n');
		const out: string[] = [];
		let i = 0;

		while (i < lines.length) {
			const line = lines[i];

			if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
				out.push('<hr class="my-4 border-gray-300 dark:border-gray-600" />');
				i++;
				continue;
			}

			const heading = line.match(/^(#{1,3})\s+(.+)$/);
			if (heading) {
				const level = heading[1].length;
				const tag = `h${level}`;
				const cls =
					level === 1
						? 'text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-white'
						: level === 2
							? 'text-lg font-semibold mt-3 mb-2 text-gray-900 dark:text-white'
							: 'text-base font-semibold mt-2 mb-1 text-gray-900 dark:text-white';
				out.push(`<${tag} class="${cls}">${inlineMd(heading[2])}</${tag}>`);
				i++;
				continue;
			}

			if (/^&gt;\s?/.test(line)) {
				const quoteLines: string[] = [];
				while (i < lines.length && /^&gt;\s?/.test(lines[i])) {
					quoteLines.push(lines[i].replace(/^&gt;\s?/, ''));
					i++;
				}
				out.push(
					`<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-3 my-2 text-gray-600 dark:text-gray-300 italic">${quoteLines.map((l) => inlineMd(l)).join('<br>')}</blockquote>`,
				);
				continue;
			}

			const ulMatch = line.match(/^[-*]\s+(.+)$/);
			if (ulMatch) {
				const items: string[] = [];
				while (i < lines.length) {
					const m = lines[i].match(/^[-*]\s+(.+)$/);
					if (!m) break;
					items.push(`<li class="ml-4">${inlineMd(m[1])}</li>`);
					i++;
				}
				out.push(`<ul class="list-disc ml-2 my-2 space-y-1">${items.join('')}</ul>`);
				continue;
			}

			const olMatch = line.match(/^\d+\.\s+(.+)$/);
			if (olMatch) {
				const items: string[] = [];
				while (i < lines.length) {
					const m = lines[i].match(/^\d+\.\s+(.+)$/);
					if (!m) break;
					items.push(`<li class="ml-4">${inlineMd(m[1])}</li>`);
					i++;
				}
				out.push(`<ol class="list-decimal ml-2 my-2 space-y-1">${items.join('')}</ol>`);
				continue;
			}

			if (line.trim() === '') {
				i++;
				continue;
			}

			const paraLines: string[] = [];
			while (i < lines.length && lines[i].trim() !== '') {
				const l = lines[i];
				if (
					/^(#{1,3})\s/.test(l) ||
					/^&gt;\s?/.test(l) ||
					/^[-*]\s/.test(l) ||
					/^\d+\.\s/.test(l) ||
					/^---+$/.test(l.trim()) ||
					/^\*\*\*+$/.test(l.trim())
				)
					break;
				paraLines.push(l);
				i++;
			}
			out.push(`<p class="my-2 text-gray-700 dark:text-gray-200">${inlineMd(paraLines.join(' '))}</p>`);
		}

		let html = out.join('\n');
		for (let idx = 0; idx < codeBlocks.length; idx++) {
			const block = codeBlocks[idx];
			html = html.replace(`\x00CB${idx}\x00`, () => block);
		}
		return html;
	}

	function inlineMd(text: string): string {
		return text
			.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
			.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, url: string) => {
				const safe = safeLinkUrl(url);
				if (!safe) return `[${label}](${url})`;
				return `<a href="${safe}" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300" target="_blank" rel="noopener noreferrer nofollow">${label}</a>`;
			});
	}

	async function confirmModal(opts: {
		title: string;
		body: string;
		confirmLabel?: string;
		danger?: boolean;
	}): Promise<boolean> {
		if (typeof ctx.openModal !== 'function') return true;
		try {
			const { actionId } = await ctx.openModal({
				title: opts.title,
				body: opts.body,
				actions: [
					{ id: 'cancel', label: 'Cancel', tone: 'secondary' },
					{
						id: 'confirm',
						label: opts.confirmLabel || 'Confirm',
						tone: opts.danger ? 'danger' : 'primary',
					},
				],
			});
			return actionId === 'confirm';
		} catch {
			return false;
		}
	}

	async function read(name: string, args: Record<string, unknown> = {}) {
		const res = await ctx.read(name, args);
		if (!res.ok) throw new Error(res.error);
		return res;
	}

	async function run(name: string, args: Record<string, unknown>) {
		const res = await ctx.run(name, args);
		if (!res.ok) throw new Error(res.error);
		return res;
	}

	async function pages(name: string, args: Record<string, unknown>, key: string): Promise<any[]> {
		const out: any[] = [];
		let from: number | null = 1;
		while (from) {
			const res = await read(name, { ...args, from, count: 500 });
			out.push(...res[key]);
			from = res.next;
		}
		return out;
	}

	async function sha256(text: string): Promise<string> {
		const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
		return `sha256:${Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')}`;
	}

	/** The ciphertext travels as the document's ``ref``: this realm has no other place to keep it. */
	async function storeDocument(
		department: string,
		title: string,
		ciphertext: string,
		keys: Record<string, string>,
		document?: string,
	): Promise<string> {
		const res = await run('document_store', {
			department,
			title,
			ref: ciphertext,
			hash: await sha256(ciphertext),
			keys,
			...(document ? { document } : {}),
		});
		return res.document;
	}

	/** The document's ``{title, body}``, or null when it was not shared with you. */
	async function decryptDocument(id: string): Promise<{ title?: string; body?: string } | null> {
		const { document, wrapped_dek } = await read('document_get', { document: id });
		return ctx.crypto.decryptWithEnvelope(wrapped_dek, document.ref);
	}

	function docMeta(doc: any, department: string, can_manage: boolean): DocMeta {
		return {
			id: doc.id,
			title: doc.title,
			department,
			scope: `dept:${department}:doc:${doc.id}`,
			created_by: doc.author,
			created_at: new Date(doc.at * 1000).toISOString(),
			can_manage,
		};
	}

	async function loadDirectory() {
		try {
			const users = await pages('user_list', {}, 'users');
			directoryLabels = new Map(users.filter((u) => u.nickname).map((u) => [u.id, u.nickname]));
		} catch {
			/* degrade silently */
		}
	}

	/** Departments where you hold a seat or are the head, with their members (who documents are shared with). */
	async function loadDepartments(manager: boolean): Promise<DeptInfo[]> {
		const list = await pages('department_list', {}, 'departments');
		const details = await Promise.all(list.map((d) => read('department_get', { department: d.id })));
		return details
			.map(({ department, positions }) => ({
				name: department.id,
				description: department.description,
				can_manage: manager,
				members: [
					...new Set(
						[department.head, ...positions.flatMap((p: any) => p.holders.map((h: any) => h.user))].filter(
							Boolean,
						),
					),
				] as string[],
			}))
			.filter((d) => d.members.includes(me));
	}

	/** Staff with document.manage list their departments' documents; others see the ones shared with them. */
	async function loadDocuments(manager: boolean): Promise<DocMeta[]> {
		if (manager) {
			const lists = await Promise.all(
				departments.map(async (d) =>
					(await pages('document_list', { department: d.name }, 'documents')).map((doc) =>
						docMeta(doc, d.name, true),
					),
				),
			);
			return lists.flat();
		}
		const mine = new Set(departments.map((d) => d.name));
		const shared = (await pages('crypto_scopes', {}, 'scopes'))
			.map((scope: string) => scope.match(/^dept:(.+):doc:(.+)$/))
			.filter((m): m is RegExpMatchArray => !!m && mine.has(m[1]));
		return Promise.all(
			shared.map(async ([, department, id]) =>
				docMeta((await read('document_get', { document: id })).document, department, false),
			),
		);
	}

	async function loadAll() {
		loading = true;
		error = '';
		try {
			const { permissions } = await read('me');
			const manager = permissions.includes('all') || permissions.includes('document.manage');
			departments = await loadDepartments(manager);
			if (!selectedDept && departments.length) selectedDept = departments[0].name;
			documents = await loadDocuments(manager);
		} catch (e: any) {
			error = String(e?.message ?? e);
		} finally {
			loading = false;
		}
	}

	function initReshareDocProgress(dept: string) {
		const docs = documents.filter((d) => d.department === dept);
		reshareDocProgress = docs.map((doc) => ({
			doc,
			status: reshareCompletedDocIds.has(doc.id) ? ('done' as const) : ('pending' as const),
		}));
	}

	function openManualReshareDialog() {
		const dept = selectedDept;
		if (!dept) return;
		const deptInfo = departments.find((d) => d.name === dept);
		if (!deptInfo?.can_manage) return;

		reshareTargetDept = dept;
		reshareCancelled = false;
		reshareRunning = false;
		reshareCompletedDocIds = new Set();
		initReshareDocProgress(dept);
		reshareDialogOpen = true;
	}

	function closeReshareDialog() {
		if (reshareRunning) return;
		reshareDialogOpen = false;
		reshareDocProgress = [];
		reshareCompletedDocIds = new Set();
		reshareCancelled = false;
	}

	function cancelResharing() {
		reshareCancelled = true;
	}

	function restartResharing() {
		reshareCompletedDocIds = new Set();
		reshareCancelled = false;
		initReshareDocProgress(reshareTargetDept);
	}

	function buildReshareRecipients(): string[] {
		const members = reshareDialogDept?.members ?? [];
		return Array.from(new Set([...members, me].filter(Boolean)));
	}

	function updateDocProgress(docId: string, patch: Partial<DocReshareProgress>) {
		reshareDocProgress = reshareDocProgress.map((p) =>
			p.doc.id === docId ? { ...p, ...patch } : p,
		);
	}

	async function reshareSingleDocument(
		progress: DocReshareProgress,
		recipients: string[],
	): Promise<void> {
		const { doc } = progress;
		updateDocProgress(doc.id, { status: 'in_progress', error: undefined });

		try {
			const plaintext = await decryptDocument(doc.id);
			if (!plaintext) {
				updateDocProgress(doc.id, {
					status: 'failed',
					error: 'You do not have a decryption key for this document.',
				});
				return;
			}

			const { ciphertext, wrappedDeks } = await ctx.crypto.encryptForRecipients(recipients, plaintext);
			await storeDocument(doc.department, doc.title, ciphertext, wrappedDeks, doc.id);

			updateDocProgress(doc.id, { status: 'done' });
			reshareCompletedDocIds = new Set([...reshareCompletedDocIds, doc.id]);
		} catch (e: any) {
			updateDocProgress(doc.id, { status: 'failed', error: String(e?.message ?? e) });
		}
	}

	async function startResharing() {
		if (reshareRunning || !reshareTargetDept) return;
		reshareRunning = true;
		reshareCancelled = false;

		const recipients = buildReshareRecipients();

		try {
			for (const progress of reshareDocProgress) {
				if (reshareCancelled) break;
				if (
					progress.status === 'done' ||
					progress.status === 'skipped' ||
					reshareCompletedDocIds.has(progress.doc.id)
				) {
					continue;
				}
				await reshareSingleDocument(progress, recipients);
			}

			const allProcessed = reshareDocProgress.every(
				(p) =>
					p.status === 'done' ||
					p.status === 'skipped' ||
					p.status === 'failed' ||
					reshareCompletedDocIds.has(p.doc.id),
			);

			if (!reshareCancelled && allProcessed) {
				await loadAll();
				reshareDialogOpen = false;
				reshareDocProgress = [];
				reshareCompletedDocIds = new Set();
				ctx.notify?.('success', 'Department documents re-shared with all members.');
			}
		} catch (e: any) {
			ctx.notify?.('error', String(e?.message ?? e));
		} finally {
			reshareRunning = false;
		}
	}

	function resumeResharing() {
		reshareCancelled = false;
		startResharing();
	}

	function reshareStatusLabel(status: DocReshareStatus): string {
		switch (status) {
			case 'pending':
				return 'Pending';
			case 'in_progress':
				return 'In progress';
			case 'done':
				return 'Done';
			case 'skipped':
				return 'Skipped (empty)';
			case 'failed':
				return 'Failed';
		}
	}

	async function confirmDiscardDraft(): Promise<boolean> {
		if (!hasDraft) return true;
		return confirmModal({
			title: 'Discard draft?',
			body: 'You have unsaved changes. Discard them?',
			confirmLabel: 'Discard',
			danger: true,
		});
	}

	async function selectDepartment(name: string, selectEl: HTMLSelectElement) {
		if (name === selectedDept) return;
		if (!(await confirmDiscardDraft())) {
			selectEl.value = selectedDept;
			await tick();
			selectEl.value = selectedDept;
			return;
		}
		selectedDept = name;
		composerMode = null;
		editingDocId = null;
		clearComposerForm();
		saveError = '';
		openDoc = null;
		openContent = null;
		openState = 'idle';
		searchQuery = '';
	}

	async function openDocument(doc: DocMeta) {
		if (openDoc?.id === doc.id && openState === 'ready') return;
		if (!(await confirmDiscardDraft())) return;
		composerMode = null;
		editingDocId = null;
		clearComposerForm();
		saveError = '';
		openMenuKey = null;

		openDoc = doc;
		openContent = null;
		openError = '';
		openState = 'loading';
		try {
			const decrypted = await decryptDocument(doc.id);
			if (!decrypted) {
				openState = 'no_access';
				return;
			}
			openContent = { title: decrypted.title ?? doc.title, body: decrypted.body ?? '' };
			openState = 'ready';
		} catch (e: any) {
			openError = String(e?.message ?? e);
			openState = 'error';
		}
	}

	function startCompose() {
		confirmDiscardDraft().then((ok) => {
			if (!ok) return;
			composerMode = 'create';
			editingDocId = null;
			clearComposerForm();
			saveError = '';
			openDoc = null;
			openContent = null;
			openState = 'idle';
			openMenuKey = null;
		});
	}

	async function startEdit(doc: DocMeta) {
		openMenuKey = null;
		if (!(await confirmDiscardDraft())) return;

		openDoc = doc;
		openContent = null;
		openError = '';
		openState = 'loading';
		composerMode = null;

		try {
			const decrypted = await decryptDocument(doc.id);
			if (!decrypted) {
				ctx.notify?.('error', 'Cannot edit: you do not have a decryption key for this document.');
				openState = 'no_access';
				return;
			}
			composerMode = 'edit';
			editingDocId = doc.id;
			seedComposerForm(decrypted.title ?? doc.title, decrypted.body ?? '');
			saveError = '';
			openState = 'idle';
		} catch (e: any) {
			openError = String(e?.message ?? e);
			openState = 'error';
		}
	}

	async function cancelCompose() {
		if (!(await confirmDiscardDraft())) return;
		const doc = openDoc;
		composerMode = null;
		editingDocId = null;
		clearComposerForm();
		saveError = '';
		if (doc) await openDocument(doc);
	}

	async function backToList() {
		if (!(await confirmDiscardDraft())) return;
		composerMode = null;
		editingDocId = null;
		clearComposerForm();
		saveError = '';
		openDoc = null;
		openContent = null;
		openState = 'idle';
		openMenuKey = null;
	}

	async function saveDocument() {
		if (!selectedDept) return;
		if (!formTitle.trim()) {
			saveError = 'Title is required';
			return;
		}
		saving = true;
		saveError = '';
		try {
			const recipients = Array.from(
				new Set([...(currentDept?.members ?? []), me].filter(Boolean)),
			);
			const payload = { title: formTitle.trim(), body: formBody };
			const { ciphertext, wrappedDeks } = await ctx.crypto.encryptForRecipients(recipients, payload);

			if (composerMode === 'create') {
				const id = await storeDocument(selectedDept, formTitle.trim(), ciphertext, wrappedDeks);

				composerMode = null;
				clearComposerForm();
				await loadAll();
				const newDoc = documents.find((d) => d.id === id);
				if (newDoc) await openDocument(newDoc);
				ctx.notify?.('success', 'Document created and shared.');
			} else if (composerMode === 'edit' && editingDocId) {
				const doc = documents.find((d) => d.id === editingDocId) ?? openDoc;
				if (!doc) throw new Error('Document not found');

				await storeDocument(doc.department, formTitle.trim(), ciphertext, wrappedDeks, doc.id);

				const savedTitle = formTitle.trim();
				const savedBody = formBody;
				composerMode = null;
				editingDocId = null;
				clearComposerForm();
				await loadAll();
				const updated = documents.find((d) => d.id === doc.id);
				if (updated) {
					openDoc = updated;
					openContent = { title: savedTitle, body: savedBody };
					openState = 'ready';
				}
				ctx.notify?.('success', 'Document updated.');
			}
		} catch (e: any) {
			saveError = String(e?.message ?? e);
		} finally {
			saving = false;
		}
	}

	async function deleteDocument(doc: DocMeta) {
		openMenuKey = null;
		const ok = await confirmModal({
			title: 'Delete document?',
			body: `Delete "${doc.title}"? This cannot be undone.`,
			confirmLabel: 'Delete',
			danger: true,
		});
		if (!ok) return;
		try {
			let deleted = false;
			while (!deleted) deleted = (await run('document_delete', { document: doc.id })).deleted;
			if (openDoc?.id === doc.id) {
				openDoc = null;
				openContent = null;
				openState = 'idle';
			}
			if (editingDocId === doc.id) {
				composerMode = null;
				editingDocId = null;
				clearComposerForm();
			}
			await loadAll();
			ctx.notify?.('success', 'Document deleted.');
		} catch (e: any) {
			ctx.notify?.('error', String(e?.message ?? e));
		}
	}

	function handleMenuKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') openMenuKey = null;
	}

	function toggleDocMenu(docId: string, e: MouseEvent) {
		e.stopPropagation();
		if (openMenuKey === docId) {
			openMenuKey = null;
			return;
		}
		const btn = e.currentTarget as HTMLButtonElement;
		const list = docListEl;
		if (list) {
			const listRect = list.getBoundingClientRect();
			const btnRect = btn.getBoundingClientRect();
			const spaceBelow = listRect.bottom - btnRect.bottom;
			menuOpenUp = spaceBelow < 72;
		} else {
			menuOpenUp = false;
		}
		openMenuKey = docId;
	}

	loadDirectory();
	loadAll();
	unsubNarrow = subscribeNarrowViewport((value) => {
		narrow = value;
	});
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
		border: none;
		background: #2563eb;
		color: #fff;
		cursor: pointer;
		flex-shrink: 0;
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

<svelte:window onclick={() => (openMenuKey = null)} onkeydown={handleMenuKeydown} />

<div class="p-3 sm:p-4 space-y-4">
	<div class="flex flex-col gap-2">
		<div>
			<h1 class="text-xl font-semibold text-gray-900 dark:text-white">Department Documents</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">{extensionDescription}</p>
		</div>
		{#if canManageSelected}
			<button
				class="chrome-btn self-start"
				onclick={startCompose}
				title="New document"
				aria-label="New document"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				<span class="chrome-label">New document</span>
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<div class="lg:col-span-1 space-y-2">
				{#each Array(4) as _, i (i)}
					<div class="animate-pulse rounded-lg border border-gray-200 dark:border-gray-700 p-3">
						<div class="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-2"></div>
						<div class="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800"></div>
					</div>
				{/each}
			</div>
			<div class="lg:col-span-2 min-h-[50vh] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
				<div class="animate-pulse space-y-3">
					<div class="h-6 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
					<div class="h-3 w-full rounded bg-gray-100 dark:bg-gray-800"></div>
					<div class="h-3 w-5/6 rounded bg-gray-100 dark:bg-gray-800"></div>
					<div class="h-3 w-4/6 rounded bg-gray-100 dark:bg-gray-800"></div>
				</div>
			</div>
		</div>
	{:else if error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
			{error}
		</div>
	{:else if departments.length === 0}
		<p class="text-gray-500 dark:text-gray-400">You are not a member of any department yet.</p>
	{:else}
		<div class="flex flex-wrap items-center gap-2">
			<select
				class="border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:rounded-lg"
				value={selectedDept}
				onchange={(e) => {
					const el = e.currentTarget as HTMLSelectElement;
					selectDepartment(el.value, el);
				}}
			>
				{#each departments as d (d.name)}
					<option value={d.name}>{d.name} ({deptDocCount(d.name)})</option>
				{/each}
			</select>
			{#if currentDept?.can_manage}
				<span
					class="hidden sm:inline text-xs text-gray-500 dark:text-gray-400"
				>
					You manage this department
				</span>
				<button
					type="button"
					class="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 sm:rounded-lg"
					onclick={openManualReshareDialog}
				>
					Re-share
				</button>
			{/if}
		</div>
		{#if currentDept?.description}
			<p class="text-xs text-gray-500 dark:text-gray-400">{currentDept.description}</p>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<div class="lg:col-span-1" class:hidden={narrow && !!(openDoc || composerMode)}>
				<div class="relative mb-3">
					<svg
						class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<circle cx="11" cy="11" r="7" />
						<path d="M20 20l-3-3" stroke-linecap="round" />
					</svg>
					<input
						class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
						placeholder="Search documents…"
						bind:value={searchQuery}
					/>
					{#if searchQuery}
						<button
							type="button"
							class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
							aria-label="Clear search"
							onclick={() => (searchQuery = '')}
						>
							×
						</button>
					{/if}
				</div>

				{#if filteredDocs.length === 0}
					{#if searchQuery.trim()}
						<div class="py-6 text-center">
							<p class="text-sm text-gray-500 dark:text-gray-400">No documents match your search.</p>
							<button
								class="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
								onclick={() => (searchQuery = '')}
							>
								Clear search
							</button>
						</div>
					{:else}
						<p class="text-sm text-gray-500 dark:text-gray-400">
							This department has no documents yet.
						</p>
					{/if}
				{:else}
					<ul
						bind:this={docListEl}
						class="space-y-1 max-h-[70vh] overflow-y-auto pr-1"
					>
						{#each filteredDocs as doc (doc.id)}
							{@const ts = parseCreatedAt(doc.created_at)}
							<li class="group relative flex items-stretch">
								<button
									type="button"
									class={cn(
										'flex-1 min-w-0 border-b px-3 py-2 text-left transition-colors sm:rounded-lg sm:border',
										openDoc?.id === doc.id
											? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30'
											: 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 sm:border-transparent',
									)}
									aria-current={openDoc?.id === doc.id ? 'true' : undefined}
									onclick={() => openDocument(doc)}
								>
									<div class="truncate text-sm font-medium text-gray-900 dark:text-white">
										{doc.title}
									</div>
									<div class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
										{#if doc.created_by === me}
											You
										{:else if directoryLabels.has(doc.created_by)}
											{directoryLabels.get(doc.created_by)}
										{:else}
											<span class="font-mono">{truncatePrincipal(doc.created_by)}</span>
										{/if}
										{#if ts !== null}
											<span class="mx-1">·</span>
											<time datetime={doc.created_at} title={formatFullUtc(ts)}>
												{formatRelativeTime(ts)}
											</time>
										{/if}
									</div>
								</button>
								{#if doc.can_manage}
									<div
										class={cn(
											'relative flex items-center pr-1 transition-opacity',
											openDoc?.id === doc.id
												? 'opacity-100'
												: 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100',
										)}
									>
										<button
											type="button"
											class="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
											aria-label="More actions"
											aria-haspopup="menu"
											aria-expanded={openMenuKey === doc.id}
											onclick={(e) => toggleDocMenu(doc.id, e)}
										>
											⋯
										</button>
										{#if openMenuKey === doc.id}
											<div
												role="menu"
												tabindex="-1"
												class={cn(
													'absolute right-0 z-20 min-w-[120px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800',
													menuOpenUp ? 'bottom-full mb-1' : 'top-full mt-1',
												)}
												onmousedown={(e) => e.stopPropagation()}
											>
												<button
													type="button"
													role="menuitem"
													class="block w-full px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
													onclick={() => startEdit(doc)}
												>
													Edit…
												</button>
												<button
													type="button"
													role="menuitem"
													class="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
													onclick={() => deleteDocument(doc)}
												>
													Delete…
												</button>
											</div>
										{/if}
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<div class="lg:col-span-2 min-h-[50vh]" class:hidden={narrow && !openDoc && !composerMode}>
				<div
					class="flex min-h-[50vh] flex-col border-y border-gray-200 dark:border-gray-700 sm:rounded-lg sm:border"
				>
					{#if narrow && (openDoc || composerMode)}
						<div class="flex items-center border-b border-gray-200 px-3 py-2 dark:border-gray-700">
							<button
								type="button"
								class="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400"
								onclick={backToList}
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
								</svg>
								Documents
							</button>
						</div>
					{/if}
					{#if composerMode}
						<div class="flex flex-1 flex-col p-4">
							<h2 class="mb-2 font-semibold text-gray-900 dark:text-white">
								{composerMode === 'create'
									? `New document in ${selectedDept}`
									: 'Edit document'}
							</h2>
							<input
								class="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								placeholder="Title"
								bind:value={formTitle}
							/>
							<textarea
								class="mb-2 min-h-[200px] flex-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								placeholder="Document body (encrypted before it leaves your browser). Markdown supported."
								bind:value={formBody}
							></textarea>
							{#if saveError}
								<p class="mb-2 text-sm text-red-600 dark:text-red-400">{saveError}</p>
							{/if}
							<div class="flex gap-2">
								<button
									class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
									onclick={saveDocument}
									disabled={saving}
								>
									{#if saving}
										<svg
											class="h-4 w-4 animate-spin"
											viewBox="0 0 24 24"
											fill="none"
											aria-hidden="true"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											/>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
											/>
										</svg>
										Encrypting…
									{:else}
										{composerMode === 'create' ? 'Encrypt & share' : 'Save changes'}
									{/if}
								</button>
								<button
									class="rounded-lg px-3 py-2 text-sm text-gray-600 hover:underline dark:text-gray-400"
									onclick={cancelCompose}
								>
									Cancel
								</button>
							</div>
							<p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
								{memberShareHint}
							</p>
						</div>
					{:else if openDoc}
						{#if openDoc.can_manage}
							<div
								class="flex items-center justify-end border-b border-gray-200 px-4 py-2 dark:border-gray-700"
							>
								<button
									type="button"
									class="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
									onclick={() => startEdit(openDoc!)}
								>
									Edit
								</button>
							</div>
						{/if}
						<div class="flex flex-1 flex-col p-4">
							{#if openState === 'loading'}
								<div class="animate-pulse space-y-3">
									<div class="h-6 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
									<div class="h-3 w-full rounded bg-gray-100 dark:bg-gray-800"></div>
									<div class="h-3 w-5/6 rounded bg-gray-100 dark:bg-gray-800"></div>
									<div class="h-3 w-4/6 rounded bg-gray-100 dark:bg-gray-800"></div>
									<div class="h-3 w-3/4 rounded bg-gray-100 dark:bg-gray-800"></div>
								</div>
							{:else if openState === 'no_access'}
								<div
									class="flex flex-1 flex-col items-center justify-center gap-3 text-center text-amber-700 dark:text-amber-300"
								>
									<svg
										class="h-10 w-10 opacity-60"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										aria-hidden="true"
									>
										<rect x="5" y="11" width="14" height="10" rx="2" />
										<path d="M8 11V7a4 4 0 118 0v4" stroke-linecap="round" />
									</svg>
									<p class="text-sm">
										This document is encrypted and you don't have a key for it.
									</p>
								</div>
							{:else if openState === 'error'}
								<div
									class="flex flex-1 flex-col items-center justify-center gap-3 text-center text-red-600 dark:text-red-400"
								>
									<svg
										class="h-10 w-10 opacity-60"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										aria-hidden="true"
									>
										<circle cx="12" cy="12" r="9" />
										<path d="M12 8v5M12 16h.01" stroke-linecap="round" />
									</svg>
									<p class="text-sm">{openError}</p>
								</div>
							{:else if openState === 'ready' && openContent}
								<h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
									{openContent.title}
								</h2>
								<div class="text-sm leading-relaxed">
									{@html mdToHtml(openContent.body)}
								</div>
							{/if}
						</div>
					{:else}
						<div
							class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-gray-400 dark:text-gray-500"
						>
							<svg
								class="h-12 w-12 opacity-50"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								aria-hidden="true"
							>
								<path
									d="M7 4h10a2 2 0 012 2v14l-5-3-5 3V6a2 2 0 012-2z"
									stroke-linejoin="round"
								/>
							</svg>
							<p class="text-sm">Select a document to view, or create a new one.</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if reshareDialogOpen}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			role="presentation"
			onclick={(e) => {
				if (e.target === e.currentTarget && !reshareRunning) closeReshareDialog();
			}}
		>
			<div
				class="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
				role="dialog"
				aria-modal="true"
				aria-labelledby="reshare-dialog-title"
			>
				<div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
					<h2 id="reshare-dialog-title" class="text-lg font-semibold text-gray-900 dark:text-white">
						Re-share documents in {reshareTargetDept}
					</h2>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Re-encrypt all documents for current department members.
					</p>
				</div>

				<div class="flex-1 overflow-y-auto px-4 py-3">
					{#if reshareDocProgress.length === 0}
						<p class="text-sm text-gray-500 dark:text-gray-400">
							This department has no documents to re-share.
						</p>
					{:else}
						{#if reshareRunning || reshareAllFinished || reshareCancelled}
							<div class="mb-4">
								<div class="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
									<span>Progress</span>
									<span>
										{reshareProgressCounts.done} / {reshareProgressCounts.total} documents
										{#if reshareProgressCounts.failed}
											<span class="text-red-600 dark:text-red-400">
												({reshareProgressCounts.failed} failed)
											</span>
										{/if}
									</span>
								</div>
								<div
									class="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
									role="progressbar"
									aria-valuenow={reshareProgressCounts.done}
									aria-valuemin={0}
									aria-valuemax={reshareProgressCounts.total}
								>
									<div
										class="h-full rounded-full bg-blue-600 transition-all dark:bg-blue-500"
										style="width: {reshareProgressCounts.total
											? (reshareProgressCounts.done / reshareProgressCounts.total) * 100
											: 0}%"
									></div>
								</div>
							</div>
						{/if}

						<ul class="space-y-2">
							{#each reshareDocProgress as item (item.doc.id)}
								<li
									class="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
								>
									<div class="flex items-start justify-between gap-2">
										<div class="min-w-0 flex-1">
											<div class="truncate text-sm font-medium text-gray-900 dark:text-white">
												{item.doc.title}
											</div>
											<div class="truncate font-mono text-xs text-gray-400 dark:text-gray-500">
												{item.doc.id}
											</div>
										</div>
										<span
											class={cn(
												'shrink-0 text-xs font-medium',
												item.status === 'done' || item.status === 'skipped'
													? 'text-green-600 dark:text-green-400'
													: item.status === 'failed'
														? 'text-red-600 dark:text-red-400'
														: item.status === 'in_progress'
															? 'text-blue-600 dark:text-blue-400'
															: 'text-gray-500 dark:text-gray-400',
											)}
										>
											{reshareStatusLabel(item.status)}
										</span>
									</div>
									{#if item.error}
										<p class="mt-1 text-xs text-red-600 dark:text-red-400">{item.error}</p>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				<div
					class="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700"
				>
					{#if reshareRunning}
						<button
							type="button"
							class="rounded-lg px-3 py-2 text-sm text-gray-600 hover:underline dark:text-gray-400"
							onclick={cancelResharing}
						>
							Cancel
						</button>
					{:else if reshareCancelled && !reshareAllFinished}
						<button
							type="button"
							class="rounded-lg px-3 py-2 text-sm text-gray-600 hover:underline dark:text-gray-400"
							onclick={restartResharing}
						>
							Restart
						</button>
						<button
							type="button"
							class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
							onclick={resumeResharing}
						>
							Resume
						</button>
					{:else if !reshareAllFinished}
						<button
							type="button"
							class="rounded-lg px-3 py-2 text-sm text-gray-600 hover:underline dark:text-gray-400"
							onclick={closeReshareDialog}
						>
							Close
						</button>
						<button
							type="button"
							class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
							disabled={reshareDocProgress.length === 0}
							onclick={startResharing}
						>
							Start re-sharing
						</button>
					{:else}
						<button
							type="button"
							class="rounded-lg px-3 py-2 text-sm text-gray-600 hover:underline dark:text-gray-400"
							onclick={closeReshareDialog}
						>
							Close
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
