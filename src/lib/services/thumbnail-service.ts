import type { R2Bucket } from '@cloudflare/workers-types';
import { getConfig } from '$lib/config/development';

export interface ThumbnailOptions {
	width?: number;
	height?: number;
	quality?: number;
	format?: 'webp' | 'jpeg' | 'png';
}

export interface ThumbnailResult {
	success: boolean;
	thumbnailUrl?: string;
	error?: string;
}

/**
 * Genera un thumbnail optimizado para una imagen
 * En desarrollo: simula la generación
 * En producción: usa Cloudflare Image Resizing
 */
export async function generateThumbnail(
	platform: App.Platform,
	imageUrl: string,
	options: ThumbnailOptions = {}
): Promise<ThumbnailResult> {
	const config = getConfig(platform);
	const {
		width = config.THUMBNAIL_WIDTH,
		height = config.THUMBNAIL_HEIGHT,
		quality = config.THUMBNAIL_QUALITY,
		format = config.THUMBNAIL_FORMAT
	} = options;

	// En desarrollo, simular thumbnail
	if (!platform?.env?.ATTACHMENTS) {
		if (config.LOG_THUMBNAIL_GENERATION) {
			console.log('🖼️ [DEV] Simulando generación de thumbnail para:', imageUrl);
			console.log('📐 [DEV] Dimensiones:', `${width}x${height}`);
			console.log('🎨 [DEV] Calidad:', `${quality}%`);
			console.log('📄 [DEV] Formato:', format.toUpperCase());
		}
		
		// Simular delay de procesamiento
		await new Promise(resolve => setTimeout(resolve, 100));
		
		// En desarrollo, devolver la URL original con parámetros de thumbnail
		const url = new URL(imageUrl);
		url.searchParams.set('w', width.toString());
		url.searchParams.set('h', height.toString());
		url.searchParams.set('q', quality.toString());
		url.searchParams.set('f', format);
		url.searchParams.set('thumbnail', 'true');
		url.searchParams.set('dev', 'true');
		
		return {
			success: true,
			thumbnailUrl: url.toString()
		};
	}

	try {
		// En producción, usar Cloudflare Image Resizing
		const thumbnailUrl = `https://imagedelivery.net/${platform.env.CLOUDFLARE_ACCOUNT_HASH}/${imageUrl}/thumbnail?width=${width}&height=${height}&quality=${quality}&format=${format}`;
		
		return {
			success: true,
			thumbnailUrl
		};
	} catch (error) {
		console.error('Error generando thumbnail:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido'
		};
	}
}

/**
 * Obtiene el thumbnail de una imagen, generándolo si es necesario
 */
export async function getThumbnail(
	platform: App.Platform,
	imageUrl: string,
	options?: ThumbnailOptions
): Promise<string> {
	const result = await generateThumbnail(platform, imageUrl, options);
	return result.thumbnailUrl || imageUrl; // Fallback a imagen original
}

/**
 * Pre-carga thumbnails para una lista de imágenes
 */
export async function preloadThumbnails(
	platform: App.Platform,
	imageUrls: string[],
	options?: ThumbnailOptions
): Promise<Record<string, string>> {
	const thumbnails: Record<string, string> = {};
	
	// Procesar en paralelo con límite de concurrencia
	const batchSize = 5;
	for (let i = 0; i < imageUrls.length; i += batchSize) {
		const batch = imageUrls.slice(i, i + batchSize);
		const promises = batch.map(async (url) => {
			const thumbnail = await getThumbnail(platform, url, options);
			thumbnails[url] = thumbnail;
		});
		
		await Promise.all(promises);
	}
	
	return thumbnails;
}

/**
 * Valida si una URL es una imagen
 */
export function isImageUrl(url: string): boolean {
	const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
	const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
	
	// Verificar extensión
	const hasImageExtension = imageExtensions.some(ext => 
		url.toLowerCase().includes(ext)
	);
	
	// Verificar MIME type en URL (si está presente)
	const hasImageMimeType = imageMimeTypes.some(mime => 
		url.includes(mime)
	);
	
	return hasImageExtension || hasImageMimeType;
}
