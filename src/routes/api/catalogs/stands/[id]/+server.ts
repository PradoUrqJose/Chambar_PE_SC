import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock data para stands
let mockStands = [
	{ id: '1', name: 'Stand A', location: 'Zona Norte', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
	{ id: '2', name: 'Stand B', location: 'Zona Sur', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		const index = mockStands.findIndex(stand => stand.id === id);
		if (index === -1) {
			return json({ error: 'Stand no encontrado' }, { status: 404 });
		}
		
		mockStands[index] = {
			...mockStands[index],
			...data,
			updatedAt: new Date().toISOString()
		};
		
		return json(mockStands[index]);
	} catch (error) {
		return json({ error: 'Error al actualizar el stand' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		const index = mockStands.findIndex(stand => stand.id === id);
		if (index === -1) {
			return json({ error: 'Stand no encontrado' }, { status: 404 });
		}
		
		mockStands.splice(index, 1);
		return json({ message: 'Stand eliminado correctamente' });
	} catch (error) {
		return json({ error: 'Error al eliminar el stand' }, { status: 500 });
	}
};
