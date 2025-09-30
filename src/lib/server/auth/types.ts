// Tipos para Lucia Auth
// Estos tipos le dicen a Lucia qué estructura tienen nuestros datos de usuario y sesión

import type { User as LuciaUser, Session as LuciaSession } from 'lucia';

// Tipo de usuario que usaremos en toda la aplicación
export interface User {
	id: string;
	email: string;
	role: 'admin' | 'cashier'; // Solo dos roles: administrador y cajero
	createdAt: Date;
}

// Tipo de sesión que usaremos en toda la aplicación
export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
}

// Extender los tipos de Lucia para que coincidan con nuestros datos
declare module 'lucia' {
	interface Register {
		Lucia: typeof import('./lucia').Auth;
		DatabaseUserAttributes: {
			email: string;
			role: 'admin' | 'cashier';
			createdAt: Date;
		};
	}
}
