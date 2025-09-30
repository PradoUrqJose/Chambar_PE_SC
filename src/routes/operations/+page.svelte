<!-- Página de gestión de operaciones (ingresos y egresos) -->
<!-- Esta página permite registrar, ver, editar y eliminar operaciones de caja -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	// Variables reactivas
	let operations: any[] = [];
	let isLoading = true;
	let errorMessage = '';
	let successMessage = '';
	let showNewOperationForm = false;
	let editingOperation: any = null;
	
	// Filtros
	let filters = {
		type: 'all', // 'all', 'income', 'expense'
		date: new Date().toISOString().split('T')[0],
		search: ''
	};
	
	// Datos de catálogos
	let operationDetails: any[] = [];
	let responsiblePersons: any[] = [];
	let stands: any[] = [];
	let companies: any[] = [];
	let todayCashBox: any = null;
	
	// Formulario de nueva operación
	let newOperation = {
		type: 'income',
		amount: 0,
		operationDetailId: '',
		responsibleId: '',
		standId: '',
		companyId: '',
		description: '',
		voucherNumber: '',
		paymentMethod: 'cash'
	};
	
	// Formatear monto en soles
	function formatAmount(amount: number) {
		return new Intl.NumberFormat('es-PE', {
			style: 'currency',
			currency: 'PEN'
		}).format(amount / 100);
	}
	
	// Formatear fecha
	function formatDate(date: Date | string) {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleString('es-PE', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	
	// Cargar datos iniciales
	async function loadInitialData() {
		try {
			isLoading = true;
			
			// Cargar datos en paralelo
			const [operationsRes, detailsRes, responsiblesRes, standsRes, companiesRes, cashBoxRes] = await Promise.all([
				fetch('/api/operations'),
				fetch('/api/catalogs/operation-details'),
				fetch('/api/catalogs/responsible-persons'),
				fetch('/api/catalogs/stands'),
				fetch('/api/catalogs/companies'),
				fetch('/api/cash-boxes/today')
			]);
			
			// Procesar respuestas
			const operationsData = await operationsRes.json();
			const detailsData = await detailsRes.json();
			const responsiblesData = await responsiblesRes.json();
			const standsData = await standsRes.json();
			const companiesData = await companiesRes.json();
			const cashBoxData = await cashBoxRes.json();
			
			// Asignar datos
			operations = operationsData.success ? operationsData.data : [];
			operationDetails = detailsData.success ? detailsData.data : [];
			responsiblePersons = responsiblesData.success ? responsiblesData.data : [];
			stands = standsData.success ? standsData.data : [];
			companies = companiesData.success ? companiesData.data : [];
			todayCashBox = cashBoxData.success ? cashBoxData.data : null;
			
			// Verificar que hay caja abierta
			if (!todayCashBox || todayCashBox.status !== 'open') {
				errorMessage = 'No hay caja abierta. Debe abrir una caja antes de registrar operaciones.';
			}
			
		} catch (error) {
			console.error('Error cargando datos:', error);
			errorMessage = 'Error cargando datos';
		} finally {
			isLoading = false;
		}
	}
	
	// Filtrar operaciones
	function getFilteredOperations() {
		let filtered = operations;
		
		// Filtrar por tipo
		if (filters.type !== 'all') {
			filtered = filtered.filter(op => op.type === filters.type);
		}
		
		// Filtrar por búsqueda
		if (filters.search) {
			const search = filters.search.toLowerCase();
			filtered = filtered.filter(op => 
				op.description?.toLowerCase().includes(search) ||
				op.voucherNumber?.toLowerCase().includes(search)
			);
		}
		
		return filtered;
	}
	
	// Calcular totales
	function getTotals() {
		const filtered = getFilteredOperations();
		let totalIncome = 0;
		let totalExpense = 0;
		
		filtered.forEach(op => {
			if (op.type === 'income') {
				totalIncome += op.amount;
			} else {
				totalExpense += op.amount;
			}
		});
		
		return {
			income: totalIncome,
			expense: totalExpense,
			net: totalIncome - totalExpense
		};
	}
	
	// Crear nueva operación
	async function createOperation() {
		try {
			const response = await fetch('/api/operations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(newOperation)
			});
			
			const result = await response.json();
			
			if (result.success) {
				successMessage = 'Operación creada correctamente';
				await loadInitialData();
				resetForm();
				showNewOperationForm = false;
			} else {
				errorMessage = result.error || 'Error creando operación';
			}
		} catch (error) {
			console.error('Error creando operación:', error);
			errorMessage = 'Error de conexión';
		}
	}
	
	// Eliminar operación
	async function deleteOperation(operationId: string) {
		if (!confirm('¿Está seguro de eliminar esta operación?')) return;
		
		try {
			const response = await fetch(`/api/operations/${operationId}`, {
				method: 'DELETE'
			});
			
			const result = await response.json();
			
			if (result.success) {
				successMessage = 'Operación eliminada correctamente';
				await loadInitialData();
			} else {
				errorMessage = result.error || 'Error eliminando operación';
			}
		} catch (error) {
			console.error('Error eliminando operación:', error);
			errorMessage = 'Error de conexión';
		}
	}
	
	// Resetear formulario
	function resetForm() {
		newOperation = {
			type: 'income',
			amount: 0,
			operationDetailId: '',
			responsibleId: '',
			standId: '',
			companyId: '',
			description: '',
			voucherNumber: '',
			paymentMethod: 'cash'
		};
		editingOperation = null;
	}
	
	// Cargar datos al montar
	onMount(() => {
		loadInitialData();
	});
	
	// Obtener nombre de catálogo por ID
	function getCatalogName(catalog: any[], id: string) {
		const item = catalog.find(c => c.id === id);
		return item ? item.name : 'N/A';
	}
</script>

<svelte:head>
	<title>Operaciones - Chambar</title>
</svelte:head>

<!-- Header -->
<header class="bg-white shadow">
	<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">
					Operaciones
				</h1>
				<p class="mt-1 text-sm text-gray-500">
					Gestión de ingresos y egresos
				</p>
			</div>
			<div class="flex space-x-4">
				{#if todayCashBox && todayCashBox.status === 'open'}
					<button
						on:click={() => showNewOperationForm = true}
						class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						Nueva Operación
					</button>
				{/if}
				<a
					href="/cash-boxes"
					class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>
					Ver Caja
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
		
		<!-- Estado de la caja -->
		{#if todayCashBox}
			<div class="mb-6 bg-white shadow rounded-lg p-4">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-lg font-medium text-gray-900">
							Estado de la Caja
						</h3>
						<p class="text-sm text-gray-500">
							{formatDate(todayCashBox.openedAt)} - 
							{todayCashBox.status === 'open' ? 'Abierta' : 'Cerrada'}
						</p>
					</div>
					<div class="text-right">
						<p class="text-sm text-gray-500">Monto Inicial</p>
						<p class="text-lg font-medium text-gray-900">
							{formatAmount(todayCashBox.initialAmount)}
						</p>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Filtros -->
		<div class="mb-6 bg-white shadow rounded-lg p-4">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div>
					<label for="typeFilter" class="block text-sm font-medium text-gray-700">
						Tipo
					</label>
					<select
						id="typeFilter"
						bind:value={filters.type}
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					>
						<option value="all">Todos</option>
						<option value="income">Ingresos</option>
						<option value="expense">Egresos</option>
					</select>
				</div>
				<div>
					<label for="dateFilter" class="block text-sm font-medium text-gray-700">
						Fecha
					</label>
					<input
						id="dateFilter"
						type="date"
						bind:value={filters.date}
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>
				<div>
					<label for="searchFilter" class="block text-sm font-medium text-gray-700">
						Buscar
					</label>
					<input
						id="searchFilter"
						type="text"
						bind:value={filters.search}
						placeholder="Descripción o voucher..."
						class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>
				<div class="flex items-end">
					<button
						on:click={loadInitialData}
						class="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
					>
						Actualizar
					</button>
				</div>
			</div>
		</div>
		
		<!-- Totales -->
		{#if operations.length > 0}
			{@const totals = getTotals()}
			<div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="bg-green-50 border border-green-200 rounded-lg p-4">
					<div class="text-sm font-medium text-green-800">Total Ingresos</div>
					<div class="text-2xl font-bold text-green-900">{formatAmount(totals.income)}</div>
				</div>
				<div class="bg-red-50 border border-red-200 rounded-lg p-4">
					<div class="text-sm font-medium text-red-800">Total Egresos</div>
					<div class="text-2xl font-bold text-red-900">{formatAmount(totals.expense)}</div>
				</div>
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div class="text-sm font-medium text-blue-800">Neto</div>
					<div class="text-2xl font-bold text-blue-900">{formatAmount(totals.net)}</div>
				</div>
			</div>
		{/if}
		
		<!-- Lista de operaciones -->
		<div class="bg-white shadow rounded-lg">
			<div class="px-4 py-5 sm:p-6">
				<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
					Operaciones ({getFilteredOperations().length})
				</h3>
				
				{#if isLoading}
					<div class="flex justify-center items-center py-12">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
						<span class="ml-3 text-gray-600">Cargando...</span>
					</div>
				{:else if getFilteredOperations().length === 0}
					<div class="text-center py-12">
						<div class="mx-auto h-12 w-12 text-gray-400">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
							</svg>
						</div>
						<h3 class="mt-2 text-sm font-medium text-gray-900">No hay operaciones</h3>
						<p class="mt-1 text-sm text-gray-500">Comience registrando una nueva operación.</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Tipo
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Monto
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Detalle
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Responsable
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Stand
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Fecha
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Acciones
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each getFilteredOperations() as operation}
									<tr>
										<td class="px-6 py-4 whitespace-nowrap">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
												{operation.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
												{operation.type === 'income' ? 'Ingreso' : 'Egreso'}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{formatAmount(operation.amount)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{getCatalogName(operationDetails, operation.operationDetailId)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{getCatalogName(responsiblePersons, operation.responsibleId)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{getCatalogName(stands, operation.standId)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{formatDate(operation.operationDate)}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<button
												on:click={() => deleteOperation(operation.id)}
												class="text-red-600 hover:text-red-900"
											>
												Eliminar
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	</div>
</main>

<!-- Modal de nueva operación -->
{#if showNewOperationForm}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">
					Nueva Operación
				</h3>
				
				<form on:submit|preventDefault={createOperation} class="space-y-4">
					<!-- Tipo de operación -->
					<div>
						<label class="block text-sm font-medium text-gray-700">Tipo</label>
						<select
							bind:value={newOperation.type}
							class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						>
							<option value="income">Ingreso</option>
							<option value="expense">Egreso</option>
						</select>
					</div>
					
					<!-- Monto -->
					<div>
						<label class="block text-sm font-medium text-gray-700">Monto (S/.)</label>
						<input
							type="number"
							step="0.01"
							bind:value={newOperation.amount}
							class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							required
						/>
					</div>
					
					<!-- Detalle de operación -->
					<div>
						<label for="operationDetail" class="block text-sm font-medium text-gray-700">Detalle</label>
						<select
							id="operationDetail"
							bind:value={newOperation.operationDetailId}
							class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							required
						>
							<option value="">Seleccionar...</option>
							{#each operationDetails.filter(d => d.type === newOperation.type) as detail}
								<option value={detail.id}>{detail.name}</option>
							{/each}
						</select>
					</div>
					
						<!-- Responsable -->
						<div>
							<label for="responsible" class="block text-sm font-medium text-gray-700">Responsable</label>
							<select
								id="responsible"
								bind:value={newOperation.responsibleId}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								required
							>
							<option value="">Seleccionar...</option>
							{#each responsiblePersons as person}
								<option value={person.id}>{person.name}</option>
							{/each}
						</select>
					</div>
					
						<!-- Stand -->
						<div>
							<label for="stand" class="block text-sm font-medium text-gray-700">Stand</label>
							<select
								id="stand"
								bind:value={newOperation.standId}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								required
							>
							<option value="">Seleccionar...</option>
							{#each stands as stand}
								<option value={stand.id}>{stand.name}</option>
							{/each}
						</select>
					</div>
					
						<!-- Empresa (opcional) -->
						<div>
							<label for="company" class="block text-sm font-medium text-gray-700">Empresa (opcional)</label>
							<select
								id="company"
								bind:value={newOperation.companyId}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							>
							<option value="">Seleccionar...</option>
							{#each companies as company}
								<option value={company.id}>{company.name}</option>
							{/each}
						</select>
					</div>
					
						<!-- Descripción -->
						<div>
							<label for="description" class="block text-sm font-medium text-gray-700">Descripción</label>
							<input
								id="description"
								type="text"
								bind:value={newOperation.description}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								placeholder="Descripción de la operación..."
							/>
					</div>
					
						<!-- Número de voucher -->
						<div>
							<label for="voucherNumber" class="block text-sm font-medium text-gray-700">Número de Voucher</label>
							<input
								id="voucherNumber"
								type="text"
								bind:value={newOperation.voucherNumber}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								placeholder="Número de voucher..."
							/>
					</div>
					
						<!-- Método de pago -->
						<div>
							<label for="paymentMethod" class="block text-sm font-medium text-gray-700">Método de Pago</label>
							<select
								id="paymentMethod"
								bind:value={newOperation.paymentMethod}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							>
							<option value="cash">Efectivo</option>
							<option value="card">Tarjeta</option>
							<option value="transfer">Transferencia</option>
							<option value="check">Cheque</option>
						</select>
					</div>
					
					<!-- Botones -->
					<div class="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							on:click={() => { showNewOperationForm = false; resetForm(); }}
							class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
						>
							Cancelar
						</button>
						<button
							type="submit"
							class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
						>
							Crear Operación
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
