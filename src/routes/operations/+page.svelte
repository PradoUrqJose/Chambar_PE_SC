<script lang="ts">
	import { onMount } from 'svelte';
	import { OperationsTable } from '$lib/components';
	import type { Operation } from '$lib/services/operations-service';

	// Estado principal
	let isLoading = $state(true);
	let operations = $state<Operation[]>([]);
	let cashBoxes = $state<any[]>([]);
	let errorMessage = $state('');

	// Paginación
	let currentPage = $state(1);
	let rowsPerPage = $state(20); // Por defecto 20 filas para la tabla general

	// Cargar operaciones
	async function loadOperations() {
		isLoading = true;
		try {
			const response = await fetch('/api/operations');
			if (response.ok) {
				const data = await response.json();
				operations = Array.isArray(data) ? data : data.operations || [];
			} else {
				errorMessage = 'Error al cargar las operaciones';
				operations = [];
			}
		} catch (error) {
			console.error('Error loading operations:', error);
			errorMessage = 'Error de red al cargar las operaciones';
		} finally {
			isLoading = false;
		}
	}

	// Cargar cajas registradoras
	async function loadCashBoxes() {
		try {
			const response = await fetch('/api/cash-boxes');
			if (response.ok) {
				cashBoxes = await response.json();
			}
		} catch (error) {
			console.error('Error loading cash boxes:', error);
		}
	}

	// Manejar cambio de filas por página
	function handleRowsPerPageChange(value: number) {
		rowsPerPage = value;
		currentPage = 1; // Resetear a la primera página
	}

	// Manejar cambio de página
	function handlePageChange(page: number) {
		currentPage = page;
	}

	// Función dummy para onAddOperation (no se usará)
	function handleAddOperation() {
		// No implementado - esta tabla es solo de visualización
	}

	onMount(() => {
		loadOperations();
		loadCashBoxes();
	});
</script>

<svelte:head>
	<title>Gestión de Operaciones - Chambar</title>
	<meta name="description" content="Administra todas las operaciones de las cajas registradoras" />
</svelte:head>

<div class="min-h-screen bg-gray-100 p-4 sm:p-6">
	<div class="max-w-7xl mx-auto">
		<h1 class="text-3xl font-bold text-gray-900 mb-6">Gestión de Operaciones</h1>

		<!-- Mensaje de error -->
		{#if errorMessage}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
				<div class="flex items-center">
					<svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="ml-3">
						<p class="text-sm font-medium text-red-800">{errorMessage}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Estadísticas -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
			<div class="bg-white shadow rounded-lg p-4">
				<p class="text-sm font-medium text-gray-500">Total Operaciones</p>
				<p class="text-2xl font-semibold text-gray-900">{operations.length}</p>
			</div>
			<div class="bg-white shadow rounded-lg p-4">
				<p class="text-sm font-medium text-gray-500">Ingresos Totales</p>
				<p class="text-2xl font-semibold text-green-600">
					S/ {operations.filter(op => op.type === 'income').reduce((sum, op) => sum + op.amount, 0).toFixed(2)}
				</p>
			</div>
			<div class="bg-white shadow rounded-lg p-4">
				<p class="text-sm font-medium text-gray-500">Gastos Totales</p>
				<p class="text-2xl font-semibold text-red-600">
					S/ {operations.filter(op => op.type === 'expense').reduce((sum, op) => sum + op.amount, 0).toFixed(2)}
				</p>
			</div>
		</div>

		<!-- Tabla de operaciones -->
		{#if isLoading}
			<div class="bg-white shadow rounded-lg p-8 text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
				<p class="mt-2 text-gray-600">Cargando operaciones...</p>
			</div>
		{:else}
			<OperationsTable
				{operations}
				{rowsPerPage}
				onRowsPerPageChange={handleRowsPerPageChange}
				onAddOperation={handleAddOperation}
				{currentPage}
				onPageChange={handlePageChange}
				showPagination={true}
				showAddButton={false}
				defaultRowsPerPage={20}
				showCashBoxInfo={true}
				{cashBoxes}
			/>
		{/if}
	</div>
</div>