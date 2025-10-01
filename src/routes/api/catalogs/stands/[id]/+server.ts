import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateStand, deleteStand } from '$lib/db/catalog-mock-data';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		const updatedStand = updateStand(id, data);
		if (!updatedStand) {
			return json({ error: 'Stand no encontrado' }, { status: 404 });
		}
		
		return json(updatedStand);
	} catch (error) {
		return json({ error: 'Error al actualizar el stand' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		const success = deleteStand(id);
		if (!success) {
			return json({ error: 'Stand no encontrado' }, { status: 404 });
		}
		
		return json({ message: 'Stand eliminado correctamente' });
	} catch (error) {
		return json({ error: 'Error al eliminar el stand' }, { status: 500 });
	}
};
