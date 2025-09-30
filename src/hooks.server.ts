import type { Handle } from '@sveltejs/kit';
import { getD1Database } from '$lib/server/db/d1';
import { getSimpleUser } from '$lib/server/auth/simple-auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Usar D1 directamente para todo
	const db = getD1Database(event.platform);
	event.locals.db = db;
	
	// Verificar sesión de usuario simple
	try {
		const user = await getSimpleUser(event);
		console.log('🔍 Usuario encontrado en hook:', user ? user.email : 'null');
		event.locals.user = user;
		event.locals.session = user ? { id: 'simple-session' } : null;
	} catch (error) {
		// Si hay error verificando la sesión, limpiar datos
		event.locals.user = null;
		event.locals.session = null;
		console.error('Error verificando sesión:', error);
	}

	return resolve(event);
};


