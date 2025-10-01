<script lang="ts">
	import type { PendingBalance } from '$lib/db/mock-data';

	// Props
	export let pendingBalance: PendingBalance | null = null;
	export let isOpen: boolean = false;
	export let onClose: () => void = () => {};
	export let onConfirm: (event: any) => void = () => {};

	// Estado del formulario
	let selectedAction: 'transfer' | 'return' | 'handle' | null = null;
	let notes: string = '';
	let isSubmitting: boolean = false;

	// Función para cerrar el modal
	function closeModal() {
		onClose();
		resetForm();
	}

	// Función para resetear el formulario
	function resetForm() {
		selectedAction = null;
		notes = '';
		isSubmitting = false;
	}

	// Función para manejar la confirmación
	async function handleConfirm() {
		if (!selectedAction || !pendingBalance) return;

		isSubmitting = true;

		try {
			// Llamar a la función onConfirm con la acción seleccionada
			onConfirm({
				action: selectedAction,
				notes: notes.trim() || undefined,
				pendingBalanceId: pendingBalance.id
			});

			// Cerrar modal después de un breve delay
			setTimeout(() => {
				closeModal();
			}, 500);
		} catch (error) {
			console.error('Error al procesar saldo pendiente:', error);
		} finally {
			isSubmitting = false;
		}
	}

	// Función para formatear fecha
	function formatDate(dateString: string): string {
		// Crear fecha en zona horaria de Perú para evitar problemas de conversión
		const date = new Date(dateString + 'T00:00:00-05:00'); // UTC-5 (Perú)
		return date.toLocaleDateString('es-PE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			timeZone: 'America/Lima'
		});
	}

	// Función para calcular días transcurridos
	function getDaysSince(dateString: string): number {
		// Crear fecha en zona horaria de Perú para evitar problemas de conversión
		const pendingDate = new Date(dateString + 'T00:00:00-05:00'); // UTC-5 (Perú)
		
		// Obtener fecha actual en zona horaria de Perú
		const now = new Date();
		const peruNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
		
		// Establecer ambas fechas a medianoche para comparación exacta
		const pendingMidnight = new Date(pendingDate);
		pendingMidnight.setHours(0, 0, 0, 0);
		
		const todayMidnight = new Date(peruNow);
		todayMidnight.setHours(0, 0, 0, 0);
		
		// Calcular diferencia en días
		const diffTime = todayMidnight.getTime() - pendingMidnight.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		
		return Math.max(0, diffDays); // No permitir días negativos
	}
</script>

{#if isOpen && pendingBalance}
	<!-- Modal backdrop -->
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
		on:click={closeModal}
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
		role="button"
		tabindex="0"
		aria-label="Cerrar modal"
	>
		<!-- Modal content -->
		<div 
			class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" 
			on:click|stopPropagation
			on:keydown={(e) => e.key === 'Escape' && closeModal()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			tabindex="0"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200">
				<div class="flex items-center space-x-3">
					<div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
						<svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
						</svg>
					</div>
					<div>
						<h3 id="modal-title" class="text-lg font-semibold text-gray-900">Saldo Pendiente Detectado</h3>
						<p class="text-sm text-gray-500">Se requiere acción antes de continuar</p>
					</div>
				</div>
				<button 
					class="text-gray-400 hover:text-gray-600 transition-colors"
					on:click={closeModal}
					disabled={isSubmitting}
					aria-label="Cerrar modal"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-6">
				<!-- Información del saldo pendiente -->
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm font-medium text-yellow-800">Monto Pendiente</span>
						<span class="text-lg font-bold text-yellow-900">S/. {pendingBalance.amount.toFixed(2)}</span>
					</div>
					<div class="text-sm text-yellow-700">
						<p><strong>Fecha:</strong> {formatDate(pendingBalance.date)}</p>
						<p><strong>Días transcurridos:</strong> {getDaysSince(pendingBalance.date)} días</p>
						{#if pendingBalance.notes}
							<p><strong>Notas:</strong> {pendingBalance.notes}</p>
						{/if}
					</div>
				</div>

				<!-- Opciones de acción -->
				<div class="space-y-4">
					<h4 class="text-sm font-medium text-gray-900 mb-3">¿Qué desea hacer con este saldo?</h4>
					
					<!-- Transferir a caja actual -->
					<label class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
						<input 
							type="radio" 
							bind:group={selectedAction} 
							value="transfer"
							class="mt-1 text-blue-600 focus:ring-blue-500"
						>
						<div class="flex-1">
							<div class="flex items-center space-x-2">
								<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
								</svg>
								<span class="font-medium text-gray-900">Transferir a caja actual</span>
							</div>
							<p class="text-sm text-gray-600 mt-1">
								El saldo se agregará al monto inicial de la caja que está abriendo
							</p>
						</div>
					</label>

					<!-- Devolver a tesorería -->
					<label class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
						<input 
							type="radio" 
							bind:group={selectedAction} 
							value="return"
							class="mt-1 text-green-600 focus:ring-green-500"
						>
						<div class="flex-1">
							<div class="flex items-center space-x-2">
								<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
								<span class="font-medium text-gray-900">Devolver a tesorería</span>
							</div>
							<p class="text-sm text-gray-600 mt-1">
								Marcar como devuelto y registrar en el sistema
							</p>
						</div>
					</label>

					<!-- Marcar como manejado -->
					<label class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
						<input 
							type="radio" 
							bind:group={selectedAction} 
							value="handle"
							class="mt-1 text-gray-600 focus:ring-gray-500"
						>
						<div class="flex-1">
							<div class="flex items-center space-x-2">
								<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
								</svg>
								<span class="font-medium text-gray-900">Marcar como manejado</span>
							</div>
							<p class="text-sm text-gray-600 mt-1">
								Registrar que el saldo fue manejado externamente
							</p>
						</div>
					</label>
				</div>

				<!-- Campo de notas -->
				{#if selectedAction}
					<div class="mt-6">
						<label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
							Notas (opcional)
						</label>
						<textarea
							id="notes"
							bind:value={notes}
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							placeholder="Agregar notas sobre el manejo del saldo pendiente..."
						></textarea>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
				<button
					type="button"
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					on:click={closeModal}
					disabled={isSubmitting}
				>
					Cancelar
				</button>
				<button
					type="button"
					class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					on:click={handleConfirm}
					disabled={!selectedAction || isSubmitting}
				>
					{#if isSubmitting}
						<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Procesando...
					{:else}
						Confirmar
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
