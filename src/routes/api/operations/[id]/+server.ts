// Endpoint para operaciones específicas
// DELETE /api/operations/[id] - Eliminar operación

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteOperation, getOperationById } from '$lib/server/operations/operations-service';

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	// Verificar permisos
	if (locals.user.role !== 'admin' && locals.user.role !== 'cashier') {
		return json({ success: false, error: 'Sin permisos' }, { status: 403 });
	}
	
	try {
		const operationId = params.id;
		
		if (!operationId) {
			return json({
				success: false,
				error: 'ID de operación requerido'
			}, { status: 400 });
		}
		
		// Eliminar operación
		const result = await deleteOperation(platform, operationId, locals.user.id);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error eliminando operación:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ params, locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	try {
		const operationId = params.id;
		
		if (!operationId) {
			return json({
				success: false,
				error: 'ID de operación requerido'
			}, { status: 400 });
		}
		
		// Obtener operación
		const operation = await getOperationById(platform, operationId);
		
		if (!operation) {
			return json({
				success: false,
				error: 'Operación no encontrada'
			}, { status: 404 });
		}
		
		return json({
			success: true,
			data: operation
		});
		
	} catch (error) {
		console.error('Error obteniendo operación:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};
