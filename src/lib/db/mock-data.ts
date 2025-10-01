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
	reopenReason?: string;
	reopenNotes?: string;
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
		
		// Calcular saldo final dinámicamente
		const finalBalance = computeCurrentAmount(id);
		cashBox.finalBalance = finalBalance;
		
		console.log(`🔒 Cerrando caja ${cashBox.name}:`);
		console.log(`   - Monto inicial: ${cashBox.openingAmount}`);
		console.log(`   - Saldo final calculado: ${finalBalance}`);
		
		// Si hay saldo positivo, marcarlo como pendiente
		if (finalBalance > 0) {
			cashBox.pendingBalance = finalBalance;
			cashBox.pendingBalanceTransferred = false;
			upsertPendingBalance({
				id: `pending-${cashBox.id}`,
				cashBoxId: cashBox.id,
				amount: finalBalance,
				date: cashBox.businessDate,
				status: 'pending',
				notes: `Saldo pendiente de ${cashBox.name}`
			});
			console.log(`   ⚠️ SALDO PENDIENTE: ${finalBalance} soles (no transferido)`);
		} else {
			cashBox.pendingBalance = 0;
			cashBox.pendingBalanceTransferred = true;
			removePendingBalance(cashBox.id);
			console.log(`   ✅ Sin saldo pendiente`);
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

// Función para actualizar operación mock
export function updateMockOperation(operationId: string, updateData: Partial<typeof mockOperations[0]>): boolean {
	console.log('🔧 updateMockOperation - ID:', operationId);
	console.log('🔧 updateMockOperation - Update data:', updateData);
	console.log('🔧 updateMockOperation - Mock operations before:', mockOperations.length);
	
	const index = mockOperations.findIndex(op => op.id === operationId);
	console.log('🔧 updateMockOperation - Found index:', index);
	
	if (index !== -1) {
		const oldOperation = { ...mockOperations[index] };
		mockOperations[index] = { ...mockOperations[index], ...updateData };
		console.log('🔧 updateMockOperation - Old operation:', oldOperation);
		console.log('🔧 updateMockOperation - New operation:', mockOperations[index]);
		return true;
	}
	
	console.log('🔧 updateMockOperation - Operation not found!');
	return false;
}

// Función para eliminar operación mock
export function deleteMockOperation(operationId: string): boolean {
	const index = mockOperations.findIndex(op => op.id === operationId);
	if (index !== -1) {
		mockOperations.splice(index, 1);
		return true;
	}
	return false;
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

export function upsertPendingBalance(pending: PendingBalance) {
	const existing = mockPendingBalances.find(pb => pb.id === pending.id || pb.cashBoxId === pending.cashBoxId);
	if (existing) {
		Object.assign(existing, pending);
	} else {
		mockPendingBalances.push(pending);
	}
	console.log('🗂️ Pending balance actualizado/creado:', pending);
}

export function removePendingBalance(cashBoxId: string) {
	const index = mockPendingBalances.findIndex(pb => pb.cashBoxId === cashBoxId);
	if (index !== -1) {
		const removed = mockPendingBalances.splice(index, 1)[0];
		console.log('🗂️ Pending balance eliminado:', removed);
	}
}

// ============================================================================
// FUNCIONES DE SALDO PENDIENTE
// ============================================================================

// Función para buscar la última caja con saldo pendiente
export function findLastPendingBalance(currentDate: string): PendingBalance | null {
	console.log(`🔍 Buscando saldos pendientes para fecha: ${currentDate}`);
	console.log(`📊 mockPendingBalances actuales:`, mockPendingBalances);

	const availablePendings = mockPendingBalances
		.filter(pb => pb.status === 'pending' && pb.date < currentDate)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	if (availablePendings.length > 0) {
		const pending = availablePendings[0];
		console.log(`✅ SALDO PENDIENTE ENCONTRADO: ${pending.amount} soles (caja ${pending.cashBoxId})`);
		return pending;
	}

	console.log(`❌ No hay saldos pendientes anteriores a ${currentDate}`);
	return null;
}

export function validatePendingBalance(pendingBalance: PendingBalance, currentDate: string): boolean {
	const pendingDate = pendingBalance.date;
	const current = new Date(currentDate);
	const pending = new Date(pendingDate);
	return pending < current;
}

export function markPendingBalanceAsHandled(
	pendingBalanceId: string,
	action: 'transferred' | 'returned' | 'handled',
	notes?: string
): { success: boolean; error?: string } {
	const pendingBalance = mockPendingBalances.find(pb => pb.id === pendingBalanceId);
	if (!pendingBalance) {
		const error = `Pending balance ${pendingBalanceId} not found`;
		console.error('❌', error);
		return { success: false, error };
	}

	pendingBalance.status = action === 'transferred' ? 'transferred' : action === 'returned' ? 'returned' : 'handled';
	pendingBalance.handledAt = new Date().toISOString();
	if (notes) {
		pendingBalance.notes = notes;
	}

	const cashBox = mockCashBoxes.find(cb => cb.id === pendingBalance.cashBoxId);
	if (cashBox) {
		cashBox.pendingBalanceTransferred = true;
		if (action !== 'transferred') {
			cashBox.pendingBalance = 0;
		}
		console.log(`✅ Saldo pendiente marcado como ${action} para ${cashBox.name}`);
	}

	console.log('🗂️ Estado actualizado para pendingBalance:', pendingBalance);
	return { success: true };
}

export function transferPendingBalanceToCurrentBox(
	pendingBalanceId: string,
	currentCashBoxId: string
): { success: boolean; amount?: number; originalCashBoxId?: string; currentCashBoxId?: string; error?: string } {	
	console.log('🔄 transferPendingBalanceToCurrentBox - START');
	console.log('   pendingBalanceId:', pendingBalanceId);
	console.log('   currentCashBoxId:', currentCashBoxId);
	
	const pendingBalance = mockPendingBalances.find(pb => pb.id === pendingBalanceId);
	if (!pendingBalance) {
		const error = `Pending balance ${pendingBalanceId} not found`;
		console.error('❌', error);
		return { success: false, error };
	}
	console.log('✅ Pending balance found:', pendingBalance);

	const originalCashBox = mockCashBoxes.find(cb => cb.id === pendingBalance.cashBoxId);
	const currentCashBox = mockCashBoxes.find(cb => cb.id === currentCashBoxId);
	
	if (!originalCashBox) {
		const error = `Original cash box ${pendingBalance.cashBoxId} not found`;
		console.error('❌', error);
		return { success: false, error };
	}
	if (!currentCashBox) {
		const error = `Current cash box ${currentCashBoxId} not found`;
		console.error('❌', error);
		return { success: false, error };
	}
	
	console.log('✅ Original cash box:', originalCashBox);
	console.log('✅ Current cash box:', currentCashBox);

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
	console.log('📝 Creando operación EGRESO:', transferOutOperation);
	mockOperations.push(transferOutOperation);
	
	console.log('📝 Creando operación INGRESO:', transferInOperation);
	mockOperations.push(transferInOperation);
	
	console.log('📊 Total operaciones en mockOperations:', mockOperations.length);
	console.log('📊 Operaciones:', mockOperations.map(op => ({
		id: op.id,
		type: op.type,
		amount: op.amount,
		businessDate: op.businessDate,
		cashBoxId: op.cashBoxId
	})));
	
	// Actualizar el monto de apertura de la caja actual
	currentCashBox.openingAmount += pendingBalance.amount;
	
	console.log(`✅ Transferencia bidireccional completada: ${pendingBalance.amount} soles de ${originalCashBox.name} → ${currentCashBox.name}`);
	console.log('🔄 transferPendingBalanceToCurrentBox - END');
	return {
		success: true,
		amount: pendingBalance.amount,
		originalCashBoxId: originalCashBox.id,
		currentCashBoxId: currentCashBox.id
	};
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

