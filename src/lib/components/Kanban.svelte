<script lang="ts">
	import { cn } from '$lib/utils/style';

	type KanbanTask = {
		text: string;
		file: File | null;
	};

	type KanbanColumn = {
		id: string;
		name: string;
		tasks: KanbanTask[];
	};

	let columns: KanbanColumn[] = [
		{ id: 'todo', name: 'To Do', tasks: [] },
		{ id: 'inprogress', name: 'In Progress', tasks: [] },
		{ id: 'done', name: 'Done', tasks: [] }
	];

	let newTasks: Record<string, string> = {};
	let selectedFiles: Record<string, File | null> = {};
	let fileInputs: Record<string, HTMLInputElement | null> = {};
	let uploadErrors: Record<string, string> = {};

	function addTask(event: Event, columnId: string) {
		event.preventDefault();

		if (!newTasks[columnId] && !selectedFiles[columnId]) {
			uploadErrors[columnId] = 'Please enter a task or attach a file.';
			return;
		}

		const index = columns.findIndex((c) => c.id === columnId);
		if (index !== -1) {
			const column = columns[index];
			const newTask: KanbanTask = {
				text: newTasks[columnId] || '',
				file: selectedFiles[columnId] ?? null
			};

			columns[index] = {
				...column,
				tasks: [...column.tasks, newTask]
			};

			newTasks[columnId] = '';
			selectedFiles[columnId] = null;
			if (fileInputs[columnId]) fileInputs[columnId]!.value = '';
			uploadErrors[columnId] = '';
		}
	}

	function handleFileChange(event: Event, columnId: string) {
		event.preventDefault();
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			const allowedTypes = [
				'image/jpeg',
				'image/png',
				'image/gif',
				'image/webp',
				'application/pdf',
				'application/msword',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'application/vnd.ms-excel',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			];
			if (!allowedTypes.includes(file.type)) {
				uploadErrors[columnId] =
					'Only JPG, PNG, GIF, WEBP images, Word, Excel, and PDF files are allowed.';
				if (fileInputs[columnId]) fileInputs[columnId]!.value = '';
				selectedFiles[columnId] = null;
				return;
			}
			selectedFiles[columnId] = file;
			uploadErrors[columnId] = '';
		}
	}
</script>

<div class={cn('flex w-full gap-6 overflow-x-auto py-4')}>
	{#each columns as column}
		<div
			class={cn(
				'flex w-80 min-w-[280px] flex-col rounded-lg bg-white p-4 shadow-md dark:bg-slate-900'
			)}
		>
			<h3 class="mb-3 text-lg font-semibold text-slate-700 dark:text-slate-200">{column.name}</h3>
			<ul class="not-prose mb-4 flex-1 space-y-2">
				{#each column.tasks as task}
					<li
						class="flex flex-col gap-1 rounded bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
					>
						<span>{task.text}</span>
						{#if task.file}
							{#if task.file.type.startsWith('image/')}
								<img
									src={URL.createObjectURL(task.file)}
									alt={task.file.name}
									class="max-h-40 max-w-full rounded border border-slate-300 object-contain dark:border-slate-700"
								/>
								<span class="truncate text-xs text-slate-500">🖼 {task.file.name}</span>
							{:else}
								<a
									class="truncate text-xs text-blue-500 hover:underline"
									href={URL.createObjectURL(task.file)}
									target="_blank"
									download={task.file.name}
								>
									📎 {task.file.name}
								</a>
							{/if}
						{/if}
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
						'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
					)}
				/>
				<input
					type="file"
					bind:this={fileInputs[column.id]}
					onchange={(e) => handleFileChange(e, column.id)}
					accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx"
					class="block w-full text-xs text-slate-500 file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-blue-600 file:px-2 file:py-1 file:text-white hover:file:bg-blue-700"
				/>
				{#if uploadErrors[column.id]}
					<span class="text-xs text-red-500">{uploadErrors[column.id]}</span>
				{/if}
				<button type="submit" class="rounded bg-blue-600 py-1 text-sm text-white hover:bg-blue-700">
					Add
				</button>
			</form>
		</div>
	{/each}
</div>
