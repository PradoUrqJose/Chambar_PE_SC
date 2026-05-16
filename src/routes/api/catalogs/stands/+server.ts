import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStands, createStand } from '$lib/services/stands-service';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const stands = await getStands(platform!);
		return json(stands);
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al obtener los stands' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		const result = await createStand(platform!, data);
		
		if (result.success) {
			return json({ success: true, id: result.id }, { status: 201 });
		}
		return json({ error: result.error }, { status: 500 });
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al crear el stand' }, { status: 500 });
	}
};