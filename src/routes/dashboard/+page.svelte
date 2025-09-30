<!-- Dashboard principal del sistema -->
<!-- Esta página muestra información general y acceso a las funciones principales -->

<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	// Variables reactivas
	let currentTime = new Date();
	let timeInterval: NodeJS.Timeout;
	
	// Actualizar hora cada segundo
	onMount(() => {
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);
		
		// Limpiar intervalo al desmontar el componente
		return () => {
			if (timeInterval) {
				clearInterval(timeInterval);
			}
		};
	});
	
	// Formatear fecha y hora
	function formatDateTime(date: Date) {
		return date.toLocaleString('es-PE', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Dashboard - Chambar</title>
</svelte:head>

<!-- Header con información del usuario -->
<header class="bg-white shadow">
	<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">
					Dashboard
				</h1>
				<p class="mt-1 text-sm text-gray-500">
					Sistema de Caja Administrativa
				</p>
			</div>
			<div class="text-right">
				<p class="text-sm text-gray-500">Hora actual:</p>
				<p class="text-lg font-medium text-gray-900">
					{formatDateTime(currentTime)}
				</p>
				<!-- Botón de logout -->
				<form method="POST" action="/logout" class="mt-2">
					<button
						type="submit"
						class="text-sm text-red-600 hover:text-red-900 font-medium"
					>
						Cerrar Sesión
					</button>
				</form>
			</div>
		</div>
	</div>
</header>

<!-- Contenido principal -->
<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
	<div class="px-4 py-6 sm:px-0">
		<!-- Tarjetas de funciones principales -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<!-- Caja -->
			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
								</svg>
							</div>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">
									Gestión de Caja
								</dt>
								<dd class="text-lg font-medium text-gray-900">
									Próximamente
								</dd>
							</dl>
						</div>
					</div>
				</div>
				<div class="bg-gray-50 px-5 py-3">
					<div class="text-sm">
						<a href="/cash-boxes" class="font-medium text-indigo-700 hover:text-indigo-900">
							Gestionar caja
						</a>
					</div>
				</div>
			</div>
			
			<!-- Operaciones -->
			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
								</svg>
							</div>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">
									Operaciones
								</dt>
								<dd class="text-lg font-medium text-gray-900">
									Próximamente
								</dd>
							</dl>
						</div>
					</div>
				</div>
				<div class="bg-gray-50 px-5 py-3">
					<div class="text-sm">
						<a href="/operations" class="font-medium text-indigo-700 hover:text-indigo-900">
							Ver operaciones
						</a>
					</div>
				</div>
			</div>
			
			<!-- Catálogos -->
			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
								</svg>
							</div>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">
									Catálogos
								</dt>
								<dd class="text-lg font-medium text-gray-900">
									Gestión completa
								</dd>
							</dl>
						</div>
					</div>
				</div>
				<div class="bg-gray-50 px-5 py-3">
					<div class="text-sm">
						<a href="/catalogs" class="font-medium text-indigo-700 hover:text-indigo-900">
							Gestionar catálogos
						</a>
					</div>
				</div>
			</div>
			
        <!-- Reportes -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">
                                Reportes
                            </dt>
                            <dd class="text-lg font-medium text-gray-900">
                                Análisis completo
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            <div class="bg-gray-50 px-5 py-3">
                <div class="text-sm">
                    <a href="/reports" class="font-medium text-indigo-700 hover:text-indigo-900">
                        Ver reportes
                    </a>
                </div>
            </div>
        </div>
		</div>
		
		<!-- Información del sistema -->
		<div class="mt-8 bg-white shadow rounded-lg">
			<div class="px-4 py-5 sm:p-6">
				<h3 class="text-lg leading-6 font-medium text-gray-900">
					Estado del Sistema
				</h3>
				<div class="mt-2 max-w-xl text-sm text-gray-500">
					<p>
						Sistema de Caja Administrativa Chambar v0.0.1
					</p>
					<p class="mt-1">
						Desarrollado con SvelteKit, TailwindCSS y Cloudflare D1
					</p>
				</div>
				<div class="mt-5">
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
						En línea
					</span>
				</div>
			</div>
		</div>
	</div>
</main>
