<script lang="ts">
	import { description as extensionDescription } from '../../manifest.json';
	import { onMount } from 'svelte';
	import InvitationManager from './InvitationManager.svelte';
	import ExtensionAccess from './ExtensionAccess.svelte';
	import AccessDenied from '../../../_shared/frontend-rt/AccessDenied.svelte';
	import { call, readPages, refusedPermission, type Reply } from './realm';
	import {
		isNarrowViewport,
		persistSessionFlag,
		readSessionFlag,
		subscribeNarrowViewport,
	} from '../../../_shared/frontend/mobile-chrome';

	let { ctx }: { ctx: any } = $props();

	const HELP_KEY = 'role-manager-help-open';
	let narrow = $state(isNarrowViewport());
	$effect(() => subscribeNarrowViewport((value) => { narrow = value; }));

	type Tab = 'people' | 'profiles' | 'invitations' | 'extensions';
	type View = 'users' | 'detail' | 'assign' | 'profiles';

	let activeTab: Tab = $state('people');

	interface UserEntry {
		principal: string;
		nickname: string;
		profiles: string[];
		status: string;
	}

	interface ProfileDef {
		name: string;
		description: string;
		/** Null when the caller cannot read profile details. */
		allowed_to: string[] | null;
	}

	interface ProfileView extends ProfileDef {
		user_count: number;
	}

	interface OperationDef {
		name: string;
		category: string;
		description: string;
	}

	let users: UserEntry[] = $state([]);
	let profileRows: ProfileDef[] | null = $state(null);
	let opCatalog: OperationDef[] = $state([]);
	let heldPermissions: Set<string> | null = $state(null);
	let myPrincipal = $state('');
	let loading = $state(true);
	let listLoadingMore = $state(false);
	let listHasMore = $state(false);
	let listNextFromId = $state(1);
	const LIST_FETCH_SIZE = 50;
	let error = $state('');
	let accessDeniedOp = $state('');
	let successMsg = $state('');
	let view: View = $state('users');
	let searchQuery = $state('');

	let selectedUser: UserEntry | null = $state(null);
	let detailLoading = $state(false);

	let assignProfileName = $state('');
	let assignLoading = $state(false);

	let callerCanAssign = $derived(holds('role.assign'));
	let callerCanRevoke = $derived(holds('role.revoke'));
	let callerCanEditProfiles = $derived(holds('permission.grant'));
	let showHelp = $state(readSessionFlag(HELP_KEY) === true);

	function toggleHelp() {
		showHelp = !showHelp;
		persistSessionFlag(HELP_KEY, showHelp);
	}

	// Without profile details (db.export), the names come from the users' cards and the seeded profiles.
	let profiles: ProfileDef[] = $derived(
		profileRows ??
			[...new Set(['admin', 'member', ...users.flatMap((u) => u.profiles)])]
				.sort()
				.map((name) => ({ name, description: '', allowed_to: null })),
	);
	let profilesList: ProfileView[] = $derived(
		profiles.map((p) => ({ ...p, user_count: users.filter((u) => u.profiles.includes(p.name)).length })),
	);
	let allOperations: OperationDef[] = $derived.by(() => {
		const known = new Set(opCatalog.map((op) => op.name));
		const extra = [...new Set((profileRows ?? []).flatMap((p) => p.allowed_to ?? []))]
			.filter((name) => !known.has(name))
			.sort()
			.map((name) => ({ name, category: name.split('.')[0], description: '' }));
		return [...opCatalog, ...extra];
	});
	let userPermissions: string[] | null = $derived.by(() => {
		if (!selectedUser) return [];
		if (selectedUser.principal === myPrincipal && heldPermissions) return [...heldPermissions].sort();
		if (!profileRows) return null;
		const held = new Set<string>();
		for (const name of selectedUser.profiles) {
			for (const perm of profileRows.find((p) => p.name === name)?.allowed_to ?? []) held.add(perm);
		}
		return [...held].sort();
	});
	let assignProfilePerms = $derived(profiles.find((p) => p.name === assignProfileName)?.allowed_to ?? null);

	let profilesLoading = $state(false);
	let selectedProfileName = $state('');
	let selectedProfile: ProfileView | null = $derived(profilesList.find((p) => p.name === selectedProfileName) ?? null);
	let profilePermFilter = $state('');
	let profileCategoryFilter = $state('all');
	let profileGrantedOnly = $state(false);
	let profilePendingGrants: Set<string> = $state(new Set());
	let profilePendingRevokes: Set<string> = $state(new Set());
	let profilePermApplying = $state(false);
	let pendingAllGrant = $state(false);

	let filteredUsers = $derived(
		searchQuery.trim()
			? users.filter(
					(u) =>
						u.principal.toLowerCase().includes(searchQuery.toLowerCase()) ||
						u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
						u.profiles.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())),
				)
			: users,
	);

	let hasProfilePendingChanges = $derived(profilePendingGrants.size > 0 || profilePendingRevokes.size > 0);

	let profileOperationCategories = $derived(
		[...new Set(allOperations.map((op) => op.category))].sort(),
	);

	let filteredProfileOperations = $derived(() => {
		const q = profilePermFilter.trim().toLowerCase();
		let ops = allOperations;

		if (q) {
			ops = ops.filter(
				(op) =>
					op.name.toLowerCase().includes(q) ||
					op.category.toLowerCase().includes(q) ||
					op.description.toLowerCase().includes(q),
			);
		}

		if (profileCategoryFilter !== 'all') {
			ops = ops.filter((op) => op.category === profileCategoryFilter);
		}

		if (profileGrantedOnly) {
			ops = ops.filter((op) => profileRowMatchesGrantedOnly(op.name));
		}

		const groups: Record<string, OperationDef[]> = {};
		for (const op of ops) {
			if (!groups[op.category]) groups[op.category] = [];
			groups[op.category].push(op);
		}
		return groups;
	});

	/** Without a readable `me`, every action is offered and the realm decides. */
	function holds(permission: string): boolean {
		return heldPermissions === null || heldPermissions.has('all') || heldPermissions.has(permission);
	}

	function toUser(card: any): UserEntry {
		return {
			principal: String(card?.id ?? ''),
			nickname: String(card?.nickname ?? ''),
			profiles: Array.isArray(card?.profiles) ? card.profiles.map(String) : [],
			status: String(card?.status ?? ''),
		};
	}

	function showFailure(reply: Reply, permission: string, fallback: string) {
		const needed = refusedPermission(reply.error, permission);
		accessDeniedOp = needed ?? '';
		error = needed ? '' : reply.error || fallback;
	}

	/** A governed change files a proposal instead of acting, which is still a success. */
	function outcome(reply: Reply, done: string): string {
		return reply.proposal ? `Submitted for a vote as proposal ${reply.proposal}.` : done;
	}

	async function fetchUsersPage(fromId: number) {
		const reply = await call(ctx, false, 'user_list', { from: fromId, count: LIST_FETCH_SIZE });
		const batch: UserEntry[] = reply.ok && Array.isArray(reply.users)
			? reply.users.map(toUser).filter((u: UserEntry) => u.principal)
			: [];
		const nextFromId: number | null = reply.ok && typeof reply.next === 'number' ? reply.next : null;
		return { reply, users: batch, nextFromId };
	}

	function mergeUsers(existing: UserEntry[], batch: UserEntry[]) {
		const seen = new Set(existing.map((u) => u.principal));
		const merged = [...existing];
		for (const user of batch) {
			if (!seen.has(user.principal)) {
				merged.push(user);
				seen.add(user.principal);
			}
		}
		return merged;
	}

	async function loadUsers() {
		loading = true;
		error = '';
		accessDeniedOp = '';
		listNextFromId = 1;
		try {
			const page = await fetchUsersPage(1);
			if (!page.reply.ok) showFailure(page.reply, 'user.view', 'The member list is unavailable right now.');
			users = page.users;
			listHasMore = page.nextFromId != null;
			listNextFromId = page.nextFromId ?? 1;
		} finally {
			loading = false;
		}
	}

	async function loadMoreUsers() {
		if (listLoadingMore || !listHasMore) return;
		listLoadingMore = true;
		error = '';
		try {
			const fromId = listNextFromId || 1;
			const page = await fetchUsersPage(fromId);
			if (!page.reply.ok) {
				error = page.reply.error || 'More members could not be read right now.';
				return;
			}
			users = mergeUsers(users, page.users);
			listHasMore = page.nextFromId != null;
			listNextFromId = page.nextFromId ?? fromId;
		} finally {
			listLoadingMore = false;
		}
	}

	async function loadSelf() {
		const reply = await call(ctx, false, 'me');
		if (reply.ok && Array.isArray(reply.permissions)) {
			heldPermissions = new Set(reply.permissions.map(String));
			myPrincipal = String(reply.user?.id ?? '');
		} else {
			console.warn('me:', reply.error);
		}
	}

	/** Profiles with their permissions; only a holder of db.export can read them. */
	async function loadProfiles() {
		if (!holds('db.export')) return;
		profilesLoading = true;
		try {
			const res = await readPages(ctx, 'realm_export', 'rows', { entity: 'UserProfile' });
			if (res.error) {
				console.warn('realm_export:', res.error);
				return;
			}
			profileRows = res.rows
				.filter((row) => row?.id)
				.map((row) => ({
					name: String(row.id),
					description: String(row.description ?? ''),
					allowed_to: Array.isArray(row.allowed_to) ? row.allowed_to.map(String) : [],
				}))
				.sort((a, b) => a.name.localeCompare(b.name));
		} finally {
			profilesLoading = false;
		}
	}

	/** The permission catalog: each permission with the operations it allows. */
	async function loadOperations() {
		const reply = await call(ctx, false, 'ops_list');
		if (!reply.ok) {
			console.warn('ops_list:', reply.error);
			return;
		}
		const byPerm = new Map<string, string[]>();
		for (const op of Array.isArray(reply.operations) ? reply.operations : []) {
			const perm = typeof op?.perm === 'string' ? op.perm : '';
			if (!perm || op.public) continue;
			byPerm.set(perm, [...(byPerm.get(perm) ?? []), String(op.name)]);
		}
		opCatalog = [
			{ name: 'all', category: 'all', description: 'Every permission: full administrative access.' },
			...[...byPerm.keys()].sort().map((perm) => ({
				name: perm,
				category: perm.split('.')[0],
				description: `Allows ${byPerm.get(perm)!.join(', ')}`,
			})),
		];
	}

	async function viewUser(user: UserEntry) {
		selectedUser = user;
		view = 'detail';
		detailLoading = true;
		try {
			const reply = await call(ctx, false, 'user_get', { user: user.principal });
			if (reply.ok && reply.user) selectedUser = toUser(reply.user);
			else if (!reply.ok) console.warn('user_get:', reply.error);
		} finally {
			detailLoading = false;
		}
	}

	async function refreshAfterRoleChange() {
		if (selectedUser) await viewUser(selectedUser);
		await loadUsers();
	}

	// When set, the confirmation modal is shown before a governance proposal
	// is created. `reason` explains why the direct change is not possible.
	let proposeConfirm: { action: 'assign' | 'revoke'; profileName: string; reason: string } | null = $state(null);

	async function handleAssign() {
		if (!selectedUser || !assignProfileName) return;
		error = '';
		accessDeniedOp = '';
		successMsg = '';

		if (!callerCanAssign) {
			proposeConfirm = {
				action: 'assign',
				profileName: assignProfileName,
				reason: 'You do not have the role.assign permission, so this assignment must be approved by a governance vote.',
			};
			return;
		}

		assignLoading = true;
		try {
			const profileName = assignProfileName;
			const reply = await call(ctx, true, 'role_assign', { user: selectedUser.principal, profile: profileName });
			if (reply.ok) {
				successMsg = outcome(reply, `Profile "${profileName}" assigned`);
				assignProfileName = '';
				view = 'detail';
				await refreshAfterRoleChange();
			} else if (refusedPermission(reply.error, '') === 'role.assign') {
				proposeConfirm = {
					action: 'assign',
					profileName,
					reason: 'You do not have the role.assign permission, so this assignment must be approved by a governance vote.',
				};
			} else {
				error = reply.error || 'The profile could not be assigned.';
			}
		} finally {
			assignLoading = false;
		}
	}

	async function handleRevoke(profileName: string) {
		if (!selectedUser) return;
		error = '';
		accessDeniedOp = '';
		successMsg = '';
		const reply = await call(ctx, true, 'role_revoke', { user: selectedUser.principal, profile: profileName });
		if (reply.ok) {
			successMsg = outcome(reply, `Profile "${profileName}" revoked`);
			await refreshAfterRoleChange();
		} else if (refusedPermission(reply.error, '') === 'role.revoke') {
			proposeConfirm = {
				action: 'revoke',
				profileName,
				reason: 'You do not have the role.revoke permission, so this revocation must be approved by a governance vote.',
			};
		} else {
			error = reply.error || 'The profile could not be revoked.';
		}
	}

	function selectProfile(profile: ProfileView) {
		selectedProfileName = profile.name;
		profilePermFilter = '';
		profileCategoryFilter = 'all';
		profileGrantedOnly = false;
		profilePendingGrants = new Set();
		profilePendingRevokes = new Set();
		pendingAllGrant = false;
	}

	function profileOpCurrentlyGranted(opName: string): boolean {
		return (selectedProfile?.allowed_to ?? []).includes(opName);
	}

	function profileRowMatchesGrantedOnly(opName: string): boolean {
		if (!selectedProfile) return false;
		if (profilePendingGrants.has(opName)) return true;
		if (profilePendingRevokes.has(opName)) return true;
		return profileOpCurrentlyGranted(opName);
	}

	function profileCategoryGrantedCount(category: string): number {
		if (!selectedProfile) return 0;
		return allOperations
			.filter((op) => op.category === category)
			.filter((op) => isProfilePermChecked(op.name)).length;
	}

	function profileCategoryTotalCount(category: string): number {
		return allOperations.filter((op) => op.category === category).length;
	}

	function toggleProfilePerm(opName: string) {
		if (!selectedProfile || !callerCanEditProfiles) return;
		const isGranted = profileOpCurrentlyGranted(opName);

		if (isGranted) {
			if (profilePendingRevokes.has(opName)) {
				profilePendingRevokes = new Set([...profilePendingRevokes].filter((n) => n !== opName));
			} else {
				profilePendingRevokes = new Set([...profilePendingRevokes, opName]);
				profilePendingGrants = new Set([...profilePendingGrants].filter((n) => n !== opName));
			}
		} else if (profilePendingGrants.has(opName)) {
			profilePendingGrants = new Set([...profilePendingGrants].filter((n) => n !== opName));
		} else if (opName === 'all') {
			pendingAllGrant = true;
		} else {
			profilePendingGrants = new Set([...profilePendingGrants, opName]);
			profilePendingRevokes = new Set([...profilePendingRevokes].filter((n) => n !== opName));
		}
	}

	function confirmAllGrant() {
		profilePendingGrants = new Set([...profilePendingGrants, 'all']);
		profilePendingRevokes = new Set([...profilePendingRevokes].filter((n) => n !== 'all'));
		pendingAllGrant = false;
	}

	function discardProfilePermChanges() {
		profilePendingGrants = new Set();
		profilePendingRevokes = new Set();
	}

	function isProfilePermChecked(opName: string): boolean {
		if (!selectedProfile) return false;
		if (profilePendingGrants.has(opName)) return true;
		if (profilePendingRevokes.has(opName)) return false;
		return profileOpCurrentlyGranted(opName);
	}

	function profilePermState(opName: string): string {
		if (!selectedProfile) return 'none';
		if (profilePendingGrants.has(opName)) return 'pending-grant';
		if (profilePendingRevokes.has(opName)) return 'pending-revoke';
		if ((selectedProfile.allowed_to ?? []).includes(opName)) return 'granted';
		return 'none';
	}

	async function applyProfilePermChanges() {
		const profile = selectedProfile;
		if (!profile?.allowed_to) return;
		const toGrant = [...profilePendingGrants];
		const toRevoke = [...profilePendingRevokes];
		if (toGrant.length === 0 && toRevoke.length === 0) return;

		error = '';
		accessDeniedOp = '';
		successMsg = '';
		if (toRevoke.includes('all') && !profilesList.some((p) => p.name !== profile.name && (p.allowed_to ?? []).includes('all'))) {
			error = 'This change would leave the realm with no profile holding full administrative access.';
			return;
		}
		const allowedTo = [...new Set([...profile.allowed_to.filter((p) => !toRevoke.includes(p)), ...toGrant])].sort();

		profilePermApplying = true;
		try {
			const reply = await call(ctx, true, 'profile_edit', { profile: profile.name, allowed_to: allowedTo });
			if (!reply.ok) {
				showFailure(reply, 'permission.grant', 'The profile could not be updated.');
				return;
			}
			successMsg = outcome(reply, `${toGrant.length} granted, ${toRevoke.length} revoked on profile "${profile.name}"`);
			profilePendingGrants = new Set();
			profilePendingRevokes = new Set();
			await loadProfiles();
		} finally {
			profilePermApplying = false;
		}
	}

	async function handlePropose() {
		if (!selectedUser || !proposeConfirm) return;
		const { action, profileName } = proposeConfirm;
		const target = selectedUser.principal;
		const who = selectedUser.nickname || truncatePrincipal(target);
		assignLoading = true;
		error = '';
		accessDeniedOp = '';
		successMsg = '';
		try {
			const reply = await call(ctx, true, 'proposal_create', {
				title: action === 'assign' ? `Assign profile "${profileName}" to ${who}` : `Revoke profile "${profileName}" from ${who}`,
				description: `${action === 'assign' ? 'Give' : 'Take away'} the "${profileName}" profile ${action === 'assign' ? 'to' : 'from'} ${target}.`,
				action: { op: action === 'assign' ? 'role_assign' : 'role_revoke', args: { user: target, profile: profileName } },
			});
			proposeConfirm = null;
			if (reply.ok) {
				successMsg = reply.proposal
					? `Proposal ${reply.proposal} created. Members can vote on it in Voting.`
					: 'Proposal created. Members can vote on it in Voting.';
				if (action === 'assign') {
					assignProfileName = '';
					view = 'detail';
				}
			} else {
				showFailure(reply, 'proposal.create', 'The proposal could not be created.');
			}
		} finally {
			assignLoading = false;
		}
	}

	function truncatePrincipal(id: string): string {
		if (!id || id.length <= 16) return id || 'unknown';
		return id.slice(0, 8) + '...' + id.slice(-6);
	}

	function profileColor(name: string): string {
		const colors: Record<string, string> = {
			admin: 'bg-red-100 text-red-700',
			member: 'bg-blue-100 text-blue-700',
			observer: 'bg-gray-100 text-gray-600',
			legislator: 'bg-purple-100 text-purple-700',
			executor: 'bg-amber-100 text-amber-700',
			judge: 'bg-indigo-100 text-indigo-700',
			enforcer: 'bg-orange-100 text-orange-700',
			treasurer: 'bg-emerald-100 text-emerald-700',
			merchant: 'bg-cyan-100 text-cyan-700',
			operator: 'bg-teal-100 text-teal-700',
			developer: 'bg-violet-100 text-violet-700',
			user_manager: 'bg-pink-100 text-pink-700',
		};
		return colors[name] || 'bg-gray-100 text-gray-700';
	}

	onMount(() => {
		void (async () => {
			await loadSelf();
			await Promise.all([loadUsers(), loadProfiles(), loadOperations()]);
		})();
	});
</script>

<style>
	.chrome-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 6px 12px;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 6px;
		border: 1px solid #d1d5db;
		background: #fff;
		color: #374151;
		cursor: pointer;
		flex-shrink: 0;
	}

	.chrome-tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		white-space: nowrap;
	}

	.chrome-tab.is-on {
		border-bottom-color: #111827;
		color: #111827;
	}

	.chrome-btn.is-on {
		background: #111827;
		color: #fff;
		border-color: #111827;
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

		.chrome-tab {
			width: 40px;
			justify-content: center;
			padding: 10px 0;
		}
	}
</style>

<div class="w-full px-3 pt-4 sm:px-6 sm:pt-8 max-w-none">
	<!-- Header: title on its own row -->
	<div class="flex flex-col gap-2 mb-4 sm:mb-6">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 mb-1">Users</h1>
			<p class="text-gray-500 text-sm">{extensionDescription}</p>
		</div>
		<button
			type="button"
			onclick={toggleHelp}
			class="chrome-btn self-start"
			title="How permissions work"
			aria-label="How permissions work"
			aria-pressed={showHelp}
			class:is-on={showHelp}
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			<span class="chrome-label">Help</span>
		</button>
	</div>

	<!-- Tabs: icon-only on a narrow viewport -->
	<div class="border-b border-gray-200 mb-6 overflow-x-auto">
		<nav class="flex">
			<button
				type="button"
				onclick={() => { activeTab = 'people'; view = 'users'; }}
				class="chrome-tab {activeTab === 'people' ? 'is-on' : ''}"
				title="People"
				aria-label="People"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
				<span class="chrome-label">People</span>
			</button>
			<button
				type="button"
				onclick={() => { activeTab = 'profiles'; view = 'profiles'; loadProfiles(); }}
				class="chrome-tab {activeTab === 'profiles' ? 'is-on' : ''}"
				title="Profiles"
				aria-label="Profiles"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>
				<span class="chrome-label">Profiles</span>
			</button>
			<button
				type="button"
				onclick={() => { activeTab = 'invitations'; }}
				class="chrome-tab {activeTab === 'invitations' ? 'is-on' : ''}"
				title="Invitations"
				aria-label="Invitations"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
				<span class="chrome-label">Invitations</span>
			</button>
			<button
				type="button"
				onclick={() => { activeTab = 'extensions'; }}
				class="chrome-tab {activeTab === 'extensions' ? 'is-on' : ''}"
				title="Extension Access"
				aria-label="Extension Access"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
				<span class="chrome-label">Extension Access</span>
			</button>
		</nav>
	</div>

	{#if activeTab === 'invitations'}
		<InvitationManager {ctx} profileNames={profiles.map((p) => p.name)} />
	{:else if activeTab === 'extensions'}
		<ExtensionAccess {ctx} />
	{:else}

	{#if showHelp}
		<div class="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
			<div class="flex items-start justify-between">
				<div>
					<h3 class="font-semibold mb-2">How permissions work</h3>
					<ul class="space-y-1.5 text-blue-700">
						<li><strong>Assign Profile</strong> applies directly when you hold <code class="bg-blue-100 px-1 rounded">role.assign</code> and realm policy allows it; otherwise it creates a governance proposal after your confirmation.</li>
						<li><strong>Revoke Profile</strong> requires <code class="bg-blue-100 px-1 rounded">role.revoke</code>.</li>
						<li><strong>Permissions</strong> are granted through profiles: edit a profile's permissions in the <strong>Profiles</strong> tab (requires <code class="bg-blue-100 px-1 rounded">permission.grant</code>).</li>
						<li><strong>You can only grant permissions you hold yourself.</strong> A profile you assign or edit may hold only permissions you hold.</li>
						<li>When the realm's policy requires a vote, a change is submitted as a proposal instead of applied at once.</li>
					</ul>
				</div>
				<button onclick={() => { showHelp = false; persistSessionFlag(HELP_KEY, false); }} class="text-blue-400 hover:text-blue-600 ml-3 flex-shrink-0">&times;</button>
			</div>
		</div>
	{/if}

	<!-- Governance vote confirmation modal -->
	{#if proposeConfirm}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
			<div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Governance vote required</h3>
				<p class="text-sm text-gray-600 mb-3">{proposeConfirm.reason}</p>
				<div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
					{proposeConfirm.action === 'assign' ? 'Assign' : 'Revoke'} "{proposeConfirm.profileName}"
					{proposeConfirm.action === 'assign' ? 'to' : 'from'}
					{selectedUser?.nickname || truncatePrincipal(selectedUser?.principal || '')}
				</div>
				<p class="text-sm text-gray-600 mb-4">Create a proposal? Members will vote on it in <strong>Voting</strong>.</p>
				<div class="flex justify-end gap-3">
					<button
						onclick={() => (proposeConfirm = null)}
						disabled={assignLoading}
						class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
					>
						Cancel
					</button>
					<button
						onclick={handlePropose}
						disabled={assignLoading}
						class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-40"
					>
						{#if assignLoading}
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						{/if}
						Create proposal
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Banners -->
	{#if accessDeniedOp}
		<AccessDenied operation={accessDeniedOp} />
	{:else if error}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
			<svg class="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			<span class="flex-1">{error}</span>
			<button onclick={() => error = ''} class="ml-auto text-red-400 hover:text-red-600">&times;</button>
		</div>
	{/if}
	{#if successMsg}
		<div class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
			<svg class="w-5 h-5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
			<span>{successMsg}</span>
			<button onclick={() => successMsg = ''} class="ml-auto text-green-400 hover:text-green-600">&times;</button>
		</div>
	{/if}

	<!-- User Detail View -->
	{#if view === 'detail' && selectedUser}
		<button onclick={() => { view = 'users'; selectedUser = null; successMsg = ''; }} class="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-1">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
			Back to users
		</button>

		<div class="space-y-5">
			<!-- User info -->
			<div class="bg-white p-0 sm:p-5 sm:rounded-lg sm:border sm:border-gray-200">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
					<div>
						<h2 class="text-xl font-bold text-gray-900">{selectedUser.nickname || 'Unnamed User'}</h2>
						<code class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded break-all">{selectedUser.principal}</code>
					</div>
					<div class="flex flex-wrap gap-2">
						<button
							onclick={() => { view = 'assign'; assignProfileName = ''; }}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
							Assign Profile
						</button>
						<button
							disabled
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							title="Permissions are granted through profiles (Profiles tab)"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
							Manage Permissions
						</button>
					</div>
				</div>

				<!-- Current profiles -->
				<h3 class="text-sm font-semibold text-gray-700 mb-2">Assigned Profiles</h3>
				{#if selectedUser.profiles.length === 0}
					<p class="text-sm text-gray-400 italic">No profiles assigned</p>
				{:else}
					<div class="flex flex-wrap gap-2 mb-4">
						{#each selectedUser.profiles as profile}
							<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold {profileColor(profile)}">
								{profile}
								{#if callerCanRevoke}
									<button
										onclick={() => handleRevoke(profile)}
										class="ml-0.5 opacity-60 hover:opacity-100"
										title="Revoke profile"
									>
										<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
									</button>
								{/if}
							</span>
						{/each}
					</div>
				{/if}

				<p class="text-xs text-gray-500 mt-3">Individual permissions are granted through profiles; edit them in the Profiles tab.</p>
			</div>

			<!-- Permissions held through profiles -->
			<div class="rounded-lg border border-gray-200 bg-white p-5">
				<h3 class="text-base font-semibold text-gray-900 mb-1">Permissions{#if userPermissions} ({userPermissions.length}){/if}</h3>
				{#if selectedUser.principal !== myPrincipal}
					<p class="text-xs text-gray-500 mb-3">From assigned profiles; seats in departments may add more.</p>
				{/if}
				{#if detailLoading || (profilesLoading && !userPermissions)}
					<div class="flex items-center gap-2 text-gray-400 text-sm">
						<div class="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
						Loading...
					</div>
				{:else if !userPermissions}
					<p class="text-sm text-gray-400">Profile permissions are not visible with your access.</p>
				{:else if userPermissions.length === 0}
					<p class="text-sm text-gray-400">No permissions</p>
				{:else}
					<div class="flex flex-wrap gap-1.5">
						{#each userPermissions as op}
							<code class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{op}</code>
						{/each}
					</div>
				{/if}
			</div>
		</div>

	<!-- Assign Profile Dialog -->
	{:else if view === 'assign' && selectedUser}
		<button onclick={() => { view = 'detail'; }} class="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-1">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
			Back to user detail
		</button>

		<div class="rounded-lg border border-gray-200 bg-white p-6 max-w-lg">
			<h2 class="text-xl font-semibold text-gray-900 mb-1">Assign Profile</h2>
			<p class="text-sm text-gray-500 mb-4">Assign a profile to <strong>{selectedUser.nickname || truncatePrincipal(selectedUser.principal)}</strong></p>

			<div class="mb-4">
				<label for="profile-select" class="block text-sm font-medium text-gray-700 mb-1">Profile</label>
				<select
					id="profile-select"
					bind:value={assignProfileName}
					class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
				>
					<option value="">Select a profile...</option>
					{#each profiles.filter(p => !selectedUser?.profiles.includes(p.name)) as profile}
						<option value={profile.name}>{profile.name}</option>
					{/each}
				</select>
			</div>

			{#if assignProfileName && assignProfilePerms}
				<div class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
					<h4 class="text-xs font-semibold text-gray-600 mb-1">Permissions granted by "{assignProfileName}":</h4>
					<div class="flex flex-wrap gap-1">
						{#each assignProfilePerms as op}
							<code class="px-1.5 py-0.5 text-xs bg-white border rounded text-gray-600">{op}</code>
						{/each}
					</div>
				</div>
			{/if}

			<button
				onclick={handleAssign}
				disabled={assignLoading || !assignProfileName}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
			>
				{#if assignLoading}
					<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
				{/if}
				Assign
			</button>
			<p class="mt-2 text-xs text-gray-500">
				Applied directly when you are allowed to; otherwise a governance proposal is created (after your confirmation).
			</p>
		</div>

	<!-- Profiles View -->
	{:else if view === 'profiles'}

		{#if pendingAllGrant}
			<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
				<div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border-2 border-red-300">
					<h3 class="text-lg font-semibold text-red-700 mb-2">Grant unrestricted admin access?</h3>
					<p class="text-sm text-gray-600 mb-3">
						The <code class="bg-red-50 text-red-700 px-1 rounded">all</code> operation grants unrestricted administrative access to every user with this profile.
					</p>
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
						Grant <strong>all</strong> on profile <strong>{selectedProfile?.name}</strong>
						{#if selectedProfile?.user_count}
							— affects {selectedProfile.user_count} user{selectedProfile.user_count !== 1 ? 's' : ''}
						{/if}
					</div>
					<div class="flex justify-end gap-3">
						<button
							onclick={() => (pendingAllGrant = false)}
							class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
						>
							Cancel
						</button>
						<button
							onclick={confirmAllGrant}
							class="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
						>
							Grant all
						</button>
					</div>
				</div>
			</div>
		{/if}

		<div class="flex gap-5">
			<!-- Profile list sidebar -->
			<div class="w-56 flex-shrink-0">
				<h2 class="text-lg font-semibold text-gray-900 mb-3">Profiles</h2>
				{#if profilesLoading}
					<div class="flex items-center gap-2 text-gray-400 text-sm py-4">
						<div class="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
						Loading...
					</div>
				{:else}
					<div class="space-y-1">
						{#each profilesList as profile}
							<button
								onclick={() => selectProfile(profile)}
								class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors {selectedProfile?.name === profile.name ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}"
							>
								<div class="font-medium">{profile.name}</div>
								<div class="text-xs text-gray-400 mt-0.5">{profile.user_count} user{profile.user_count !== 1 ? 's' : ''}{#if profile.allowed_to} &middot; {profile.allowed_to.length} permission{profile.allowed_to.length !== 1 ? 's' : ''}{/if}</div>
							</button>
						{/each}
					</div>
					{#if listHasMore}
						<p class="text-xs text-gray-400 mt-2 px-3">User counts cover the members loaded in People.</p>
					{/if}
				{/if}
			</div>

			<!-- Profile detail -->
			<div class="flex-1 min-w-0">
				{#if selectedProfile}
					<div class="rounded-lg border border-gray-200 bg-white">
						<div class="px-5 py-4 border-b border-gray-200">
							<h3 class="text-lg font-semibold text-gray-900">{selectedProfile.name}</h3>
							{#if selectedProfile.description}
								<p class="text-sm text-gray-500 mt-0.5">{selectedProfile.description}</p>
							{/if}
							{#if selectedProfile.allowed_to && !callerCanEditProfiles}
								<p class="text-xs text-gray-500 mt-2">Changing a profile's permissions requires <code>permission.grant</code>.</p>
							{/if}
						</div>

						{#if !selectedProfile.allowed_to}
							<p class="px-5 py-8 text-center text-sm text-gray-400">This profile's permissions are not visible with your access.</p>
						{:else}
						<!-- Summary -->
						<div class="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
							<div class="text-sm text-gray-700">
								<span class="font-semibold">{selectedProfile.allowed_to.length}</span> granted
							</div>
							{#if hasProfilePendingChanges}
								<div class="flex items-center gap-2">
									<span class="text-xs text-gray-500">
										{#if profilePendingGrants.size > 0}<span class="text-green-600 font-medium">+{profilePendingGrants.size}</span>{/if}
										{#if profilePendingGrants.size > 0 && profilePendingRevokes.size > 0}&nbsp;/&nbsp;{/if}
										{#if profilePendingRevokes.size > 0}<span class="text-red-600 font-medium">-{profilePendingRevokes.size}</span>{/if}
									</span>
									<button
										onclick={discardProfilePermChanges}
										class="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
									>Discard</button>
									<button
										onclick={applyProfilePermChanges}
										disabled={profilePermApplying}
										class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-900 text-white font-medium hover:bg-black disabled:opacity-40"
									>
										{#if profilePermApplying}
											<div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										{/if}
										Apply
										{#if selectedProfile.user_count != null}
											<span class="text-gray-300 font-normal">· affects {selectedProfile.user_count} user{selectedProfile.user_count !== 1 ? 's' : ''}</span>
										{/if}
									</button>
								</div>
							{/if}
						</div>

						<!-- Filters -->
						<div class="px-5 py-3 border-b border-gray-200 space-y-3">
							<input
								type="text"
								bind:value={profilePermFilter}
								placeholder="Filter by name, category, or description..."
								aria-label="Filter profile permissions"
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
							/>
							<div class="flex items-center gap-2 flex-wrap">
								<span class="text-xs font-medium text-gray-500">Category:</span>
								<button
									onclick={() => (profileCategoryFilter = 'all')}
									class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors {profileCategoryFilter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
								>All</button>
								{#each profileOperationCategories as category (category)}
									<button
										onclick={() => (profileCategoryFilter = category)}
										class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors {profileCategoryFilter === category ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
									>{category}</button>
								{/each}
							</div>
							<label class="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
								<input
									type="checkbox"
									bind:checked={profileGrantedOnly}
									class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
								/>
								Granted only
							</label>
						</div>

						<!-- Permission catalog -->
						<div class="max-h-[480px] overflow-y-auto">
							{#each Object.entries(filteredProfileOperations()) as [category, ops] (category)}
								<div class="border-b border-gray-100 last:border-b-0">
									<div class="px-5 py-2 bg-gray-50 sticky top-0 z-10 flex items-center justify-between">
										<h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{category}</h4>
										<span class="text-xs text-gray-400">{profileCategoryGrantedCount(category)} / {profileCategoryTotalCount(category)}</span>
									</div>
									{#each ops as op (op.name)}
										{@const state = profilePermState(op.name)}
										{@const checked = isProfilePermChecked(op.name)}
										{@const isAll = op.name === 'all'}
										<label
											class="flex items-start gap-3 px-5 py-2.5 transition-colors {callerCanEditProfiles ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}
												{state === 'pending-grant' ? 'bg-green-50' : state === 'pending-revoke' ? 'bg-red-50' : ''}
												{isAll ? 'border-l-4 border-red-400 bg-red-50/30' : ''}"
										>
											<input
												type="checkbox"
												checked={checked}
												disabled={!callerCanEditProfiles}
												onchange={() => toggleProfilePerm(op.name)}
												class="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 {isAll ? 'border-red-400' : ''}"
											/>
											<div class="flex-1 min-w-0">
												<div class="flex items-center gap-2 flex-wrap">
													<code class="text-sm font-medium {isAll ? 'text-red-700' : 'text-gray-900'}">{op.name}</code>
													{#if isAll}
														<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">DANGEROUS</span>
													{/if}
													{#if state === 'pending-grant'}
														<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700">WILL GRANT</span>
													{:else if state === 'pending-revoke'}
														<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">WILL REVOKE</span>
													{:else if state === 'granted'}
														<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">GRANTED</span>
													{/if}
												</div>
												{#if op.description}
													<p class="text-xs text-gray-500 mt-0.5">{op.description}</p>
												{/if}
											</div>
										</label>
									{/each}
								</div>
							{:else}
								<div class="text-center py-8 text-sm text-gray-400">
									{profilePermFilter || profileGrantedOnly || profileCategoryFilter !== 'all' ? 'No permissions match your filters' : 'No permissions listed'}
								</div>
							{/each}
						</div>
						{/if}

					</div>
				{:else}
					<div class="flex items-center justify-center py-16 text-gray-400 text-sm">
						Select a profile from the list to manage its permissions
					</div>
				{/if}
			</div>
		</div>

	<!-- Users List View (default) -->
	{:else}
		<div class="bg-white border-y border-gray-200 sm:rounded-lg sm:border">
			<!-- Toolbar: search wins width; refresh is icon-only on narrow -->
			<div class="flex items-center gap-2 px-3 py-3 sm:px-5 border-b border-gray-200">
				<div class="flex-1 min-w-0">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder={narrow ? 'Search users…' : 'Search by principal, nickname, or profile...'}
						class="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
					/>
				</div>
			<button
				type="button"
				onclick={loadUsers}
				disabled={loading}
				class="chrome-btn"
				title={loading ? 'Loading' : 'Refresh'}
				aria-label={loading ? 'Loading' : 'Refresh'}
			>
				{#if loading}
					<div class="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
				{:else}
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
				{/if}
				<span class="chrome-label">{loading ? 'Loading…' : 'Refresh'}</span>
			</button>
			</div>

			<!-- Content -->
			{#if loading}
				<div class="flex items-center justify-center py-12">
					<svg class="animate-spin h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
					<span class="ml-3 text-gray-500 text-sm">Loading users...</span>
				</div>
			{:else if filteredUsers.length === 0}
				<div class="text-center py-12">
					<svg class="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
					<p class="text-gray-500 text-sm">{searchQuery ? 'No users match your search' : 'No users found'}</p>
				</div>
			{:else}
				<div class="divide-y divide-gray-100">
					{#each filteredUsers as user}
						<div class="px-5 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<span class="text-sm font-medium text-gray-900 truncate">{user.nickname || 'Unnamed'}</span>
									<code class="text-xs text-gray-400">{truncatePrincipal(user.principal)}</code>
								</div>
								<div class="flex flex-wrap gap-1.5">
									{#each user.profiles as profile}
										<span class="px-2 py-0.5 rounded-full text-xs font-semibold {profileColor(profile)}">{profile}</span>
									{/each}
									{#if user.profiles.length === 0}
										<span class="text-xs text-gray-400 italic">no profiles</span>
									{/if}
								</div>
							</div>
							<button
								onclick={() => viewUser(user)}
								class="ml-3 p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
								title="View user details"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Footer -->
			<div class="px-5 py-3 border-t border-gray-200 flex items-center justify-between gap-3">
				<span class="text-xs text-gray-400">
					{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
					{#if searchQuery}&nbsp;(filtered){/if}
					{#if listHasMore && !searchQuery}&nbsp;· more available{/if}
				</span>
				{#if listHasMore && !searchQuery}
					<button
						onclick={loadMoreUsers}
						disabled={listLoadingMore}
						class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
					>
						{#if listLoadingMore}
							<div class="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
							Loading...
						{:else}
							Load more
						{/if}
					</button>
				{/if}
			</div>
		</div>
	{/if}

	{/if}
</div>
