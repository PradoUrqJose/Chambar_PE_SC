import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mockOperationDetails, addOperationDetail } from '$lib/db/catalog-mock-data';

export const GET: RequestHandler = async () => {
	return json(mockOperationDetails);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		const newDetail = addOperationDetail({
			name: data.name,
			type: data.type,
			category: data.category
		});
		
		return json(newDetail, { status: 201 });
	} catch (error) {
		return json({ error: 'Error al crear el detalle de operación' }, { status: 500 });
	}
};