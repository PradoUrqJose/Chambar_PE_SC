// Mock data limpio para desarrollo local
// Solo datos esenciales - El usuario agregará sus propios datos

export interface MockCashBox {
	id: string;
	businessDate: string;                    // Fecha de negocio (YYYY-MM-DD)
	name: string;                            // "Caja 2025-10-01"
	status: 'empty' | 'open' | 'closed' | 'reopened';
	openingAmount: number;                   // Monto inicial al abrir
	finalBalance: number;                    // Saldo final calculado
	pendingBalance: number;                  // Saldo pendiente a transferir
	pendingBalanceTransferred: boolean;      // Si el saldo ya fue transferido
	openedAt: string | null;                 // Timestamp de apertura
	closedAt: string | null;                 // Timestamp de cierre
	reopenedAt: string | null;               // Timestamp de reapertura
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

// No hay cajas iniciales - se crearán dinámicamente por fecha
export const mockCashBoxes: MockCashBox[] = [];

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

// Función para obtener o crear caja para una fecha específica
export function getCashBoxByDate(businessDate: string): MockCashBox {
	// Buscar caja existente para esa fecha
	let cashBox = mockCashBoxes.find(cb => cb.businessDate === businessDate);
	
	// Si no existe, crear una nueva
	if (!cashBox) {
		cashBox = {
			id: `cashbox-${businessDate}-${Date.now()}`,
			businessDate,
			name: `Caja ${businessDate}`,
			status: 'empty',
			openingAmount: 0,
			finalBalance: 0,
			pendingBalance: 0,
			pendingBalanceTransferred: false,
			openedAt: null,
			closedAt: null,
			reopenedAt: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		mockCashBoxes.unshift(cashBox);
		console.log(`📦 Caja creada para fecha ${businessDate}:`, cashBox);
	}
	
	return cashBox;
}

// Función para actualizar el estado de una caja mock
export function updateMockCashBoxStatus(id: string, status: 'empty' | 'open' | 'closed' | 'reopened', openingAmount: number = 0, openedAt?: string) {
	const cashBox = mockCashBoxes.find(cb => cb.id === id);
	if (!cashBox) return;

	cashBox.status = status;
	cashBox.updatedAt = new Date().toISOString();

	if (status === 'open') {
		// Abrir caja por primera vez
		cashBox.openingAmount = openingAmount;
		cashBox.openedAt = openedAt || new Date().toISOString();
		cashBox.closedAt = null;
		cashBox.reopenedAt = null;
		console.log(`🟢 Caja ${cashBox.name} abierta con monto inicial: ${openingAmount}`);
		
	} else if (status === 'closed') {
		// Cerrar caja
		cashBox.closedAt = new Date().toISOString();
		
		// Calcular saldo final
		const finalBalance = computeCurrentAmount(id);
		cashBox.finalBalance = finalBalance;
		
		// Si hay saldo positivo, marcarlo como pendiente
		if (finalBalance > 0) {
			cashBox.pendingBalance = finalBalance;
			cashBox.pendingBalanceTransferred = false;
			console.log(`💰 Caja ${cashBox.name} cerrada con saldo pendiente: ${finalBalance} soles`);
		} else {
			cashBox.pendingBalance = 0;
			cashBox.pendingBalanceTransferred = true;
			console.log(`💰 Caja ${cashBox.name} cerrada sin saldo pendiente`);
		}
		
	} else if (status === 'reopened') {
		// Reabrir caja cerrada
		cashBox.reopenedAt = new Date().toISOString();
		console.log(`🟡 Caja ${cashBox.name} reaperturada`);
	}
}

// Función para agregar nueva caja mock
export function addMockCashBox(businessDate: string, name?: string) {
	const newCashBox: MockCashBox = {
		id: 'mock-cashbox-' + Date.now(),
		businessDate,
		name: name || `Caja ${businessDate}`,
		status: 'empty',
		openingAmount: 0,
		finalBalance: 0,
		pendingBalance: 0,
		pendingBalanceTransferred: false,
		openedAt: null,
		closedAt: null,
		reopenedAt: null,
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

// Función para buscar la última caja con saldo pendiente
export function findLastPendingBalance(currentDate: string): PendingBalance | null {
	// Buscar cajas cerradas con saldo pendiente no transferido
	const closedBoxes = mockCashBoxes.filter(cb => 
		cb.status === 'closed' && 
		cb.pendingBalance > 0 &&
		cb.pendingBalanceTransferred === false &&
		cb.businessDate < currentDate
	);
	
	// Ordenar por fecha descendente (más reciente primero)
	const sortedByDate = closedBoxes.sort((a, b) => 
		new Date(b.businessDate).getTime() - new Date(a.businessDate).getTime()
	);
	
	// Retornar la más reciente
	if (sortedByDate.length > 0) {
		const cashBox = sortedByDate[0];
		
		// Crear o actualizar el saldo pendiente
		let existingPending = mockPendingBalances.find(pb => pb.cashBoxId === cashBox.id);
		if (!existingPending) {
			existingPending = {
				id: `pending-${cashBox.id}`,
				cashBoxId: cashBox.id,
				amount: cashBox.pendingBalance,
				date: cashBox.businessDate,
				status: 'pending',
				notes: `Saldo pendiente de ${cashBox.name}`
			};
			mockPendingBalances.push(existingPending);
		} else {
			existingPending.amount = cashBox.pendingBalance;
		}
		
		console.log(`🔍 Saldo pendiente encontrado: ${cashBox.pendingBalance} soles de ${cashBox.name}`);
		return existingPending;
	}
	
	console.log(`🔍 No hay saldos pendientes para la fecha ${currentDate}`);
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
		
		// Marcar la caja original como transferida
		const cashBox = mockCashBoxes.find(cb => cb.id === pendingBalance.cashBoxId);
		if (cashBox) {
			cashBox.pendingBalanceTransferred = true;
			console.log(`✅ Saldo pendiente marcado como ${action} para ${cashBox.name}`);
		}
	}
}

export function transferPendingBalanceToCurrentBox(pendingBalanceId: string, currentCashBoxId: string) {	
	const pendingBalance = mockPendingBalances.find(pb => pb.id === pendingBalanceId);
	if (!pendingBalance) return;

	const originalCashBox = mockCashBoxes.find(cb => cb.id === pendingBalance.cashBoxId);
	const currentCashBox = mockCashBoxes.find(cb => cb.id === currentCashBoxId);
	
	if (!originalCashBox || !currentCashBox) return;

	// Marcar el saldo como transferido
	pendingBalance.status = 'transferred';
	pendingBalance.handledAt = new Date().toISOString();
	pendingBalance.notes = `Transferido a ${currentCashBox.name}`;
	
	originalCashBox.pendingBalanceTransferred = true;
	
	// Crear operación de EGRESO en la caja original
	const transferOutOperation = {
		id: `transfer-out-${Date.now()}`,
		type: 'expense' as const,
		amount: pendingBalance.amount,
		description: `Transferencia de saldo a ${currentCashBox.name}`,
		cashBoxId: originalCashBox.id,
		businessDate: originalCashBox.businessDate,
		companyId: null,
		operationDetailId: null,
		responsiblePersonId: null,
		standId: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	
	// Crear operación de INGRESO en la caja actual
	const transferInOperation = {
		id: `transfer-in-${Date.now() + 1}`,
		type: 'income' as const,
		amount: pendingBalance.amount,
		description: `Transferencia de saldo desde ${originalCashBox.name}`,
		cashBoxId: currentCashBox.id,
		businessDate: currentCashBox.businessDate,
		companyId: null,
		operationDetailId: null,
		responsiblePersonId: null,
		standId: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	
	// Agregar ambas operaciones
	mockOperations.push(transferOutOperation);
	mockOperations.push(transferInOperation);
	
	// Actualizar el monto de apertura de la caja actual
	currentCashBox.openingAmount += pendingBalance.amount;
	
	console.log(`💸 Transferencia bidireccional: ${pendingBalance.amount} soles de ${originalCashBox.name} → ${currentCashBox.name}`);
}

export function debugPendingBalanceData() {
	console.log('📊 mockCashBoxes:', mockCashBoxes.map(cb => ({
		id: cb.id,
		name: cb.name,
		businessDate: cb.businessDate,
		status: cb.status,
		finalBalance: cb.finalBalance,
		pendingBalance: cb.pendingBalance,
		pendingBalanceTransferred: cb.pendingBalanceTransferred
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

