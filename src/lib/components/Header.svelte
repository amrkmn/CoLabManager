<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils/style';
	import type { User } from '@prisma/client';
	import { onMount } from 'svelte';
	let { user } = $props<{ user: Omit<User, 'password'> }>();

	let showMenu = $state(false);
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

	function handleClickOutside(event: MouseEvent) {
		if (showMenu && dropdownRef && !dropdownRef.contains(event.target as Node)) {
			showMenu = false;
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
		'flex h-20 items-center justify-between',
		'border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
		'p-6 shadow-sm'
	)}
>
	<a href="/dashboard"
		><h1 class="mb-0 text-base font-medium text-slate-800 dark:text-white">CoLab Manager</h1></a
	>
	<div class="flex items-center gap-4">
		<!-- Avatar & Dropdown Trigger -->
		<div class="relative" bind:this={dropdownRef}>
			<!-- Avatar Dropdown Trigger -->
			<button
				onclick={toggleMenu}
				class="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-600"
				aria-label="User menu"
			>
				<img
					src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${user.name}`}
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
						onclick={handleLogout}
						class="w-full px-4 py-2 text-left text-sm text-red-600 hover:cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
					>
						Logout
					</button>
				</div>
			{/if}
		</div>
	</div>
</header>

<!-- Email Verification Banner -->
{#if showVerificationBanner}
	<div class="border-b border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
		<div class="mx-auto flex items-center justify-between px-6 py-3">
			<div class="flex items-center">
				<svg
					class="mr-3 h-5 w-5 text-yellow-600 dark:text-yellow-400"
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
				<div>
					<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
						Email Verification Required
					</p>
					<p class="text-xs text-yellow-700 dark:text-yellow-300">
						Please verify your email address to access all features.
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				{#if verificationMessage}
					<span class="text-xs text-green-700 dark:text-green-300">{verificationMessage}</span>
				{/if}
				{#if verificationError}
					<span class="text-xs text-red-700 dark:text-red-300">{verificationError}</span>
				{/if}
				<button
					onclick={resendVerification}
					disabled={isResendingVerification}
					class="rounded bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700 disabled:opacity-50 dark:bg-yellow-500 dark:hover:bg-yellow-600"
				>
					{#if isResendingVerification}
						<span class="flex items-center">
							<svg class="mr-1 h-3 w-3 animate-spin" viewBox="0 0 24 24">
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
					class="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
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
