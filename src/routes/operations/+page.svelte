<script lang="ts">
	import { onMount } from 'svelte';
	import { OperationsTable, OperationModal, ConfirmationModal } from '$lib/components';
	import type { Operation } from '$lib/services/operations-service';

	// Estado principal
	let isLoading = $state(true);
	let operations = $state<Operation[]>([]);
	let allOperations = $state<Operation[]>([]); // Operaciones sin filtrar
	let cashBoxes = $state<any[]>([]);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Estado de modales
	let showOperationModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedOperation = $state<Operation | null>(null);
	let operationToDelete = $state<Operation | null>(null);

	// Datos para los catálogos
	let operationDetails = $state<any[]>([]);
	let responsiblePersons = $state<any[]>([]);
	let stands = $state<any[]>([]);
	let companies = $state<any[]>([]);

	// Paginación
	let currentPage = $state(1);
	let rowsPerPage = $state(20); // Por defecto 20 filas para la tabla general

	// Filtros
	let filters = $state({
		dateFrom: '',
		dateTo: '',
		type: 'all', // 'all', 'income', 'expense'
		cashBoxId: 'all',
		status: 'all', // 'all', 'open', 'closed', 'reopened', 'empty'
		searchQuery: '',
		amountMin: '',
		amountMax: '',
		hasAttachments: 'all' // 'all', 'yes', 'no'
	});

	// Cargar operaciones
	async function loadOperations() {
		isLoading = true;
		try {
			const response = await fetch('/api/operations');
			if (response.ok) {
				const data = await response.json();
				allOperations = Array.isArray(data) ? data : data.operations || [];
				operations = allOperations; // Inicialmente sin filtros
			} else {
				errorMessage = 'Error al cargar las operaciones';
				allOperations = [];
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

	// Cargar datos de los catálogos
	async function loadCatalogData() {
		try {
			// Cargar detalles de operación
			const detailsResponse = await fetch('/api/catalogs/operation-details');
			if (detailsResponse.ok) {
				operationDetails = await detailsResponse.json();
			}

			// Cargar personas responsables
			const personsResponse = await fetch('/api/catalogs/responsible-persons');
			if (personsResponse.ok) {
				responsiblePersons = await personsResponse.json();
			}

			// Cargar stands
			const standsResponse = await fetch('/api/catalogs/stands');
			if (standsResponse.ok) {
				stands = await standsResponse.json();
			}

			// Cargar empresas
			const companiesResponse = await fetch('/api/catalogs/companies');
			if (companiesResponse.ok) {
				companies = await companiesResponse.json();
			}
		} catch (error) {
			console.error('Error loading catalog data:', error);
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

	// Manejar edición de operación
	function handleEditOperation(operation: Operation) {
		selectedOperation = operation;
		showOperationModal = true;
	}

	// Manejar eliminación de operación
	function handleDeleteOperation(operation: Operation) {
		operationToDelete = operation;
		showDeleteModal = true;
	}

	// Confirmar eliminación
	async function confirmDelete() {
		if (!operationToDelete) return;

		try {
			const response = await fetch(`/api/operations/${operationToDelete.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				successMessage = 'Operación eliminada exitosamente';
				await loadOperations(); // Recargar operaciones
				applyFilters(); // Reaplicar filtros
			} else {
				const errorData = await response.json();
				errorMessage = errorData.error || 'Error al eliminar la operación';
			}
		} catch (error) {
			console.error('Error deleting operation:', error);
			errorMessage = 'Error de red al eliminar la operación';
		} finally {
			showDeleteModal = false;
			operationToDelete = null;
		}
	}

	// Manejar éxito de operación (crear/editar)
	function handleOperationSuccess() {
		successMessage = 'Operación guardada exitosamente';
		showOperationModal = false;
		selectedOperation = null;
		loadOperations(); // Recargar operaciones
		applyFilters(); // Reaplicar filtros
	}

	// Limpiar mensajes
	function clearMessages() {
		errorMessage = '';
		successMessage = '';
	}

	// Aplicar filtros
	function applyFilters() {
		let filtered = [...allOperations];

		// Filtro por tipo
		if (filters.type !== 'all') {
			filtered = filtered.filter(op => op.type === filters.type);
		}

		// Filtro por caja
		if (filters.cashBoxId !== 'all') {
			filtered = filtered.filter(op => op.cashBoxId === filters.cashBoxId);
		}

		// Filtro por estado de caja
		if (filters.status !== 'all') {
			filtered = filtered.filter(op => {
				const cashBox = cashBoxes.find(cb => cb.id === op.cashBoxId);
				return cashBox && cashBox.status === filters.status;
			});
		}

		// Filtro por rango de fechas
		if (filters.dateFrom) {
			const fromDate = new Date(filters.dateFrom);
			filtered = filtered.filter(op => new Date(op.createdAt) >= fromDate);
		}

		if (filters.dateTo) {
			const toDate = new Date(filters.dateTo);
			toDate.setHours(23, 59, 59, 999); // Incluir todo el día
			filtered = filtered.filter(op => new Date(op.createdAt) <= toDate);
		}

		// Filtro por rango de montos
		if (filters.amountMin) {
			const minAmount = parseFloat(filters.amountMin);
			filtered = filtered.filter(op => op.amount >= minAmount);
		}

		if (filters.amountMax) {
			const maxAmount = parseFloat(filters.amountMax);
			filtered = filtered.filter(op => op.amount <= maxAmount);
		}

		// Filtro por archivos adjuntos
		if (filters.hasAttachments === 'yes') {
			filtered = filtered.filter(op => op.attachments && op.attachments.length > 0);
		} else if (filters.hasAttachments === 'no') {
			filtered = filtered.filter(op => !op.attachments || op.attachments.length === 0);
		}

		// Filtro por búsqueda de texto
		if (filters.searchQuery.trim()) {
			const query = filters.searchQuery.toLowerCase();
			filtered = filtered.filter(op =>
				op.description.toLowerCase().includes(query) ||
				op.id.toLowerCase().includes(query) ||
				op.amount.toString().includes(query)
			);
		}

		operations = filtered;
		currentPage = 1; // Resetear a la primera página
	}

	// Limpiar filtros
	function clearFilters() {
		filters = {
			dateFrom: '',
			dateTo: '',
			type: 'all',
			cashBoxId: 'all',
			status: 'all',
			searchQuery: '',
			amountMin: '',
			amountMax: '',
			hasAttachments: 'all'
		};
		operations = allOperations;
		currentPage = 1;
	}

	// Obtener estadísticas filtradas
	let filteredStats = $derived.by(() => {
		const total = operations.length;
		const income = operations.filter(op => op.type === 'income').reduce((sum, op) => sum + op.amount, 0);
		const expense = operations.filter(op => op.type === 'expense').reduce((sum, op) => sum + op.amount, 0);
		return { total, income, expense, net: income - expense };
	});

	onMount(() => {
		loadOperations();
		loadCashBoxes();
		loadCatalogData();
	});
</script>

<svelte:head>
	<title>Gestión de Operaciones - Chambar</title>
	<meta name="description" content="Administra todas las operaciones de las cajas registradoras" />
</svelte:head>

<div class="min-h-screen bg-gray-100 p-4 sm:p-6">
	<div class="max-w-7xl mx-auto">
		<h1 class="text-3xl font-bold text-gray-900 mb-6">Gestión de Operaciones</h1>

		<!-- Mensajes de feedback -->
		{#if errorMessage}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
				<div class="flex items-center">
					<svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="ml-3">
						<p class="text-sm font-medium text-red-800">{errorMessage}</p>
					</div>
					<button onclick={clearMessages} class="ml-auto text-red-400 hover:text-red-600" aria-label="Cerrar mensaje de error">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		{/if}
		{#if successMessage}
			<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
				<div class="flex items-center">
					<svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="ml-3">
						<p class="text-sm font-medium text-green-800">{successMessage}</p>
					</div>
					<button onclick={clearMessages} class="ml-auto text-green-400 hover:text-green-600" aria-label="Cerrar mensaje de éxito">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		{/if}

		<!-- Estadísticas -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
			<div class="bg-white shadow rounded-lg p-4">
				<p class="text-sm font-medium text-gray-500">Total Operaciones</p>
				<p class="text-2xl font-semibold text-gray-900">{filteredStats.total}</p>
			</div>
			<div class="bg-white shadow rounded-lg p-4">
				<p class="text-sm font-medium text-gray-500">Ingresos Totales</p>
				<p class="text-2xl font-semibold text-green-600">
					S/ {filteredStats.income.toFixed(2)}
				</p>
			</div>
			<div class="bg-white shadow rounded-lg p-4">
				<p class="text-sm font-medium text-gray-500">Gastos Totales</p>
				<p class="text-2xl font-semibold text-red-600">
					S/ {filteredStats.expense.toFixed(2)}
				</p>
			</div>
			<div class="bg-white shadow rounded-lg p-4">
				<p class="text-sm font-medium text-gray-500">Balance Neto</p>
				<p class="text-2xl font-semibold {filteredStats.net >= 0 ? 'text-green-600' : 'text-red-600'}">
					S/ {filteredStats.net.toFixed(2)}
				</p>
			</div>
		</div>

		<!-- Panel de Filtros -->
		<div class="bg-white shadow rounded-lg mb-6">
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-medium text-gray-900">Filtros Avanzados</h3>
			</div>
			<div class="px-6 py-4">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<!-- Búsqueda -->
					<div>
						<label for="search" class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
						<input
							id="search"
							type="text"
							bind:value={filters.searchQuery}
							placeholder="Descripción, ID, monto..."
							class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<!-- Tipo de operación -->
					<div>
						<label for="type" class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
						<select
							id="type"
							bind:value={filters.type}
							class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="all">Todos los tipos</option>
							<option value="income">Ingresos</option>
							<option value="expense">Gastos</option>
						</select>
					</div>

					<!-- Caja -->
					<div>
						<label for="cashBox" class="block text-sm font-medium text-gray-700 mb-1">Caja</label>
						<select
							id="cashBox"
							bind:value={filters.cashBoxId}
							class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="all">Todas las cajas</option>
							{#each cashBoxes as cashBox}
								<option value={cashBox.id}>{cashBox.name}</option>
							{/each}
						</select>
					</div>

					<!-- Estado de caja -->
					<div>
						<label for="status" class="block text-sm font-medium text-gray-700 mb-1">Estado de Caja</label>
						<select
							id="status"
							bind:value={filters.status}
							class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="all">Todos los estados</option>
							<option value="open">Abierta</option>
							<option value="closed">Cerrada</option>
							<option value="reopened">Reabierta</option>
							<option value="empty">Vacía</option>
						</select>
					</div>

					<!-- Fecha desde -->
					<div>
						<label for="dateFrom" class="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
						<input
							id="dateFrom"
							type="date"
							bind:value={filters.dateFrom}
							class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<!-- Fecha hasta -->
					<div>
						<label for="dateTo" class="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
						<input
							id="dateTo"
							type="date"
							bind:value={filters.dateTo}
							class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<!-- Monto mínimo -->
					<div>
						<label for="amountMin" class="block text-sm font-medium text-gray-700 mb-1">Monto Mínimo</label>
						<input
							id="amountMin"
							type="number"
							step="0.01"
							bind:value={filters.amountMin}
							placeholder="0.00"
							class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<!-- Monto máximo -->
					<div>
						<label for="amountMax" class="block text-sm font-medium text-gray-700 mb-1">Monto Máximo</label>
						<input
							id="amountMax"
							type="number"
							step="0.01"
							bind:value={filters.amountMax}
							placeholder="999999.99"
							class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<!-- Archivos adjuntos -->
					<div>
						<label for="attachments" class="block text-sm font-medium text-gray-700 mb-1">Archivos</label>
						<select
							id="attachments"
							bind:value={filters.hasAttachments}
							class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="all">Todos</option>
							<option value="yes">Con archivos</option>
							<option value="no">Sin archivos</option>
						</select>
					</div>
				</div>

				<!-- Botones de acción -->
				<div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
					<div class="text-sm text-gray-500">
						Mostrando {operations.length} de {allOperations.length} operaciones
					</div>
					<div class="flex gap-2">
						<button
							onclick={clearFilters}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
						>
							Limpiar Filtros
						</button>
						<button
							onclick={applyFilters}
							class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							Aplicar Filtros
						</button>
					</div>
				</div>
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
				onEditOperation={handleEditOperation}
				onDeleteOperation={handleDeleteOperation}
				showActions={true}
			/>
		{/if}
	</div>
</div>

<!-- Modal de edición de operación -->
{#if showOperationModal && selectedOperation}
	<OperationModal
		isOpen={showOperationModal}
		onClose={() => {
			showOperationModal = false;
			selectedOperation = null;
		}}
		onSubmit={handleOperationSuccess}
		operation={selectedOperation}
		operationDetails={operationDetails}
		responsiblePersons={responsiblePersons}
		stands={stands}
		companies={companies}
		platform={undefined}
	/>
{/if}

<!-- Modal de confirmación de eliminación -->
{#if showDeleteModal && operationToDelete}
	<ConfirmationModal
		isOpen={showDeleteModal}
		title="Confirmar Eliminación"
		message="¿Estás seguro de que quieres eliminar esta operación? Esta acción no se puede deshacer."
		confirmText="Eliminar"
		cancelText="Cancelar"
		onConfirm={confirmDelete}
		onCancel={() => {
			showDeleteModal = false;
			operationToDelete = null;
		}}
	/>
{/if}