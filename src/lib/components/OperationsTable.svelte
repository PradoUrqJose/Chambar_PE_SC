<script lang="ts">
	import type { Operation } from '$lib/services/operations-service';

	interface Props {
		operations: Operation[];
		rowsPerPage: number;
		onRowsPerPageChange: (value: number) => void;
		onAddOperation: () => void;
	}

	let { operations, rowsPerPage, onRowsPerPageChange, onAddOperation }: Props = $props();

	// Función para formatear fecha en zona horaria de Perú
	function formatDatePeru(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('es-PE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			timeZone: 'America/Lima'
		});
	}

	function formatTimePeru(dateStr: string): string {
		return new Date(dateStr).toLocaleTimeString('es-PE', {
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'America/Lima'
		});
	}

	// Opciones para filas por página
	const rowsPerPageOptions = [5, 10, 20, 30, 50];
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200">
	<!-- Header de la tabla -->
	<div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
		<div class="flex justify-between items-center">
			<h3 class="text-lg font-semibold text-gray-900">Operaciones del Día</h3>
			<div class="flex items-center gap-4">
				<!-- Selector de filas por página -->
				<div class="flex items-center gap-2">
					<label for="rowsPerPage" class="text-sm font-medium text-gray-700">Mostrar:</label>
					<select
						id="rowsPerPage"
						bind:value={rowsPerPage}
						onchange={(e) => {
							const target = e.target as HTMLSelectElement;
							onRowsPerPageChange(parseInt(target.value));
						}}
						class="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						{#each rowsPerPageOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</div>
				
				<!-- Botón Agregar Operación -->
				<button
					onclick={onAddOperation}
					class="px-4 py-2 bg-[#17a34b] text-white rounded-lg hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-medium text-sm flex items-center gap-2"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					Agregar Operación
				</button>
			</div>
		</div>
	</div>

	<!-- Tabla de operaciones -->
	<div class="overflow-x-auto">
		<table class="w-full">
			<thead class="bg-gray-50 border-b border-gray-200">
				<tr>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
						Tipo
					</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
						Descripción
					</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
						Monto
					</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
						Fecha
					</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Hora
					</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#if operations.length === 0}
					<tr>
						<td colspan="5" class="px-4 py-8 text-center text-gray-500">
							No hay operaciones para mostrar
						</td>
					</tr>
				{:else}
					{#each operations.slice(0, rowsPerPage) as operation}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 border-r border-gray-200">
								<div class="flex items-center gap-2">
									{#if operation.type === 'income'}
										<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
										</svg>
										<span class="text-green-600 font-medium text-sm">Ingreso</span>
									{:else}
										<svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
										</svg>
										<span class="text-red-600 font-medium text-sm">Egreso</span>
									{/if}
								</div>
							</td>
							<td class="px-4 py-3 border-r border-gray-200">
								<div class="text-sm text-gray-900 max-w-xs truncate" title={operation.description}>
									{operation.description}
								</div>
							</td>
							<td class="px-4 py-3 border-r border-gray-200">
								<div class="text-sm font-medium {operation.type === 'income' ? 'text-green-600' : 'text-red-600'}">
									{operation.type === 'income' ? '+' : '-'}S/. {operation.amount.toFixed(2)}
								</div>
							</td>
							<td class="px-4 py-3 border-r border-gray-200">
								<div class="text-sm text-gray-900">
									{formatDatePeru(operation.createdAt)}
								</div>
							</td>
							<td class="px-4 py-3">
								<div class="text-sm text-gray-500">
									{formatTimePeru(operation.createdAt)}
								</div>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Footer con información de paginación -->
	{#if operations.length > 0}
		<div class="px-6 py-3 bg-gray-50 border-t border-gray-200">
			<div class="flex justify-between items-center text-sm text-gray-700">
				<span>
					Mostrando {Math.min(rowsPerPage, operations.length)} de {operations.length} operaciones
				</span>
				{#if operations.length > rowsPerPage}
					<span class="text-blue-600 font-medium">
						Usa el selector para ver más operaciones
					</span>
				{/if}
			</div>
		</div>
	{/if}
</div>
