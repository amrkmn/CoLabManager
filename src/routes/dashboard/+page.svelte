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
				<div class="mb-6">
					<h3 class="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
						Your Projects Overview
					</h3>
					<p class="mb-4 text-slate-600 dark:text-slate-400">
						You have {data.projects.length}
						{data.projects.length === 1 ? 'project' : 'projects'}. Select a project from the sidebar
						to view its Kanban board.
					</p>
				</div>

				<!-- General Kanban Board for all projects -->
				<Kanban />
			{:else}
				<div class="mt-8 rounded-lg bg-white p-8 text-center shadow-md dark:bg-slate-800">
					<div class="mb-4 text-6xl">📋</div>
					<h3 class="mb-2 text-xl font-semibold text-slate-700 dark:text-slate-300">
						No Projects Yet
					</h3>
					<p class="mb-6 text-slate-600 dark:text-slate-400">
						Create your first project to start organizing your tasks with Kanban boards.
					</p>
				</div>
			{/if}
		</main>
	</div>
</div>
