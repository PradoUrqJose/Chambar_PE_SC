import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'src/lib/db/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('🚀 Inicializando base de datos...');

try {
	// Ejecutar el esquema en la base de datos de desarrollo
	execSync(`wrangler d1 execute chambar-dev --file=${schemaPath}`, { stdio: 'inherit' });
	console.log('✅ Base de datos de desarrollo inicializada');
} catch (error) {
	console.error('❌ Error inicializando base de datos:', error.message);
	process.exit(1);
}

console.log('🎉 ¡Base de datos inicializada correctamente!');
