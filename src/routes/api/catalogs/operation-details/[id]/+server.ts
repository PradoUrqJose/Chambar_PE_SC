import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateOperationDetail, deleteOperationDetail } from '$lib/db/catalog-mock-data';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		const updatedDetail = updateOperationDetail(id, data);
		if (!updatedDetail) {
			return json({ error: 'Detalle de operación no encontrado' }, { status: 404 });
		}
		
		return json(updatedDetail);
	} catch (error) {
		return json({ error: 'Error al actualizar el detalle de operación' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		const success = deleteOperationDetail(id);
		if (!success) {
			return json({ error: 'Detalle de operación no encontrado' }, { status: 404 });
		}
		
		return json({ message: 'Detalle de operación eliminado correctamente' });
	} catch (error) {
		return json({ error: 'Error al eliminar el detalle de operación' }, { status: 500 });
	}
};
