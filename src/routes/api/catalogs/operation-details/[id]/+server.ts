import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock data para detalles de operación
let mockOperationDetails = [
	{ id: '1', name: 'Venta', type: 'income', category: 'Ventas', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
	{ id: '2', name: 'Compra', type: 'expense', category: 'Compras', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		const index = mockOperationDetails.findIndex(detail => detail.id === id);
		if (index === -1) {
			return json({ error: 'Detalle de operación no encontrado' }, { status: 404 });
		}
		
		mockOperationDetails[index] = {
			...mockOperationDetails[index],
			...data,
			updatedAt: new Date().toISOString()
		};
		
		return json(mockOperationDetails[index]);
	} catch (error) {
		return json({ error: 'Error al actualizar el detalle de operación' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		const index = mockOperationDetails.findIndex(detail => detail.id === id);
		if (index === -1) {
			return json({ error: 'Detalle de operación no encontrado' }, { status: 404 });
		}
		
		mockOperationDetails.splice(index, 1);
		return json({ message: 'Detalle de operación eliminado correctamente' });
	} catch (error) {
		return json({ error: 'Error al eliminar el detalle de operación' }, { status: 500 });
	}
};
