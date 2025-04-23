<script lang="ts">
	import { cn } from '$lib/utils/style';
	let email = '';
	let password = '';

	function handleLogin() {
		console.log('Logging in with:', email, password);
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
		<h1 class="mb-6 text-center text-3xl font-semibold text-slate-800 dark:text-white">Sign In</h1>

		<form on:submit|preventDefault={handleLogin} class="space-y-5">
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
						'w-full rounded-xl border px-4 py-2',
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
						'w-full rounded-xl border px-4 py-2',
						'bg-white dark:border-slate-600 dark:bg-slate-800',
						'text-slate-900 placeholder:text-slate-400 dark:text-white',
						'focus:ring-2 focus:ring-blue-500 focus:outline-none'
					)}
				/>
			</div>

			<button
				type="submit"
				class={cn(
					'w-full bg-blue-600 font-medium text-white hover:bg-blue-700',
					'rounded-xl py-2 shadow-sm transition duration-200'
				)}
			>
				Login
			</button>
		</form>

		<p class="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
			Don't have an account?
			<a href="/register" class="text-blue-600 hover:underline">Register</a>
		</p>
	</div>
</div>
