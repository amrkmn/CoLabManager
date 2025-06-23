<script lang="ts">
	import { errorMessages } from '$lib/constants/errorMessages';
	import { cn } from '$lib/utils/style';
	import { isNullish } from '@sapphire/utilities';
	import { onMount } from 'svelte';
	import { TelInput, normalizedCountries } from 'svelte-tel-input';
	import type { CountryCode, E164Number } from 'svelte-tel-input/types';
	let { data } = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let errors = $state<string[]>([]);
	let registrationSuccess = $state(false);
	let successMessage = $state('');
	let isFirstUser = $state(false);

	let selectedCountry = $state<CountryCode | null>(null);
	let contactNumber = $state<E164Number | null>(null);
	let validPhoneNumber = $state(true);
	let isRegistering = $state(false);

	onMount(async () => {
		const res = await fetch('https://ipapi.co/json');
		if (res.ok) {
			const data = await res.json();
			if (!isNullish(data.country_code)) {
				selectedCountry = data.country_code;
			}
		}
	});
	async function handleRegister(e: Event) {
		e.preventDefault();
		errors = [];
		isRegistering = true;

		try {
			if (password !== confirmPassword) {
				errors.push(errorMessages.password_mismatch);
				return;
			}

			const res = await fetch('/api/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, password, contactNumber })
			});

			if (res.ok) {
				const result = await res.json();
				registrationSuccess = true;
				successMessage = result.message;
				isFirstUser = result.isFirstUser;
			} else {
				const responseData = (await res.json()) as { error: boolean; message: string[] };
				errors = responseData.message.map((code: string) => errorMessages[code] ?? 'Unknown error');
			}
		} catch (err) {
			errors.push('Registration failed. Please try again.');
		} finally {
			isRegistering = false;
		}
	}
</script>

<svelte:head>
	<title>{data.isFirstUser ? 'Setup Admin Account' : 'Register'} - CoLab Manager</title>
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
		{#if registrationSuccess}
			<div class="text-center">
				<div class="mb-4 text-6xl">
					{#if isFirstUser}
						🎉
					{:else}
						✅
					{/if}
				</div>
				<h2 class="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
					{#if isFirstUser}
						Admin Account Created!
					{:else}
						Registration Successful!
					{/if}
				</h2>
				<p class="mb-4 text-slate-600 dark:text-slate-400">
					{successMessage}
				</p>
				{#if isFirstUser}
					<div
						class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
					>
						<p class="text-sm text-blue-800 dark:text-blue-200">
							<strong class="text-blue-800 dark:text-blue-200">🚀 Welcome to CoLab Manager!</strong><br />
							You're the first user, so you've been granted administrator privileges. After verifying
							your email, you'll have full access to manage the system.
						</p>
					</div>
				{/if}
				<p class="text-sm text-slate-500 dark:text-slate-500">
					Didn't receive the email? Check your spam folder or contact support.
				</p>
				<a
					href="/auth/login"
					class="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Go to Login
				</a>
			</div>
		{:else}
			{#if data.isFirstUser}
				<div
					class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
				>
					<div class="flex items-center">
						<div class="mr-3 text-2xl">🚀</div>
						<div>
							<h3 class="font-semibold text-amber-800 dark:text-amber-200">
								Welcome! Let's set up CoLab Manager
							</h3>
							<p class="text-sm text-amber-700 dark:text-amber-300">
								You're the first user, so you'll become the administrator.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<h1 class="mb-6 text-center text-3xl font-semibold text-slate-800 dark:text-white">
				{#if data.isFirstUser}
					Create Admin Account
				{:else}
					Register
				{/if}
			</h1>

			{#if errors.length > 0}
				<div class="mb-4">
					<ul class="text-sm text-red-500">
						{#each errors as error}
							<li>{error}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<form onsubmit={handleRegister} class="space-y-5">
				<div>
					<label
						for="name"
						class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
					>
						Name
					</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						required
						disabled={isRegistering}
						class={cn(
							'w-full rounded-md border px-4 py-2',
							'bg-white dark:border-slate-600 dark:bg-slate-800',
							'text-slate-900 placeholder:text-slate-400 dark:text-white',
							'focus:ring-2 focus:ring-blue-500 focus:outline-none',
							'disabled:cursor-not-allowed disabled:opacity-50'
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
						disabled={isRegistering}
						class={cn(
							'w-full rounded-md border px-4 py-2',
							'bg-white dark:border-slate-600 dark:bg-slate-800',
							'text-slate-900 placeholder:text-slate-400 dark:text-white',
							'focus:ring-2 focus:ring-blue-500 focus:outline-none',
							'disabled:cursor-not-allowed disabled:opacity-50'
						)}
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
						disabled={isRegistering}
						class={cn(
							'w-full rounded-md border px-4 py-2',
							'bg-white dark:border-slate-600 dark:bg-slate-800',
							'text-slate-900 placeholder:text-slate-400 dark:text-white',
							'focus:ring-2 focus:ring-blue-500 focus:outline-none',
							'disabled:cursor-not-allowed disabled:opacity-50'
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
						required
						disabled={isRegistering}
						class={cn(
							'w-full rounded-md border px-4 py-2',
							'bg-white dark:border-slate-600 dark:bg-slate-800',
							'text-slate-900 placeholder:text-slate-400 dark:text-white',
							'focus:ring-2 focus:ring-blue-500 focus:outline-none',
							'disabled:cursor-not-allowed disabled:opacity-50'
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
				</div>
				<button
					type="submit"
					class={cn(
						'w-full font-medium text-white hover:cursor-pointer',
						'rounded-md py-2 shadow-sm transition duration-200',
						'disabled:cursor-not-allowed disabled:opacity-50',
						'flex items-center justify-center gap-2',
						data.isFirstUser ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
					)}
					disabled={isRegistering}
				>
					{#if isRegistering}
						<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
								fill="none"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						{data.isFirstUser ? 'Creating Admin Account...' : 'Registering...'}
					{:else if data.isFirstUser}
						Create Admin Account
					{:else}
						Register
					{/if}
				</button>
			</form>

			<p class="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
				Already have an account?
				<a href="/auth/login" class="text-blue-600 hover:underline">Login</a>
			</p>
		{/if}
	</div>
</div>

<style>
	.loader {
		border: 2px solid rgba(255, 255, 255, 0.6);
		border-top: 2px solid rgba(255, 255, 255, 1);
		border-radius: 50%;
		width: 1rem;
		height: 1rem;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
