// Endpoint para obtener métricas en tiempo real
// GET /api/reports/realtime-metrics

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRealtimeMetrics } from '$lib/server/reports/reports-service';

export const GET: RequestHandler = async ({ locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	try {
		const metrics = await getRealtimeMetrics(platform);
		return json({ success: true, data: metrics });
	} catch (error) {
		console.error('Error obteniendo métricas en tiempo real:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Error desconocido' 
		}, { status: 500 });
	}
};
