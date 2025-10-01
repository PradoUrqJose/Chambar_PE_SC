import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock data para responsables
let mockResponsiblePersons = [
	{ id: '1', name: 'Juan Pérez', email: 'juan@example.com', phone: '999888777', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
	{ id: '2', name: 'María García', email: 'maria@example.com', phone: '999888666', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		const index = mockResponsiblePersons.findIndex(person => person.id === id);
		if (index === -1) {
			return json({ error: 'Responsable no encontrado' }, { status: 404 });
		}
		
		mockResponsiblePersons[index] = {
			...mockResponsiblePersons[index],
			...data,
			updatedAt: new Date().toISOString()
		};
		
		return json(mockResponsiblePersons[index]);
	} catch (error) {
		return json({ error: 'Error al actualizar el responsable' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		const index = mockResponsiblePersons.findIndex(person => person.id === id);
		if (index === -1) {
			return json({ error: 'Responsable no encontrado' }, { status: 404 });
		}
		
		mockResponsiblePersons.splice(index, 1);
		return json({ message: 'Responsable eliminado correctamente' });
	} catch (error) {
		return json({ error: 'Error al eliminar el responsable' }, { status: 500 });
	}
};
