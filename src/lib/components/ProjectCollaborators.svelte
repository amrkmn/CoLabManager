<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils/style';
	import { onMount } from 'svelte';
	import InviteCollaboratorModal from './modals/InviteCollaboratorModal.svelte';
	import ProjectMembersModal from './modals/ProjectMembersModal.svelte';

	const projectId = $derived(page.params.id);
	let members = $state<any[]>([]);
	let isLoadingMembers = $state(false);
	let membersError = $state('');
	let showInviteModal = $state(false);
	let showMembersModal = $state(false);
	let inviteEmail = $state('');
	let inviteRole = $state('Member');
	let inviteStatus = $state<'idle' | 'sending' | 'success' | 'error'>('idle');
	let inviteError = $state('');

	onMount(() => {
		if (projectId) loadMembers();
	});

	async function loadMembers() {
		isLoadingMembers = true;
		membersError = '';
		try {
			const res = await fetch(`/api/projects/${projectId}/members`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Failed to load members');
			members = data.members.map((m: any) => ({ ...m.user, role: m.role }));
		} catch (err) {
			membersError = err instanceof Error ? err.message : 'Failed to load members';
		} finally {
			isLoadingMembers = false;
		}
	}
	async function inviteUser(email: string, role: string) {
		inviteStatus = 'sending';
		inviteError = '';
		try {
			const res = await fetch(`/api/projects/${projectId}/members`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, role })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Failed to invite user');
			inviteStatus = 'success';
			inviteEmail = '';
			loadMembers();
			setTimeout(() => {
				showInviteModal = false;
				inviteStatus = 'idle';
			}, 1500);
		} catch (err) {
			inviteStatus = 'error';
			inviteError = err instanceof Error ? err.message : 'Failed to invite user';
		}
	}

	function handleEmailChange(email: string) {
		inviteEmail = email;
	}

	function handleRoleChange(role: string) {
		inviteRole = role;
	}

	function closeInviteModal() {
		showInviteModal = false;
		inviteStatus = 'idle';
		inviteError = '';
	}

	function closeMembersModal() {
		showMembersModal = false;
	}
	async function removeMember(memberId: string) {
		if (!confirm('Are you sure you want to remove this member from the project?')) {
			return;
		}

		try {
			const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message || 'Failed to remove member');
			}

			loadMembers();
		} catch (err) {
			console.error('Failed to remove member:', err);
			alert(err instanceof Error ? err.message : 'Failed to remove member');
		}
	}

	function getAvatarUrl(member: any) {
		return (
			member.profilePictureUrl ||
			`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`
		);
	}
</script>

<!-- Minimal collaborators display -->
<div class="flex items-center gap-3">
	<!-- Collaborator avatars -->
	<div class="flex -space-x-2">
		{#if isLoadingMembers}
			<div class="h-8 w-8 animate-pulse rounded-full bg-slate-300"></div>
		{:else if members.length > 0}
			{#each members.slice(0, 4) as member (member.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<img
					src={getAvatarUrl(member)}
					alt={member.name}
					class="h-8 w-8 cursor-pointer rounded-full border-2 border-white object-cover transition-transform hover:scale-110"
					title="{member.name} ({member.role})"
					onclick={() => (showMembersModal = true)}
				/>
			{/each}
			{#if members.length > 4}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-slate-500 text-xs font-medium text-white transition-transform hover:scale-110"
					onclick={() => (showMembersModal = true)}
					title="View all members"
				>
					+{members.length - 4}
				</div>
			{/if}
		{:else}
			<div class="text-sm text-slate-500">No collaborators</div>
		{/if}
	</div>

	<!-- Invite button -->
	<button
		onclick={() => (showInviteModal = true)}
		class={cn(
			'flex items-center gap-1 rounded-md px-3 py-1 text-sm transition',
			'border border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-700',
			'dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-300'
		)}
	>
		<span class="text-lg">+</span>
		<span>Invite</span>
	</button>
</div>

<!-- Modals -->
<InviteCollaboratorModal
	bind:show={showInviteModal}
	{projectId}
	bind:inviteEmail
	bind:inviteRole
	{inviteStatus}
	{inviteError}
	onClose={closeInviteModal}
	onInvite={inviteUser}
	onEmailChange={handleEmailChange}
	onRoleChange={handleRoleChange}
/>

<ProjectMembersModal
	bind:show={showMembersModal}
	{members}
	onClose={closeMembersModal}
	onRemoveMember={removeMember}
/>
