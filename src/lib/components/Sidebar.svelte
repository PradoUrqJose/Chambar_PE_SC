<script lang="ts">
	import { page } from '$app/stores';
	import { fade, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let { isOpen = false, user = null }: { 
		isOpen?: boolean; 
		user: { email: string } | null; 
	} = $props();

	// Función para determinar si un enlace está activo
	function isActive(href: string) {
		return $page.url.pathname === href;
	}

	// Función para alternar el sidebar
	function toggleSidebar() {
		isOpen = !isOpen;
	}

	// Cerrar sidebar en móvil al hacer clic en un enlace
	function closeOnMobile() {
		if (window.innerWidth < 768) {
			isOpen = false;
		}
	}
</script>

<!-- Overlay para móvil -->
{#if isOpen}
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
		onclick={toggleSidebar}
		onkeydown={(e) => e.key === 'Escape' && toggleSidebar()}
		role="button"
		tabindex="0"
		aria-label="Cerrar menú de navegación"
		transition:fade={{ duration: 200, easing: quintOut }}
	></div>
{/if}

<!-- Sidebar -->
<aside 
	class="w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
		{isOpen ? 'translate-x-0' : '-translate-x-full'} 
		fixed top-0 left-0 h-full md:relative md:translate-x-0 md:shadow-none"
	transition:slide={{ duration: 300, easing: quintOut }}
>
	<!-- Header del Sidebar -->
	<div class="flex items-center justify-between p-4 border-b border-gray-200">
		<div class="flex items-center">
			<div class="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
				<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
				</svg>
			</div>
			<span class="ml-2 text-xl font-bold text-gray-900">Chambar</span>
		</div>
		
		<!-- Botón cerrar en móvil -->
		<button 
			class="md:hidden p-1 rounded-md hover:bg-gray-100"
			onclick={toggleSidebar}
			aria-label="Cerrar menú de navegación"
		>
			<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
			</svg>
		</button>
	</div>

	<!-- Navegación -->
	<nav class="flex-1 px-4 py-6 space-y-2">
		<a 
			href="/dashboard" 
			class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
				{isActive('/dashboard') 
					? 'bg-green-100 text-green-700' 
					: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
			onclick={closeOnMobile}
		>
			<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"></path>
			</svg>
			Dashboard
		</a>
		
		<a 
			href="/cash-boxes" 
			class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
				{isActive('/cash-boxes') 
					? 'bg-green-100 text-green-700' 
					: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
			onclick={closeOnMobile}
		>
			<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
			</svg>
			Caja
		</a>
		
		<a 
			href="/operations" 
			class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
				{isActive('/operations') 
					? 'bg-green-100 text-green-700' 
					: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
			onclick={closeOnMobile}
		>
			<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
			</svg>
			Operaciones
		</a>
		
		<a 
			href="/catalogs" 
			class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
				{isActive('/catalogs') 
					? 'bg-green-100 text-green-700' 
					: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
			onclick={closeOnMobile}
		>
			<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
			</svg>
			Catálogos
		</a>
		
		<a 
			href="/reports" 
			class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
				{isActive('/reports') 
					? 'bg-green-100 text-green-700' 
					: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
			onclick={closeOnMobile}
		>
			<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
			</svg>
			Reportes
		</a>
	</nav>

	<!-- Footer del Sidebar -->
	<div class="p-4 border-t border-gray-200">
		<div class="flex items-center justify-between">
			<div class="flex items-center">
				<div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-gray-900">{user?.email || 'Usuario'}</p>
					<p class="text-xs text-gray-500">Administrador</p>
				</div>
			</div>
		</div>
		
		<a 
			href="/logout" 
			class="mt-3 flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
		>
			<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
			</svg>
			Cerrar Sesión
		</a>
	</div>
</aside>
