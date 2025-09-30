// Endpoint para exportar resumen diario a Excel
// GET /api/reports/export/daily-summary?date=YYYY-MM-DD

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
		
		// Crear CSV simple (por ahora, luego se puede mejorar con una librería de Excel)
		const csvContent = createDailySummaryCSV(summary, date);
		
		return new Response(csvContent, {
			headers: {
				'Content-Type': 'text/csv',
				'Content-Disposition': `attachment; filename="resumen-diario-${date}.csv"`
			}
		});
	} catch (error) {
		console.error('Error exportando resumen diario:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Error desconocido' 
		}, { status: 500 });
	}
};

function createDailySummaryCSV(summary: any, date: string): string {
	const lines = [];
	
	// Encabezado
	lines.push('RESUMEN DIARIO - ' + date);
	lines.push('');
	lines.push('MÉTRICAS GENERALES');
	lines.push('Total Ingresos,' + (summary.totalIncome / 100).toFixed(2));
	lines.push('Total Egresos,' + (summary.totalExpense / 100).toFixed(2));
	lines.push('Neto del Día,' + (summary.netAmount / 100).toFixed(2));
	lines.push('');
	
	// Detalles de operaciones
	lines.push('DETALLES DE OPERACIONES');
	lines.push('Tipo,Detalle,Monto,Responsable,Hora');
	
	summary.operations.forEach((op: any) => {
		lines.push([
			op.type === 'income' ? 'Ingreso' : 'Egreso',
			op.detailName,
			(op.amount / 100).toFixed(2),
			op.responsibleName,
			new Date(op.operationDate).toLocaleTimeString('es-PE')
		].join(','));
	});
	
	return lines.join('\n');
}
