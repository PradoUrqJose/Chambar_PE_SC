// Datos mock para desarrollo local cuando D1 no está disponible
// Esquema robusto con business_date y estado unificado

import { toBusinessDate, toPeruISOString } from '$lib/utils/date-helpers';

// Interfaz específica para cajas mock
interface MockCashBox {
	id: string;
	name: string;
	status: 'open' | 'closed' | 'reopened' | 'empty';
	openingAmount: number;
	openedAt: string | null;
	originalOpenedAt: string | null;
	closedAt: string | null;
	reopenedAt: string | null;
	businessDate: string | null;
	createdAt: string;
	updatedAt: string;
}

export const mockCashBoxes: MockCashBox[] = [
	{
		id: '1',
		name: 'Caja Principal',
		status: 'empty', // Estado unificado - disponible para abrir
		openingAmount: 0.00, // Sin monto inicial
		openedAt: null as string | null, // No abierta
		originalOpenedAt: null as string | null,
		closedAt: null as string | null,
		reopenedAt: null as string | null,
		businessDate: '2025-10-01', // Business date en zona horaria de Perú
		createdAt: '2025-10-01T05:00:00.000Z',
		updatedAt: '2025-10-01T05:00:00.000Z'
	},
	{
		id: '2',
		name: 'Caja 27 Septiembre',
		status: 'closed', // Estado unificado
		openingAmount: 200.00,
		openedAt: '2025-09-27T05:00:00.000Z', // 27-09-2025 00:00 Perú
		originalOpenedAt: '2025-09-27T05:00:00.000Z', // 27-09-2025 00:00 Perú
		closedAt: '2025-09-27T13:00:00.000Z', // 27-09-2025 08:00 Perú
		reopenedAt: null as string | null,
		businessDate: '2025-09-27', // Business date en zona horaria de Perú
		createdAt: '2025-09-27T05:00:00.000Z',
		updatedAt: '2025-09-27T13:00:00.000Z'
	},
	{
		id: '3',
		name: 'Caja 30 Septiembre',
		status: 'closed', // Estado unificado
		openingAmount: 150.00,
		openedAt: '2025-09-30T05:00:00.000Z', // 30-09-2025 00:00 Perú
		originalOpenedAt: '2025-09-30T05:00:00.000Z', // 30-09-2025 00:00 Perú
		closedAt: '2025-09-30T13:00:00.000Z', // 30-09-2025 08:00 Perú
		reopenedAt: null as string | null,
		businessDate: '2025-09-30', // Business date en zona horaria de Perú
		createdAt: '2025-09-30T05:00:00.000Z',
		updatedAt: '2025-09-30T13:00:00.000Z'
	}
];

// Función para simular cambios de estado en desarrollo (usando estado unificado)
export function updateMockCashBoxStatus(id: string, status: 'empty' | 'open' | 'closed' | 'reopened', openingAmount: number = 0, openedAt?: string) {
	const cashBox = mockCashBoxes.find(cb => cb.id === id);
	if (cashBox) {
		cashBox.status = status;
		
		if (status === 'open' || status === 'reopened') {
			// Solo cambiar openingAmount si es una apertura nueva (no reapertura)
			if (status === 'open') {
				cashBox.openingAmount = openingAmount;
			}
			// Para reapertura, mantener el openingAmount original
			
			cashBox.openedAt = openedAt || new Date().toISOString();
			cashBox.closedAt = null;
			
			// Si es reapertura, mantener la fecha original
			if (status === 'reopened') {
				cashBox.reopenedAt = new Date().toISOString();
				// No cambiar originalOpenedAt si ya existe
				if (!cashBox.originalOpenedAt) {
					cashBox.originalOpenedAt = cashBox.openedAt || new Date().toISOString();
				}
				// Para reapertura, NO cambiar businessDate - mantener el original
			} else {
				// Si es apertura normal, establecer originalOpenedAt y businessDate
				cashBox.originalOpenedAt = cashBox.openedAt || new Date().toISOString();
				cashBox.businessDate = toBusinessDate(cashBox.openedAt);
			}
		} else if (status === 'closed') {
			cashBox.closedAt = new Date().toISOString();
			cashBox.reopenedAt = null;
		} else if (status === 'empty') {
			cashBox.openedAt = null as string | null;
			cashBox.closedAt = null as string | null;
			cashBox.reopenedAt = null as string | null;
			cashBox.businessDate = null as string | null;
		}
		cashBox.updatedAt = new Date().toISOString();
	}
}

// Función para agregar nueva caja mock
export function addMockCashBox(name: string) {
	const newCashBox = {
		id: 'mock-' + Date.now(),
		name,
		status: 'empty' as const,
		openingAmount: 0,
		openedAt: null as string | null,
		originalOpenedAt: null as string | null,
		closedAt: null as string | null,
		reopenedAt: null as string | null,
		businessDate: null as string | null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockCashBoxes.push(newCashBox);
	return newCashBox;
}

export const mockStands = [
	{
		id: '1',
		name: 'Stand A',
		location: 'Zona Norte',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: '2',
		name: 'Stand B',
		location: 'Zona Sur',
		status: 'active',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];

export const mockResponsiblePersons = [
	{
		id: '1',
		name: 'Juan Pérez',
		email: 'juan@example.com',
		phone: '999888777',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: '2',
		name: 'María García',
		email: 'maria@example.com',
		phone: '999888666',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];

export const mockOperationDetails = [
	{
		id: '1',
		name: 'Venta de productos',
		type: 'income',
		category: 'ventas',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: '2',
		name: 'Pago a proveedor',
		type: 'expense',
		category: 'compras',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];

// Función para agregar business_date a operaciones existentes
function addBusinessDateToOperations(operations: any[]) {
	return operations.map(op => ({
		...op,
		businessDate: toBusinessDate(op.createdAt)
	}));
}

export const mockOperations = addBusinessDateToOperations([
	// Operaciones del 27 de septiembre de 2025 (fechas fijas para Perú)
	{
		id: 'mock-op-27-1',
		type: 'income',
		amount: 100.00,
		description: 'Venta de productos - Stand A',
		cashBoxId: '2',
		operationDetailId: '1',
		responsiblePersonId: '1',
		standId: '1',
		companyId: '1',
		createdAt: '2025-09-27T06:00:00.000Z', // 27-09-2025 01:00 Perú
		updatedAt: '2025-09-27T06:00:00.000Z',
		businessDate: '2025-09-27' // Business date en zona horaria de Perú
	},
	{
		id: 'mock-op-27-2',
		type: 'income',
		amount: 75.50,
		description: 'Venta de servicios - Stand B',
		cashBoxId: '2',
		operationDetailId: '1',
		responsiblePersonId: '2',
		standId: '2',
		companyId: '2',
		createdAt: '2025-09-27T07:00:00.000Z', // 27-09-2025 02:00 Perú
		updatedAt: '2025-09-27T07:00:00.000Z'
	},
	{
		id: 'mock-op-27-3',
		type: 'expense',
		amount: 25.00,
		description: 'Compra de materiales',
		cashBoxId: '2',
		operationDetailId: '2',
		responsiblePersonId: '1',
		standId: null,
		companyId: '3',
		createdAt: '2025-09-27T08:00:00.000Z', // 27-09-2025 03:00 Perú
		updatedAt: '2025-09-27T08:00:00.000Z'
	},
	{
		id: 'mock-op-27-4',
		type: 'income',
		amount: 120.00,
		description: 'Venta mayorista',
		cashBoxId: '2',
		operationDetailId: '1',
		responsiblePersonId: '3',
		standId: '3',
		companyId: '4',
		createdAt: '2025-09-27T09:00:00.000Z', // 27-09-2025 04:00 Perú
		updatedAt: '2025-09-27T09:00:00.000Z'
	},
	{
		id: 'mock-op-27-5',
		type: 'expense',
		amount: 15.50,
		description: 'Pago de servicios básicos',
		cashBoxId: '2',
		operationDetailId: '2',
		responsiblePersonId: '2',
		standId: null,
		companyId: null,
		createdAt: '2025-09-27T10:00:00.000Z', // 27-09-2025 05:00 Perú
		updatedAt: '2025-09-27T10:00:00.000Z'
	},
	{
		id: 'mock-op-27-6',
		type: 'income',
		amount: 200.00,
		description: 'Venta especial - Cliente VIP',
		cashBoxId: '2',
		operationDetailId: '1',
		responsiblePersonId: '1',
		standId: '1',
		companyId: '5',
		createdAt: '2025-09-27T11:00:00.000Z', // 27-09-2025 06:00 Perú
		updatedAt: '2025-09-27T11:00:00.000Z'
	},
	{
		id: 'mock-op-27-7',
		type: 'expense',
		amount: 80.00,
		description: 'Pago a proveedor',
		cashBoxId: '2',
		operationDetailId: '2',
		responsiblePersonId: '3',
		standId: null,
		companyId: '6',
		createdAt: '2025-09-27T12:00:00.000Z', // 27-09-2025 07:00 Perú
		updatedAt: '2025-09-27T12:00:00.000Z'
	},
	{
		id: 'mock-op-27-8',
		type: 'income',
		amount: 35.75,
		description: 'Venta al por menor',
		cashBoxId: '2',
		operationDetailId: '1',
		responsiblePersonId: '2',
		standId: '2',
		companyId: null,
		createdAt: '2025-09-27T12:30:00.000Z', // 27-09-2025 07:30 Perú
		updatedAt: '2025-09-27T12:30:00.000Z'
	},
	{
		id: 'mock-op-27-9',
		type: 'expense',
		amount: 12.25,
		description: 'Gastos de transporte',
		cashBoxId: '2',
		operationDetailId: '2',
		responsiblePersonId: '1',
		standId: null,
		companyId: null,
		createdAt: '2025-09-27T12:48:00.000Z', // 27-09-2025 07:48 Perú
		updatedAt: '2025-09-27T12:48:00.000Z'
	},
	{
		id: 'mock-op-27-10',
		type: 'income',
		amount: 90.00,
		description: 'Venta de productos premium',
		cashBoxId: '2',
		operationDetailId: '1',
		responsiblePersonId: '3',
		standId: '3',
		companyId: '7',
		createdAt: '2025-09-27T12:54:00.000Z', // 27-09-2025 07:54 Perú
		updatedAt: '2025-09-27T12:54:00.000Z'
	},
	{
		id: 'mock-op-27-11',
		type: 'expense',
		amount: 288.50, // Ajustado para que la caja termine en 200
		description: 'Cierre de caja - Retiro final',
		cashBoxId: '2',
		operationDetailId: '2',
		responsiblePersonId: '1',
		standId: null,
		companyId: null,
		createdAt: '2025-09-27T13:00:00.000Z', // 27-09-2025 08:00 Perú
		updatedAt: '2025-09-27T13:00:00.000Z'
	},

	// Operaciones del 30 de septiembre de 2025 (fechas fijas para Perú)
	{
		id: 'mock-op-30-1',
		type: 'income',
		amount: 80.00,
		description: 'Venta de productos - Stand A',
		cashBoxId: '3',
		operationDetailId: '1',
		responsiblePersonId: '1',
		standId: '1',
		companyId: '1',
		createdAt: '2025-09-30T06:00:00.000Z', // 30-09-2025 01:00 Perú
		updatedAt: '2025-09-30T06:00:00.000Z'
	},
	{
		id: 'mock-op-30-2',
		type: 'income',
		amount: 95.50,
		description: 'Venta de servicios - Stand B',
		cashBoxId: '3',
		operationDetailId: '1',
		responsiblePersonId: '2',
		standId: '2',
		companyId: '2',
		createdAt: '2025-09-30T07:00:00.000Z', // 30-09-2025 02:00 Perú
		updatedAt: '2025-09-30T07:00:00.000Z'
	},
	{
		id: 'mock-op-30-3',
		type: 'expense',
		amount: 35.00,
		description: 'Compra de materiales',
		cashBoxId: '3',
		operationDetailId: '2',
		responsiblePersonId: '1',
		standId: null,
		companyId: '3',
		createdAt: '2025-09-30T08:00:00.000Z', // 30-09-2025 03:00 Perú
		updatedAt: '2025-09-30T08:00:00.000Z'
	},
	{
		id: 'mock-op-30-4',
		type: 'income',
		amount: 140.00,
		description: 'Venta mayorista',
		cashBoxId: '3',
		operationDetailId: '1',
		responsiblePersonId: '3',
		standId: '3',
		companyId: '4',
		createdAt: '2025-09-30T09:00:00.000Z', // 30-09-2025 04:00 Perú
		updatedAt: '2025-09-30T09:00:00.000Z'
	},
	{
		id: 'mock-op-30-5',
		type: 'expense',
		amount: 25.50,
		description: 'Pago de servicios básicos',
		cashBoxId: '3',
		operationDetailId: '2',
		responsiblePersonId: '2',
		standId: null,
		companyId: null,
		createdAt: '2025-09-30T10:00:00.000Z', // 30-09-2025 05:00 Perú
		updatedAt: '2025-09-30T10:00:00.000Z'
	},
	{
		id: 'mock-op-30-6',
		type: 'income',
		amount: 180.00,
		description: 'Venta especial - Cliente VIP',
		cashBoxId: '3',
		operationDetailId: '1',
		responsiblePersonId: '1',
		standId: '1',
		companyId: '5',
		createdAt: '2025-09-30T11:00:00.000Z', // 30-09-2025 06:00 Perú
		updatedAt: '2025-09-30T11:00:00.000Z'
	},
	{
		id: 'mock-op-30-7',
		type: 'expense',
		amount: 70.00,
		description: 'Pago a proveedor',
		cashBoxId: '3',
		operationDetailId: '2',
		responsiblePersonId: '3',
		standId: null,
		companyId: '6',
		createdAt: '2025-09-30T12:00:00.000Z', // 30-09-2025 07:00 Perú
		updatedAt: '2025-09-30T12:00:00.000Z'
	},
	{
		id: 'mock-op-30-8',
		type: 'income',
		amount: 45.75,
		description: 'Venta al por menor',
		cashBoxId: '3',
		operationDetailId: '1',
		responsiblePersonId: '2',
		standId: '2',
		companyId: null,
		createdAt: '2025-09-30T12:30:00.000Z', // 30-09-2025 07:30 Perú
		updatedAt: '2025-09-30T12:30:00.000Z'
	},
	{
		id: 'mock-op-30-9',
		type: 'expense',
		amount: 22.25,
		description: 'Gastos de transporte',
		cashBoxId: '3',
		operationDetailId: '2',
		responsiblePersonId: '1',
		standId: null,
		companyId: null,
		createdAt: '2025-09-30T12:48:00.000Z', // 30-09-2025 07:48 Perú
		updatedAt: '2025-09-30T12:48:00.000Z'
	},
	{
		id: 'mock-op-30-10',
		type: 'income',
		amount: 110.00,
		description: 'Venta de productos premium',
		cashBoxId: '3',
		operationDetailId: '1',
		responsiblePersonId: '3',
		standId: '3',
		companyId: '7',
		createdAt: '2025-09-30T12:54:00.000Z', // 30-09-2025 07:54 Perú
		updatedAt: '2025-09-30T12:54:00.000Z'
	},
	{
		id: 'mock-op-30-11',
		type: 'expense',
		amount: 360.50, // Ajustado para que la caja termine en 150
		description: 'Cierre de caja - Retiro final',
		cashBoxId: '3',
		operationDetailId: '2',
		responsiblePersonId: '1',
		standId: null,
		companyId: null,
		createdAt: '2025-09-30T13:00:00.000Z', // 30-09-2025 08:00 Perú
		updatedAt: '2025-09-30T13:00:00.000Z'
	}
]);

// Función para agregar nueva operación mock
export function addMockOperation(data: any, createdAt?: string, updatedAt?: string) {
	// Obtener la caja para usar su businessDate
	const cashBox = mockCashBoxes.find(cb => cb.id === data.cashBoxId);
	const businessDate = cashBox?.businessDate || toBusinessDate(createdAt || new Date().toISOString());
	
	console.log('🔄 Adding mock operation:', {
		cashBoxId: data.cashBoxId,
		cashBoxName: cashBox?.name,
		businessDate: businessDate,
		amount: data.amount,
		type: data.type
	});
	
	const newOperation = {
		id: 'mock-op-' + Date.now(),
		type: data.type,
		amount: data.amount,
		description: data.description,
		cashBoxId: data.cashBoxId,
		operationDetailId: data.operationDetailId || null,
		responsiblePersonId: data.responsiblePersonId || null,
		standId: data.standId || null,
		companyId: data.companyId || null,
		createdAt: createdAt || new Date().toISOString(),
		updatedAt: updatedAt || new Date().toISOString(),
		businessDate: businessDate // Usar el businessDate de la caja
	};
	mockOperations.unshift(newOperation); // Agregar al inicio
	return newOperation;
}

// Función para calcular saldo derivado (eliminando currentAmount persistido)
export function computeCurrentAmount(cashBoxId: string): number {
	const cashBox = mockCashBoxes.find(cb => cb.id === cashBoxId);
	if (!cashBox) return 0;
	
	const operations = mockOperations.filter(op => op.cashBoxId === cashBoxId);
	const delta = operations.reduce((acc, op) => {
		return acc + (op.type === 'income' ? op.amount : -op.amount);
	}, 0);
	
	return cashBox.openingAmount + delta;
}

// Función para agregar nuevo stand mock
export function addMockStand(name: string, location: string) {
	const newStand = {
		id: 'mock-stand-' + Date.now(),
		name,
		location,
		status: 'active' as const,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockStands.unshift(newStand); // Agregar al inicio
	return newStand;
}

// Función para agregar nuevo responsable mock
export function addMockResponsiblePerson(name: string, email: string, phone?: string) {
	const newPerson = {
		id: 'mock-person-' + Date.now(),
		name,
		email,
		phone: phone || '',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockResponsiblePersons.unshift(newPerson); // Agregar al inicio
	return newPerson;
}

// Función para agregar nuevo detalle de operación mock
export function addMockOperationDetail(name: string, type: 'income' | 'expense', category: string) {
	const newDetail = {
		id: 'mock-detail-' + Date.now(),
		name,
		type,
		category,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockOperationDetails.unshift(newDetail); // Agregar al inicio
	return newDetail;
}

// Función para actualizar monto de caja mock
// Función para actualizar monto de caja (simulación) - DEPRECATED
// Ahora usamos saldo derivado con computeCurrentAmount()
export async function updateMockCashBoxAmount(cashBoxId: string, amount: number, type: 'income' | 'expense') {
	// Esta función ya no es necesaria con saldo derivado
	console.log(`Operación ${type} de ${amount} para caja ${cashBoxId} - Saldo derivado: ${computeCurrentAmount(cashBoxId)}`);
}

// Función para agregar nueva empresa mock
export function addMockCompany(razonSocial: string, ruc: string) {
	const newCompany = {
		id: 'mock-company-' + Date.now(),
		razonSocial,
		ruc,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	// Agregar a la lista de empresas
	mockCompanies.unshift(newCompany);
	// Actualizar la empresa mock global para compatibilidad
	Object.assign(mockCompany, newCompany);
	return newCompany;
}

// Función para actualizar empresa mock
export function updateMockCompany(id: string, razonSocial?: string, ruc?: string) {
	if (razonSocial !== undefined) {
		mockCompany.razonSocial = razonSocial;
	}
	if (ruc !== undefined) {
		mockCompany.ruc = ruc;
	}
	mockCompany.updatedAt = new Date().toISOString();
	console.log(`Empresa actualizada: ${mockCompany.razonSocial} - ${mockCompany.ruc}`);
}

export const mockCompanies = [
	{
		id: '1',
		razonSocial: 'Empresa Demo S.A.C.',
		ruc: '20123456789',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];

// Mantener compatibilidad con código existente
export const mockCompany = mockCompanies[0];
