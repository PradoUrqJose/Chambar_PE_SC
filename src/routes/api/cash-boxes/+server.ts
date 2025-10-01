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
		const result = await createCashBox(platform, data);
		
		if (result.success) {
			return json({ message: 'Caja creada correctamente', id: result.id });
		} else {
			return json({ error: result.error || 'Error al crear la caja' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error creating cash box:', error);
		return json({ error: 'Error al crear la caja' }, { status: 500 });
	}
};
