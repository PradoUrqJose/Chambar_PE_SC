<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	onMount(() => {
		// Si hay usuario, ir al dashboard, sino al login
		if (data.user) {
			goto('/dashboard');
		} else {
			goto('/login');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="text-center">
		<div class="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
		<p class="mt-4 text-gray-600">Redirigiendo...</p>
	</div>
</div>