<script lang="ts">
	interface Props {
		currentDate: Date;
		canNavigateBack: boolean;
		canNavigateForward: boolean;
		onDateChange: (date: Date) => void;
		onToday: () => void;
	}

	let { currentDate, canNavigateBack, canNavigateForward, onDateChange, onToday }: Props = $props();

	// Función para formatear fecha en zona horaria de Perú
	function formatDatePeru(date: Date): string {
		return date.toLocaleDateString('es-PE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			timeZone: 'America/Lima'
		});
	}

	// Función para navegar a la fecha anterior
	function navigateBack() {
		if (canNavigateBack) {
			const newDate = new Date(currentDate);
			newDate.setDate(newDate.getDate() - 1);
			onDateChange(newDate);
		}
	}

	// Función para navegar a la fecha siguiente
	function navigateForward() {
		if (canNavigateForward) {
			const newDate = new Date(currentDate);
			newDate.setDate(newDate.getDate() + 1);
			onDateChange(newDate);
		}
	}

	// Función para verificar si es hoy
	function isToday(date: Date): boolean {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	}
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
	<div class="flex items-center justify-between">
		<!-- Navegación de fechas -->
		<div class="flex items-center gap-4">
			<button
				onclick={navigateBack}
				disabled={!canNavigateBack}
				class="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				aria-label="Fecha anterior"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>

			<div class="text-center">
				<div class="text-lg font-semibold text-gray-900">
					{formatDatePeru(currentDate)}
				</div>
				{#if isToday(currentDate)}
					<div class="text-sm text-blue-600 font-medium">Hoy</div>
				{/if}
			</div>

			<button
				onclick={navigateForward}
				disabled={!canNavigateForward}
				class="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				aria-label="Fecha siguiente"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>

		<!-- Botón "Hoy" -->
		<button
			onclick={onToday}
			class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium text-sm"
		>
			Hoy
		</button>
	</div>

	<!-- Información de navegación -->
	<div class="mt-3 text-sm text-gray-600 text-center">
		{#if !canNavigateBack && !canNavigateForward}
			<span class="text-gray-500">No hay más fechas disponibles</span>
		{:else if !canNavigateBack}
			<span class="text-gray-500">No puedes navegar hacia atrás desde aquí</span>
		{:else if !canNavigateForward}
			<span class="text-gray-500">No puedes navegar hacia adelante desde aquí</span>
		{:else}
			<span class="text-gray-500">Usa las flechas para navegar entre fechas</span>
		{/if}
	</div>
</div>
