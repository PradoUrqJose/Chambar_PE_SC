import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateCompany, deleteCompany } from '$lib/db/catalog-mock-data';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		const updatedCompany = updateCompany(id, data);
		if (!updatedCompany) {
			return json({ error: 'Empresa no encontrada' }, { status: 404 });
		}
		
		return json(updatedCompany);
	} catch (error) {
		return json({ error: 'Error al actualizar la empresa' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		const success = deleteCompany(id);
		if (!success) {
			return json({ error: 'Empresa no encontrada' }, { status: 404 });
		}
		
		return json({ message: 'Empresa eliminada correctamente' });
	} catch (error) {
		return json({ error: 'Error al eliminar la empresa' }, { status: 500 });
	}
};
