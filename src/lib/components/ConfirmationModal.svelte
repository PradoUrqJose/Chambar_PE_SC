<script lang="ts">
	interface Props {
		isOpen: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		isSubmitting?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		isOpen,
		title,
		message,
		confirmText = 'Confirmar',
		cancelText = 'Cancelar',
		isSubmitting = false,
		onConfirm,
		onCancel
	}: Props = $props();
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-sm w-full">
			<!-- Header del modal -->
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
			</div>

			<!-- Contenido del modal -->
			<div class="p-6">
				<p class="text-sm text-gray-700">{message}</p>
			</div>

			<!-- Footer del modal -->
			<div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
				<button
					onclick={onCancel}
					disabled={isSubmitting}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
				>
					{cancelText}
				</button>
				<button
					onclick={onConfirm}
					disabled={isSubmitting}
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
				>
					{#if isSubmitting}
						<svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Eliminando...
					{:else}
						{confirmText}
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
