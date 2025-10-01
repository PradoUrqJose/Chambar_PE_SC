<script lang="ts">
	import { AttachmentDebugPanel } from '$lib/components';
	import { onMount } from 'svelte';

	// Datos de prueba para simular archivos adjuntos
	let testAttachments = $state([
		{
			id: '1',
			url: 'https://picsum.photos/800/600?random=1',
			fileName: 'imagen-1.jpg',
			fileType: 'image/jpeg',
			fileSize: 245760,
			uploadedAt: new Date().toISOString()
		},
		{
			id: '2',
			url: 'https://picsum.photos/1200/800?random=2',
			fileName: 'imagen-2.jpg',
			fileType: 'image/jpeg',
			fileSize: 512000,
			uploadedAt: new Date().toISOString()
		},
		{
			id: '3',
			url: 'https://picsum.photos/600/400?random=3',
			fileName: 'imagen-3.jpg',
			fileType: 'image/jpeg',
			fileSize: 128000,
			uploadedAt: new Date().toISOString()
		},
		{
			id: '4',
			url: 'https://picsum.photos/1000/700?random=4',
			fileName: 'imagen-4.jpg',
			fileType: 'image/jpeg',
			fileSize: 384000,
			uploadedAt: new Date().toISOString()
		},
		{
			id: '5',
			url: 'https://picsum.photos/900/600?random=5',
			fileName: 'imagen-5.jpg',
			fileType: 'image/jpeg',
			fileSize: 256000,
			uploadedAt: new Date().toISOString()
		},
		{
			id: '6',
			url: 'https://picsum.photos/800/500?random=6',
			fileName: 'imagen-6.jpg',
			fileType: 'image/jpeg',
			fileSize: 192000,
			uploadedAt: new Date().toISOString()
		}
	]);

	let showDebug = $state(true);

	onMount(() => {
		console.log('🧪 Página de pruebas de optimizaciones cargada');
		console.log('📊 Archivos de prueba:', testAttachments.length);
		console.log('🔧 Debug panel:', showDebug ? 'activado' : 'desactivado');
	});
</script>

<svelte:head>
	<title>Pruebas de Optimizaciones - Chambar</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">
				🧪 Pruebas de Optimizaciones
			</h1>
			<p class="text-gray-600">
				Prueba las optimizaciones de archivos en desarrollo local
			</p>
		</div>

		<!-- Controles de Prueba -->
		<div class="bg-white rounded-lg shadow p-6 mb-8">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Controles de Prueba</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="flex items-center space-x-2">
					<input
						type="checkbox"
						id="debug-toggle"
						bind:checked={showDebug}
						class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<label for="debug-toggle" class="text-sm font-medium text-gray-700">
						Mostrar Debug Panel
					</label>
				</div>
				
				<button
					onclick={() => {
						console.log('🔄 Agregando archivo de prueba...');
						console.log('📊 Archivos actuales:', testAttachments.length);
						
						// Simular agregar más archivos
						const newFile = {
							id: Date.now().toString(),
							url: `https://picsum.photos/800/600?random=${Date.now()}`,
							fileName: `imagen-${Date.now()}.jpg`,
							fileType: 'image/jpeg',
							fileSize: Math.floor(Math.random() * 500000) + 100000,
							uploadedAt: new Date().toISOString()
						};
						
						console.log('📁 Nuevo archivo:', newFile);
						
						// Actualizar el estado
						testAttachments = [...testAttachments, newFile];
						
						console.log('✅ Archivo agregado. Total:', testAttachments.length);
					}}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				>
					Agregar Archivo de Prueba
				</button>
				
				<button
					onclick={() => {
						if (testAttachments.length > 0) {
							console.log('🗑️ Eliminando último archivo...');
							console.log('📊 Archivos antes:', testAttachments.length);
							testAttachments = testAttachments.slice(0, -1);
							console.log('✅ Archivo eliminado. Total:', testAttachments.length);
						} else {
							console.log('⚠️ No hay archivos para eliminar');
						}
					}}
					class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={testAttachments.length === 0}
				>
					Eliminar Último Archivo ({testAttachments.length})
				</button>
			</div>
		</div>

		<!-- Información de Prueba -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
			<h3 class="text-lg font-semibold text-blue-900 mb-2">ℹ️ Información de Prueba</h3>
			<div class="text-sm text-blue-800 space-y-1">
				<p><strong>Archivos de prueba:</strong> <span class="font-mono bg-blue-100 px-2 py-1 rounded">{testAttachments.length}</span> imágenes aleatorias de Picsum</p>
				<p><strong>Lazy Loading:</strong> Las imágenes se cargan solo cuando son visibles</p>
				<p><strong>Thumbnails:</strong> Se generan automáticamente con parámetros de desarrollo</p>
				<p><strong>Compresión:</strong> Se aplica automáticamente a archivos grandes</p>
				<p><strong>Cache:</strong> Se almacenan archivos frecuentemente accedidos</p>
			</div>
		</div>

		<!-- Información sobre las Imágenes Reales -->
		<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
			<h3 class="text-lg font-semibold text-green-900 mb-2">🖼️ Sobre las Imágenes de Prueba</h3>
			<div class="text-sm text-green-800 space-y-2">
				<p><strong>✅ Son imágenes REALES:</strong> Las imágenes provienen de <a href="https://picsum.photos" target="_blank" class="text-green-700 underline hover:text-green-900">Picsum Photos</a>, un servicio gratuito de imágenes de alta calidad.</p>
				<p><strong>📸 Contenido variado:</strong> Paisajes, retratos, objetos, arquitectura, naturaleza, etc.</p>
				<p><strong>🔗 URLs directas:</strong> Puedes abrir cualquier imagen en una nueva pestaña para verla en tamaño completo.</p>
				<p><strong>⚡ Optimizaciones activas:</strong> Cada imagen pasa por lazy loading, thumbnails y compresión automática.</p>
			</div>
		</div>

		<!-- Lista de Archivos Actuales -->
		<div class="bg-white rounded-lg shadow p-6 mb-8">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">📁 Archivos Actuales ({testAttachments.length})</h3>
			{#if testAttachments.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{#each testAttachments as attachment, index}
						<div class="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:shadow-md transition-shadow">
							<!-- Vista previa de la imagen -->
							<div class="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
								<img 
									src={attachment.url} 
									alt={attachment.fileName}
									class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
									loading="lazy"
								/>
							</div>
							
							<!-- Info del archivo -->
							<div class="p-3">
								<div class="flex items-center gap-2 mb-2">
									<svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<span class="text-xs font-medium text-gray-900">#{index + 1}</span>
								</div>
								<p class="text-xs text-gray-700 truncate" title={attachment.fileName}>
									{attachment.fileName}
								</p>
								<p class="text-xs text-gray-500">
									{Math.round(attachment.fileSize / 1024)} KB
								</p>
								
								<!-- Botón para ver imagen completa -->
								<a 
									href={attachment.url} 
									target="_blank" 
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
								>
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
									</svg>
									Ver imagen
								</a>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8 text-gray-500">
					<svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<p>No hay archivos de prueba</p>
					<p class="text-sm">Haz clic en "Agregar Archivo de Prueba" para comenzar</p>
				</div>
			{/if}
		</div>

		<!-- Componente AttachmentsPreview con optimizaciones -->
		<div class="bg-white rounded-lg shadow p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Vista Previa de Archivos</h2>
			<p class="text-gray-600 mb-4">
				Haz clic en el badge para abrir el modal con todas las optimizaciones
			</p>
			
			<!-- Simular el uso del componente AttachmentsPreview -->
			<div class="flex items-center space-x-4">
				<span class="text-sm text-gray-500">Archivos adjuntos:</span>
				<div class="flex space-x-2">
					{#each testAttachments.slice(0, 3) as attachment}
						<div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							{attachment.fileName}
						</div>
					{/each}
					{#if testAttachments.length > 3}
						<div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
							+{testAttachments.length - 3} más
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Instrucciones de Prueba -->
		<div class="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-yellow-900 mb-3">📋 Instrucciones de Prueba</h3>
			<div class="text-sm text-yellow-800 space-y-2">
				<ol class="list-decimal list-inside space-y-1">
					<li><strong>Lazy Loading:</strong> Abre las herramientas de desarrollador (F12) y observa la consola</li>
					<li><strong>Thumbnails:</strong> Busca logs con "🖼️ [DEV] Simulando generación de thumbnail"</li>
					<li><strong>Compresión:</strong> Busca logs con "🗜️ [DEV] Compresión completada"</li>
					<li><strong>Cache:</strong> Observa las estadísticas en el Debug Panel</li>
					<li><strong>Debug Panel:</strong> Usa el botón flotante azul para ver estadísticas en tiempo real</li>
				</ol>
			</div>
		</div>
	</div>

	<!-- Debug Panel -->
	<AttachmentDebugPanel attachments={testAttachments} showDebug={showDebug} />
</div>
