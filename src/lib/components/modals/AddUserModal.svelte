<script lang="ts">
	interface User {
		id: string;
		name: string;
		email: string;
		contactNumber: string;
		role: 'User' | 'Admin';
		createdAt: string;
		avatar?: string;
	}

	interface UserForm {
		name: string;
		email: string;
		contactNumber: string;
		role: 'User' | 'Admin';
		password: string;
	}

	// Props
	let {
		show = $bindable(false),
		editingUser = $bindable<User | null>(null),
		userForm = $bindable<UserForm>({
			name: '',
			email: '',
			contactNumber: '',
			role: 'User',
			password: ''
		}),
		isLoading = false,
		onSubmit,
		onClose
	}: {
		show: boolean;
		editingUser: User | null;
		userForm: UserForm;
		isLoading?: boolean;
		onSubmit: () => void;
		onClose: () => void;
	} = $props();

	function handleSubmit(e: Event) {
		e.preventDefault();
		onSubmit();
	}

	function handleClose() {
		onClose();
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<!-- Overlay -->
		<button
			class="fixed inset-0 z-40 cursor-default bg-black/10 backdrop-blur-sm"
			onclick={handleClose}
			aria-label="Close modal"
		></button>
		<!-- Modal content -->
		<div class="relative z-50 mx-auto my-8 w-full max-w-lg">
			<div class="overflow-hidden rounded-lg bg-white shadow-xl dark:bg-slate-800">
				<div class="px-6 py-5">
					<h3 class="text-lg font-medium text-slate-900 dark:text-white">
						{editingUser ? 'Edit User' : 'Create New User'}
					</h3>
					<form class="mt-4 space-y-4" onsubmit={handleSubmit}>
						<!-- Name -->
						<div>
							<label
								for="user-name"
								class="block text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								Name
							</label>
							<input
								id="user-name"
								type="text"
								bind:value={userForm.name}
								required
								class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
							/>
						</div>
						<!-- Email -->
						<div>
							<label
								for="user-email"
								class="block text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								Email
							</label>
							<input
								id="user-email"
								type="email"
								bind:value={userForm.email}
								required
								class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
							/>
						</div>
						<!-- Contact Number -->
						<div>
							<label
								for="user-contact"
								class="block text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								Contact Number
							</label>
							<input
								id="user-contact"
								type="text"
								bind:value={userForm.contactNumber}
								required
								class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
							/>
						</div>
						<!-- Role -->
						<div>
							<label
								for="user-role"
								class="block text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								Role
							</label>
							<select
								id="user-role"
								bind:value={userForm.role}
								class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
							>
								<option value="User">User</option>
								<option value="Admin">Admin</option>
							</select>
						</div>
						<!-- Password -->
						<div>
							<label
								for="user-password"
								class="block text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								Password {editingUser ? '(leave blank to keep current)' : ''}
							</label>
							<input
								id="user-password"
								type="password"
								bind:value={userForm.password}
								required={!editingUser}
								class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
							/>
						</div>
						<div class="flex justify-end space-x-3 pt-4">
							<button
								type="button"
								onclick={handleClose}
								class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isLoading}
								class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
							>
								{isLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}
