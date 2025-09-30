// Endpoint para gestionar un stand específico
// PUT /api/catalogs/stands/[id] - Actualizar stand
// DELETE /api/catalogs/stands/[id] - Eliminar stand

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateStand, deleteStand } from '$lib/server/catalogs/catalogs-service';
import { z } from 'zod';

// Esquema de validación para actualizar stand
const updateStandSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').optional(),
	description: z.string().optional(),
	location: z.string().optional()
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
		const standId = params.id;
		
		if (!standId) {
			return json({
				success: false,
				error: 'ID de stand requerido'
			}, { status: 400 });
		}
		
		const body = await request.json();
		
		// Validar datos
		const validationResult = updateStandSchema.safeParse(body);
		if (!validationResult.success) {
			return json({
				success: false,
				error: 'Datos inválidos',
				details: validationResult.error.flatten().fieldErrors
			}, { status: 400 });
		}
		
		const standData = validationResult.data;
		
		// Actualizar stand
		const result = await updateStand(platform, standId, standData);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error actualizando stand:', error);
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
		const standId = params.id;
		
		if (!standId) {
			return json({
				success: false,
				error: 'ID de stand requerido'
			}, { status: 400 });
		}
		
		// Eliminar stand
		const result = await deleteStand(platform, standId);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error eliminando stand:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};
