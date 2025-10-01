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
						// Simular agregar más archivos
						const newFile = {
							id: Date.now().toString(),
							url: `https://picsum.photos/800/600?random=${Date.now()}`,
							fileName: `imagen-${Date.now()}.jpg`,
							fileType: 'image/jpeg',
							fileSize: Math.floor(Math.random() * 500000) + 100000,
							uploadedAt: new Date().toISOString()
						};
						testAttachments = [...testAttachments, newFile];
					}}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				>
					Agregar Archivo de Prueba
				</button>
				
				<button
					onclick={() => {
						testAttachments = testAttachments.slice(0, -1);
					}}
					class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
				>
					Eliminar Último Archivo
				</button>
			</div>
		</div>

		<!-- Información de Prueba -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
			<h3 class="text-lg font-semibold text-blue-900 mb-2">ℹ️ Información de Prueba</h3>
			<div class="text-sm text-blue-800 space-y-1">
				<p><strong>Archivos de prueba:</strong> {testAttachments.length} imágenes aleatorias de Picsum</p>
				<p><strong>Lazy Loading:</strong> Las imágenes se cargan solo cuando son visibles</p>
				<p><strong>Thumbnails:</strong> Se generan automáticamente con parámetros de desarrollo</p>
				<p><strong>Compresión:</strong> Se aplica automáticamente a archivos grandes</p>
				<p><strong>Cache:</strong> Se almacenan archivos frecuentemente accedidos</p>
			</div>
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
