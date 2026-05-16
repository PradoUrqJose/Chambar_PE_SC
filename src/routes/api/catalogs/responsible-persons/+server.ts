import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getResponsiblePersons, createResponsiblePerson } from '$lib/services/responsible-persons-service';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const persons = await getResponsiblePersons(platform!);
		return json(persons);
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al obtener responsables' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		const result = await createResponsiblePerson(platform!, data);
		
		if (result.success) {
			return json({ success: true, id: result.id }, { status: 201 });
		}
		return json({ error: result.error }, { status: 500 });
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al crear el responsable' }, { status: 500 });
	}
};