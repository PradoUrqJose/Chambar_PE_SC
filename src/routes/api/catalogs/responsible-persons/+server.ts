import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mockResponsiblePersons, addResponsiblePerson } from '$lib/db/catalog-mock-data';

export const GET: RequestHandler = async () => {
	return json(mockResponsiblePersons);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		const newPerson = addResponsiblePerson({
			name: data.name,
			email: data.email,
			phone: data.phone
		});
		
		return json(newPerson, { status: 201 });
	} catch (error) {
		return json({ error: 'Error al crear el responsable' }, { status: 500 });
	}
};