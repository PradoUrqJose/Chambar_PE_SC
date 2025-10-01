import { json } from '@sveltejs/kit';
import { uploadFile } from '$lib/services/attachments-service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const folder = (formData.get('folder') as string) || 'operations';

		if (!file) {
			return json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
		}

		const result = await uploadFile(platform, file, folder);

		if (result.success && result.attachment) {
			return json({ 
				message: 'Archivo subido correctamente',
				attachment: result.attachment
			});
		} else {
			return json({ error: result.error || 'Error al subir el archivo' }, { status: 500 });
		}

	} catch (error) {
		console.error('Error uploading file:', error);
		return json({ error: 'Error al procesar la solicitud' }, { status: 500 });
	}
};

