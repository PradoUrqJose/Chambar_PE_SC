import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStands, createStand } from '$lib/services/stands-service';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		console.log('📋 API: Obteniendo stands...');
		const stands = await getStands(platform);
		console.log('📋 API: Stands obtenidos:', stands.length);
		return json(stands);
	} catch (error) {
		console.error('❌ API: Error getting stands:', error);
		return json({ error: 'Error al obtener los stands' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		console.log('📋 API: Creando stand con data:', data);
		
		const result = await createStand(platform, {
			name: data.name,
			location: data.location,
			status: data.status
		});
		
		if (result.success && result.id) {
			// Obtener el stand completo para retornarlo
			const stands = await getStands(platform);
			const newStand = stands.find(s => s.id === result.id);
			
			console.log('✅ API: Stand creado:', newStand);
			return json(newStand, { status: 201 });
		} else {
			console.error('❌ API: Error al crear stand:', result.error);
			return json({ error: result.error || 'Error al crear el stand' }, { status: 500 });
		}
	} catch (error) {
		console.error('💥 API: Error creating stand:', error);
		return json({ error: 'Error al crear el stand' }, { status: 500 });
	}
};