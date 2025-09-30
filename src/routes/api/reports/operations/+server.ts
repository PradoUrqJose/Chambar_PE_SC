// Endpoint para obtener reporte de operaciones
// GET /api/reports/operations?start=YYYY-MM-DD&end=YYYY-MM-DD

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOperationsReport } from '$lib/server/reports/reports-service';

export const GET: RequestHandler = async ({ url, locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	try {
		const startDate = url.searchParams.get('start');
		const endDate = url.searchParams.get('end');
		
		if (!startDate || !endDate) {
			return json({ success: false, error: 'Parámetros start y end son requeridos' }, { status: 400 });
		}
		
		// Validar formato de fechas
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
			return json({ success: false, error: 'Formato de fecha inválido. Use YYYY-MM-DD' }, { status: 400 });
		}
		
		// Validar que startDate <= endDate
		if (new Date(startDate) > new Date(endDate)) {
			return json({ success: false, error: 'La fecha de inicio debe ser menor o igual a la fecha de fin' }, { status: 400 });
		}
		
		const report = await getOperationsReport(platform, startDate, endDate);
		return json({ success: true, data: report });
	} catch (error) {
		console.error('Error obteniendo reporte de operaciones:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Error desconocido' 
		}, { status: 500 });
	}
};
