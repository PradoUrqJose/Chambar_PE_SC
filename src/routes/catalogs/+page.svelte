<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { CatalogTable } from '$lib/components';

	let { data } = $props<{ data: PageData }>();
	
	let isLoading = $state(true);
	let activeTab = $state('empresas');
	let errorMessage = $state('');
	let successMessage = $state('');
	let showCreateForm = $state(false);
	let newItem = $state({
		name: '',
		location: '',
		email: '',
		phone: '',
		type: 'income',
		category: ''
	});

	// Datos mock para los catálogos
	let empresas = $state<any[]>([]);
	let stands = $state<any[]>([]);
	let responsiblePersons = $state<any[]>([]);
	let operationDetails = $state<any[]>([]);

	// Configuraciones de columnas para cada catálogo
	const empresasColumns = [
		{ key: 'razonSocial', label: 'Razón Social', type: 'text' as const },
		{ key: 'ruc', label: 'RUC', type: 'text' as const }
	];

	const standsColumns = [
		{ key: 'name', label: 'Nombre', type: 'text' as const },
		{ key: 'location', label: 'Ubicación', type: 'text' as const },
		{ 
			key: 'status', 
			label: 'Estado', 
			type: 'badge' as const,
			badgeConfig: {
				values: {
					'active': { text: 'Activo', class: 'bg-green-100 text-green-800' },
					'inactive': { text: 'Inactivo', class: 'bg-red-100 text-red-800' }
				}
			}
		}
	];

	const responsiblePersonsColumns = [
		{ key: 'name', label: 'Nombre', type: 'text' as const },
		{ key: 'email', label: 'Email', type: 'email' as const },
		{ key: 'phone', label: 'Teléfono', type: 'phone' as const }
	];

	const operationDetailsColumns = [
		{ key: 'name', label: 'Nombre', type: 'text' as const },
		{ key: 'category', label: 'Categoría', type: 'text' as const },
		{ 
			key: 'type', 
			label: 'Tipo', 
			type: 'badge' as const,
			badgeConfig: {
				values: {
					'income': { text: 'Ingreso', class: 'bg-green-100 text-green-800' },
					'expense': { text: 'Egreso', class: 'bg-red-100 text-red-800' }
				}
			}
		}
	];

	// Estado de paginación
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	// Estado para modales
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedItem = $state<any>(null);
	let itemToDelete = $state<any>(null);
	let editFormData = $state<any>({});

	// Funciones de manejo de eventos
	function handlePageChange(page: number) {
		currentPage = page;
	}

	function handleItemsPerPageChange(newItemsPerPage: number) {
		itemsPerPage = newItemsPerPage;
		currentPage = 1; // Reset to first page
	}

	function handleEdit(item: any) {
		selectedItem = item;
		// Crear una copia para editar (evita actualización en tiempo real)
		editFormData = { ...item };
		showEditModal = true;
	}

	function handleDelete(item: any) {
		itemToDelete = item;
		showDeleteModal = true;
	}

	// Función para actualizar elemento
	async function updateItem() {
		try {
			if (!selectedItem) return;

			const endpoint = getCurrentEndpoint();
			const url = `${endpoint}/${selectedItem.id}`;
			
			// Preparar datos según el tipo de catálogo usando editFormData
			let updateData: any = {};
			if (activeTab === 'empresas') {
				updateData = {
					razonSocial: editFormData.razonSocial,
					ruc: editFormData.ruc
				};
			} else if (activeTab === 'stands') {
				updateData = {
					name: editFormData.name,
					location: editFormData.location,
					status: editFormData.status
				};
			} else if (activeTab === 'responsible-persons') {
				updateData = {
					name: editFormData.name,
					email: editFormData.email,
					phone: editFormData.phone
				};
			} else if (activeTab === 'operation-details') {
				updateData = {
					name: editFormData.name,
					type: editFormData.type,
					category: editFormData.category
				};
			}

			const response = await fetch(url, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				successMessage = 'Elemento actualizado correctamente';
				await loadCurrentCatalog();
				showEditModal = false;
				selectedItem = null;
				editFormData = {};
			} else {
				const errorData = await response.json();
				errorMessage = errorData.error || 'Error al actualizar el elemento';
			}
		} catch (error) {
			errorMessage = 'Error de red al actualizar el elemento';
			console.error('Error updating item:', error);
		}
	}

	function handleAdd() {
		selectedItem = null;
		showCreateForm = true;
	}

	// Función para crear/actualizar elemento
	async function saveItem(itemData: any) {
		try {
			const endpoint = getCurrentEndpoint();
			const method = selectedItem ? 'PUT' : 'POST';
			const url = selectedItem ? `${endpoint}/${selectedItem.id}` : endpoint;
			
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(itemData)
			});

			if (response.ok) {
				successMessage = selectedItem ? 'Elemento actualizado correctamente' : 'Elemento creado correctamente';
				await loadCurrentCatalog();
				showCreateForm = false;
				showEditModal = false;
				selectedItem = null;
			} else {
				const errorData = await response.json();
				errorMessage = errorData.error || 'Error al guardar el elemento';
			}
		} catch (error) {
			errorMessage = 'Error de red al guardar el elemento';
		}
	}

	// Función para eliminar elemento
	async function confirmDelete() {
		if (!itemToDelete) return;

		try {
			const endpoint = getCurrentEndpoint();
			const response = await fetch(`${endpoint}/${itemToDelete.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				successMessage = 'Elemento eliminado correctamente';
				await loadCurrentCatalog();
			} else {
				const errorData = await response.json();
				errorMessage = errorData.error || 'Error al eliminar el elemento';
			}
		} catch (error) {
			errorMessage = 'Error de red al eliminar el elemento';
		} finally {
			showDeleteModal = false;
			itemToDelete = null;
		}
	}

	// Función para cancelar eliminación
	function cancelDelete() {
		showDeleteModal = false;
		itemToDelete = null;
	}

	// Obtener endpoint según el tab activo
	function getCurrentEndpoint() {
		switch (activeTab) {
			case 'empresas':
				return '/api/catalogs/companies';
			case 'stands':
				return '/api/catalogs/stands';
			case 'responsible-persons':
				return '/api/catalogs/responsible-persons';
			case 'operation-details':
				return '/api/catalogs/operation-details';
			default:
				return '';
		}
	}

	// Obtener el nombre del botón según el tab activo
	function getAddButtonText() {
		switch (activeTab) {
			case 'empresas':
				return 'Nueva Empresa';
			case 'stands':
				return 'Nuevo Stand';
			case 'responsible-persons':
				return 'Nuevo Responsable';
			case 'operation-details':
				return 'Nuevo Detalle';
			default:
				return 'Nuevo Elemento';
		}
	}

	// Cargar datos de catálogos
	async function loadCatalogs() {
		try {
			isLoading = true;
			
			// Cargar empresas
			const empresasResponse = await fetch('/api/catalogs/companies');
			if (empresasResponse.ok) {
				empresas = await empresasResponse.json();
			} else {
				empresas = [];
			}
			
			// Cargar stands
			const standsResponse = await fetch('/api/catalogs/stands');
			if (standsResponse.ok) {
				stands = await standsResponse.json();
			} else {
				stands = [];
			}
			
			// Cargar responsables
			const responsibleResponse = await fetch('/api/catalogs/responsible-persons');
			if (responsibleResponse.ok) {
				responsiblePersons = await responsibleResponse.json();
			} else {
				responsiblePersons = [];
			}
			
			// Cargar detalles de operación
			const detailsResponse = await fetch('/api/catalogs/operation-details');
			if (detailsResponse.ok) {
				operationDetails = await detailsResponse.json();
			} else {
				operationDetails = [];
			}
		} catch (error) {
			errorMessage = 'Error al cargar los catálogos';
			console.error('Error loading catalogs:', error);
		} finally {
			isLoading = false;
		}
	}

	// Cargar solo el catálogo activo (más eficiente)
	async function loadCurrentCatalog() {
		try {
			isLoading = true;
			
			if (activeTab === 'empresas') {
				const response = await fetch('/api/catalogs/companies');
				if (response.ok) {
					empresas = await response.json();
				}
			} else if (activeTab === 'stands') {
				const response = await fetch('/api/catalogs/stands');
				if (response.ok) {
					stands = await response.json();
				}
			} else if (activeTab === 'responsible-persons') {
				const response = await fetch('/api/catalogs/responsible-persons');
				if (response.ok) {
					responsiblePersons = await response.json();
				}
			} else if (activeTab === 'operation-details') {
				const response = await fetch('/api/catalogs/operation-details');
				if (response.ok) {
					operationDetails = await response.json();
				}
			}
		} catch (error) {
			errorMessage = 'Error al cargar el catálogo';
			console.error('Error loading current catalog:', error);
		} finally {
			isLoading = false;
		}
	}

	// Obtener nombre del tab actual
	function getCurrentTabName() {
		switch (activeTab) {
			case 'empresas':
				return 'Empresa';
			case 'stands':
				return 'Stand';
			case 'responsible-persons':
				return 'Responsable';
			case 'operation-details':
				return 'Detalle';
			default:
				return 'Elemento';
		}
	}

	// Crear nuevo elemento
	async function createItem() {
		try {
			if (!newItem.name.trim()) {
				errorMessage = 'El nombre es obligatorio';
				return;
			}

			let response;
			if (activeTab === 'empresas') {
				response = await fetch('/api/catalogs/companies', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ razonSocial: newItem.name, ruc: newItem.location })
				});
			} else if (activeTab === 'stands') {
				response = await fetch('/api/catalogs/stands', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newItem.name, location: newItem.location })
				});
			} else if (activeTab === 'responsible-persons') {
				response = await fetch('/api/catalogs/responsible-persons', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newItem.name, email: newItem.email, phone: newItem.phone })
				});
			} else if (activeTab === 'operation-details') {
				response = await fetch('/api/catalogs/operation-details', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newItem.name, type: newItem.type, category: newItem.category })
				});
			}

			if (response && response.ok) {
				showCreateForm = false;
				// Resetear formulario
				newItem = { name: '', location: '', email: '', phone: '', type: 'income', category: '' };
				// Recargar datos específicos según el tab
				if (activeTab === 'empresas') {
					await loadCompanies();
				} else if (activeTab === 'stands') {
					await loadStands();
				} else if (activeTab === 'responsible-persons') {
					await loadResponsibles();
				} else if (activeTab === 'operation-details') {
					await loadDetails();
				}
			} else {
				errorMessage = 'Error al crear el elemento';
			}
		} catch (error) {
			errorMessage = 'Error al crear el elemento';
			console.error('Error creating item:', error);
		}
	}

	// Funciones de carga específicas
	async function loadCompanies() {
		try {
			const response = await fetch('/api/catalogs/companies');
			if (response.ok) {
				const data = await response.json();
				empresas = [...data]; // Forzar reactividad
				console.log('Empresas cargadas:', empresas);
			}
		} catch (error) {
			console.error('Error loading companies:', error);
		}
	}

	async function loadStands() {
		try {
			const response = await fetch('/api/catalogs/stands');
			if (response.ok) {
				const data = await response.json();
				stands = [...data]; // Forzar reactividad
				console.log('Stands cargados:', stands);
			}
		} catch (error) {
			console.error('Error loading stands:', error);
		}
	}

	async function loadResponsibles() {
		try {
			const response = await fetch('/api/catalogs/responsible-persons');
			if (response.ok) {
				responsiblePersons = await response.json();
			}
		} catch (error) {
			console.error('Error loading responsibles:', error);
		}
	}

	async function loadDetails() {
		try {
			const response = await fetch('/api/catalogs/operation-details');
			if (response.ok) {
				operationDetails = await response.json();
			}
		} catch (error) {
			console.error('Error loading details:', error);
		}
	}

	onMount(() => {
		loadCatalogs();
	});
</script>

<svelte:head>
	<title>Catálogos - Chambar</title>
</svelte:head>

<!-- Título principal -->
<div class="mb-8">
	<h1 class="text-3xl font-bold text-gray-900">Catálogos</h1>
	<p class="mt-2 text-gray-600">Administra los catálogos del sistema</p>
</div>

<div class="max-w-7xl mx-auto">
	<!-- Header con botón -->
	<div class="mb-8">
		<div class="flex justify-between items-center">
			<div></div>
			<div class="flex space-x-2">
				<button
					onclick={handleAdd}
					class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
				>
					+ {getAddButtonText()}
				</button>
			</div>
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
			<span class="ml-2 text-gray-600">Cargando catálogos...</span>
		</div>
	{:else}
		<!-- Tabs de navegación -->
		<div class="border-b border-gray-200 mb-6">
			<nav class="-mb-px flex space-x-8">
				<button
					onclick={() => activeTab = 'empresas'}
					class="py-2 px-1 border-b-2 font-medium text-sm
						{activeTab === 'empresas' 
							? 'border-green-500 text-green-600' 
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					Empresas
				</button>
				<button
					onclick={() => activeTab = 'stands'}
					class="py-2 px-1 border-b-2 font-medium text-sm
						{activeTab === 'stands' 
							? 'border-green-500 text-green-600' 
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					Stands
				</button>
				<button
					onclick={() => activeTab = 'responsible-persons'}
					class="py-2 px-1 border-b-2 font-medium text-sm
						{activeTab === 'responsible-persons' 
							? 'border-green-500 text-green-600' 
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					Responsables
				</button>
				<button
					onclick={() => activeTab = 'operation-details'}
					class="py-2 px-1 border-b-2 font-medium text-sm
						{activeTab === 'operation-details' 
							? 'border-green-500 text-green-600' 
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					Detalles de Operación
				</button>
			</nav>
		</div>

		<!-- Contenido de tabs -->
		{#if activeTab === 'empresas'}
			<CatalogTable
				items={empresas}
				columns={empresasColumns}
				title="Empresas"
				currentPage={currentPage}
				itemsPerPage={itemsPerPage}
				onPageChange={handlePageChange}
				onItemsPerPageChange={handleItemsPerPageChange}
				onEdit={handleEdit}
				onDelete={handleDelete}
				isLoading={isLoading}
				errorMessage={errorMessage}
				successMessage={successMessage}
			/>
		{:else if activeTab === 'stands'}
			<CatalogTable
				items={stands}
				columns={standsColumns}
				title="Stands"
				currentPage={currentPage}
				itemsPerPage={itemsPerPage}
				onPageChange={handlePageChange}
				onItemsPerPageChange={handleItemsPerPageChange}
				onEdit={handleEdit}
				onDelete={handleDelete}
				isLoading={isLoading}
				errorMessage={errorMessage}
				successMessage={successMessage}
			/>
		{:else if activeTab === 'responsible-persons'}
			<CatalogTable
				items={responsiblePersons}
				columns={responsiblePersonsColumns}
				title="Personas Responsables"
				currentPage={currentPage}
				itemsPerPage={itemsPerPage}
				onPageChange={handlePageChange}
				onItemsPerPageChange={handleItemsPerPageChange}
				onEdit={handleEdit}
				onDelete={handleDelete}
				isLoading={isLoading}
				errorMessage={errorMessage}
				successMessage={successMessage}
			/>
		{:else if activeTab === 'operation-details'}
			<CatalogTable
				items={operationDetails}
				columns={operationDetailsColumns}
				title="Detalles de Operación"
				currentPage={currentPage}
				itemsPerPage={itemsPerPage}
				onPageChange={handlePageChange}
				onItemsPerPageChange={handleItemsPerPageChange}
				onEdit={handleEdit}
				onDelete={handleDelete}
				isLoading={isLoading}
				errorMessage={errorMessage}
				successMessage={successMessage}
			/>
		{/if}
	{/if}

	<!-- Modal de edición -->
	{#if showEditModal && selectedItem}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 w-96">
				<h3 class="text-lg font-medium text-gray-900 mb-4">
					Editar {getCurrentTabName()}
				</h3>
				
				{#if activeTab === 'empresas'}
					<div class="space-y-4">
						<div>
							<label for="edit-empresa-razon" class="block text-sm font-medium text-gray-700 mb-2">Razón Social</label>
							<input
								id="edit-empresa-razon"
								type="text"
								bind:value={editFormData.razonSocial}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="Ingrese la razón social"
							/>
						</div>
						<div>
							<label for="edit-empresa-ruc" class="block text-sm font-medium text-gray-700 mb-2">RUC</label>
							<input
								id="edit-empresa-ruc"
								type="text"
								bind:value={editFormData.ruc}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="Ingrese el RUC"
							/>
						</div>
					</div>
				{:else if activeTab === 'stands'}
					<div class="space-y-4">
						<div>
							<label for="edit-stand-name" class="block text-sm font-medium text-gray-700 mb-2">Nombre del Stand</label>
							<input
								id="edit-stand-name"
								type="text"
								bind:value={editFormData.name}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="Ingrese el nombre del stand"
							/>
						</div>
						<div>
							<label for="edit-stand-location" class="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
							<input
								id="edit-stand-location"
								type="text"
								bind:value={editFormData.location}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="Ingrese la ubicación"
							/>
						</div>
						<div>
							<label for="edit-stand-status" class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
							<select
								id="edit-stand-status"
								bind:value={editFormData.status}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
							>
								<option value="active">Activo</option>
								<option value="inactive">Inactivo</option>
							</select>
						</div>
					</div>
				{:else if activeTab === 'responsible-persons'}
					<div class="space-y-4">
						<div>
							<label for="edit-person-name" class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
							<input
								id="edit-person-name"
								type="text"
								bind:value={editFormData.name}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="Ingrese el nombre"
							/>
						</div>
						<div>
							<label for="edit-person-email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
							<input
								id="edit-person-email"
								type="email"
								bind:value={editFormData.email}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="Ingrese el email"
							/>
						</div>
						<div>
							<label for="edit-person-phone" class="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
							<input
								id="edit-person-phone"
								type="text"
								bind:value={editFormData.phone}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="Ingrese el teléfono"
							/>
						</div>
					</div>
				{:else if activeTab === 'operation-details'}
					<div class="space-y-4">
						<div>
							<label for="edit-detail-name" class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
							<input
								id="edit-detail-name"
								type="text"
								bind:value={editFormData.name}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="Ingrese el nombre del detalle"
							/>
						</div>
						<div>
							<label for="edit-detail-type" class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
							<select
								id="edit-detail-type"
								bind:value={editFormData.type}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
							>
								<option value="income">Ingreso</option>
								<option value="expense">Gasto</option>
							</select>
						</div>
						<div>
							<label for="edit-detail-category" class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
							<input
								id="edit-detail-category"
								type="text"
								bind:value={editFormData.category}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
								placeholder="Ingrese la categoría"
							/>
						</div>
					</div>
				{/if}
				
				<div class="flex justify-end space-x-3 mt-6">
					<button
						onclick={() => { showEditModal = false; selectedItem = null; editFormData = {}; }}
						class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
					>
						Cancelar
					</button>
					<button
						onclick={updateItem}
						class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
					>
						Actualizar
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Modal de creación -->
	{#if showCreateForm}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 w-96">
				<h3 class="text-lg font-medium text-gray-900 mb-4">
					Crear Nuevo {getCurrentTabName()}
				</h3>
				
				{#if activeTab === 'empresas'}
					<div class="space-y-4">
						<div>
							<label for="empresa-razon" class="block text-sm font-medium text-gray-700 mb-2">Razón Social</label>
							<input id="empresa-razon" type="text" bind:value={newItem.name} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: Mi Empresa S.A.C." />
						</div>
						<div>
							<label for="empresa-ruc" class="block text-sm font-medium text-gray-700 mb-2">RUC</label>
							<input id="empresa-ruc" type="text" bind:value={newItem.location} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: 20123456789" />
						</div>
					</div>
				{:else if activeTab === 'stands'}
					<div class="space-y-4">
						<div>
							<label for="stand-name" class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
							<input id="stand-name" type="text" bind:value={newItem.name} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: Stand C" />
						</div>
						<div>
							<label for="stand-location" class="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
							<input id="stand-location" type="text" bind:value={newItem.location} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: Zona Centro" />
						</div>
					</div>
				{:else if activeTab === 'responsible-persons'}
					<div class="space-y-4">
						<div>
							<label for="person-name" class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
							<input id="person-name" type="text" bind:value={newItem.name} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: Carlos López" />
						</div>
						<div>
							<label for="person-email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
							<input id="person-email" type="email" bind:value={newItem.email} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="carlos@example.com" />
						</div>
						<div>
							<label for="person-phone" class="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
							<input id="person-phone" type="tel" bind:value={newItem.phone} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="999888555" />
						</div>
					</div>
				{:else if activeTab === 'operation-details'}
					<div class="space-y-4">
						<div>
							<label for="detail-name" class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
							<input id="detail-name" type="text" bind:value={newItem.name} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: Compra de materiales" />
						</div>
						<div>
							<label for="detail-type" class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
							<select id="detail-type" bind:value={newItem.type} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
								<option value="income">Ingreso</option>
								<option value="expense">Egreso</option>
							</select>
						</div>
						<div>
							<label for="detail-category" class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
							<input id="detail-category" type="text" bind:value={newItem.category} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: gastos" />
						</div>
					</div>
				{/if}

				<div class="flex justify-end space-x-3 mt-6">
					<button
						onclick={() => showCreateForm = false}
						class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
					>
						Cancelar
					</button>
					<button
						onclick={createItem}
						class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
					>
						Crear
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Modal de confirmación de eliminación -->
{#if showDeleteModal && itemToDelete}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-sm w-full">
			<!-- Header del modal -->
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
			</div>

			<!-- Contenido del modal -->
			<div class="p-6">
				<p class="text-sm text-gray-700">
					¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.
				</p>
			</div>

			<!-- Footer del modal -->
			<div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
				<button
					onclick={cancelDelete}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					Cancelar
				</button>
				<button
					onclick={confirmDelete}
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
				>
					Eliminar
				</button>
			</div>
		</div>
	</div>
{/if}
