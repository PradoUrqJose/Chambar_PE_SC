<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
    import '../app.css';
	import { page } from '$app/stores';

	let { children } = $props();
	
	// Función para determinar si un enlace está activo
	function isActive(href: string) {
		return $page.url.pathname === href;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Layout principal con navegación -->
<div class="min-h-screen bg-gray-50">
	<!-- Header de navegación -->
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<!-- Logo -->
				<div class="flex items-center">
					<a href="/dashboard" class="flex items-center">
						<div class="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
							</svg>
						</div>
						<span class="ml-2 text-xl font-bold text-gray-900">Chambar</span>
					</a>
				</div>
				
				<!-- Navegación principal -->
				<nav class="hidden md:flex space-x-8">
					<a 
						href="/dashboard" 
						class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
							{isActive('/dashboard') 
								? 'bg-indigo-100 text-indigo-700' 
								: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}"
					>
						Dashboard
					</a>
					<a 
						href="/cash-boxes" 
						class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
							{isActive('/cash-boxes') 
								? 'bg-indigo-100 text-indigo-700' 
								: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}"
					>
						Caja
					</a>
					<a 
						href="/operations" 
						class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
							{isActive('/operations') 
								? 'bg-indigo-100 text-indigo-700' 
								: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}"
					>
						Operaciones
					</a>
					<a 
						href="/catalogs" 
						class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
							{isActive('/catalogs') 
								? 'bg-indigo-100 text-indigo-700' 
								: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}"
					>
						Catálogos
					</a>
					<a 
						href="/reports" 
						class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
							{isActive('/reports') 
								? 'bg-indigo-100 text-indigo-700' 
								: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}"
					>
						Reportes
					</a>
				</nav>
				
				<!-- Menú móvil (hamburguesa) -->
				<div class="md:hidden">
					<button 
						type="button" 
						class="bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
					>
						<span class="sr-only">Abrir menú principal</span>
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	</header>
	
	<!-- Contenido principal -->
	<main class="flex-1">
		{@render children?.()}
	</main>
</div>
