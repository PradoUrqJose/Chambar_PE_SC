// Script para aplicar migraciones y crear datos iniciales
// Este archivo se ejecuta para configurar la base de datos

import { drizzle } from 'drizzle-orm/d1';
import { migrate } from 'drizzle-orm/d1/migrator';
import { eq } from 'drizzle-orm';
import { users } from './schema';
import { Argon2id } from 'oslo/password';
import { generateId } from 'lucia';

// Función para aplicar migraciones a la base de datos
export async function runMigrations(database: D1Database) {
	console.log('🔄 Aplicando migraciones...');
	
	// Crear instancia de Drizzle
	const db = drizzle(database);
	
	// Aplicar todas las migraciones pendientes
	await migrate(db, { migrationsFolder: './drizzle' });
	
	console.log('✅ Migraciones aplicadas correctamente');
}

// Función para crear el usuario admin inicial
export async function seedAdminUser(database: D1Database) {
	console.log('🌱 Creando usuario admin inicial...');
	
	const db = drizzle(database);
	
	// Verificar si ya existe un admin
	const existingAdmin = await db
		.select()
		.from(users)
		.where(eq(users.role, 'admin'))
		.limit(1);
	
	if (existingAdmin.length > 0) {
		console.log('ℹ️  Usuario admin ya existe, saltando seed');
		return;
	}
	
	// Crear hash de contraseña segura
	// En producción, esto debería ser una contraseña temporal que el admin cambie
	const password = 'admin123'; // ⚠️ Cambiar en producción
	const hashedPassword = await new Argon2id().hash(password);
	
	// Crear usuario admin
	const adminUser = {
		id: generateId(15), // ID único de 15 caracteres
		email: 'admin@chambar.com',
		passwordHash: hashedPassword,
		role: 'admin' as const,
		createdAt: new Date()
	};
	
	await db.insert(users).values(adminUser);
	
	console.log('✅ Usuario admin creado:');
	console.log(`   Email: ${adminUser.email}`);
	console.log(`   Contraseña: ${password}`);
	console.log('⚠️  IMPORTANTE: Cambiar la contraseña después del primer login');
}

// Función principal que ejecuta migraciones y seed
export async function setupDatabase(database: D1Database) {
	try {
		await runMigrations(database);
		await seedAdminUser(database);
		console.log('🎉 Base de datos configurada correctamente');
	} catch (error) {
		console.error('❌ Error configurando base de datos:', error);
		throw error;
	}
}
