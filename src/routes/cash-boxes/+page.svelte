<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { 
		CashBoxCard, 
		OperationsTable, 
		OperationModal, 
		DateNavigation, 
		CashBoxActions,
		ReopenConfirmationModal,
		ConfirmationModal
	} from '$lib/components';
	import PendingBalanceModal from '$lib/components/PendingBalanceModal.svelte';
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
	let currentOpenCashBox = $state<CashBox | null>(null);
	
	// Estados para historial y navegación
	let currentDate = $state(new Date());
	let canNavigateBack = $state(true);
	let canNavigateForward = $state(false);
	
	// Estados para modales
	let showOperationsModal = $state(false);
	let showReopenConfirmation = $state(false);
	let cashBoxToReopen = $state<CashBox | null>(null);
	let reopenType = $state<'default' | 'update-balance'>('default');
	let reopenNote = $state('');
	let showPendingBalanceModal = $state(false);
	let pendingBalance = $state<any>(null);
	
	// Estados para CRUD de operaciones
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedOperation = $state<Operation | null>(null);
	let operationToDelete = $state<Operation | null>(null);
	let successMessage = $state('');
	
	// Estados para tabla
	let rowsPerPage = $state(5);
	let currentPage = $state(1);
	
	// Estados para formulario de operación (ahora manejado por OperationModal)

	// Datos de catálogos
	let operationDetails = $state<any[]>([]);
	let responsiblePersons = $state<any[]>([]);
	let stands = $state<any[]>([]);
	let companies = $state<any[]>([]);

	// Función para obtener TODAS las operaciones de una caja (sin límite de paginación)
	async function getAllOperationsForCashBox(cashBoxId: string, date: Date): Promise<any[]> {
		try {
			const dateStr = toPeruDateString(date);
			const response = await fetch(`/api/operations?date=${dateStr}&cashBoxId=${cashBoxId}&limit=1000`); // Límite alto para obtener todas
			
			if (response.ok) {
				const data = await response.json();
				return Array.isArray(data) ? data : data.operations || [];
			}
			return [];
		} catch (error) {
			console.error('Error loading all operations for cash box:', error);
			return [];
		}
	}

	// Función para calcular saldo derivado (solo suma de operaciones)
	async function computeCurrentAmount(cashBoxId: string): Promise<number> {
		const cashBox = cashBoxes.find(cb => cb.id === cashBoxId);
		if (!cashBox) return 0;
		
		// Usar las operaciones ya cargadas en el estado
		const operationsForBox = operations.filter(op => op.cashBoxId === cashBoxId);
		const total = operationsForBox.reduce((acc, op) => {
			return acc + (op.type === 'income' ? op.amount : -op.amount);
		}, 0);
		
		// NO sumar openingAmount - ya está incluido en las operaciones de apertura
		return total;
	}

	// Caja para la fecha actual (derivado del estado)
	let cashBoxForDate = $derived((() => {
		const targetDate = toPeruDateString(currentDate);
		
		// Buscar en las cajas cargadas desde la API
		const existingBox = cashBoxes.find(cb => cb.businessDate === targetDate);
		
		// Si existe en la API, usarla
		if (existingBox) {
			return existingBox;
		}
		
		// Si no existe, retornar una caja vacía por defecto (sin necesidad de backend)
		return {
			id: `temp-${targetDate}`,
			name: `Caja ${targetDate}`,
			status: 'empty' as const,
			openingAmount: 0,
			openedAt: null,
			closedAt: null,
			reopenedAt: null,
			businessDate: targetDate,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
	})());

	// Helper para convertir fecha a string en zona horaria de Perú (YYYY-MM-DD)
	function toPeruDateString(date: Date): string {
		return date.toLocaleDateString('en-CA', { 
			timeZone: 'America/Lima' 
		});
	}

	// Función para actualizar estado de navegación
	function updateNavigationState() {
		const today = new Date();
		const todayStr = toPeruDateString(today);
		const currentDateStr = toPeruDateString(currentDate);
		
		// Siempre se puede navegar hacia atrás (hasta que no haya más datos)
		canNavigateBack = true;
		
		// Solo se puede navegar hacia adelante si la fecha actual es menor que hoy
		canNavigateForward = currentDateStr < todayStr;
	}

	// Función para navegar a una fecha
	async function navigateDate(date: Date) {
		currentDate = date;
		updateNavigationState();
		
		// Asegurar que existe la caja para la nueva fecha
		await loadCashBoxes();
		
		await loadOperationsForDate(date);
		updateCurrentOpenCashBox();
		// Actualizar el monto actual cuando cambie la fecha
		await updateCurrentAmount();
	}

	// Función para ir a hoy
	async function goToToday() {
		const today = new Date();
		await navigateDate(today);
	}

	// Función para actualizar caja abierta actual
	function updateCurrentOpenCashBox() {
		currentOpenCashBox = cashBoxForDate;
	}

	// Función para cargar operaciones para una fecha
	async function loadOperationsForDate(date: Date, showLoading: boolean = true) {
		if (showLoading) isLoading = true;
		
		try {
			const dateStr = toPeruDateString(date);
			console.log('🔍 loadOperationsForDate - Requesting operations for date:', dateStr);
			const response = await fetch(`/api/operations?date=${dateStr}`);
			
			if (response.ok) {
				const data = await response.json();
				operations = Array.isArray(data) ? data : (data.operations || []);
				console.log('🔄 OPERACIONES CARGADAS:', {
					total: data.total || operations.length,
					operations: operations.map((op: any) => ({ id: op.id, description: op.description, amount: op.amount }))
				});
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

	// Función para cargar cajas desde la API
	async function loadCashBoxes() {
		try {
			const response = await fetch('/api/cash-boxes');
			
			if (response.ok) {
				const data = await response.json();
				cashBoxes = data;
				console.log(`📦 Cajas cargadas desde API (${cashBoxes.length}):`, cashBoxes);
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
		try {			
			const [detailsRes, personsRes, standsRes, companiesRes] = await Promise.all([
				fetch('/api/catalogs/operation-details'),
				fetch('/api/catalogs/responsible-persons'),
				fetch('/api/catalogs/stands'),
				fetch('/api/companies') // Usar el endpoint real de empresas
			]);

			// Detalles de operación
			if (detailsRes.ok) {
				operationDetails = await detailsRes.json();
			} else {
				console.error('❌ Failed to load operation details:', detailsRes.status, detailsRes.statusText);
			}

			// Responsables
			if (personsRes.ok) {
				responsiblePersons = await personsRes.json();
			} else {
				console.error('❌ Failed to load responsible persons:', personsRes.status, personsRes.statusText);
			}

			// Stands
			if (standsRes.ok) {
				stands = await standsRes.json();
			} else {
				console.error('❌ Failed to load stands:', standsRes.status, standsRes.statusText);
			}

			// Empresas
			if (companiesRes.ok) {
				const companiesData = await companiesRes.json();				
				// Mapear los datos de empresas del formato real al formato esperado
				companies = companiesData.map((company: any) => {
					return {
						id: company.id,
						name: company.razonSocial || company.name,
						ruc: company.ruc,
						address: company.address || '',
						phone: company.phone || '',
						email: company.email || ''
					};
				});
			} else {
				console.error('❌ Failed to load companies:', companiesRes.status, companiesRes.statusText);
			}
		} catch (error) {
			console.error('💥 Error loading select data:', error);
		}
	}

	// Función para mostrar modal de apertura de caja
	function showOpenCashBoxModal(cashBoxId: string) {
		openingAmount = 0;
		showOpenForm = true;
	}

	// Función para abrir caja
	async function openCashBox() {
		if (openingAmount < 0) return;
		if (!cashBoxForDate) {
			errorMessage = 'Error: No se encontró la caja para la fecha actual';
			return;
		}

		try {
			// Verificar si hay saldo pendiente antes de abrir
			const currentDateStr = toPeruDateString(currentDate);
			console.log('🔍 Buscando saldos pendientes. Cajas actuales:', cashBoxes);
			
			// Buscar manualmente en las cajas cargadas
			const closedBoxesWithPending = cashBoxes.filter(cb => {
				const isClosed = cb.status === 'closed';
				const isBeforeCurrentDate = cb.businessDate < currentDateStr;
				
				console.log(`   Revisando ${cb.name}:`, {
					status: cb.status,
					businessDate: cb.businessDate,
					isClosed,
					isBeforeCurrentDate
				});
				
				return isClosed && isBeforeCurrentDate;
			});
			
			console.log('📋 Cajas cerradas anteriores:', closedBoxesWithPending);
			
			if (closedBoxesWithPending.length > 0) {
				const sortedBoxes = closedBoxesWithPending.sort((a, b) => 
					new Date(b.businessDate).getTime() - new Date(a.businessDate).getTime()
				);
				
				const latestClosedBox = sortedBoxes[0];
				console.log('🧮 Caja cerrada más reciente:', latestClosedBox);
				
		const pendingResponse = await fetch('/api/cash-boxes/pending', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ date: currentDateStr })
		});
		if (!pendingResponse.ok) {
			console.error('❌ Error consultando saldo pendiente:', await pendingResponse.text());
		} else {
			const { pending } = await pendingResponse.json();
			console.log('📊 Resultado getPendingBalance:', pending);
			if (pending && pending.status === 'pending') {
				pendingBalance = pending;
				showPendingBalanceModal = true;
				console.log('⚠️ Mostrando modal de saldo pendiente');
				return;
			}
		}
			}

			// Si no hay saldo pendiente, continuar con apertura normal
			// Si es una caja temporal (no existe en backend), crearla primero
			if (cashBoxForDate.id.startsWith('temp-')) {
				await createAndOpenCashBox();
			} else {
				// Si ya existe, solo abrirla
				await openCashBoxDirectly(cashBoxForDate.id);
			}
		} catch (error) {
			console.error('Error opening cash box:', error);
			errorMessage = 'Error al abrir la caja';
		}
	}

	// Función para crear y abrir una caja nueva
	async function createAndOpenCashBox() {
		try {
			const targetDate = toPeruDateString(currentDate);
			console.log('📦 createAndOpenCashBox - targetDate:', targetDate);
			console.log('📦 createAndOpenCashBox - openingAmount:', openingAmount);
			
			// Crear la caja en el backend
			const createResponse = await fetch('/api/cash-boxes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					name: `Caja ${targetDate}`,
					businessDate: targetDate
				})
			});

			console.log('📦 createAndOpenCashBox - createResponse status:', createResponse.status);

			if (!createResponse.ok) {
				errorMessage = 'Error al crear la caja';
				console.error('❌ Error al crear caja:', await createResponse.text());
				return;
			}

			const newCashBox = await createResponse.json();
			console.log('✅ Caja creada:', newCashBox);
			
			// Recargar cajas para obtener la nueva
			await loadCashBoxes();
			
			// Abrir la caja recién creada
			console.log('📦 Abriendo caja con ID:', newCashBox.id);
			await openCashBoxDirectly(newCashBox.id);
		} catch (error) {
			console.error('💥 Error creating and opening cash box:', error);
			errorMessage = 'Error al crear la caja';
		}
	}

	// Función para abrir caja directamente (sin verificar saldos pendientes)
	async function openCashBoxDirectly(cashBoxId: string) {
		try {
			console.log('🔓 openCashBoxDirectly - cashBoxId:', cashBoxId);
			console.log('🔓 openCashBoxDirectly - openingAmount:', openingAmount);
			
			// Obtener el openingAmount actual
			const currentCashBox = cashBoxes.find(cb => cb.id === cashBoxId);
			const actualOpeningAmount = currentCashBox?.openingAmount || openingAmount;
			
			console.log('🔓 openCashBoxDirectly - actualOpeningAmount:', actualOpeningAmount);
			
			const response = await fetch(`/api/cash-boxes/${cashBoxId}/open`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					openingAmount: actualOpeningAmount,
					openedAt: new Date().toISOString()
				})
			});

			console.log('🔓 openCashBoxDirectly - response status:', response.status);

			if (response.ok) {
				console.log('✅ Caja abierta exitosamente');
				await loadCashBoxes();
				await loadOperationsForDate(currentDate);
				await updateCurrentAmount();
				showOpenForm = false;
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
			// Usar el monto actual ya calculado
			if (currentAmount < 0) {
				const confirmed = confirm(`⚠️ ADVERTENCIA: La caja tiene un saldo negativo de S/. ${Math.abs(currentAmount).toFixed(2)}. ¿Está seguro de cerrar la caja con este saldo?`);
				if (!confirmed) return;
			}

			const response = await fetch(`/api/cash-boxes/${cashBoxId}/close`, {
				method: 'POST'
			});

			if (response.ok) {
				await loadCashBoxes();
				// Actualizar el monto actual después de cerrar la caja
				await updateCurrentAmount();
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
				// Actualizar el monto actual después de reabrir la caja
				await updateCurrentAmount();
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
	async function createOperation(operationData: any) {
		try {
			if (!cashBoxForDate) {
				errorMessage = 'No hay caja abierta para esta fecha';
				return;
			}

			if (cashBoxForDate.status !== 'open' && cashBoxForDate.status !== 'reopened') {
				errorMessage = 'La caja debe estar abierta o reaperturada';
				return;
			}

			const finalOperationData = {
				...operationData,
				cashBoxId: cashBoxForDate.id,
				reopenBatchId: cashBoxForDate.status === 'reopened' ? cashBoxForDate.reopenedAt : undefined,
				isReopenOperation: cashBoxForDate.status === 'reopened',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			const response = await fetch('/api/operations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(finalOperationData)
			});

			if (response.ok) {
				await loadOperationsForDate(currentDate, false);
				// Actualizar el monto actual después de crear la operación
				await updateCurrentAmount();
				showOperationsModal = false;
			} else {
				const error = await response.json();
				errorMessage = error.message || 'Error al crear la operación';
				console.error('❌ Error creating operation:', error);
			}
		} catch (error) {
			console.error('💥 Error creating operation:', error);
			errorMessage = 'Error al crear la operación';
		}
	}

	// Función para manejar cambio de filas por página
	function handleRowsPerPageChange(value: number) {
		rowsPerPage = value;
		currentPage = 1; // Reset a la primera página
		loadOperationsForDate(currentDate, false);
	}

	// Función para manejar cambio de página
	function handlePageChange(page: number) {
		currentPage = page;
		// No necesitamos recargar datos, solo cambiar la vista
	}

	// Funciones CRUD para operaciones
	function handleEditOperation(operation: Operation) {
		selectedOperation = operation;
		showEditModal = true;
	}

	function handleDeleteOperation(operation: Operation) {
		operationToDelete = operation;
		showDeleteModal = true;
	}

	async function confirmDelete() {
		if (!operationToDelete) return;

		try {
			const response = await fetch(`/api/operations/${operationToDelete.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				successMessage = 'Operación eliminada exitosamente';
				await loadOperationsForDate(currentDate, false);
				await updateCurrentAmount();
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

	async function handleOperationSuccess(operationData: any) {
		try {
			if (selectedOperation) {
				// Modo edición
				const response = await fetch(`/api/operations?id=${selectedOperation.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(operationData)
				});

				if (response.ok) {
					successMessage = 'Operación actualizada exitosamente';
				} else {
					const errorData = await response.json();
					errorMessage = errorData.error || 'Error al actualizar la operación';
					return;
				}
			} else {
				// Modo creación
				await createOperation(operationData);
				successMessage = 'Operación creada exitosamente';
			}

			showOperationsModal = false;
			showEditModal = false;
			selectedOperation = null;
			await loadOperationsForDate(currentDate, false);
			await updateCurrentAmount();
		} catch (error) {
			console.error('Error saving operation:', error);
			errorMessage = 'Error de red al guardar la operación';
		}
	}

	function clearMessages() {
		errorMessage = '';
		successMessage = '';
	}

	// Inicialización
	onMount(async () => {
		
		try {
			// Cargar datos secuencialmente para debug
			await loadCashBoxes();
			
			await loadOperationsForDate(currentDate, false);
			
			await loadSelectData();
			
			updateNavigationState();
			
			// Actualizar el monto actual de la caja
			await updateCurrentAmount();
			
			isLoading = false;

		} catch (error) {
			isLoading = false; // Asegurar que se quite el loading incluso si hay error
		}
	});

	// operations ya es un Operation[] directamente
	
	// Variable para el monto actual de la caja
	let currentAmount = $state(0);
	
	// Función para actualizar el monto actual de la caja
	async function updateCurrentAmount() {
		if (cashBoxForDate) {
			currentAmount = await computeCurrentAmount(cashBoxForDate.id);
			console.log('💰 CURRENT AMOUNT UPDATED:', currentAmount);
		}
	}
	
// Función para manejar solicitud de reapertura/actualización de balance
function handleReopenRequest(cashBox: CashBox, type: 'default' | 'update-balance') {
	cashBoxToReopen = cashBox;
	reopenType = type;
	reopenNote = '';
	showReopenConfirmation = true;
}

	// Función para manejar la confirmación del saldo pendiente
	async function handlePendingBalanceConfirm(event: any) {
		const { action, notes, pendingBalanceId } = event;
		
		if (!cashBoxForDate) {
			errorMessage = 'Error: No se encontró la caja para la fecha actual';
			return;
		}

		try {
			console.log('🎯 handlePendingBalanceConfirm - action:', action);
			console.log('🎯 handlePendingBalanceConfirm - cashBoxForDate.id:', cashBoxForDate.id);
			
			// Si la caja es temporal, primero crearla en el backend
			let actualCashBoxId = cashBoxForDate.id;
	if (cashBoxForDate.id.startsWith('temp-')) {
				console.log('📦 Creando caja en backend antes de transferir...');
				const targetDate = toPeruDateString(currentDate);
				const createResponse = await fetch('/api/cash-boxes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						name: `Caja ${targetDate}`,
						businessDate: targetDate
					})
				});
				
				if (!createResponse.ok) {
					errorMessage = 'Error al crear la caja';
					return;
				}
				
				const newCashBox = await createResponse.json();
				actualCashBoxId = newCashBox.id;
				console.log('✅ Caja creada con ID:', actualCashBoxId);
				
				// Recargar cajas para tener la nueva
				await loadCashBoxes();
			}
			
		let actionResponse: Response;
		if (action === 'transfer') {
			console.log('💸 Transfiriendo saldo pendiente a caja:', actualCashBoxId);
			actionResponse = await fetch('/api/cash-boxes/pending/action', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'transfer',
					pendingBalanceId,
					currentCashBoxId: actualCashBoxId,
					notes
				})
			});
		} else if (action === 'return') {
			actionResponse = await fetch('/api/cash-boxes/pending/action', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'return',
					pendingBalanceId,
					notes
				})
			});
		} else {
			actionResponse = await fetch('/api/cash-boxes/pending/action', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'handle',
					pendingBalanceId,
					notes
				})
			});
		}

		if (!actionResponse.ok) {
			const errorData = await actionResponse.json().catch(() => ({ error: 'Error al procesar el saldo pendiente' }));
			console.error('❌ Error al procesar saldo pendiente:', errorData.error);
			errorMessage = errorData.error || 'Error al procesar el saldo pendiente';
			return;
		}

		const resultData = await actionResponse.json();
		console.log('✅ Acción de saldo pendiente completada:', resultData);

		// Abrir la caja si corresponde (transfer siempre debería abrir con el monto transferido)
		await openCashBoxDirectly(actualCashBoxId);

			// 🔄 Recargar datos — esto ya dispara la reactividad
			await loadCashBoxes();
			await loadOperationsForDate(currentDate);
			await updateCurrentAmount();

			showPendingBalanceModal = false;
			pendingBalance = null;
		} catch (error) {
			console.error('💥 Error handling pending balance:', error);
			errorMessage = 'Error al procesar el saldo pendiente';
		}
	}

	// Función para cerrar el modal de saldo pendiente
	function handlePendingBalanceClose() {
		showPendingBalanceModal = false;
		pendingBalance = null;
		// Cerrar también el modal de apertura de caja
		showOpenForm = false;
		openingAmount = 0;
	}

	async function reopenCashBoxConfirm(event: { cashBox: CashBox; reopenType: 'default' | 'update-balance'; allocationNote?: string }) {
		const { cashBox, reopenType: type, allocationNote } = event;
		if (!cashBox) return;

		try {
			const response = await fetch(`/api/cash-boxes/${cashBox.id}/reopen`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ allocationNote, reopenType: type })
			});

			if (!response.ok) {
				const error = await response.json();
				errorMessage = error.error || 'Error al reaperturar la caja';
				return;
			}

			await loadCashBoxes();
			await loadOperationsForDate(currentDate);
			await updateCurrentAmount();

			showReopenConfirmation = false;
			cashBoxToReopen = null;
		} catch (error) {
			console.error('Error al reaperturar caja:', error);
			errorMessage = 'Error al reaperturar la caja';
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Gestión de Cajas</h1>
					<p class="mt-2 text-gray-600">Administra las cajas registradoras y sus operaciones</p>
				</div>
				
				<!-- Navegación de fechas -->
				<div class="flex-shrink-0">
					<DateNavigation
						{currentDate}
						{canNavigateBack}
						{canNavigateForward}
						onDateChange={navigateDate}
						onToday={goToToday}
					/>
				</div>
			</div>
		</div>

		<!-- Mensajes de feedback -->
		{#if errorMessage}
			<div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
				<div class="flex">
					<svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span class="text-sm text-red-700">{errorMessage}</span>
					<button onclick={clearMessages} class="ml-auto text-red-400 hover:text-red-600" aria-label="Cerrar mensaje de error">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		{/if}
		{#if successMessage}
			<div class="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
				<div class="flex">
					<svg class="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span class="text-sm text-green-700">{successMessage}</span>
					<button onclick={clearMessages} class="ml-auto text-green-400 hover:text-green-600" aria-label="Cerrar mensaje de éxito">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		{/if}

		<!-- Debug info -->
		 <!-- 
		<div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
			<h4 class="font-semibold text-yellow-800">Debug Info:</h4>
			<p class="text-sm text-yellow-700">isLoading: {isLoading}</p>
			<p class="text-sm text-yellow-700">cashBoxes.length: {cashBoxes.length}</p>
			<p class="text-sm text-yellow-700">operations.length: {operations.length}</p>
			<p class="text-sm text-yellow-700">cashBoxForDate: {cashBoxForDate ? cashBoxForDate.name : 'null'}</p>
			<p class="text-sm text-yellow-700">currentDate: {currentDate.toISOString()}</p>
			<p class="text-sm text-yellow-700">targetDate: {toPeruDateString(currentDate)}</p>
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
			currentAmount={currentAmount}
			onClose={closeCashBox}
			onReopen={(cb) => handleReopenRequest(cb, 'default')}
			onOpen={showOpenCashBoxModal}
			onUpdateBalance={(cb) => handleReopenRequest(cb, 'update-balance')}
		/>
				{/if}

				<!-- Tabla de operaciones -->
				<OperationsTable
					operations={operations}
					{rowsPerPage}
					onRowsPerPageChange={handleRowsPerPageChange}
					onAddOperation={() => showOperationsModal = true}
					{currentPage}
					onPageChange={handlePageChange}
					showPagination={true}
					onEditOperation={handleEditOperation}
					onDeleteOperation={handleDeleteOperation}
					showActions={true}
					{companies}
					{operationDetails}
					{responsiblePersons}
					{stands}
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
		reopenType={reopenType}
		onConfirm={reopenCashBoxConfirm}
		onCancel={() => {
			showReopenConfirmation = false;
			cashBoxToReopen = null;
		}}
	/>

	<!-- Modal de saldo pendiente -->
	<PendingBalanceModal
		isOpen={showPendingBalanceModal}
		pendingBalance={pendingBalance}
		onClose={handlePendingBalanceClose}
		onConfirm={handlePendingBalanceConfirm}
	/>

	<!-- Modal de edición de operación -->
	{#if showEditModal && selectedOperation}
		<OperationModal
			isOpen={showEditModal}
			onClose={() => {
				showEditModal = false;
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
</div>