<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import Kanban from '$lib/components/Kanban.svelte';
	import SideNav from '$lib/components/SideNav.svelte';
	import { cn } from '$lib/utils/style';
	import { onMount } from 'svelte';

	let { data } = $props();

	let showDeleteSuccess = $state(false);

	onMount(() => {
		// Check if we're coming from a deleted project
		if (page.url.searchParams.get('deleted') === 'true') {
			showDeleteSuccess = true;
			// Clear the URL parameter
			const url = new URL(page.url);
			url.searchParams.delete('deleted');
			window.history.replaceState({}, '', url);

			// Hide the message after 5 seconds
			setTimeout(() => {
				showDeleteSuccess = false;
			}, 5000);
		}
	});

	// Call this after a project is created to refresh dashboard data
	async function handleProjectCreated() {
		await invalidate('app:projects');
	}
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
			<!-- Success message for deleted project -->
			{#if showDeleteSuccess}
				<div
					class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
				>
					<div class="flex items-center">
						<svg
							class="mr-2 h-5 w-5 text-green-600 dark:text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						<p class="text-green-700 dark:text-green-300">Project deleted successfully.</p>
						<button
							onclick={() => (showDeleteSuccess = false)}
							class="ml-auto text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
							aria-label="Close success message"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								></path>
							</svg>
						</button>
					</div>
				</div>
			{/if}

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
