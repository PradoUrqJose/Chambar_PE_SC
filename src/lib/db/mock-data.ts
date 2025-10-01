// Mock data limpio para desarrollo local
// Solo datos esenciales - El usuario agregará sus propios datos

export interface MockCashBox {
	id: string;
	name: string;
	status: 'empty' | 'open' | 'closed' | 'reopened';
	openingAmount: number;
	pendingBalance: number;
	pendingBalanceHandled: boolean;
	openedAt: string | null;
	originalOpenedAt: string | null;
	closedAt: string | null;
	reopenedAt: string | null;
	businessDate: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface PendingBalance {
	id: string;
	cashBoxId: string;
	amount: number;
	date: string;
	status: 'pending' | 'transferred' | 'returned' | 'handled';
	handledAt?: string;
	notes?: string;
}

// ============================================================================
// DATOS MOCK - SOLO CAJA PRINCIPAL VACÍA
// ============================================================================

export const mockCashBoxes: MockCashBox[] = [
	{
		id: '1',
		name: 'Caja Principal',
		status: 'empty',
		openingAmount: 0.00,
		pendingBalance: 0.00,
		pendingBalanceHandled: true,
		openedAt: null,
		originalOpenedAt: null,
		closedAt: null,
		reopenedAt: null,
		businessDate: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];

// ============================================================================
// OPERACIONES - ARRAY VACÍO
// ============================================================================

export const mockOperations: any[] = [];

// ============================================================================
// SALDOS PENDIENTES - ARRAY VACÍO
// ============================================================================

export const mockPendingBalances: PendingBalance[] = [];

// ============================================================================
// CATÁLOGOS - DATOS ESENCIALES
// ============================================================================

export const mockOperationDetails = [
	{ id: '1', name: 'Venta', type: 'income', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
	{ id: '2', name: 'Compra', type: 'expense', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const mockResponsiblePersons = [
	{ id: '1', name: 'Usuario Demo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const mockStands = [
	{ id: '1', name: 'Stand 1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const mockCompanies = [
	{ id: '1', razonSocial: 'Empresa Demo S.A.C.', ruc: '20123456789', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const mockCompany = mockCompanies[0];

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

// Convertir UTC a fecha de negocio en zona horaria de Perú
function toBusinessDate(isoDateString: string | null): string | null {
	if (!isoDateString) return null;
	const date = new Date(isoDateString);
	const peruDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Lima' }));
	return peruDate.toISOString().split('T')[0];
}

// Función para actualizar el estado de una caja mock
export function updateMockCashBoxStatus(id: string, status: 'empty' | 'open' | 'closed' | 'reopened', openingAmount: number = 0, openedAt?: string) {
	const cashBox = mockCashBoxes.find(cb => cb.id === id);
	if (cashBox) {
		cashBox.status = status;
		
		if (status === 'open' || status === 'reopened') {
			if (status === 'open') {
				cashBox.openingAmount = openingAmount;
			}
			cashBox.openedAt = openedAt || new Date().toISOString();
			cashBox.closedAt = null;
			
			if (status === 'reopened') {
				cashBox.reopenedAt = new Date().toISOString();
				if (!cashBox.originalOpenedAt) {
					cashBox.originalOpenedAt = cashBox.openedAt || new Date().toISOString();
				}
			} else {
				cashBox.originalOpenedAt = cashBox.openedAt || new Date().toISOString();
				cashBox.businessDate = toBusinessDate(cashBox.openedAt);
			}
		} else if (status === 'closed') {
			cashBox.closedAt = new Date().toISOString();
			cashBox.reopenedAt = null;
			
			// Calcular saldo pendiente dinámicamente
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
			cashBox.openedAt = null;
			cashBox.closedAt = null;
			cashBox.reopenedAt = null;
			cashBox.businessDate = null;
		}
		cashBox.updatedAt = new Date().toISOString();
	}
}

// Función para agregar nueva caja mock
export function addMockCashBox(name: string) {
	const newCashBox: MockCashBox = {
		id: 'mock-cashbox-' + Date.now(),
		name,
		status: 'empty',
		openingAmount: 0,
		pendingBalance: 0,
		pendingBalanceHandled: true,
		openedAt: null,
		originalOpenedAt: null,
		closedAt: null,
		reopenedAt: null,
		businessDate: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockCashBoxes.unshift(newCashBox);
	return newCashBox;
}

// Función para agregar operación mock
export function addMockOperation(operation: {
	type: 'income' | 'expense';
	amount: number;
	description: string;
	cashBoxId: string;
	companyId: string | null;
	operationDetailId: string | null;
	responsiblePersonId: string | null;
	standId: string | null;
}) {
	const cashBox = mockCashBoxes.find(cb => cb.id === operation.cashBoxId);
	const businessDate = cashBox?.businessDate || new Date().toISOString().split('T')[0];

	const newOperation = {
		id: 'mock-op-' + Date.now(),
		...operation,
		businessDate,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	mockOperations.unshift(newOperation);
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
	
	return total;
}

// ============================================================================
// FUNCIONES DE SALDO PENDIENTE
// ============================================================================

export function findLastPendingBalance(currentDate: string): PendingBalance | null {
	const closedBoxes = mockCashBoxes.filter(cb => 
		cb.status === 'closed' && 
		cb.pendingBalanceHandled === false &&
		cb.businessDate && 
		cb.businessDate < currentDate
	);
	
	const sortedByDate = closedBoxes.sort((a, b) => 
		new Date(b.businessDate!).getTime() - new Date(a.businessDate!).getTime()
	);
	
	for (const cashBox of sortedByDate) {
		if (cashBox.pendingBalance > 0) {
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

export function validatePendingBalance(pendingBalance: PendingBalance, currentDate: string): boolean {
	const pendingDate = pendingBalance.date;
	const current = new Date(currentDate);
	const pending = new Date(pendingDate);
	return pending < current;
}

export function markPendingBalanceAsHandled(pendingBalanceId: string, action: 'transferred' | 'returned' | 'handled', notes?: string) {
	const pendingBalance = mockPendingBalances.find(pb => pb.id === pendingBalanceId);
	if (pendingBalance) {
		pendingBalance.status = action === 'transferred' ? 'transferred' : action === 'returned' ? 'returned' : 'handled';
		pendingBalance.handledAt = new Date().toISOString();
		if (notes) {
			pendingBalance.notes = notes;
		}
		
		const cashBox = mockCashBoxes.find(cb => cb.id === pendingBalance.cashBoxId);
		if (cashBox) {
			cashBox.pendingBalanceHandled = true;
		}
	}
}

export function transferPendingBalanceToCurrentBox(pendingBalanceId: string, currentCashBoxId: string) {	
	const pendingBalance = mockPendingBalances.find(pb => pb.id === pendingBalanceId);
	if (pendingBalance) {		
		pendingBalance.status = 'transferred';
		pendingBalance.handledAt = new Date().toISOString();
		pendingBalance.notes = `Transferido a caja ${currentCashBoxId}`;
		
		const originalCashBox = mockCashBoxes.find(cb => cb.id === pendingBalance.cashBoxId);
		if (originalCashBox) {
			originalCashBox.pendingBalanceHandled = true;
			originalCashBox.pendingBalance = 0;
			
			// Crear operación de EGRESO en la caja original
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
			
			mockOperations.push(transferOutOperation);
			console.log('💰 TRANSFER OUT operation created:', transferOutOperation);
		}
		
		const currentCashBox = mockCashBoxes.find(cb => cb.id === currentCashBoxId);
		if (currentCashBox) {
			currentCashBox.openingAmount += pendingBalance.amount;
			
			// Crear operación de INGRESO en la caja actual
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
			
			mockOperations.push(transferInOperation);
			console.log('💰 TRANSFER IN operation created:', transferInOperation);
		}
	}
}

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

// ============================================================================
// CATÁLOGOS - FUNCIONES CRUD
// ============================================================================

export function addMockOperationDetail(name: string, type: 'income' | 'expense') {
	const newDetail = {
		id: 'mock-detail-' + Date.now(),
		name,
		type,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockOperationDetails.unshift(newDetail);
	return newDetail;
}

export function updateMockOperationDetail(id: string, name?: string, type?: 'income' | 'expense') {
	const detail = mockOperationDetails.find(d => d.id === id);
	if (detail) {
		if (name !== undefined) detail.name = name;
		if (type !== undefined) detail.type = type;
		detail.updatedAt = new Date().toISOString();
	}
}

export function addMockResponsiblePerson(name: string) {
	const newPerson = {
		id: 'mock-person-' + Date.now(),
		name,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockResponsiblePersons.unshift(newPerson);
	return newPerson;
}

export function updateMockResponsiblePerson(id: string, name: string) {
	const person = mockResponsiblePersons.find(p => p.id === id);
	if (person) {
		person.name = name;
		person.updatedAt = new Date().toISOString();
	}
}

export function addMockStand(name: string) {
	const newStand = {
		id: 'mock-stand-' + Date.now(),
		name,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockStands.unshift(newStand);
	return newStand;
}

export function updateMockStand(id: string, name: string) {
	const stand = mockStands.find(s => s.id === id);
	if (stand) {
		stand.name = name;
		stand.updatedAt = new Date().toISOString();
	}
}

export function addMockCompany(razonSocial: string, ruc: string) {
	const newCompany = {
		id: 'mock-company-' + Date.now(),
		razonSocial,
		ruc,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockCompanies.unshift(newCompany);
	Object.assign(mockCompany, newCompany);
	return newCompany;
}

export function updateMockCompany(id: string, razonSocial?: string, ruc?: string) {
	if (razonSocial !== undefined) {
		mockCompany.razonSocial = razonSocial;
	}
	if (ruc !== undefined) {
		mockCompany.ruc = ruc;
	}
	mockCompany.updatedAt = new Date().toISOString();
}

