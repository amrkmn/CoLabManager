<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils/style';
	import { onMount } from 'svelte';

	onMount(async () => {
		await fetch('/api/logout', { method: 'POST' });
		goto('/login');
	});
</script>

<div
	class={cn(
		'flex min-h-screen items-center justify-center',
		'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800'
	)}
>
	<div
		class={cn(
			'flex items-center justify-center',
			'rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900'
		)}
	>
		<p class="animate-pulse text-lg font-medium text-slate-700 dark:text-slate-200">
			Logging out...
		</p>
	</div>
</div>
