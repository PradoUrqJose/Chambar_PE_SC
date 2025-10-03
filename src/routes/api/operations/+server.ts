import { json } from '@sveltejs/kit';
import { getOperations, createOperation, updateOperation } from '$lib/services/operations-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, url }) => {
	try {
		const date = url.searchParams.get('date');
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');
		const cashBoxId = url.searchParams.get('cashBoxId');
		const limit = url.searchParams.get('limit');
		
		console.log('📋 API: Obteniendo operaciones...', { date, startDate, endDate, cashBoxId, limit });
		
		let operations = await getOperations(platform, date || undefined);
		console.log('📋 API: Operaciones obtenidas:', operations.length);
		
		// Filtrar por cashBoxId si se proporciona
		if (cashBoxId) {
			console.log('📋 API: Filtrando por cashBoxId:', cashBoxId);
			operations = operations.filter(op => op.cashBoxId === cashBoxId);
			console.log('📋 API: Operaciones filtradas por caja:', operations.length);
		}
		
		// Filtrar por rango de fechas si se proporcionan
		if (startDate && endDate) {
			console.log('📋 API: Filtrando por rango de fechas:', { startDate, endDate });
			operations = operations.filter(op => {
				const opDate = op.businessDate || op.createdAt.split('T')[0];
				return opDate >= startDate && opDate <= endDate;
			});
			console.log('📋 API: Operaciones filtradas:', operations.length);
		}
		
		// Aplicar límite si se proporciona
		const limitNum = limit ? parseInt(limit) : operations.length;
		const limitedOperations = operations.slice(0, limitNum);
		
		console.log('📋 API: Operaciones finales:', limitedOperations.length);
		
		return json({
			operations: limitedOperations,
			total: operations.length
		});
	} catch (error) {
		console.error('❌ API: Error getting operations:', error);
		return json({ error: 'Error al obtener las operaciones' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		console.log('📋 API: Creando operación con data:', data);
		
		// Si se proporciona createdAt y updatedAt, usarlos; si no, usar fecha actual
		const operationData = {
			...data,
			createdAt: data.createdAt || new Date().toISOString(),
			updatedAt: data.updatedAt || new Date().toISOString()
		};
		
		const result = await createOperation(platform, operationData);
		
		if (result.success) {
			console.log('✅ API: Operación creada:', result.id);
			return json({ message: 'Operación creada correctamente', id: result.id });
		} else {
			console.error('❌ API: Error al crear operación:', result.error);
			return json({ error: result.error || 'Error al crear la operación' }, { status: 500 });
		}
	} catch (error) {
		console.error('💥 API: Error creating operation:', error);
		return json({ error: 'Error al crear la operación' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, platform, url }) => {
	try {
		const operationId = url.searchParams.get('id');
		if (!operationId) {
			return json({ error: 'ID de operación requerido' }, { status: 400 });
		}

		const data = await request.json();
		
		// Actualizar timestamp
		const operationData = {
			...data,
			updatedAt: new Date().toISOString()
		};
		
		const result = await updateOperation(platform, operationId, operationData);
		
		if (result.success) {
			return json({ message: 'Operación actualizada correctamente' });
		} else {
			return json({ error: result.error || 'Error al actualizar la operación' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error updating operation:', error);
		return json({ error: 'Error al actualizar la operación' }, { status: 500 });
	}
};
