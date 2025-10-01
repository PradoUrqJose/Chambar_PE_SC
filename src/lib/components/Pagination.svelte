<script lang="ts">
	interface Props {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage: number;
		onPageChange: (page: number) => void;
		showInfo?: boolean;
		maxVisiblePages?: number;
	}

	let { 
		currentPage, 
		totalPages, 
		totalItems, 
		itemsPerPage, 
		onPageChange,
		showInfo = true,
		maxVisiblePages = 5
	}: Props = $props();

	// Calcular información de paginación
	let startItem = $derived.by(() => (currentPage - 1) * itemsPerPage + 1);
	let endItem = $derived.by(() => Math.min(currentPage * itemsPerPage, totalItems));

	// Generar páginas visibles
	let visiblePages = $derived.by(() => {
		const pages: number[] = [];
		const halfVisible = Math.floor(maxVisiblePages / 2);
		
		let start = Math.max(1, currentPage - halfVisible);
		let end = Math.min(totalPages, start + maxVisiblePages - 1);
		
		// Ajustar inicio si estamos cerca del final
		if (end - start + 1 < maxVisiblePages) {
			start = Math.max(1, end - maxVisiblePages + 1);
		}
		
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		
		return pages;
	});

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages && page !== currentPage) {
			onPageChange(page);
		}
	}

	function goToFirstPage() {
		goToPage(1);
	}

	function goToLastPage() {
		goToPage(totalPages);
	}

	function goToPreviousPage() {
		goToPage(currentPage - 1);
	}

	function goToNextPage() {
		goToPage(currentPage + 1);
	}

	// Si no hay páginas, no mostrar nada
	let shouldShow = $derived.by(() => totalPages > 1);
</script>

{#if shouldShow}
<div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-4 py-3 border-t border-gray-200">
	<!-- Información de elementos -->
	{#if showInfo}
		<div class="text-sm text-gray-700">
			Mostrando <span class="font-medium">{startItem}</span> a <span class="font-medium">{endItem}</span> de <span class="font-medium">{totalItems}</span> resultados
		</div>
	{/if}

	<!-- Controles de paginación -->
	<div class="flex items-center gap-1">
		<!-- Primera página -->
		<button
			onclick={goToFirstPage}
			disabled={currentPage === 1}
			class="px-2 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			aria-label="Primera página"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
			</svg>
		</button>

		<!-- Página anterior -->
		<button
			onclick={goToPreviousPage}
			disabled={currentPage === 1}
			class="px-2 py-1.5 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			aria-label="Página anterior"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>

		<!-- Números de página -->
		{#each visiblePages as page}
			<button
				onclick={() => goToPage(page)}
				class="px-3 py-1.5 text-sm font-medium border-t border-b border-gray-300 transition-colors {page === currentPage 
					? 'bg-blue-600 text-white border-blue-600' 
					: 'text-gray-700 bg-white hover:bg-gray-50'}"
				aria-label="Página {page}"
				aria-current={page === currentPage ? 'page' : undefined}
			>
				{page}
			</button>
		{/each}

		<!-- Página siguiente -->
		<button
			onclick={goToNextPage}
			disabled={currentPage === totalPages}
			class="px-2 py-1.5 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			aria-label="Página siguiente"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>

		<!-- Última página -->
		<button
			onclick={goToLastPage}
			disabled={currentPage === totalPages}
			class="px-2 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			aria-label="Última página"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
			</svg>
		</button>
	</div>
</div>
{/if}
