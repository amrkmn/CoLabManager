<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import SideNav from '$lib/components/SideNav.svelte';
	import Kanban from '$lib/components/Kanban.svelte';
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
	<Header user={data.user} />
	<div class="flex min-h-0 flex-1">
		<!-- Side Navigation -->
		<SideNav />
		<main class="flex-1 p-6 text-slate-800 dark:text-white">
			<h2 class="mt-0 mb-4 text-2xl font-semibold text-slate-600 dark:text-slate-400">
				Welcome back, {data.user.name}!
			</h2>
			<p class="text-slate-600 dark:text-slate-400">Here's what's happening today:</p>
			<!-- Kanban Component -->
			<Kanban />
		</main>
	</div>
</div>
