// Sistema de autenticación simplificado para desarrollo
// Sin Lucia por ahora, solo verificación básica

import { getD1Database } from '../db/d1';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from './hash';

// Función para verificar credenciales
export async function verifyCredentials(platform: App.Platform | undefined, email: string, password: string) {
	console.log('🔍 Verificando credenciales para:', email);
	
	try {
		const db = getD1Database(platform);
		
		// Buscar usuario por email
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);
		
		console.log('👤 Usuarios encontrados:', existingUser.length);
		
		if (existingUser.length === 0) {
			console.log('❌ Usuario no encontrado');
			return null;
		}
		
		const user = existingUser[0];
		console.log('👤 Usuario encontrado:', user.email, 'Rol:', user.role);
		
		// Verificar contraseña
		console.log('🔐 Verificando contraseña...');
		const validPassword = await verifyPassword(password, user.passwordHash);
		
		console.log('🔐 Contraseña válida:', validPassword);
		
		if (!validPassword) {
			console.log('❌ Contraseña incorrecta');
			return null;
		}
		
		console.log('✅ Credenciales válidas');
		return user;
	} catch (error) {
		console.error('❌ Error verificando credenciales:', error);
		
		// Fallback para desarrollo local - usuario hardcodeado
		if (email === 'admin@chambar.com' && password === 'admin123') {
			console.log('🔧 Usando credenciales de desarrollo local');
			return {
				id: 'admin-dev-001',
				email: 'admin@chambar.com',
				role: 'admin',
				passwordHash: 'dev-hash',
				createdAt: new Date()
			};
		}
		
		return null;
	}
}

// Función para crear una sesión simple (solo cookie)
export function createSimpleSession(userId: string, event: any) {
	// Crear cookie simple con el ID del usuario
	event.cookies.set('user_id', userId, {
		path: '/',
		httpOnly: true,
		secure: false, // En desarrollo
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7 // 7 días
	});
	
	console.log('🍪 Cookie de sesión creada para usuario:', userId);
}

// Función para obtener usuario de la sesión simple
export async function getSimpleUser(event: any) {
	const userId = event.cookies.get('user_id');
	
	if (!userId) {
		return null;
	}
	
	try {
		const db = getD1Database(event.platform);
		const user = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		
		return user.length > 0 ? user[0] : null;
	} catch (error) {
		console.error('❌ Error verificando sesión:', error);
		
		// Fallback para desarrollo local
		if (userId === 'admin-dev-001') {
			console.log('🔧 Usando usuario de desarrollo local');
			return {
				id: 'admin-dev-001',
				email: 'admin@chambar.com',
				role: 'admin',
				passwordHash: 'dev-hash',
				createdAt: new Date()
			};
		}
		
		return null;
	}
}

// Función para cerrar sesión simple
export function clearSimpleSession(event: any) {
	event.cookies.delete('user_id', { path: '/' });
	console.log('🍪 Sesión cerrada');
}
