import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock data para responsables
let mockResponsiblePersons = [
	{ id: '1', name: 'Juan Pérez', email: 'juan@example.com', phone: '999888777', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
	{ id: '2', name: 'María García', email: 'maria@example.com', phone: '999888666', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const GET: RequestHandler = async () => {
	return json(mockResponsiblePersons);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		const newPerson = {
			id: 'person-' + Date.now(),
			name: data.name,
			email: data.email,
			phone: data.phone,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		
		mockResponsiblePersons.push(newPerson);
		return json(newPerson, { status: 201 });
	} catch (error) {
		return json({ error: 'Error al crear el responsable' }, { status: 500 });
	}
};