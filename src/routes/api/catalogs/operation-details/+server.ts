import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock data para detalles de operación
let mockOperationDetails = [
	{ id: '1', name: 'Venta', type: 'income', category: 'Ventas', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
	{ id: '2', name: 'Compra', type: 'expense', category: 'Compras', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const GET: RequestHandler = async () => {
	return json(mockOperationDetails);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		const newDetail = {
			id: 'detail-' + Date.now(),
			name: data.name,
			type: data.type,
			category: data.category,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		
		mockOperationDetails.push(newDetail);
		return json(newDetail, { status: 201 });
	} catch (error) {
		return json({ error: 'Error al crear el detalle de operación' }, { status: 500 });
	}
};