// Endpoint para obtener resumen diario
// GET /api/reports/daily-summary?date=YYYY-MM-DD

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDailySummary } from '$lib/server/reports/reports-service';

export const GET: RequestHandler = async ({ url, locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	try {
		const date = url.searchParams.get('date');
		if (!date) {
			return json({ success: false, error: 'Parámetro date es requerido' }, { status: 400 });
		}
		
		// Validar formato de fecha
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(date)) {
			return json({ success: false, error: 'Formato de fecha inválido. Use YYYY-MM-DD' }, { status: 400 });
		}
		
		const summary = await getDailySummary(platform, date);
		return json({ success: true, data: summary });
	} catch (error) {
		console.error('Error obteniendo resumen diario:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Error desconocido' 
		}, { status: 500 });
	}
};
