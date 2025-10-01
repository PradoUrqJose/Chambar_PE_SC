import { createSupabaseServerClient } from '$lib/supabase-server';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const supabase = createSupabaseServerClient({ cookies } as any);
	
	// Cerrar sesión
	await supabase.auth.signOut();
	
	// Limpiar locals
	locals.user = null;
	
	// Redirigir al login
	throw redirect(302, '/login');
};