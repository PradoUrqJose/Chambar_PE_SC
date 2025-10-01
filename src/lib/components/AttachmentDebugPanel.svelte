<script lang="ts">
	import { getCacheStats, clearCache } from '$lib/services/cache-service';
	import { DEV_CONFIG } from '$lib/config/development';
	import type { Attachment } from '$lib/services/attachments-service';

	interface Props {
		attachments: Attachment[];
		showDebug?: boolean;
	}

	let { attachments, showDebug = false }: Props = $props();

	let cacheStats = $state(getCacheStats());
	let compressionStats = $state<Record<string, any>>({});
	let thumbnailStats = $state<Record<string, any>>({});
	let isVisible = $state(showDebug);

	// Actualizar estadísticas cada 2 segundos
	$effect(() => {
		if (!isVisible) return;

		const interval = setInterval(() => {
			cacheStats = getCacheStats();
		}, 2000);

		return () => clearInterval(interval);
	});

	function clearAllCache() {
		clearCache();
		cacheStats = getCacheStats();
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
	}

	function getHitRatePercentage(): number {
		return Math.round(cacheStats.hitRate * 100);
	}

	function getMissRatePercentage(): number {
		return Math.round(cacheStats.missRate * 100);
	}
</script>

{#if isVisible}
	<div class="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-sm z-50">
		<div class="flex justify-between items-center mb-3">
			<h3 class="text-sm font-semibold">🔧 Debug Panel</h3>
			<button
				onclick={() => isVisible = false}
				class="text-gray-400 hover:text-white transition-colors"
				aria-label="Cerrar debug panel"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="space-y-3 text-xs">
			<!-- Cache Stats -->
			<div class="bg-gray-800 p-2 rounded">
				<h4 class="font-medium text-green-400 mb-1">📦 Cache</h4>
				<div class="space-y-1">
					<div>Items: {cacheStats.totalItems}</div>
					<div>Tamaño: {formatBytes(cacheStats.totalSize)}</div>
					<div>Hit Rate: {getHitRatePercentage()}%</div>
					<div>Miss Rate: {getMissRatePercentage()}%</div>
					<button
						onclick={clearAllCache}
						class="mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
					>
						Limpiar Cache
					</button>
				</div>
			</div>

			<!-- Compression Stats -->
			<div class="bg-gray-800 p-2 rounded">
				<h4 class="font-medium text-blue-400 mb-1">🗜️ Compresión</h4>
				<div class="space-y-1">
					<div>Archivos: {attachments.length}</div>
					<div>Config: {DEV_CONFIG.COMPRESSION_ENABLED ? 'ON' : 'OFF'}</div>
					<div>Calidad: {Math.round(DEV_CONFIG.COMPRESSION_QUALITY * 100)}%</div>
					<div>Max: {DEV_CONFIG.COMPRESSION_MAX_WIDTH}x{DEV_CONFIG.COMPRESSION_MAX_HEIGHT}</div>
				</div>
			</div>

			<!-- Thumbnail Stats -->
			<div class="bg-gray-800 p-2 rounded">
				<h4 class="font-medium text-purple-400 mb-1">🖼️ Thumbnails</h4>
				<div class="space-y-1">
					<div>Config: {DEV_CONFIG.THUMBNAIL_ENABLED ? 'ON' : 'OFF'}</div>
					<div>Tamaño: {DEV_CONFIG.THUMBNAIL_WIDTH}x{DEV_CONFIG.THUMBNAIL_HEIGHT}</div>
					<div>Formato: {DEV_CONFIG.THUMBNAIL_FORMAT.toUpperCase()}</div>
					<div>Calidad: {DEV_CONFIG.THUMBNAIL_QUALITY}%</div>
				</div>
			</div>

			<!-- Lazy Loading Stats -->
			<div class="bg-gray-800 p-2 rounded">
				<h4 class="font-medium text-yellow-400 mb-1">⚡ Lazy Loading</h4>
				<div class="space-y-1">
					<div>Config: {DEV_CONFIG.LAZY_LOADING_ENABLED ? 'ON' : 'OFF'}</div>
					<div>Margin: {DEV_CONFIG.LAZY_LOADING_ROOT_MARGIN}</div>
					<div>Threshold: {DEV_CONFIG.LAZY_LOADING_THRESHOLD}</div>
				</div>
			</div>

			<!-- Debug Info -->
			<div class="bg-gray-800 p-2 rounded">
				<h4 class="font-medium text-orange-400 mb-1">🐛 Debug</h4>
				<div class="space-y-1">
					<div>Mode: {DEV_CONFIG.DEBUG_MODE ? 'ON' : 'OFF'}</div>
					<div>Logs: {DEV_CONFIG.LOG_COMPRESSION_STATS ? 'ON' : 'OFF'}</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Botón flotante para mostrar/ocultar debug panel -->
{#if !isVisible}
	<button
		onclick={() => isVisible = true}
		class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50 transition-colors"
		aria-label="Mostrar debug panel"
		title="Debug Panel"
	>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
		</svg>
	</button>
{/if}
