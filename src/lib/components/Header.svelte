<script lang="ts">
	let { onToggleSidebar }: { onToggleSidebar: () => void } = $props();
</script>

<header class="bg-white shadow-sm border-b border-gray-200 h-16">
	<div class="flex items-center justify-between px-6 h-full">
		<!-- Botón hamburguesa -->
		<button 
			class="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
			onclick={onToggleSidebar}
			aria-label="Abrir menú de navegación"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
			</svg>
		</button>

		<!-- Título de la página -->
		<div class="flex-1 text-center">
			<h1 class="text-lg font-semibold text-gray-900">Sistema de Gestión de Caja</h1>
		</div>

		<!-- Espacio para balancear el diseño -->
		<div class="w-10"></div>
	</div>
</header>
