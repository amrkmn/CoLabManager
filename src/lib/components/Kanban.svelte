<script lang="ts">
	import { cn } from '$lib/utils/style';

	type KanbanTask = {
		text: string;
		file: { name: string; type: string } | null;
	};

	type KanbanColumn = {
		id: string;
		name: string;
		tasks: KanbanTask[];
	};

	let columns: KanbanColumn[] = [
		{ id: 'pending', name: 'Pending', tasks: [] },
		{ id: 'inprogress', name: 'In Progress', tasks: [] },
		{ id: 'completed', name: 'Completed', tasks: [] }
	];

	let newTask = '';
	let selectedFile: File | null = null;
	let fileInput: HTMLInputElement | null = null;
	let uploadError = '';

	function addTask(columnId: string) {
		if (!newTask && !selectedFile) return;
		const column = columns.find((c) => c.id === columnId);
		if (column) {
			column.tasks.push({
				text: newTask,
				file: selectedFile ? { name: selectedFile.name, type: selectedFile.type } : null
			});
			newTask = '';
			selectedFile = null;
			if (fileInput) fileInput.value = '';
			uploadError = '';
		}
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];

			const allowedTypes = [
				'image/jpeg',
				'image/png',
				'image/gif',
				'image/webp',
				'application/pdf'
			];
			if (!allowedTypes.includes(file.type)) {
				uploadError = 'Only JPG, PNG, GIF, WEBP images and PDF files are allowed.';
				if (fileInput) fileInput.value = '';
				selectedFile = null;
				return;
			}
			selectedFile = file;
			uploadError = '';
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
			<ul class="mb-4 flex-1 space-y-2">
				{#each column.tasks as task}
					<li
						class="flex flex-col gap-1 rounded bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
					>
						<span>{task.text}</span>
						{#if task.file}
							<span class="truncate text-xs text-slate-500">📎 {task.file.name}</span>
						{/if}
					</li>
				{/each}
			</ul>
			<form on:submit|preventDefault={() => addTask(column.id)} class="flex flex-col gap-2">
				<input
					type="text"
					placeholder="Add a task..."
					bind:value={newTask}
					class={cn(
						'rounded border px-2 py-1 text-sm',
						'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
					)}
				/>
				<input
					type="file"
					bind:this={fileInput}
					on:change={handleFileChange}
					accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
					class="block w-full text-xs text-slate-500 file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-blue-600 file:px-2 file:py-1 file:text-white hover:file:bg-blue-700"
				/>
				{#if uploadError}
					<span class="text-xs text-red-500">{uploadError}</span>
				{/if}
				<button type="submit" class="rounded bg-blue-600 py-1 text-sm text-white hover:bg-blue-700"
					>Add</button
				>
			</form>
		</div>
	{/each}
</div>
