import { json } from '@sveltejs/kit';
import { reopenCashBox } from '$lib/services/cash-boxes-service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const { reopenedAt } = await request.json();
		
		const result = await reopenCashBox(platform, id, reopenedAt);
		
		if (result.success) {
			return json({ 
				message: 'Caja reabierta correctamente',
				reopenedAt: reopenedAt
			});
		} else {
			return json({ error: result.error || 'Error al reabrir la caja' }, { status: 500 });
		}

	} catch (error) {
		console.error('Error reopening cash box:', error);
		return json({ error: 'Error al reabrir la caja' }, { status: 500 });
	}
};
