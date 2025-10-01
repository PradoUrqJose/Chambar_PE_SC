import { json } from '@sveltejs/kit';
import { getCashBoxes, createCashBox } from '$lib/services/cash-boxes-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const cashBoxes = await getCashBoxes(platform);
		return json(cashBoxes);
	} catch (error) {
		console.error('Error getting cash boxes:', error);
		return json({ error: 'Error al obtener las cajas' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		console.log('📦 API: Creando caja con data:', data);
		
		const result = await createCashBox(platform, data);
		
		if (result.success && result.id) {
			// Obtener la caja completa para retornarla
			const cashBoxes = await getCashBoxes(platform);
			const newCashBox = cashBoxes.find(cb => cb.id === result.id);
			
			console.log('✅ API: Caja creada:', newCashBox);
			return json(newCashBox);
		} else {
			console.error('❌ API: Error al crear caja:', result.error);
			return json({ error: result.error || 'Error al crear la caja' }, { status: 500 });
		}
	} catch (error) {
		console.error('💥 API: Error creating cash box:', error);
		return json({ error: 'Error al crear la caja' }, { status: 500 });
	}
};
