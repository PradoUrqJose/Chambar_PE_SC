// Script para probar la configuración de entornos
import { getD1Database } from '../src/lib/server/db/d1.js';

console.log('🧪 Probando configuración de entornos...');

// Simular platform de desarrollo
const devPlatform = {
	env: {
		NODE_ENV: 'development',
		DB: null, // Simular que no hay DB principal
		DB_DEV: {
			// Simular base de datos de desarrollo
			prepare: () => ({ all: () => Promise.resolve({ results: [] }) })
		}
	}
};

// Simular platform de producción
const prodPlatform = {
	env: {
		NODE_ENV: 'production',
		DB: {
			// Simular base de datos de producción
			prepare: () => ({ all: () => Promise.resolve({ results: [] }) })
		},
		DB_DEV: null
	}
};

try {
	console.log('🔍 Probando entorno de desarrollo...');
	const devDb = getD1Database(devPlatform);
	console.log('✅ Base de datos de desarrollo configurada correctamente');
	
	console.log('🔍 Probando entorno de producción...');
	const prodDb = getD1Database(prodPlatform);
	console.log('✅ Base de datos de producción configurada correctamente');
	
	console.log('🎉 Configuración de entornos funcionando correctamente!');
} catch (error) {
	console.error('❌ Error en la configuración:', error.message);
}
