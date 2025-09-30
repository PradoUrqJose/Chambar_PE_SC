// Servicio de base de datos para Cloudflare D1
// Maneja la conexión y operaciones con D1

import { drizzle } from 'drizzle-orm/d1';
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

// Función para obtener la base de datos D1 correcta según el entorno
export function getD1Database(platform: App.Platform | undefined) {
	if (!platform?.env) {
		throw new Error('Base de datos D1 no disponible. Asegúrate de estar ejecutando en Cloudflare Workers');
	}
	
	// Determinar qué base de datos usar según el entorno
	const isDevelopment = platform.env.NODE_ENV === 'development';
	const dbBinding = isDevelopment ? 'DB_DEV' : 'DB';
	
	console.log(`🔍 Usando base de datos: ${isDevelopment ? 'desarrollo' : 'producción'} (${dbBinding})`);
	
	const database = platform.env[dbBinding];
	if (!database) {
		throw new Error(`Base de datos ${dbBinding} no disponible. Verifica la configuración de D1`);
	}
	
	return drizzle(database);
}

// Función para inicializar datos de prueba (solo en desarrollo)
export async function seedD1Data(platform: App.Platform | undefined) {
	const db = getD1Database(platform);
	
	try {
		// Verificar si ya existen datos
		const existingUsers = await db.select().from(users).limit(1);
		if (existingUsers.length > 0) {
			console.log('ℹ️ Datos ya existen en D1, saltando seed');
			return;
		}
		
		console.log('🌱 Inicializando datos en D1...');
		
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
		console.log('✅ Usuario admin creado:', adminUser.email);
		
		// Crear datos iniciales de catálogos
		const initialOperationDetails = [
			{ id: generateId(15), name: 'Venta de productos', description: 'Ventas generales de productos', type: 'income' as const, active: true, createdAt: new Date() },
			{ id: generateId(15), name: 'Servicios prestados', description: 'Servicios diversos prestados', type: 'income' as const, active: true, createdAt: new Date() },
			{ id: generateId(15), name: 'Gasto de oficina', description: 'Gastos administrativos y de oficina', type: 'expense' as const, active: true, createdAt: new Date() },
			{ id: generateId(15), name: 'Compra de materiales', description: 'Compra de materiales e insumos', type: 'expense' as const, active: true, createdAt: new Date() }
		];
		await db.insert(operationDetails).values(initialOperationDetails);
		
		const initialResponsibles = [
			{ id: generateId(15), name: 'Administrador', email: 'admin@chambar.com', phone: '+51 999 999 999', active: true, createdAt: new Date() },
			{ id: generateId(15), name: 'Cajero Principal', email: 'cajero@chambar.com', phone: '+51 999 999 998', active: true, createdAt: new Date() }
		];
		await db.insert(responsiblePersons).values(initialResponsibles);
		
		const initialStands = [
			{ id: generateId(15), name: 'Stand Principal', description: 'Stand principal de ventas', location: 'Planta baja', active: true, createdAt: new Date() },
			{ id: generateId(15), name: 'Stand Secundario', description: 'Stand secundario de ventas', location: 'Planta alta', active: true, createdAt: new Date() }
		];
		await db.insert(stands).values(initialStands);
		
		const initialCompanies = [
			{ id: generateId(15), name: 'Cliente General', ruc: '20123456789', address: 'Lima, Perú', phone: '+51 1 234 5678', email: 'cliente@general.com', active: true, createdAt: new Date() },
			{ id: generateId(15), name: 'Empresa ABC S.A.C.', ruc: '20567890123', address: 'Av. Principal 123, Lima', phone: '+51 1 345 6789', email: 'contacto@empresaabc.com', active: true, createdAt: new Date() }
		];
		await db.insert(companies).values(initialCompanies);
		
		console.log('✅ Datos iniciales creados en D1');
		console.log('🔑 Credenciales de acceso:');
		console.log('   Email: admin@chambar.com');
		console.log('   Contraseña: admin123');
		
	} catch (error) {
		console.error('❌ Error inicializando datos en D1:', error);
		throw error;
	}
}

// Función para verificar la conexión a D1
export async function testD1Connection(platform: App.Platform | undefined) {
	try {
		const db = getD1Database(platform);
		const result = await db.select().from(users).limit(1);
		console.log('✅ Conexión a D1 exitosa');
		return true;
	} catch (error) {
		console.error('❌ Error conectando a D1:', error);
		return false;
	}
}
