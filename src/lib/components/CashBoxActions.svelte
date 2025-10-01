<script lang="ts">
	import type { CashBox } from '$lib/services/cash-boxes-service';

interface Props {
	cashBox: CashBox | null;
	onOpen: (id: string) => void;
	onClose: (id: string) => void;
	onReopen: (cashBox: CashBox) => void;
	onUpdateBalance: (cashBox: CashBox) => void;
	onAddOperation: () => void;
}

let { cashBox, onOpen, onClose, onReopen, onUpdateBalance, onAddOperation }: Props = $props();

	// Función para determinar qué acciones mostrar
	function getActions() {
		if (!cashBox) return [];

		switch (cashBox.status) {
			case 'open':
			case 'reopened':
				return [
					{
						id: 'close',
						label: 'Cerrar Caja',
						icon: 'close',
						action: () => onClose(cashBox.id),
						className: 'bg-[#ef4444] hover:bg-[#dc2626] text-white'
					},
					{
						id: 'add-operation',
						label: 'Agregar Operación',
						icon: 'add',
						action: onAddOperation,
						className: 'bg-[#17a34b] hover:bg-[#15803d] text-white'
					}
				];
			case 'closed':
				return [
					{
						id: 'update-balance',
						label: 'Actualizar Balance',
						icon: 'refresh',
						action: () => onUpdateBalance(cashBox),
						className: 'bg-blue-600 hover:bg-blue-700 text-white'
					},
					{
						id: 'reopen',
						label: 'Reabrir Caja',
						icon: 'open',
						action: () => onReopen(cashBox),
						className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
					}
				];
			case 'empty':
				return [
					{
						id: 'open',
						label: 'Abrir Caja',
						icon: 'open',
						action: () => onOpen(cashBox.id),
						className: 'bg-[#6b7280] hover:bg-[#4b5563] text-white'
					}
				];
			default:
				return [];
		}
	}

	// Función para obtener el icono SVG
	function getIcon(iconName: string) {
		switch (iconName) {
			case 'close':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`;
			case 'add':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />`;
			case 'refresh':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />`;
			case 'open':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />`;
			default:
				return '';
		}
	}

	let actions = $derived(getActions());
</script>

{#if cashBox && actions.length > 0}
	<div class="flex gap-3 justify-end">
		{#each actions as action}
			<button
				onclick={action.action}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2 {action.className}"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{@html getIcon(action.icon)}
				</svg>
				{action.label}
			</button>
		{/each}
	</div>
{/if}
