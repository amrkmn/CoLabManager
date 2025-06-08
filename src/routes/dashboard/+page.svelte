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
			{#if data.projects && data.projects.length > 0}
				<Kanban />
			{:else}
				<div class="mt-8 text-center text-slate-500 dark:text-slate-400">
					You have no projects yet. Create a project to start using the Kanban board.
				</div>
			{/if}
		</main>
	</div>
</div>
