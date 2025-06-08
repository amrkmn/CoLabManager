<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import SideNav from '$lib/components/SideNav.svelte';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Kanban from '$lib/components/Kanban.svelte';
	import { cn } from '$lib/utils/style';
	let { data } = $props();

	const projectId = $derived(page.params.id);

	interface Project {
		id: string;
		name: string;
		description: string;
		createdAt: string;
		updatedAt: string;
	}

	interface Task {
		id: string;
		title: string;
		description: string;
		status: 'todo' | 'inprogress' | 'done';
		priority: 'low' | 'medium' | 'high';
		projectId: string;
		createdAt: string;
		updatedAt: string;
	}

	let project = $state<Project | null>(null);
	let tasks = $state<Task[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	onMount(() => {
		loadProjectData();
	});

	async function loadProjectData() {
		try {
			isLoading = true;
			error = '';

			// Load project details
			const projectResponse = await fetch(`/api/projects/${projectId}`);
			const projectResult = await projectResponse.json();

			if (!projectResponse.ok) {
				throw new Error(projectResult.message || 'Failed to load project');
			}

			project = projectResult.project;

			// Load project tasks
			const tasksResponse = await fetch(`/api/projects/${projectId}/tasks`);
			const tasksResult = await tasksResponse.json();

			if (!tasksResponse.ok) {
				throw new Error(tasksResult.message || 'Failed to load tasks');
			}

			tasks = tasksResult.tasks || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load project data';
			console.error('Error loading project data:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{project?.name || 'Project'} - Project Management</title>
</svelte:head>

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
		<main class="flex flex-1 flex-col text-slate-800 dark:text-white">
			{#if isLoading}
				<div class="flex h-full items-center justify-center">
					<div class="text-center">
						<div
							class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
						></div>
						<p class="text-slate-600 dark:text-slate-400">Loading project...</p>
					</div>
				</div>
			{:else if error}
				<div class="flex h-full items-center justify-center">
					<div class="text-center">
						<div class="mb-4 text-6xl text-red-500">⚠️</div>
						<h2 class="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
							Error Loading Project
						</h2>
						<p class="text-slate-600 dark:text-slate-400">{error}</p>
						<button
							onclick={loadProjectData}
							class={cn(
								'mt-4 rounded-md bg-blue-600 px-4 py-2 text-white transition',
								'hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
							)}
						>
							Try Again
						</button>
					</div>
				</div>
			{:else if !project}
				<div class="flex h-full items-center justify-center">
					<div class="text-center">
						<div class="mb-4 text-6xl text-slate-400">📁</div>
						<h2 class="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
							Project Not Found
						</h2>
						<p class="text-slate-600 dark:text-slate-400">
							The requested project could not be found.
						</p>
					</div>
				</div>
			{:else}
				<!-- Project Header -->
				<div
					class="border-b border-slate-200 bg-white/50 p-6 dark:border-slate-700 dark:bg-slate-800/50"
				>
					<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">{project.name}</h1>
					{#if project.description}
						<p class="mt-2 text-slate-600 dark:text-slate-400">{project.description}</p>
					{/if}
					<div class="mt-4 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
						<span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
						<span>•</span>
						<span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
					</div>
				</div>

				<!-- Kanban Board -->
				<div class="flex-1 overflow-hidden p-6">
					<Kanban {projectId} />
				</div>
			{/if}
		</main>
	</div>
</div>
