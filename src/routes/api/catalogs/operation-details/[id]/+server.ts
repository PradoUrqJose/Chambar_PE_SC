import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateOperationDetail, deleteOperationDetail } from '$lib/services/operation-details-service';

export const PUT: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		const result = await updateOperationDetail(platform!, id, data);
		if (!result.success) {
			return json({ error: result.error || 'Error al actualizar el detalle' }, { status: 500 });
		}
		
		return json({ success: true });
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al actualizar el detalle de operación' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;
		
		const result = await deleteOperationDetail(platform!, id);
		if (!result.success) {
			return json({ error: result.error || 'Error al eliminar el detalle' }, { status: 500 });
		}
		
		return json({ message: 'Detalle de operación eliminado correctamente' });
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al eliminar el detalle de operación' }, { status: 500 });
	}
};
