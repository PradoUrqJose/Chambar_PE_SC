// Endpoint para gestionar operaciones
// GET /api/operations - Obtener operaciones
// POST /api/operations - Crear operación

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOperations, createOperation } from '$lib/server/operations/operations-service';
import { z } from 'zod';

// Esquema de validación para crear operación
const createOperationSchema = z.object({
	type: z.enum(['income', 'expense'], {
		errorMap: () => ({ message: 'El tipo debe ser income o expense' })
	}),
	amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
	operationDetailId: z.string().min(1, 'Debe seleccionar un detalle de operación'),
	responsibleId: z.string().min(1, 'Debe seleccionar un responsable'),
	standId: z.string().min(1, 'Debe seleccionar un stand'),
	companyId: z.string().optional(),
	description: z.string().optional(),
	voucherNumber: z.string().optional(),
	paymentMethod: z.enum(['cash', 'card', 'transfer', 'check']).default('cash')
});

export const GET: RequestHandler = async ({ url, locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	try {
		// Obtener parámetros de filtro
		const type = url.searchParams.get('type') as 'income' | 'expense' | undefined;
		const date = url.searchParams.get('date') || undefined;
		const search = url.searchParams.get('search') || undefined;
		
		const operations = await getOperations(platform, {
			type,
			date,
			search
		});
		
		return json({
			success: true,
			data: operations
		});
		
	} catch (error) {
		console.error('Error obteniendo operaciones:', error);
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
	
	// Verificar permisos
	if (locals.user.role !== 'admin' && locals.user.role !== 'cashier') {
		return json({ success: false, error: 'Sin permisos' }, { status: 403 });
	}
	
	try {
		const body = await request.json();
		
		// Validar datos
		const validationResult = createOperationSchema.safeParse(body);
		if (!validationResult.success) {
			return json({
				success: false,
				error: 'Datos inválidos',
				details: validationResult.error.flatten().fieldErrors
			}, { status: 400 });
		}
		
		const operationData = validationResult.data;
		
		// Crear operación
		const result = await createOperation(platform, operationData, locals.user.id);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error en endpoint de operaciones:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};
