// Script para configurar Cloudflare D1
// Ejecutar con: node scripts/setup-d1.js

import { execSync } from 'child_process';

console.log('🚀 Configurando Cloudflare D1 para Chambar...\n');

try {
	// 1. Verificar si wrangler está instalado
	console.log('1️⃣ Verificando Wrangler CLI...');
	execSync('npx wrangler --version', { stdio: 'pipe' });
	console.log('✅ Wrangler CLI encontrado\n');
	
	// 2. Crear base de datos D1
	console.log('2️⃣ Creando base de datos D1...');
	const createResult = execSync('npx wrangler d1 create chambar-db', { 
		encoding: 'utf8',
		stdio: 'pipe' 
	});
	console.log('✅ Base de datos creada\n');
	
	// Extraer database_id del resultado
	const dbIdMatch = createResult.match(/database_id = "([^"]+)"/);
	if (dbIdMatch) {
		const databaseId = dbIdMatch[1];
		console.log('📝 Database ID:', databaseId);
		console.log('⚠️  Actualiza wrangler.toml con este ID\n');
	}
	
	// 3. Ejecutar migraciones
	console.log('3️⃣ Ejecutando migraciones...');
	execSync('npx wrangler d1 execute chambar-db --file=drizzle/migrations/0001_initial.sql', { 
		stdio: 'inherit' 
	});
	console.log('✅ Migraciones ejecutadas\n');
	
	// 4. Instrucciones finales
	console.log('🎉 ¡Configuración completada!');
	console.log('\n📋 Próximos pasos:');
	console.log('1. Actualiza wrangler.toml con el database_id mostrado arriba');
	console.log('2. Ejecuta: npm run deploy');
	console.log('3. Visita tu aplicación en Cloudflare Workers');
	console.log('4. Ve a /api/setup-d1 para inicializar datos');
	
} catch (error) {
	console.error('❌ Error durante la configuración:', error.message);
	console.log('\n🔧 Soluciones:');
	console.log('1. Asegúrate de estar autenticado: npx wrangler login');
	console.log('2. Verifica que tienes permisos en Cloudflare');
	console.log('3. Revisa la configuración de wrangler.toml');
}
