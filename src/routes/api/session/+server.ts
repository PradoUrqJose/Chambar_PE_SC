// Endpoint para verificar el estado de la sesión
// ⚠️ SOLO USAR EN DESARROLLO

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	return json({
		user: locals.user,
		session: locals.session,
		cookies: {
			user_id: cookies.get('user_id')
		}
	});
};
