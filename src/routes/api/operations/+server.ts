import { json } from '@sveltejs/kit';
import { getOperations, createOperation } from '$lib/services/operations-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, url }) => {
	try {
		const date = url.searchParams.get('date');
		const limit = url.searchParams.get('limit');
		
		let operations = await getOperations(platform, date || undefined);
		
		// Aplicar límite si se proporciona
		const limitNum = limit ? parseInt(limit) : operations.length;
		const limitedOperations = operations.slice(0, limitNum);
		
		return json({
			operations: limitedOperations,
			total: operations.length
		});
	} catch (error) {
		console.error('Error getting operations:', error);
		return json({ error: 'Error al obtener las operaciones' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		
		// Si se proporciona createdAt y updatedAt, usarlos; si no, usar fecha actual
		const operationData = {
			...data,
			createdAt: data.createdAt || new Date().toISOString(),
			updatedAt: data.updatedAt || new Date().toISOString()
		};
		
		const result = await createOperation(platform, operationData);
		
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
