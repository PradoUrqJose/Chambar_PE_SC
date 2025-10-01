import { json } from '@sveltejs/kit';
import { getOperations, createOperation } from '$lib/services/operations-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const operations = await getOperations(platform);
		return json(operations);
	} catch (error) {
		console.error('Error getting operations:', error);
		return json({ error: 'Error al obtener las operaciones' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		const result = await createOperation(platform, data);
		
		if (result.success) {
			return json({ message: 'Operación creada correctamente', id: result.id });
		} else {
			return json({ error: result.error || 'Error al crear la operación' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error creating operation:', error);
		return json({ error: 'Error al crear la operación' }, { status: 500 });
	}
};
