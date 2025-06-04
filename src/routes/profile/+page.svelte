<script lang="ts">
	import { cn } from '$lib/utils/style';
	import { onMount } from 'svelte';
	import { errorMessages } from '$lib/constants/errorMessages';
	export let data;
	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let contactNumber = '';
	let role = '';
	let profilePictureUrl = '';
	let errors: string[] = [];
	let successMessage = '';
	let newProfilePicture: File | null = null;
	let fileInput: HTMLInputElement | null = null;

	console.log(data);

	async function fetchUserProfile() {
		const res = await fetch('/api/profile');
		if (res.ok) {
			const data = await res.json();
			name = data.name;
			email = data.email;
			contactNumber = data.contactNumber;
			role = data.role;
			profilePictureUrl = data.profilePictureUrl; // Assuming the API returns the profile picture URL
		} else {
			errors.push('Failed to load profile data.');
		}
	}

	async function handleUpdateProfile() {
		errors = [];
		successMessage = '';

		if (password && password !== confirmPassword) {
			errors.push(errorMessages.password_mismatch);
			return;
		}

		const formData = new FormData();
		formData.append('name', name);
		formData.append('email', email);
		formData.append('contactNumber', contactNumber);
		if (password) formData.append('password', password);
		if (newProfilePicture) formData.append('profilePicture', newProfilePicture);

		const res = await fetch('/api/profile', {
			method: 'PUT',
			body: formData
		});

		if (res.ok) {
			successMessage = 'Profile updated successfully!';
			await fetchUserProfile(); // Refresh profile data
			if (fileInput) fileInput.value = ''; // Clear the file input
			newProfilePicture = null; // Reset the new profile picture
			// Hide success message after 3 seconds
			setTimeout(() => {
				successMessage = '';
			}, 1500);
		} else {
			const data = await res.json();
			errors = data.message.map((code: string) => errorMessages[code] ?? 'Unknown error');
		}
	}

	function handleProfilePictureChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
			if (!allowedTypes.includes(file.type)) {
				errors = ['Only JPG, PNG, GIF, and WEBP images are allowed.'];
				if (fileInput) fileInput.value = '';
				newProfilePicture = null;
				return;
			}
			newProfilePicture = file;
		}
	}

	onMount(fetchUserProfile);
</script>

<div
	class={cn(
		'flex min-h-screen items-center justify-center',
		'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800',
		'py-5'
	)}
>
	<div
		class={cn(
			'bg-white dark:bg-slate-900',
			'w-full max-w-md rounded-2xl p-8 shadow-2xl sm:p-10',
			'border border-slate-200 backdrop-blur-md dark:border-slate-700'
		)}
	>
		<h1 class="mb-6 text-center text-3xl font-semibold text-slate-800 dark:text-white">
			Profile Settings
		</h1>

		<a href="/dashboard" class="mb-6 inline-block text-sm text-blue-600 hover:underline"
			>&larr; Back to Dashboard</a
		>

		{#if errors.length > 0}
			<div class="mb-4">
				<ul class="text-sm text-red-500">
					{#each errors as error}
						<li>{error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if successMessage}
			<div class="mb-4 text-sm text-green-500">{successMessage}</div>
		{/if}

		<form on:submit|preventDefault={handleUpdateProfile} class="space-y-5">
			<div class="flex flex-col items-center">
				<img
					src={profilePictureUrl || `https://ui-avatars.com/api/?name=${name}`}
					alt="Profile"
					class="mb-4 h-24 w-24 rounded-full object-cover"
				/>
				<label
					for="profilePicture"
					class="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
				>
					Change Profile Picture
				</label>
				<input
					id="profilePicture"
					type="file"
					accept=".jpg,.jpeg,.png,.gif,.webp"
					bind:this={fileInput}
					on:change={handleProfilePictureChange}
					class="block w-full text-sm text-slate-500 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
				/>
			</div>

			<div>
				<label for="name" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
					Name
				</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					required
					class={cn(
						'w-full rounded-md border px-4 py-2',
						'bg-white dark:border-slate-600 dark:bg-slate-800',
						'text-slate-900 placeholder:text-slate-400 dark:text-white',
						'focus:ring-2 focus:ring-blue-500 focus:outline-none'
					)}
				/>
			</div>

			<div>
				<label
					for="email"
					class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
				>
					Email
				</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class={cn(
						'w-full rounded-md border px-4 py-2',
						'bg-white dark:border-slate-600 dark:bg-slate-800',
						'text-slate-900 placeholder:text-slate-400 dark:text-white',
						'focus:ring-2 focus:ring-blue-500 focus:outline-none'
					)}
				/>
			</div>

			<div>
				<label
					for="password"
					class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
				>
					New Password
				</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					class={cn(
						'w-full rounded-md border px-4 py-2',
						'bg-white dark:border-slate-600 dark:bg-slate-800',
						'text-slate-900 placeholder:text-slate-400 dark:text-white',
						'focus:ring-2 focus:ring-blue-500 focus:outline-none'
					)}
				/>
			</div>

			<div>
				<label
					for="confirmPassword"
					class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
				>
					Confirm Password
				</label>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					class={cn(
						'w-full rounded-md border px-4 py-2',
						'bg-white dark:border-slate-600 dark:bg-slate-800',
						'text-slate-900 placeholder:text-slate-400 dark:text-white',
						'focus:ring-2 focus:ring-blue-500 focus:outline-none'
					)}
				/>
			</div>

			<div>
				<label
					for="contactNumber"
					class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
				>
					Contact Number
				</label>
				<input
					id="contactNumber"
					type="text"
					bind:value={contactNumber}
					required
					class={cn(
						'w-full rounded-md border px-4 py-2',
						'bg-white dark:border-slate-600 dark:bg-slate-800',
						'text-slate-900 placeholder:text-slate-400 dark:text-white',
						'focus:ring-2 focus:ring-blue-500 focus:outline-none'
					)}
				/>
			</div>

			<div>
				<label for="role" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
					Role
				</label>
				<input
					disabled
					id="role"
					type="text"
					value={role}
					readonly
					class={cn(
						'w-full rounded-md border px-4 py-2',
						'bg-gray-100 dark:border-slate-600 dark:bg-slate-800',
						'text-slate-900 placeholder:text-slate-400 dark:text-white',
						'focus:outline-none'
					)}
				/>
			</div>

			<button
				type="submit"
				class={cn(
					'w-full bg-blue-600 font-medium text-white hover:cursor-pointer hover:bg-blue-700',
					'rounded-md py-2 shadow-sm transition duration-200'
				)}
			>
				Update Profile
			</button>
		</form>
	</div>
</div>
