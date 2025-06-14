<script lang="ts">
	import { errorMessages } from '$lib/constants/errorMessages';
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
	let registrationSuccess = false;

	let selectedCountry: CountryCode | null;
	let contactNumber: E164Number | null;
	let validPhoneNumber: boolean = true;

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
			registrationSuccess = true;
		} else {
			const data = (await res.json()) as { error: boolean; message: string[] };
			errors = data.message.map((code: string) => errorMessages[code] ?? 'Unknown error');
		}
	}
</script>

<svelte:head>
	<title>Register - PTA</title>
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
				<div class="mb-4 text-6xl text-green-500">✅</div>
				<h2 class="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
					Registration Successful!
				</h2>
				<p class="mb-4 text-slate-600 dark:text-slate-400">
					We've sent a verification email to <strong class="text-slate-600 dark:text-slate-400">
						{email}
					</strong>. Please check your inbox and click the verification link to activate your
					account.
				</p>
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
			<h1 class="mb-6 text-center text-3xl font-semibold text-slate-800 dark:text-white">
				Register
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

			<form on:submit|preventDefault={handleRegister} class="space-y-5">
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
		{/if}
	</div>
</div>
