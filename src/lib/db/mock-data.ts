// Datos mock para desarrollo local cuando D1 no está disponible

export const mockCashBoxes = [
	{
		id: '1',
		name: 'Caja Principal',
		status: 'closed',
		openingAmount: 0,
		currentAmount: 0,
		openedAt: null,
		closedAt: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];

// Función para simular cambios de estado en desarrollo
export function updateMockCashBoxStatus(id: string, status: 'open' | 'closed', openingAmount: number = 0) {
	const cashBox = mockCashBoxes.find(cb => cb.id === id);
	if (cashBox) {
		cashBox.status = status;
		if (status === 'open') {
			cashBox.openingAmount = openingAmount;
			cashBox.currentAmount = openingAmount;
			cashBox.openedAt = new Date().toISOString();
			cashBox.closedAt = null;
		} else {
			cashBox.closedAt = new Date().toISOString();
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
		openingAmount: 0,
		currentAmount: 0,
		openedAt: null,
		closedAt: null,
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
	{
		id: '1',
		type: 'income',
		amount: 150.00,
		description: 'Venta de productos',
		cashBoxId: '1',
		operationDetailId: '1',
		responsiblePersonId: '1',
		standId: '1',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: '2',
		type: 'expense',
		amount: 80.00,
		description: 'Pago a proveedor',
		cashBoxId: '1',
		operationDetailId: '2',
		responsiblePersonId: '2',
		standId: '2',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];

// Función para agregar nueva operación mock
export function addMockOperation(data: any) {
	const newOperation = {
		id: 'mock-op-' + Date.now(),
		type: data.type,
		amount: data.amount,
		description: data.description,
		cashBoxId: data.cashBoxId,
		operationDetailId: data.operationDetailId || null,
		responsiblePersonId: data.responsiblePersonId || null,
		standId: data.standId || null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
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
