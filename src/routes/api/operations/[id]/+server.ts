import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ platform, params }) => {
	try {
		const operationId = params.id;
		if (!operationId) {
			return json({ error: 'ID de operación requerido' }, { status: 400 });
		}

		// En modo desarrollo, eliminar de mock data
		if (!platform?.env?.DB) {
			const { deleteMockOperation } = await import('$lib/db/mock-data');
			const success = deleteMockOperation(operationId);

			if (success) {
				return json({ message: 'Operación eliminada correctamente' });
			} else {
				return json({ error: 'Operación no encontrada' }, { status: 404 });
			}
		}

		// En producción, eliminar de D1
		const result = await platform.env.DB.prepare(`DELETE FROM operations WHERE id = ?`)
			.bind(operationId)
			.run();

		if (result.changes > 0) {
			return json({ message: 'Operación eliminada correctamente' });
		} else {
			return json({ error: 'Operación no encontrada' }, { status: 404 });
		}
	} catch (error) {
		console.error('Error deleting operation:', error);
		return json({ error: 'Error al eliminar la operación' }, { status: 500 });
	}
};
