// Servicio unificado de base de datos
// Maneja tanto desarrollo local como producción con D1

import { drizzle } from 'drizzle-orm/d1';
import { getD1Database } from './d1';

// Función para obtener la base de datos según el entorno
export function getDatabase(platform: App.Platform | undefined) {
	// En producción (Cloudflare), usar D1
	if (platform?.env?.DB) {
		return getD1Database(platform);
	}
	
	// En desarrollo, usar D1 local o fallback
	// Por ahora, requerir D1 incluso en desarrollo
	throw new Error('Base de datos D1 no disponible. Asegúrate de estar ejecutando en Cloudflare Workers o usar wrangler dev');
}

// Función para verificar si estamos en producción
export function isProduction(platform: App.Platform | undefined): boolean {
	return !!platform?.env?.DB;
}

// Función para obtener el entorno actual
export function getEnvironment(platform: App.Platform | undefined): 'development' | 'production' {
	return isProduction(platform) ? 'production' : 'development';
}
