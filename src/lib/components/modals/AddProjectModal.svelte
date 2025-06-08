<!-- filepath: c:\Amar\Codes\PTA\src\lib\components\AddProjectModal.svelte -->
<script lang="ts">
	import { cn } from '$lib/utils/style';

	interface Props {
		open?: boolean;
		onclose?: () => void;
		onprojectAdded?: (project: { id: string; name: string; description: string }) => void;
	}

	let { open = false, onclose, onprojectAdded }: Props = $props();

	let formData = $state({
		name: '',
		description: ''
	});

	let isLoading = $state(false);
	let error = $state('');
	function closeModal() {
		onclose?.();
		resetForm();
	}

	function resetForm() {
		formData.name = '';
		formData.description = '';
		error = '';
		isLoading = false;
	}

	async function handleSubmit() {
		if (!formData.name.trim()) {
			error = 'Project name is required';
			return;
		}

		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/projects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: formData.name.trim(),
					description: formData.description.trim()
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to create project');
			} // Call the success callback with project data
			onprojectAdded?.({
				id: result.project.id,
				name: result.project.name,
				description: result.project.description || ''
			});

			closeModal();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}
</script>

{#if open}
	<!-- Modal Backdrop -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
		role="dialog"
		tabindex="0"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<!-- Modal Content -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class={cn(
				'w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800',
				'transform transition-all duration-200 ease-out'
			)}
			role="document"
			tabindex="-1"
			onclick={handleBackdropClick}
			onkeydown={handleKeydown}
		>
			<!-- Modal Header -->
			<div class="mb-4 flex items-center justify-between">
				<h2 id="modal-title" class="text-lg font-semibold text-slate-900 dark:text-slate-100">
					Add New Project
				</h2>
				<button
					onclick={closeModal}
					class={cn(
						'rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600',
						'dark:hover:bg-slate-700 dark:hover:text-slate-300'
					)}
					aria-label="Close modal"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Modal Form -->
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<!-- Project Name -->
				<div class="mb-4">
					<label
						for="project-name"
						class="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
					>
						Project Name *
					</label>
					<input
						id="project-name"
						type="text"
						bind:value={formData.name}
						placeholder="Enter project name"
						class={cn(
							'w-full rounded-md border border-slate-300 px-3 py-2 text-sm',
							'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
							'dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100',
							'dark:focus:border-blue-400 dark:focus:ring-blue-400'
						)}
						required
						disabled={isLoading}
					/>
				</div>

				<!-- Project Description -->
				<div class="mb-6">
					<label
						for="project-description"
						class="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
					>
						Description
					</label>
					<textarea
						id="project-description"
						bind:value={formData.description}
						placeholder="Enter project description (optional)"
						rows="3"
						class={cn(
							'w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm',
							'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
							'dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100',
							'dark:focus:border-blue-400 dark:focus:ring-blue-400'
						)}
						disabled={isLoading}
					></textarea>
				</div>

				<!-- Error Message -->
				{#if error}
					<div
						class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20"
					>
						<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
					</div>
				{/if}

				<!-- Modal Actions -->
				<div class="flex justify-end gap-2">
					<button
						type="button"
						onclick={closeModal}
						class={cn(
							'rounded-md px-4 py-2 text-sm font-medium transition',
							'border border-slate-300 text-slate-700 hover:bg-slate-50',
							'dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
						)}
						disabled={isLoading}
					>
						Cancel
					</button>
					<button
						type="submit"
						class={cn(
							'rounded-md px-4 py-2 text-sm font-medium transition',
							'bg-blue-600 text-white hover:bg-blue-700',
							'disabled:cursor-not-allowed disabled:opacity-50',
							'dark:bg-blue-500 dark:hover:bg-blue-600'
						)}
						disabled={isLoading || !formData.name.trim()}
					>
						{isLoading ? 'Creating...' : 'Create Project'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
