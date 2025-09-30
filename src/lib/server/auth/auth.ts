// Funciones principales de autenticación
// Aquí manejamos login, logout, verificación de sesiones, etc.

import { createLucia } from './lucia';
import { loginSchema } from './validations';
import { Argon2id } from 'oslo/password';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import { getDevDatabase } from '../db/local-dev';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

// Función para verificar credenciales de login
export async function verifyCredentials(
	database: any, // Cambiado de D1Database a any para compatibilidad
	email: string,
	password: string
) {
	console.log('🔍 Verificando credenciales para:', email);
	
	const db = getDevDatabase();
	
	// Buscar usuario por email
	const existingUser = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);
	
	console.log('👤 Usuarios encontrados:', existingUser.length);
	
	if (existingUser.length === 0) {
		// Usuario no encontrado
		console.log('❌ Usuario no encontrado');
		return null;
	}
	
	const user = existingUser[0];
	console.log('👤 Usuario encontrado:', user.email, 'Rol:', user.role);
	console.log('🔐 Hash almacenado:', user.passwordHash.substring(0, 20) + '...');
	
	// Verificar contraseña usando Argon2id (algoritmo seguro)
	console.log('🔐 Verificando contraseña...');
	const validPassword = await new Argon2id().verify(user.passwordHash, password);
	
	console.log('🔐 Contraseña válida:', validPassword);
	
	if (!validPassword) {
		// Contraseña incorrecta
		console.log('❌ Contraseña incorrecta');
		return null;
	}
	
	// Credenciales válidas, devolver usuario
	console.log('✅ Credenciales válidas');
	return user;
}

// Función para crear una sesión de usuario
export async function createUserSession(
	database: any, // Cambiado de D1Database a any para compatibilidad
	userId: string,
	event: any // Evento de SvelteKit
) {
	const lucia = createLucia(database);
	
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
	database: any, // Cambiado de D1Database a any para compatibilidad
	sessionId: string,
	event: any
) {
	const lucia = createLucia(database);
	
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
	database: any, // Cambiado de D1Database a any para compatibilidad
	event: any
) {
	const lucia = createLucia(database);
	
	// Obtener ID de sesión de las cookies
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	
	if (!sessionId) {
		// No hay sesión activa
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
