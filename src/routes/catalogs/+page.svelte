<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	
	let isLoading = $state(true);
	let activeTab = $state('empresas');
	let errorMessage = $state('');
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
	let empresas = $state([]);
	let stands = $state([]);
	let responsiblePersons = $state([]);
	let operationDetails = $state([]);

	// Cargar datos de catálogos
	async function loadCatalogs() {
		try {
			isLoading = true;
			
			// Cargar empresas
			const empresasResponse = await fetch('/api/companies');
			if (empresasResponse.ok) {
				empresas = await empresasResponse.json();
			} else {
				// Fallback a datos mock
				empresas = [
					{ id: '1', razonSocial: 'Empresa Demo S.A.C.', ruc: '20123456789' }
				];
			}
			
			// Cargar stands
			const standsResponse = await fetch('/api/catalogs/stands');
			if (standsResponse.ok) {
				stands = await standsResponse.json();
			} else {
				stands = [
					{ id: '1', name: 'Stand A', location: 'Zona Norte', status: 'active' },
					{ id: '2', name: 'Stand B', location: 'Zona Sur', status: 'active' }
				];
			}
			
			// Cargar responsables
			const responsibleResponse = await fetch('/api/catalogs/responsible-persons');
			if (responsibleResponse.ok) {
				responsiblePersons = await responsibleResponse.json();
				console.log('Responsables cargados desde API:', responsiblePersons);
			} else {
				responsiblePersons = [
					{ id: '1', name: 'Juan Pérez', email: 'juan@example.com', phone: '999888777' },
					{ id: '2', name: 'María García', email: 'maria@example.com', phone: '999888666' }
				];
				console.log('Responsables usando fallback:', responsiblePersons);
			}
			
			// Cargar detalles de operación
			const detailsResponse = await fetch('/api/catalogs/operation-details');
			if (detailsResponse.ok) {
				operationDetails = await detailsResponse.json();
				console.log('Detalles cargados desde API:', operationDetails);
			} else {
				operationDetails = [
					{ id: '1', name: 'Venta de productos', type: 'income', category: 'ventas' },
					{ id: '2', name: 'Pago a proveedor', type: 'expense', category: 'compras' }
				];
				console.log('Detalles usando fallback:', operationDetails);
			}
		} catch (error) {
			errorMessage = 'Error al cargar los catálogos';
			console.error('Error loading catalogs:', error);
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
				response = await fetch('/api/companies', {
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
			const response = await fetch('/api/companies');
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

<div class="max-w-7xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Catálogos</h1>
				<p class="mt-2 text-gray-600">Administra los catálogos del sistema</p>
			</div>
			<div class="flex space-x-2">
				<button
					onclick={() => showCreateForm = true}
					class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
				>
					+ Nuevo {getCurrentTabName()}
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
			<div class="bg-white shadow rounded-lg">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-medium text-gray-900">Empresas</h3>
				</div>
				<div class="divide-y divide-gray-200">
					{#each empresas as empresa}
						<div class="px-6 py-4 flex items-center justify-between">
							<div>
								<h4 class="text-sm font-medium text-gray-900">{empresa.razonSocial}</h4>
								<p class="text-sm text-gray-500">RUC: {empresa.ruc}</p>
							</div>
							<div class="flex space-x-2">
								<button class="text-green-600 hover:text-green-900 text-sm font-medium">Editar</button>
								<button class="text-red-600 hover:text-red-900 text-sm font-medium">Eliminar</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if activeTab === 'stands'}
			<div class="bg-white shadow rounded-lg">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-medium text-gray-900">Stands</h3>
				</div>
				<div class="divide-y divide-gray-200">
					{#each stands as stand}
						<div class="px-6 py-4 flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-900">{stand.name}</p>
								<p class="text-sm text-gray-500">{stand.location}</p>
							</div>
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
								{stand.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}"
							>
								{stand.status === 'active' ? 'Activo' : 'Inactivo'}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{:else if activeTab === 'responsible-persons'}
			<div class="bg-white shadow rounded-lg">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-medium text-gray-900">Personas Responsables</h3>
				</div>
				<div class="divide-y divide-gray-200">
					{#each responsiblePersons as person}
						<div class="px-6 py-4">
							<div class="flex items-center">
								<div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
									<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
									</svg>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-900">{person.name}</p>
									<p class="text-sm text-gray-500">{person.email}</p>
									<p class="text-sm text-gray-500">{person.phone}</p>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if activeTab === 'operation-details'}
			<div class="bg-white shadow rounded-lg">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-medium text-gray-900">Detalles de Operación</h3>
				</div>
				<div class="divide-y divide-gray-200">
					{#each operationDetails as detail}
						<div class="px-6 py-4 flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-900">{detail.name}</p>
								<p class="text-sm text-gray-500">{detail.category}</p>
							</div>
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
								{detail.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}"
							>
								{detail.type === 'income' ? 'Ingreso' : 'Egreso'}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
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
