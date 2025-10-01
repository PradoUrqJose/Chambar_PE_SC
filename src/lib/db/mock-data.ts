// Datos mock para desarrollo local cuando D1 no está disponible
// Esquema robusto con business_date y estado unificado

import { toBusinessDate, toPeruISOString } from '$lib/utils/date-helpers';

// Interfaz específica para cajas mock
interface MockCashBox {
	id: string;
	name: string;
	status: 'open' | 'closed' | 'reopened' | 'empty';
	openingAmount: number;
	pendingBalance: number; // ← Nuevo campo
	pendingBalanceHandled: boolean; // ← Nuevo campo
	openedAt: string | null;
	originalOpenedAt: string | null;
	closedAt: string | null;
	reopenedAt: string | null;
	businessDate: string | null;
	createdAt: string;
	updatedAt: string;
}

// Estructura para saldos pendientes
export interface PendingBalance {
	id: string;
	cashBoxId: string;
	amount: number;
	date: string;
	status: 'pending' | 'transferred' | 'returned' | 'handled';
	handledAt?: string;
	notes?: string;
}

export const mockCashBoxes: MockCashBox[] = [
	{
		id: '1',
		name: 'Caja Principal',
		status: 'empty', // Estado inicial vacío para que el usuario lo abra
		openingAmount: 0.00, // Sin monto inicial
		pendingBalance: 0.00, // Sin saldo pendiente
		pendingBalanceHandled: true, // Sin saldo pendiente
		openedAt: null as string | null, // No abierta
		originalOpenedAt: null as string | null,
		closedAt: null as string | null,
		reopenedAt: null as string | null,
		businessDate: null as string | null, // Sin fecha de negocio aún
		createdAt: '2025-10-01T05:00:00.000Z',
		updatedAt: '2025-10-01T05:00:00.000Z'
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
			
			// Al cerrar, calcular el saldo pendiente basado en las operaciones
			const currentBalance = computeCurrentAmount(id);
			if (currentBalance > 0) {
				cashBox.pendingBalance = currentBalance;
				cashBox.pendingBalanceHandled = false;
				console.log(`💰 Caja ${cashBox.name} cerrada con saldo pendiente: ${currentBalance} soles`);
			} else {
				cashBox.pendingBalance = 0;
				cashBox.pendingBalanceHandled = true;
				console.log(`💰 Caja ${cashBox.name} cerrada sin saldo pendiente`);
			}
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
		pendingBalance: 0.00,
		pendingBalanceHandled: true,
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

// Función para calcular saldo derivado (solo suma de operaciones)
export function computeCurrentAmount(cashBoxId: string): number {
	const cashBox = mockCashBoxes.find(cb => cb.id === cashBoxId);
	if (!cashBox) return 0;
	
	const operations = mockOperations.filter(op => op.cashBoxId === cashBoxId);
	const total = operations.reduce((acc, op) => {
		return acc + (op.type === 'income' ? op.amount : -op.amount);
	}, 0);
	
	// NO sumar openingAmount - ya está incluido en las operaciones de apertura
	return total;
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

// Array de saldos pendientes
export const mockPendingBalances: PendingBalance[] = [
	{
		id: 'pending-1',
		cashBoxId: '3', // Caja 30 Septiembre
		amount: 430.50, // ← Saldo correcto de 430.50 soles
		date: '2025-09-30', // ← Fecha correcta
		status: 'pending',
		notes: 'Saldo pendiente de caja cerrada el 30/09 (150 inicial + 280.5 operaciones)'
	}
];

// Función para simular el cierre de una caja con cálculo dinámico
export function simulateCashBoxClosure(cashBoxId: string): void {
	const cashBox = mockCashBoxes.find(cb => cb.id === cashBoxId);
	if (!cashBox) return;

	// Calcular el saldo actual basado en las operaciones
	const currentBalance = computeCurrentAmount(cashBoxId);
	
	// Actualizar el estado de la caja
	cashBox.status = 'closed';
	cashBox.closedAt = new Date().toISOString();
	cashBox.updatedAt = new Date().toISOString();

	// Calcular saldo pendiente dinámicamente
	if (currentBalance > 0) {
		cashBox.pendingBalance = currentBalance;
		cashBox.pendingBalanceHandled = false;
		console.log(`💰 Caja ${cashBox.name} cerrada con saldo pendiente: ${currentBalance} soles`);
	} else {
		cashBox.pendingBalance = 0;
		cashBox.pendingBalanceHandled = true;
		console.log(`💰 Caja ${cashBox.name} cerrada sin saldo pendiente`);
	}
}

// Función de debug para verificar datos
export function debugPendingBalanceData() {
	console.log('📊 mockCashBoxes:', mockCashBoxes.map(cb => ({
		id: cb.id,
		name: cb.name,
		businessDate: cb.businessDate,
		pendingBalance: cb.pendingBalance,
		pendingBalanceHandled: cb.pendingBalanceHandled
	})));
	console.log('📊 mockPendingBalances:', mockPendingBalances);
}

// Función para buscar la última caja anterior con saldo pendiente
export function findLastPendingBalance(currentDate: string): PendingBalance | null {
	// 1. Obtener todas las cajas cerradas que no han sido manejadas
	const closedBoxes = mockCashBoxes.filter(cb => 
		cb.status === 'closed' && 
		cb.pendingBalanceHandled === false &&
		cb.businessDate && 
		cb.businessDate < currentDate // ← CLAVE: Solo anteriores
	);
	
	// 2. Ordenar por fecha descendente (más reciente primero)
	const sortedByDate = closedBoxes.sort((a, b) => 
		new Date(b.businessDate!).getTime() - new Date(a.businessDate!).getTime()
	);
	
	// 3. Buscar la primera caja que tenga saldo pendiente
	for (const cashBox of sortedByDate) {
		// El saldo pendiente ya se calculó al cerrar la caja
		if (cashBox.pendingBalance > 0) {
			// Crear o actualizar el saldo pendiente
			const existingPending = mockPendingBalances.find(pb => pb.cashBoxId === cashBox.id);
			if (existingPending) {
				existingPending.amount = cashBox.pendingBalance;
			} else {
				mockPendingBalances.push({
					id: `pending-${cashBox.id}`,
					cashBoxId: cashBox.id,
					amount: cashBox.pendingBalance,
					date: cashBox.businessDate!,
					status: 'pending',
					notes: `Saldo pendiente de caja cerrada el ${cashBox.businessDate}`
				});
			}
			
			console.log(`🔍 Encontrado saldo pendiente: ${cashBox.pendingBalance} soles de ${cashBox.name}`);
			return mockPendingBalances.find(pb => pb.cashBoxId === cashBox.id) || null;
		}
	}
	
	console.log(`🔍 No se encontraron saldos pendientes para la fecha ${currentDate}`);
	return null;
}

// Función para validar que el saldo sea de una fecha anterior
export function validatePendingBalance(pendingBalance: PendingBalance, currentDate: string): boolean {
	const pendingDate = pendingBalance.date;
	const current = new Date(currentDate);
	const pending = new Date(pendingDate);
	
	// Solo permitir saldos de fechas anteriores
	return pending < current;
}

// Función para marcar saldo pendiente como manejado
export function markPendingBalanceAsHandled(pendingBalanceId: string, action: 'transferred' | 'returned' | 'handled', notes?: string) {	
	const pendingBalance = mockPendingBalances.find(pb => pb.id === pendingBalanceId);
	if (pendingBalance) {		
		// Actualizar el saldo pendiente
		pendingBalance.status = action;
		pendingBalance.handledAt = new Date().toISOString();
		if (notes) pendingBalance.notes = notes;
		
		// Marcar la caja como manejada
		const cashBox = mockCashBoxes.find(cb => cb.id === pendingBalance.cashBoxId);
		if (cashBox) {
			cashBox.pendingBalanceHandled = true;
			cashBox.pendingBalance = 0; // Resetear el saldo pendiente
		} else {
			console.error('❌ Cash box not found for pending balance:', pendingBalance.cashBoxId);
		}
	} else {
		console.error('❌ Pending balance not found:', pendingBalanceId);
	}
}

// Función para transferir saldo pendiente a caja actual
export function transferPendingBalanceToCurrentBox(pendingBalanceId: string, currentCashBoxId: string) {	
	const pendingBalance = mockPendingBalances.find(pb => pb.id === pendingBalanceId);
	if (pendingBalance) {		
		// Marcar como transferido
		pendingBalance.status = 'transferred';
		pendingBalance.handledAt = new Date().toISOString();
		pendingBalance.notes = `Transferido a caja ${currentCashBoxId}`;
		
		// Marcar la caja original como manejada y crear operación de egreso
		const originalCashBox = mockCashBoxes.find(cb => cb.id === pendingBalance.cashBoxId);
		if (originalCashBox) {
			originalCashBox.pendingBalanceHandled = true;
			originalCashBox.pendingBalance = 0; // Resetear el saldo pendiente
			
			// Crear operación de EGRESO en la caja original (transferencia de saldo pendiente)
			const transferOutOperation = {
				id: `transfer-out-${Date.now()}`,
				type: 'expense' as const,
				amount: pendingBalance.amount,
				description: `Transferencia de saldo pendiente a caja ${currentCashBoxId}`,
				cashBoxId: pendingBalance.cashBoxId,
				businessDate: originalCashBox.businessDate || new Date().toISOString().split('T')[0],
				companyId: null,
				operationDetailId: null,
				responsiblePersonId: null,
				standId: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			
			// Agregar la operación de egreso a mockOperations
			mockOperations.push(transferOutOperation);
			console.log('💰 TRANSFER OUT operation created:', transferOutOperation);

		} else {
			console.error('❌ Original cash box not found:', pendingBalance.cashBoxId);
		}
		
		// Agregar el monto a la caja actual
		const currentCashBox = mockCashBoxes.find(cb => cb.id === currentCashBoxId);
		if (currentCashBox) {
			currentCashBox.openingAmount += pendingBalance.amount;
			// Crear operación de INGRESO en la caja actual (transferencia de saldo pendiente)
			const transferInOperation = {
				id: `transfer-in-${Date.now()}`,
				type: 'income' as const,
				amount: pendingBalance.amount,
				description: `Transferencia de saldo pendiente desde caja ${pendingBalance.cashBoxId}`,
				cashBoxId: currentCashBoxId,
				businessDate: currentCashBox.businessDate || new Date().toISOString().split('T')[0],
				companyId: null,
				operationDetailId: null,
				responsiblePersonId: null,
				standId: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			
			// Agregar la operación de ingreso a mockOperations
			mockOperations.push(transferInOperation);
			console.log('💰 TRANSFER IN operation created:', transferInOperation);
			
			// Verificación específica de la caja modificada
			const modifiedBox = mockCashBoxes.find(cb => cb.id === currentCashBoxId);
		} else {
			console.error('❌ Current cash box not found:', currentCashBoxId);
		}
	} else {
		console.error('❌ Pending balance not found:', pendingBalanceId);
	}
}

// Función para agregar operaciones de apertura a todas las cajas existentes
export function addOpeningOperationsToAllBoxes() {
	
	mockCashBoxes.forEach(cashBox => {
		// Solo agregar operación de apertura si la caja tiene monto inicial y no tiene operación de apertura
		if (cashBox.openingAmount > 0) {
			const hasOpeningOperation = mockOperations.some(op => 
				op.cashBoxId === cashBox.id && 
				op.description.includes('Apertura de caja')
			);
			
			if (!hasOpeningOperation) {
				const openingOperation = {
					id: `opening-${cashBox.id}-${Date.now()}`,
					type: 'income' as const,
					amount: cashBox.openingAmount,
					description: `Apertura de caja - Monto inicial`,
					cashBoxId: cashBox.id,
					businessDate: cashBox.businessDate || new Date().toISOString().split('T')[0],
					companyId: null,
					operationDetailId: null,
					responsiblePersonId: null,
					standId: null,
					createdAt: cashBox.openedAt || new Date().toISOString(),
					updatedAt: cashBox.updatedAt || new Date().toISOString()
				};
				
				mockOperations.unshift(openingOperation);
			}
		}
	});
	
}

// Función para inicializar el estado dinámico de las cajas
export function initializeDynamicCashBoxes() {
	// Simular el cierre de la caja del 30 de septiembre con saldo pendiente
	simulateCashBoxClosure('3'); // Caja 30 Septiembre
	
	console.log('🚀 Estado dinámico inicializado:');
	console.log('📊 Caja 30 Septiembre - Saldo pendiente:', mockCashBoxes.find(cb => cb.id === '3')?.pendingBalance);
}

// Agregar operaciones de apertura a todas las cajas al cargar
addOpeningOperationsToAllBoxes();

// Inicializar el estado dinámico
initializeDynamicCashBoxes();
