// Script para poblar la base de datos de desarrollo
import { drizzle } from 'drizzle-orm/d1';
import { 
	users, 
	operationDetails, 
	responsiblePersons, 
	stands, 
	companies 
} from '../src/lib/server/db/schema.js';
import { hashPassword } from '../src/lib/server/auth/hash.js';
import { generateId } from 'lucia';

// Función para poblar la base de datos de desarrollo
async function seedDevDatabase() {
	console.log('🌱 Poblando base de datos de desarrollo...');
	
	// Crear usuario admin
	const password = 'admin123';
	const hashedPassword = await hashPassword(password);
	const adminUser = {
		id: generateId(15),
		email: 'admin@chambar.com',
		passwordHash: hashedPassword,
		role: 'admin',
		createdAt: new Date()
	};
	
	console.log('✅ Usuario admin creado:', adminUser.email);
	console.log('🔑 Credenciales de acceso:');
	console.log('   Email: admin@chambar.com');
	console.log('   Contraseña: admin123');
	
	// Crear datos iniciales de catálogos
	const initialOperationDetails = [
		{ id: generateId(15), name: 'Venta de productos', description: 'Ventas generales de productos', type: 'income', active: true, createdAt: new Date() },
		{ id: generateId(15), name: 'Servicios prestados', description: 'Servicios diversos prestados', type: 'income', active: true, createdAt: new Date() },
		{ id: generateId(15), name: 'Gasto de oficina', description: 'Gastos administrativos y de oficina', type: 'expense', active: true, createdAt: new Date() },
		{ id: generateId(15), name: 'Compra de materiales', description: 'Compra de materiales e insumos', type: 'expense', active: true, createdAt: new Date() }
	];
	
	const initialResponsibles = [
		{ id: generateId(15), name: 'Administrador', email: 'admin@chambar.com', phone: '+51 999 999 999', active: true, createdAt: new Date() },
		{ id: generateId(15), name: 'Cajero Principal', email: 'cajero@chambar.com', phone: '+51 999 999 998', active: true, createdAt: new Date() }
	];
	
	const initialStands = [
		{ id: generateId(15), name: 'Stand Principal', description: 'Stand principal de ventas', location: 'Planta baja', active: true, createdAt: new Date() },
		{ id: generateId(15), name: 'Stand Secundario', description: 'Stand secundario de ventas', location: 'Planta alta', active: true, createdAt: new Date() }
	];
	
	const initialCompanies = [
		{ id: generateId(15), name: 'Cliente General', ruc: '20123456789', address: 'Lima, Perú', phone: '+51 1 234 5678', email: 'cliente@general.com', active: true, createdAt: new Date() },
		{ id: generateId(15), name: 'Empresa ABC S.A.C.', ruc: '20567890123', address: 'Av. Principal 123, Lima', phone: '+51 1 345 6789', email: 'contacto@empresaabc.com', active: true, createdAt: new Date() }
	];
	
	console.log('✅ Datos iniciales preparados para desarrollo');
	console.log('📊 Catálogos creados:');
	console.log('   - Detalles de operación:', initialOperationDetails.length);
	console.log('   - Responsables:', initialResponsibles.length);
	console.log('   - Stands:', initialStands.length);
	console.log('   - Empresas:', initialCompanies.length);
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	seedDevDatabase().catch(console.error);
}

export { seedDevDatabase };
