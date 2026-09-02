<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount, onDestroy } from 'svelte';
	import MonacoPane from './MonacoPane.svelte';
	import FederalVotes from './FederalVotes.svelte';
	import {
		isNarrowViewport,
		persistSessionFlag,
		readSessionFlag,
	} from '../../../_shared/frontend/mobile-chrome';
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

	const EXTENSION_ID = 'voting';

	type View = 'list' | 'form' | 'detail' | 'federal';
	type ProposalType = 'transaction' | 'upgrade' | 'poll' | 'code_execution';
	type UpgradeTarget = 'codex' | 'extension' | 'core';

	function buildProposalTypeOptions(): { value: ProposalType | ''; label: string }[] {
		void i18nTick;
		return [
			{ value: '', label: t('filter_all_types') },
			{ value: 'transaction', label: t('type_transaction') },
			{ value: 'upgrade', label: t('type_upgrade') },
			{ value: 'poll', label: t('type_poll') },
			{ value: 'code_execution', label: t('type_code_execution') },
		];
	}

	function buildFormTypeOptions(): { value: ProposalType; label: string; subtitle: string }[] {
		void i18nTick;
		return [
			{
				value: 'transaction',
				label: t('type_transaction'),
				subtitle: t('form_subtitle_transaction'),
			},
			{
				value: 'upgrade',
				label: t('type_upgrade'),
				subtitle: t('form_subtitle_upgrade'),
			},
			{
				value: 'poll',
				label: t('type_poll'),
				subtitle: t('form_subtitle_poll'),
			},
			{
				value: 'code_execution',
				label: t('type_code_execution'),
				subtitle: t('form_subtitle_code_execution'),
			},
		];
	}

	let proposalTypeOptions = $derived(buildProposalTypeOptions());
	let formTypeOptions = $derived(buildFormTypeOptions());

	function getExtensionBasePath(): string {
		if (typeof window === 'undefined') return '/extensions/voting';
		const match = window.location.pathname.match(/^(.*\/extensions\/[^/]+)/);
		return match ? match[1] : window.location.pathname;
	}

	function parseProposalIdFromUrl(): string | null {
		if (typeof window === 'undefined') return null;
		const params = new URLSearchParams(window.location.search);
		const queryId = params.get('proposal') ?? params.get('p');
		if (queryId) return decodeURIComponent(queryId);

		const base = getExtensionBasePath();
		const rest = window.location.pathname.slice(base.length).replace(/^\//, '');
		if (!rest) return null;
		const proposalsMatch = rest.match(/^proposals\/(.+)$/);
		if (proposalsMatch) return decodeURIComponent(proposalsMatch[1]);
		if (rest.startsWith('p=')) {
			return decodeURIComponent(rest.slice('p='.length));
		}
		if (rest.startsWith('proposal=')) {
			return decodeURIComponent(rest.slice('proposal='.length));
		}
		if (rest.startsWith('proposal/')) {
			return decodeURIComponent(rest.slice('proposal/'.length));
		}
		return null;
	}

	function resolveProposalId(slug: string): string {
		if (/^prop_/i.test(slug)) return slug;
		if (/^\d+$/.test(slug)) {
			const num = parseInt(slug, 10);
			const padded = `prop_${String(num).padStart(3, '0')}`;
			const hit = proposals.find(
				(p) => p.entity_id === num || p.id === padded || p.id === slug,
			);
			if (hit?.id) return hit.id;
			return padded;
		}
		return slug;
	}

	function proposalLinkSlug(proposal: any): string {
		const entityId = Number(proposal?.entity_id);
		if (Number.isFinite(entityId) && entityId > 0) return String(entityId);
		const match = String(proposal?.id ?? '').match(/^prop_(\d+)$/i);
		if (match) return String(parseInt(match[1], 10));
		return String(proposal?.id ?? '');
	}

	function proposalDisplayId(proposal: any): string {
		const entityId = Number(proposal?.entity_id);
		if (Number.isFinite(entityId) && entityId > 0) return `#${entityId}`;
		const match = String(proposal?.id ?? '').match(/^prop_(\d+)$/i);
		if (match) return `#${parseInt(match[1], 10)}`;
		const id = String(proposal?.id ?? '').trim();
		return id || '—';
	}

	const initialProposalId =
		typeof window !== 'undefined' ? parseProposalIdFromUrl() : null;

	let proposals: any[] = $state([]);
	let listLoading = $state(!initialProposalId);
	let listLoadingMore = $state(false);
	let listHasMore = $state(false);
	let listNextFromId = $state(1);
	let orgFilter = $state('');
	let statusFilter = $state('');
	let typeFilter = $state('');
	let sortBy = $state('newest');
	const FILTERS_KEY = 'voting-filters-open';
	let filtersOpen = $state(readSessionFlag(FILTERS_KEY) ?? !isNarrowViewport());
	let orgOptions: string[] = $state([]);
	const STATUS_OPTIONS = [
		'voting',
		'pending_vote',
		'approved',
		'executed',
		'rejected',
		'failed',
		'no_quorum',
	];
	const SORT_OPTIONS = [
		{ value: 'newest', label: 'Most recent' },
		{ value: 'oldest', label: 'Oldest first' },
		{ value: 'active_first', label: 'Active first' },
		{ value: 'title', label: 'Title A–Z' },
	];
	const LIST_FETCH_SIZE = 30;
	let error = $state('');
	let accessDeniedOp = $state('');
	let view: View = $state(initialProposalId ? 'detail' : 'list');

	let formTitle = $state('');
	let formDescription = $state('');
	let formProposalType = $state<ProposalType>('poll');
	let formOrgScope = $state('');
	let formToken = $state('');
	let formToPrincipal = $state('');
	let formAmount = $state('');
	let formUpgradeTarget = $state<UpgradeTarget>('extension');
	let formPackageId = $state('');
	let formVersion = $state('');
	let formActionId = $state('');
	let formCoreDecision = $state<'approve' | 'reject'>('approve');
	let formSource = $state('');
	let formSourceUrl = $state('');
	let formRequestedPermissions = $state<string[]>([]);
	let codeFetching = $state(false);
	let submitContext: { baton_configured?: boolean; registry_canister_id?: string } | null = $state(null);
	let bridgeVerbs: string[] = $state([]);
	let vaultTokens: { name: string; symbol: string; decimals: number }[] = $state([]);
	let vaultBalance: string | null = $state(null);
	let submitting = $state(false);
	let submitMsg = $state('');

	let selectedProposal: any = $state(null);
	let detailLoading = $state(!!initialProposalId);
	let codeContent = $state('');
	let codeChecksum = $state('');
	let codeLoading = $state(false);
	let codeError = $state('');
	let votingInProgress = $state('');

	let votingSettings: { voting_window_seconds: number; voting_window_days: number } | null = $state(null);
	let linkCopied = $state(false);

	let nowMs = $state(Date.now());
	let countdownTimer: ReturnType<typeof setInterval> | undefined;

	let currentPage = $state(1);
	const pageSize = 10;

	function isProposalEnded(proposal: any, now = Date.now()): boolean {
		const status = (proposal?.status || '').toLowerCase();
		const endedStatuses = ['executed', 'rejected', 'failed', 'no_quorum', 'approved'];
		if (endedStatuses.includes(status)) return true;
		if (status === 'voting' && proposal.voting_deadline) {
			const epoch = parseEpochSeconds(proposal.voting_deadline);
			if (epoch != null && epoch * 1000 <= now) return true;
		}
		return false;
	}

	function proposalSortKey(proposal: any): number {
		const created = parseEpochSeconds(proposal?.created_at);
		if (created != null && created > 0) return created;
		const entityId = Number(proposal?.entity_id);
		if (Number.isFinite(entityId) && entityId > 0) return entityId;
		const id = String(proposal?.id ?? proposal?._id ?? '');
		const propMatch = id.match(/^prop_(\d+)$/i);
		if (propMatch) return Number(propMatch[1]);
		const numeric = parseInt(id, 10);
		if (Number.isFinite(numeric) && numeric > 0) return numeric;
		return 0;
	}

	let sortedProposals = $derived(
		[...proposals].sort((a, b) => {
			switch (sortBy) {
				case 'oldest':
					return proposalSortKey(a) - proposalSortKey(b);
				case 'active_first': {
					const aEnded = isProposalEnded(a, nowMs) ? 1 : 0;
					const bEnded = isProposalEnded(b, nowMs) ? 1 : 0;
					if (aEnded !== bEnded) return aEnded - bEnded;
					return proposalSortKey(b) - proposalSortKey(a);
				}
				case 'title':
					return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
				case 'newest':
				default:
					return proposalSortKey(b) - proposalSortKey(a);
			}
		}),
	);
	let totalPages = $derived(Math.max(1, Math.ceil(sortedProposals.length / pageSize)));
	let pagedProposals = $derived(
		sortedProposals.slice((currentPage - 1) * pageSize, currentPage * pageSize),
	);

	let selectedProposalType = $derived(
		selectedProposal ? getProposalType(selectedProposal) : '',
	);
	let selectedProposalAction = $derived(
		selectedProposal ? parseProposalAction(selectedProposal) : {},
	);
	let selectedProposalPermissions = $derived(
		selectedProposal ? parseProposalPermissions(selectedProposal) : [],
	);
	let formSubtitle = $derived.by(() => {
		void i18nTick;
		return t(`form_subtitle_${formProposalType}`);
	});
	let showCoreUpgrade = $derived(!!submitContext?.baton_configured);

	function parseProposalMetadata(proposal: any): Record<string, any> {
		try {
			const meta = proposal?.metadata;
			if (typeof meta === 'string') return JSON.parse(meta);
			return meta && typeof meta === 'object' ? meta : {};
		} catch {
			return {};
		}
	}

	function getProposalType(proposal: any): string {
		const direct = String(proposal?.proposal_type || '').trim();
		if (direct) return direct;
		return String(parseProposalMetadata(proposal).proposal_type || '').trim();
	}

	function parseProposalAction(proposal: any): Record<string, any> {
		const meta = parseProposalMetadata(proposal);
		const action = meta.action;
		return action && typeof action === 'object' ? action : {};
	}

	function parseProposalPermissions(proposal: any): string[] {
		const meta = parseProposalMetadata(proposal);
		const perms = meta.requested_permissions;
		return Array.isArray(perms) ? perms.map(String) : [];
	}

	function proposalTypeLabel(type: string): string {
		if (!type) return 'Unknown';
		return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function proposalTypeColor(type: string): string {
		switch (type) {
			case 'transaction':
				return 'bg-blue-100 text-blue-800';
			case 'upgrade':
				return 'bg-purple-100 text-purple-800';
			case 'poll':
				return 'bg-sky-100 text-sky-800';
			case 'code_execution':
				return 'bg-amber-100 text-amber-800';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	function isValidUrl(s: string): boolean {
		try {
			new URL(s);
			return true;
		} catch {
			return false;
		}
	}

	function isPinnedSemver(v: string): boolean {
		const s = v.trim();
		if (!s || s.toLowerCase() === 'latest') return false;
		return /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(s);
	}

	function isValidBaseAmount(s: string): boolean {
		return /^[1-9][0-9]*$/.test(s.trim());
	}

	function formatTokenBalance(raw: number | string | null | undefined, decimals: number): string {
		const n = Number(raw);
		if (!Number.isFinite(n)) return '—';
		return (n / Math.pow(10, decimals)).toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: Math.min(decimals, 8),
		});
	}

	async function vaultSyncCall(fn: string, args: Record<string, any> = {}) {
		const raw = await ctx.backend.extension_sync_call('vault', fn, JSON.stringify(args));
		const envelope = typeof raw === 'string' ? JSON.parse(raw) : raw;
		const inner = envelope?.response ?? envelope;
		return typeof inner === 'string' ? JSON.parse(inner) : inner;
	}

	async function loadSubmitContext() {
		try {
			const res = await callSync('get_submit_context');
			if (res?.success && res.data) submitContext = res.data;
			else submitContext = res?.data ?? null;
		} catch {
			submitContext = null;
		}
	}

	async function loadBridgeVerbs() {
		try {
			const res = await callSync('get_bridge_verbs');
			const verbs = res?.data?.verbs ?? res?.verbs;
			bridgeVerbs = Array.isArray(verbs) ? verbs.map(String) : [];
		} catch {
			bridgeVerbs = [];
		}
	}

	async function loadVaultTokens() {
		try {
			const res = await vaultSyncCall('get_active_tokens', {});
			const tokens = res?.data?.ActiveTokens ?? res?.ActiveTokens ?? [];
			vaultTokens = (Array.isArray(tokens) ? tokens : []).map((t: any) => ({
				name: String(t.name || t.symbol || ''),
				symbol: String(t.symbol || t.name || ''),
				decimals: Number(t.decimals) || 8,
			})).filter((t) => t.name);
			if (!formToken && vaultTokens.length) formToken = vaultTokens[0].name;
		} catch {
			vaultTokens = [];
		}
	}

	async function loadVaultBalanceForToken(token: string) {
		if (!token) {
			vaultBalance = null;
			return;
		}
		try {
			const res = await vaultSyncCall('get_vault_balance', { token });
			const bal = res?.data?.Balance ?? res?.Balance;
			if (bal?.amount != null) vaultBalance = String(bal.amount);
			else vaultBalance = null;
		} catch {
			vaultBalance = null;
		}
	}

	function togglePermission(verb: string) {
		if (formRequestedPermissions.includes(verb)) {
			formRequestedPermissions = formRequestedPermissions.filter((v) => v !== verb);
		} else {
			formRequestedPermissions = [...formRequestedPermissions, verb];
		}
	}

	async function openSubmitForm() {
		view = 'form';
		await Promise.all([loadSubmitContext(), loadBridgeVerbs(), loadOrgOptions(), loadVaultTokens()]);
		if (formToken) await loadVaultBalanceForToken(formToken);
	}

	function resetFormFields() {
		formTitle = '';
		formDescription = '';
		formProposalType = 'poll';
		formOrgScope = '';
		formToken = vaultTokens[0]?.name ?? '';
		formToPrincipal = '';
		formAmount = '';
		formUpgradeTarget = 'extension';
		formPackageId = '';
		formVersion = '';
		formActionId = '';
		formCoreDecision = 'approve';
		formSource = '';
		formSourceUrl = '';
		formRequestedPermissions = [];
		vaultBalance = null;
	}

	async function fetchRemoteCode() {
		const url = formSourceUrl.trim();
		if (!url || !isValidUrl(url)) {
			error = 'Please enter a valid code URL';
			return;
		}
		codeFetching = true;
		error = '';
		accessDeniedOp = '';
		try {
			const res = await callAsync('fetch_proposal_code_remote', { code_url: url });
			if (res?.success) {
				formSource = res.data?.code ?? '';
			} else {
				error = res?.error || 'Failed to fetch code';
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			codeFetching = false;
		}
	}

	function buildSubmitArgs(): Record<string, any> | null {
		const title = formTitle.trim();
		const description = formDescription.trim();
		if (!title || !description) {
			error = 'Title and description are required';
			return null;
		}

		const args: Record<string, any> = {
			title,
			description,
			proposal_type: formProposalType,
		};
		const orgScope = formOrgScope.trim();
		if (orgScope) args.org_scope = orgScope;

		if (formProposalType === 'poll') {
			args.action = {};
			return args;
		}

		if (formProposalType === 'transaction') {
			const token = formToken.trim();
			const toPrincipal = formToPrincipal.trim();
			const amount = formAmount.trim();
			if (!token || !toPrincipal) {
				error = 'Token and recipient principal are required';
				return null;
			}
			if (!isValidBaseAmount(amount)) {
				error = 'Amount must be a positive decimal string of ledger base units';
				return null;
			}
			args.action = { token, to_principal: toPrincipal, amount };
			return args;
		}

		if (formProposalType === 'upgrade') {
			if (formUpgradeTarget === 'core') {
				const actionId = formActionId.trim();
				if (!actionId) {
					error = 'Orchestration action ID is required';
					return null;
				}
				args.action = {
					target: 'core',
					action_id: actionId,
					decision: formCoreDecision,
				};
				return args;
			}
			const packageId = formPackageId.trim();
			const version = formVersion.trim();
			if (!packageId) {
				error = 'Package ID is required';
				return null;
			}
			if (!isPinnedSemver(version)) {
				error = 'Version must be a pinned semver (not empty or "latest")';
				return null;
			}
			const registryId = String(submitContext?.registry_canister_id || '').trim();
			args.action = {
				target: formUpgradeTarget,
				package_id: packageId,
				version,
				...(registryId ? { registry_canister_id: registryId } : {}),
			};
			return args;
		}

		const source = formSource.trim();
		const sourceUrl = formSourceUrl.trim();
		if (!source && !sourceUrl) {
			error = 'Paste code or provide a URL to fetch';
			return null;
		}
		args.action = {};
		if (source) args.source = source;
		if (sourceUrl) args.source_url = sourceUrl;
		args.requested_permissions = [...formRequestedPermissions];
		return args;
	}

	function isFormValid(): boolean {
		if (!formTitle.trim() || !formDescription.trim()) return false;
		if (formProposalType === 'transaction') {
			return !!(formToken.trim() && formToPrincipal.trim() && isValidBaseAmount(formAmount));
		}
		if (formProposalType === 'upgrade') {
			if (formUpgradeTarget === 'core') return !!formActionId.trim();
			return !!(formPackageId.trim() && isPinnedSemver(formVersion));
		}
		if (formProposalType === 'code_execution') {
			return !!(formSource.trim() || (formSourceUrl.trim() && isValidUrl(formSourceUrl.trim())));
		}
		return true;
	}

	async function callSync(fn: string, args: Record<string, any> = {}) {
		const raw = await ctx.callSync(fn, args);
		return typeof raw === 'string' ? JSON.parse(raw) : raw;
	}

	async function callAsync(fn: string, args: Record<string, any> = {}) {
		const raw = await ctx.callAsync(fn, args);
		return typeof raw === 'string' ? JSON.parse(raw) : raw;
	}

	async function fetchProposalsPage(fromId: number) {
		const args: Record<string, any> = { from_id: fromId, page_size: LIST_FETCH_SIZE };
		if (orgFilter) args.org_scope = orgFilter;
		if (statusFilter) args.status = statusFilter;
		if (typeFilter) args.proposal_type = typeFilter;
		const res = await callSync('get_proposals', args);
		if (res?.success) {
			const batch = res.data?.proposals ?? res.data ?? [];
			return {
				proposals: Array.isArray(batch) ? batch : [],
				hasMore: !!res.data?.has_more,
				nextFromId: res.data?.next_from_id ?? null,
			};
		}
		if (res?.data) {
			const batch = Array.isArray(res.data) ? res.data : res.data.proposals ?? [];
			return { proposals: batch, hasMore: false, nextFromId: null };
		}
		if (Array.isArray(res)) {
			return { proposals: res, hasMore: false, nextFromId: null };
		}
		throw new Error(res?.error || 'Failed to load proposals');
	}

	function mergeProposals(existing: any[], batch: any[]) {
		const seen = new Set(existing.map((p) => p.id));
		const merged = [...existing];
		for (const proposal of batch) {
			if (!seen.has(proposal.id)) {
				merged.push(proposal);
				seen.add(proposal.id);
			}
		}
		return merged;
	}

	function upsertProposal(proposal: any) {
		const idx = proposals.findIndex((p) => p.id === proposal.id);
		if (idx >= 0) {
			proposals[idx] = { ...proposals[idx], ...proposal };
			proposals = [...proposals];
		} else {
			proposals = [proposal, ...proposals];
		}
	}

	async function loadProposals(opts: { reset?: boolean; background?: boolean } = {}) {
		const reset = opts.reset !== false;
		const background = opts.background === true;
		if (reset && !background) {
			listLoading = true;
			listNextFromId = 1;
		}
		error = '';
		accessDeniedOp = '';
		try {
			const page = await fetchProposalsPage(1);
			proposals = page.proposals;
			currentPage = 1;
			listHasMore = page.hasMore;
			listNextFromId = page.nextFromId ?? 1;
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			if (!background) {
				listLoading = false;
			}
		}
	}

	async function loadOrgOptions() {
		try {
			const res = await callSync('get_org_scopes');
			const names = res?.data?.org_scopes;
			if (Array.isArray(names) && names.length) {
				orgOptions = names;
				return;
			}
		} catch {
			// fall through to deriving from loaded proposals
		}
		const seen = new Set<string>();
		for (const p of proposals) {
			const scope = (p.org_scope || '').trim();
			if (scope) seen.add(scope);
		}
		orgOptions = [...seen].sort();
	}

	function onFilterChange() {
		loadProposals();
	}

	async function loadMoreProposals() {
		if (listLoadingMore || !listHasMore) return;
		listLoadingMore = true;
		error = '';
		try {
			const fromId = listNextFromId || 1;
			const page = await fetchProposalsPage(fromId);
			proposals = mergeProposals(proposals, page.proposals);
			listHasMore = page.hasMore;
			listNextFromId = page.nextFromId ?? fromId;
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			listLoadingMore = false;
		}
	}

	function proposalPath(proposal: any | string | null): string {
		const base = getExtensionBasePath();
		if (!proposal) return base;
		const slug =
			typeof proposal === 'string' ? proposal : proposalLinkSlug(proposal);
		return `${base}/proposals/${encodeURIComponent(slug)}`;
	}

	function buildProposalUrl(proposalOrSlug: any): string {
		const slug =
			typeof proposalOrSlug === 'string'
				? proposalOrSlug
				: proposalLinkSlug(proposalOrSlug);
		const extPath = `/extensions/voting/proposals/${encodeURIComponent(slug)}`;

		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const realmSlug = params.get('slug');
			const portalUrl = (
				(globalThis as { __CANISTER_IDS?: { portal_url?: string } }).__CANISTER_IDS
					?.portal_url || ''
			).replace(/\/+$/, '');
			if (params.get('portal') === '1' && realmSlug && portalUrl) {
				const realmPath = `/r/${encodeURIComponent(realmSlug)}`;
				const base = portalUrl.endsWith(realmPath)
					? portalUrl
					: `${portalUrl}${realmPath}`;
				return `${base}${extPath}`;
			}

			const url = new URL(window.location.href);
			url.pathname = proposalPath(proposalOrSlug);
			url.search = '';
			url.hash = '';
			return url.toString();
		}
		return extPath;
	}

	function buildListUrl(): string {
		const base = getExtensionBasePath();
		return `${window.location.origin}${base}`;
	}

	function syncProposalUrl(proposal: any | string | null, opts?: { replace?: boolean }) {
		if (typeof window === 'undefined') return;
		const path = proposalPath(proposal);
		const current = window.location.pathname.replace(/\/$/, '') || '/';
		const target = path.replace(/\/$/, '') || '/';
		if (current === target) return;

		if (ctx.navigate) {
			void ctx.navigate(path, {
				replaceState: opts?.replace ?? false,
				noScroll: true,
				keepFocus: true,
			});
			return;
		}

		const next = proposal ? buildProposalUrl(proposal) : buildListUrl();
		history.replaceState(
			{
				view: proposal ? 'detail' : 'list',
				proposalId: typeof proposal === 'string' ? resolveProposalId(proposal) : proposal?.id,
			},
			'',
			next,
		);
	}

	function buildProposalFocusUri(proposalId: string): string {
		return `realms://${EXTENSION_ID}/proposal/${encodeURIComponent(proposalId)}`;
	}

	function publishProposalFocus(proposal: any) {
		if (!proposal?.id) return;
		ctx.host?.setFocus?.({
			source: EXTENSION_ID,
			uri: buildProposalFocusUri(proposal.id),
			label: proposal.title ?? proposal.id,
		});
	}

	function clearProposalFocus() {
		ctx.host?.setFocus?.(null);
	}

	function goBackToList(opts?: { skipUrlSync?: boolean }) {
		view = 'list';
		selectedProposal = null;
		clearProposalFocus();
		if (!opts?.skipUrlSync) syncProposalUrl(null);
		if (proposals.length === 0 && !listLoading) {
			void loadProposals();
		}
	}

	async function openProposalById(proposalSlug: string, opts?: { skipUrlSync?: boolean }) {
		const proposalId = resolveProposalId(proposalSlug);
		view = 'detail';
		detailLoading = true;
		error = '';
		try {
			let proposal: any =
				proposals.find((p) => p.id === proposalId) ??
				proposals.find((p) => String(p._id) === proposalId) ??
				proposals.find((p) => proposalLinkSlug(p) === proposalSlug);
			if (!proposal) {
				selectedProposal = null;
				const res = await callSync('get_proposal', { proposal_id: proposalId });
				if (res?.success && res.data) proposal = res.data;
				else if (res?.id) proposal = res;
			}
			if (proposal) {
				upsertProposal(proposal);
				await viewProposal(proposal, opts);
			} else {
				error = `Proposal "${proposalSlug}" not found`;
				goBackToList({ skipUrlSync: true });
			}
		} catch (e: any) {
			error = e?.message ?? String(e);
			goBackToList({ skipUrlSync: true });
		} finally {
			detailLoading = false;
		}
	}

	async function applyUrlState() {
		const proposalId = parseProposalIdFromUrl();
		if (proposalId) {
			await openProposalById(proposalId, { skipUrlSync: true });
		} else if (view === 'detail') {
			goBackToList({ skipUrlSync: true });
		}
	}

	function handlePopState() {
		const proposalId = parseProposalIdFromUrl();
		if (proposalId) {
			openProposalById(proposalId, { skipUrlSync: true });
		} else {
			goBackToList({ skipUrlSync: true });
		}
	}

	async function viewProposal(proposal: any, opts?: { skipUrlSync?: boolean }) {
		selectedProposal = proposal;
		view = 'detail';
		codeContent = '';
		codeChecksum = '';
		codeError = '';
		if (!opts?.skipUrlSync && proposal?.id) {
			syncProposalUrl(proposal, { replace: false });
		}
		publishProposalFocus(proposal);
		if (getProposalType(proposal) === 'code_execution') {
			await fetchCode(proposal);
		}
	}

	async function fetchCode(proposal: any) {
		codeLoading = true;
		codeError = '';
		try {
			const res = await callSync('fetch_proposal_code', { proposal_id: proposal.id });
			if (res?.success) {
				const data = res.data ?? {};
				codeContent = data.code ?? '';
				codeChecksum = data.checksum ?? '';
			} else {
				codeContent = '';
				codeError = res?.error || 'Failed to fetch code';
			}
		} catch (e: any) {
			codeContent = '';
			codeError = e?.message || String(e);
		} finally {
			codeLoading = false;
		}
	}

	async function castVote(proposalId: string, vote: string) {
		votingInProgress = proposalId + vote;
		error = '';
		accessDeniedOp = '';
		try {
			const voter = ctx.principal || 'anonymous';
			const res = await callSync('cast_vote', { proposal_id: proposalId, vote, voter });
			if (res?.success) {
				if (selectedProposal?.id === proposalId) {
					const detail = await callSync('get_proposal', { proposal_id: proposalId });
					if (detail?.success) selectedProposal = detail.data ?? detail;
					else selectedProposal = detail?.data ?? selectedProposal;
				}
				await loadProposals();
			} else {
				error = res?.error || 'Failed to cast vote';
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			votingInProgress = '';
		}
	}

	async function submitProposal() {
		const args = buildSubmitArgs();
		if (!args) return;
		submitting = true;
		error = '';
		accessDeniedOp = '';
		submitMsg = '';
		try {
			const res = await callAsync('submit_proposal', args);
			if (res?.success) {
				submitMsg = 'Proposal submitted successfully!';
				resetFormFields();
				await loadProposals();
				setTimeout(() => {
					submitMsg = '';
					view = 'list';
				}, 1500);
			} else {
				error = res?.error || 'Failed to submit proposal';
			}
		} catch (e: any) {
			const op = ctx.ui?.accessDeniedOperation?.(e);
			if (op != null) {
				accessDeniedOp = op;
				error = '';
			} else {
				accessDeniedOp = '';
				error = e?.message ?? String(e);
			}
		} finally {
			submitting = false;
		}
	}

	function cancelForm() {
		resetFormFields();
		error = '';
		accessDeniedOp = '';
		submitMsg = '';
		view = 'list';
	}

	function statusColor(s: string): string {
		if (!s) return 'bg-gray-100 text-gray-700';
		const sl = s.toLowerCase();
		if (sl === 'voting') return 'bg-emerald-100 text-emerald-700';
		if (sl === 'pending_review' || sl === 'pending_vote') return 'bg-amber-100 text-amber-700';
		if (sl === 'accepted' || sl === 'executed' || sl === 'passed') return 'bg-green-100 text-green-700';
		if (sl === 'executing') return 'bg-purple-100 text-purple-700';
		if (sl === 'rejected' || sl === 'failed') return 'bg-red-100 text-red-700';
		return 'bg-gray-100 text-gray-700';
	}

	function statusLabel(s: string): string {
		if (!s) return 'Unknown';
		return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function formatDate(value: any): string {
		if (!value && value !== 0) return 'N/A';
		const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
		if (isNaN(date.getTime())) return 'N/A';
		return date.toLocaleDateString();
	}

	function formatDateTime(value: any): string {
		if (!value && value !== 0) return 'N/A';
		const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
		if (isNaN(date.getTime())) return 'N/A';
		return date.toLocaleString();
	}

	function parseEpochSeconds(value: any): number | null {
		if (value == null || value === '') return null;
		const n = typeof value === 'number' ? value : parseFloat(String(value));
		if (!Number.isFinite(n)) return null;
		return n > 1e12 ? Math.floor(n / 1000) : n;
	}

	function voteTally(proposal: any) {
		const yes = Number(proposal?.votes?.yes ?? 0);
		const no = Number(proposal?.votes?.no ?? 0);
		const abstain = Number(proposal?.votes?.abstain ?? 0);
		const total = yes + no + abstain;
		return { yes, no, abstain, total };
	}

	function votePercent(count: number, total: number): string {
		if (total <= 0) return '0%';
		return `${((count / total) * 100).toFixed(1)}%`;
	}

	function formatTimeRemaining(deadline: any, now = Date.now()): string {
		const epoch = parseEpochSeconds(deadline);
		if (epoch == null) return '';
		const diffMs = epoch * 1000 - now;
		if (diffMs <= 0) return '';
		const sec = Math.floor(diffMs / 1000);
		const days = Math.floor(sec / 86400);
		const hours = Math.floor((sec % 86400) / 3600);
		const mins = Math.floor((sec % 3600) / 60);
		const secs = sec % 60;
		if (days > 0) return `${days}d ${hours}h ${mins}m left`;
		if (hours > 0) return `${hours}h ${mins}m ${secs}s left`;
		if (mins > 0) return `${mins}m ${secs}s left`;
		return `${secs}s left`;
	}

	function formatDuration(seconds: number): string {
		if (!Number.isFinite(seconds) || seconds <= 0) return 'unknown';
		if (seconds >= 86400) {
			const days = seconds / 86400;
			return Number.isInteger(days) ? `${days} days` : `${days.toFixed(2)} days`;
		}
		if (seconds >= 3600) return `${Math.round(seconds / 3600)} hours`;
		if (seconds >= 60) return `${Math.round(seconds / 60)} minutes`;
		return `${Math.round(seconds)} seconds`;
	}

	function parseOrgPolicy(proposal: any): { m: number; n: number } | null {
		const match = (proposal?.description || '').match(/policy (\d+)\/(\d+)/);
		if (!match) return null;
		return { m: parseInt(match[1], 10), n: parseInt(match[2], 10) };
	}

	function isVotingDeadlinePassed(proposal: any, now = Date.now()): boolean {
		const status = (proposal?.status || '').toLowerCase();
		if (status !== 'voting' && status !== 'pending_vote') return false;
		const epoch = parseEpochSeconds(proposal.voting_deadline);
		return epoch != null && epoch * 1000 <= now;
	}

	function isVotingOpen(proposal: any, now = Date.now()): boolean {
		const status = (proposal?.status || '').toLowerCase();
		return (status === 'voting' || status === 'pending_vote') && !isVotingDeadlinePassed(proposal, now);
	}

	function getVotingClosedReason(proposal: any, now = Date.now()): string {
		const status = (proposal?.status || '').toLowerCase();
		if (status !== 'voting' && status !== 'pending_vote') {
			return `Closed — ${statusLabel(proposal.status)}`;
		}
		if (!isVotingDeadlinePassed(proposal, now)) return '';

		const tally = voteTally(proposal);
		const policy = parseOrgPolicy(proposal);
		const endedAt = formatDateTime(proposal.voting_deadline);

		if (policy && tally.yes < policy.m) {
			return `Voting period ended ${endedAt} — needs ${policy.m} approvals, ${tally.yes} received. Awaiting finalization.`;
		}
		if (policy && tally.yes >= policy.m) {
			return `Voting period ended ${endedAt} — policy satisfied (${tally.yes}/${policy.m} approvals). Awaiting finalization.`;
		}
		return `Voting period ended ${endedAt}. Awaiting finalization.`;
	}

	function formatVotingStatusLabel(proposal: any, now = Date.now()): string {
		if (isVotingDeadlinePassed(proposal, now)) {
			return getVotingClosedReason(proposal, now);
		}
		return formatTimeRemaining(proposal.voting_deadline, now);
	}

	function approvalRequirementLabel(proposal: any): string {
		const policy = parseOrgPolicy(proposal);
		if (policy) return `${policy.m}/${policy.n} department approvals`;
		if (proposal?.required_threshold != null) {
			return `${(proposal.required_threshold * 100).toFixed(0)}% yes of decisive votes`;
		}
		return 'Approval threshold not set';
	}

	async function loadVotingSettings() {
		try {
			const res = await callSync('get_voting_settings');
			if (res?.success && res.data) {
				votingSettings = res.data;
			}
		} catch {
			votingSettings = null;
		}
	}

	async function copyProposalLink(proposal: any) {
		if (!proposal || typeof navigator === 'undefined') return;
		const url = buildProposalUrl(proposal);
		try {
			await navigator.clipboard.writeText(url);
			linkCopied = true;
			setTimeout(() => {
				linkCopied = false;
			}, 2000);
		} catch {
			error = 'Could not copy link to clipboard';
		}
	}

	function truncatePrincipal(id: string): string {
		if (!id || id.length <= 16) return id || 'unknown';
		return id.slice(0, 8) + '...' + id.slice(-6);
	}

	function toggleFilters() {
		filtersOpen = !filtersOpen;
		persistSessionFlag(FILTERS_KEY, filtersOpen);
	}

	onMount(() => {
		countdownTimer = setInterval(() => {
			nowMs = Date.now();
		}, 1000);
		const proposalSlug = parseProposalIdFromUrl();
		if (proposalSlug) {
			void openProposalById(proposalSlug, { skipUrlSync: true });
		} else {
			void loadProposals();
		}
		void loadOrgOptions();
		void loadVotingSettings();
		window.addEventListener('popstate', handlePopState);
	});

	onDestroy(() => {
		clearInterval(countdownTimer);
		window.removeEventListener('popstate', handlePopState);
		clearProposalFocus();
	});
</script>

<style>
	:global(.voting-monaco-wrap) {
		height: 28rem;
		min-height: 28rem;
		overflow: hidden;
	}

	.chrome-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 6px 12px;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 6px;
		border: 1px solid transparent;
		background: transparent;
		color: #4b5563;
		cursor: pointer;
		flex-shrink: 0;
	}

	.chrome-btn.is-on {
		background: #111827;
		color: #fff;
	}

	.chrome-btn.chrome-outline {
		border-color: #d1d5db;
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

<div class="voting-page w-full px-3 pt-4 sm:px-6 sm:pt-8 max-w-none">
	{#key i18nTick}
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-gray-900 mb-1">{t('page_title')}</h1>
		<p class="text-gray-500 text-sm">{extensionDescription}</p>
		{#if votingSettings}
			<p class="text-xs text-gray-400 mt-2">
				Voting window: {formatDuration(votingSettings.voting_window_seconds)}.
				Change it in
				<button
					type="button"
					onclick={() => ctx.navigate?.('/extensions/realm_settings')}
					class="text-indigo-600 hover:text-indigo-800 underline"
				>
					Realm Settings → Governance
				</button>.
			</p>
		{/if}
	</div>

	<!-- Error / Success banners -->
	{#if accessDeniedOp}
		{#if ctx.ui?.AccessDenied}
			<svelte:component this={ctx.ui.AccessDenied} operation={accessDeniedOp} />
		{:else}
			<p class="text-sm text-gray-500">You need additional permissions to view this page.</p>
		{/if}
	{:else if error}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
			<svg class="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			<span>{error}</span>
			<button onclick={() => error = ''} class="ml-auto text-red-400 hover:text-red-600">&times;</button>
		</div>
	{/if}
	{#if submitMsg}
		<div class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
			<svg class="w-5 h-5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			<span>{submitMsg}</span>
		</div>
	{/if}

	<!-- Proposal Detail View -->
	{#if view === 'detail'}
		{#if detailLoading && !selectedProposal}
			<button onclick={() => goBackToList()} class="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-1">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
				Back to proposals
			</button>
			<div class="flex items-center justify-center py-16">
				<svg class="animate-spin h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
				<span class="ml-3 text-gray-500 text-sm">Loading proposal…</span>
			</div>
		{:else if selectedProposal}
		<button onclick={() => goBackToList()} class="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-1">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
			Back to proposals
		</button>

		<div class="space-y-5">
			<!-- Title & Meta -->
			<div>
				<div class="flex items-center gap-3 mb-2 flex-wrap">
					<h2 class="text-2xl font-bold text-gray-900">{selectedProposal.title}</h2>
					<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold {statusColor(selectedProposal.status)}">
						{statusLabel(selectedProposal.status)}
					</span>
					{#if selectedProposalType}
						<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold {proposalTypeColor(selectedProposalType)}">
							{proposalTypeLabel(selectedProposalType)}
						</span>
					{/if}
					{#if selectedProposal.org_scope}
						<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
							{selectedProposal.org_scope}
						</span>
					{/if}
				</div>
				<div class="flex flex-wrap gap-4 text-sm text-gray-500">
					<span>ID: <code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{proposalDisplayId(selectedProposal)}</code></span>
					<span>Proposer: <code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{truncatePrincipal(selectedProposal.proposer)}</code></span>
					<span>Created: {formatDateTime(selectedProposal.created_at)}</span>
					{#if selectedProposal.voting_deadline}
						<span>Deadline: {formatDateTime(selectedProposal.voting_deadline)}</span>
					{/if}
					<span class="font-mono text-xs break-all">Link: {buildProposalUrl(selectedProposal)}</span>
					<button
						type="button"
						onclick={() => copyProposalLink(selectedProposal)}
						class="text-xs text-indigo-600 hover:text-indigo-800 underline"
					>
						{linkCopied ? 'Copied!' : 'Copy link'}
					</button>
				</div>
			</div>

			<!-- Description -->
			<div class="rounded-lg border border-gray-200 bg-white p-5">
				<h3 class="text-base font-semibold text-gray-900 mb-2">Description</h3>
				<p class="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{selectedProposal.description}</p>
			</div>

			<!-- Voting Info -->
			{#if selectedProposal.status === 'voting' || voteTally(selectedProposal).total > 0}
				{@const tally = voteTally(selectedProposal)}
				<div class="rounded-lg border border-gray-200 bg-white p-5">
					<div class="flex flex-wrap items-start justify-between gap-3 mb-3">
						<h3 class="text-base font-semibold text-gray-900">Voting Results</h3>
						{#if selectedProposal.status === 'voting' || selectedProposal.status === 'pending_vote'}
							{#if selectedProposal.voting_deadline}
								<span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium max-w-md {isVotingDeadlinePassed(selectedProposal, nowMs) ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}">
									<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
									<span>{formatVotingStatusLabel(selectedProposal, nowMs)}</span>
								</span>
							{:else}
								<span class="text-xs text-gray-400">No voting deadline set</span>
							{/if}
						{/if}
					</div>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
						<div class="text-center">
							<div class="text-2xl font-bold text-green-600">{tally.yes}</div>
							<div class="text-xs text-gray-500">Yes</div>
							<div class="text-xs font-medium text-green-600 mt-0.5">{votePercent(tally.yes, tally.total)}</div>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold text-red-600">{tally.no}</div>
							<div class="text-xs text-gray-500">No</div>
							<div class="text-xs font-medium text-red-600 mt-0.5">{votePercent(tally.no, tally.total)}</div>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold text-gray-500">{tally.abstain}</div>
							<div class="text-xs text-gray-500">Abstain</div>
							<div class="text-xs font-medium text-gray-600 mt-0.5">{votePercent(tally.abstain, tally.total)}</div>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold text-gray-900">{tally.total}</div>
							<div class="text-xs text-gray-500">Total</div>
							<div class="text-xs font-medium text-gray-400 mt-0.5">100%</div>
						</div>
					</div>

					{#if tally.total > 0}
						<div class="mb-4">
							<div class="flex justify-between text-xs text-gray-500 mb-1">
								<span>Approval (yes / decisive votes)</span>
								<span>{votePercent(tally.yes, Math.max(tally.yes + tally.no, 1))}</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden flex">
								<div
									class="bg-green-500 h-2.5 transition-all duration-300"
									style="width: {tally.total > 0 ? (tally.yes / tally.total) * 100 : 0}%"
								></div>
								<div
									class="bg-red-500 h-2.5 transition-all duration-300"
									style="width: {tally.total > 0 ? (tally.no / tally.total) * 100 : 0}%"
								></div>
								<div
									class="bg-gray-400 h-2.5 transition-all duration-300"
									style="width: {tally.total > 0 ? (tally.abstain / tally.total) * 100 : 0}%"
								></div>
							</div>
							{#if selectedProposal.required_threshold || parseOrgPolicy(selectedProposal)}
								<div class="text-xs text-gray-400 mt-1">Requirement: {approvalRequirementLabel(selectedProposal)}</div>
							{/if}
						</div>
					{/if}

					{#if isVotingOpen(selectedProposal, nowMs)}
						<div class="flex gap-2 pt-2">
							<button
								onclick={() => castVote(selectedProposal.id, 'yes')}
								disabled={!!votingInProgress}
								class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-green-300 text-green-700 text-sm font-medium hover:bg-green-50 disabled:opacity-50 transition-colors"
							>
								{#if votingInProgress === selectedProposal.id + 'yes'}
									<div class="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
								{:else}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
								{/if}
								{t('vote_yes')}
							</button>
							<button
								onclick={() => castVote(selectedProposal.id, 'no')}
								disabled={!!votingInProgress}
								class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
							>
								{#if votingInProgress === selectedProposal.id + 'no'}
									<div class="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
								{:else}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
								{/if}
								{t('vote_no')}
							</button>
							<button
								onclick={() => castVote(selectedProposal.id, 'abstain')}
								disabled={!!votingInProgress}
								class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
							>
								{#if votingInProgress === selectedProposal.id + 'abstain'}
									<div class="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
								{:else}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
								{/if}
								{t('vote_abstain')}
							</button>
						</div>
					{:else if selectedProposal.status === 'voting' || selectedProposal.status === 'pending_vote'}
						<p class="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2">
							{getVotingClosedReason(selectedProposal, nowMs)}
						</p>
					{/if}
				</div>
			{/if}

			<!-- Action summary (non code_execution) -->
			{#if selectedProposalType && selectedProposalType !== 'code_execution'}
				<div class="rounded-lg border border-gray-200 bg-white p-5">
					<h3 class="text-base font-semibold text-gray-900 mb-3">Proposal action</h3>
					{#if selectedProposalType === 'poll'}
						<p class="text-sm text-gray-600">Advisory poll — no automated action on approval.</p>
					{:else if selectedProposalType === 'transaction'}
						<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
							<div>
								<dt class="text-xs text-gray-500">Token</dt>
								<dd class="font-medium text-gray-900">{selectedProposalAction.token || '—'}</dd>
							</div>
							<div>
								<dt class="text-xs text-gray-500">Amount (base units)</dt>
								<dd class="font-mono text-gray-900">{selectedProposalAction.amount || '—'}</dd>
							</div>
							<div class="sm:col-span-2">
								<dt class="text-xs text-gray-500">Recipient</dt>
								<dd class="font-mono text-xs break-all text-gray-900">{selectedProposalAction.to_principal || '—'}</dd>
							</div>
						</dl>
					{:else if selectedProposalType === 'upgrade'}
						<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
							<div>
								<dt class="text-xs text-gray-500">Target</dt>
								<dd class="font-medium text-gray-900">{proposalTypeLabel(selectedProposalAction.target || '')}</dd>
							</div>
							{#if selectedProposalAction.target === 'core'}
								<div>
									<dt class="text-xs text-gray-500">Action ID</dt>
									<dd class="font-mono text-xs break-all text-gray-900">{selectedProposalAction.action_id || '—'}</dd>
								</div>
								<div>
									<dt class="text-xs text-gray-500">Decision</dt>
									<dd class="font-medium text-gray-900 capitalize">{selectedProposalAction.decision || '—'}</dd>
								</div>
							{:else}
								<div>
									<dt class="text-xs text-gray-500">Package</dt>
									<dd class="font-mono text-gray-900">{selectedProposalAction.package_id || '—'}</dd>
								</div>
								<div>
									<dt class="text-xs text-gray-500">Version</dt>
									<dd class="font-mono text-gray-900">{selectedProposalAction.version || '—'}</dd>
								</div>
								{#if selectedProposalAction.registry_canister_id}
									<div class="sm:col-span-2">
										<dt class="text-xs text-gray-500">Registry</dt>
										<dd class="font-mono text-xs break-all text-gray-700">{selectedProposalAction.registry_canister_id}</dd>
									</div>
								{/if}
							{/if}
						</dl>
					{/if}
				</div>
			{/if}

			{#if selectedProposalType === 'code_execution' && selectedProposalPermissions.length > 0}
				<div class="rounded-lg border border-gray-200 bg-white p-5">
					<h3 class="text-base font-semibold text-gray-900 mb-2">Requested permissions</h3>
					<div class="flex flex-wrap gap-1.5">
						{#each selectedProposalPermissions as perm}
							<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 font-mono">{perm}</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if selectedProposalType === 'code_execution'}
			<!-- Proposal Code -->
			<div class="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex flex-col min-h-[28rem]">
				<div class="bg-gray-100 px-4 py-2.5 border-b flex items-center justify-between flex-wrap gap-2">
					<div class="flex items-center gap-2">
						<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
						<h3 class="font-semibold text-sm text-gray-800">Proposal Code</h3>
					</div>
					<div class="flex items-center gap-2">
						{#if selectedProposalAction.source_url || selectedProposal.code_url}
							<a href={selectedProposalAction.source_url || selectedProposal.code_url} target="_blank" rel="noopener noreferrer" class="text-xs text-indigo-600 hover:underline">View source</a>
						{/if}
						<span class="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs font-mono">proposal.py</span>
					</div>
				</div>

				<div class="flex-1 p-4 flex flex-col min-h-0">
					{#if codeLoading}
						<div class="flex items-center justify-center flex-1 py-8">
							<svg class="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
							<span class="ml-3 text-gray-500 text-sm">Loading code…</span>
						</div>
					{:else if codeError}
						<div class="text-sm text-red-600 mb-3">{codeError}</div>
						<button onclick={() => fetchCode(selectedProposal)} class="text-sm px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100">Retry</button>
					{:else if codeContent}
						<div class="voting-monaco-wrap rounded-lg overflow-hidden border border-gray-200 bg-white">
							{#key codeChecksum}
								<MonacoPane code={codeContent} language="python" readOnly={true} />
							{/key}
						</div>
						{#if codeChecksum}
							<div class="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
								<span>Checksum: <code class="bg-gray-100 px-1.5 py-0.5 rounded">{codeChecksum}</code></span>
								<span>{codeContent.split('\n').length} lines</span>
							</div>
						{/if}
					{:else}
						<div class="text-center py-8 text-gray-400 text-sm flex-1 flex items-center justify-center">
							No code available for this proposal.
						</div>
					{/if}
				</div>
			</div>

			<div class="text-xs text-gray-400 pb-4">
				<span class="font-medium">Security note:</span> Approved code will be executed on the realm backend. Review carefully before voting.
			</div>
			{/if}
		</div>
		{/if}

	<!-- Submit Proposal Form View -->
	{:else if view === 'form'}
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="mb-5">
				<h2 class="text-xl font-semibold text-gray-900 mb-1">{t('submit_a_proposal')}</h2>
				<p class="text-sm text-gray-500">{formSubtitle}</p>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); submitProposal(); }} class="space-y-4">
				<div>
					<label for="rt-type" class="block text-sm font-medium text-gray-700 mb-1">Proposal type *</label>
					<select
						id="rt-type"
						bind:value={formProposalType}
						disabled={submitting}
						class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
					>
						{#each formTypeOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="rt-org" class="block text-sm font-medium text-gray-700 mb-1">Department scope</label>
					<select
						id="rt-org"
						bind:value={formOrgScope}
						disabled={submitting}
						class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
					>
						<option value="">Realm-wide</option>
						{#each orgOptions as org}
							<option value={org}>{org}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="rt-title" class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
					<input
						id="rt-title"
						type="text"
						bind:value={formTitle}
						placeholder="Proposal title"
						required
						disabled={submitting}
						class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
					/>
				</div>

				<div>
					<label for="rt-desc" class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
					<textarea
						id="rt-desc"
						bind:value={formDescription}
						placeholder="Describe what this proposal does and why…"
						rows="5"
						required
						disabled={submitting}
						class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y disabled:bg-gray-50 disabled:text-gray-400"
					></textarea>
				</div>

				{#if formProposalType === 'transaction'}
					<div class="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50">
						<div>
							<label for="rt-token" class="block text-sm font-medium text-gray-700 mb-1">Token *</label>
							<select
								id="rt-token"
								bind:value={formToken}
								onchange={() => loadVaultBalanceForToken(formToken)}
								disabled={submitting}
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
							>
								{#if vaultTokens.length === 0}
									<option value="">No tokens available</option>
								{:else}
									{#each vaultTokens as token}
										<option value={token.name}>{token.symbol || token.name}</option>
									{/each}
								{/if}
							</select>
						</div>
						<div>
							<label for="rt-amount" class="block text-sm font-medium text-gray-700 mb-1">Amount (ledger base units) *</label>
							<input
								id="rt-amount"
								type="text"
								inputmode="numeric"
								bind:value={formAmount}
								placeholder="100000000"
								disabled={submitting}
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
							/>
							{#if vaultBalance != null}
								{@const tokenMeta = vaultTokens.find((t) => t.name === formToken)}
								<p class="text-xs text-gray-500 mt-1">
									Vault balance: {formatTokenBalance(vaultBalance, tokenMeta?.decimals ?? 8)}
									{tokenMeta?.symbol ?? formToken}
								</p>
							{/if}
						</div>
						<div>
							<label for="rt-recipient" class="block text-sm font-medium text-gray-700 mb-1">Recipient principal *</label>
							<input
								id="rt-recipient"
								type="text"
								bind:value={formToPrincipal}
								placeholder="aaaaa-aa"
								disabled={submitting}
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
							/>
						</div>
					</div>
				{:else if formProposalType === 'upgrade'}
					<div class="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50">
						<div>
							<label for="rt-upgrade-target" class="block text-sm font-medium text-gray-700 mb-1">Upgrade target *</label>
							<select
								id="rt-upgrade-target"
								bind:value={formUpgradeTarget}
								disabled={submitting}
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
							>
								<option value="codex">Codex</option>
								<option value="extension">Extension</option>
								{#if showCoreUpgrade}
									<option value="core">Core orchestration</option>
								{/if}
							</select>
						</div>
						{#if formUpgradeTarget === 'core'}
							<div>
								<label for="rt-action-id" class="block text-sm font-medium text-gray-700 mb-1">Orchestration action ID *</label>
								<input
									id="rt-action-id"
									type="text"
									bind:value={formActionId}
									disabled={submitting}
									class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
								/>
							</div>
							<div>
								<label for="rt-decision" class="block text-sm font-medium text-gray-700 mb-1">Decision *</label>
								<select
									id="rt-decision"
									bind:value={formCoreDecision}
									disabled={submitting}
									class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
								>
									<option value="approve">Approve</option>
									<option value="reject">Reject</option>
								</select>
							</div>
						{:else}
							<div>
								<label for="rt-package" class="block text-sm font-medium text-gray-700 mb-1">Package ID *</label>
								<input
									id="rt-package"
									type="text"
									bind:value={formPackageId}
									placeholder="my_extension"
									disabled={submitting}
									class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
								/>
							</div>
							<div>
								<label for="rt-version" class="block text-sm font-medium text-gray-700 mb-1">Version (pinned semver) *</label>
								<input
									id="rt-version"
									type="text"
									bind:value={formVersion}
									placeholder="1.2.3"
									disabled={submitting}
									class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
								/>
							</div>
							{#if submitContext?.registry_canister_id}
								<p class="text-xs text-gray-500">Registry: <code class="bg-gray-100 px-1 rounded">{submitContext.registry_canister_id}</code></p>
							{/if}
						{/if}
					</div>
				{:else if formProposalType === 'code_execution'}
					<div class="space-y-3">
						<div>
							<label for="rt-source-url" class="block text-sm font-medium text-gray-700 mb-1">Code URL (optional)</label>
							<div class="flex gap-2">
								<input
									id="rt-source-url"
									type="url"
									bind:value={formSourceUrl}
									placeholder="https://example.com/script.py"
									disabled={submitting || codeFetching}
									class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
								/>
								<button
									type="button"
									onclick={fetchRemoteCode}
									disabled={submitting || codeFetching || !formSourceUrl.trim()}
									class="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
								>
									{#if codeFetching}
										<div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
									{:else}
										Fetch
									{/if}
								</button>
							</div>
						</div>
						<div>
							<label for="rt-source" class="block text-sm font-medium text-gray-700 mb-1">Python source *</label>
							<textarea
								id="rt-source"
								bind:value={formSource}
								placeholder="# Paste proposal code here…"
								rows="12"
								disabled={submitting}
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y"
							></textarea>
						</div>
						{#if bridgeVerbs.length > 0}
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Requested permissions</label>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{#each bridgeVerbs as verb}
										<label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
											<input
												type="checkbox"
												checked={formRequestedPermissions.includes(verb)}
												onchange={() => togglePermission(verb)}
												disabled={submitting}
												class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
											/>
											<span class="font-mono text-xs">{verb}</span>
										</label>
									{/each}
								</div>
							</div>
						{/if}
						<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
							<h4 class="font-medium text-amber-800 text-sm mb-1">Security notice</h4>
							<ul class="text-xs text-amber-700 space-y-0.5">
								<li>• All proposals are publicly visible to realm members</li>
								<li>• Approved code will be executed on the realm backend</li>
							</ul>
						</div>
					</div>
				{/if}

				<div class="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={cancelForm}
						disabled={submitting}
						class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={submitting || !isFormValid()}
						class="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
					>
						{#if submitting}
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							{t('submitting')}
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
							{t('submit_proposal')}
						{/if}
					</button>
				</div>
			</form>
		</div>

	<!-- Proposals list or realm-wide votes -->
	{:else}
		<div class="list-surface border-y border-gray-200 bg-white sm:rounded-lg sm:border">
			<!-- Tab bar & refresh -->
			<div class="flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 border-b border-gray-200">
				<div class="flex gap-1">
					<button
						onclick={() => view = 'list'}
						class="chrome-btn {view === 'list' ? 'is-on' : ''}"
						title={t('proposals')}
						aria-label={t('proposals')}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
						<span class="chrome-label">{t('proposals')}</span>
					</button>
					<button
						onclick={openSubmitForm}
						class="chrome-btn"
						title={t('submit_proposal')}
						aria-label={t('submit_proposal')}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
						<span class="chrome-label">{t('submit_proposal')}</span>
					</button>
					<button
						onclick={() => view = 'federal'}
						class="chrome-btn {view === 'federal' ? 'is-on' : ''}"
						title={t('realm_wide')}
						aria-label={t('realm_wide')}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
						<span class="chrome-label">{t('realm_wide')}</span>
					</button>
				</div>
				{#if view !== 'federal'}
				<button
					onclick={() => loadProposals()}
					disabled={listLoading}
					class="chrome-btn chrome-outline"
					title={listLoading ? 'Loading' : 'Refresh'}
					aria-label={listLoading ? 'Loading' : 'Refresh'}
				>
					{#if listLoading}
						<div class="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
					{:else}
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
					{/if}
					<span class="chrome-label">{listLoading ? 'Loading…' : 'Refresh'}</span>
				</button>
				{/if}
			</div>

			{#if view === 'federal'}
				<FederalVotes {ctx} onopenleg={(id) => openProposalById(id)} />
			{:else}
			<!-- Filters (toggled on narrow viewports) -->
			<div class="flex items-center gap-2 px-3 py-2 sm:px-5 border-b border-gray-200">
				<button
					type="button"
					class="chrome-btn chrome-outline"
					class:is-on={filtersOpen}
					onclick={toggleFilters}
					title={filtersOpen ? 'Hide filters' : 'Show filters'}
					aria-label={filtersOpen ? 'Hide filters' : 'Show filters'}
					aria-pressed={filtersOpen}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
					<span class="chrome-label">Filters</span>
				</button>
				{#if orgFilter || statusFilter || typeFilter}
					<span class="text-xs text-gray-400">Filtered</span>
				{/if}
			</div>
			{#if filtersOpen}
			<div class="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-5 sm:gap-3 border-b border-gray-200">
				<select
					bind:value={orgFilter}
					onchange={() => onFilterChange()}
					class="text-xs border-gray-300 py-1.5 pl-2.5 pr-8 text-gray-700 focus:border-indigo-500 focus:ring-indigo-500"
					aria-label="Filter by department"
				>
					<option value="">All departments</option>
					{#each orgOptions as org}
						<option value={org}>{org}</option>
					{/each}
				</select>
				<select
					bind:value={statusFilter}
					onchange={() => onFilterChange()}
					class="text-xs border-gray-300 py-1.5 pl-2.5 pr-8 text-gray-700 focus:border-indigo-500 focus:ring-indigo-500"
					aria-label="Filter by status"
				>
					<option value="">All statuses</option>
					{#each STATUS_OPTIONS as status}
						<option value={status}>{statusLabel(status)}</option>
					{/each}
				</select>
				<select
					bind:value={typeFilter}
					onchange={() => onFilterChange()}
					class="text-xs border-gray-300 py-1.5 pl-2.5 pr-8 text-gray-700 focus:border-indigo-500 focus:ring-indigo-500"
					aria-label="Filter by proposal type"
				>
					{#each proposalTypeOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
				<select
					bind:value={sortBy}
					onchange={() => { currentPage = 1; }}
					class="text-xs border-gray-300 py-1.5 pl-2.5 pr-8 text-gray-700 focus:border-indigo-500 focus:ring-indigo-500"
					aria-label="Sort proposals"
				>
					{#each SORT_OPTIONS as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
				{#if orgFilter || statusFilter || typeFilter}
					<button
						onclick={() => { orgFilter = ''; statusFilter = ''; typeFilter = ''; onFilterChange(); }}
						class="text-xs text-indigo-600 hover:text-indigo-800"
					>
						Clear filters
					</button>
				{/if}
			</div>
			{/if}

			<!-- Content -->
			{#if listLoading && proposals.length === 0}
				<div class="flex items-center justify-center py-12">
					<svg class="animate-spin h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
					<span class="ml-3 text-gray-500 text-sm">Loading proposals…</span>
				</div>
			{:else if !listLoading && proposals.length === 0}
				<div class="text-center py-12">
					<svg class="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
					{#if orgFilter || statusFilter || typeFilter}
						<p class="text-gray-500 text-sm">{t('no_proposals_filtered')}</p>
						<p class="text-gray-400 text-xs mt-1">Try clearing the filters.</p>
					{:else}
						<p class="text-gray-500 text-sm">{t('no_proposals_yet')}</p>
						<p class="text-gray-400 text-xs mt-1">Be the first to submit a proposal for this realm.</p>
					{/if}
				</div>
			{:else}
			<div class="divide-y divide-gray-100">
					{#each pagedProposals as proposal}
						<div class="p-4 transition-colors {isProposalEnded(proposal, nowMs) ? 'opacity-55 bg-gray-50/80 hover:bg-gray-50/90' : 'hover:bg-gray-50'}">
							<div class="flex items-start justify-between mb-2">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 min-w-0">
										<span class="shrink-0 font-mono text-xs text-gray-400">{proposalDisplayId(proposal)}</span>
										<h3 class="text-sm font-medium text-gray-900 truncate">{proposal.title}</h3>
									</div>
									<div class="flex flex-wrap items-center gap-1.5 mt-1">
										<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold {statusColor(proposal.status)}">
											{statusLabel(proposal.status)}
										</span>
										{#if getProposalType(proposal)}
											<span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {proposalTypeColor(getProposalType(proposal))}">
												{proposalTypeLabel(getProposalType(proposal))}
											</span>
										{/if}
										{#if proposal.org_scope}
											<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
												<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
												{proposal.org_scope}
											</span>
										{/if}
									</div>
								</div>
								<button
									onclick={() => viewProposal(proposal)}
									class="ml-2 shrink-0 px-2.5 py-1 rounded border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-100"
								>
									View
								</button>
							</div>
							<p class="text-xs text-gray-500 line-clamp-2 mb-2">{proposal.description}</p>
							<div class="flex items-center justify-between text-xs text-gray-400 mb-2">
								<code>{truncatePrincipal(proposal.proposer)}</code>
								<span>{formatDate(proposal.created_at)}</span>
							</div>
							{#if proposal.status === 'voting' || proposal.status === 'pending_vote'}
								{@const tally = voteTally(proposal)}
								{@const votingOpen = isVotingOpen(proposal, nowMs)}
								<div class="pt-2 border-t border-gray-100">
									<div class="flex justify-between items-center mb-2 gap-2">
										<div class="flex gap-3 text-xs">
											<span class="text-green-600">Y:{tally.yes} ({votePercent(tally.yes, tally.total)})</span>
											<span class="text-red-600">N:{tally.no} ({votePercent(tally.no, tally.total)})</span>
											<span class="text-gray-500">A:{tally.abstain} ({votePercent(tally.abstain, tally.total)})</span>
										</div>
										{#if proposal.voting_deadline}
											<span class="text-xs whitespace-nowrap max-w-[55%] text-right {votingOpen ? 'text-emerald-600' : 'text-amber-700'}">{formatVotingStatusLabel(proposal, nowMs)}</span>
										{/if}
									</div>
									<div class="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden flex">
										<div class="bg-green-500 h-1.5" style="width: {tally.total > 0 ? (tally.yes / tally.total) * 100 : 0}%"></div>
										<div class="bg-red-500 h-1.5" style="width: {tally.total > 0 ? (tally.no / tally.total) * 100 : 0}%"></div>
										<div class="bg-gray-400 h-1.5" style="width: {tally.total > 0 ? (tally.abstain / tally.total) * 100 : 0}%"></div>
									</div>
									{#if votingOpen}
										<div class="flex gap-1">
											<button onclick={() => castVote(proposal.id, 'yes')} disabled={!!votingInProgress} class="flex-1 py-1.5 rounded border border-green-300 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50">{t('vote_yes')}</button>
											<button onclick={() => castVote(proposal.id, 'no')} disabled={!!votingInProgress} class="flex-1 py-1.5 rounded border border-red-300 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50">{t('vote_no')}</button>
											<button onclick={() => castVote(proposal.id, 'abstain')} disabled={!!votingInProgress} class="flex-1 py-1.5 rounded border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50">{t('vote_abstain')}</button>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="flex items-center justify-between px-5 py-3 border-t border-gray-200">
						<span class="text-xs text-gray-500">
							{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedProposals.length)} of {sortedProposals.length} loaded
						</span>
						<div class="flex items-center gap-2">
							<button
								onclick={() => currentPage--}
								disabled={currentPage <= 1}
								class="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
							>
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
								Prev
							</button>
							<span class="text-xs text-gray-500">{currentPage} / {totalPages}</span>
							<button
								onclick={() => currentPage++}
								disabled={currentPage >= totalPages}
								class="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
							>
								Next
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
							</button>
						</div>
					</div>
				{/if}

				{#if listHasMore}
					<div class="flex justify-center px-5 py-4 border-t border-gray-200">
						<button
							onclick={() => loadMoreProposals()}
							disabled={listLoadingMore}
							class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							{#if listLoadingMore}
								<div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
								Loading more…
							{:else}
								Load more proposals
							{/if}
						</button>
					</div>
				{/if}
			{/if}
			{/if}
		</div>
	{/if}
	{/key}
</div>
