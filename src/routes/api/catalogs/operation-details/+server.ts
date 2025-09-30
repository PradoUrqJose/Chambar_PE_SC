// Endpoint para gestionar detalles de operación
// GET /api/catalogs/operation-details - Obtener detalles
// POST /api/catalogs/operation-details - Crear detalle
// PUT /api/catalogs/operation-details/[id] - Actualizar detalle
// DELETE /api/catalogs/operation-details/[id] - Eliminar detalle

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getD1Database } from '$lib/server/db/d1';
import { operationDetails } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createOperationDetail, updateOperationDetail, deleteOperationDetail } from '$lib/server/catalogs/catalogs-service';
import { z } from 'zod';
import { mockData } from '$lib/server/dev-fallback';

// Esquema de validación para crear/actualizar detalle
const operationDetailSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	description: z.string().optional(),
	type: z.enum(['income', 'expense'], {
		errorMap: () => ({ message: 'El tipo debe ser income o expense' })
	})
});

export const GET: RequestHandler = async ({ url, locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	// Fallback para desarrollo local - forzar modo desarrollo
	const isLocalDev = true; // Forzar modo desarrollo por ahora
	
	if (isLocalDev) {
		console.log('🔧 Modo desarrollo - retornando detalles de operación mock');
		return json({ success: true, data: mockData.operationDetails });
	}
	
	try {
		const db = getD1Database(platform);
		const type = url.searchParams.get('type') as 'income' | 'expense' | undefined;
		
		let query = db.select().from(operationDetails).where(eq(operationDetails.active, true));
		
		if (type) {
			query = query.where(eq(operationDetails.type, type));
		}
		
		const details = await query;
		
		return json({
			success: true,
			data: details
		});
		
	} catch (error) {
		console.error('Error obteniendo detalles de operación:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	// Verificar permisos (solo admin)
	if (locals.user.role !== 'admin') {
		return json({ success: false, error: 'Sin permisos' }, { status: 403 });
	}
	
	try {
		const body = await request.json();
		
		// Validar datos
		const validationResult = operationDetailSchema.safeParse(body);
		if (!validationResult.success) {
			return json({
				success: false,
				error: 'Datos inválidos',
				details: validationResult.error.flatten().fieldErrors
			}, { status: 400 });
		}
		
		const detailData = validationResult.data;
		
		// Crear detalle
		const result = await createOperationDetail(platform, detailData);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error en endpoint de detalles de operación:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};