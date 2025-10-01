import { json } from '@sveltejs/kit';
import { reopenCashBox } from '$lib/services/cash-boxes-service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		
		// Intentar obtener reopenedAt del body, si no existe usar la fecha actual
		let reopenedAt;
		try {
			const body = await request.json();
			reopenedAt = body.reopenedAt;
		} catch (jsonError) {
			// Si no hay body JSON, usar la fecha actual
			reopenedAt = new Date().toISOString();
		}
		
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
