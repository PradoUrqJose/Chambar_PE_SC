// Endpoint para configurar la base de datos en desarrollo
// ⚠️ SOLO USAR EN DESARROLLO - NUNCA EN PRODUCCIÓN

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getD1Database } from '$lib/server/db/d1';
import { seedDevAdmin, seedInitialData } from '$lib/server/db/local-dev';

// POST /api/setup - Configura la base de datos
export const POST: RequestHandler = async ({ platform }) => {
	// Verificar que estamos en desarrollo
	if (process.env.NODE_ENV === 'production') {
		return json({ error: 'No disponible en producción' }, { status: 403 });
	}
	
	try {
		// Configurar base de datos de desarrollo
		const db = getD1Database(platform);
		
		// Crear usuario admin
		await seedDevAdmin();
		
		// Crear datos iniciales de catálogos
		await seedInitialData();
		
		return json({ 
			success: true, 
			message: 'Base de datos de desarrollo configurada correctamente',
			credentials: {
				email: 'admin@chambar.com',
				password: 'admin123'
			}
		});
	} catch (error) {
		console.error('Error configurando base de datos:', error);
		return json({ 
			error: 'Error configurando base de datos',
			details: error instanceof Error ? error.message : 'Error desconocido'
		}, { status: 500 });
	}
};
