/**
 * Servicio para manejo de archivos adjuntos con Cloudflare R2
 */

export interface Attachment {
	id: string;
	fileName: string;
	fileSize: number;
	fileType: string;
	url: string;
	uploadedAt: string;
}

/**
 * Genera un nombre único para el archivo más amigable
 */
export function generateFileName(originalName: string): string {
	const timestamp = new Date();
	const dateStr = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
	const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
	const random = Math.random().toString(36).substring(2, 6); // 4 caracteres aleatorios
	
	const extension = originalName.split('.').pop();
	const nameWithoutExt = originalName.replace(`.${extension}`, '')
		.replace(/[^a-zA-Z0-9\s]/g, '') // Solo letras, números y espacios
		.replace(/\s+/g, '-') // Espacios por guiones
		.substring(0, 30); // Máximo 30 caracteres
	
	return `${dateStr}_${timeStr}_${nameWithoutExt}_${random}.${extension}`;
}

/**
 * Sube un archivo a R2
 */
export async function uploadFile(
	platform: App.Platform,
	file: File,
	folder: string = 'operations'
): Promise<{ success: boolean; attachment?: Attachment; error?: string }> {
	try {
		const bucket = platform?.env?.ATTACHMENTS;
		
		// Modo desarrollo (sin R2)
		if (!bucket) {
			console.log('🔧 Modo desarrollo: simulando upload de archivo');
			const mockAttachment: Attachment = {
				id: `mock-${Date.now()}`,
				fileName: file.name,
				fileSize: file.size,
				fileType: file.type,
				url: `/mock-uploads/${file.name}`,
				uploadedAt: new Date().toISOString()
			};
			return { success: true, attachment: mockAttachment };
		}

		// Validaciones
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			return { success: false, error: 'El archivo excede el tamaño máximo de 10MB' };
		}

		const allowedTypes = [
			'image/jpeg',
			'image/jpg',
			'image/png',
			'image/webp',
			'application/pdf',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
			'application/vnd.ms-excel'
		];

		if (!allowedTypes.includes(file.type)) {
			return { success: false, error: 'Tipo de archivo no permitido' };
		}

		// Generar nombre único
		const fileName = generateFileName(file.name);
		const key = `${folder}/${fileName}`;

		// Convertir File a ArrayBuffer
		const arrayBuffer = await file.arrayBuffer();

		// Subir a R2
		await bucket.put(key, arrayBuffer, {
			httpMetadata: {
				contentType: file.type,
			},
			customMetadata: {
				originalName: file.name,
				uploadedAt: new Date().toISOString(),
			}
		});

		const attachment: Attachment = {
			id: key,
			fileName: file.name,
			fileSize: file.size,
			fileType: file.type,
			url: `/api/attachments/${key}`,
			uploadedAt: new Date().toISOString()
		};

		console.log('✅ Archivo subido exitosamente:', attachment);
		return { success: true, attachment };

	} catch (error) {
		console.error('❌ Error al subir archivo:', error);
		return { success: false, error: 'Error al subir el archivo' };
	}
}

/**
 * Obtiene un archivo de R2
 */
export async function getFile(
	platform: App.Platform,
	key: string
): Promise<{ success: boolean; file?: R2ObjectBody; error?: string }> {
	try {
		const bucket = platform?.env?.ATTACHMENTS;
		
		if (!bucket) {
			return { success: false, error: 'R2 no disponible en desarrollo' };
		}

		const object = await bucket.get(key);
		
		if (!object) {
			return { success: false, error: 'Archivo no encontrado' };
		}

		return { success: true, file: object };

	} catch (error) {
		console.error('❌ Error al obtener archivo:', error);
		return { success: false, error: 'Error al obtener el archivo' };
	}
}

/**
 * Elimina un archivo de R2
 */
export async function deleteFile(
	platform: App.Platform,
	key: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const bucket = platform?.env?.ATTACHMENTS;
		
		if (!bucket) {
			console.log('🔧 Modo desarrollo: simulando eliminación de archivo');
			return { success: true };
		}

		await bucket.delete(key);
		
		console.log('✅ Archivo eliminado:', key);
		return { success: true };

	} catch (error) {
		console.error('❌ Error al eliminar archivo:', error);
		return { success: false, error: 'Error al eliminar el archivo' };
	}
}

