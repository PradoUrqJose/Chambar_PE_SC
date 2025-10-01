import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock data para stands
let mockStands = [
	{ id: 'stand-1', name: 'Stand A', location: 'Zona Norte', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
	{ id: 'stand-2', name: 'Stand B', location: 'Zona Sur', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

// Función para generar ID único
function generateUniqueId() {
	return 'stand-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export const GET: RequestHandler = async () => {
	return json(mockStands);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		const newStand = {
			id: generateUniqueId(),
			name: data.name,
			location: data.location,
			status: data.status || 'active',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		
		mockStands.push(newStand);
		return json(newStand, { status: 201 });
	} catch (error) {
		return json({ error: 'Error al crear el stand' }, { status: 500 });
	}
};