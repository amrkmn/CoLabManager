<script lang="ts">
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

				<!-- Read-only Kanban view header -->
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-slate-700 dark:text-slate-300">
						All Tasks Overview
					</h3>
					<div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
						<span>View Only</span>
					</div>
				</div>

				<!-- General Kanban Board for all projects (Read-only view) -->
				<Kanban readOnly={true} />
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
