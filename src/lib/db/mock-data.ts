// Datos mock para desarrollo local cuando D1 no está disponible

// Función para obtener fecha de ayer de forma consistente
function getYesterday() {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	yesterday.setHours(0, 0, 0, 0); // Inicio del día de ayer
	return yesterday;
}

export const mockCashBoxes = [
	{
		id: '1',
		name: 'Caja Principal',
		status: 'closed',
		estado: 'vacio',
		openingAmount: 0,
		currentAmount: 0,
		openedAt: null,
		originalOpenedAt: null,
		closedAt: null,
		reopenedAt: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: '2',
		name: 'Caja de Ayer',
		status: 'closed',
		estado: 'cerrado',
		openingAmount: 100.00,
		currentAmount: 100.00, // Balance final después de todas las operaciones
		openedAt: '2025-09-30T00:00:00.000Z', // 30-09-2025 00:00
		originalOpenedAt: '2025-09-30T00:00:00.000Z', // 30-09-2025 00:00
		closedAt: '2025-09-30T08:00:00.000Z', // 30-09-2025 08:00
		reopenedAt: null,
		createdAt: '2025-09-30T00:00:00.000Z',
		updatedAt: '2025-09-30T08:00:00.000Z'
	}
];

// Función para simular cambios de estado en desarrollo
export function updateMockCashBoxStatus(id: string, status: 'open' | 'closed', openingAmount: number = 0, openedAt?: string, estado?: 'vacio' | 'cerrado' | 'abierto' | 'reaperturado') {
	const cashBox = mockCashBoxes.find(cb => cb.id === id);
	if (cashBox) {
		cashBox.status = status;
		cashBox.estado = estado || (status === 'open' ? 'abierto' : 'cerrado');
		
		if (status === 'open') {
			cashBox.openingAmount = openingAmount;
			cashBox.currentAmount = openingAmount;
			cashBox.openedAt = openedAt || new Date().toISOString();
			cashBox.closedAt = null;
			
			// Si es reapertura, mantener la fecha original
			if (estado === 'reaperturado') {
				cashBox.reopenedAt = new Date().toISOString();
				// No cambiar originalOpenedAt si ya existe
				if (!cashBox.originalOpenedAt) {
					cashBox.originalOpenedAt = cashBox.openedAt;
				}
			} else {
				// Si es apertura normal, establecer originalOpenedAt
				cashBox.originalOpenedAt = cashBox.openedAt;
			}
		} else {
			cashBox.closedAt = new Date().toISOString();
			cashBox.reopenedAt = null;
		}
		cashBox.updatedAt = new Date().toISOString();
	}
}

// Función para agregar nueva caja mock
export function addMockCashBox(name: string) {
	const newCashBox = {
		id: 'mock-' + Date.now(),
		name,
		status: 'closed' as const,
		estado: 'vacio' as const,
		openingAmount: 0,
		currentAmount: 0,
		openedAt: null,
		originalOpenedAt: null,
		closedAt: null,
		reopenedAt: null,
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

export const mockOperations = [
	// Operaciones del 30 de septiembre de 2025 (fecha fija y consistente)
	{
		id: 'mock-op-30-1',
		type: 'income',
		amount: 50.00,
		description: 'Venta de productos - Stand A',
		cashBoxId: '2',
		operationDetailId: '1',
		responsiblePersonId: '1',
		standId: '1',
		companyId: '1',
		createdAt: '2025-09-30T01:00:00.000Z', // 30-09-2025 01:00
		updatedAt: '2025-09-30T01:00:00.000Z'
	},
	{
		id: 'mock-op-30-2',
		type: 'income',
		amount: 75.50,
		description: 'Venta de servicios - Stand B',
		cashBoxId: '2',
		operationDetailId: '1',
		responsiblePersonId: '2',
		standId: '2',
		companyId: '2',
		createdAt: '2025-09-30T02:00:00.000Z', // 30-09-2025 02:00
		updatedAt: '2025-09-30T02:00:00.000Z'
	},
	{
		id: 'mock-op-30-3',
		type: 'expense',
		amount: 25.00,
		description: 'Compra de materiales',
		cashBoxId: '2',
		operationDetailId: '2',
		responsiblePersonId: '1',
		standId: null,
		companyId: '3',
		createdAt: '2025-09-30T03:00:00.000Z', // 30-09-2025 03:00
		updatedAt: '2025-09-30T03:00:00.000Z'
	},
	{
		id: 'mock-op-30-4',
		type: 'income',
		amount: 120.00,
		description: 'Venta mayorista',
		cashBoxId: '2',
		operationDetailId: '1',
		responsiblePersonId: '3',
		standId: '3',
		companyId: '4',
		createdAt: '2025-09-30T04:00:00.000Z', // 30-09-2025 04:00
		updatedAt: '2025-09-30T04:00:00.000Z'
	},
	{
		id: 'mock-op-30-5',
		type: 'expense',
		amount: 15.50,
		description: 'Pago de servicios básicos',
		cashBoxId: '2',
		operationDetailId: '2',
		responsiblePersonId: '2',
		standId: null,
		companyId: null,
		createdAt: '2025-09-30T05:00:00.000Z', // 30-09-2025 05:00
		updatedAt: '2025-09-30T05:00:00.000Z'
	},
	{
		id: 'mock-op-30-6',
		type: 'income',
		amount: 200.00,
		description: 'Venta especial - Cliente VIP',
		cashBoxId: '2',
		operationDetailId: '1',
		responsiblePersonId: '1',
		standId: '1',
		companyId: '5',
		createdAt: '2025-09-30T06:00:00.000Z', // 30-09-2025 06:00
		updatedAt: '2025-09-30T06:00:00.000Z'
	},
	{
		id: 'mock-op-30-7',
		type: 'expense',
		amount: 80.00,
		description: 'Pago a proveedor',
		cashBoxId: '2',
		operationDetailId: '2',
		responsiblePersonId: '3',
		standId: null,
		companyId: '6',
		createdAt: '2025-09-30T07:00:00.000Z', // 30-09-2025 07:00
		updatedAt: '2025-09-30T07:00:00.000Z'
	},
	{
		id: 'mock-op-30-8',
		type: 'income',
		amount: 35.75,
		description: 'Venta al por menor',
		cashBoxId: '2',
		operationDetailId: '1',
		responsiblePersonId: '2',
		standId: '2',
		companyId: null,
		createdAt: '2025-09-30T07:30:00.000Z', // 30-09-2025 07:30
		updatedAt: '2025-09-30T07:30:00.000Z'
	},
	{
		id: 'mock-op-30-9',
		type: 'expense',
		amount: 12.25,
		description: 'Gastos de transporte',
		cashBoxId: '2',
		operationDetailId: '2',
		responsiblePersonId: '1',
		standId: null,
		companyId: null,
		createdAt: '2025-09-30T07:48:00.000Z', // 30-09-2025 07:48
		updatedAt: '2025-09-30T07:48:00.000Z'
	},
	{
		id: 'mock-op-30-10',
		type: 'income',
		amount: 90.00,
		description: 'Venta de productos premium',
		cashBoxId: '2',
		operationDetailId: '1',
		responsiblePersonId: '3',
		standId: '3',
		companyId: '7',
		createdAt: '2025-09-30T07:54:00.000Z', // 30-09-2025 07:54
		updatedAt: '2025-09-30T07:54:00.000Z'
	},
	{
		id: 'mock-op-30-11',
		type: 'expense',
		amount: 438.50, // Ajustado para que la caja termine en 0
		description: 'Cierre de caja - Retiro final',
		cashBoxId: '2',
		operationDetailId: '2',
		responsiblePersonId: '1',
		standId: null,
		companyId: null,
		createdAt: '2025-09-30T08:00:00.000Z', // 30-09-2025 08:00
		updatedAt: '2025-09-30T08:00:00.000Z'
	}
];

// Función para agregar nueva operación mock
export function addMockOperation(data: any, createdAt?: string, updatedAt?: string) {
	const newOperation = {
		id: 'mock-op-' + Date.now(),
		type: data.type,
		amount: data.amount,
		description: data.description,
		cashBoxId: data.cashBoxId,
		operationDetailId: data.operationDetailId || null,
		responsiblePersonId: data.responsiblePersonId || null,
		standId: data.standId || null,
		createdAt: createdAt || new Date().toISOString(),
		updatedAt: updatedAt || new Date().toISOString()
	};
	mockOperations.unshift(newOperation); // Agregar al inicio
	return newOperation;
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
		phone: phone || null,
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
export async function updateMockCashBoxAmount(cashBoxId: string, amount: number, type: 'income' | 'expense') {
	const cashBox = mockCashBoxes.find(cb => cb.id === cashBoxId);
	if (cashBox) {
		if (type === 'income') {
			cashBox.currentAmount += amount;
		} else {
			cashBox.currentAmount -= amount;
		}
		cashBox.updatedAt = new Date().toISOString();
		console.log(`Caja ${cashBox.name}: ${type === 'income' ? '+' : '-'}${amount} = ${cashBox.currentAmount}`);
	}
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
