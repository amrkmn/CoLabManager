<script lang="ts">
	import { cn } from '$lib/utils/style';
	import { page } from '$app/state';

	const currentPath = $derived(page.url.pathname);

	function handleAddProject() {
		// TODO: Implement add project functionality
		console.log('Add project clicked');
	}
</script>

<nav
	class={cn(
		'flex h-full w-56 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
		'not-prose px-3 py-2 shadow-md'
	)}
>
	<!-- Projects Section -->
	<div class="mb-6">
		<h3 class="mb-2 px-3 text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
			Projects
		</h3>
		<button
			onclick={handleAddProject}
			class={cn(
				'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition dark:text-slate-200',
				'hover:bg-blue-100 dark:hover:bg-slate-800',
				'border border-dashed border-slate-300 dark:border-slate-600'
			)}
		>
			<span class="text-lg">+</span>
			<span>Add Project</span>
		</button>
	</div>

	<!-- Main Navigation -->
	<div class="flex-1">
		<ul class="!m-0 flex !list-none flex-col gap-1 !p-0">
			<li>
				<a
					href="/dashboard"
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

	<!-- Settings at Bottom -->
	<div class="mt-auto border-t border-slate-200 pt-2 dark:border-slate-700">
		<ul class="!m-0 flex !list-none flex-col gap-1 !p-0">
			<li>
				<a
					href="/settings/user"
					class={cn(
						'flex w-full items-center gap-1 rounded-md px-3 py-1.5 text-slate-700 transition dark:text-slate-200',
						'hover:bg-blue-100 dark:hover:bg-slate-800',
						currentPath === '/settings/user'
							? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-blue-400'
							: ''
					)}
				>
					<span class="w-full">Settings</span>
				</a>
			</li>
		</ul>
	</div>
</nav>

<style>
	nav {
		height: calc(100vh - 80px); /* Header height is h-20 = 80px */
		position: sticky;
		top: 0;
	}
</style>
