import { getConfig } from '$lib/config/development';

export interface CompressionOptions {
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
	maxSizeKB?: number;
	format?: 'webp' | 'jpeg' | 'png';
}

export interface CompressionResult {
	success: boolean;
	compressedFile?: File;
	originalSize: number;
	compressedSize: number;
	compressionRatio: number;
	error?: string;
}

/**
 * Comprime una imagen antes de subirla
 */
export async function compressImage(
	file: File,
	options: CompressionOptions = {},
	platform?: App.Platform
): Promise<CompressionResult> {
	const config = getConfig(platform);
	const {
		maxWidth = config.COMPRESSION_MAX_WIDTH,
		maxHeight = config.COMPRESSION_MAX_HEIGHT,
		quality = config.COMPRESSION_QUALITY,
		maxSizeKB = config.COMPRESSION_MAX_SIZE_KB,
		format = 'webp'
	} = options;

	// Solo comprimir imágenes
	if (!file.type.startsWith('image/')) {
		return {
			success: false,
			originalSize: file.size,
			compressedSize: file.size,
			compressionRatio: 1,
			error: 'Solo se pueden comprimir archivos de imagen'
		};
	}

	// Si la compresión está deshabilitada, no comprimir
	if (!config.COMPRESSION_ENABLED) {
		return {
			success: true,
			compressedFile: file,
			originalSize: file.size,
			compressedSize: file.size,
			compressionRatio: 1
		};
	}

	// Si el archivo ya es pequeño, no comprimir
	const maxSizeBytes = maxSizeKB * 1024;
	if (file.size <= maxSizeBytes) {
		if (config.LOG_COMPRESSION_STATS) {
			console.log('📦 [DEV] Archivo ya es pequeño, no comprimir:', file.name, formatFileSize(file.size));
		}
		return {
			success: true,
			compressedFile: file,
			originalSize: file.size,
			compressedSize: file.size,
			compressionRatio: 1
		};
	}

	try {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('No se pudo obtener el contexto del canvas');
		}

		// Cargar la imagen
		const img = new Image();
		img.src = URL.createObjectURL(file);
		
		await new Promise((resolve, reject) => {
			img.onload = resolve;
			img.onerror = reject;
		});

		// Calcular nuevas dimensiones manteniendo aspect ratio
		let { width, height } = img;
		if (width > maxWidth || height > maxHeight) {
			const ratio = Math.min(maxWidth / width, maxHeight / height);
			width *= ratio;
			height *= ratio;
		}

		// Configurar canvas
		canvas.width = width;
		canvas.height = height;

		// Dibujar imagen redimensionada
		ctx.drawImage(img, 0, 0, width, height);

		// Convertir a blob con compresión
		const blob = await new Promise<Blob>((resolve) => {
			canvas.toBlob(
				(blob) => resolve(blob!),
				`image/${format}`,
				quality
			);
		});

		// Crear nuevo archivo
		const compressedFile = new File([blob], file.name, {
			type: `image/${format}`,
			lastModified: file.lastModified
		});

		// Limpiar URL temporal
		URL.revokeObjectURL(img.src);

		const compressionRatio = compressedFile.size / file.size;

		if (config.LOG_COMPRESSION_STATS) {
			console.log('🗜️ [DEV] Compresión completada:', file.name);
			console.log('📊 [DEV] Original:', formatFileSize(file.size));
			console.log('📊 [DEV] Comprimido:', formatFileSize(compressedFile.size));
			console.log('📊 [DEV] Reducción:', `${Math.round((1 - compressionRatio) * 100)}%`);
		}

		return {
			success: true,
			compressedFile,
			originalSize: file.size,
			compressedSize: compressedFile.size,
			compressionRatio
		};

	} catch (error) {
		console.error('Error comprimiendo imagen:', error);
		return {
			success: false,
			originalSize: file.size,
			compressedSize: file.size,
			compressionRatio: 1,
			error: error instanceof Error ? error.message : 'Error desconocido'
		};
	}
}

/**
 * Comprime múltiples archivos en paralelo
 */
export async function compressFiles(
	files: File[],
	options?: CompressionOptions
): Promise<CompressionResult[]> {
	const results: CompressionResult[] = [];
	
	// Procesar en paralelo con límite de concurrencia
	const batchSize = 3;
	for (let i = 0; i < files.length; i += batchSize) {
		const batch = files.slice(i, i + batchSize);
		const promises = batch.map(file => compressImage(file, options));
		const batchResults = await Promise.all(promises);
		results.push(...batchResults);
	}
	
	return results;
}

/**
 * Valida si un archivo necesita compresión
 */
export function needsCompression(file: File, maxSizeKB: number = 500): boolean {
	if (!file.type.startsWith('image/')) return false;
	return file.size > maxSizeKB * 1024;
}

/**
 * Obtiene el tamaño formateado de un archivo
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
