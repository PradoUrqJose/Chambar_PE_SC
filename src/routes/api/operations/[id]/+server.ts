import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteOperation } from '$lib/services/operations-service';

export const DELETE: RequestHandler = async ({ platform, params }) => {
	try {
		const operationId = params.id;
		if (!operationId) {
			return json({ error: 'ID de operación requerido' }, { status: 400 });
		}

		if (!platform) {
			return json({ error: 'Platform not available' }, { status: 500 });
		}

		const result = await deleteOperation(platform, operationId);

		if (result.success) {
			return json({ message: 'Operación eliminada correctamente' });
		} else {
			return json({ error: result.error || 'Operación no encontrada' }, { status: 404 });
		}
	} catch (error) {
		console.error('Error deleting operation:', error);
		return json({ error: 'Error al eliminar la operación' }, { status: 500 });
	}
};
