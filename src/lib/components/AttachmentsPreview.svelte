<script lang="ts">
	import type { Attachment } from '$lib/services/attachments-service';

	interface Props {
		attachments: Attachment[];
	}

	let { attachments }: Props = $props();

	let showModal = $state(false);
	let selectedAttachment = $state<Attachment | null>(null);

	function openPreview(attachment: Attachment) {
		selectedAttachment = attachment;
		showModal = true;
	}

	function closePreview() {
		showModal = false;
		selectedAttachment = null;
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

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
	}
</script>

<!-- Badge con cantidad de archivos -->
{#if attachments && attachments.length > 0}
	<button
		onclick={() => openPreview(attachments[0])}
		class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium"
		title="Ver {attachments.length} archivo{attachments.length > 1 ? 's' : ''}"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
		</svg>
		{attachments.length}
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
				<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
					<h3 id="preview-title" class="text-lg font-semibold text-gray-900">
						Archivos Adjuntos ({attachments.length})
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

				<!-- Contenido -->
				<div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each attachments as attachment}
							<div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
								<!-- Preview del archivo -->
								<div class="bg-gray-100 aspect-video flex items-center justify-center overflow-hidden">
									{#if getFileIcon(attachment.fileType) === 'image'}
										<img 
											src={attachment.url} 
											alt={attachment.fileName}
											class="w-full h-full object-contain"
										/>
									{:else if getFileIcon(attachment.fileType) === 'pdf'}
										<div class="text-center p-8">
											<svg class="w-20 h-20 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
											</svg>
											<p class="text-sm text-gray-600 font-medium">Archivo PDF</p>
										</div>
									{:else if getFileIcon(attachment.fileType) === 'excel'}
										<div class="text-center p-8">
											<svg class="w-20 h-20 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
											<p class="text-sm text-gray-600 font-medium">Archivo Excel</p>
										</div>
									{:else}
										<div class="text-center p-8">
											<svg class="w-20 h-20 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
											<p class="text-sm text-gray-600 font-medium">Archivo</p>
										</div>
									{/if}
								</div>

								<!-- Info del archivo -->
								<div class="p-4 bg-white">
									<p class="text-sm font-medium text-gray-900 truncate" title={attachment.fileName}>
										{attachment.fileName}
									</p>
									<div class="flex items-center justify-between mt-2">
										<span class="text-xs text-gray-500">
											{formatFileSize(attachment.fileSize)}
										</span>
										<a
											href={attachment.url}
											download={attachment.fileName}
											class="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
											onclick={(e) => e.stopPropagation()}
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
											</svg>
											Descargar
										</a>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

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
{:else}
	<span class="text-gray-400 text-xs">—</span>
{/if}

