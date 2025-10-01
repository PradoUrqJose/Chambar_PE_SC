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
	let uploadedFiles = $state<File[]>([]);
	let isUploading = $state(false);
	
	// Filtrar detalles de operación según el tipo seleccionado
	let filteredOperationDetails = $derived(
		operationDetails.filter(detail => detail.type === formData.type)
	);
	
	// Función para manejar el cambio de tipo de operación
	function handleTypeChange() {
		// Limpiar el detalle seleccionado cuando cambie el tipo
		formData.operationDetailId = '';
	}

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
		uploadedFiles = [];
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
			// Subir archivos adjuntos si existen
			const attachments = [];
			if (uploadedFiles.length > 0) {
				isUploading = true;
				for (const file of uploadedFiles) {
					const formDataUpload = new FormData();
					formDataUpload.append('file', file);
					formDataUpload.append('folder', 'operations');

					const response = await fetch('/api/upload', {
						method: 'POST',
						body: formDataUpload
					});

					if (response.ok) {
						const data = await response.json();
						attachments.push(data.attachment);
					}
				}
				isUploading = false;
			}

			// Enviar operación con archivos adjuntos
			await onSubmit({
				...formData,
				attachments: attachments.length > 0 ? attachments : undefined
			});
			handleClose();
		} catch (error) {
			errorMessage = 'Error al crear la operación';
		} finally {
			isSubmitting = false;
			isUploading = false;
		}
	}

	// Función para manejar el cambio de archivos
	function handleFilesChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const newFiles = Array.from(target.files);
			uploadedFiles = [...uploadedFiles, ...newFiles];
		}
	}

	// Función para remover un archivo
	function removeFile(index: number) {
		uploadedFiles = uploadedFiles.filter((_, i) => i !== index);
	}

	// Función para formatear tamaño de archivo
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
									onchange={handleTypeChange}
									class="mr-2 text-green-600 focus:ring-green-500"
								/>
								<span class="text-sm text-gray-700">Ingreso</span>
							</label>
							<label class="flex items-center">
								<input
									type="radio"
									bind:group={formData.type}
									value="expense"
									onchange={handleTypeChange}
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
								{#each filteredOperationDetails as detail}
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
									<option value={company.id}>{company.name}</option>
								{/each}
							</select>
						</div>
					</div>

				<!-- Archivos adjuntos (opcional) -->
				<div>
					<label for="attachments" class="block text-sm font-medium text-gray-700 mb-2">
						Archivos Adjuntos (opcional)
						<span class="text-xs text-gray-500 font-normal ml-2">
							Imágenes, PDFs, Excel (Max 10MB c/u)
						</span>
					</label>
					
					<!-- Botón para agregar archivos -->
					<div class="mt-2">
						<label for="attachments" class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
							<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
							</svg>
							<span class="text-sm font-medium text-gray-700">Adjuntar archivos</span>
						</label>
						<input
							id="attachments"
							type="file"
							accept="image/*,.pdf,.xlsx,.xls"
							multiple
							onchange={handleFilesChange}
							class="hidden"
						/>
					</div>

					<!-- Lista de archivos seleccionados -->
					{#if uploadedFiles.length > 0}
						<div class="mt-3 space-y-2">
							<p class="text-sm font-medium text-gray-700">
								Archivos seleccionados ({uploadedFiles.length}):
							</p>
							{#each uploadedFiles as file, index}
								<div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
									<div class="flex items-center gap-3 flex-1 min-w-0">
										<!-- Icono según tipo de archivo -->
										{#if file.type.startsWith('image/')}
											<svg class="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
										{:else if file.type.includes('pdf')}
											<svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
											</svg>
										{:else}
											<svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
										{/if}
										
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium text-gray-900 truncate" title={file.name}>
												{file.name}
											</p>
											<p class="text-xs text-gray-500">
												{formatFileSize(file.size)}
											</p>
										</div>
									</div>
									
									<!-- Botón para eliminar -->
									<button
										type="button"
										onclick={() => removeFile(index)}
										class="ml-3 text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
										aria-label="Eliminar archivo"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</div>
							{/each}
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
						disabled={isSubmitting || isUploading}
						class="px-4 py-2 text-sm font-medium text-white bg-[#17a34b] border border-transparent rounded-md hover:bg-[#15803d] focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{#if isUploading}
							<svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Subiendo archivos...
						{:else if isSubmitting}
							<svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Creando...
						{:else}
							Crear Operación
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
{/if}
