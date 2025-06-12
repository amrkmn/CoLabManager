<script lang="ts">
	import { cn } from '$lib/utils/style';

	interface Member {
		id: string;
		name: string;
		email: string;
		role: string;
		profilePictureUrl?: string;
	}

	interface Props {
		show: boolean;
		members: Member[];
		onClose: () => void;
		onRemoveMember: (memberId: string) => void;
	}

	let {
		show = $bindable(),
		members,
		onClose,
		onRemoveMember
	}: Props = $props();

	function getAvatarUrl(member: Member) {
		return (
			member.profilePictureUrl ||
			`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`
		);
	}
</script>

{#if show}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
					Project Members ({members.length})
				</h3>
				<button
					onclick={onClose}
					class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
					aria-label="Close modal"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="space-y-3">
				{#each members as member (member.id)}
					<div
						class="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-600"
					>
						<div class="flex items-center gap-3">
							<img
								src={getAvatarUrl(member)}
								alt={member.name}
								class="h-10 w-10 rounded-full object-cover"
							/>
							<div>
								<div class="font-medium text-slate-900 dark:text-slate-100">
									{member.name}
								</div>
								<div class="text-sm text-slate-600 dark:text-slate-400">
									{member.email}
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span
								class={cn(
									'rounded-full px-2 py-1 text-xs font-medium',
									member.role === 'Admin'
										? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
										: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
								)}
							>
								{member.role}
							</span>
							{#if member.role !== 'Admin'}
								<button
									onclick={() => onRemoveMember(member.id)}
									class="rounded-md p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
									title="Remove member"
									aria-label="Remove member"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class="mt-4 flex justify-end">
				<button
					onclick={onClose}
					class="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
