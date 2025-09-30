// Endpoint para configurar D1 en producción
// POST /api/setup-d1

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { seedD1Data, testD1Connection } from '$lib/server/db/d1';

export const POST: RequestHandler = async ({ platform }) => {
	try {
		// Verificar conexión a D1
		const isConnected = await testD1Connection(platform);
		if (!isConnected) {
			return json({ 
				success: false, 
				error: 'No se pudo conectar a la base de datos D1' 
			}, { status: 500 });
		}
		
		// Inicializar datos
		await seedD1Data(platform);
		
		return json({
			success: true,
			message: 'Base de datos D1 configurada correctamente',
			credentials: {
				email: 'admin@chambar.com',
				password: 'admin123'
			}
		});
	} catch (error) {
		console.error('Error configurando D1:', error);
		return json({
			success: false,
			error: 'Error configurando base de datos D1',
			details: error instanceof Error ? error.message : 'Error desconocido'
		}, { status: 500 });
	}
};
