import { json } from '@sveltejs/kit';
import { openCashBox } from '$lib/services/cash-boxes-service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const { openingAmount = 0, openedAt } = await request.json();
		
		const result = await openCashBox(platform, id, openingAmount, openedAt);
		
		if (result.success) {
			return json({ message: 'Caja abierta correctamente' });
		} else {
			return json({ error: result.error || 'Error al abrir la caja' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error opening cash box:', error);
		return json({ error: 'Error al abrir la caja' }, { status: 500 });
	}
};
