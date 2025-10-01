import { createSupabaseServerClient } from '$lib/supabase-server';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Crear cliente de Supabase
	const supabase = createSupabaseServerClient(event);

	// Obtener usuario actual (más seguro que getSession)
	const {
		data: { user },
		error
	} = await supabase.auth.getUser();

	// Agregar usuario a locals si existe y es válido
	if (user && !error) {
		event.locals.user = {
			id: user.id,
			email: user.email || '',
			role: 'admin' // Por ahora todos son admin
		};
	} else {
		event.locals.user = null;
	}

	// Resolver la petición
	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});

	return response;
};
