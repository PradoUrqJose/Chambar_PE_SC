<script lang="ts">
	import { onMount } from 'svelte';
	import Pagination from './Pagination.svelte';
	import ConfirmationModal from './ConfirmationModal.svelte';

	// ============================================================================
	// INTERFACES Y TIPOS
	// ============================================================================

	interface CatalogItem {
		id: string;
		[key: string]: any;
	}

	interface Column {
		key: string;
		label: string;
		type?: 'text' | 'badge' | 'email' | 'phone' | 'date' | 'custom';
		badgeConfig?: {
			values: Record<string, { text: string; class: string }>;
		};
		formatter?: (value: any, item: CatalogItem) => string;
		width?: string;
	}

	interface Props {
		// Datos
		items: CatalogItem[];
		columns: Column[];
		title: string;
		
		// Paginación
		itemsPerPage?: number;
		currentPage?: number;
		onPageChange?: (page: number) => void;
		onItemsPerPageChange?: (itemsPerPage: number) => void;
		
		// Acciones
		showActions?: boolean;
		onEdit?: (item: CatalogItem) => void;
		onDelete?: (item: CatalogItem) => void;
		onAdd?: () => void;
		
		// Estados
		isLoading?: boolean;
		errorMessage?: string;
		successMessage?: string;
		
		// Configuración
		emptyMessage?: string;
		showAddButton?: boolean;
		showPagination?: boolean;
	}

	// ============================================================================
	// PROPS Y ESTADO
	// ============================================================================

	let {
		items = [],
		columns = [],
		title = 'Catálogo',
		itemsPerPage = 10,
		currentPage = 1,
		onPageChange = () => {},
		onItemsPerPageChange = () => {},
		showActions = true,
		onEdit = () => {},
		onDelete = () => {},
		onAdd = () => {},
		isLoading = false,
		errorMessage = '',
		successMessage = '',
		emptyMessage = 'No hay elementos para mostrar',
		showAddButton = true,
		showPagination = true
	}: Props = $props();

	// Estado interno
	let showDeleteModal = $state(false);
	let itemToDelete = $state<CatalogItem | null>(null);

	// ============================================================================
	// COMPUTED VALUES
	// ============================================================================

	// Calcular elementos paginados
	let paginatedItems = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		return items.slice(start, end);
	});

	// Calcular total de páginas
	let totalPages = $derived.by(() => Math.ceil(items.length / itemsPerPage));

	// ============================================================================
	// FUNCIONES
	// ============================================================================

	// Manejar eliminación
	function handleDelete(item: CatalogItem) {
		itemToDelete = item;
		showDeleteModal = true;
	}

	// Confirmar eliminación
	function confirmDelete() {
		if (itemToDelete) {
			onDelete(itemToDelete);
			showDeleteModal = false;
			itemToDelete = null;
		}
	}

	// Cancelar eliminación
	function cancelDelete() {
		showDeleteModal = false;
		itemToDelete = null;
	}

	// Formatear valor según tipo de columna
	function formatValue(value: any, column: Column, item: CatalogItem): string {
		if (column.formatter) {
			return column.formatter(value, item);
		}

		switch (column.type) {
			case 'email':
				return value || '';
			case 'phone':
				return value || '';
			case 'date':
				return value ? new Date(value).toLocaleDateString() : '';
			case 'badge':
				if (column.badgeConfig && value) {
					const config = column.badgeConfig.values[value];
					return config ? config.text : value;
				}
				return value || '';
			default:
				return value || '';
		}
	}

	// Obtener clase de badge
	function getBadgeClass(value: any, column: Column): string {
		if (column.type === 'badge' && column.badgeConfig && value) {
			const config = column.badgeConfig.values[value];
			return config ? config.class : 'bg-gray-100 text-gray-800';
		}
		return 'bg-gray-100 text-gray-800';
	}

	// Limpiar mensajes
	function clearMessages() {
		// Esta función se puede llamar desde el componente padre
	}
</script>

<!-- ============================================================================
	COMPONENTE CATALOGTABLE
============================================================================ -->

<div class="bg-white shadow rounded-lg">
	<!-- Header -->
	<div class="px-6 py-4 border-b border-gray-200">
		<div class="flex justify-between items-center">
			<h3 class="text-lg font-medium text-gray-900">{title}</h3>
			{#if showAddButton}
				<button
					onclick={onAdd}
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
					</svg>
					Agregar
				</button>
			{/if}
		</div>
	</div>

	<!-- Mensajes de estado -->
	{#if errorMessage}
		<div class="px-6 py-3 bg-red-50 border-l-4 border-red-400">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-red-700">{errorMessage}</p>
				</div>
			</div>
		</div>
	{/if}

	{#if successMessage}
		<div class="px-6 py-3 bg-green-50 border-l-4 border-green-400">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-green-700">{successMessage}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Loading state -->
	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
			<span class="ml-2 text-gray-600">Cargando...</span>
		</div>
	{:else}
		<!-- Tabla -->
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						{#each columns as column}
							<th 
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								style={column.width ? `width: ${column.width}` : ''}
							>
								{column.label}
							</th>
						{/each}
						{#if showActions}
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Acciones
							</th>
						{/if}
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#if paginatedItems.length === 0}
						<tr>
							<td 
								colspan={showActions ? columns.length + 1 : columns.length}
								class="px-6 py-12 text-center text-sm text-gray-500"
							>
								{emptyMessage}
							</td>
						</tr>
					{:else}
						{#each paginatedItems as item (item.id)}
							<tr class="hover:bg-gray-50">
								{#each columns as column}
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{#if column.type === 'badge'}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getBadgeClass(item[column.key], column)}">
												{formatValue(item[column.key], column, item)}
											</span>
										{:else if column.type === 'email'}
											<a href="mailto:{item[column.key]}" class="text-green-600 hover:text-green-900">
												{formatValue(item[column.key], column, item)}
											</a>
										{:else if column.type === 'phone'}
											<a href="tel:{item[column.key]}" class="text-green-600 hover:text-green-900">
												{formatValue(item[column.key], column, item)}
											</a>
										{:else}
											{formatValue(item[column.key], column, item)}
										{/if}
									</td>
								{/each}
								{#if showActions}
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
										<div class="flex space-x-2">
											<button
												onclick={() => onEdit(item)}
												class="text-green-600 hover:text-green-900"
												aria-label="Editar elemento"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
												</svg>
											</button>
											<button
												onclick={() => handleDelete(item)}
												class="text-red-600 hover:text-red-900"
												aria-label="Eliminar elemento"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
												</svg>
											</button>
										</div>
									</td>
								{/if}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Paginación -->
		{#if showPagination && totalPages > 1}
			<div class="px-6 py-4 border-t border-gray-200">
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					totalItems={items.length}
					itemsPerPage={itemsPerPage}
					onPageChange={onPageChange}
				/>
			</div>
		{/if}
	{/if}
</div>

<!-- Modal de confirmación de eliminación -->
<ConfirmationModal
	isOpen={showDeleteModal}
	title="Confirmar Eliminación"
	message="¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer."
	confirmText="Eliminar"
	cancelText="Cancelar"
	onConfirm={confirmDelete}
	onCancel={cancelDelete}
/>
