<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils/style';
	export let data;

	function handleLogout() {
		goto('/auth/logout');
	}
</script>

<div
	class={cn(
		'flex min-h-screen flex-col',
		'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800'
	)}
>
	<!-- Header -->
	<header
		class={cn(
			'flex h-20 items-center justify-between',
			'border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
			'p-6 shadow-sm'
		)}
	>
		<h1 class="mb-0 text-base font-medium text-slate-800 dark:text-white">Dashboard</h1>
		<div class="flex items-center gap-4">
			<button
				class={cn(
					'w-20 bg-blue-600 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-700',
					'rounded-md py-2 shadow-sm transition duration-200'
				)}
				on:click={handleLogout}
			>
				Logout
			</button>
			<div class="flex h-20 items-center gap-2">
				<div class="text-sm text-slate-700 dark:text-slate-300">
					<div>{data.user.name}</div>
					<div class="text-[10px] text-slate-500 dark:text-slate-400">{data.user.email}</div>
				</div>
				<img
					src="https://ui-avatars.com/api/?name={data.user.name}"
					alt="User Avatar"
					class="h-7 w-7 rounded-full border border-slate-300 dark:border-slate-600"
				/>
			</div>
		</div>
	</header>

	<main class="flex-1 p-6 text-slate-800 dark:text-white">
		<h2 class="mt-0 mb-4 text-2xl font-semibold text-slate-600 dark:text-slate-400">
			Welcome back, {data.user.name}!
		</h2>
		<p class="text-slate-600 dark:text-slate-400">Here's what's happening today:</p>
	</main>
</div>
