// Acciones del servidor para la página de login
// Aquí manejamos el procesamiento del formulario de login

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loginSchema } from '$lib/server/auth/validations';
import { verifyCredentials, createSimpleSession } from '$lib/server/auth/simple-auth';

// Cargar datos de la página (verificar si ya está logueado)
export const load: PageServerLoad = async ({ locals, platform }) => {
	// Si ya hay una sesión activa, redirigir al dashboard
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}
	
	return {
		// No necesitamos datos especiales para la página de login
	};
};

// Acciones del formulario
export const actions: Actions = {
	// Acción para procesar el login
	login: async ({ request, platform, cookies }) => {
		console.log('🚀 Iniciando proceso de login...');
		
		// Obtener datos del formulario
		const formData = await request.formData();
		const email = formData.get('email')?.toString() || '';
		const password = formData.get('password')?.toString() || '';
		
		console.log('📧 Email recibido:', email);
		
		// Validar datos de entrada usando Zod
		const validationResult = loginSchema.safeParse({ email, password });
		
		if (!validationResult.success) {
			console.log('❌ Validación fallida:', validationResult.error.flatten().fieldErrors);
			const errors = validationResult.error.flatten().fieldErrors;
			return fail(400, {
				error: 'Datos inválidos',
				details: errors
			});
		}
		
		const { email: validEmail, password: validPassword } = validationResult.data;
		console.log('✅ Validación exitosa');
		
		// Verificar credenciales usando D1
		console.log('🔍 Verificando credenciales...');
		const user = await verifyCredentials(platform, validEmail, validPassword);
		
		if (!user) {
			console.log('❌ Credenciales incorrectas');
			return fail(401, {
				error: 'Email o contraseña incorrectos'
			});
		}
		
		console.log('✅ Credenciales válidas, creando sesión...');
		
		// Crear sesión simple
		createSimpleSession(user.id, { cookies });
		
		console.log('✅ Sesión creada exitosamente');
		
		// Redirigir directamente al dashboard
		throw redirect(302, '/dashboard');
	}
};
