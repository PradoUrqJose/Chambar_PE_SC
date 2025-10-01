import { json } from '@sveltejs/kit';
import { getResponsiblePersons, createResponsiblePerson } from '$lib/services/responsible-persons-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		console.log('GET /api/catalogs/responsible-persons - Iniciando...');
		const responsiblePersons = await getResponsiblePersons(platform);
		console.log('GET /api/catalogs/responsible-persons - Datos obtenidos:', responsiblePersons);
		return json(responsiblePersons);
	} catch (error) {
		console.error('Error getting responsible persons:', error);
		return json({ error: 'Error al obtener los responsables' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		const result = await createResponsiblePerson(platform, data);
		
		if (result.success) {
			return json({ message: 'Responsable creado correctamente', id: result.id });
		} else {
			return json({ error: result.error || 'Error al crear el responsable' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error creating responsible person:', error);
		return json({ error: 'Error al crear el responsable' }, { status: 500 });
	}
};
