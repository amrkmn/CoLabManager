<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="prose max-w-none">
	{@render children()}
</div>
