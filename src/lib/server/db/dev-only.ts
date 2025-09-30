// Archivo solo para desarrollo local
// Este archivo NO se debe usar en producción

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { 
	users, 
	sessions, 
	cashBoxes, 
	operationDetails, 
	responsiblePersons, 
	stands, 
	companies, 
	operations 
} from './schema';
import { hashPassword } from '../auth/hash';
import { generateId } from 'lucia';
import { eq } from 'drizzle-orm';

// Base de datos SQLite en memoria para desarrollo
let devDb: any = null;

// Función para obtener la base de datos de desarrollo
export function getDevDatabase() {
	if (!devDb) {
		// Crear base de datos en memoria
		const sqlite = new Database(':memory:');
		devDb = drizzle(sqlite);
		
		// Crear tablas manualmente (simulando migraciones)
		// Tabla de usuarios
		sqlite.exec(`
			CREATE TABLE users (
				id TEXT PRIMARY KEY,
				email TEXT NOT NULL UNIQUE,
				password_hash TEXT NOT NULL,
				role TEXT DEFAULT 'cashier' NOT NULL,
				created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL
			);
		`);
		
		// Tabla de sesiones
		sqlite.exec(`
			CREATE TABLE sessions (
				id TEXT PRIMARY KEY,
				user_id TEXT NOT NULL,
				expires_at INTEGER NOT NULL,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			);
		`);
		
		// Tabla de cajas administrativas
		sqlite.exec(`
			CREATE TABLE cash_boxes (
				id TEXT PRIMARY KEY,
				date TEXT NOT NULL,
				status TEXT DEFAULT 'open' NOT NULL,
				opened_by TEXT NOT NULL,
				closed_by TEXT,
				initial_amount INTEGER DEFAULT 0 NOT NULL,
				final_amount INTEGER,
				opening_notes TEXT,
				closing_notes TEXT,
				opened_at INTEGER NOT NULL,
				closed_at INTEGER,
				edited_flag INTEGER DEFAULT 0 NOT NULL,
				created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL,
				FOREIGN KEY (opened_by) REFERENCES users(id),
				FOREIGN KEY (closed_by) REFERENCES users(id)
			);
		`);
		
		// Tabla de detalles de operación
		sqlite.exec(`
			CREATE TABLE operation_details (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				description TEXT,
				active INTEGER DEFAULT 1 NOT NULL,
				created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL
			);
		`);
		
		// Tabla de personas responsables
		sqlite.exec(`
			CREATE TABLE responsible_persons (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				position TEXT,
				active INTEGER DEFAULT 1 NOT NULL,
				created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL
			);
		`);
		
		// Tabla de stands
		sqlite.exec(`
			CREATE TABLE stands (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				location TEXT,
				active INTEGER DEFAULT 1 NOT NULL,
				created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL
			);
		`);
		
		// Tabla de empresas
		sqlite.exec(`
			CREATE TABLE companies (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				ruc TEXT,
				address TEXT,
				contact_person TEXT,
				phone TEXT,
				email TEXT,
				active INTEGER DEFAULT 1 NOT NULL,
				created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL
			);
		`);
		
		// Tabla de operaciones
		sqlite.exec(`
			CREATE TABLE operations (
				id TEXT PRIMARY KEY,
				cash_box_id TEXT NOT NULL,
				type TEXT NOT NULL,
				amount INTEGER NOT NULL,
				description TEXT,
				operation_detail_id TEXT,
				responsible_person_id TEXT,
				stand_id TEXT,
				company_id TEXT,
				created_by TEXT NOT NULL,
				created_at INTEGER DEFAULT (unixepoch('now') * 1000) NOT NULL,
				FOREIGN KEY (cash_box_id) REFERENCES cash_boxes(id),
				FOREIGN KEY (operation_detail_id) REFERENCES operation_details(id),
				FOREIGN KEY (responsible_person_id) REFERENCES responsible_persons(id),
				FOREIGN KEY (stand_id) REFERENCES stands(id),
				FOREIGN KEY (company_id) REFERENCES companies(id),
				FOREIGN KEY (created_by) REFERENCES users(id)
			);
		`);
		
		console.log('✅ Base de datos SQLite en memoria creada');
	}
	
	return devDb;
}

// Función para poblar datos iniciales
export async function seedLocalData() {
	const db = getDevDatabase();
	
	// Verificar si ya hay datos
	const existingUsers = await db.select().from(users).limit(1);
	if (existingUsers.length > 0) {
		console.log('📊 Datos ya existen, omitiendo seed');
		return;
	}
	
	console.log('🌱 Poblando datos iniciales...');
	
	// Crear usuario admin
	const password = 'admin123';
	const hashedPassword = await hashPassword(password);
	
	const adminUser = {
		id: generateId(15),
		email: 'admin@chambar.com',
		passwordHash: hashedPassword,
		role: 'admin' as const,
		createdAt: new Date()
	};
	
	await db.insert(users).values(adminUser);
	console.log('✅ Usuario admin creado');
	
	// Crear datos de catálogos
	await seedInitialData();
	
	console.log('✅ Datos iniciales creados exitosamente');
}

// Función para crear usuario admin
export async function seedDevAdmin() {
	const db = getDevDatabase();
	
	// Verificar si ya existe el usuario admin
	const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@chambar.com')).limit(1);
	if (existingAdmin.length > 0) {
		console.log('👤 Usuario admin ya existe');
		return existingAdmin[0];
	}
	
	// Crear usuario admin
	const password = 'admin123';
	const hashedPassword = await hashPassword(password);
	
	const adminUser = {
		id: generateId(15),
		email: 'admin@chambar.com',
		passwordHash: hashedPassword,
		role: 'admin' as const,
		createdAt: new Date()
	};
	
	await db.insert(users).values(adminUser);
	console.log('✅ Usuario admin creado');
	
	return adminUser;
}

// Función para poblar datos de catálogos
export async function seedInitialData() {
	const db = getDevDatabase();
	
	// Detalles de operación
	const operationDetailsData = [
		{ id: generateId(15), name: 'Venta de productos', description: 'Venta de productos del stand', active: true },
		{ id: generateId(15), name: 'Servicios', description: 'Prestación de servicios', active: true },
		{ id: generateId(15), name: 'Alquiler de espacio', description: 'Alquiler de espacio del stand', active: true },
		{ id: generateId(15), name: 'Otros', description: 'Otras operaciones', active: true }
	];
	
	await db.insert(operationDetails).values(operationDetailsData);
	console.log('✅ Detalles de operación creados');
	
	// Personas responsables
	const responsiblePersonsData = [
		{ id: generateId(15), name: 'Juan Pérez', position: 'Encargado', active: true },
		{ id: generateId(15), name: 'María García', position: 'Supervisora', active: true },
		{ id: generateId(15), name: 'Carlos López', position: 'Gerente', active: true }
	];
	
	await db.insert(responsiblePersons).values(responsiblePersonsData);
	console.log('✅ Personas responsables creadas');
	
	// Stands
	const standsData = [
		{ id: generateId(15), name: 'Stand A1', location: 'Zona Norte', active: true },
		{ id: generateId(15), name: 'Stand B2', location: 'Zona Sur', active: true },
		{ id: generateId(15), name: 'Stand C3', location: 'Zona Central', active: true }
	];
	
	await db.insert(stands).values(standsData);
	console.log('✅ Stands creados');
	
	// Empresas
	const companiesData = [
		{ 
			id: generateId(15), 
			name: 'Empresa Demo S.A.C.', 
			ruc: '20123456789', 
			address: 'Av. Principal 123', 
			contactPerson: 'Ana Torres', 
			phone: '987654321', 
			email: 'contacto@empresademo.com',
			active: true 
		},
		{ 
			id: generateId(15), 
			name: 'Comercial ABC S.R.L.', 
			ruc: '20987654321', 
			address: 'Jr. Comercio 456', 
			contactPerson: 'Luis Mendoza', 
			phone: '987123456', 
			email: 'ventas@comercialabc.com',
			active: true 
		}
	];
	
	await db.insert(companies).values(companiesData);
	console.log('✅ Empresas creadas');
	
	console.log('✅ Datos iniciales de catálogos creados');
}

// Función para obtener la base de datos (D1 en producción, SQLite en desarrollo)
export function getDatabase(platform: any) {
	if (platform?.env?.DB) {
		// Producción: usar D1
		return getDevDatabase(); // Por ahora usamos dev para simplificar
	} else {
		// Desarrollo: usar SQLite en memoria
		return getDevDatabase();
	}
}
