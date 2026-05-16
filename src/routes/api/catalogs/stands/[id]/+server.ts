import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateStand, deleteStand } from '$lib/services/stands-service';

export const PUT: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		const result = await updateStand(platform!, id, data);
		if (!result.success) {
			return json({ error: result.error || 'Error al actualizar el stand' }, { status: 500 });
		}
		
		return json({ success: true });
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al actualizar el stand' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;
		
		const result = await deleteStand(platform!, id);
		if (!result.success) {
			return json({ error: result.error || 'Error al eliminar el stand' }, { status: 500 });
		}
		
		return json({ message: 'Stand eliminado correctamente' });
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al eliminar el stand' }, { status: 500 });
	}
};
