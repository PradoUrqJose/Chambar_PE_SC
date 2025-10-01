<script lang="ts">
	import type { CashBox } from '$lib/services/cash-boxes-service';

	interface Props {
		cashBox: CashBox;
		currentAmount: number;
		onClose: (id: string) => void;
		onReopen: (cashBox: CashBox) => void;
		onOpen: (id: string) => void;
		onUpdateBalance?: () => void;
	}

	let { cashBox, currentAmount, onClose, onReopen, onOpen, onUpdateBalance }: Props = $props();

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
</script>

<!-- Caja Cerrada -->
{#if cashBox.status === 'closed'}
	<div class="bg-white border-2 border-[#e5e7eb] rounded-[20px] p-8 shadow-lg">
		<div class="flex justify-between items-start mb-6">
			<div class="flex flex-col gap-2">
				<h2 class="text-[28px] font-bold text-[#111827]">{cashBox.name}</h2>
				<div class="flex items-center gap-2">
					<span class="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
						Cerrada
					</span>
					<span class="text-sm text-gray-500">
						{formatDatePeru(cashBox.closedAt || '')} - {formatTimePeru(cashBox.closedAt || '')}
					</span>
				</div>
			</div>
		</div>

		<div class="flex justify-between items-center">
			<!-- Lado Izquierdo -->
			<div class="flex flex-col gap-2">
				<div class="text-sm text-gray-600">Monto Inicial</div>
				<div class="text-[24px] font-bold text-[#111827]">
					S/. {cashBox.openingAmount.toFixed(2)}
				</div>
			</div>

			<!-- Lado Derecho -->
			<div class="flex flex-col items-end gap-5">
				<div class="text-[44px] font-extrabold text-[#111827]">
					S/. {currentAmount.toFixed(2)}
				</div>
				<button
					onclick={() => onUpdateBalance?.()}
					class="bg-blue-600 text-white border-none rounded-[10px] px-[18px] py-2.5 text-[15px] font-semibold cursor-pointer flex items-center gap-1.5 transition-all duration-200 hover:bg-blue-700 hover:scale-105"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Actualizar Balance
				</button>
			</div>
		</div>
	</div>

<!-- Caja Abierta -->
{:else if cashBox.status === 'open'}
	<div class="bg-white border-2 border-[#e5e7eb] rounded-[20px] p-8 shadow-lg">
		<div class="flex justify-between items-start mb-6">
			<div class="flex flex-col gap-2">
				<h2 class="text-[28px] font-bold text-[#111827]">{cashBox.name}</h2>
				<div class="flex items-center gap-2">
					<span class="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
						Abierta
					</span>
					<span class="text-sm text-gray-500">
						{formatDatePeru(cashBox.openedAt || '')} - {formatTimePeru(cashBox.openedAt || '')}
					</span>
				</div>
			</div>
		</div>

		<div class="flex justify-between items-center">
			<!-- Lado Izquierdo -->
			<div class="flex flex-col gap-2">
				<div class="text-sm text-gray-600">Monto Inicial</div>
				<div class="text-[24px] font-bold text-[#111827]">
					S/. {cashBox.openingAmount.toFixed(2)}
				</div>
			</div>

			<!-- Lado Derecho -->
			<div class="flex flex-col items-end gap-5">
				<div class="text-[44px] font-extrabold text-[#111827]">
					S/. {currentAmount.toFixed(2)}
				</div>
				<button
					onclick={() => onClose(cashBox.id)}
					class="bg-[#ef4444] text-white border-none rounded-[10px] px-[18px] py-2.5 text-[15px] font-semibold cursor-pointer flex items-center gap-1.5 transition-all duration-200 hover:bg-[#dc2626] hover:scale-105"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
					Cerrar Caja
				</button>
			</div>
		</div>
	</div>

<!-- Caja Reaperturada -->
{:else if cashBox.status === 'reopened'}
	<div class="bg-white border-2 border-[#e5e7eb] rounded-[20px] p-8 shadow-lg">
		<div class="flex justify-between items-start mb-6">
			<div class="flex flex-col gap-2">
				<h2 class="text-[28px] font-bold text-[#111827]">{cashBox.name}</h2>
				<div class="flex items-center gap-2">
					<span class="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
						Reapertura
					</span>
					<span class="text-sm text-gray-500">
						{formatDateTimePeru(cashBox.reopenedAt || '')}
					</span>
				</div>
			</div>
		</div>

		<div class="flex justify-between items-center">
			<!-- Lado Izquierdo -->
			<div class="flex flex-col gap-2">
				<div class="text-sm text-gray-600">Monto Inicial</div>
				<div class="text-[24px] font-bold text-[#111827]">
					S/. {cashBox.openingAmount.toFixed(2)}
				</div>
			</div>

			<!-- Lado Derecho -->
			<div class="flex flex-col items-end gap-5">
				<div class="text-[44px] font-extrabold text-[#111827]">
					S/. {currentAmount.toFixed(2)}
				</div>
				<button
					onclick={() => onClose(cashBox.id)}
					class="bg-[#ef4444] text-white border-none rounded-[10px] px-[18px] py-2.5 text-[15px] font-semibold cursor-pointer flex items-center gap-1.5 transition-all duration-200 hover:bg-[#dc2626] hover:scale-105"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
					Cerrar Caja
				</button>
			</div>
		</div>
	</div>

<!-- Caja Vacía -->
{:else if cashBox.status === 'empty'}
	<div class="bg-white border-2 border-[#e5e7eb] rounded-[20px] p-8 shadow-lg">
		<div class="flex justify-between items-start mb-6">
			<div class="flex flex-col gap-2">
				<h2 class="text-[28px] font-bold text-[#111827]">{cashBox.name}</h2>
				<div class="flex items-center gap-2">
					<span class="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
						Vacía
					</span>
				</div>
			</div>
		</div>

		<div class="flex justify-between items-center">
			<!-- Lado Izquierdo -->
			<div class="flex flex-col gap-2">
				<div class="text-sm text-gray-600">Monto Inicial</div>
				<div class="text-[24px] font-bold text-[#111827]">
					S/. {cashBox.openingAmount.toFixed(2)}
				</div>
			</div>

			<!-- Lado Derecho -->
			<div class="flex flex-col items-end gap-5">
				<div class="text-[44px] font-extrabold text-[#111827]">
					S/. {currentAmount.toFixed(2)}
				</div>
				<button
					onclick={() => onOpen(cashBox.id)}
					class="bg-[#6b7280] text-white border-none rounded-[10px] px-[18px] py-2.5 text-[15px] font-semibold cursor-pointer flex items-center gap-1.5 transition-all duration-200 hover:bg-[#4b5563] hover:scale-105"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
					Abrir Caja
				</button>
			</div>
		</div>
	</div>
{/if}
