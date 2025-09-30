// Endpoint para obtener la caja del día actual
// GET /api/cash-boxes/today

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTodayCashBox } from '$lib/server/cash-boxes/cash-box-service';

export const GET: RequestHandler = async ({ locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	try {
		const todayCashBox = await getTodayCashBox(platform);
		
		return json({
			success: true,
			data: todayCashBox
		});
		
	} catch (error) {
		console.error('Error obteniendo caja del día:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};
