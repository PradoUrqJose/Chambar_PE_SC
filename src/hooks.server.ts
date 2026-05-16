import { createSupabaseServerClient } from '$lib/supabase-server';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// validar bindings cloudflare
	if (!event.platform?.env?.DB) {
		throw new Error('D1 binding DB not found');
	}

	// debug temporal
	console.log('D1 connected:', !!event.platform.env.DB);

	// Crear cliente de Supabase
	const supabase = createSupabaseServerClient(event);

	// Obtener usuario actual
	const {
		data: { user },
		error
	} = await supabase.auth.getUser();

	if (error) {
		console.error('Supabase Auth Error in hooks.server.ts:', error.message, error.name, error.status);
	} else if (!user) {
		console.log('No user found in session cookies');
	} else {
		console.log('User successfully authenticated:', user.id);
	}

	// guardar user en locals
	if (user && !error) {
		event.locals.user = {
			id: user.id,
			email: user.email || '',
			role: 'admin'
		};
	} else {
		event.locals.user = null;
	}

	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});

	return response;
};