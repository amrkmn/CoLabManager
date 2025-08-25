<script lang="ts">
	import { onMount } from 'svelte';
	import { Toaster, toast } from 'svelte-sonner';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		const url = new URL(window.location.href);
		const error = url.searchParams.get('error');
		const message = url.searchParams.get('message');

		if (error) {
			toast.error(error);
		}

		if (message) {
			toast.success(message);
		}
	});
</script>

<Toaster richColors />
<div class="max-w-none">
	{@render children()}
</div>
