<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { ExcelExporter, ExcelMultiSheetExporter } from '$lib/components';
	import { getReportExportOptions, type SheetData } from '$lib/utils/excel-export';

	let { data } = $props<{ data: PageData }>();
	
	let isLoading = $state(true);
	let errorMessage = $state('');
	let successMessage = $state('');
	let selectedPeriod = $state('today');
	let reportData = $state<Record<string, any>>({});
	
	// Datos para exportación
	let operations = $state<any[]>([]);
	let companies = $state<any[]>([]);
	let stands = $state<any[]>([]);
	let responsiblePersons = $state<any[]>([]);
	let operationDetails = $state<any[]>([]);

	// Cargar datos de reportes
	async function loadReports() {
		try {
			isLoading = true;
			
			// Cargar datos reales desde las APIs
			await Promise.all([
				loadOperations(),
				loadCompanies(),
				loadStands(),
				loadResponsiblePersons(),
				loadOperationDetails()
			]);
			
			// Calcular reportes basados en datos reales
			calculateReportData();
			
		} catch (error) {
			errorMessage = 'Error al cargar los reportes';
			console.error('Error loading reports:', error);
		} finally {
			isLoading = false;
		}
	}

	// Cargar operaciones
	async function loadOperations() {
		try {
			const response = await fetch('/api/operations');
			if (response.ok) {
				const data = await response.json();
				operations = Array.isArray(data) ? data : data.operations || [];
			}
		} catch (error) {
			console.error('Error loading operations:', error);
		}
	}

	// Cargar empresas
	async function loadCompanies() {
		try {
			const response = await fetch('/api/catalogs/companies');
			if (response.ok) {
				companies = await response.json();
			}
		} catch (error) {
			console.error('Error loading companies:', error);
		}
	}

	// Cargar stands
	async function loadStands() {
		try {
			const response = await fetch('/api/catalogs/stands');
			if (response.ok) {
				stands = await response.json();
			}
		} catch (error) {
			console.error('Error loading stands:', error);
		}
	}

	// Cargar personas responsables
	async function loadResponsiblePersons() {
		try {
			const response = await fetch('/api/catalogs/responsible-persons');
			if (response.ok) {
				responsiblePersons = await response.json();
			}
		} catch (error) {
			console.error('Error loading responsible persons:', error);
		}
	}

	// Cargar detalles de operación
	async function loadOperationDetails() {
		try {
			const response = await fetch('/api/catalogs/operation-details');
			if (response.ok) {
				operationDetails = await response.json();
			}
		} catch (error) {
			console.error('Error loading operation details:', error);
		}
	}

	// Calcular datos de reporte
	function calculateReportData() {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
		const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Filtrar operaciones por período
		const todayOps = operations.filter(op => new Date(op.createdAt) >= today);
		const weekOps = operations.filter(op => new Date(op.createdAt) >= weekAgo);
		const monthOps = operations.filter(op => new Date(op.createdAt) >= monthAgo);

		// Calcular métricas
		reportData = {
			today: calculateMetrics(todayOps),
			week: calculateMetrics(weekOps),
			month: calculateMetrics(monthOps)
		};
	}

	// Calcular métricas para un conjunto de operaciones
	function calculateMetrics(ops: any[]) {
		const income = ops.filter(op => op.type === 'income').reduce((sum, op) => sum + op.amount, 0);
		const expense = ops.filter(op => op.type === 'expense').reduce((sum, op) => sum + op.amount, 0);
		return {
			income,
			expense,
			net: income - expense,
			operations: ops.length
		};
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

	// Preparar datos para exportación de operaciones
	function getOperationsForExport() {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
		const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

		let filteredOps = operations;
		if (selectedPeriod === 'today') {
			filteredOps = operations.filter(op => new Date(op.createdAt) >= today);
		} else if (selectedPeriod === 'week') {
			filteredOps = operations.filter(op => new Date(op.createdAt) >= weekAgo);
		} else if (selectedPeriod === 'month') {
			filteredOps = operations.filter(op => new Date(op.createdAt) >= monthAgo);
		}

		return filteredOps.map(op => ({
			...op,
			type: op.type === 'income' ? 'Ingreso' : 'Egreso',
			amount: `${op.type === 'income' ? '+' : '-'}S/. ${op.amount.toFixed(2)}`,
			createdAt: new Date(op.createdAt).toLocaleDateString('es-PE'),
			attachments: op.attachments && op.attachments.length > 0 ? `${op.attachments.length} archivo(s)` : 'Sin archivos'
		}));
	}

	// Preparar datos para exportación múltiple
	function getMultiSheetData(): SheetData[] {
		return [
			{
				name: 'Operaciones',
				data: getOperationsForExport(),
				columns: [
					{ key: 'type', label: 'Tipo', type: 'text' as const },
					{ key: 'description', label: 'Descripción', type: 'text' as const },
					{ key: 'amount', label: 'Monto', type: 'text' as const },
					{ key: 'createdAt', label: 'Fecha', type: 'date' as const },
					{ key: 'attachments', label: 'Archivos', type: 'text' as const }
				]
			},
			{
				name: 'Empresas',
				data: companies,
				columns: [
					{ key: 'razonSocial', label: 'Razón Social', type: 'text' as const },
					{ key: 'ruc', label: 'RUC', type: 'text' as const },
					{ key: 'status', label: 'Estado', type: 'text' as const }
				]
			},
			{
				name: 'Stands',
				data: stands,
				columns: [
					{ key: 'name', label: 'Nombre', type: 'text' as const },
					{ key: 'location', label: 'Ubicación', type: 'text' as const },
					{ key: 'status', label: 'Estado', type: 'text' as const }
				]
			},
			{
				name: 'Responsables',
				data: responsiblePersons,
				columns: [
					{ key: 'name', label: 'Nombre', type: 'text' as const },
					{ key: 'email', label: 'Email', type: 'email' as const },
					{ key: 'phone', label: 'Teléfono', type: 'phone' as const },
					{ key: 'status', label: 'Estado', type: 'text' as const }
				]
			}
		];
	}

	// Limpiar mensajes
	function clearMessages() {
		errorMessage = '';
		successMessage = '';
	}

	onMount(() => {
		loadReports();
	});
</script>

<svelte:head>
	<title>Reportes - Chambar</title>
</svelte:head>

<!-- Título principal -->
<div class="mb-8">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Reportes</h1>
			<p class="mt-2 text-gray-600">Análisis y reportes del sistema de gestión de caja</p>
		</div>
		<div class="flex items-center gap-2">
			<ExcelExporter
				data={getOperationsForExport()}
				columns={[
					{ key: 'type', label: 'Tipo', type: 'text' as const },
					{ key: 'description', label: 'Descripción', type: 'text' as const },
					{ key: 'amount', label: 'Monto', type: 'text' as const },
					{ key: 'createdAt', label: 'Fecha', type: 'date' as const },
					{ key: 'attachments', label: 'Archivos', type: 'text' as const }
				]}
				exportOptions={getReportExportOptions('operaciones')}
				iconOnly={true}
				onExportComplete={(filename) => successMessage = `Archivo ${filename} exportado correctamente`}
				onExportError={(error) => errorMessage = `Error al exportar: ${error.message}`}
			/>
			<ExcelMultiSheetExporter
				sheets={getMultiSheetData()}
				filename="reporte_completo"
				iconOnly={true}
				iconPath="/excel-icon-multi.png"
				onExportComplete={(filename) => successMessage = `Reporte completo ${filename} exportado correctamente`}
				onExportError={(error) => errorMessage = `Error al exportar reporte: ${error.message}`}
			/>
		</div>
	</div>
</div>

<div class="max-w-7xl mx-auto">

	<!-- Mensajes de feedback -->
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

	{#if successMessage}
		<div class="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
			<div class="flex">
				<svg class="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				{successMessage}
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
								<dd class="text-lg font-medium text-gray-900">S/. {(reportData[selectedPeriod] as any)?.income?.toFixed(2) || '0.00'}</dd>
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
								<dd class="text-lg font-medium text-gray-900">S/. {(reportData[selectedPeriod] as any)?.expense?.toFixed(2) || '0.00'}</dd>
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
								<dd class="text-lg font-medium text-gray-900">S/. {(reportData[selectedPeriod] as any)?.net?.toFixed(2) || '0.00'}</dd>
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
								<dd class="text-lg font-medium text-gray-900">{(reportData[selectedPeriod] as any)?.operations || 0}</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>
		</div>

	{/if}
</div>
