import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { getDevDatabase } from '../db/local-dev';
import { users, sessions } from '../db/schema';

// Función para crear instancia de Lucia
// En desarrollo usa SQLite, en producción usará D1
export function createLucia(database: any) {
	// En desarrollo, siempre usar la base de datos de desarrollo
	const db = getDevDatabase();
	
	return new Lucia(new DrizzleSQLiteAdapter(db, {
		user: users,
		session: sessions
	}), {
		// Configuración de sesiones
		sessionExpiresIn: {
			// Las sesiones no expiran automáticamente
			// Se manejan manualmente en el código
			session: false
		},
		// Configuración de cookies
		getUserAttributes: (attributes) => {
			// Qué datos del usuario exponer en la sesión
			return {
				email: attributes.email,
				role: attributes.role,
				createdAt: attributes.createdAt
			};
		}
	});
}

// Tipo para TypeScript - nos ayuda con autocompletado
export type Auth = ReturnType<typeof createLucia>;


