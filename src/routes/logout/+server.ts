// Endpoint para cerrar sesión
// Invalida la sesión del usuario y redirige al login

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearSimpleSession } from '$lib/server/auth/simple-auth';

export const GET: RequestHandler = async ({ cookies, locals }) => {
	// Verificar que tenemos una sesión activa
	if (!locals.session) {
		throw redirect(302, '/login');
	}
	
	try {
		// Limpiar la sesión simple
		clearSimpleSession({ cookies });
		
		// Redirigir al login
		throw redirect(302, '/login');
	} catch (error) {
		// Si hay error, redirigir de todas formas
		console.error('Error cerrando sesión:', error);
		throw redirect(302, '/login');
	}
};

export const POST: RequestHandler = async ({ cookies, locals }) => {
	// Verificar que tenemos una sesión activa
	if (!locals.session) {
		throw redirect(302, '/login');
	}
	
	try {
		// Limpiar la sesión simple
		clearSimpleSession({ cookies });
		
		// Redirigir al login
		throw redirect(302, '/login');
	} catch (error) {
		// Si hay error, redirigir de todas formas
		console.error('Error cerrando sesión:', error);
		throw redirect(302, '/login');
	}
};
