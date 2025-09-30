<!-- Página principal de reportes y estadísticas -->
<!-- Esta página permite generar y visualizar reportes del sistema -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import PieChart from '$lib/components/charts/PieChart.svelte';
	import MetricCard from '$lib/components/MetricCard.svelte';
	
	// Variables reactivas
	let activeReport = 'daily-summary';
	let isLoading = true;
	let errorMessage = '';
	let successMessage = '';
	
	// Filtros de fecha
	let dateRange = {
		start: new Date().toISOString().split('T')[0],
		end: new Date().toISOString().split('T')[0]
	};
	
	// Datos de reportes
	let dailySummary: any = null;
	let operationsReport: any = null;
	let cashBoxesReport: any = null;
	
	// Métricas en tiempo real
	let realtimeMetrics = {
		todayIncome: 0,
		todayExpense: 0,
		todayNet: 0,
		openCashBoxes: 0,
		totalOperations: 0
	};
	
	// Cargar datos iniciales
	async function loadInitialData() {
		try {
			isLoading = true;
			
			// Cargar métricas en tiempo real
			await loadRealtimeMetrics();
			
			// Cargar reporte diario por defecto
			await loadDailySummary();
			
		} catch (error) {
			console.error('Error cargando datos iniciales:', error);
			errorMessage = 'Error cargando datos';
		} finally {
			isLoading = false;
		}
	}
	
	// Cargar métricas en tiempo real
	async function loadRealtimeMetrics() {
		try {
			const response = await fetch('/api/reports/realtime-metrics');
			const result = await response.json();
			
			if (result.success) {
				realtimeMetrics = result.data;
			}
		} catch (error) {
			console.error('Error cargando métricas:', error);
		}
	}
	
	// Cargar resumen diario
	async function loadDailySummary() {
		try {
			const response = await fetch(`/api/reports/daily-summary?date=${dateRange.start}`);
			const result = await response.json();
			
			if (result.success) {
				dailySummary = result.data;
			} else {
				errorMessage = result.error || 'Error cargando resumen diario';
			}
		} catch (error) {
			console.error('Error cargando resumen diario:', error);
			errorMessage = 'Error de conexión';
		}
	}
	
	// Cargar reporte de operaciones
	async function loadOperationsReport() {
		try {
			const response = await fetch(`/api/reports/operations?start=${dateRange.start}&end=${dateRange.end}`);
			const result = await response.json();
			
			if (result.success) {
				operationsReport = result.data;
			} else {
				errorMessage = result.error || 'Error cargando reporte de operaciones';
			}
		} catch (error) {
			console.error('Error cargando reporte de operaciones:', error);
			errorMessage = 'Error de conexión';
		}
	}
	
	// Cargar reporte de cajas
	async function loadCashBoxesReport() {
		try {
			const response = await fetch(`/api/reports/cash-boxes?start=${dateRange.start}&end=${dateRange.end}`);
			const result = await response.json();
			
			if (result.success) {
				cashBoxesReport = result.data;
			} else {
				errorMessage = result.error || 'Error cargando reporte de cajas';
			}
		} catch (error) {
			console.error('Error cargando reporte de cajas:', error);
			errorMessage = 'Error de conexión';
		}
	}
	
	// Cambiar reporte activo
	async function setActiveReport(report: string) {
		activeReport = report;
		errorMessage = '';
		
		switch (report) {
			case 'daily-summary':
				await loadDailySummary();
				break;
			case 'operations':
				await loadOperationsReport();
				break;
			case 'cash-boxes':
				await loadCashBoxesReport();
				break;
		}
	}
	
	// Exportar a Excel
	async function exportToExcel() {
		try {
			let endpoint = '';
			
			switch (activeReport) {
				case 'daily-summary':
					endpoint = `/api/reports/export/daily-summary?date=${dateRange.start}`;
					break;
				case 'operations':
					endpoint = `/api/reports/export/operations?start=${dateRange.start}&end=${dateRange.end}`;
					break;
				case 'cash-boxes':
					endpoint = `/api/reports/export/cash-boxes?start=${dateRange.start}&end=${dateRange.end}`;
					break;
			}
			
			const response = await fetch(endpoint);
			
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `reporte-${activeReport}-${dateRange.start}.xlsx`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				
				successMessage = 'Reporte exportado correctamente';
			} else {
				errorMessage = 'Error exportando reporte';
			}
		} catch (error) {
			console.error('Error exportando:', error);
			errorMessage = 'Error de conexión';
		}
	}
	
	// Formatear monto
	function formatAmount(amount: number) {
		return new Intl.NumberFormat('es-PE', {
			style: 'currency',
			currency: 'PEN'
		}).format(amount / 100);
	}
	
	// Formatear fecha
	function formatDate(date: string) {
		return new Date(date).toLocaleDateString('es-PE', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	
	// Cargar datos al montar
	onMount(() => {
		loadInitialData();
	});
</script>

<svelte:head>
	<title>Reportes - Chambar</title>
</svelte:head>

<!-- Header -->
<header class="bg-white shadow-sm border-b">
	<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">
					Reportes y Estadísticas
				</h1>
				<p class="mt-1 text-sm text-gray-500">
					Análisis de operaciones y métricas del sistema
				</p>
			</div>
			<div class="flex space-x-4">
				<button
					on:click={exportToExcel}
					class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
				>
					Exportar Excel
				</button>
				<a
					href="/dashboard"
					class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>
					Volver al Dashboard
				</a>
			</div>
		</div>
	</div>
</header>

<!-- Contenido principal -->
<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
	<div class="px-4 py-6 sm:px-0">
		
		<!-- Mensajes -->
		{#if errorMessage}
			<div class="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
				{errorMessage}
			</div>
		{/if}
		
		{#if successMessage}
			<div class="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
				{successMessage}
			</div>
		{/if}
		
		<!-- Métricas en tiempo real -->
		<div class="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
			<MetricCard
				title="Ingresos Hoy"
				value={realtimeMetrics.todayIncome}
				icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
				color="green"
				format="currency"
			/>
			
			<MetricCard
				title="Egresos Hoy"
				value={realtimeMetrics.todayExpense}
				icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
				color="red"
				format="currency"
			/>
			
			<MetricCard
				title="Neto Hoy"
				value={realtimeMetrics.todayNet}
				icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
				color="blue"
				format="currency"
			/>
			
			<MetricCard
				title="Cajas Abiertas"
				value={realtimeMetrics.openCashBoxes}
				icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
				color="purple"
				format="number"
			/>
			
			<MetricCard
				title="Total Operaciones"
				value={realtimeMetrics.totalOperations}
				icon="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
				color="orange"
				format="number"
			/>
		</div>
		
		<!-- Filtros de fecha -->
		<div class="mb-6 bg-white shadow rounded-lg p-4">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Filtros de Fecha</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label for="startDate" class="block text-sm font-medium text-gray-700">Fecha Inicio</label>
					<input
						id="startDate"
						type="date"
						bind:value={dateRange.start}
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>
				<div>
					<label for="endDate" class="block text-sm font-medium text-gray-700">Fecha Fin</label>
					<input
						id="endDate"
						type="date"
						bind:value={dateRange.end}
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>
				<div class="flex items-end">
					<button
						on:click={() => setActiveReport(activeReport)}
						class="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						Actualizar Reporte
					</button>
				</div>
			</div>
		</div>
		
		<!-- Tabs de reportes -->
		<div class="mb-6">
			<div class="border-b border-gray-200">
				<nav class="-mb-px flex space-x-8">
					<button
						on:click={() => setActiveReport('daily-summary')}
						class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
							{activeReport === 'daily-summary' 
								? 'border-indigo-500 text-indigo-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Resumen Diario
					</button>
					<button
						on:click={() => setActiveReport('operations')}
						class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
							{activeReport === 'operations' 
								? 'border-indigo-500 text-indigo-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Operaciones
					</button>
					<button
						on:click={() => setActiveReport('cash-boxes')}
						class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
							{activeReport === 'cash-boxes' 
								? 'border-indigo-500 text-indigo-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Cajas
					</button>
				</nav>
			</div>
		</div>
		
		<!-- Contenido de reportes -->
		{#if isLoading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
				<span class="ml-3 text-gray-600">Cargando reporte...</span>
			</div>
		{:else}
			
			<!-- Resumen Diario -->
			{#if activeReport === 'daily-summary' && dailySummary}
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
							Resumen Diario - {formatDate(dateRange.start)}
						</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div class="bg-green-50 border border-green-200 rounded-lg p-4">
								<div class="text-sm font-medium text-green-800">Total Ingresos</div>
								<div class="text-2xl font-bold text-green-900">{formatAmount(dailySummary.totalIncome)}</div>
							</div>
							<div class="bg-red-50 border border-red-200 rounded-lg p-4">
								<div class="text-sm font-medium text-red-800">Total Egresos</div>
								<div class="text-2xl font-bold text-red-900">{formatAmount(dailySummary.totalExpense)}</div>
							</div>
							<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<div class="text-sm font-medium text-blue-800">Neto del Día</div>
								<div class="text-2xl font-bold text-blue-900">{formatAmount(dailySummary.netAmount)}</div>
							</div>
						</div>
						
						<!-- Gráficos del resumen diario -->
						<div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
							<!-- Gráfico de barras por tipo -->
							<div class="bg-gray-50 p-4 rounded-lg">
								<h5 class="text-md font-medium text-gray-900 mb-4">Distribución por Tipo</h5>
								<BarChart
									data={[
										{ label: 'Ingresos', value: dailySummary.totalIncome, color: '#10B981' },
										{ label: 'Egresos', value: dailySummary.totalExpense, color: '#EF4444' }
									]}
									height={250}
									showLegend={false}
								/>
							</div>
							
							<!-- Gráfico de pastel por detalle -->
							<div class="bg-gray-50 p-4 rounded-lg">
								<h5 class="text-md font-medium text-gray-900 mb-4">Distribución por Detalle</h5>
								{#if dailySummary.operations && dailySummary.operations.length > 0}
									<PieChart
										data={dailySummary.operations.reduce((acc: any[], op: any) => {
											const existing = acc.find(item => item.label === op.detailName);
											if (existing) {
												existing.value += op.amount;
											} else {
												acc.push({ 
													label: op.detailName, 
													value: op.amount,
													color: op.type === 'income' ? '#10B981' : '#EF4444'
												});
											}
											return acc;
										}, [])}
										height={250}
									/>
								{:else}
									<div class="flex items-center justify-center h-64 text-gray-500">
										No hay datos para mostrar
									</div>
								{/if}
							</div>
						</div>
						
						<div class="mt-6">
							<h4 class="text-md font-medium text-gray-900 mb-4">Detalles de Operaciones</h4>
							<div class="overflow-x-auto">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										{#each dailySummary.operations || [] as operation}
											<tr>
												<td class="px-6 py-4 whitespace-nowrap">
													<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
														{operation.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
														{operation.type === 'income' ? 'Ingreso' : 'Egreso'}
													</span>
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{operation.detailName}</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatAmount(operation.amount)}</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{operation.responsibleName}</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(operation.operationDate).toLocaleTimeString('es-PE')}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			{/if}
			
			<!-- Reporte de Operaciones -->
			{#if activeReport === 'operations' && operationsReport}
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
							Reporte de Operaciones - {formatDate(dateRange.start)} a {formatDate(dateRange.end)}
						</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
							<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
								<div class="text-sm font-medium text-gray-800">Total Operaciones</div>
								<div class="text-2xl font-bold text-gray-900">{operationsReport.totalOperations}</div>
							</div>
							<div class="bg-green-50 border border-green-200 rounded-lg p-4">
								<div class="text-sm font-medium text-green-800">Total Ingresos</div>
								<div class="text-2xl font-bold text-green-900">{formatAmount(operationsReport.totalIncome)}</div>
							</div>
							<div class="bg-red-50 border border-red-200 rounded-lg p-4">
								<div class="text-sm font-medium text-red-800">Total Egresos</div>
								<div class="text-2xl font-bold text-red-900">{formatAmount(operationsReport.totalExpense)}</div>
							</div>
							<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<div class="text-sm font-medium text-blue-800">Neto</div>
								<div class="text-2xl font-bold text-blue-900">{formatAmount(operationsReport.netAmount)}</div>
							</div>
						</div>
						
						<!-- Aquí irían más detalles del reporte de operaciones -->
						<div class="text-center py-8 text-gray-500">
							<p>Detalles del reporte de operaciones se mostrarán aquí</p>
						</div>
					</div>
				</div>
			{/if}
			
			<!-- Reporte de Cajas -->
			{#if activeReport === 'cash-boxes' && cashBoxesReport}
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
							Reporte de Cajas - {formatDate(dateRange.start)} a {formatDate(dateRange.end)}
						</h3>
						
						<div class="text-center py-8 text-gray-500">
							<p>Detalles del reporte de cajas se mostrarán aquí</p>
						</div>
					</div>
				</div>
			{/if}
			
		{/if}
	</div>
</main>
