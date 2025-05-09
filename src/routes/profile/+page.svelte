<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { cn } from '$lib/utils/style';
	export let data;
</script>

<div
	class={cn(
		'flex min-h-screen flex-col',
		'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800'
	)}
>
	<!-- Header -->
	<Header user={data.user!}></Header>
	<main class="flex-1 p-6 text-slate-800 dark:text-white">
		<h2 class="mt-0 mb-4 text-2xl font-semibold text-slate-600 dark:text-slate-400">
			Profile
		</h2>
	</main>
</div>
