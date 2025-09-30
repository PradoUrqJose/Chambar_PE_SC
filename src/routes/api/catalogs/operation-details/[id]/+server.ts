// Endpoint para gestionar un detalle de operación específico
// PUT /api/catalogs/operation-details/[id] - Actualizar detalle
// DELETE /api/catalogs/operation-details/[id] - Eliminar detalle

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateOperationDetail, deleteOperationDetail } from '$lib/server/catalogs/catalogs-service';
import { z } from 'zod';

// Esquema de validación para actualizar detalle
const updateOperationDetailSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').optional(),
	description: z.string().optional(),
	type: z.enum(['income', 'expense']).optional()
});

export const PUT: RequestHandler = async ({ params, request, locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	// Verificar permisos (solo admin)
	if (locals.user.role !== 'admin') {
		return json({ success: false, error: 'Sin permisos' }, { status: 403 });
	}
	
	try {
		const detailId = params.id;
		
		if (!detailId) {
			return json({
				success: false,
				error: 'ID de detalle requerido'
			}, { status: 400 });
		}
		
		const body = await request.json();
		
		// Validar datos
		const validationResult = updateOperationDetailSchema.safeParse(body);
		if (!validationResult.success) {
			return json({
				success: false,
				error: 'Datos inválidos',
				details: validationResult.error.flatten().fieldErrors
			}, { status: 400 });
		}
		
		const detailData = validationResult.data;
		
		// Actualizar detalle
		const result = await updateOperationDetail(platform, detailId, detailData);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error actualizando detalle de operación:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	// Verificar permisos (solo admin)
	if (locals.user.role !== 'admin') {
		return json({ success: false, error: 'Sin permisos' }, { status: 403 });
	}
	
	try {
		const detailId = params.id;
		
		if (!detailId) {
			return json({
				success: false,
				error: 'ID de detalle requerido'
			}, { status: 400 });
		}
		
		// Eliminar detalle
		const result = await deleteOperationDetail(platform, detailId);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error eliminando detalle de operación:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};
