// Servidor de la página de reportes
// Verifica que el usuario esté autenticado y tenga permisos

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Verificar autenticación
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	
	// Verificar permisos (todos los usuarios autenticados pueden ver reportes)
	if (!locals.user) {
		throw redirect(302, '/dashboard');
	}
	
	return {
		user: locals.user
	};
};
