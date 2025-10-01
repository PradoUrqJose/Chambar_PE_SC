import { json } from '@sveltejs/kit';
import { closeCashBox } from '$lib/services/cash-boxes-service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;
		
		const result = await closeCashBox(platform, id);
		
		if (result.success) {
			return json({ message: 'Caja cerrada correctamente' });
		} else {
			return json({ error: result.error || 'Error al cerrar la caja' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error closing cash box:', error);
		return json({ error: 'Error al cerrar la caja' }, { status: 500 });
	}
};
