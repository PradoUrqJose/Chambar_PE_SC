import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mockStands, addStand } from '$lib/db/catalog-mock-data';

export const GET: RequestHandler = async () => {
	return json(mockStands);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		const newStand = addStand({
			name: data.name,
			location: data.location,
			status: data.status || 'active'
		});
		
		return json(newStand, { status: 201 });
	} catch (error) {
		return json({ error: 'Error al crear el stand' }, { status: 500 });
	}
};