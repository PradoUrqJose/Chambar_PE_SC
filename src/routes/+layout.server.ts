import type { LayoutServerLoad } from './$types';
import { getSimpleUser } from '$lib/server/auth/simple-auth';

export const load: LayoutServerLoad = async ({ cookies }) => {
	// Obtener información del usuario desde la sesión
	const user = await getSimpleUser({ cookies });
	
	return {
		user
	};
};
