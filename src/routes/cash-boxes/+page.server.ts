// Servidor de la página de gestión de cajas
// Verifica que el usuario esté autenticado y tenga permisos

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSimpleUser } from '$lib/server/auth/simple-auth';

export const load: PageServerLoad = async ({ locals }) => {
	// Verificar autenticación
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	
	// Verificar permisos (solo admin y cajeros pueden gestionar cajas)
	if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'cashier')) {
		throw redirect(302, '/dashboard');
	}
	
	return {
		user: locals.user
	};
};
