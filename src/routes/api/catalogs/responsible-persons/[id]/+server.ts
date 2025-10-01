import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateResponsiblePerson, deleteResponsiblePerson } from '$lib/db/catalog-mock-data';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		const updatedPerson = updateResponsiblePerson(id, data);
		if (!updatedPerson) {
			return json({ error: 'Responsable no encontrado' }, { status: 404 });
		}
		
		return json(updatedPerson);
	} catch (error) {
		return json({ error: 'Error al actualizar el responsable' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		const success = deleteResponsiblePerson(id);
		if (!success) {
			return json({ error: 'Responsable no encontrado' }, { status: 404 });
		}
		
		return json({ message: 'Responsable eliminado correctamente' });
	} catch (error) {
		return json({ error: 'Error al eliminar el responsable' }, { status: 500 });
	}
};
