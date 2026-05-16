<script lang="ts">
	import type { Attachment } from '$lib/services/attachments-service';
	import LazyImage from './LazyImage.svelte';
	import { getThumbnail, isImageUrl } from '$lib/services/thumbnail-service';
	import { compressImage, needsCompression, formatFileSize } from '$lib/services/compression-service';
	import { getCachedFile, preloadFiles } from '$lib/services/cache-service';

	interface Props {
		attachments: Attachment[];
		platform?: App.Platform;
		enableCompression?: boolean;
		enableThumbnails?: boolean;
		enableCache?: boolean;
	}

	let { 
		attachments, 
		platform,
		enableCompression = true,
		enableThumbnails = true,
		enableCache = true
	}: Props = $props();

	let showModal = $state(false);
	let selectedAttachment = $state<Attachment | null>(null);
	let currentPage = $state(1);
	let itemsPerPage = $state(8); // 8 archivos por página (2x4 grid)
	let filterType = $state<'all' | 'image' | 'pdf' | 'excel'>('all');
	let searchQuery = $state('');
	let showImageZoom = $state(false);
	let zoomedImage = $state<Attachment | null>(null);
	let thumbnails = $state<Record<string, string>>({});
	let compressionStats = $state<Record<string, { original: number; compressed: number; ratio: number }>>({});

	// Filtrar y paginar archivos
	let filteredAttachments = $derived.by(() => {
		let filtered = attachments;

		// Filtrar por tipo
		if (filterType !== 'all') {
			filtered = filtered.filter(attachment => {
				if (filterType === 'image') return attachment.fileType.startsWith('image/');
				if (filterType === 'pdf') return attachment.fileType.includes('pdf');
				if (filterType === 'excel') return attachment.fileType.includes('excel') || attachment.fileType.includes('spreadsheet');
				return true;
			});
		}

		// Filtrar por búsqueda
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(attachment => 
				attachment.fileName.toLowerCase().includes(query)
			);
		}

		return filtered;
	});

	let paginatedAttachments = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		return filteredAttachments.slice(start, end);
	});

	let totalPages = $derived.by(() => Math.ceil(filteredAttachments.length / itemsPerPage));

	function openPreview(attachment: Attachment) {
		selectedAttachment = attachment;
		showModal = true;
		// Resetear filtros al abrir
		currentPage = 1;
		filterType = 'all';
		searchQuery = '';
	}

	function closePreview() {
		showModal = false;
		selectedAttachment = null;
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
		}
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	function clearFilters() {
		filterType = 'all';
		searchQuery = '';
		currentPage = 1;
	}

	function openImageZoom(attachment: Attachment) {
		if (getFileIcon(attachment.fileType) === 'image') {
			zoomedImage = attachment;
			showImageZoom = true;
		}
	}

	function closeImageZoom() {
		showImageZoom = false;
		zoomedImage = null;
	}

	function getFileIcon(fileType: string) {
		if (fileType.startsWith('image/')) {
			return 'image';
		} else if (fileType.includes('pdf')) {
			return 'pdf';
		} else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
			return 'excel';
		}
		return 'file';
	}

	// Pre-cargar thumbnails cuando se abren archivos
	$effect(() => {
		if (showModal && enableThumbnails && platform) {
			const imageUrls = attachments
				.filter(att => isImageUrl(att.url))
				.map(att => att.url);
			
			if (imageUrls.length > 0) {
				preloadThumbnails();
			}
		}
	});

	let isLoadingThumbnails = $state(false);

	async function preloadThumbnails() {
		if (!platform || !enableThumbnails) return;
		isLoadingThumbnails = true;

		const imageUrls = attachments
			.filter(att => isImageUrl(att.url))
			.map(att => att.url);

		try {
			const thumbnailMap = await Promise.all(
				imageUrls.map(async (url) => {
					const thumbnail = await getThumbnail(platform, url, {
						width: 400,
						height: 300,
						quality: 85,
						format: 'webp'
					});
					return [url, thumbnail] as [string, string];
				})
			);

			thumbnails = Object.fromEntries(thumbnailMap);
		} catch (error) {
			console.warn('Error pre-cargando thumbnails:', error);
		} finally {
			isLoadingThumbnails = false;
		}
	}

	async function preloadCache() {
		if (!enableCache) return;

		const urls = attachments.map(att => att.url);
		try {
			await preloadFiles(urls);
		} catch (error) {
			console.warn('Error pre-cargando cache:', error);
		}
	}

	function getThumbnailUrl(attachment: Attachment): string {
		if (!enableThumbnails || !isImageUrl(attachment.url)) {
			return attachment.url;
		}
		return thumbnails[attachment.url] || attachment.url;
	}

	function getCompressionInfo(attachment: Attachment) {
		return compressionStats[attachment.url] || null;
	}
</script>

<!-- Badge con cantidad de archivos -->
{#if attachments && attachments.length > 0}
	<button
		onclick={() => openPreview(attachments[0])}
		class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all text-xs font-semibold shadow-sm group"
		title="Ver {attachments.length} archivo{attachments.length > 1 ? 's' : ''}"
	>
		<svg class="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
		</svg>
		<span>{attachments.length} archivo{attachments.length > 1 ? 's' : ''}</span>
	</button>

	<!-- Modal de vista previa -->
	{#if showModal}
		<div 
			class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
			onclick={closePreview}
			onkeydown={(e) => e.key === 'Escape' && closePreview()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="preview-title"
			tabindex="-1"
		>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div 
			class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
		>
				<!-- Header -->
				<div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
					<div class="flex justify-between items-center mb-4">
						<h3 id="preview-title" class="text-lg font-semibold text-gray-900">
							Archivos Adjuntos ({filteredAttachments.length} de {attachments.length})
							{#if isLoadingThumbnails}
								<span class="ml-2 inline-flex items-center">
									<svg class="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
								</span>
							{/if}
						</h3>
						<button
							onclick={closePreview}
							class="text-gray-400 hover:text-gray-600 transition-colors"
							aria-label="Cerrar vista previa"
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<!-- Controles de filtros y búsqueda -->
					<div class="flex flex-col sm:flex-row gap-4">
						<!-- Búsqueda -->
						<div class="flex-1">
							<div class="relative">
								<input
									type="text"
									placeholder="Buscar archivos..."
									bind:value={searchQuery}
									class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
								/>
								<svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</div>
						</div>

						<!-- Filtro por tipo -->
						<div class="flex gap-2">
							<select
								bind:value={filterType}
								class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
							>
								<option value="all">Todos</option>
								<option value="image">Imágenes</option>
								<option value="pdf">PDFs</option>
								<option value="excel">Excel</option>
							</select>
							
							{#if filterType !== 'all' || searchQuery.trim()}
								<button
									onclick={clearFilters}
									class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
									title="Limpiar filtros"
									aria-label="Limpiar filtros"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							{/if}
						</div>
					</div>
				</div>

				<!-- Contenido -->
				<div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
					{#if paginatedAttachments.length === 0}
						<div class="text-center py-12">
							<svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<p class="text-gray-500 text-lg font-medium">No se encontraron archivos</p>
							<p class="text-gray-400 text-sm mt-1">
								{#if searchQuery.trim()}
									Intenta con otros términos de búsqueda
								{:else if filterType !== 'all'}
									Prueba con otro filtro de tipo
								{:else}
									No hay archivos adjuntos
								{/if}
							</p>
						</div>
					{:else}
						<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{#each paginatedAttachments as attachment}
							<div class="group relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300">
								<!-- Preview del archivo -->
								<button 
									type="button"
									class="w-full bg-gray-50 aspect-[4/3] flex items-center justify-center overflow-hidden relative cursor-pointer focus:outline-none"
									onclick={() => openImageZoom(attachment)}
								>
									{#if getFileIcon(attachment.fileType) === 'image'}
										<div class="w-full h-full">
											<LazyImage
												src={getThumbnailUrl(attachment)}
												alt={attachment.fileName}
												class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
												forceLoad={true}
											/>
										</div>
										<!-- Overlay elegante -->
										<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
											<div class="flex items-center gap-2 text-white text-xs font-medium">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
												</svg>
												Ver en grande
											</div>
										</div>
									{:else}
										<!-- Iconos para archivos no-imagen (PDF, Excel, etc) -->
										<div class="flex flex-col items-center">
											{#if getFileIcon(attachment.fileType) === 'pdf'}
												<div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
													<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
													</svg>
												</div>
												<span class="text-[10px] font-bold text-red-500 uppercase tracking-wider">PDF</span>
											{:else if getFileIcon(attachment.fileType) === 'excel'}
												<div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
													<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
													</svg>
												</div>
												<span class="text-[10px] font-bold text-green-500 uppercase tracking-wider">Excel</span>
											{:else}
												<div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
													<svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
													</svg>
												</div>
												<span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Archivo</span>
											{/if}
										</div>
									{/if}
								</button>
								
								<!-- Info Footer -->
								<div class="p-3 border-t border-gray-50">
									<p class="text-xs font-semibold text-gray-800 truncate mb-1" title={attachment.fileName}>
										{attachment.fileName}
									</p>
									<div class="flex items-center justify-between">
										<span class="text-[10px] text-gray-400 font-medium">{formatFileSize(attachment.fileSize)}</span>
										<a
											href={attachment.url}
											download={attachment.fileName}
											class="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200"
											title="Descargar archivo"
										>
											<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
											</svg>
										</a>
									</div>
								</div>
							</div>
						{/each}
						</div>
					{/if}
				</div>

				<!-- Paginación -->
				{#if totalPages > 1}
					<div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
						<div class="flex items-center justify-between">
							<div class="text-sm text-gray-700">
								Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAttachments.length)} de {filteredAttachments.length} archivos
							</div>
							
							<div class="flex items-center gap-2">
								<!-- Botón anterior -->
								<button
									onclick={prevPage}
									disabled={currentPage === 1}
									class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
									aria-label="Página anterior"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
									</svg>
								</button>

								<!-- Números de página -->
								<div class="flex gap-1">
									{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
										const start = Math.max(1, currentPage - 2);
										const page = start + i;
										return page <= totalPages ? page : null;
									}).filter((page): page is number => page !== null) as page}
										<button
											onclick={() => goToPage(page)}
											class="px-3 py-1.5 text-sm font-medium rounded-md {currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}"
										>
											{page}
										</button>
									{/each}
								</div>

								<!-- Botón siguiente -->
								<button
									onclick={nextPage}
									disabled={currentPage === totalPages}
									class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
									aria-label="Página siguiente"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Footer -->
				<div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
					<button
						onclick={closePreview}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						Cerrar
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Modal de zoom para imágenes -->
	{#if showImageZoom && zoomedImage}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div 
			class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4"
			onclick={closeImageZoom}
			onkeydown={(e) => e.key === 'Escape' && closeImageZoom()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="zoom-title"
			tabindex="-1"
		>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div 
				class="relative max-w-[95vw] max-h-[95vh] bg-white rounded-lg overflow-hidden"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="document"
			>
				<!-- Header del zoom -->
				<div class="px-4 py-3 bg-gray-900 text-white flex justify-between items-center">
					<h3 id="zoom-title" class="text-lg font-semibold truncate pr-4">
						{zoomedImage.fileName}
					</h3>
					<button
						onclick={closeImageZoom}
						class="text-white hover:text-gray-300 transition-colors flex-shrink-0"
						aria-label="Cerrar zoom"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Imagen con zoom -->
				<div class="relative">
					<img 
						src={zoomedImage.url} 
						alt={zoomedImage.fileName}
						class="max-w-full max-h-[80vh] w-auto h-auto object-contain"
						style="max-width: 90vw; max-height: 80vh;"
					/>
					
					<!-- Botón de descarga flotante -->
					<div class="absolute top-4 right-4">
						<a
							href={zoomedImage.url}
							download={zoomedImage.fileName}
							class="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 px-3 py-2 rounded-md shadow-lg flex items-center gap-2 text-sm font-medium transition-all"
							onclick={(e) => e.stopPropagation()}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
							</svg>
							Descargar
						</a>
					</div>
				</div>

				<!-- Info de la imagen -->
				<div class="px-4 py-3 bg-gray-100 text-sm text-gray-600">
					<div class="flex justify-between items-center">
						<span>Tamaño: {formatFileSize(zoomedImage.fileSize)}</span>
						<span>Tipo: {zoomedImage.fileType}</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<span class="text-gray-400 text-xs">—</span>
{/if}

