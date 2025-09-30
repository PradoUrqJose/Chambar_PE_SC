// Servidor de la página de catálogos
// Verifica que el usuario esté autenticado y tenga permisos de admin

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Verificar autenticación
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	
	// Verificar permisos (solo admin puede gestionar catálogos)
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}
	
	return {
		user: locals.user
	};
};
