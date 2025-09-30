// Endpoint para exportar reporte de operaciones a Excel
// GET /api/reports/export/operations?start=YYYY-MM-DD&end=YYYY-MM-DD

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
		
		// Crear CSV simple
		const csvContent = createOperationsReportCSV(report, startDate, endDate);
		
		return new Response(csvContent, {
			headers: {
				'Content-Type': 'text/csv',
				'Content-Disposition': `attachment; filename="reporte-operaciones-${startDate}-${endDate}.csv`
			}
		});
	} catch (error) {
		console.error('Error exportando reporte de operaciones:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Error desconocido' 
		}, { status: 500 });
	}
};

function createOperationsReportCSV(report: any, startDate: string, endDate: string): string {
	const lines = [];
	
	// Encabezado
	lines.push(`REPORTE DE OPERACIONES - ${startDate} a ${endDate}`);
	lines.push('');
	lines.push('MÉTRICAS GENERALES');
	lines.push('Total Operaciones,' + report.totalOperations);
	lines.push('Total Ingresos,' + (report.totalIncome / 100).toFixed(2));
	lines.push('Total Egresos,' + (report.totalExpense / 100).toFixed(2));
	lines.push('Neto,' + (report.netAmount / 100).toFixed(2));
	lines.push('');
	
	// Operaciones por tipo
	lines.push('OPERACIONES POR TIPO');
	lines.push('Tipo,Cantidad,Total');
	report.operationsByType.forEach((item: any) => {
		lines.push([
			item.type === 'income' ? 'Ingreso' : 'Egreso',
			item.count,
			(item.total / 100).toFixed(2)
		].join(','));
	});
	lines.push('');
	
	// Operaciones por detalle
	lines.push('OPERACIONES POR DETALLE');
	lines.push('Detalle,Cantidad,Total');
	report.operationsByDetail.forEach((item: any) => {
		lines.push([
			item.detailName,
			item.count,
			(item.total / 100).toFixed(2)
		].join(','));
	});
	
	return lines.join('\n');
}
