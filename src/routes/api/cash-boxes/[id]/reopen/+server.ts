import { json } from '@sveltejs/kit';
import { reopenCashBox } from '$lib/services/cash-boxes-service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const body = await request.json();
		const reopenedAt = body?.reopenedAt || new Date().toISOString();
		const options = {
			resetCurrentAmount: body?.resetCurrentAmount ?? false,
			reopenReason: body?.reopenType,
			allocationNote: body?.allocationNote
		};

		const result = await reopenCashBox(platform, id, reopenedAt, options);
		
		if (result.success) {
			return json({ 
				message: 'Caja reabierta correctamente',
				reopenedAt,
				options
			});
		} else {
			return json({ error: result.error || 'Error al reabrir la caja' }, { status: 500 });
		}

	} catch (error) {
		console.error('Error reopening cash box:', error);
		return json({ error: 'Error al reabrir la caja' }, { status: 500 });
	}
};
