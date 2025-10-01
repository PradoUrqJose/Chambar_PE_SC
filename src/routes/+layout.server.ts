import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Rutas que no requieren autenticación
	const publicRoutes = ['/login'];
	const isPublicRoute = publicRoutes.includes(url.pathname);

	// Si no es una ruta pública y no hay usuario, redirigir al login
	if (!isPublicRoute && !locals.user) {
		throw redirect(302, '/login');
	}

	return {
		user: locals.user
	};
};