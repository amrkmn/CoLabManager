<script lang="ts">
	import { cn } from '$lib/utils/style';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let email = '';
	let password = '';
	let errors: string[] = [];
	let loading = false;
	let successMessage = '';

	const errorMessages: Record<string, string> = {
		email_required: 'Email is required.',
		email_invalid: 'Please enter a valid email address.',
		password_required: 'Password is required.',
		password_too_short: 'Password must be at least 6 characters.',
		invalid_credentials: 'Invalid email or password.',
		email_not_verified:
			'Please verify your email address before logging in. Check your inbox for a verification link.',
		internal_error: 'Something went wrong. Please try again later.',
		invalid_invite: 'Invalid or expired invitation link.',
		missing_token: 'Missing invitation token.'
	};

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('verified') === 'true') {
			successMessage = 'Email verified successfully! You can now log in.';
		}
		if (urlParams.get('error')) {
			const errorCode = urlParams.get('error');
			errors = [errorMessages[errorCode!] || 'An error occurred.'];
		}
	});

	async function handleLogin() {
		loading = true;
		const res = await fetch('/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
		if (res.ok) {
			window.location.href = '/dashboard';
		} else {
			loading = false;
			const data = (await res.json()) as { error: boolean; message: string[] };
			errors = data.message.map((code: string) => errorMessages[code] ?? 'Unknown error');

			setTimeout(() => {
				errors = [];
			}, 2500);
		}
	}
</script>

<div
	class={cn(
		'flex min-h-screen items-center justify-center',
		'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800'
	)}
>
	{#if loading}
		<div
			class={cn(
				'flex items-center justify-center',
				'rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900'
			)}
		>
			<p class="animate-pulse text-lg font-medium text-slate-700 dark:text-slate-200">
				Logging in...
			</p>
		</div>
	{:else}
		<div
			class={cn(
				'bg-white dark:bg-slate-900',
				'w-full max-w-md rounded-2xl p-8 shadow-2xl sm:p-10',
				'border border-slate-200 backdrop-blur-md dark:border-slate-700'
			)}
		>
			<h1 class="mb-6 text-center text-3xl font-semibold text-slate-800 dark:text-white">
				Sign In
			</h1>

			{#if successMessage}
				<div
					class="mb-4 rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20"
				>
					<p class="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
				</div>
			{/if}

			{#if errors.length > 0}
				<div class="mb-4">
					<ul class="text-sm text-red-500">
						{#each errors as error}
							<li>{error}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<form on:submit|preventDefault={handleLogin} class="space-y-5">
				<div>
					<label
						for="email"
						class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label
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
						class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
						>Password</label
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

				<button
					type="submit"
					class={cn(
						'w-full bg-blue-600 font-medium text-white hover:cursor-pointer hover:bg-blue-700',
						'rounded-md py-2 shadow-sm transition duration-200'
					)}
				>
					Login
				</button>
			</form>

			<p class="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
				Don't have an account?
				<a href="/auth/register" class="text-blue-600 hover:underline">Register</a>
			</p>
		</div>
	{/if}
</div>
