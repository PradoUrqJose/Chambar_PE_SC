// Endpoint para abrir una caja
// POST /api/cash-boxes/open

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { openCashBox } from '$lib/server/cash-boxes/cash-box-service';
import { z } from 'zod';

// Esquema de validación para apertura de caja
const openCashBoxSchema = z.object({
	initialAmount: z.number().min(0, 'El monto inicial debe ser mayor o igual a 0'),
	notes: z.string().optional()
});

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
		const validationResult = openCashBoxSchema.safeParse(body);
		if (!validationResult.success) {
			return json({
				success: false,
				error: 'Datos inválidos',
				details: validationResult.error.flatten().fieldErrors
			}, { status: 400 });
		}
		
		const { initialAmount, notes } = validationResult.data;
		
		// Abrir caja
		const result = await openCashBox(
			platform,
			{ initialAmount, notes },
			locals.user.id
		);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error en endpoint de apertura de caja:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};
