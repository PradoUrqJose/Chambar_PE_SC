// Script simple para probar la configuración de base de datos
console.log('🧪 Probando configuración de base de datos...');

// Simular diferentes entornos
const environments = [
	{
		name: 'Desarrollo',
		platform: {
			env: {
				NODE_ENV: 'development',
				DB: null,
				DB_DEV: { name: 'chambar-dev' }
			}
		}
	},
	{
		name: 'Producción',
		platform: {
			env: {
				NODE_ENV: 'production',
				DB: { name: 'chambar-db' },
				DB_DEV: null
			}
		}
	}
];

environments.forEach(env => {
	console.log(`\n🔍 Probando entorno: ${env.name}`);
	console.log(`   NODE_ENV: ${env.platform.env.NODE_ENV}`);
	
	// Simular la lógica de selección de BD
	const isDevelopment = env.platform.env.NODE_ENV === 'development';
	const dbBinding = isDevelopment ? 'DB_DEV' : 'DB';
	const database = env.platform.env[dbBinding];
	
	console.log(`   Base de datos seleccionada: ${dbBinding}`);
	console.log(`   Base de datos disponible: ${database ? 'Sí' : 'No'}`);
	
	if (database) {
		console.log(`   ✅ Configuración correcta para ${env.name}`);
	} else {
		console.log(`   ❌ Error: Base de datos no disponible para ${env.name}`);
	}
});

console.log('\n🎉 Prueba de configuración completada!');
