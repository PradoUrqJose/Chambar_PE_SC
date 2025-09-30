// Helper para manejar fallbacks en desarrollo local
// Evita errores cuando D1 no está disponible en desarrollo

import type { App } from '$lib/types/app';

/**
 * Detecta si estamos en modo desarrollo
 */
export function isDevelopment(platform: App.Platform | undefined): boolean {
	// Si no hay platform, es desarrollo local
	if (!platform) return true;
	
	// Verificar variable de entorno
	return platform.env?.NODE_ENV === 'development';
}

/**
 * Detecta si estamos en modo desarrollo local (sin D1)
 * @deprecated - Usar isDevelopment en su lugar
 */
export function isLocalDev(platform: App.Platform | undefined): boolean {
	return isDevelopment(platform);
}

/**
 * Datos mock para desarrollo local
 */
export const mockData = {
	user: {
		id: 'admin-dev-001',
		email: 'admin@chambar.com',
		role: 'admin',
		passwordHash: 'dev-hash',
		createdAt: new Date()
	},
	cashBox: {
		id: 'cashbox-dev-001',
		date: new Date().toISOString().split('T')[0],
		status: 'open' as const,
		openedBy: 'admin-dev-001',
		closedBy: null,
		initialAmount: 10000, // S/ 100.00 en centavos
		finalAmount: null,
		openingNotes: 'Caja de desarrollo abierta',
		closingNotes: null,
		openedAt: new Date(),
		closedAt: null,
		editedFlag: false,
		createdAt: new Date()
	},
	operations: [
		{
			id: 'op-001',
			cashBoxId: 'cashbox-dev-001',
			type: 'income' as const,
			amount: 5000, // S/ 50.00
			operationDetailId: 'detail-001',
			responsibleId: 'person-001',
			standId: 'stand-001',
			companyId: 'company-001',
			description: 'Venta de productos varios',
			voucherNumber: 'V-001',
			paymentMethod: 'cash' as const,
			createdBy: 'admin-dev-001',
			createdAt: new Date()
		},
		{
			id: 'op-002',
			cashBoxId: 'cashbox-dev-001',
			type: 'expense' as const,
			amount: 2000, // S/ 20.00
			operationDetailId: 'detail-002',
			responsibleId: 'person-001',
			standId: 'stand-001',
			companyId: null,
			description: 'Gastos de operación',
			voucherNumber: 'E-001',
			paymentMethod: 'cash' as const,
			createdBy: 'admin-dev-001',
			createdAt: new Date()
		}
	],
	operationDetails: [
		{ id: 'detail-001', name: 'Venta de productos', description: 'Venta general', type: 'income', active: true },
		{ id: 'detail-002', name: 'Gastos operativos', description: 'Gastos generales', type: 'expense', active: true }
	],
	stands: [
		{ id: 'stand-001', name: 'Stand Principal', description: 'Stand principal del mercado', location: 'Zona A', active: true },
		{ id: 'stand-002', name: 'Stand Secundario', description: 'Stand secundario', location: 'Zona B', active: true }
	],
	companies: [
		{ id: 'company-001', name: 'Empresa Demo S.A.C.', description: 'Empresa de demostración', ruc: '20123456789', address: 'Av. Principal 123', phone: '987654321', email: 'demo@empresa.com', active: true },
		{ id: 'company-002', name: 'Comercial ABC', description: 'Empresa comercial', ruc: '20987654321', address: 'Jr. Comercio 456', phone: '987654322', email: 'ventas@abc.com', active: true }
	],
	responsiblePersons: [
		{ id: 'person-001', name: 'Juan Pérez', description: 'Responsable principal', email: 'juan@chambar.com', phone: '987654321', active: true },
		{ id: 'person-002', name: 'María García', description: 'Responsable secundario', email: 'maria@chambar.com', phone: '987654322', active: true }
	]
};

/**
 * Maneja errores de D1 en desarrollo local
 */
export function handleDevError(error: any, fallbackData?: any): any {
	if (isLocalDev(undefined)) {
		console.log('🔧 Modo desarrollo - usando datos mock');
		return fallbackData || null;
	}
	throw error;
}
