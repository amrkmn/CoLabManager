<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import Kanban from '$lib/components/Kanban.svelte';
	import ProjectCollaborators from '$lib/components/ProjectCollaborators.svelte';
	import SideNav from '$lib/components/SideNav.svelte';
	import { cn } from '$lib/utils/style';
	import { formatDateTime } from '$lib/utils/date';
	let { data } = $props();

	const projectId = $derived(page.params.id);
	let mobileNavOpen = $state(false);
	interface Project {
		id: string;
		name: string;
		description: string;
		createdAt: string;
		updatedAt: string;
		currentUserRole: 'Admin' | 'Member';
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
	let showDeleteModal = $state(false);
	let isDeleting = $state(false);
	let deleteError = $state('');

	// React to projectId changes
	$effect(() => {
		if (projectId) {
			loadProjectData();
		}
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

	async function deleteProject() {
		if (!project) return;

		isDeleting = true;
		deleteError = '';

		try {
			const response = await fetch(`/api/projects/${projectId}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to delete project');
			} // Redirect to dashboard after successful deletion
			goto('/dashboard?deleted=true');
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Failed to delete project';
		} finally {
			isDeleting = false;
		}
	}

	function openDeleteModal() {
		showDeleteModal = true;
		deleteError = '';
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		deleteError = '';
	}

	function toggleMobileNav() {
		mobileNavOpen = !mobileNavOpen;
	}

	function closeMobileNav() {
		mobileNavOpen = false;
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
	<div class="relative flex min-h-0 flex-1">
		<!-- Side Navigation -->
		<SideNav mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
		<main class="flex flex-1 flex-col overflow-auto text-slate-800 dark:text-white">
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
				<!-- Mobile Nav Toggle Button -->
				<div
					class="border-b border-slate-200 bg-white/50 p-3 sm:hidden dark:border-slate-700 dark:bg-slate-800/50"
				>
					<button
						onclick={toggleMobileNav}
						class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							></path>
						</svg>
						<span>Projects</span>
					</button>
				</div>

				<!-- Project Header -->
				<div
					class="border-b border-slate-200 bg-white/50 p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-800/50"
				>
					<h1 class="text-lg leading-tight font-bold text-slate-900 sm:text-xl dark:text-slate-100">
						{project.name}
					</h1>
					{#if project.description}
						<p class="mt-1 text-sm text-slate-600 dark:text-slate-400">{project.description}</p>
					{/if}
					<div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div
							class="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:gap-4 sm:text-sm dark:text-slate-400"
						>
							<span title={new Date(project.createdAt).toLocaleString()}>
								Created: {formatDateTime(project.createdAt)}
							</span>
							<span class="hidden sm:inline">•</span>
							<span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
						</div>
						<div class="flex items-center gap-2 sm:gap-3">
							<!-- Collaborators/Invite UI -->
							<div class="flex-1 sm:flex-none">
								<ProjectCollaborators />
							</div>

							<!-- Delete button (only for Admins) -->
							{#if project.currentUserRole === 'Admin'}
								<button
									onclick={openDeleteModal}
									class={cn(
										'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition',
										'border border-red-200 text-red-600 hover:bg-red-50',
										'dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20'
									)}
									title="Delete project"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
									Delete
								</button>
							{/if}
						</div>
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

<!-- Delete Project Modal -->
{#if showDeleteModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		onclick={(e) => e.target === e.currentTarget && closeDeleteModal()}
		onkeydown={(e) => e.key === 'Escape' && closeDeleteModal()}
		tabindex="-1"
	>
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-red-600 dark:text-red-400">Delete Project</h3>
				<button
					onclick={closeDeleteModal}
					class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
					aria-label="Close modal"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="mb-6">
				<div class="mb-4 flex items-center justify-center">
					<div class="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
						<svg
							class="h-8 w-8 text-red-600 dark:text-red-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
				</div>
				<p class="text-center text-slate-600 dark:text-slate-400">
					Are you sure you want to delete "<strong class="text-slate-900 dark:text-slate-100"
						>{project?.name}</strong
					>"?
				</p>
				<p class="mt-2 text-center text-sm text-red-600 dark:text-red-400">
					This action cannot be undone. All tasks, files, and messages will be permanently deleted.
				</p>
			</div>

			{#if deleteError}
				<div
					class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
				>
					{deleteError}
				</div>
			{/if}

			<div class="flex gap-3">
				<button
					onclick={closeDeleteModal}
					disabled={isDeleting}
					class="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
				>
					Cancel
				</button>
				<button
					onclick={deleteProject}
					disabled={isDeleting}
					class="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
				>
					{#if isDeleting}
						<div class="flex items-center justify-center">
							<svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
									fill="none"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Deleting...
						</div>
					{:else}
						Delete Project
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
