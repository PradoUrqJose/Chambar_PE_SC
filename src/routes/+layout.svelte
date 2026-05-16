<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import type { LayoutData } from './$types';

	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { supabase } from '$lib/supabase';

	let { children, data } = $props<{ children: any; data: LayoutData }>();
	
	// Estado del sidebar
	let sidebarOpen = $state(false);
	
	// Verificar si el usuario está autenticado
	let isAuthenticated = $derived(!!data.user);
	
	// Función para alternar el sidebar
	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Layout principal -->
<div class="min-h-screen bg-gray-50">
	{#if isAuthenticated}
		<div class="flex h-screen">
			<!-- Sidebar -->
			<Sidebar bind:isOpen={sidebarOpen} user={data.user} />
			
			<!-- Contenido principal -->
			<div class="flex-1 flex flex-col overflow-hidden pl-8">
				<!-- Área de contenido -->
				<main class="flex-1 overflow-y-auto">
					<div class="p-6">
						{@render children?.()}
					</div>
				</main>
			</div>
		</div>
	{:else}
		<!-- Contenido sin sidebar para login -->
		<main class="min-h-screen">
			{@render children?.()}
		</main>
	{/if}
</div>