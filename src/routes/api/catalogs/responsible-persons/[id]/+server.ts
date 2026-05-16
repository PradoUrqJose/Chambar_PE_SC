import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateResponsiblePerson, deleteResponsiblePerson } from '$lib/services/responsible-persons-service';

export const PUT: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		const result = await updateResponsiblePerson(platform!, id, data);
		if (!result.success) {
			return json({ error: result.error || 'Error al actualizar el responsable' }, { status: 500 });
		}
		
		return json({ success: true });
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al actualizar el responsable' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;
		
		const result = await deleteResponsiblePerson(platform!, id);
		if (!result.success) {
			return json({ error: result.error || 'Error al eliminar el responsable' }, { status: 500 });
		}
		
		return json({ message: 'Responsable eliminado correctamente' });
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al eliminar el responsable' }, { status: 500 });
	}
};
