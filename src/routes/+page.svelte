<!-- Página principal - redirige al login -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	// Redirigir automáticamente al login
	onMount(() => {
		goto('/login');
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="text-center">
		<h1 class="text-4xl font-bold text-gray-900 mb-4">
			Chambar
		</h1>
		<p class="text-lg text-gray-600 mb-8">
			Sistema de Caja Administrativa
		</p>
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
		<p class="mt-4 text-sm text-gray-500">
			Redirigiendo al login...
		</p>
	</div>
</div>
