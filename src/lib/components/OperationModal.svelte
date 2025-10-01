<script lang="ts">
	import type { Operation } from '$lib/services/operations-service';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onSubmit: (operation: Partial<Operation>) => void;
		operationDetails: any[];
		responsiblePersons: any[];
		stands: any[];
		companies: any[];
	}

	let { 
		isOpen, 
		onClose, 
		onSubmit, 
		operationDetails, 
		responsiblePersons, 
		stands, 
		companies 
	}: Props = $props();

	// Estado del formulario
	let formData = $state({
		type: 'income' as 'income' | 'expense',
		amount: 0,
		description: '',
		operationDetailId: '',
		responsiblePersonId: '',
		standId: '',
		companyId: '',
		image: null as File | null
	});

	let errorMessage = $state('');
	let isSubmitting = $state(false);

	// Función para resetear el formulario
	function resetForm() {
		formData = {
			type: 'income',
			amount: 0,
			description: '',
			operationDetailId: '',
			responsiblePersonId: '',
			standId: '',
			companyId: '',
			image: null
		};
		errorMessage = '';
	}

	// Función para manejar el cierre del modal
	function handleClose() {
		resetForm();
		onClose();
	}

	// Función para manejar el envío del formulario
	async function handleSubmit() {
		errorMessage = '';
		
		// Validaciones
		if (!formData.operationDetailId) {
			errorMessage = 'Debe seleccionar un detalle de operación';
			return;
		}
		if (!formData.responsiblePersonId) {
			errorMessage = 'Debe seleccionar una persona responsable';
			return;
		}
		if (!formData.standId) {
			errorMessage = 'Debe seleccionar un stand';
			return;
		}
		if (!formData.companyId) {
			errorMessage = 'Debe seleccionar una empresa';
			return;
		}
		if (formData.amount <= 0) {
			errorMessage = 'El monto debe ser mayor a 0';
			return;
		}
		if (!formData.description.trim()) {
			errorMessage = 'Debe ingresar una descripción';
			return;
		}

		isSubmitting = true;
		
		try {
			await onSubmit(formData);
			handleClose();
		} catch (error) {
			errorMessage = 'Error al crear la operación';
		} finally {
			isSubmitting = false;
		}
	}

	// Función para manejar el cambio de imagen
	function handleImageChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			formData.image = target.files[0];
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<!-- Header del modal -->
			<div class="px-6 py-4 border-b border-gray-200">
				<div class="flex justify-between items-center">
					<h3 class="text-lg font-semibold text-gray-900">Agregar Operación</h3>
					<button
						onclick={handleClose}
						class="text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="Cerrar modal"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Contenido del modal -->
			<div class="px-6 py-4">
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
					<!-- Tipo de operación -->
					<fieldset>
						<legend class="block text-sm font-medium text-gray-700 mb-2">Tipo de Operación</legend>
						<div class="flex gap-4">
							<label class="flex items-center">
								<input
									type="radio"
									bind:group={formData.type}
									value="income"
									class="mr-2 text-green-600 focus:ring-green-500"
								/>
								<span class="text-sm text-gray-700">Ingreso</span>
							</label>
							<label class="flex items-center">
								<input
									type="radio"
									bind:group={formData.type}
									value="expense"
									class="mr-2 text-red-600 focus:ring-red-500"
								/>
								<span class="text-sm text-gray-700">Egreso</span>
							</label>
						</div>
					</fieldset>

					<!-- Monto y Descripción -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="amount" class="block text-sm font-medium text-gray-700 mb-2">Monto</label>
							<input
								id="amount"
								type="number"
								step="0.01"
								min="0"
								bind:value={formData.amount}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="0.00"
								required
							/>
						</div>
						<div>
							<label for="description" class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
							<input
								id="description"
								type="text"
								bind:value={formData.description}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="Descripción de la operación"
								required
							/>
						</div>
					</div>

					<!-- Detalle de operación y Persona responsable -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="operationDetail" class="block text-sm font-medium text-gray-700 mb-2">Detalle de Operación</label>
							<select
								id="operationDetail"
								bind:value={formData.operationDetailId}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								required
							>
								<option value="">Seleccionar detalle</option>
								{#each operationDetails as detail}
									<option value={detail.id}>{detail.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="responsiblePerson" class="block text-sm font-medium text-gray-700 mb-2">Persona Responsable</label>
							<select
								id="responsiblePerson"
								bind:value={formData.responsiblePersonId}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								required
							>
								<option value="">Seleccionar persona</option>
								{#each responsiblePersons as person}
									<option value={person.id}>{person.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Stand y Empresa -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="stand" class="block text-sm font-medium text-gray-700 mb-2">Stand</label>
							<select
								id="stand"
								bind:value={formData.standId}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								required
							>
								<option value="">Seleccionar stand</option>
								{#each stands as stand}
									<option value={stand.id}>{stand.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="company" class="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
							<select
								id="company"
								bind:value={formData.companyId}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								required
							>
								<option value="">Seleccionar empresa</option>
								{#each companies as company}
									<option value={company.id}>{company.razonSocial}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Imagen (opcional) -->
					<div>
						<label for="image" class="block text-sm font-medium text-gray-700 mb-2">Imagen (Opcional)</label>
						<input
							id="image"
							type="file"
							accept="image/*"
							onchange={handleImageChange}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
						{#if formData.image}
							<div class="mt-2 text-sm text-gray-600">
								Archivo seleccionado: {(formData.image as File).name}
							</div>
						{/if}
					</div>

					<!-- Mensaje de error -->
					{#if errorMessage}
						<div class="bg-red-50 border border-red-200 rounded-md p-3">
							<div class="flex">
								<svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<span class="text-sm text-red-700">{errorMessage}</span>
							</div>
						</div>
					{/if}

					<!-- Botones de acción -->
					<div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
						<button
							type="button"
							onclick={handleClose}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							class="px-4 py-2 text-sm font-medium text-white bg-[#17a34b] border border-transparent rounded-md hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? 'Creando...' : 'Crear Operación'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
