<script lang="ts">
	interface Props {
		show: boolean;
		projectId: string;
		inviteEmail: string;
		inviteRole: string;
		inviteStatus: 'idle' | 'sending' | 'success' | 'error';
		inviteError: string;
		onClose: () => void;
		onInvite: (email: string, role: string) => void;
		onEmailChange: (email: string) => void;
		onRoleChange: (role: string) => void;
	}

	let {
		show = $bindable(),
		projectId,
		inviteEmail = $bindable(),
		inviteRole = $bindable(),
		inviteStatus,
		inviteError,
		onClose,
		onInvite,
		onEmailChange,
		onRoleChange
	}: Props = $props();

	function handleSubmit(e: Event) {
		e.preventDefault();
		onInvite(inviteEmail, inviteRole);
	}

	function handleEmailInput(e: Event) {
		const target = e.target as HTMLInputElement;
		onEmailChange(target.value);
	}

	function handleRoleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		onRoleChange(target.value);
	}
</script>

{#if show}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
					Invite Collaborator
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

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label
						for="invite-email"
						class="block text-sm font-medium text-slate-700 dark:text-slate-300"
					>
						Email Address
					</label>
					<input
						id="invite-email"
						type="email"
						class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
						placeholder="Enter email address"
						value={inviteEmail}
						oninput={handleEmailInput}
						required
					/>
				</div>

				<div>
					<label
						for="invite-role"
						class="block text-sm font-medium text-slate-700 dark:text-slate-300"
					>
						Role
					</label>
					<select
						id="invite-role"
						class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
						value={inviteRole}
						onchange={handleRoleChange}
					>
						<option value="Member">Member</option>
						<option value="Admin">Admin</option>
					</select>
				</div>

				{#if inviteStatus === 'error'}
					<div
						class="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
					>
						{inviteError}
					</div>
				{:else if inviteStatus === 'success'}
					<div
						class="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400"
					>
						Invitation sent successfully!
					</div>
				{/if}

				<div class="flex gap-3">
					<button
						type="button"
						onclick={onClose}
						class="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={inviteStatus === 'sending' || !inviteEmail}
						class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
					>
						{inviteStatus === 'sending' ? 'Sending...' : 'Send Invite'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
