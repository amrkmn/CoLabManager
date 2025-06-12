<script lang="ts">
	import { cn } from '$lib/utils/style';
	import { onMount } from 'svelte';

	let { projectId = null } = $props();
	interface Task {
		id: string;
		title: string;
		description: string;
		status: 'todo' | 'in-progress' | 'done';
		priority: 'low' | 'medium' | 'high';
		projectId?: string;
		projectName?: string;
		createdAt: string;
		updatedAt: string;
		files?: Array<{
			id: string;
			name: string;
			path: string;
			uploadedAt: string;
		}>;
	}

	interface KanbanColumn {
		id: 'todo' | 'in-progress' | 'done';
		name: string;
		tasks: Task[];
	}
	let columns: KanbanColumn[] = $state([
		{ id: 'todo', name: 'To Do', tasks: [] },
		{ id: 'in-progress', name: 'In Progress', tasks: [] },
		{ id: 'done', name: 'Done', tasks: [] }
	]);

	let newTasks: Record<string, string> = $state({
		todo: '',
		'in-progress': '',
		done: ''
	});
	let newTaskFiles: Record<string, File | null> = $state({
		todo: null,
		'in-progress': null,
		done: null
	});
	let newTaskPriorities: Record<string, 'low' | 'medium' | 'high'> = $state({
		todo: 'medium',
		'in-progress': 'medium',
		done: 'medium'
	});
	let isLoading = $state(false);
	let error = $state('');
	let editingPriority: string | null = $state(null); // Track which task's priority is being edited

	onMount(() => {
		if (projectId) {
			loadProjectTasks();
		} else {
			loadGeneralTasks();
		}

		// Add document click listener to close priority editor
		document.addEventListener('click', handleDocumentClick);

		// Cleanup on unmount
		return () => {
			document.removeEventListener('click', handleDocumentClick);
		};
	});

	async function loadProjectTasks() {
		if (!projectId) return;

		try {
			isLoading = true;
			error = '';

			const response = await fetch(`/api/projects/${projectId}/tasks`);
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to load tasks');
			}

			const tasks = result.tasks || [];
			updateColumns(tasks);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load tasks';
			console.error('Error loading project tasks:', err);
		} finally {
			isLoading = false;
		}
	}
	async function loadGeneralTasks() {
		// For general dashboard, we'll load tasks from all projects
		try {
			isLoading = true;
			error = '';

			const response = await fetch('/api/projects/tasks');

			if (response.ok) {
				const result = await response.json();
				const tasks = result.tasks || [];
				updateColumns(tasks);
			}
		} catch (err) {
			console.error('No general tasks endpoint available');
		} finally {
			isLoading = false;
		}
	}

	function updateColumns(tasks: Task[]) {
		// Reset all columns
		columns = columns.map((col) => ({ ...col, tasks: [] }));

		// Distribute tasks into columns
		tasks.forEach((task) => {
			const columnIndex = columns.findIndex((col) => col.id === task.status);
			if (columnIndex !== -1) {
				columns[columnIndex].tasks.push(task);
			}
		});
	}

	async function addTask(event: Event, columnId: 'todo' | 'in-progress' | 'done') {
		event.preventDefault();

		if (!newTasks[columnId]?.trim()) {
			return;
		}
		try {
			if (!projectId) {
				error = 'Cannot create tasks in general view. Please select a specific project.';
				return;
			}

			const endpoint = `/api/projects/${projectId}/tasks`;
			const formData = new FormData();
			formData.append('title', newTasks[columnId].trim());
			formData.append('description', '');
			formData.append('status', columnId);
			formData.append('priority', newTaskPriorities[columnId]);
			if (newTaskFiles[columnId]) {
				formData.append('file', newTaskFiles[columnId]);
			}

			const response = await fetch(endpoint, {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to add task');
			}

			// Add the new task to the appropriate column
			const newTask: Task = result;
			const columnIndex = columns.findIndex((col) => col.id === columnId);
			if (columnIndex !== -1) {
				columns[columnIndex] = {
					...columns[columnIndex],
					tasks: [...columns[columnIndex].tasks, newTask]
				};
			} // Clear the input
			newTasks[columnId] = '';
			newTaskFiles[columnId] = null;
			newTaskPriorities[columnId] = 'low';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add task';
			console.error('Error adding task:', err);
		}
	}
	async function moveTask(taskId: string, newStatus: 'todo' | 'in-progress' | 'done') {
		try {
			// Use projects API for both project-specific and general views
			const endpoint = projectId
				? `/api/projects/${projectId}/tasks/${taskId}`
				: `/api/projects/tasks/${taskId}`;

			const response = await fetch(endpoint, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status: newStatus })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to update task');
			}

			// Update the task in the columns
			const updatedTask = result;

			// Remove task from all columns
			columns = columns.map((col) => ({
				...col,
				tasks: col.tasks.filter((task) => task.id !== taskId)
			}));

			// Add task to the new column
			const newColumnIndex = columns.findIndex((col) => col.id === newStatus);
			if (newColumnIndex !== -1) {
				columns[newColumnIndex] = {
					...columns[newColumnIndex],
					tasks: [...columns[newColumnIndex].tasks, updatedTask]
				};
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to move task';
			console.error('Error moving task:', err);
		}
	}

	async function deleteTask(taskId: string) {
		if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
			return;
		}

		try {
			const endpoint = projectId
				? `/api/projects/${projectId}/tasks/${taskId}`
				: `/api/projects/tasks/${taskId}`;

			const response = await fetch(endpoint, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to delete task');
			}

			// Remove task from all columns
			columns = columns.map((col) => ({
				...col,
				tasks: col.tasks.filter((task) => task.id !== taskId)
			}));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete task';
			console.error('Error deleting task:', err);
		}
	}

	async function updateTaskPriority(taskId: string, newPriority: 'low' | 'medium' | 'high') {
		try {
			const endpoint = projectId
				? `/api/projects/${projectId}/tasks/${taskId}`
				: `/api/projects/tasks/${taskId}`;

			const response = await fetch(endpoint, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ priority: newPriority })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to update task priority');
			}

			// Update the task in the columns
			const updatedTask = result;
			columns = columns.map((col) => ({
				...col,
				tasks: col.tasks.map((task) =>
					task.id === taskId ? { ...task, priority: updatedTask.priority } : task
				)
			}));

			editingPriority = null; // Close the priority editor
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update task priority';
			console.error('Error updating task priority:', err);
		}
	}

	function handleDragStart(event: DragEvent, task: Task) {
		if (event.dataTransfer) {
			event.dataTransfer.setData('text/plain', task.id);
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(event: DragEvent, columnId: 'todo' | 'in-progress' | 'done') {
		event.preventDefault();
		const taskId = event.dataTransfer?.getData('text/plain');
		if (taskId) {
			moveTask(taskId, columnId);
		}
	}

	// Close priority editor when clicking outside
	function handleDocumentClick(event: MouseEvent) {
		const target = event.target as Element;
		if (!target.closest('.priority-editor')) {
			editingPriority = null;
		}
	}
</script>

{#if error}
	<div
		class="mb-4 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
	>
		<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
	</div>
{/if}

{#if isLoading}
	<div class="flex h-64 items-center justify-center">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
			></div>
			<p class="text-slate-600 dark:text-slate-400">Loading tasks...</p>
		</div>
	</div>
{:else}
	<div class={cn('flex w-full gap-6 overflow-x-auto py-4')}>
		{#each columns as column}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class={cn(
					'flex w-80 min-w-[280px] flex-col rounded-lg bg-white p-4 shadow-md dark:bg-slate-900'
				)}
				ondragover={handleDragOver}
				ondrop={(e) => handleDrop(e, column.id)}
			>
				<h3 class="mb-3 text-lg font-semibold text-slate-700 dark:text-slate-200">
					{column.name}
					<span class="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
						({column.tasks.length})
					</span>
				</h3>

				<ul class="not-prose mb-4 flex-1 space-y-2">
					{#each column.tasks as task (task.id)}
						<li
							class={cn(
								'flex flex-col gap-2 rounded bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
								'cursor-move transition-colors hover:bg-slate-200 dark:hover:bg-slate-700'
							)}
							draggable="true"
							ondragstart={(e) => handleDragStart(e, task)}
						>
							<div class="flex items-start justify-between">
								<span class="font-medium">{task.title}</span>
								{#if task.priority}
									{#if editingPriority === task.id}
										<select
											value={task.priority}
											onchange={(e) =>
												updateTaskPriority(
													task.id,
													(e.target as HTMLSelectElement).value as 'low' | 'medium' | 'high'
												)}
											onblur={() => (editingPriority = null)}
											class="priority-editor rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
										>
											<option value="low" class="dark:bg-slate-800 dark:text-white">🟢 Low</option>
											<option value="medium" class="dark:bg-slate-800 dark:text-white"
												>🟡 Medium</option
											>
											<option value="high" class="dark:bg-slate-800 dark:text-white">🔴 High</option
											>
										</select>
									{:else}
										<button
											onclick={(e) => {
												e.stopPropagation();
												editingPriority = task.id;
											}}
											class={cn(
												'rounded-full px-2 py-1 text-xs transition-colors hover:opacity-80',
												task.priority === 'high'
													? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
													: task.priority === 'medium'
														? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
														: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
											)}
											title="Click to change priority"
										>
											{task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
											{task.priority}
										</button>
									{/if}
								{/if}
							</div>
							{#if task.description}
								<p class="text-sm text-slate-600 dark:text-slate-400">{task.description}</p>
							{/if}
							{#if task.projectName && !projectId}
								<div class="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
									<span class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
									<span class="truncate">{task.projectName}</span>
								</div>
							{/if}
							{#if task.files && task.files.length > 0}
								<div class="flex flex-wrap gap-1">
									{#each task.files as file}
										<a
											href={file.path}
											target="_blank"
											class="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-3 w-3"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
												/>
											</svg>
											<span class="max-w-[80px] truncate">{file.name}</span>
										</a>
									{/each}
								</div>
							{/if}
							<div
								class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"
							>
								<span>{new Date(task.createdAt).toLocaleDateString()}</span>
								<button
									onclick={(e) => {
										e.stopPropagation();
										deleteTask(task.id);
									}}
									class="flex items-center gap-1 rounded px-2 py-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
									title="Delete task"
									aria-label="Delete task"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-3 w-3"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							</div>
						</li>
					{/each}
				</ul>

				<form onsubmit={(e) => addTask(e, column.id)} class="flex flex-col gap-2">
					<input
						type="text"
						placeholder="Add a task..."
						bind:value={newTasks[column.id]}
						class={cn(
							'rounded border px-2 py-1 text-sm',
							'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white',
							'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
						)}
					/>
					<div class="flex items-center gap-2">
						<select
							bind:value={newTaskPriorities[column.id]}
							class="rounded border bg-slate-100 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
						>
							<option value="low">🟢 Low</option>
							<option value="medium">🟡 Medium</option>
							<option value="high">🔴 High</option>
						</select>
						<label
							class="flex cursor-pointer items-center gap-1 rounded border border-slate-300 bg-slate-100 px-2 py-1 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-blue-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
								/></svg
							>
							<span class="hidden text-xs sm:inline">File</span>
							<input
								type="file"
								accept="*"
								onchange={(e) =>
									(newTaskFiles[column.id] = (e.target as HTMLInputElement).files?.[0] || null)}
								class="hidden"
							/>
						</label>
						{#if newTaskFiles[column.id]}
							<span class="max-w-[100px] truncate text-xs text-slate-500 dark:text-slate-400"
								>{newTaskFiles[column.id]?.name}</span
							>
						{/if}
					</div>
					<button
						type="submit"
						class={cn(
							'rounded bg-blue-600 py-1 text-sm text-white transition',
							'hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
						)}
						disabled={!newTasks[column.id]?.trim()}
					>
						Add Task
					</button>
				</form>
			</div>
		{/each}
	</div>
{/if}
