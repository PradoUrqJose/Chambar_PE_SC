<!-- Página principal de gestión de catálogos -->
<!-- Esta página permite gestionar todos los catálogos del sistema -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	// Variables reactivas
	let activeTab = 'operation-details';
	let isLoading = true;
	let errorMessage = '';
	let successMessage = '';
	
	// Datos de catálogos
	let operationDetails: any[] = [];
	let responsiblePersons: any[] = [];
	let stands: any[] = [];
	let companies: any[] = [];
	
	// Contadores
	let counts = {
		operationDetails: 0,
		responsiblePersons: 0,
		stands: 0,
		companies: 0
	};
	
	// Estados de modales
	let showCreateModal = false;
	let showEditModal = false;
	let editingItem: any = null;
	
	// Formularios
	let createForm = {
		operationDetail: { name: '', description: '', type: 'income' },
		responsible: { name: '', email: '', phone: '' },
		stand: { name: '', description: '', location: '' },
		company: { name: '', ruc: '', address: '', phone: '', email: '' }
	};
	
	// Cargar datos de todos los catálogos
	async function loadAllCatalogs() {
		try {
			isLoading = true;
			
			const [detailsRes, responsiblesRes, standsRes, companiesRes] = await Promise.all([
				fetch('/api/catalogs/operation-details'),
				fetch('/api/catalogs/responsible-persons'),
				fetch('/api/catalogs/stands'),
				fetch('/api/catalogs/companies')
			]);
			
			const detailsData = await detailsRes.json();
			const responsiblesData = await responsiblesRes.json();
			const standsData = await standsRes.json();
			const companiesData = await companiesRes.json();
			
			operationDetails = detailsData.success ? detailsData.data : [];
			responsiblePersons = responsiblesData.success ? responsiblesData.data : [];
			stands = standsData.success ? standsData.data : [];
			companies = companiesData.success ? companiesData.data : [];
			
			// Actualizar contadores
			counts = {
				operationDetails: operationDetails.length,
				responsiblePersons: responsiblePersons.length,
				stands: stands.length,
				companies: companies.length
			};
			
		} catch (error) {
			console.error('Error cargando catálogos:', error);
			errorMessage = 'Error cargando catálogos';
		} finally {
			isLoading = false;
		}
	}
	
	// Cambiar tab activo
	function setActiveTab(tab: string) {
		activeTab = tab;
	}
	
	// Funciones para manejar modales
	function openCreateModal() {
		showCreateModal = true;
		showEditModal = false;
		editingItem = null;
		resetForms();
	}
	
	function openEditModal(item: any) {
		editingItem = item;
		showEditModal = true;
		showCreateModal = false;
		populateEditForm(item);
	}
	
	function closeModals() {
		showCreateModal = false;
		showEditModal = false;
		editingItem = null;
		resetForms();
	}
	
	function resetForms() {
		createForm = {
			operationDetail: { name: '', description: '', type: 'income' },
			responsible: { name: '', email: '', phone: '' },
			stand: { name: '', description: '', location: '' },
			company: { name: '', ruc: '', address: '', phone: '', email: '' }
		};
	}
	
	function populateEditForm(item: any) {
		if (activeTab === 'operation-details') {
			createForm.operationDetail = {
				name: item.name,
				description: item.description || '',
				type: item.type
			};
		} else if (activeTab === 'responsible-persons') {
			createForm.responsible = {
				name: item.name,
				email: item.email || '',
				phone: item.phone || ''
			};
		} else if (activeTab === 'stands') {
			createForm.stand = {
				name: item.name,
				description: item.description || '',
				location: item.location || ''
			};
		} else if (activeTab === 'companies') {
			createForm.company = {
				name: item.name,
				ruc: item.ruc || '',
				address: item.address || '',
				phone: item.phone || '',
				email: item.email || ''
			};
		}
	}
	
	// Funciones CRUD
	async function createItem() {
		try {
			let endpoint = '';
			let data: any = {};
			
			if (activeTab === 'operation-details') {
				endpoint = '/api/catalogs/operation-details';
				data = createForm.operationDetail;
			} else if (activeTab === 'responsible-persons') {
				endpoint = '/api/catalogs/responsible-persons';
				data = createForm.responsible;
			} else if (activeTab === 'stands') {
				endpoint = '/api/catalogs/stands';
				data = createForm.stand;
			} else if (activeTab === 'companies') {
				endpoint = '/api/catalogs/companies';
				data = createForm.company;
			}
			
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			
			const result = await response.json();
			
			if (result.success) {
				successMessage = 'Elemento creado correctamente';
				await loadAllCatalogs();
				closeModals();
			} else {
				errorMessage = result.error || 'Error creando elemento';
			}
		} catch (error) {
			console.error('Error creando elemento:', error);
			errorMessage = 'Error de conexión';
		}
	}
	
	async function updateItem() {
		try {
			let endpoint = '';
			let data: any = {};
			
			if (activeTab === 'operation-details') {
				endpoint = `/api/catalogs/operation-details/${editingItem.id}`;
				data = createForm.operationDetail;
			} else if (activeTab === 'responsible-persons') {
				endpoint = `/api/catalogs/responsible-persons/${editingItem.id}`;
				data = createForm.responsible;
			} else if (activeTab === 'stands') {
				endpoint = `/api/catalogs/stands/${editingItem.id}`;
				data = createForm.stand;
			} else if (activeTab === 'companies') {
				endpoint = `/api/catalogs/companies/${editingItem.id}`;
				data = createForm.company;
			}
			
			const response = await fetch(endpoint, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			
			const result = await response.json();
			
			if (result.success) {
				successMessage = 'Elemento actualizado correctamente';
				await loadAllCatalogs();
				closeModals();
			} else {
				errorMessage = result.error || 'Error actualizando elemento';
			}
		} catch (error) {
			console.error('Error actualizando elemento:', error);
			errorMessage = 'Error de conexión';
		}
	}
	
	async function deleteItem(item: any) {
		if (!confirm('¿Está seguro de eliminar este elemento?')) return;
		
		try {
			let endpoint = '';
			
			if (activeTab === 'operation-details') {
				endpoint = `/api/catalogs/operation-details/${item.id}`;
			} else if (activeTab === 'responsible-persons') {
				endpoint = `/api/catalogs/responsible-persons/${item.id}`;
			} else if (activeTab === 'stands') {
				endpoint = `/api/catalogs/stands/${item.id}`;
			} else if (activeTab === 'companies') {
				endpoint = `/api/catalogs/companies/${item.id}`;
			}
			
			const response = await fetch(endpoint, {
				method: 'DELETE'
			});
			
			const result = await response.json();
			
			if (result.success) {
				successMessage = 'Elemento eliminado correctamente';
				await loadAllCatalogs();
			} else {
				errorMessage = result.error || 'Error eliminando elemento';
			}
		} catch (error) {
			console.error('Error eliminando elemento:', error);
			errorMessage = 'Error de conexión';
		}
	}
	
	// Cargar datos al montar
	onMount(() => {
		loadAllCatalogs();
	});
</script>

<svelte:head>
	<title>Catálogos - Chambar</title>
</svelte:head>

<!-- Header -->
<header class="bg-white shadow-sm border-b">
	<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">
					Catálogos
				</h1>
				<p class="mt-1 text-sm text-gray-500">
					Gestionar detalles, responsables, stands y empresas
				</p>
			</div>
			<div class="text-right">
				<p class="text-sm text-gray-500">Total de elementos</p>
				<p class="text-2xl font-bold text-indigo-600">
					{counts.operationDetails + counts.responsiblePersons + counts.stands + counts.companies}
				</p>
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
		
		<!-- Tabs de navegación -->
		<div class="mb-8">
			<div class="border-b border-gray-200">
				<nav class="-mb-px flex space-x-8">
					<button
						on:click={() => setActiveTab('operation-details')}
						class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
							{activeTab === 'operation-details' 
								? 'border-indigo-500 text-indigo-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Detalles de Operación
						<span class="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
							{counts.operationDetails}
						</span>
					</button>
					<button
						on:click={() => setActiveTab('responsible-persons')}
						class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
							{activeTab === 'responsible-persons' 
								? 'border-indigo-500 text-indigo-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Responsables
						<span class="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
							{counts.responsiblePersons}
						</span>
					</button>
					<button
						on:click={() => setActiveTab('stands')}
						class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
							{activeTab === 'stands' 
								? 'border-indigo-500 text-indigo-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Stands
						<span class="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
							{counts.stands}
						</span>
					</button>
					<button
						on:click={() => setActiveTab('companies')}
						class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
							{activeTab === 'companies' 
								? 'border-indigo-500 text-indigo-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Empresas
						<span class="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
							{counts.companies}
						</span>
					</button>
				</nav>
			</div>
		</div>
		
		<!-- Contenido de tabs -->
		{#if isLoading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
				<span class="ml-3 text-gray-600">Cargando catálogos...</span>
			</div>
		{:else}
			
			<!-- Tab: Detalles de Operación -->
			{#if activeTab === 'operation-details'}
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<div class="flex justify-between items-center mb-6">
							<h3 class="text-lg leading-6 font-medium text-gray-900">
								Detalles de Operación
							</h3>
							<button 
								on:click={openCreateModal}
								class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							>
								Agregar Detalle
							</button>
						</div>
						
						{#if operationDetails.length === 0}
							<div class="text-center py-12">
								<div class="mx-auto h-12 w-12 text-gray-400">
									<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
									</svg>
								</div>
								<h3 class="mt-2 text-sm font-medium text-gray-900">No hay detalles de operación</h3>
								<p class="mt-1 text-sm text-gray-500">Comience agregando un nuevo detalle.</p>
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{#each operationDetails as detail}
									<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<h4 class="text-sm font-medium text-gray-900">{detail.name}</h4>
												<p class="text-sm text-gray-500 mt-1">{detail.description || 'Sin descripción'}</p>
												<div class="mt-2">
													<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
														{detail.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
														{detail.type === 'income' ? 'Ingreso' : 'Egreso'}
													</span>
												</div>
											</div>
											<div class="flex space-x-2 ml-4">
												<button 
													on:click={() => openEditModal(detail)}
													class="text-indigo-600 hover:text-indigo-900 text-sm"
												>
													Editar
												</button>
												<button 
													on:click={() => deleteItem(detail)}
													class="text-red-600 hover:text-red-900 text-sm"
												>
													Eliminar
												</button>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
			
			<!-- Tab: Responsables -->
			{#if activeTab === 'responsible-persons'}
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<div class="flex justify-between items-center mb-6">
							<h3 class="text-lg leading-6 font-medium text-gray-900">
								Responsables
							</h3>
							<button 
								on:click={openCreateModal}
								class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							>
								Agregar Responsable
							</button>
						</div>
						
						{#if responsiblePersons.length === 0}
							<div class="text-center py-12">
								<div class="mx-auto h-12 w-12 text-gray-400">
									<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
									</svg>
								</div>
								<h3 class="mt-2 text-sm font-medium text-gray-900">No hay responsables</h3>
								<p class="mt-1 text-sm text-gray-500">Comience agregando un nuevo responsable.</p>
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{#each responsiblePersons as person}
									<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<h4 class="text-sm font-medium text-gray-900">{person.name}</h4>
												{#if person.email}
													<p class="text-sm text-gray-500 mt-1">{person.email}</p>
												{/if}
												{#if person.phone}
													<p class="text-sm text-gray-500">{person.phone}</p>
												{/if}
											</div>
											<div class="flex space-x-2 ml-4">
												<button 
													on:click={() => openEditModal(person)}
													class="text-indigo-600 hover:text-indigo-900 text-sm"
												>
													Editar
												</button>
												<button 
													on:click={() => deleteItem(person)}
													class="text-red-600 hover:text-red-900 text-sm"
												>
													Eliminar
												</button>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
			
			<!-- Tab: Stands -->
			{#if activeTab === 'stands'}
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<div class="flex justify-between items-center mb-6">
							<h3 class="text-lg leading-6 font-medium text-gray-900">
								Stands
							</h3>
							<button 
								on:click={openCreateModal}
								class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							>
								Agregar Stand
							</button>
						</div>
						
						{#if stands.length === 0}
							<div class="text-center py-12">
								<div class="mx-auto h-12 w-12 text-gray-400">
									<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
									</svg>
								</div>
								<h3 class="mt-2 text-sm font-medium text-gray-900">No hay stands</h3>
								<p class="mt-1 text-sm text-gray-500">Comience agregando un nuevo stand.</p>
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{#each stands as stand}
									<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<h4 class="text-sm font-medium text-gray-900">{stand.name}</h4>
												{#if stand.description}
													<p class="text-sm text-gray-500 mt-1">{stand.description}</p>
												{/if}
												{#if stand.location}
													<p class="text-sm text-gray-500">{stand.location}</p>
												{/if}
											</div>
											<div class="flex space-x-2 ml-4">
												<button 
													on:click={() => openEditModal(stand)}
													class="text-indigo-600 hover:text-indigo-900 text-sm"
												>
													Editar
												</button>
												<button 
													on:click={() => deleteItem(stand)}
													class="text-red-600 hover:text-red-900 text-sm"
												>
													Eliminar
												</button>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
			
			<!-- Tab: Empresas -->
			{#if activeTab === 'companies'}
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<div class="flex justify-between items-center mb-6">
							<h3 class="text-lg leading-6 font-medium text-gray-900">
								Empresas
							</h3>
							<button 
								on:click={openCreateModal}
								class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							>
								Agregar Empresa
							</button>
						</div>
						
						{#if companies.length === 0}
							<div class="text-center py-12">
								<div class="mx-auto h-12 w-12 text-gray-400">
									<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
									</svg>
								</div>
								<h3 class="mt-2 text-sm font-medium text-gray-900">No hay empresas</h3>
								<p class="mt-1 text-sm text-gray-500">Comience agregando una nueva empresa.</p>
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{#each companies as company}
									<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<h4 class="text-sm font-medium text-gray-900">{company.name}</h4>
												{#if company.ruc}
													<p class="text-sm text-gray-500 mt-1">RUC: {company.ruc}</p>
												{/if}
												{#if company.email}
													<p class="text-sm text-gray-500">{company.email}</p>
												{/if}
												{#if company.phone}
													<p class="text-sm text-gray-500">{company.phone}</p>
												{/if}
											</div>
											<div class="flex space-x-2 ml-4">
												<button 
													on:click={() => openEditModal(company)}
													class="text-indigo-600 hover:text-indigo-900 text-sm"
												>
													Editar
												</button>
												<button 
													on:click={() => deleteItem(company)}
													class="text-red-600 hover:text-red-900 text-sm"
												>
													Eliminar
												</button>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
			
		{/if}
	</div>
</main>

<!-- Modal de creación/edición -->
{#if showCreateModal || showEditModal}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 class="text-lg font-medium text-gray-900 mb-4">
					{showCreateModal ? 'Agregar' : 'Editar'} {activeTab === 'operation-details' ? 'Detalle de Operación' : activeTab === 'responsible-persons' ? 'Responsable' : activeTab === 'stands' ? 'Stand' : 'Empresa'}
				</h3>
				
				<form on:submit|preventDefault={showCreateModal ? createItem : updateItem} class="space-y-4">
					
					<!-- Detalles de Operación -->
					{#if activeTab === 'operation-details'}
						<div>
							<label for="detailName" class="block text-sm font-medium text-gray-700">Nombre</label>
							<input
								id="detailName"
								type="text"
								bind:value={createForm.operationDetail.name}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								required
							/>
						</div>
						<div>
							<label for="detailDescription" class="block text-sm font-medium text-gray-700">Descripción</label>
							<input
								id="detailDescription"
								type="text"
								bind:value={createForm.operationDetail.description}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
						<div>
							<label for="detailType" class="block text-sm font-medium text-gray-700">Tipo</label>
							<select
								id="detailType"
								bind:value={createForm.operationDetail.type}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								required
							>
								<option value="income">Ingreso</option>
								<option value="expense">Egreso</option>
							</select>
						</div>
					{/if}
					
					<!-- Responsables -->
					{#if activeTab === 'responsible-persons'}
						<div>
							<label for="responsibleName" class="block text-sm font-medium text-gray-700">Nombre</label>
							<input
								id="responsibleName"
								type="text"
								bind:value={createForm.responsible.name}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								required
							/>
						</div>
						<div>
							<label for="responsibleEmail" class="block text-sm font-medium text-gray-700">Email</label>
							<input
								id="responsibleEmail"
								type="email"
								bind:value={createForm.responsible.email}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
						<div>
							<label for="responsiblePhone" class="block text-sm font-medium text-gray-700">Teléfono</label>
							<input
								id="responsiblePhone"
								type="text"
								bind:value={createForm.responsible.phone}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
					{/if}
					
					<!-- Stands -->
					{#if activeTab === 'stands'}
						<div>
							<label for="standName" class="block text-sm font-medium text-gray-700">Nombre</label>
							<input
								id="standName"
								type="text"
								bind:value={createForm.stand.name}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								required
							/>
						</div>
						<div>
							<label for="standDescription" class="block text-sm font-medium text-gray-700">Descripción</label>
							<input
								id="standDescription"
								type="text"
								bind:value={createForm.stand.description}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
						<div>
							<label for="standLocation" class="block text-sm font-medium text-gray-700">Ubicación</label>
							<input
								id="standLocation"
								type="text"
								bind:value={createForm.stand.location}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
					{/if}
					
					<!-- Empresas -->
					{#if activeTab === 'companies'}
						<div>
							<label for="companyName" class="block text-sm font-medium text-gray-700">Nombre</label>
							<input
								id="companyName"
								type="text"
								bind:value={createForm.company.name}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
								required
							/>
						</div>
						<div>
							<label for="companyRuc" class="block text-sm font-medium text-gray-700">RUC</label>
							<input
								id="companyRuc"
								type="text"
								bind:value={createForm.company.ruc}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
						<div>
							<label for="companyAddress" class="block text-sm font-medium text-gray-700">Dirección</label>
							<input
								id="companyAddress"
								type="text"
								bind:value={createForm.company.address}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
						<div>
							<label for="companyPhone" class="block text-sm font-medium text-gray-700">Teléfono</label>
							<input
								id="companyPhone"
								type="text"
								bind:value={createForm.company.phone}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
						<div>
							<label for="companyEmail" class="block text-sm font-medium text-gray-700">Email</label>
							<input
								id="companyEmail"
								type="email"
								bind:value={createForm.company.email}
								class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
					{/if}
					
					<!-- Botones -->
					<div class="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							on:click={closeModals}
							class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
						>
							Cancelar
						</button>
						<button
							type="submit"
							class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
						>
							{showCreateModal ? 'Crear' : 'Actualizar'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
