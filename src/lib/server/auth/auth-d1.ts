// Funciones de autenticación para Cloudflare D1
// Versión optimizada para producción

import { createLucia } from './lucia';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import { getDatabase } from '../db/database';
import { hashPassword, verifyPassword } from './hash';
import { fail, redirect } from '@sveltejs/kit';

// Función para verificar credenciales de login
export async function verifyCredentials(
	platform: App.Platform | undefined,
	email: string,
	password: string
) {
	console.log('🔍 Verificando credenciales para:', email);
	
	const db = getDatabase(platform);
	
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
	
	// Verificar contraseña usando Web Crypto API
	const validPassword = await verifyPassword(password, user.passwordHash);
	
	if (!validPassword) {
		console.log('❌ Contraseña incorrecta');
		return null;
	}
	
	console.log('✅ Credenciales válidas');
	return user;
}

// Función para crear una sesión de usuario
export async function createUserSession(
	platform: App.Platform | undefined,
	userId: string,
	event: any
) {
	const lucia = createLucia(platform?.env?.DB);
	
	// Crear sesión en la base de datos
	const session = await lucia.createSession(userId, {});
	
	// Crear cookie de sesión
	const sessionCookie = lucia.createSessionCookie(session.id);
	
	// Establecer cookie en la respuesta
	event.cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});
	
	return session;
}

// Función para invalidar una sesión (logout)
export async function invalidateUserSession(
	platform: App.Platform | undefined,
	sessionId: string,
	event: any
) {
	const lucia = createLucia(platform?.env?.DB);
	
	// Invalidar sesión en la base de datos
	await lucia.invalidateSession(sessionId);
	
	// Crear cookie vacía para limpiar la sesión
	const sessionCookie = lucia.createBlankSessionCookie();
	
	// Establecer cookie vacía
	event.cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});
}

// Función para obtener usuario de la sesión actual
export async function getUserFromSession(
	platform: App.Platform | undefined,
	event: any
) {
	const lucia = createLucia(platform?.env?.DB);
	
	// Obtener ID de sesión de las cookies
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	
	if (!sessionId) {
		return { user: null, session: null };
	}
	
	// Validar sesión
	const { session, user } = await lucia.validateSession(sessionId);
	
	return { user, session };
}

// Función para verificar si un usuario tiene un rol específico
export function hasRole(user: any, requiredRole: 'admin' | 'cashier'): boolean {
	if (!user) return false;
	
	// Admin puede hacer todo
	if (user.role === 'admin') return true;
	
	// Verificar rol específico
	return user.role === requiredRole;
}

// Función para verificar si un usuario es admin
export function isAdmin(user: any): boolean {
	return hasRole(user, 'admin');
}
