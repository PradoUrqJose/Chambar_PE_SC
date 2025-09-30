// Script para ejecutar migraciones en Cloudflare D1
// Ejecutar con: npx wrangler d1 execute chambar-db --file=drizzle/migrations/0001_initial.sql

import { readFileSync } from 'fs';
import { join } from 'path';

const migrationFile = join(process.cwd(), 'drizzle/migrations/0001_initial.sql');
const migrationSQL = readFileSync(migrationFile, 'utf8');

console.log('🚀 Ejecutando migración inicial en D1...');
console.log('📄 Archivo de migración:', migrationFile);
console.log('📝 SQL a ejecutar:');
console.log(migrationSQL);

console.log('\n✅ Para ejecutar esta migración, usa:');
console.log('npx wrangler d1 execute chambar-db --file=drizzle/migrations/0001_initial.sql');
