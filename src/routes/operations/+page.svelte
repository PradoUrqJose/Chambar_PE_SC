<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	
	let isLoading = $state(true);
	let operations = $state<any[]>([]);
	let errorMessage = $state('');
	let showNewOperationForm = $state(false);
	let cashBoxes = $state<any[]>([]);
	let openCashBox = $state<any>(null);

	// Datos del formulario de nueva operación
	let newOperation = $state({
		type: 'income',
		amount: 0,
		description: '',
		cashBoxId: '1',
		operationDetailId: '',
		responsiblePersonId: '',
		standId: '',
		companyId: '',
		image: null
	});

	// Datos para los selects
	let operationDetails = $state<any[]>([]);
	let responsiblePersons = $state<any[]>([]);
	let stands = $state<any[]>([]);
	let companies = $state<any[]>([]);
	let selectedOperationDetail = $state<any>(null);

	// Cargar cajas y verificar estado
	async function loadCashBoxes() {
		try {
			const response = await fetch('/api/cash-boxes');
			if (response.ok) {
				cashBoxes = await response.json();
				// Buscar caja abierta
				openCashBox = cashBoxes.find(cb => cb.status === 'open') || null;
			}
		} catch (error) {
			console.error('Error loading cash boxes:', error);
		}
	}

	// Cargar datos para los selects
	async function loadSelectData() {
		try {
			// Cargar detalles de operación
			const detailsResponse = await fetch('/api/catalogs/operation-details');
			if (detailsResponse.ok) {
				operationDetails = await detailsResponse.json();
			}

			// Cargar responsables
			const responsibleResponse = await fetch('/api/catalogs/responsible-persons');
			if (responsibleResponse.ok) {
				responsiblePersons = await responsibleResponse.json();
			}

			// Cargar stands
			const standsResponse = await fetch('/api/catalogs/stands');
			if (standsResponse.ok) {
				stands = await standsResponse.json();
			}

			// Cargar empresas
			const companiesResponse = await fetch('/api/companies');
			if (companiesResponse.ok) {
				companies = await companiesResponse.json();
			}
		} catch (error) {
			console.error('Error loading select data:', error);
		}
	}

	// Cargar operaciones
	async function loadOperations() {
		try {
			isLoading = true;
			const response = await fetch('/api/operations');
			if (response.ok) {
				operations = await response.json();
			} else {
				// Fallback a datos mock si no hay API
				operations = [
					{
						id: '1',
						type: 'income',
						amount: 150.00,
						description: 'Venta de productos',
						cashBoxId: '1',
						createdAt: new Date().toISOString()
					},
					{
						id: '2',
						type: 'expense',
						amount: 80.00,
						description: 'Pago a proveedor',
						cashBoxId: '1',
						createdAt: new Date().toISOString()
					}
				];
			}
		} catch (error) {
			errorMessage = 'Error al cargar las operaciones';
			console.error('Error loading operations:', error);
		} finally {
			isLoading = false;
		}
	}

	// Validar si se puede crear operación
	function canCreateOperation() {
		if (!openCashBox) {
			errorMessage = 'No hay ninguna caja abierta. Debe abrir una caja antes de crear operaciones.';
			return false;
		}
		return true;
	}

	// Mostrar modal de nueva operación (con validación)
	function showNewOperationModal() {
		if (canCreateOperation()) {
			showNewOperationForm = true;
		}
	}

	// Crear nueva operación
	async function createOperation() {
		try {
			// Validaciones
			if (!newOperation.operationDetailId) {
				errorMessage = 'Debe seleccionar un detalle de operación';
				return;
			}

			if (!newOperation.responsiblePersonId) {
				errorMessage = 'Debe seleccionar un responsable';
				return;
			}

			if (!newOperation.description.trim()) {
				errorMessage = 'La descripción es obligatoria';
				return;
			}

			if (newOperation.amount <= 0) {
				errorMessage = 'El monto debe ser mayor a 0';
				return;
			}

			const response = await fetch('/api/operations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(newOperation)
			});

			if (response.ok) {
				showNewOperationForm = false;
				resetForm();
				await loadOperations(); // Recargar operaciones
				// Recargar página para actualizar el monto de caja
				window.location.reload();
			} else {
				const error = await response.json();
				errorMessage = error.message || 'Error al crear la operación';
			}
		} catch (error) {
			errorMessage = 'Error al crear la operación';
			console.error('Error creating operation:', error);
		}
	}

	// Manejar cambio de detalle de operación
	function handleOperationDetailChange() {
		const detail = operationDetails.find(d => d.id === newOperation.operationDetailId);
		selectedOperationDetail = detail;
		if (detail) {
			newOperation.type = detail.type;
		}
	}

	// Manejar carga de imagen
	function handleImageUpload(event: any) {
		const file = event.target.files[0];
		if (file) {
			newOperation.image = file;
		}
	}

	// Resetear formulario
	function resetForm() {
		newOperation = {
			type: 'income',
			amount: 0,
			description: '',
			cashBoxId: '1',
			operationDetailId: '',
			responsiblePersonId: '',
			standId: '',
			companyId: '',
			image: null
		};
		selectedOperationDetail = null;
	}

	onMount(() => {
		loadOperations();
		loadSelectData();
		loadCashBoxes();
	});
</script>

<svelte:head>
	<title>Operaciones - Chambar</title>
</svelte:head>

<!-- Título principal -->
<div class="mb-8">
	<h1 class="text-3xl font-bold text-gray-900">Operaciones</h1>
	<p class="mt-2 text-gray-600">Gestiona ingresos y egresos del sistema</p>
</div>

<div class="max-w-7xl mx-auto">
	<!-- Header con botón -->
	<div class="mb-8">
		<div class="flex justify-between items-center">
			<div>
				<!-- Estado de caja -->
				{#if openCashBox}
					<div class="flex items-center space-x-2">
						<div class="w-3 h-3 bg-green-500 rounded-full"></div>
						<span class="text-sm font-medium text-green-700">
							Caja abierta: {openCashBox.name} - S/. {openCashBox.currentAmount.toFixed(2)}
						</span>
					</div>
				{:else}
					<div class="flex items-center space-x-2">
						<div class="w-3 h-3 bg-red-500 rounded-full"></div>
						<span class="text-sm font-medium text-red-700">
							No hay caja abierta - No se pueden crear operaciones
						</span>
					</div>
				{/if}
			</div>
			<button
				onclick={showNewOperationModal}
				class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
				disabled={!openCashBox}
			>
				{openCashBox ? 'Nueva Operación' : 'No hay caja abierta'}
			</button>
		</div>
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
			<span class="ml-2 text-gray-600">Cargando operaciones...</span>
		</div>
	{:else}
		<!-- Lista de operaciones -->
		<div class="bg-white shadow rounded-lg">
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-medium text-gray-900">Historial de Operaciones</h3>
			</div>
			<div class="divide-y divide-gray-200">
				{#each operations as operation}
					<div class="px-6 py-4 flex items-center justify-between">
						<div class="flex items-center">
							<div class="w-10 h-10 rounded-full flex items-center justify-center
								{operation.type === 'income' ? 'bg-green-100' : 'bg-red-100'}"
							>
								<svg class="w-5 h-5 {operation.type === 'income' ? 'text-green-600' : 'text-red-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									{#if operation.type === 'income'}
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
									{:else}
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
									{/if}
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-900">{operation.description}</p>
								<p class="text-sm text-gray-500">{new Date(operation.createdAt).toLocaleString()}</p>
							</div>
						</div>
						<div class="text-right">
							<p class="text-sm font-medium {operation.type === 'income' ? 'text-green-600' : 'text-red-600'}">
								{operation.type === 'income' ? '+' : '-'} S/. {operation.amount.toFixed(2)}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Modal de nueva operación -->
	{#if showNewOperationForm}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<!-- Header del modal -->
				<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
					<div class="flex items-center justify-between">
						<h3 class="text-xl font-semibold text-gray-900">Nueva Operación</h3>
						<button
							onclick={() => {
								showNewOperationForm = false;
								resetForm();
							}}
							class="text-gray-400 hover:text-gray-600 transition-colors"
							aria-label="Cerrar modal"
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</button>
					</div>
				</div>

				<!-- Contenido del modal -->
				<div class="p-6 space-y-6">
					<!-- Detalle de Operación (Primero) -->
					<div>
						<label for="operation-detail" class="block text-sm font-medium text-gray-700 mb-2">
							Detalle de Operación <span class="text-red-500">*</span>
						</label>
						<select 
							id="operation-detail" 
							bind:value={newOperation.operationDetailId}
							onchange={handleOperationDetailChange}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
						>
							<option value="">Seleccionar detalle...</option>
							{#each operationDetails as detail}
								<option value={detail.id}>{detail.name}</option>
							{/each}
						</select>
						
						<!-- Mostrar tipo e icono del detalle seleccionado -->
						{#if selectedOperationDetail}
							<div class="mt-2 flex items-center space-x-2">
								<div class="w-6 h-6 rounded-full flex items-center justify-center
									{selectedOperationDetail.type === 'income' ? 'bg-green-100' : 'bg-red-100'}"
								>
									<svg class="w-4 h-4 {selectedOperationDetail.type === 'income' ? 'text-green-600' : 'text-red-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										{#if selectedOperationDetail.type === 'income'}
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
										{:else}
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
										{/if}
									</svg>
								</div>
								<span class="text-sm font-medium {selectedOperationDetail.type === 'income' ? 'text-green-600' : 'text-red-600'}">
									{selectedOperationDetail.type === 'income' ? 'Ingreso' : 'Egreso'}
								</span>
							</div>
						{/if}
					</div>

					<!-- Monto con color dinámico -->
					<div>
						<label for="operation-amount" class="block text-sm font-medium text-gray-700 mb-2">
							Monto (S/.) <span class="text-red-500">*</span>
						</label>
						<input
							id="operation-amount"
							type="number"
							step="0.01"
							min="0"
							bind:value={newOperation.amount}
							class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
								{selectedOperationDetail?.type === 'expense' 
									? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
									: selectedOperationDetail?.type === 'income'
									? 'border-green-300 focus:ring-green-500 focus:border-green-500'
									: 'border-gray-300'}"
							placeholder="0.00"
						/>
					</div>

					<!-- Responsable (Obligatorio) -->
					<div>
						<label for="responsible-person" class="block text-sm font-medium text-gray-700 mb-2">
							Responsable <span class="text-red-500">*</span>
						</label>
						<select 
							id="responsible-person" 
							bind:value={newOperation.responsiblePersonId}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
						>
							<option value="">Seleccionar responsable...</option>
							{#each responsiblePersons as person}
								<option value={person.id}>{person.name} - {person.email}</option>
							{/each}
						</select>
					</div>

					<!-- Empresa (Opcional) -->
					<div>
						<label for="company" class="block text-sm font-medium text-gray-700 mb-2">
							Empresa <span class="text-gray-400">(Opcional)</span>
						</label>
						<select 
							id="company" 
							bind:value={newOperation.companyId}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
						>
							<option value="">Seleccionar empresa...</option>
							{#each companies as company}
								<option value={company.id}>{company.razonSocial} - {company.ruc}</option>
							{/each}
						</select>
					</div>

					<!-- Stand (Opcional) -->
					<div>
						<label for="stand" class="block text-sm font-medium text-gray-700 mb-2">
							Stand <span class="text-gray-400">(Opcional)</span>
						</label>
						<select 
							id="stand" 
							bind:value={newOperation.standId}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
						>
							<option value="">Seleccionar stand...</option>
							{#each stands as stand}
								<option value={stand.id}>{stand.name} - {stand.location}</option>
							{/each}
						</select>
					</div>

					<!-- Descripción -->
					<div>
						<label for="operation-description" class="block text-sm font-medium text-gray-700 mb-2">
							Descripción <span class="text-red-500">*</span>
						</label>
						<textarea
							id="operation-description"
							bind:value={newOperation.description}
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
							placeholder="Ej: Venta de productos en efectivo"
						></textarea>
					</div>

					<!-- Carga de imagen -->
					<div>
						<label for="operation-image" class="block text-sm font-medium text-gray-700 mb-2">
							Documento/Voucher <span class="text-gray-400">(Opcional)</span>
						</label>
						<div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
							<div class="space-y-1 text-center">
								<svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
									<path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								<div class="flex text-sm text-gray-600">
									<label for="operation-image" class="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
										<span>Subir archivo</span>
										<input 
											id="operation-image" 
											type="file" 
											accept="image/*,.pdf" 
											onchange={handleImageUpload}
											class="sr-only"
										/>
									</label>
									<p class="pl-1">o arrastra y suelta</p>
								</div>
								<p class="text-xs text-gray-500">PNG, JPG, PDF hasta 10MB</p>
								{#if newOperation.image}
									<p class="text-sm text-green-600 font-medium">{newOperation.image.name}</p>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Footer del modal -->
				<div class="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
					<div class="flex justify-end space-x-3">
						<button
							onclick={() => {
								showNewOperationForm = false;
								resetForm();
							}}
							class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
						>
							Cancelar
						</button>
						<button
							onclick={createOperation}
							class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-medium"
						>
							Crear Operación
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
