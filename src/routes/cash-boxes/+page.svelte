<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	
	let isLoading = $state(true);
	let cashBoxes = $state<any[]>([]);
	let errorMessage = $state('');
	let showOpenForm = $state(false);
	let openingAmount = $state(0);
	let selectedCashBoxId = $state('');
	let currentOpenCashBox = $state<any>(null);
	
	// Nuevas variables para historial y navegación
	let currentDate = $state(new Date());
	let operations = $state<any[]>([]);
	let operationsLoading = $state(false);
	let showOperationsModal = $state(false);
	let showDatePicker = $state(false);
	let showReopenConfirmation = $state(false);
	let cashBoxToReopen = $state<any>(null);
	let rowsPerPage = $state(10);
	let totalOperations = $state(0);
	let canNavigateBack = $state(false);
	let canNavigateForward = $state(false);

	// Variables para el modal de operaciones completo
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

	// Cargar operaciones del día actual
	async function loadOperationsForDate(date: Date, showLoading: boolean = true) {
		try {
			if (showLoading) {
				operationsLoading = true;
			}
			// Usar fecha local sin conversión a UTC
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const dateStr = `${year}-${month}-${day}`;
			
			const response = await fetch(`/api/operations?date=${dateStr}&limit=${rowsPerPage}`);
			if (response.ok) {
				const data = await response.json();
				operations = data.operations || [];
				totalOperations = data.total || 0;
				console.log('Operaciones cargadas:', operations.length);
			}
		} catch (error) {
			console.error('Error loading operations:', error);
			operations = [];
		} finally {
			if (showLoading) {
				operationsLoading = false;
			}
		}
	}

	// Cargar cajas
	async function loadCashBoxes() {
		try {
			isLoading = true;
			const response = await fetch('/api/cash-boxes');
			if (response.ok) {
				cashBoxes = await response.json();
				// Buscar caja para la fecha actual
				const cashBoxForDate = getCashBoxForDate(currentDate);
				currentOpenCashBox = cashBoxForDate && cashBoxForDate.status === 'open' ? cashBoxForDate : null;
			}
		} catch (error) {
			errorMessage = 'Error al cargar las cajas';
			console.error('Error loading cash boxes:', error);
		} finally {
			isLoading = false;
		}
	}

	// Obtener caja para una fecha específica (simplificado)
	function getCashBoxForDate(date: Date) {
		const targetDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
		return cashBoxes.find(cb => {
			// Verificar si la caja tiene operaciones para esta fecha
			if (cb.openedAt) {
				const openedDate = new Date(cb.openedAt).toISOString().split('T')[0];
				return openedDate === targetDate;
			}
			return false;
		});
	}

	// Obtener caja cerrada para la fecha actual
	function getClosedCashBoxForDate(date: Date) {
		const targetDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
		return cashBoxes.find(cb => {
			if (cb.status !== 'closed' || !cb.closedAt) return false;
			const closedDate = new Date(cb.closedAt).toISOString().split('T')[0];
			return closedDate === targetDate;
		});
	}

	// Obtener caja vacía para la fecha actual (estado 'vacio')
	function getEmptyCashBoxForDate(date: Date) {
		const targetDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
		return cashBoxes.find(cb => {
			if (cb.estado !== 'vacio') return false;
			// Si no tiene openedAt, es una caja vacía
			if (!cb.openedAt) return true;
			// Si tiene openedAt pero es de otra fecha, también es vacía para esta fecha
			const openedDate = new Date(cb.openedAt).toISOString().split('T')[0];
			return openedDate !== targetDate;
		});
	}

	// Variable reactiva para la caja de la fecha actual
	let cashBoxForDate = $derived(getCashBoxForDate(currentDate));

	// Navegación de fechas
	function navigateDate(direction: 'prev' | 'next') {
		const newDate = new Date(currentDate);
		if (direction === 'prev') {
			newDate.setDate(newDate.getDate() - 1);
		} else {
			newDate.setDate(newDate.getDate() + 1);
		}
		
		// Verificar límites antes de navegar
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const newDateNormalized = new Date(newDate);
		newDateNormalized.setHours(0, 0, 0, 0);
		
		// No permitir navegar más allá del día actual
		if (newDateNormalized.getTime() > today.getTime()) {
			return;
		}
		
		// No permitir navegar antes de 2023
		if (newDateNormalized.getTime() < new Date('2023-01-01').getTime()) {
			return;
		}
		
		currentDate = newDate;
		loadOperationsForDate(currentDate);
		updateNavigationState();
	}

	// Actualizar estado de navegación
	function updateNavigationState() {
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Normalizar a inicio del día
		const current = new Date(currentDate);
		current.setHours(0, 0, 0, 0); // Normalizar a inicio del día
		
		// Siempre permitir navegar hacia atrás (hasta un límite razonable)
		canNavigateBack = current.getTime() > new Date('2023-01-01').getTime();
		
		// Solo permitir navegar hacia adelante si no estamos en el día actual
		canNavigateForward = current.getTime() < today.getTime();
	}

	// Formatear fecha para mostrar
	function formatDate(date: Date): string {
		return date.toLocaleDateString('es-ES', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Mostrar modal de apertura (sin validación de caja única)
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

			// Si hay monto positivo, pedir confirmación
			if (openingAmount > 0) {
				const confirmed = confirm(`¿Está seguro de abrir la caja con S/. ${openingAmount.toFixed(2)}? Este monto se agregará al saldo actual.`);
				if (!confirmed) return;
			}

			const response = await fetch(`/api/cash-boxes/${selectedCashBoxId}/open`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ 
					openingAmount,
					openedAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).toISOString()
				})
			});

			if (response.ok) {
				showOpenForm = false;
				await loadCashBoxes(); // Recargar cajas
				await loadOperationsForDate(currentDate); // Recargar operaciones
				errorMessage = ''; // Limpiar errores
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
			// Buscar la caja para verificar el monto
			const cashBox = cashBoxes.find(cb => cb.id === cashBoxId);
			if (cashBox && cashBox.currentAmount < 0) {
				const confirmed = confirm(`⚠️ ADVERTENCIA: La caja tiene un saldo negativo de S/. ${Math.abs(cashBox.currentAmount).toFixed(2)}. ¿Está seguro de cerrar la caja con este saldo?`);
				if (!confirmed) return;
			}

			const response = await fetch(`/api/cash-boxes/${cashBoxId}/close`, {
				method: 'POST'
			});

			if (response.ok) {
				await loadCashBoxes(); // Recargar cajas
				await loadOperationsForDate(currentDate); // Recargar operaciones
				errorMessage = ''; // Limpiar errores
			} else {
				const error = await response.json();
				errorMessage = error.message || 'Error al cerrar la caja';
			}
		} catch (error) {
			errorMessage = 'Error al cerrar la caja';
			console.error('Error closing cash box:', error);
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

	// Crear operación (versión completa)
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

			if (!currentOpenCashBox) {
				errorMessage = 'No hay caja abierta';
				return;
			}

			// Asignar caja abierta y fecha correcta
			newOperation.cashBoxId = currentOpenCashBox.id;
			
			// Usar la fecha actual seleccionada, no la fecha de hoy
			const operationData = {
				...newOperation,
				createdAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).toISOString(),
				updatedAt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).toISOString()
			};

			const response = await fetch('/api/operations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(operationData)
			});

			if (response.ok) {
				// Cerrar modal
				showOperationsModal = false;
				
				// Resetear formulario
				resetForm();
				
				// Recargar datos
				await loadCashBoxes();
				await loadOperationsForDate(currentDate);
				errorMessage = '';
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

	// Reabrir caja cerrada
	async function reopenCashBox() {
		try {
			if (!cashBoxToReopen) return;

			const response = await fetch(`/api/cash-boxes/${cashBoxToReopen.id}/reopen`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					reopenedAt: new Date().toISOString()
				})
			});

			if (response.ok) {
				// Guardar el ID antes de limpiar la variable
				const cashBoxId = cashBoxToReopen.id;
				
				showReopenConfirmation = false;
				cashBoxToReopen = null;
				
				// Actualizar la caja específica a estado 'reaperturado'
				const cashBox = cashBoxes.find(cb => cb.id === cashBoxId);
				if (cashBox) {
					cashBox.status = 'open';
					cashBox.estado = 'reaperturado';
					// Mantener la fecha original si existe, sino usar la fecha de cierre
					if (!cashBox.originalOpenedAt) {
						cashBox.originalOpenedAt = cashBox.openedAt || new Date().toISOString();
					}
					cashBox.openedAt = new Date().toISOString(); // Fecha de reapertura
					cashBox.reopenedAt = new Date().toISOString();
					cashBox.closedAt = null;
				}
				
				// Recargar cajas para obtener el estado actualizado
				await loadCashBoxes();
				await loadOperationsForDate(currentDate);
				errorMessage = '';
			} else {
				const error = await response.json();
				errorMessage = error.message || 'Error al reabrir la caja';
			}
		} catch (error) {
			errorMessage = 'Error al reabrir la caja';
			console.error('Error reopening cash box:', error);
		}
	}

	onMount(() => {
		loadCashBoxes();
		loadOperationsForDate(currentDate);
		loadSelectData();
		updateNavigationState();
		
		// Recargar operaciones cada 3 segundos para detectar cambios
		const interval = setInterval(() => {
			loadOperationsForDate(currentDate, false);
		}, 3000);
		
		// Cleanup del interval
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Caja - Chambar</title>
</svelte:head>

<!-- Título principal -->
<div class="mb-8 pt-4">
	<h1 class="text-3xl font-bold text-gray-900">Gestión de Caja</h1>
</div>

<div class="mx-auto">
	<!-- Layout principal: 70% caja + 30% historial -->
	<div class="mb-8 grid grid-cols-10 gap-6">
		<!-- Módulo de caja (70%) -->
		<div class="col-span-7">
			{#if getClosedCashBoxForDate(currentDate)}
				<!-- Caja cerrada para la fecha actual -->
				{@const closedCashBox = getClosedCashBoxForDate(currentDate)}
				<div class="flex justify-between items-center bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-5 shadow-lg h-full" style="box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
					<!-- Lado Izquierdo -->
					<div class="flex flex-col gap-1.5 items-start">
						<div class="flex items-start gap-2.5">
							<span class="items-center bg-[#ef4444] text-white text-base font-bold rounded-lg px-2.5 py-1.5">$</span>
							<span class="text-3xl font-bold text-[#222] items-start">{closedCashBox.name}</span>
							<span class="text-xs font-bold text-[#dc2626] bg-[#fecaca] px-2.5 py-1 rounded-full">Cerrada</span>
						</div>
						<div class="text-xs text-[#555]">
							<span class="rounded-lg px-5 py-1.5"> </span>
							Cerrada: {new Date(closedCashBox.closedAt).toLocaleDateString('es-ES', { 
								day: '2-digit', 
								month: '2-digit', 
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							})}
						</div>
					</div>

					<!-- Lado Derecho -->
					<div class="flex flex-col items-end gap-5">
						<div class="text-[44px] font-extrabold text-[#111827]">
							S/. {closedCashBox.currentAmount.toFixed(2)}
						</div>
						<button
							onclick={() => {
								cashBoxToReopen = closedCashBox;
								showReopenConfirmation = true;
							}}
							class="bg-[#3b82f6] text-white border-none rounded-[10px] px-[18px] py-2.5 text-[15px] font-semibold cursor-pointer flex items-center gap-1.5 transition-all duration-200 hover:bg-[#2563eb] hover:scale-105"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
							</svg>
							Actualizar Balance
						</button>
					</div>
				</div>
			{:else if cashBoxForDate && cashBoxForDate.status === 'open'}
				<!-- Caja abierta o reabierta -->
				<div class="flex justify-between items-center 
					{cashBoxForDate.estado === 'reaperturado' 
						? 'bg-[#fef3c7] border-[#fde68a]' 
						: 'bg-[#e9fdf2] border-[#c8f3db]'
					} border rounded-2xl p-5 shadow-lg h-full" style="box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
					<!-- Lado Izquierdo -->
					<div class="flex flex-col gap-1.5 items-start">
						<div class="flex items-start gap-2.5">
							<span class="items-center 
								{cashBoxForDate.estado === 'reaperturado' 
									? 'bg-[#f59e0b]' 
									: 'bg-[#22c55e]'
								} text-white text-base font-bold rounded-lg px-2.5 py-1.5">$</span>
							<span class="text-3xl font-bold text-[#222] items-start">{cashBoxForDate.name}</span>
							<span class="text-xs font-bold 
								{cashBoxForDate.estado === 'reaperturado' 
									? 'text-[#b45309] bg-[#fef3c7]' 
									: 'text-[#166534] bg-[#bbf7d0]'
								} px-2.5 py-1 rounded-full">
								{cashBoxForDate.estado === 'reaperturado' ? 'Reapertura' : 'Abierto'}
							</span>
						</div>
						<div class="text-xs text-[#555]">
							<span class="rounded-lg px-5 py-1.5"> </span>
							{cashBoxForDate.estado === 'reaperturado' 
								? `Reabierta: ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
								: `Última actualización: ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
							}
						</div>
					</div>

					<!-- Lado Derecho -->
					<div class="flex flex-col items-end gap-5">
						<div class="text-[44px] font-extrabold text-[#111827]">
							S/. {cashBoxForDate.currentAmount.toFixed(2)}
						</div>
						<button
							onclick={() => closeCashBox(cashBoxForDate.id)}
							class="bg-[#ef4444] text-white border-none rounded-[10px] px-[18px] py-2.5 text-[15px] font-semibold cursor-pointer flex items-center gap-1.5 transition-all duration-200 hover:bg-[#dc2626] hover:scale-105"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
							</svg>
							Cerrar Caja
						</button>
					</div>
				</div>
			{:else if getEmptyCashBoxForDate(currentDate)}
				<!-- Caja vacía para la fecha actual -->
				{@const emptyCashBox = getEmptyCashBoxForDate(currentDate)}
				<div class="flex justify-between items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-5 shadow-lg h-full" style="box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
					<!-- Lado Izquierdo -->
					<div class="flex flex-col gap-1.5 items-start">
						<div class="flex items-start gap-2.5">
							<span class="items-center bg-[#6b7280] text-white text-base font-bold rounded-lg px-2.5 py-1.5">$</span>
							<span class="text-3xl font-bold text-[#222] items-start">{emptyCashBox.name}</span>
							<span class="text-xs font-bold text-[#6b7280] bg-[#e5e7eb] px-2.5 py-1 rounded-full">Vacía</span>
						</div>
						<div class="text-xs text-[#555]">
							<span class="rounded-lg px-5 py-1.5"> </span>
							Sin operaciones para esta fecha
						</div>
					</div>

					<!-- Lado Derecho -->
					<div class="flex flex-col items-end gap-5">
						<div class="text-[44px] font-extrabold text-[#111827]">
							S/. {emptyCashBox.currentAmount.toFixed(2)}
						</div>
						<button
							onclick={() => showOpenCashBoxModal(emptyCashBox.id)}
							class="bg-[#6b7280] text-white border-none rounded-[10px] px-[18px] py-2.5 text-[15px] font-semibold cursor-pointer flex items-center gap-1.5 transition-all duration-200 hover:bg-[#4b5563] hover:scale-105"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
							</svg>
							Abrir Caja
						</button>
					</div>
				</div>
			{:else}
				<!-- Estado sin caja abierta - Diseño de 2 columnas -->
				<div class="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-lg h-full">
					<div class="grid grid-cols-2 gap-6 h-full">
						<!-- Columna izquierda - Información -->
						<div class="flex items-start space-x-4">
							<!-- Icono -->
							<div class="flex w-16 h-16 bg-gray-200 rounded-full items-center justify-center">
								<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z">
									</path>
								</svg>
							</div>
						
							<!-- Texto -->
							<div>
								<h3 class="text-xl font-semibold text-gray-900 mb-2">No hay caja abierta</h3>
								<p class="text-gray-600">Solo se puede abrir una caja a la vez. Abre una caja para comenzar a registrar operaciones.</p>
							</div>
						</div>
						
						
						<!-- Columna derecha - Acción -->
						<div class="flex flex-col justify-center items-center">
							<button
								onclick={() => showOpenCashBoxModal('1')}
								class="bg-[#17a34b] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 shadow-lg hover:shadow-xl transition-all duration-200 w-full max-w-xs"
							>
								<div class="flex items-center justify-center space-x-3">
									<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
									</svg>
									<span class="text-lg">Abrir Caja</span>
								</div>
							</button>
							<p class="text-sm text-gray-500 mt-3 text-center">Haz clic para abrir una nueva caja y comenzar a trabajar</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Módulo de historial (30%) -->
		<div class="col-span-3">
			<div class="bg-white shadow-lg rounded-xl border border-gray-100 h-full">
				<div class="px-6 py-5 border-b border-gray-100">
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
							</svg>
						</div>
						<h3 class="text-lg font-semibold text-gray-900">Historial</h3>
					</div>
				</div>
				
				<!-- Navegación de fechas -->
				<div class="px-6 py-4">
					<div class="flex items-center justify-center space-x-3">
						<button
							onclick={() => navigateDate('prev')}
							disabled={!canNavigateBack}
							class="p-2 rounded-lg {canNavigateBack ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-300 cursor-not-allowed'} transition-colors duration-200"
							title={canNavigateBack ? 'Día anterior' : 'No hay días anteriores disponibles'}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
							</svg>
						</button>
						
						<button
							onclick={() => showDatePicker = true}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 shadow-sm"
						>
							{formatDate(currentDate)}
						</button>
						
						<button
							onclick={() => navigateDate('next')}
							disabled={!canNavigateForward}
							class="p-2 rounded-lg {canNavigateForward ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-300 cursor-not-allowed'} transition-colors duration-200"
							title={canNavigateForward ? 'Día siguiente' : 'No hay días siguientes disponibles'}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
							</svg>
						</button>
					</div>
				</div>
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
			<span class="ml-2 text-gray-600">Cargando cajas...</span>
		</div>
	{:else}


		<!-- Tabla de operaciones mejorada -->
		<div class="bg-white shadow-lg rounded-xl border border-gray-100">
			<div class="px-6 py-5 border-b border-gray-100">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
							</svg>
						</div>
						<h3 class="text-lg font-semibold text-gray-900">Operaciones del Día</h3>
						<button
						onclick={() => showOperationsModal = true}
						class="bg-[#17a34b] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-200"
					>
						<div class="flex items-center space-x-1.5">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
							</svg>
							<span>Agregar Operación</span>
						</div>
					</button>
					</div>
					<div class="flex items-center space-x-2">
						<button
							onclick={() => loadOperationsForDate(currentDate)}
							class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
							title="Recargar operaciones"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
							</svg>
						</button>
						<label for="rowsPerPage" class="text-sm font-medium text-gray-700">Mostrar:</label>
						<select
							id="rowsPerPage"
							bind:value={rowsPerPage}
							onchange={() => loadOperationsForDate(currentDate)}
							class="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-500 bg-white shadow-sm"
						>
							<option value="5">5</option>
							<option value="10">10</option>
							<option value="20">20</option>
							<option value="30">30</option>
							<option value="50">50</option>
						</select>
					</div>
				</div>
			</div>
			
			{#if operationsLoading}
				<div class="flex items-center justify-center py-12">
					<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
					<span class="ml-2 text-gray-600">Cargando operaciones...</span>
				</div>
			{:else if operations.length === 0}
				<div class="px-6 py-16 text-center">
					<div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
						<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
						</svg>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">No hay operaciones</h3>
					<p class="text-gray-500 mb-4">No se encontraron operaciones para esta fecha</p>
					<button
						onclick={() => showOperationsModal = true}
						class="inline-flex items-center px-4 py-2 bg-[#17a34b] text-white text-sm font-medium rounded-lg hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 transition-colors duration-200"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
						</svg>
						Crear primera operación
					</button>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-100">
						<thead class="bg-blue-50 border-b-2 border-blue-200">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider border-r border-blue-200">Tipo</th>
								<th class="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider border-r border-blue-200">Descripción</th>
								<th class="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider border-r border-blue-200">Monto</th>
								<th class="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider border-r border-blue-200">Fecha</th>
								<th class="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Hora</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each operations as operation}
								<tr class="hover:bg-gray-50 transition-colors duration-150">
									<td class="px-4 py-2 whitespace-nowrap border-r border-gray-200">
										<div class="flex items-center">
											<div class="w-8 h-8 rounded-lg flex items-center justify-center
												{operation.type === 'income' ? 'bg-green-100' : 'bg-red-100'}"
											>
												<svg class="w-4 h-4 {operation.type === 'income' ? 'text-green-600' : 'text-red-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													{#if operation.type === 'income'}
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
													{:else}
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
													{/if}
												</svg>
											</div>
											<span class="ml-2 text-sm font-semibold text-gray-900">
												{operation.type === 'income' ? 'Ingreso' : 'Egreso'}
											</span>
										</div>
									</td>
									<td class="px-4 py-2 border-r border-gray-200">
										<div class="text-sm text-gray-900 font-medium">{operation.description}</div>
									</td>
									<td class="px-4 py-2 whitespace-nowrap border-r border-gray-200">
										<span class="text-base font-bold {operation.type === 'income' ? 'text-green-600' : 'text-red-600'}">
											{operation.type === 'income' ? '+' : '-'} S/. {operation.amount.toFixed(2)}
										</span>
									</td>
									<td class="px-4 py-2 whitespace-nowrap border-r border-gray-200">
										<div class="text-sm text-gray-600 font-medium">
											{new Date(operation.createdAt).toLocaleDateString('es-ES', { 
												day: '2-digit', 
												month: '2-digit', 
												year: 'numeric' 
											})}
										</div>
									</td>
									<td class="px-4 py-2 whitespace-nowrap">
										<div class="text-sm text-gray-500">
											{new Date(operation.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Modal de selección de fecha -->
	{#if showDatePicker}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 w-96">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Seleccionar Fecha</h3>
				
				<div class="mb-4">
					<label for="dateInput" class="block text-sm font-medium text-gray-700 mb-2">
						Fecha
					</label>
					<input
						id="dateInput"
						type="date"
						value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`}
						onchange={(e: any) => {
							currentDate = new Date(e.target.value);
							loadOperationsForDate(currentDate);
							updateNavigationState();
						}}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
					/>
				</div>

				<div class="flex justify-end space-x-3">
					<button
						onclick={() => showDatePicker = false}
						class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
					>
						Cerrar
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Modal de operaciones completo -->
	{#if showOperationsModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<!-- Header del modal -->
				<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
					<div class="flex items-center justify-between">
						<h3 class="text-xl font-semibold text-gray-900">Nueva Operación</h3>
						<button
							onclick={() => {
								showOperationsModal = false;
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
								showOperationsModal = false;
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

	<!-- Modal de confirmación de reapertura -->
	{#if showReopenConfirmation}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 w-96">
				<div class="flex items-center mb-4">
					<div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
						<svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-900">¿Está seguro?</h3>
				</div>
				
				<div class="mb-6">
					<p class="text-gray-700 mb-2">
						Está a punto de <strong>reabrir la caja "{cashBoxToReopen?.name || 'N/A'}"</strong> que fue cerrada el 
						{new Date(cashBoxToReopen?.closedAt || new Date()).toLocaleDateString('es-ES', { 
							day: '2-digit', 
							month: '2-digit', 
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						})}.
					</p>
					<p class="text-sm text-gray-600">
						Esto le permitirá agregar o editar operaciones para esa fecha. 
						La reapertura será registrada con la hora actual.
					</p>
				</div>

				<div class="flex justify-end space-x-3">
					<button
						onclick={() => {
							showReopenConfirmation = false;
							cashBoxToReopen = null;
						}}
						class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
					>
						Cancelar
					</button>
					<button
						onclick={reopenCashBox}
						class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
					>
						Reabrir Caja
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
						class="px-4 py-2 bg-[#17a34b] text-white rounded-md hover:bg-[#15803d]"
					>
						Abrir Caja
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

