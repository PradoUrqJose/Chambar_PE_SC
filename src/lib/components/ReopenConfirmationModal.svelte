<script lang="ts">
	import type { CashBox } from '$lib/services/cash-boxes-service';

	interface Props {
		isOpen: boolean;
		cashBox: CashBox | null;
		reopenType?: 'default' | 'update-balance';
		showPreventReopenWarning?: boolean;
		onConfirm: (event: { cashBox: CashBox; reopenType: 'default' | 'update-balance'; allocationNote?: string }) => void;
		onCancel: () => void;
	}

	let { 
		isOpen, 
		cashBox, 
		reopenType = 'default',
		showPreventReopenWarning = true,
		onConfirm, 
		onCancel 
	}: Props = $props();

	let allocationNote = $state('');

	// Función para formatear fecha en zona horaria de Perú
	function formatDateTimePeru(dateStr: string): string {
		return new Date(dateStr).toLocaleString('es-PE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'America/Lima'
		});
	}

	function handleConfirm() {
		if (cashBox) {
			onConfirm({ cashBox, reopenType, allocationNote });
		}
	}
</script>

{#if isOpen && cashBox}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-lg w-full">
			<!-- Header del modal -->
			<div class="px-6 py-4 border-b border-gray-200">
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0">
						<svg class="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">{reopenType === 'update-balance' ? 'Actualizar Balance de Caja Cerrada' : 'Confirmar Reapertura'}</h3>
						<p class="text-sm text-gray-600">
							{#if reopenType === 'update-balance'}
								Para registrar nuevos movimientos en esta caja cerrada necesitamos cambiarla a estado "Reaperturada". Esto permitirá crear operaciones posteriores y las etiquetaremos con un distintivo de reapertura.
							{:else}
								¿Está seguro de reabrir esta caja?
							{/if}
						</p>
					</div>
				</div>
			</div>

			<!-- Contenido del modal -->
			<div class="px-6 py-5 space-y-6">
				<!-- Información de la caja -->
				<div class="bg-gray-50 rounded-lg p-4 space-y-2">
					<div class="flex justify-between">
						<span class="text-sm font-medium text-gray-700">Caja:</span>
						<span class="text-sm text-gray-900">{cashBox.name}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-sm font-medium text-gray-700">Estado actual:</span>
						<span class="text-sm text-gray-900 capitalize">{cashBox.status}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-sm font-medium text-gray-700">Cerrada el:</span>
						<span class="text-sm text-gray-900">{formatDateTimePeru(cashBox.closedAt || '')}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-sm font-medium text-gray-700">Saldo actual:</span>
						<span class="text-sm text-gray-900">S/. {cashBox.openingAmount.toFixed(2)}</span>
					</div>
				</div>

				<!-- Advertencia principal -->
				{#if showPreventReopenWarning}
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
					<svg class="w-5 h-5 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="space-y-1">
						<h4 class="text-sm font-medium text-yellow-800">Precaución</h4>
						<p class="text-sm text-yellow-700">
							Reaperturar permitirá generar nuevas operaciones sobre esta caja cerrada. Estas operaciones se guardarán con un distintivo de "reapertura" para mantener el historial contable.
						</p>
					</div>
				</div>
				{/if}

				<!-- Campo de nota para reasignación -->
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700" for="allocation-note">Notas o comentarios</label>
					<textarea
						id="allocation-note"
						bind:value={allocationNote}
						rows="3"
						class="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
						placeholder="Detalle el motivo de la reapertura o instrucciones para el equipo contable..."
					></textarea>
					<p class="text-xs text-gray-500">
						Esta nota se almacenará junto con la caja reaperturada para futuras auditorías.
					</p>
				</div>
			</div>

			<!-- Botones de acción -->
			<div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
				<button
					onclick={onCancel}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Cancelar
				</button>
				<button
					onclick={handleConfirm}
					class="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
				>
					{reopenType === 'update-balance' ? 'Permitir actualizaciones' : 'Confirmar Reapertura'}
				</button>
			</div>
		</div>
	</div>
{/if}
