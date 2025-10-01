import { json } from '@sveltejs/kit';
import { getStands, createStand } from '$lib/services/stands-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const stands = await getStands(platform);
		return json(stands);
	} catch (error) {
		console.error('Error getting stands:', error);
		return json({ error: 'Error al obtener los stands' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		const result = await createStand(platform, data);
		
		if (result.success) {
			return json({ message: 'Stand creado correctamente', id: result.id });
		} else {
			return json({ error: result.error || 'Error al crear el stand' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error creating stand:', error);
		return json({ error: 'Error al crear el stand' }, { status: 500 });
	}
};
