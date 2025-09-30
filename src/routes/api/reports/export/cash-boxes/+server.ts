// Endpoint para exportar reporte de cajas a Excel
// GET /api/reports/export/cash-boxes?start=YYYY-MM-DD&end=YYYY-MM-DD

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCashBoxesReport } from '$lib/server/reports/reports-service';

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
		
		const report = await getCashBoxesReport(platform, startDate, endDate);
		
		// Crear CSV simple
		const csvContent = createCashBoxesReportCSV(report, startDate, endDate);
		
		return new Response(csvContent, {
			headers: {
				'Content-Type': 'text/csv',
				'Content-Disposition': `attachment; filename="reporte-cajas-${startDate}-${endDate}.csv`
			}
		});
	} catch (error) {
		console.error('Error exportando reporte de cajas:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Error desconocido' 
		}, { status: 500 });
	}
};

function createCashBoxesReportCSV(report: any, startDate: string, endDate: string): string {
	const lines = [];
	
	// Encabezado
	lines.push(`REPORTE DE CAJAS - ${startDate} a ${endDate}`);
	lines.push('');
	lines.push('MÉTRICAS GENERALES');
	lines.push('Total Cajas,' + report.totalCashBoxes);
	lines.push('Cajas Abiertas,' + report.openCashBoxes);
	lines.push('Cajas Cerradas,' + report.closedCashBoxes);
	lines.push('Total Monto Inicial,' + (report.totalInitialAmount / 100).toFixed(2));
	lines.push('Total Monto Final,' + (report.totalFinalAmount / 100).toFixed(2));
	lines.push('');
	
	// Detalles de cajas
	lines.push('DETALLES DE CAJAS');
	lines.push('Fecha,Estado,Monto Inicial,Monto Final,Abierta por,Cerrada por');
	
	report.cashBoxes.forEach((cb: any) => {
		lines.push([
			cb.date,
			cb.status === 'open' ? 'Abierta' : cb.status === 'closed' ? 'Cerrada' : 'Editada',
			(cb.initialAmount / 100).toFixed(2),
			cb.finalAmount ? (cb.finalAmount / 100).toFixed(2) : 'N/A',
			cb.openedBy,
			cb.closedBy || 'N/A'
		].join(','));
	});
	
	return lines.join('\n');
}
