<script lang="ts">
	import { cn } from '$lib/utils/style';
	import { page } from '$app/state';

	// Navigation links
	const navLinks = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/settings/user', label: 'Settings' }
	];

	// Get current path for active link styling
	const currentPath = $derived(page.url.pathname);
</script>

<nav
	class={cn(
		'flex h-full w-56 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
		'px-3 py-2 shadow-md not-prose'
	)}
>
	<ul class="!m-0 flex !list-none flex-col gap-1 !p-0">
		{#each navLinks as link}
			<li>
				<a
					href={link.href}
					class={cn(
						'flex w-full items-center gap-1 rounded-md px-3 py-1.5 text-slate-700 transition dark:text-slate-200',
						'hover:bg-blue-100 dark:hover:bg-slate-800',
						currentPath === link.href
							? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-blue-400'
							: ''
					)}
				>
					<span class="w-full">{link.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	nav {
		min-height: 100vh;
	}
</style>
