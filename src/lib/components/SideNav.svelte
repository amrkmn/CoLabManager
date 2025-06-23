<script lang="ts">
	import { cn } from '$lib/utils/style';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import AddProjectModal from '$lib/components/modals/AddProjectModal.svelte';

	let {
		mobileOpen = false,
		onMobileClose = () => {}
	}: {
		mobileOpen?: boolean;
		onMobileClose?: () => void;
	} = $props();

	const currentPath = $derived(page.url.pathname);

	interface Project {
		id: string;
		name: string;
		description: string;
		createdAt: string;
		updatedAt: string;
	}

	let projects = $state<Project[]>([]);
	let isModalOpen = $state(false);
	let isLoadingProjects = $state(true);
	let projectsError = $state('');

	onMount(() => {
		loadProjects();
	});

	async function loadProjects() {
		try {
			isLoadingProjects = true;
			projectsError = '';

			const response = await fetch('/api/projects');
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to load projects');
			}

			projects = result.projects || [];
		} catch (err) {
			projectsError = err instanceof Error ? err.message : 'Failed to load projects';
			console.error('Error loading projects:', err);
		} finally {
			isLoadingProjects = false;
		}
	}

	function handleAddProject() {
		isModalOpen = true;
	}

	function handleModalClose() {
		isModalOpen = false;
	}
	function handleProjectAdded(project: { id: string; name: string; description: string }) {
		// Add the new project to the list
		const newProject: Project = {
			id: project.id,
			name: project.name,
			description: project.description,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		projects = [newProject, ...projects];

		// Invalidate all page data to refresh the dashboard
		invalidateAll();
	}

	function getProjectUrl(projectId: string) {
		return `/projects/${projectId}`;
	}

	function handleLinkClick() {
		// Close mobile menu when navigating
		onMobileClose();
	}
</script>

<!-- Mobile Sidebar Backdrop -->
{#if mobileOpen}
	<div
		class="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
		role="button"
		tabindex="0"
		onclick={onMobileClose}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ' ? onMobileClose() : null)}
	></div>
{/if}

<nav
	class={cn(
		'flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
		'px-3 py-2 shadow-md transition-transform duration-300 ease-in-out',
		// Desktop: always visible, static position, fixed width
		'sm:relative sm:w-56 sm:translate-x-0',
		// Mobile: fixed overlay, slides in from left, starts below header
		'fixed left-0 z-50 w-64',
		// Mobile positioning - below header
		'top-16 bottom-0',
		// Transform based on mobile state - always apply transform on mobile
		mobileOpen ? 'translate-x-0' : '-translate-x-full',
		// On desktop, always visible (overrides mobile transform and positioning)
		'sm:translate-x-0 sm:top-0'
	)}
>
	<!-- Projects Section -->
	<div class="mb-6">
		<h3 class="mb-2 px-3 text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
			Projects
		</h3>
		<!-- Add Project Button -->
		<button
			onclick={handleAddProject}
			data-add-project-btn
			class={cn(
				'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition dark:text-slate-200',
				'hover:bg-blue-100 dark:hover:bg-slate-800',
				'mb-3 border border-dashed border-slate-300 dark:border-slate-600'
			)}
		>
			<span class="text-lg">+</span>
			<span>Add Project</span>
		</button>

		<!-- Projects List -->
		<div class="max-h-64 overflow-y-auto">
			{#if isLoadingProjects}
				<div class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Loading projects...</div>
			{:else if projectsError}
				<div class="px-3 py-2 text-sm text-red-600 dark:text-red-400">
					{projectsError}
				</div>
			{:else if projects.length === 0}
				<div class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No projects yet</div>
			{:else}
				<ul class="space-y-1">
					{#each projects as project (project.id)}
						<li>
							<a
								href={getProjectUrl(project.id)}
								onclick={handleLinkClick}
								class={cn(
									'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition dark:text-slate-200',
									'hover:bg-blue-100 dark:hover:bg-slate-800',
									currentPath === getProjectUrl(project.id)
										? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-blue-400'
										: ''
								)}
								title={project.description || project.name}
							>
								<span class="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
								<span class="truncate">{project.name}</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<!-- Main Navigation -->
	<div class="flex-1">
		<ul class="!m-0 flex !list-none flex-col gap-1 !p-0">
			<li>
				<a
					href="/dashboard"
					onclick={handleLinkClick}
					class={cn(
						'flex w-full items-center gap-1 rounded-md px-3 py-1.5 text-slate-700 transition dark:text-slate-200',
						'hover:bg-blue-100 dark:hover:bg-slate-800',
						currentPath === '/dashboard'
							? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-blue-400'
							: ''
					)}
				>
					<span class="w-full">Dashboard</span>
				</a>
			</li>
		</ul>
	</div>
</nav>

<!-- Add Project Modal -->
<AddProjectModal
	open={isModalOpen}
	onclose={handleModalClose}
	onprojectAdded={handleProjectAdded}
/>

<style>
	/* Desktop styles */
	@media (min-width: 640px) {
		nav {
			height: calc(100vh - 80px); /* Desktop header height is h-20 = 80px */
			position: sticky;
			top: 0;
		}
	}
</style>
