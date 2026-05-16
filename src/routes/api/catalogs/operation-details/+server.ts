import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOperationDetails, createOperationDetail } from '$lib/services/operation-details-service';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const details = await getOperationDetails(platform!);
		return json(details);
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al obtener los detalles de operación' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		const result = await createOperationDetail(platform!, data);
		
		if (result.success) {
			return json({ success: true, id: result.id }, { status: 201 });
		}
		return json({ error: result.error }, { status: 500 });
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al crear el detalle de operación' }, { status: 500 });
	}
};