<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils/style';
	import type { User } from '@prisma/client';

	export let user: Omit<User, 'password'>;

	let showMenu = false;
	let isAdmin = false;

	if (user.role === 'Admin') {
		isAdmin = true;
	}

	function handleLogout() {
		goto('/auth/logout');
	}

	function toggleMenu() {
		showMenu = !showMenu;
	}
</script>

<header
	class={cn(
		'flex h-20 items-center justify-between',
		'border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
		'p-6 shadow-sm'
	)}
>
	<a href="/dashboard"
		><h1 class="mb-0 text-base font-medium text-slate-800 dark:text-white">Dashboard</h1></a
	>
	<div class="flex items-center gap-4">
		<!-- <button
			class={cn(
				'w-20 bg-blue-600 text-sm font-medium text-white hover:cursor-pointer hover:bg-blue-700',
				'rounded-md py-2 shadow-sm transition duration-200'
			)}
			on:click={handleLogout}
		>
			Logout
		</button> -->
		<!-- <a href="/settings/admin" class="text-sm font-medium text-white hover:cursor-pointer">
			Administration
		</a> -->

		<!-- Avatar & Dropdown Trigger -->
		<div class="relative">
			<!-- Avatar Dropdown Trigger -->
			<button
				on:click={toggleMenu}
				class="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-600"
				aria-label="User menu"
			>
				<img
					src={`https://ui-avatars.com/api/?name=${user.name}`}
					alt="User Avatar"
					class="h-full w-full object-cover"
				/>
			</button>

			<!-- Dropdown Menu -->
			{#if showMenu}
				<div
					class="absolute right-0 z-10 mt-9 w-40 rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
				>
					<div class="px-4 pt-3 text-sm text-slate-700 dark:text-slate-200">{user.name}</div>
					<div class="px-4 py-1 text-[10px] text-slate-500 dark:text-slate-400">{user.email}</div>
					<a
						href="/profile"
						class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
					>
						Profile
					</a>
					{#if isAdmin}
						<a
							href="/settings/admin"
							class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
						>
							Administration
						</a>
					{/if}
					<button
						on:click={handleLogout}
						class="w-full px-4 py-2 text-left text-sm text-red-600 hover:cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
					>
						Logout
					</button>
				</div>
			{/if}
		</div>
	</div>
</header>
