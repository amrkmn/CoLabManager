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
	let isLoading = $state(false);
	let error = $state('');

	onMount(() => {
		if (projectId) {
			loadProjectTasks();
		} else {
			loadGeneralTasks();
		}
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
			// Silently fail for general tasks for now
			console.log('No general tasks endpoint available');
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
			const taskData = {
				title: newTasks[columnId].trim(),
				description: '',
				status: columnId,
				priority: 'medium' as const
			};

			// For project-specific kanban, use project API. For general kanban, we need a project to create a task
			if (!projectId) {
				error = 'Cannot create tasks in general view. Please select a specific project.';
				return;
			}

			const endpoint = `/api/projects/${projectId}/tasks`;

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(taskData)
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
									<span
										class={cn(
											'rounded-full px-2 py-1 text-xs',
											task.priority === 'high'
												? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
												: task.priority === 'medium'
													? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
													: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
										)}
									>
										{task.priority}
									</span>
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
							<div
								class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"
							>
								<span>{new Date(task.createdAt).toLocaleDateString()}</span>
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
