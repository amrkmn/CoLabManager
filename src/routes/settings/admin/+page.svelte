<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import AddUserModal from '$lib/components/modals/AddUserModal.svelte';
	import { cn } from '$lib/utils/style';
	import { onMount } from 'svelte';

	let { data } = $props();

	interface User {
		id: string;
		name: string;
		email: string;
		contactNumber: string;
		role: 'User' | 'Admin';
		createAt: string;
		profilePictureUrl?: string;
		_count?: {
			projects: number;
			tasks: number;
			files: number;
			messages: number;
		};
	}

	interface Project {
		id: string;
		name: string;
		description?: string;
		createdAt: string;
		user: {
			id: string;
			name: string;
			email: string;
		};
		_count: {
			tasks: number;
			files: number;
			messages: number;
		};
	}

	interface Stats {
		overview: {
			totalUsers: number;
			totalAdmins: number;
			totalProjects: number;
			totalTasks: number;
			totalFiles: number;
			totalMessages: number;
		};
		growth: {
			newUsersThisMonth: number;
			newProjectsThisMonth: number;
			newTasksThisWeek: number;
			userGrowthRate: number;
			projectGrowthRate: number;
		};
		distribution: {
			usersByRole: Record<string, number>;
			tasksByStatus: Record<string, number>;
		};
		recentActivity: Array<{
			type: string;
			description: string;
			timestamp: string;
			id: string;
		}>;
	}

	// State variables
	let activeTab = $state<'overview' | 'users' | 'projects' | 'settings'>('overview');
	let isLoading = $state(false);
	let error = $state('');
	let success = $state('');
	let stats = $state<Stats | null>(null);
	let users = $state<User[]>([]);
	let projects = $state<Project[]>([]);
	let selectedUsers = $state<string[]>([]);
	let selectedProjects = $state<string[]>([]);

	// User management modal state
	let showUserModal = $state(false);
	let editingUser = $state<User | null>(null);
	let userForm = $state({
		name: '',
		email: '',
		contactNumber: '',
		role: 'User' as 'User' | 'Admin',
		password: ''
	});

	// Pagination state
	let userPagination = $state({ page: 1, limit: 10, totalPages: 1, totalCount: 0 });
	let projectPagination = $state({ page: 1, limit: 10, totalPages: 1, totalCount: 0 });

	// Search state
	let userSearch = $state('');
	let projectSearch = $state('');

	onMount(() => {
		loadStats();
		if (activeTab === 'users') loadUsers();
		if (activeTab === 'projects') loadProjects();
	});

	async function loadStats() {
		try {
			isLoading = true;
			const response = await fetch('/api/admin/stats');
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to load statistics');
			}

			stats = result.stats;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load statistics';
		} finally {
			isLoading = false;
		}
	}

	async function loadUsers(page = 1, search = '') {
		try {
			isLoading = true;
			const params = new URLSearchParams({
				page: page.toString(),
				limit: userPagination.limit.toString(),
				...(search && { search })
			});

			const response = await fetch(`/api/admin/users?${params}`);
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to load users');
			}

			users = result.users;
			userPagination = { ...userPagination, ...result.pagination };
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load users';
		} finally {
			isLoading = false;
		}
	}

	async function loadProjects(page = 1, search = '') {
		try {
			isLoading = true;
			const params = new URLSearchParams({
				page: page.toString(),
				limit: projectPagination.limit.toString(),
				...(search && { search })
			});

			const response = await fetch(`/api/admin/projects?${params}`);
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to load projects');
			}

			projects = result.projects;
			projectPagination = { ...projectPagination, ...result.pagination };
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load projects';
		} finally {
			isLoading = false;
		}
	}

	function handleTabChange(tab: typeof activeTab) {
		activeTab = tab;
		error = '';
		success = '';

		if (tab === 'users' && users.length === 0) {
			loadUsers();
		} else if (tab === 'projects' && projects.length === 0) {
			loadProjects();
		}
	}

	function openUserModal(user?: User) {
		editingUser = user || null;
		userForm = {
			name: user?.name || '',
			email: user?.email || '',
			contactNumber: user?.contactNumber || '',
			role: user?.role || 'User',
			password: ''
		};
		showUserModal = true;
	}

	function closeUserModal() {
		showUserModal = false;
		editingUser = null;
		userForm = { name: '', email: '', contactNumber: '', role: 'User', password: '' };
	}

	async function handleUserSubmit() {
		try {
			isLoading = true;
			const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
			const method = editingUser ? 'PUT' : 'POST';

			const submitData: { [key: string]: any } = { ...userForm };
			if (editingUser && !submitData.password) {
				delete submitData.password;
			}

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(submitData)
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to save user');
			}

			success = editingUser ? 'User updated successfully' : 'User created successfully';
			closeUserModal();
			loadUsers(userPagination.page, userSearch);

			// Reload stats if needed
			if (!editingUser) {
				loadStats();
			}

			setTimeout(() => {
				success = '';
			}, 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save user';
		} finally {
			isLoading = false;
		}
	}

	async function deleteUser(userId: string) {
		if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
			return;
		}

		try {
			isLoading = true;
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to delete user');
			}

			success = 'User deleted successfully';
			loadUsers(userPagination.page, userSearch);
			loadStats();
			setTimeout(() => {
				success = '';
			}, 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete user';
		} finally {
			isLoading = false;
		}
	}

	async function deleteSelectedProjects() {
		if (selectedProjects.length === 0) return;

		if (
			!confirm(
				`Are you sure you want to delete ${selectedProjects.length} project(s)? This action cannot be undone.`
			)
		) {
			return;
		}

		try {
			isLoading = true;
			const response = await fetch('/api/admin/projects', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ projectIds: selectedProjects })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to delete projects');
			}

			success = result.message;
			selectedProjects = [];
			loadProjects(projectPagination.page, projectSearch);
			loadStats();
			setTimeout(() => {
				success = '';
			}, 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete projects';
		} finally {
			isLoading = false;
		}
	}

	function handleUserSearch() {
		userPagination.page = 1;
		loadUsers(1, userSearch);
	}

	function handleProjectSearch() {
		projectPagination.page = 1;
		loadProjects(1, projectSearch);
	}

	function toggleUserSelection(userId: string) {
		if (selectedUsers.includes(userId)) {
			selectedUsers = selectedUsers.filter((id) => id !== userId);
		} else {
			selectedUsers = [...selectedUsers, userId];
		}
	}

	function toggleProjectSelection(projectId: string) {
		if (selectedProjects.includes(projectId)) {
			selectedProjects = selectedProjects.filter((id) => id !== projectId);
		} else {
			selectedProjects = [...selectedProjects, projectId];
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatDateTime(dateString: string) {
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
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

	<main class="flex-1 p-6">
		<div class="mx-auto max-w-7xl">
			<h1 class="mb-6 text-3xl font-bold text-slate-800 dark:text-white">
				Administrator Dashboard
			</h1>

			<!-- Alert Messages -->
			{#if error}
				<div
					class="mb-4 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
				>
					<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
				</div>
			{/if}

			{#if success}
				<div
					class="mb-4 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
				>
					<p class="text-sm text-green-600 dark:text-green-400">{success}</p>
				</div>
			{/if}

			<!-- Navigation Tabs -->
			<div class="mb-6 border-b border-slate-200 dark:border-slate-700">
				<nav class="flex space-x-8">
					{#each [{ id: 'overview', label: 'Overview', icon: '📊' }, { id: 'users', label: 'User Management', icon: '👥' }, { id: 'projects', label: 'Project Management', icon: '📁' }, { id: 'settings', label: 'System Settings', icon: '⚙️' }] as tab}
						<button
							onclick={() => handleTabChange(tab.id as typeof activeTab)}
							class={cn(
								'flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition',
								activeTab === tab.id
									? 'border-blue-500 text-blue-600 dark:text-blue-400'
									: 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
							)}
						>
							<span>{tab.icon}</span>
							{tab.label}
						</button>
					{/each}
				</nav>
			</div>

			<!-- Overview Tab -->
			{#if activeTab === 'overview'}
				<div class="space-y-6">
					<!-- Statistics Cards -->
					{#if stats}
						<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
							<div class="rounded-lg bg-white p-5 shadow dark:bg-slate-800">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="text-3xl">👥</div>
									</div>
									<div class="ml-5 w-0 flex-1">
										<dl>
											<dt class="text-sm font-medium text-slate-500 dark:text-slate-400">
												Total Users
											</dt>
											<dd class="text-lg font-medium text-slate-900 dark:text-white">
												{stats.overview.totalUsers}
											</dd>
										</dl>
									</div>
								</div>
								{#if stats.growth.userGrowthRate > 0}
									<div class="mt-3 text-sm text-green-600 dark:text-green-400">
										+{stats.growth.userGrowthRate}% this month
									</div>
								{/if}
							</div>

							<div class="rounded-lg bg-white p-5 shadow dark:bg-slate-800">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="text-3xl">📁</div>
									</div>
									<div class="ml-5 w-0 flex-1">
										<dl>
											<dt class="text-sm font-medium text-slate-500 dark:text-slate-400">
												Total Projects
											</dt>
											<dd class="text-lg font-medium text-slate-900 dark:text-white">
												{stats.overview.totalProjects}
											</dd>
										</dl>
									</div>
								</div>
								{#if stats.growth.projectGrowthRate > 0}
									<div class="mt-3 text-sm text-green-600 dark:text-green-400">
										+{stats.growth.projectGrowthRate}% this month
									</div>
								{/if}
							</div>

							<div class="rounded-lg bg-white p-5 shadow dark:bg-slate-800">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="text-3xl">✅</div>
									</div>
									<div class="ml-5 w-0 flex-1">
										<dl>
											<dt class="text-sm font-medium text-slate-500 dark:text-slate-400">
												Total Tasks
											</dt>
											<dd class="text-lg font-medium text-slate-900 dark:text-white">
												{stats.overview.totalTasks}
											</dd>
										</dl>
									</div>
								</div>
								<div class="mt-3 text-sm text-blue-600 dark:text-blue-400">
									{stats.growth.newTasksThisWeek} created this week
								</div>
							</div>

							<div class="rounded-lg bg-white p-5 shadow dark:bg-slate-800">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="text-3xl">🔑</div>
									</div>
									<div class="ml-5 w-0 flex-1">
										<dl>
											<dt class="text-sm font-medium text-slate-500 dark:text-slate-400">
												Admin Users
											</dt>
											<dd class="text-lg font-medium text-slate-900 dark:text-white">
												{stats.overview.totalAdmins}
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>

						<!-- Recent Activity -->
						<div class="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
							<h3 class="mb-4 text-lg font-medium text-slate-900 dark:text-white">
								Recent Activity
							</h3>
							<div class="space-y-3">
								{#each stats.recentActivity as activity}
									<div class="flex items-start space-x-3">
										<div class="flex-shrink-0">
											{#if activity.type === 'user_created'}
												<div class="h-2 w-2 rounded-full bg-green-400"></div>
											{:else if activity.type === 'project_created'}
												<div class="h-2 w-2 rounded-full bg-blue-400"></div>
											{:else}
												<div class="h-2 w-2 rounded-full bg-purple-400"></div>
											{/if}
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-sm text-slate-900 dark:text-white">{activity.description}</p>
											<p class="text-xs text-slate-500 dark:text-slate-400">
												{formatDateTime(activity.timestamp)}
											</p>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else if isLoading}
						<div class="flex h-32 items-center justify-center">
							<div class="text-center">
								<div
									class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
								></div>
								<p class="text-slate-600 dark:text-slate-400">Loading statistics...</p>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Users Tab -->
			{#if activeTab === 'users'}
				<div class="space-y-4">
					<!-- User Actions -->
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<div class="flex items-center space-x-2">
								<input
									type="text"
									placeholder="Search users..."
									bind:value={userSearch}
									onkeydown={(e) => e.key === 'Enter' && handleUserSearch()}
									class="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
								/>
								<button
									onclick={handleUserSearch}
									class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
								>
									Search
								</button>
							</div>
						</div>
						<button
							onclick={() => openUserModal()}
							class="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
						>
							Add User
						</button>
					</div>
					<!-- Users Table -->
					<div class="rounded-lg bg-white shadow dark:bg-slate-800">
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
								<thead class="bg-slate-50 dark:bg-slate-700">
									<tr>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400"
										>
											User
										</th>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400"
										>
											Role
										</th>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400"
										>
											Contact
										</th>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400"
										>
											Joined
										</th>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400"
										>
											Activity
										</th>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400"
										>
											Actions
										</th>
									</tr>
								</thead>
								<tbody
									class="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800"
								>
									{#each users as user}
										<tr>
											<!-- User Info: Profile Image + Name/Email -->
											<td class="px-6 py-4 align-middle whitespace-nowrap">
												<div class="flex items-center space-x-3">
													{#if user.profilePictureUrl}
														<img
															class="h-10 w-10 rounded-full object-cover"
															src={user.profilePictureUrl}
															alt={user.name}
														/>
													{:else}
														<div
															class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-600"
														>
															<span class="text-sm font-medium text-slate-700 dark:text-slate-300">
																{user.name.charAt(0).toUpperCase()}
															</span>
														</div>
													{/if}
													<div>
														<div
															class="truncate text-sm font-medium text-slate-900 dark:text-white"
														>
															{user.name}
														</div>
														<div class="truncate text-sm text-slate-500 dark:text-slate-400">
															{user.email}
														</div>
													</div>
												</div>
											</td>
											<!-- Role -->
											<td class="px-6 py-4 align-middle whitespace-nowrap">
												<span
													class={cn(
														'inline-flex rounded-full px-2 text-xs leading-5 font-semibold',
														user.role === 'Admin'
															? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
															: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
													)}
												>
													{user.role}
												</span>
											</td>
											<!-- Contact -->
											<td
												class="px-6 py-4 align-middle text-sm whitespace-nowrap text-slate-900 dark:text-white"
											>
												{user.contactNumber}
											</td>
											<!-- Joined -->
											<td
												class="px-6 py-4 align-middle text-sm whitespace-nowrap text-slate-500 dark:text-slate-400"
											>
												{formatDate(user.createAt)}
											</td>
											<!-- Activity -->
											<td
												class="px-6 py-4 align-middle text-sm whitespace-nowrap text-slate-500 dark:text-slate-400"
											>
												{#if user._count}
													{user._count.projects} projects, {user._count.tasks} tasks
												{:else}
													-
												{/if}
											</td>
											<!-- Actions -->
											<td class="px-6 py-4 align-middle text-sm font-medium whitespace-nowrap">
												<button
													onclick={() => openUserModal(user)}
													class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
												>
													Edit
												</button>
												{#if user.id !== data.user.id}
													<button
														onclick={() => deleteUser(user.id)}
														class="ml-4 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
													>
														Delete
													</button>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			{/if}

			<!-- Projects Tab -->
			{#if activeTab === 'projects'}
				<div class="space-y-4">
					<!-- Project Actions -->
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<div class="flex items-center space-x-2">
								<input
									type="text"
									placeholder="Search projects..."
									bind:value={projectSearch}
									onkeydown={(e) => e.key === 'Enter' && handleProjectSearch()}
									class="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
								/>
								<button
									onclick={handleProjectSearch}
									class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
								>
									Search
								</button>
							</div>
							{#if selectedProjects.length > 0}
								<button
									onclick={deleteSelectedProjects}
									class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
								>
									Delete Selected ({selectedProjects.length})
								</button>
							{/if}
						</div>
					</div>

					<!-- Projects Table -->
					<div class="rounded-lg bg-white shadow dark:bg-slate-800">
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
								<thead class="bg-slate-50 dark:bg-slate-700">
									<tr>
										<th class="px-6 py-3 text-left">
											<input
												type="checkbox"
												onchange={(e) => {
													if (e.target && (e.target as HTMLInputElement).checked) {
														selectedProjects = projects.map((p) => p.id);
													} else {
														selectedProjects = [];
													}
												}}
												class="rounded border-slate-300"
											/>
										</th>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400"
										>
											Project
										</th>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400"
										>
											Owner
										</th>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400"
										>
											Created
										</th>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400"
										>
											Activity
										</th>
									</tr>
								</thead>
								<tbody
									class="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800"
								>
									{#each projects as project}
										<tr>
											<td class="px-6 py-4 whitespace-nowrap">
												<input
													type="checkbox"
													checked={selectedProjects.includes(project.id)}
													onchange={() => toggleProjectSelection(project.id)}
													class="rounded border-slate-300"
												/>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<div>
													<div class="text-sm font-medium text-slate-900 dark:text-white">
														{project.name}
													</div>
													{#if project.description}
														<div class="text-sm text-slate-500 dark:text-slate-400">
															{project.description}
														</div>
													{/if}
												</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm text-slate-900 dark:text-white">
													{project.user.name}
												</div>
												<div class="text-sm text-slate-500 dark:text-slate-400">
													{project.user.email}
												</div>
											</td>
											<td
												class="px-6 py-4 text-sm whitespace-nowrap text-slate-500 dark:text-slate-400"
											>
												{formatDate(project.createdAt)}
											</td>
											<td
												class="px-6 py-4 text-sm whitespace-nowrap text-slate-500 dark:text-slate-400"
											>
												{project._count.tasks} tasks, {project._count.files} files, {project._count
													.messages} messages
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<!-- Project Pagination -->
						{#if projectPagination.totalPages > 1}
							<div
								class="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
							>
								<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
									<div>
										<p class="text-sm text-slate-700 dark:text-slate-300">
											Showing page {projectPagination.page} of {projectPagination.totalPages} ({projectPagination.totalCount}
											total projects)
										</p>
									</div>
									<div>
										<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm">
											<button
												onclick={() => loadProjects(projectPagination.page - 1, projectSearch)}
												disabled={projectPagination.page <= 1}
												class="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 disabled:opacity-50"
											>
												←
											</button>
											<button
												onclick={() => loadProjects(projectPagination.page + 1, projectSearch)}
												disabled={projectPagination.page >= projectPagination.totalPages}
												class="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 disabled:opacity-50"
											>
												→
											</button>
										</nav>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- System Settings Tab -->
			{#if activeTab === 'settings'}
				<div class="space-y-6">
					<div class="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
						<h3 class="mb-4 text-lg font-medium text-slate-900 dark:text-white">
							System Information
						</h3>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<dt class="text-sm font-medium text-slate-500 dark:text-slate-400">
									Application Version
								</dt>
								<dd class="mt-1 text-sm text-slate-900 dark:text-white">1.0.0</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-slate-500 dark:text-slate-400">
									Database Status
								</dt>
								<dd class="mt-1 text-sm text-green-600 dark:text-green-400">Connected</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-slate-500 dark:text-slate-400">Storage Used</dt>
								<dd class="mt-1 text-sm text-slate-900 dark:text-white">-</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-slate-500 dark:text-slate-400">Last Backup</dt>
								<dd class="mt-1 text-sm text-slate-900 dark:text-white">-</dd>
							</div>
						</div>
					</div>

					<div class="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
						<h3 class="mb-4 text-lg font-medium text-slate-900 dark:text-white">Quick Actions</h3>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<button
								onclick={() => loadStats()}
								class="rounded-lg border border-slate-300 p-4 text-left hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
							>
								<div class="text-lg font-medium text-slate-900 dark:text-white">
									Refresh Statistics
								</div>
								<div class="text-sm text-slate-500 dark:text-slate-400">Update dashboard data</div>
							</button>
							<button
								class="rounded-lg border border-slate-300 p-4 text-left hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
							>
								<div class="text-lg font-medium text-slate-900 dark:text-white">Export Data</div>
								<div class="text-sm text-slate-500 dark:text-slate-400">Download system backup</div>
							</button>
							<button
								class="rounded-lg border border-slate-300 p-4 text-left hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
							>
								<div class="text-lg font-medium text-slate-900 dark:text-white">System Logs</div>
								<div class="text-sm text-slate-500 dark:text-slate-400">View application logs</div>
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</main>
</div>

<!-- User Modal -->
<AddUserModal
	bind:show={showUserModal}
	bind:editingUser
	bind:userForm
	{isLoading}
	onSubmit={handleUserSubmit}
	onClose={closeUserModal}
/>
