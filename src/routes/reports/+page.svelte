<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	
	let isLoading = $state(true);
	let errorMessage = $state('');
	let selectedPeriod = $state('today');
	let reportData = $state({});

	// Cargar datos de reportes
	async function loadReports() {
		try {
			isLoading = true;
			// TODO: Implementar carga desde D1
			// Por ahora datos mock
			reportData = {
				today: {
					income: 1250.00,
					expense: 300.00,
					net: 950.00,
					operations: 45
				},
				week: {
					income: 8750.00,
					expense: 2100.00,
					net: 6650.00,
					operations: 315
				},
				month: {
					income: 35000.00,
					expense: 8400.00,
					net: 26600.00,
					operations: 1260
				}
			};
		} catch (error) {
			errorMessage = 'Error al cargar los reportes';
			console.error('Error loading reports:', error);
		} finally {
			isLoading = false;
		}
	}

	// Generar reporte
	async function generateReport() {
		try {
			// TODO: Implementar generación de reporte
			console.log('Generating report for period:', selectedPeriod);
		} catch (error) {
			errorMessage = 'Error al generar el reporte';
			console.error('Error generating report:', error);
		}
	}

	onMount(() => {
		loadReports();
	});
</script>

<svelte:head>
	<title>Reportes - Chambar</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Reportes</h1>
		<p class="mt-2 text-gray-600">Análisis y reportes del sistema de gestión de caja</p>
	</div>

	<!-- Mensaje de error -->
	{#if errorMessage}
		<div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
			<div class="flex">
				<svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				{errorMessage}
			</div>
		</div>
	{/if}

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
			<span class="ml-2 text-gray-600">Cargando reportes...</span>
		</div>
	{:else}
		<!-- Selector de período -->
		<div class="bg-white shadow rounded-lg mb-6">
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-medium text-gray-900">Seleccionar Período</h3>
			</div>
			<div class="px-6 py-4">
				<div class="flex space-x-4">
					<button
						onclick={() => selectedPeriod = 'today'}
						class="px-4 py-2 rounded-md text-sm font-medium
							{selectedPeriod === 'today' 
								? 'bg-green-100 text-green-700' 
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					>
						Hoy
					</button>
					<button
						onclick={() => selectedPeriod = 'week'}
						class="px-4 py-2 rounded-md text-sm font-medium
							{selectedPeriod === 'week' 
								? 'bg-green-100 text-green-700' 
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					>
						Esta Semana
					</button>
					<button
						onclick={() => selectedPeriod = 'month'}
						class="px-4 py-2 rounded-md text-sm font-medium
							{selectedPeriod === 'month' 
								? 'bg-green-100 text-green-700' 
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					>
						Este Mes
					</button>
				</div>
			</div>
		</div>

		<!-- Métricas del período seleccionado -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
								<dt class="text-sm font-medium text-gray-500 truncate">Ingresos</dt>
								<dd class="text-lg font-medium text-gray-900">S/. {reportData[selectedPeriod]?.income?.toFixed(2) || '0.00'}</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>

			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
								</svg>
							</div>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Egresos</dt>
								<dd class="text-lg font-medium text-gray-900">S/. {reportData[selectedPeriod]?.expense?.toFixed(2) || '0.00'}</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>

			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
								</svg>
							</div>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Neto</dt>
								<dd class="text-lg font-medium text-gray-900">S/. {reportData[selectedPeriod]?.net?.toFixed(2) || '0.00'}</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>

			<div class="bg-white overflow-hidden shadow rounded-lg">
				<div class="p-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
								<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
								</svg>
							</div>
						</div>
						<div class="ml-5 w-0 flex-1">
							<dl>
								<dt class="text-sm font-medium text-gray-500 truncate">Operaciones</dt>
								<dd class="text-lg font-medium text-gray-900">{reportData[selectedPeriod]?.operations || 0}</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Botón de generar reporte -->
		<div class="flex justify-center">
			<button
				onclick={generateReport}
				class="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
			>
				Generar Reporte Completo
			</button>
		</div>
	{/if}
</div>
