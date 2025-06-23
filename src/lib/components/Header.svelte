<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils/style';
	import type { User } from '@prisma/client';
	import { onMount } from 'svelte';
	let { user } = $props<{ user: Omit<User, 'password'> }>();

	let showMenu = $state(false);
	let showMobileMenu = $state(false);
	let isAdmin = $state(false);
	let dropdownRef: HTMLDivElement | null = null;
	let showVerificationBanner = $state(!user.emailVerified);
	let isResendingVerification = $state(false);
	let verificationMessage = $state('');
	let verificationError = $state('');

	if (user.role === 'Admin') {
		isAdmin = true;
	}

	function handleLogout() {
		goto('/auth/logout');
	}

	function toggleMenu() {
		showMenu = !showMenu;
	}

	function toggleMobileMenu() {
		showMobileMenu = !showMobileMenu;
	}

	function handleClickOutside(event: MouseEvent) {
		if (showMenu && dropdownRef && !dropdownRef.contains(event.target as Node)) {
			showMenu = false;
		}
		if (showMobileMenu && !dropdownRef?.contains(event.target as Node)) {
			showMobileMenu = false;
		}
	}

	async function resendVerification() {
		isResendingVerification = true;
		verificationError = '';
		verificationMessage = '';

		try {
			const response = await fetch('/api/resend-verification', {
				method: 'POST'
			});

			const result = await response.json();

			if (result.success) {
				verificationMessage = result.message;
			} else {
				verificationError = result.error;
			}
		} catch (error) {
			verificationError = 'Failed to resend verification email. Please try again.';
		} finally {
			isResendingVerification = false;
		}
	}

	function dismissVerificationBanner() {
		showVerificationBanner = false;
	}

	onMount(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	});
</script>

<header
	class={cn(
		'flex h-16 items-center justify-between sm:h-20',
		'border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
		'relative z-20 px-4 shadow-sm sm:px-6'
	)}
>
	<div class="flex items-center gap-3">
		<!-- Mobile Menu Button -->
		<button
			onclick={toggleMobileMenu}
			class="flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
			aria-label="Toggle mobile menu"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				></path>
			</svg>
		</button>

		<a href="/dashboard">
			<h1 class="mb-0 truncate text-sm font-medium text-slate-800 sm:text-base dark:text-white">
				CoLab Manager
			</h1>
		</a>
	</div>
	<div class="flex items-center gap-2 sm:gap-4">
		<!-- Desktop User Menu -->
		<div class="relative hidden sm:block" bind:this={dropdownRef}>
			<!-- Avatar Dropdown Trigger -->
			<button
				onclick={toggleMenu}
				class="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:h-10 sm:w-10 dark:border-slate-600"
				aria-label="User menu"
			>
				<img
					src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${user.name}`}
					alt="User Avatar"
					class="h-full w-full object-cover"
				/>
			</button>

			<!-- Desktop Dropdown Menu -->
			{#if showMenu}
				<div
					class="absolute right-0 z-10 mt-2 w-48 rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
				>
					<div class="px-4 pt-3 pb-1">
						<div class="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
							{user.name}
						</div>
						<div class="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
					</div>
					<div class="mt-2 border-t border-slate-200 dark:border-slate-700">
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
							onclick={handleLogout}
							class="w-full px-4 py-2 text-left text-sm text-red-600 hover:cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
						>
							Logout
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Mobile User Avatar (Just display, menu is in mobile sidebar) -->
		<div class="sm:hidden">
			<div
				class="h-8 w-8 overflow-hidden rounded-full border border-slate-300 dark:border-slate-600"
			>
				<img
					src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${user.name}`}
					alt="User Avatar"
					class="h-full w-full object-cover"
				/>
			</div>
		</div>
	</div>
</header>

<!-- Mobile Menu Overlay -->
{#if showMobileMenu}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
		role="button"
		tabindex="0"
		onclick={toggleMobileMenu}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ' ? toggleMobileMenu() : null)}
	></div>

	<!-- Mobile Menu Panel -->
	<div
		class="fixed top-0 left-0 z-50 h-full w-64 border-r border-slate-200 bg-white shadow-xl sm:hidden dark:border-slate-700 dark:bg-slate-900"
	>
		<!-- Mobile Menu Header -->
		<div
			class="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700"
		>
			<h2 class="text-lg font-semibold text-slate-800 dark:text-white">Menu</h2>
			<button
				onclick={toggleMobileMenu}
				aria-label="Close mobile menu"
				class="rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
			</button>
		</div>

		<!-- User Info -->
		<div class="border-b border-slate-200 p-4 dark:border-slate-700">
			<div class="flex items-center gap-3">
				<div
					class="h-10 w-10 overflow-hidden rounded-full border border-slate-300 dark:border-slate-600"
				>
					<img
						src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${user.name}`}
						alt="User Avatar"
						class="h-full w-full object-cover"
					/>
				</div>
				<div>
					<div class="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
						{user.name}
					</div>
					<div class="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
				</div>
			</div>
		</div>

		<!-- Mobile Navigation Links -->
		<nav class="flex-1 space-y-2 p-4">
			<a
				href="/dashboard"
				onclick={toggleMobileMenu}
				class="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
			>
				Dashboard
			</a>
			<a
				href="/profile"
				onclick={toggleMobileMenu}
				class="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
			>
				Profile
			</a>
			{#if isAdmin}
				<a
					href="/settings/admin"
					onclick={toggleMobileMenu}
					class="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
				>
					Administration
				</a>
			{/if}
		</nav>

		<!-- Mobile Logout Button -->
		<div class="border-t border-slate-200 p-4 dark:border-slate-700">
			<button
				onclick={handleLogout}
				class="w-full rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
			>
				Logout
			</button>
		</div>
	</div>
{/if}

<!-- Email Verification Banner -->
{#if showVerificationBanner}
	<div class="border-b border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
		<div
			class="mx-auto flex flex-col items-start justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-0 sm:px-6"
		>
			<div class="flex min-w-0 flex-1 items-start gap-2 sm:items-center sm:gap-3">
				<svg
					class="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 sm:mt-0 dark:text-yellow-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
					></path>
				</svg>
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
						Email Verification Required
					</p>
					<p class="text-xs text-yellow-700 dark:text-yellow-300">
						Please verify your email address to access all features.
					</p>
					{#if verificationMessage}
						<p class="mt-1 text-xs text-green-700 dark:text-green-300">{verificationMessage}</p>
					{/if}
					{#if verificationError}
						<p class="mt-1 text-xs text-red-700 dark:text-red-300">{verificationError}</p>
					{/if}
				</div>
			</div>
			<div class="flex w-full items-center gap-2 sm:w-auto">
				<button
					onclick={resendVerification}
					disabled={isResendingVerification}
					class="flex-1 rounded bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700 disabled:opacity-50 sm:flex-none dark:bg-yellow-500 dark:hover:bg-yellow-600"
				>
					{#if isResendingVerification}
						<span class="flex items-center justify-center gap-1">
							<svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24">
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
							Sending...
						</span>
					{:else}
						Resend Email
					{/if}
				</button>
				<button
					onclick={dismissVerificationBanner}
					class="flex-shrink-0 rounded-md p-1.5 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-200"
					aria-label="Dismiss verification banner"
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
	</div>
{/if}
