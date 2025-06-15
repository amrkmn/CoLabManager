<script lang="ts">
	import { cn } from '$lib/utils/style';
	import { TelInput, normalizedCountries } from 'svelte-tel-input';
	import type { CountryCode, E164Number } from 'svelte-tel-input/types';
	import { onMount } from 'svelte';
	import { isNullish } from '@sapphire/utilities';

	let { data } = $props();

	let name = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let contactNumber = $state<E164Number | null>(null);
	let selectedCountry = $state<CountryCode | null>(null);
	let validPhoneNumber = $state(true);
	let errors = $state<string[]>([]);
	let isLoading = $state(false);

	const errorMessages: Record<string, string> = {
		name_required: 'Name is required.',
		password_required: 'Password is required.',
		password_mismatch: 'Passwords do not match.',
		password_too_short: 'Password must be at least 6 characters.',
		contact_number_required: 'Contact number is required.',
		internal_error: 'Something went wrong. Please try again later.',
		invalid_token: 'Invalid or expired invitation token.'
	};

	onMount(async () => {
		const res = await fetch('https://ipapi.co/json');
		if (res.ok) {
			const ipData = await res.json();
			if (!isNullish(ipData.country_code)) {
				selectedCountry = ipData.country_code;
			}
		}
	});

	async function handleSetup(e: Event) {
		e.preventDefault();
		errors = [];
		isLoading = true;

		if (!name.trim()) {
			errors.push(errorMessages.name_required);
		}
		if (!password) {
			errors.push(errorMessages.password_required);
		}
		if (password !== confirmPassword) {
			errors.push(errorMessages.password_mismatch);
		}
		if (password && password.length < 6) {
			errors.push(errorMessages.password_too_short);
		}
		if (!contactNumber) {
			errors.push(errorMessages.contact_number_required);
		}

		if (errors.length > 0) {
			isLoading = false;
			return;
		}

		try {
			const res = await fetch('/api/auth/setup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					token: data.token,
					name: name.trim(),
					password,
					contactNumber
				})
			});

			if (res.ok) {
				window.location.href = '/dashboard';
			} else {
				const responseData = await res.json();
				errors = responseData.message?.map((code: string) => errorMessages[code] ?? code) || [
					'Setup failed'
				];
			}
		} catch (error) {
			errors = ['An unexpected error occurred'];
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Complete Your Profile - PTA</title>
</svelte:head>

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
		<div class="mb-6 text-center">
			<h1 class="text-3xl font-semibold text-slate-800 dark:text-white">
				Welcome to CoLab Manager!
			</h1>
			<p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
				You've been invited to collaborate on:
				<strong>{data.user.projects.join(', ')}</strong>
			</p>
			<p class="mt-1 text-xs text-slate-500 dark:text-slate-500">
				Email: {data.user.email}
			</p>
		</div>

		{#if errors.length > 0}
			<div class="mb-4">
				<ul class="text-sm text-red-500">
					{#each errors as error}
						<li>{error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<form onsubmit={handleSetup} class="space-y-5">
			<div>
				<label for="name" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
					Full Name
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
					placeholder="Enter your full name"
				/>
			</div>

			<div>
				<label
					for="password"
					class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
				>
					Password
				</label>
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
					placeholder="Create a password"
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
					required
					class={cn(
						'w-full rounded-md border px-4 py-2',
						'bg-white dark:border-slate-600 dark:bg-slate-800',
						'text-slate-900 placeholder:text-slate-400 dark:text-white',
						'focus:ring-2 focus:ring-blue-500 focus:outline-none'
					)}
					placeholder="Confirm your password"
				/>
			</div>

			<div>
				<label
					for="contactNumber"
					class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
				>
					Contact Number
				</label>
				<div class="flex w-full gap-2">
					<select
						class={cn(
							'w-1/3 flex-shrink-0 rounded-md border py-2 pr-2',
							'bg-white dark:border-slate-600 dark:bg-slate-800',
							'text-slate-900 placeholder:text-slate-400 dark:text-white',
							'focus:ring-2 focus:ring-blue-500 focus:outline-none',
							'max-h-[200px] overflow-y-auto'
						)}
						bind:value={selectedCountry}
					>
						<option value="" disabled>Country</option>
						{#each normalizedCountries as country (country.id)}
							<option value={country.iso2}>
								{country.iso2} (+{country.dialCode})
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
			</div>

			<button
				type="submit"
				disabled={isLoading}
				class={cn(
					'w-full bg-blue-600 font-medium text-white hover:cursor-pointer hover:bg-blue-700',
					'rounded-md py-2 shadow-sm transition duration-200',
					'disabled:cursor-not-allowed disabled:opacity-50'
				)}
			>
				{isLoading ? 'Setting up...' : 'Complete Setup'}
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
			Already have an account?
			<a
				href="/auth/login"
				class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
			>
				Sign in
			</a>
		</p>
	</div>
</div>
