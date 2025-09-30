<!-- Página de gestión de cajas administrativas -->
<!-- Esta página permite abrir, cerrar y ver el estado de las cajas -->

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	// Variables reactivas
	let currentDate = new Date();
	let todayCashBox: any = null;
	let isLoading = true;
	let errorMessage = '';
	let successMessage = '';
	
	// Formulario de apertura de caja
	let openingForm = {
		initialAmount: 0,
		notes: ''
	};
	
	// Formulario de cierre de caja
	let closingForm = {
		finalAmount: 0,
		notes: ''
	};
	
	// Formatear fecha para mostrar
	function formatDate(date: Date) {
		return date.toLocaleDateString('es-PE', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	
	// Formatear monto en soles
	function formatAmount(amount: number) {
		return new Intl.NumberFormat('es-PE', {
			style: 'currency',
			currency: 'PEN'
		}).format(amount / 100); // Convertir de centavos a soles
	}
	
	// Cargar datos de la caja del día
	async function loadTodayCashBox() {
		try {
			isLoading = true;
			const response = await fetch('/api/cash-boxes/today');
			const result = await response.json();
			
			if (result.success) {
				todayCashBox = result.data;
			} else {
				errorMessage = result.error || 'Error cargando caja del día';
			}
		} catch (error) {
			console.error('Error cargando caja:', error);
			errorMessage = 'Error de conexión';
		} finally {
			isLoading = false;
		}
	}
	
	// Abrir caja
	async function openCashBox() {
		try {
			const response = await fetch('/api/cash-boxes/open', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(openingForm)
			});
			
			const result = await response.json();
			
			if (result.success) {
				successMessage = 'Caja abierta correctamente';
				await loadTodayCashBox();
				openingForm = { initialAmount: 0, notes: '' };
			} else {
				errorMessage = result.error || 'Error abriendo caja';
			}
		} catch (error) {
			console.error('Error abriendo caja:', error);
			errorMessage = 'Error de conexión';
		}
	}
	
	// Cerrar caja
	async function closeCashBox() {
		try {
			const response = await fetch('/api/cash-boxes/close', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(closingForm)
			});
			
			const result = await response.json();
			
			if (result.success) {
				successMessage = 'Caja cerrada correctamente';
				await loadTodayCashBox();
				closingForm = { finalAmount: 0, notes: '' };
			} else {
				errorMessage = result.error || 'Error cerrando caja';
			}
		} catch (error) {
			console.error('Error cerrando caja:', error);
			errorMessage = 'Error de conexión';
		}
	}
	
	// Cargar datos al montar el componente
	onMount(() => {
		loadTodayCashBox();
	});
</script>

<svelte:head>
	<title>Gestión de Cajas - Chambar</title>
</svelte:head>

<!-- Header -->
<header class="bg-white shadow">
	<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">
					Gestión de Cajas
				</h1>
				<p class="mt-1 text-sm text-gray-500">
					{formatDate(currentDate)}
				</p>
			</div>
			<div class="text-right">
				<p class="text-sm text-gray-500">Hora actual:</p>
				<p class="text-lg font-medium text-gray-900">
					{currentDate.toLocaleTimeString('es-PE')}
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
		
		<!-- Estado de carga -->
		{#if isLoading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
				<span class="ml-3 text-gray-600">Cargando...</span>
			</div>
		{:else}
			
			<!-- Estado de la caja del día -->
			<div class="mb-8">
				<div class="bg-white shadow rounded-lg">
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
							Estado de la Caja - {formatDate(currentDate)}
						</h3>
						
						{#if todayCashBox}
							<!-- Caja existe -->
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div class="text-center">
									<p class="text-sm text-gray-500">Estado</p>
									<p class="text-lg font-medium">
										{#if todayCashBox.status === 'open'}
											<span class="text-green-600">Abierta</span>
										{:else if todayCashBox.status === 'closed'}
											<span class="text-red-600">Cerrada</span>
										{:else}
											<span class="text-yellow-600">Editada</span>
										{/if}
									</p>
								</div>
								
								<div class="text-center">
									<p class="text-sm text-gray-500">Monto Inicial</p>
									<p class="text-lg font-medium text-gray-900">
										{formatAmount(todayCashBox.initialAmount)}
									</p>
								</div>
								
								<div class="text-center">
									<p class="text-sm text-gray-500">Monto Final</p>
									<p class="text-lg font-medium text-gray-900">
										{todayCashBox.finalAmount ? formatAmount(todayCashBox.finalAmount) : 'N/A'}
									</p>
								</div>
							</div>
							
							<!-- Acciones según el estado -->
							<div class="mt-6">
								{#if todayCashBox.status === 'open'}
									<!-- Caja abierta - mostrar formulario de cierre -->
									<div class="border-t pt-6">
										<h4 class="text-md font-medium text-gray-900 mb-4">Cerrar Caja</h4>
										<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label for="finalAmount" class="block text-sm font-medium text-gray-700">
													Monto Final (S/.)
												</label>
												<input
													id="finalAmount"
													type="number"
													step="0.01"
													bind:value={closingForm.finalAmount}
													class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
													placeholder="0.00"
												/>
											</div>
											<div>
												<label for="closingNotes" class="block text-sm font-medium text-gray-700">
													Observaciones de Cierre
												</label>
												<input
													id="closingNotes"
													type="text"
													bind:value={closingForm.notes}
													class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
													placeholder="Observaciones..."
												/>
											</div>
										</div>
										<div class="mt-4">
											<button
												on:click={closeCashBox}
												class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
											>
												Cerrar Caja
											</button>
										</div>
									</div>
								{:else}
									<!-- Caja cerrada - mostrar información -->
									<div class="bg-gray-50 rounded-md p-4">
										<p class="text-sm text-gray-600">
											La caja fue cerrada el {new Date(todayCashBox.closedAt).toLocaleString('es-PE')}
										</p>
										{#if todayCashBox.closingNotes}
											<p class="text-sm text-gray-600 mt-2">
												<strong>Observaciones:</strong> {todayCashBox.closingNotes}
											</p>
										{/if}
									</div>
								{/if}
							</div>
						{:else}
							<!-- No hay caja - mostrar formulario de apertura -->
							<div class="text-center py-8">
								<div class="mx-auto h-12 w-12 text-gray-400">
									<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
									</svg>
								</div>
								<h3 class="mt-2 text-sm font-medium text-gray-900">No hay caja abierta</h3>
								<p class="mt-1 text-sm text-gray-500">Abre una nueva caja para comenzar las operaciones del día.</p>
								
								<div class="mt-6 max-w-md mx-auto">
									<div class="space-y-4">
										<div>
											<label for="initialAmount" class="block text-sm font-medium text-gray-700">
												Monto Inicial (S/.)
											</label>
											<input
												id="initialAmount"
												type="number"
												step="0.01"
												bind:value={openingForm.initialAmount}
												class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
												placeholder="0.00"
											/>
										</div>
										<div>
											<label for="openingNotes" class="block text-sm font-medium text-gray-700">
												Observaciones de Apertura
											</label>
											<input
												id="openingNotes"
												type="text"
												bind:value={openingForm.notes}
												class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
												placeholder="Observaciones..."
											/>
										</div>
										<button
											on:click={openCashBox}
											class="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
										>
											Abrir Caja
										</button>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
			
		{/if}
	</div>
</main>
