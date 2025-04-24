<script lang="ts">
	import { cn } from '$lib/utils/style';
	import { isNullish } from '@sapphire/utilities';
	import { onMount } from 'svelte';
	import { TelInput, normalizedCountries } from 'svelte-tel-input';
	import type { CountryCode, E164Number } from 'svelte-tel-input/types';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let errors: string[] = [];

	let selectedCountry: CountryCode | null;
	let contactNumber: E164Number | null;
	let validPhoneNumber: boolean = true;

	const errorMessages: Record<string, string> = {
		name_required: 'Name is required.',
		email_required: 'Email is required.',
		email_invalid: 'Please enter a valid email address.',
		password_required: 'Password is required.',
		password_mismatch: 'Passwords do not match.',
		password_too_short: 'Password must be at least 6 characters.',
		contact_number_required: 'Contact number is required.',
		internal_error: 'Something went wrong. Please try again later.'
	};

	onMount(async () => {
		const res = await fetch('https://ipapi.co/json');
		if (res.ok) {
			const data = await res.json();
			if (!isNullish(data.country_code)) {
				selectedCountry = data.country_code;
			}
		}
	});

	async function handleRegister() {
		errors = [];
		if (password !== confirmPassword) errors.push(errorMessages.password_mismatch);

		const res = await fetch('/api/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, email, password, contactNumber })
		});

		if (res.ok) {
			window.location.href = '/dashboard';
		} else {
			const data = (await res.json()) as { error: boolean; message: string[] };
			errors = data.message.map((code: string) => errorMessages[code] ?? 'Unknown error');
		}
	}
</script>

<div
	class={cn(
		'flex min-h-screen items-center justify-center',
		'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800'
	)}
>
	<div
		class={cn(
			'bg-white dark:bg-slate-900',
			'w-full max-w-md rounded-2xl p-8 shadow-2xl sm:p-10',
			'border border-slate-200 backdrop-blur-md dark:border-slate-700'
		)}
	>
		<h1 class="mb-6 text-center text-3xl font-semibold text-slate-800 dark:text-white">Register</h1>

		{#if errors.length > 0}
			<div class="mb-4">
				<ul class="text-sm text-red-500">
					{#each errors as error}
						<li>{error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<form on:submit|preventDefault={handleRegister} class="space-y-5">
			<div>
				<label for="name" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
					>Name</label
				>
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
				<label for="email" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
					>Email</label
				>
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
					class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label
				>
				<input
					id="password"
					type="password"
					bind:value={password}
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
					for="confirmPassword"
					class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
					>Confirm Password</label
				>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
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
					for="contactNumber"
					class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
					>Contact Number</label
				>
				<div class="flex w-full gap-2">
					<select
						class={cn(
							'w-1/3 flex-shrink-0 rounded-md border py-2 pr-2',
							'bg-white dark:border-slate-600 dark:bg-slate-800',
							'text-slate-900 placeholder:text-slate-400 dark:text-white',
							'focus:ring-2 focus:ring-blue-500 focus:outline-none',
							'max-h-[200px] overflow-y-auto'
						)}
						aria-label="Default select example"
						name="Country"
						bind:value={selectedCountry}
					>
						<option value="" disabled selected={!selectedCountry}>Country</option>
						{#each normalizedCountries as currentCountry (currentCountry.id)}
							<option value={currentCountry.iso2}>
								{currentCountry.iso2} (+{currentCountry.dialCode})
							</option>
						{/each}
					</select>
					<TelInput
						bind:country={selectedCountry}
						bind:value={contactNumber}
						bind:valid={validPhoneNumber}
						class={cn(
							'w-2/3 flex-grow rounded-md border px-4 py-2',
							'bg-white dark:border-slate-600 dark:bg-slate-800',
							'text-slate-900 placeholder:text-slate-400 dark:text-white',
							'focus:ring-2 focus:ring-blue-500 focus:outline-none'
						)}
					/>
				</div>
				<!-- <input
					id="contactNumber"
					type="tel"
					bind:value={contactNumber}
					required
					class={cn(
						'w-full rounded-md border px-4 py-2',
						'bg-white dark:border-slate-600 dark:bg-slate-800',
						'text-slate-900 placeholder:text-slate-400 dark:text-white',
						'focus:ring-2 focus:ring-blue-500 focus:outline-none'
					)}
				/> -->
			</div>

			<button
				type="submit"
				class={cn(
					'w-full bg-blue-600 font-medium text-white hover:cursor-pointer hover:bg-blue-700',
					'rounded-md py-2 shadow-sm transition duration-200'
				)}
			>
				Register
			</button>
		</form>

		<p class="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
			Already have an account?
			<a href="/auth/login" class="text-blue-600 hover:underline">Login</a>
		</p>
	</div>
</div>
