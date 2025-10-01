<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { 
		CashBoxCard, 
		OperationsTable, 
		OperationModal, 
		DateNavigation, 
		CashBoxActions,
		ReopenConfirmationModal 
	} from '$lib/components';
	import type { CashBox } from '$lib/services/cash-boxes-service';
	import type { Operation } from '$lib/services/operations-service';

	let { data } = $props<{ data: PageData }>();
	
	// Estados principales
	let isLoading = $state(true);
	let cashBoxes = $state<CashBox[]>([]);
	let operations = $state<Operation[]>([]);
	let errorMessage = $state('');
	
	// Estados de UI
	let showOpenForm = $state(false);
	let openingAmount = $state(0);
	let selectedCashBoxId = $state('');
	let currentOpenCashBox = $state<CashBox | null>(null);
	
	// Estados para historial y navegación
	let currentDate = $state(new Date());
	let canNavigateBack = $state(true);
	let canNavigateForward = $state(false);
	
	// Estados para modales
	let showOperationsModal = $state(false);
	let showReopenConfirmation = $state(false);
	let cashBoxToReopen = $state<CashBox | null>(null);
	
	// Estados para tabla
	let rowsPerPage = $state(5);
	
	// Estados para formulario de operación
	let newOperation = $state({
		type: 'income' as 'income' | 'expense',
		amount: 0,
		description: '',
		operationDetailId: '',
		responsiblePersonId: '',
		standId: '',
		companyId: '',
		image: null as File | null
	});

	// Datos de catálogos
	let operationDetails = $state<any[]>([]);
	let responsiblePersons = $state<any[]>([]);
	let stands = $state<any[]>([]);
	let companies = $state<any[]>([]);

	// Función para calcular saldo derivado (eliminando currentAmount persistido)
	function computeCurrentAmount(cashBoxId: string): number {
		const cashBox = cashBoxes.find(cb => cb.id === cashBoxId);
		if (!cashBox) return 0;
		
		// Asegurar que operations es un array
		const operationsArray = Array.isArray(operations) ? operations : operations.operations || [];
		const operationsForBox = operationsArray.filter(op => op.cashBoxId === cashBoxId);
		const delta = operationsForBox.reduce((acc, op) => {
			return acc + (op.type === 'income' ? op.amount : -op.amount);
		}, 0);
		
		return cashBox.openingAmount + delta;
	}

	// Función para obtener caja para la fecha actual
	function getCashBoxForDate(date: Date): CashBox | null {
		const targetDate = toPeruDateString(date);
		console.log('🔍 getCashBoxForDate - targetDate:', targetDate);
		console.log('🔍 Available cash boxes count:', cashBoxes.length);
		
		const found = cashBoxes.find(cb => cb.businessDate === targetDate);
		console.log('🔍 Found cash box:', found ? found.name : 'null');
		
		return found || null;
	}

	// Helper para convertir fecha a string en zona horaria de Perú (YYYY-MM-DD)
	function toPeruDateString(date: Date): string {
		return date.toLocaleDateString('en-CA', { 
			timeZone: 'America/Lima' 
		});
	}

	// Función para actualizar estado de navegación
	function updateNavigationState() {
		const today = new Date();
		canNavigateBack = currentDate.getTime() < today.getTime();
		canNavigateForward = currentDate.getTime() < today.getTime();
	}

	// Función para navegar a una fecha
	async function navigateDate(date: Date) {
		currentDate = date;
		updateNavigationState();
		await loadOperationsForDate(date);
		updateCurrentOpenCashBox();
	}

	// Función para ir a hoy
	async function goToToday() {
		const today = new Date();
		await navigateDate(today);
	}

	// Función para actualizar caja abierta actual
	function updateCurrentOpenCashBox() {
		const cashBoxForDate = getCashBoxForDate(currentDate);
		currentOpenCashBox = cashBoxForDate;
	}

	// Función para cargar operaciones para una fecha
	async function loadOperationsForDate(date: Date, showLoading: boolean = true) {
		console.log('🔄 loadOperationsForDate called with date:', date);
		if (showLoading) isLoading = true;
		
		try {
			const dateStr = toPeruDateString(date);
			console.log('📅 Date string for API:', dateStr);
			const response = await fetch(`/api/operations?date=${dateStr}&limit=${rowsPerPage}`);
			console.log('📡 Operations API response status:', response.status);
			
			if (response.ok) {
				const data = await response.json();
				console.log('✅ Operations loaded:', data);
				operations = data;
			} else {
				console.error('❌ Error loading operations:', response.statusText);
				operations = [];
			}
		} catch (error) {
			console.error('💥 Error loading operations:', error);
			operations = [];
		} finally {
			if (showLoading) isLoading = false;
		}
	}

	// Función para cargar cajas
	async function loadCashBoxes() {
		console.log('🏦 loadCashBoxes called');
		try {
			const response = await fetch('/api/cash-boxes');
			console.log('📡 Cash boxes API response status:', response.status);
			
			if (response.ok) {
				const data = await response.json();
				console.log('✅ Cash boxes loaded:', data);
				cashBoxes = data;
				updateCurrentOpenCashBox();
			} else {
				console.error('❌ Error loading cash boxes:', response.statusText);
			}
		} catch (error) {
			console.error('💥 Error loading cash boxes:', error);
		}
	}

	// Función para cargar datos de catálogos
	async function loadSelectData() {
		console.log('📋 loadSelectData called');
		try {
			const [detailsRes, personsRes, standsRes, companiesRes] = await Promise.all([
				fetch('/api/catalogs/operation-details'),
				fetch('/api/catalogs/responsible-persons'),
				fetch('/api/catalogs/stands'),
				fetch('/api/catalogs/companies')
			]);

			console.log('📋 Select data API responses:', {
				details: detailsRes.status,
				persons: personsRes.status,
				stands: standsRes.status,
				companies: companiesRes.status
			});

			if (detailsRes.ok) operationDetails = await detailsRes.json();
			if (personsRes.ok) responsiblePersons = await personsRes.json();
			if (standsRes.ok) stands = await standsRes.json();
			if (companiesRes.ok) companies = await companiesRes.json();
			
			console.log('✅ Select data loaded successfully');
		} catch (error) {
			console.error('💥 Error loading select data:', error);
		}
	}

	// Función para mostrar modal de apertura de caja
	function showOpenCashBoxModal(cashBoxId: string) {
		selectedCashBoxId = cashBoxId;
		openingAmount = 0;
		showOpenForm = true;
	}

	// Función para abrir caja
	async function openCashBox() {
		if (!selectedCashBoxId || openingAmount < 0) return;

		try {
			const response = await fetch(`/api/cash-boxes/${selectedCashBoxId}/open`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					openingAmount,
					openedAt: new Date().toISOString()
				})
			});

			if (response.ok) {
				await loadCashBoxes();
				showOpenForm = false;
				selectedCashBoxId = '';
				openingAmount = 0;
			} else {
				const error = await response.json();
				errorMessage = error.message || 'Error al abrir la caja';
			}
		} catch (error) {
			console.error('Error opening cash box:', error);
			errorMessage = 'Error al abrir la caja';
		}
	}

	// Función para cerrar caja
	async function closeCashBox(cashBoxId: string) {
		try {
			const currentAmount = computeCurrentAmount(cashBoxId);
			if (currentAmount < 0) {
				const confirmed = confirm(`⚠️ ADVERTENCIA: La caja tiene un saldo negativo de S/. ${Math.abs(currentAmount).toFixed(2)}. ¿Está seguro de cerrar la caja con este saldo?`);
				if (!confirmed) return;
			}

			const response = await fetch(`/api/cash-boxes/${cashBoxId}/close`, {
				method: 'POST'
			});

			if (response.ok) {
				await loadCashBoxes();
			} else {
				const error = await response.json();
				errorMessage = error.message || 'Error al cerrar la caja';
			}
		} catch (error) {
			console.error('Error closing cash box:', error);
			errorMessage = 'Error al cerrar la caja';
		}
	}

	// Función para reabrir caja
	async function reopenCashBox(cashBox: CashBox) {
		try {
			const response = await fetch(`/api/cash-boxes/${cashBox.id}/reopen`, {
				method: 'POST'
			});

			if (response.ok) {
				await loadCashBoxes();
				showReopenConfirmation = false;
				cashBoxToReopen = null;
			} else {
				const error = await response.json();
				errorMessage = error.message || 'Error al reabrir la caja';
			}
		} catch (error) {
			console.error('Error reopening cash box:', error);
			errorMessage = 'Error al reabrir la caja';
		}
	}

	// Función para crear operación
	async function createOperation() {
		try {
			const cashBoxForDate = getCashBoxForDate(currentDate);
			if (!cashBoxForDate) {
				errorMessage = 'No hay caja abierta para esta fecha';
				return;
			}

			if (cashBoxForDate.status !== 'open' && cashBoxForDate.status !== 'reopened') {
				errorMessage = 'La caja no está abierta';
				return;
			}

			const operationData = {
				...newOperation,
				cashBoxId: cashBoxForDate.id,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};

			const response = await fetch('/api/operations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(operationData)
			});

			if (response.ok) {
				await loadOperationsForDate(currentDate, false);
				showOperationsModal = false;
				// Reset form
				newOperation = {
					type: 'income',
					amount: 0,
					description: '',
					operationDetailId: '',
					responsiblePersonId: '',
					standId: '',
					companyId: '',
					image: null
				};
			} else {
				const error = await response.json();
				errorMessage = error.message || 'Error al crear la operación';
			}
		} catch (error) {
			console.error('Error creating operation:', error);
			errorMessage = 'Error al crear la operación';
		}
	}

	// Función para manejar cambio de filas por página
	function handleRowsPerPageChange(value: number) {
		rowsPerPage = value;
		loadOperationsForDate(currentDate, false);
	}

	// Inicialización
	onMount(async () => {
		console.log('🚀 Component mounted, starting data loading...');
		console.log('📅 Current date:', currentDate);
		
		try {
			// Cargar datos secuencialmente para debug
			console.log('1️⃣ Loading cash boxes...');
			await loadCashBoxes();
			
			console.log('2️⃣ Loading operations...');
			await loadOperationsForDate(currentDate, false);
			
			console.log('3️⃣ Loading select data...');
			await loadSelectData();
			
			console.log('📊 Final state - cashBoxes count:', cashBoxes.length);
			console.log('📊 Final state - operations count:', operationsArray.length);
			console.log('📊 Final state - cashBoxForDate:', cashBoxForDate ? cashBoxForDate.name : 'null');
			
			updateNavigationState();
			isLoading = false;
			console.log('✅ Data loading completed - isLoading set to false');
			console.log('🔍 Final isLoading state:', isLoading);
		} catch (error) {
			console.error('💥 Error in onMount:', error);
			isLoading = false; // Asegurar que se quite el loading incluso si hay error
		}
	});

	// Obtener caja para la fecha actual
	let cashBoxForDate = $derived(getCashBoxForDate(currentDate));
	
	// Obtener array de operaciones (manejar tanto array directo como objeto con operations)
	let operationsArray = $derived(Array.isArray(operations) ? operations : operations.operations || []);
</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">Gestión de Cajas</h1>
			<p class="mt-2 text-gray-600">Administra las cajas registradoras y sus operaciones</p>
		</div>

		<!-- Navegación de fechas -->
		<div class="mb-6">
			<DateNavigation
				{currentDate}
				{canNavigateBack}
				{canNavigateForward}
				onDateChange={navigateDate}
				onToday={goToToday}
			/>
		</div>

		<!-- Mensaje de error -->
		{#if errorMessage}
			<div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
				<div class="flex">
					<svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span class="text-sm text-red-700">{errorMessage}</span>
				</div>
			</div>
		{/if}

		<!-- Debug info -->
		<!--
		<div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
			<h4 class="font-semibold text-yellow-800">Debug Info:</h4>
			<p class="text-sm text-yellow-700">isLoading: {isLoading}</p>
			<p class="text-sm text-yellow-700">cashBoxes.length: {cashBoxes.length}</p>
			<p class="text-sm text-yellow-700">operations.length: {operationsArray.length}</p>
			<p class="text-sm text-yellow-700">cashBoxForDate: {cashBoxForDate ? cashBoxForDate.name : 'null'}</p>
			<p class="text-sm text-yellow-700">currentDate: {currentDate.toISOString()}</p>
		</div>
		-->
		<!-- Loading state -->
		{#if isLoading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		{:else}
			<div class="space-y-8">
				<!-- Tarjeta de caja -->
				{#if cashBoxForDate}
					<CashBoxCard
						cashBox={cashBoxForDate}
						currentAmount={computeCurrentAmount(cashBoxForDate.id)}
						onClose={closeCashBox}
						onReopen={(cb) => {
							cashBoxToReopen = cb;
							showReopenConfirmation = true;
						}}
						onOpen={showOpenCashBoxModal}
					/>
				{:else}
					<!-- No hay caja para esta fecha -->
					<div class="bg-white border-2 border-dashed border-gray-300 rounded-[20px] p-8 text-center">
						<div class="flex flex-col items-center gap-4">
							<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
							</svg>
							<div>
								<h3 class="text-lg font-medium text-gray-900">No hay caja abierta</h3>
								<p class="text-gray-500">No se encontró una caja para la fecha seleccionada</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Tabla de operaciones -->
				<OperationsTable
					operations={operationsArray}
					{rowsPerPage}
					onRowsPerPageChange={handleRowsPerPageChange}
					onAddOperation={() => showOperationsModal = true}
				/>
			</div>
		{/if}
	</div>

	<!-- Modal de apertura de caja -->
	{#if showOpenForm}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-lg shadow-xl max-w-md w-full">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-semibold text-gray-900">Abrir Caja</h3>
				</div>
				<div class="px-6 py-4">
					<div class="space-y-4">
						<div>
							<label for="openingAmount" class="block text-sm font-medium text-gray-700 mb-2">
								Monto Inicial
							</label>
							<input
								id="openingAmount"
								type="number"
								step="0.01"
								min="0"
								bind:value={openingAmount}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="0.00"
							/>
						</div>
					</div>
				</div>
				<div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
					<button
						onclick={() => {
							showOpenForm = false;
							selectedCashBoxId = '';
							openingAmount = 0;
						}}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						Cancelar
					</button>
					<button
						onclick={openCashBox}
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						Abrir Caja
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Modal de operaciones -->
	<OperationModal
		isOpen={showOperationsModal}
		onClose={() => showOperationsModal = false}
		onSubmit={createOperation}
		{operationDetails}
		{responsiblePersons}
		{stands}
		{companies}
	/>

	<!-- Modal de confirmación de reapertura -->
	<ReopenConfirmationModal
		isOpen={showReopenConfirmation}
		cashBox={cashBoxToReopen}
		onConfirm={reopenCashBox}
		onCancel={() => {
			showReopenConfirmation = false;
			cashBoxToReopen = null;
		}}
	/>
</div>