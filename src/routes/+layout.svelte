<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="max-w-none">
	{@render children()}
</div>
