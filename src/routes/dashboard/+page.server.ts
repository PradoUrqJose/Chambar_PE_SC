// Guard de autenticación para el dashboard
// Verifica que el usuario esté logueado antes de mostrar la página

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Verificar si el usuario está autenticado
	if (!locals.user) {
		// Si no está logueado, redirigir al login
		throw redirect(302, '/login');
	}
	
	// Si está logueado, devolver datos del usuario
	return {
		user: locals.user,
		session: locals.session
	};
};
