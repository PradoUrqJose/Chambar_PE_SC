import { json } from '@sveltejs/kit';
import { getOperationDetails, createOperationDetail } from '$lib/services/operation-details-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		console.log('GET /api/catalogs/operation-details - Iniciando...');
		const operationDetails = await getOperationDetails(platform);
		console.log('GET /api/catalogs/operation-details - Datos obtenidos:', operationDetails);
		return json(operationDetails);
	} catch (error) {
		console.error('Error getting operation details:', error);
		return json({ error: 'Error al obtener los detalles de operación' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		const result = await createOperationDetail(platform, data);
		
		if (result.success) {
			return json({ message: 'Detalle de operación creado correctamente', id: result.id });
		} else {
			return json({ error: result.error || 'Error al crear el detalle de operación' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error creating operation detail:', error);
		return json({ error: 'Error al crear el detalle de operación' }, { status: 500 });
	}
};
