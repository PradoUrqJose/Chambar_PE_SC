export interface CacheItem {
	url: string;
	blob: Blob;
	timestamp: number;
	expiresAt: number;
	size: number;
}

export interface CacheStats {
	totalItems: number;
	totalSize: number;
	hitRate: number;
	missRate: number;
}

import { getConfig } from '$lib/config/development';

class AttachmentCache {
	private cache = new Map<string, CacheItem>();
	private maxSize: number;
	private maxAge: number;
	private stats = {
		hits: 0,
		misses: 0
	};

	constructor(platform?: App.Platform) {
		const config = getConfig(platform);
		this.maxSize = config.CACHE_MAX_SIZE;
		this.maxAge = config.CACHE_MAX_AGE;
	}

	/**
	 * Obtiene un archivo del cache
	 */
	async get(url: string): Promise<Blob | null> {
		const item = this.cache.get(url);
		
		if (!item) {
			this.stats.misses++;
			return null;
		}

		// Verificar si ha expirado
		if (Date.now() > item.expiresAt) {
			this.cache.delete(url);
			this.stats.misses++;
			return null;
		}

		this.stats.hits++;
		return item.blob;
	}

	/**
	 * Almacena un archivo en el cache
	 */
	async set(url: string, blob: Blob): Promise<void> {
		// Verificar si hay espacio suficiente
		await this.cleanupIfNeeded(blob.size);

		const item: CacheItem = {
			url,
			blob,
			timestamp: Date.now(),
			expiresAt: Date.now() + this.maxAge,
			size: blob.size
		};

		this.cache.set(url, item);
	}

	/**
	 * Verifica si un archivo está en cache
	 */
	has(url: string): boolean {
		const item = this.cache.get(url);
		return item ? Date.now() <= item.expiresAt : false;
	}

	/**
	 * Limpia archivos expirados
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [url, item] of this.cache.entries()) {
			if (now > item.expiresAt) {
				this.cache.delete(url);
			}
		}
	}

	/**
	 * Limpia el cache si es necesario para hacer espacio
	 */
	private async cleanupIfNeeded(requiredSize: number): Promise<void> {
		const currentSize = this.getTotalSize();
		
		if (currentSize + requiredSize <= this.maxSize) {
			return;
		}

		// Ordenar por timestamp (más antiguos primero)
		const sortedItems = Array.from(this.cache.entries())
			.sort(([, a], [, b]) => a.timestamp - b.timestamp);

		// Eliminar archivos más antiguos hasta tener espacio
		let freedSize = 0;
		for (const [url, item] of sortedItems) {
			this.cache.delete(url);
			freedSize += item.size;
			
			if (currentSize - freedSize + requiredSize <= this.maxSize) {
				break;
			}
		}
	}

	/**
	 * Obtiene el tamaño total del cache
	 */
	private getTotalSize(): number {
		let total = 0;
		for (const item of this.cache.values()) {
			total += item.size;
		}
		return total;
	}

	/**
	 * Obtiene estadísticas del cache
	 */
	getStats(): CacheStats {
		const total = this.stats.hits + this.stats.misses;
		return {
			totalItems: this.cache.size,
			totalSize: this.getTotalSize(),
			hitRate: total > 0 ? this.stats.hits / total : 0,
			missRate: total > 0 ? this.stats.misses / total : 0
		};
	}

	/**
	 * Limpia todo el cache
	 */
	clear(): void {
		this.cache.clear();
		this.stats = { hits: 0, misses: 0 };
	}

	/**
	 * Pre-carga archivos en el cache
	 */
	async preload(urls: string[]): Promise<void> {
		const promises = urls.map(async (url) => {
			if (!this.has(url)) {
				try {
					const response = await fetch(url);
					if (response.ok) {
						const blob = await response.blob();
						await this.set(url, blob);
					}
				} catch (error) {
					console.warn('Error pre-cargando archivo:', url, error);
				}
			}
		});

		await Promise.all(promises);
	}
}

// Instancia global del cache
export const attachmentCache = new AttachmentCache();

/**
 * Obtiene un archivo del cache o lo descarga
 */
export async function getCachedFile(url: string): Promise<Blob> {
	// Intentar obtener del cache
	const cached = await attachmentCache.get(url);
	if (cached) {
		return cached;
	}

	// Descargar y cachear
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Error descargando archivo: ${response.statusText}`);
	}

	const blob = await response.blob();
	await attachmentCache.set(url, blob);
	
	return blob;
}

/**
 * Pre-carga archivos en el cache
 */
export async function preloadFiles(urls: string[]): Promise<void> {
	await attachmentCache.preload(urls);
}

/**
 * Limpia archivos expirados del cache
 */
export function cleanupCache(): void {
	attachmentCache.cleanup();
}

/**
 * Obtiene estadísticas del cache
 */
export function getCacheStats(): CacheStats {
	return attachmentCache.getStats();
}

/**
 * Limpia todo el cache
 */
export function clearCache(): void {
	attachmentCache.clear();
}
