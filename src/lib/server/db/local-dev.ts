// Configuración para desarrollo local
// Este archivo redirige a dev-only.ts en desarrollo
// En producción, no se usa

// Función para obtener la base de datos de desarrollo
export function getDevDatabase() {
	// En desarrollo, usar el archivo dev-only.ts
	if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
		try {
			const { getDevDatabase: getDevDb } = require('./dev-only');
			return getDevDb();
		} catch (e) {
			throw new Error('better-sqlite3 no disponible. Usa wrangler dev para desarrollo con D1');
		}
	}
	
	// En producción, esto no debería ejecutarse
	throw new Error('getDevDatabase no debe usarse en producción');
}

// Función para poblar datos iniciales
export async function seedLocalData() {
	if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
		try {
			const { seedLocalData: seedData } = require('./dev-only');
			return await seedData();
		} catch (e) {
			console.error('Error seeding local data:', e);
		}
	}
}

// Función para poblar datos de catálogos
export async function seedInitialData() {
	if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
		try {
			const { seedInitialData: seedData } = require('./dev-only');
			return await seedData();
		} catch (e) {
			console.error('Error seeding initial data:', e);
		}
	}
}

// Función para crear usuario admin
export async function seedDevAdmin() {
	if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
		try {
			const { seedDevAdmin: seedAdmin } = require('./dev-only');
			return await seedAdmin();
		} catch (e) {
			console.error('Error seeding dev admin:', e);
		}
	}
}