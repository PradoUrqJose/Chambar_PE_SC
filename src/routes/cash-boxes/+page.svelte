<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	
	let isLoading = $state(true);
	let cashBoxes = $state([]);
	let errorMessage = $state('');
	let showCreateForm = $state(false);
	let newCashBoxName = $state('');
	let showOpenForm = $state(false);
	let openingAmount = $state(0);
	let selectedCashBoxId = $state('');

	// Cargar cajas
	async function loadCashBoxes() {
		try {
			isLoading = true;
			const response = await fetch('/api/cash-boxes');
			if (response.ok) {
				cashBoxes = await response.json();
			}
		} catch (error) {
			errorMessage = 'Error al cargar las cajas';
			console.error('Error loading cash boxes:', error);
		} finally {
			isLoading = false;
		}
	}

	// Mostrar modal de apertura
	function showOpenCashBoxModal(cashBoxId: string) {
		selectedCashBoxId = cashBoxId;
		openingAmount = 0;
		showOpenForm = true;
	}

	// Abrir caja
	async function openCashBox() {
		try {
			if (openingAmount < 0) {
				errorMessage = 'El monto inicial no puede ser negativo';
				return;
			}

			const response = await fetch(`/api/cash-boxes/${selectedCashBoxId}/open`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ openingAmount })
			});

			if (response.ok) {
				showOpenForm = false;
				await loadCashBoxes(); // Recargar cajas
			} else {
				const error = await response.json();
				errorMessage = error.message || 'Error al abrir la caja';
			}
		} catch (error) {
			errorMessage = 'Error al abrir la caja';
			console.error('Error opening cash box:', error);
		}
	}

	// Cerrar caja
	async function closeCashBox(cashBoxId: string) {
		try {
			const response = await fetch(`/api/cash-boxes/${cashBoxId}/close`, {
				method: 'POST'
			});

			if (response.ok) {
				await loadCashBoxes(); // Recargar cajas
			} else {
				const error = await response.json();
				errorMessage = error.message || 'Error al cerrar la caja';
			}
		} catch (error) {
			errorMessage = 'Error al cerrar la caja';
			console.error('Error closing cash box:', error);
		}
	}

	// Crear nueva caja
	async function createCashBox() {
		try {
			if (!newCashBoxName.trim()) {
				errorMessage = 'El nombre de la caja es obligatorio';
				return;
			}

			const response = await fetch('/api/cash-boxes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: newCashBoxName })
			});

			if (response.ok) {
				showCreateForm = false;
				newCashBoxName = '';
				await loadCashBoxes(); // Recargar cajas
			} else {
				const error = await response.json();
				errorMessage = error.message || 'Error al crear la caja';
			}
		} catch (error) {
			errorMessage = 'Error al crear la caja';
			console.error('Error creating cash box:', error);
		}
	}

	onMount(() => {
		loadCashBoxes();
	});
</script>

<svelte:head>
	<title>Caja - Chambar</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Gestión de Caja</h1>
				<p class="mt-2 text-gray-600">Administra las cajas registradoras del sistema</p>
			</div>
			<button
				onclick={() => showCreateForm = true}
				class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
			>
				+ Nueva Caja
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
			<span class="ml-2 text-gray-600">Cargando cajas...</span>
		</div>
	{:else}
		<!-- Lista de cajas -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each cashBoxes as cashBox}
				<div class="bg-white shadow rounded-lg">
					<div class="px-6 py-4">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-medium text-gray-900">{cashBox.name}</h3>
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
								{cashBox.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}"
							>
								{cashBox.status === 'open' ? 'Abierta' : 'Cerrada'}
							</span>
						</div>
						
						<div class="mt-4">
							<div class="text-sm text-gray-500">Monto actual</div>
							<div class="text-2xl font-semibold text-gray-900">S/. {cashBox.currentAmount.toFixed(2)}</div>
						</div>

						<div class="mt-6">
							{#if cashBox.status === 'closed'}
								<button
									onclick={() => showOpenCashBoxModal(cashBox.id)}
									class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
								>
									Abrir Caja
								</button>
							{:else}
								<button
									onclick={() => closeCashBox(cashBox.id)}
									class="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
								>
									Cerrar Caja
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Modal de creación de caja -->
	{#if showCreateForm}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 w-96">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Crear Nueva Caja</h3>
				
				<div class="mb-4">
					<label for="cashBoxName" class="block text-sm font-medium text-gray-700 mb-2">
						Nombre de la Caja
					</label>
					<input
						id="cashBoxName"
						type="text"
						bind:value={newCashBoxName}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						placeholder="Ej: Caja Secundaria"
					/>
				</div>

				<div class="flex justify-end space-x-3">
					<button
						onclick={() => {
							showCreateForm = false;
							newCashBoxName = '';
						}}
						class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
					>
						Cancelar
					</button>
					<button
						onclick={createCashBox}
						class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
					>
						Crear Caja
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Modal de apertura de caja -->
	{#if showOpenForm}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 w-96">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Abrir Caja</h3>
				
				<div class="mb-4">
					<label for="openingAmount" class="block text-sm font-medium text-gray-700 mb-2">
						Monto Inicial (S/.)
					</label>
					<input
						id="openingAmount"
						type="number"
						step="0.01"
						min="0"
						bind:value={openingAmount}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						placeholder="0.00"
					/>
					<p class="mt-1 text-sm text-gray-500">
						Ingresa el monto con el que se abre la caja
					</p>
				</div>

				<div class="flex justify-end space-x-3">
					<button
						onclick={() => {
							showOpenForm = false;
							openingAmount = 0;
						}}
						class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
					>
						Cancelar
					</button>
					<button
						onclick={openCashBox}
						class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
					>
						Abrir Caja
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
