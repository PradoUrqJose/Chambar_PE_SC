// Datos mock centralizados para catálogos
// Este archivo mantiene la consistencia de datos entre todas las APIs

export interface MockCompany {
	id: string;
	razonSocial: string;
	ruc: string;
	createdAt: string;
	updatedAt: string;
}

export interface MockStand {
	id: string;
	name: string;
	location: string;
	status: 'active' | 'inactive';
	createdAt: string;
	updatedAt: string;
}

export interface MockResponsiblePerson {
	id: string;
	name: string;
	email: string;
	phone: string;
	createdAt: string;
	updatedAt: string;
}

export interface MockOperationDetail {
	id: string;
	name: string;
	type: 'income' | 'expense';
	category: string;
	createdAt: string;
	updatedAt: string;
}

// Datos mock centralizados
export let mockCompanies: MockCompany[] = [
	{ 
		id: 'company-1', 
		razonSocial: 'Empresa Demo S.A.C.', 
		ruc: '20123456789', 
		createdAt: new Date().toISOString(), 
		updatedAt: new Date().toISOString() 
	}
];

export let mockStands: MockStand[] = [
	{ 
		id: 'stand-1', 
		name: 'Stand A', 
		location: 'Zona Norte', 
		status: 'active', 
		createdAt: new Date().toISOString(), 
		updatedAt: new Date().toISOString() 
	},
	{ 
		id: 'stand-2', 
		name: 'Stand B', 
		location: 'Zona Sur', 
		status: 'active', 
		createdAt: new Date().toISOString(), 
		updatedAt: new Date().toISOString() 
	}
];

export let mockResponsiblePersons: MockResponsiblePerson[] = [
	{ 
		id: 'person-1', 
		name: 'Juan Pérez', 
		email: 'juan@example.com', 
		phone: '999888777', 
		createdAt: new Date().toISOString(), 
		updatedAt: new Date().toISOString() 
	},
	{ 
		id: 'person-2', 
		name: 'María García', 
		email: 'maria@example.com', 
		phone: '999888666', 
		createdAt: new Date().toISOString(), 
		updatedAt: new Date().toISOString() 
	}
];

export let mockOperationDetails: MockOperationDetail[] = [
	{ 
		id: 'detail-1', 
		name: 'Venta', 
		type: 'income', 
		category: 'Ventas', 
		createdAt: new Date().toISOString(), 
		updatedAt: new Date().toISOString() 
	},
	{ 
		id: 'detail-2', 
		name: 'Compra', 
		type: 'expense', 
		category: 'Compras', 
		createdAt: new Date().toISOString(), 
		updatedAt: new Date().toISOString() 
	}
];

// Función para generar ID único
export function generateUniqueId(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Funciones CRUD para empresas
export function addCompany(company: Omit<MockCompany, 'id' | 'createdAt' | 'updatedAt'>): MockCompany {
	const newCompany: MockCompany = {
		id: generateUniqueId('company'),
		...company,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockCompanies.push(newCompany);
	return newCompany;
}

export function updateCompany(id: string, updates: Partial<Omit<MockCompany, 'id' | 'createdAt'>>): MockCompany | null {
	const index = mockCompanies.findIndex(company => company.id === id);
	if (index === -1) return null;
	
	mockCompanies[index] = {
		...mockCompanies[index],
		...updates,
		updatedAt: new Date().toISOString()
	};
	return mockCompanies[index];
}

export function deleteCompany(id: string): boolean {
	const index = mockCompanies.findIndex(company => company.id === id);
	if (index === -1) return false;
	
	mockCompanies.splice(index, 1);
	return true;
}

// Funciones CRUD para stands
export function addStand(stand: Omit<MockStand, 'id' | 'createdAt' | 'updatedAt'>): MockStand {
	const newStand: MockStand = {
		id: generateUniqueId('stand'),
		...stand,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockStands.push(newStand);
	return newStand;
}

export function updateStand(id: string, updates: Partial<Omit<MockStand, 'id' | 'createdAt'>>): MockStand | null {
	const index = mockStands.findIndex(stand => stand.id === id);
	if (index === -1) return null;
	
	mockStands[index] = {
		...mockStands[index],
		...updates,
		updatedAt: new Date().toISOString()
	};
	return mockStands[index];
}

export function deleteStand(id: string): boolean {
	const index = mockStands.findIndex(stand => stand.id === id);
	if (index === -1) return false;
	
	mockStands.splice(index, 1);
	return true;
}

// Funciones CRUD para responsables
export function addResponsiblePerson(person: Omit<MockResponsiblePerson, 'id' | 'createdAt' | 'updatedAt'>): MockResponsiblePerson {
	const newPerson: MockResponsiblePerson = {
		id: generateUniqueId('person'),
		...person,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockResponsiblePersons.push(newPerson);
	return newPerson;
}

export function updateResponsiblePerson(id: string, updates: Partial<Omit<MockResponsiblePerson, 'id' | 'createdAt'>>): MockResponsiblePerson | null {
	const index = mockResponsiblePersons.findIndex(person => person.id === id);
	if (index === -1) return null;
	
	mockResponsiblePersons[index] = {
		...mockResponsiblePersons[index],
		...updates,
		updatedAt: new Date().toISOString()
	};
	return mockResponsiblePersons[index];
}

export function deleteResponsiblePerson(id: string): boolean {
	const index = mockResponsiblePersons.findIndex(person => person.id === id);
	if (index === -1) return false;
	
	mockResponsiblePersons.splice(index, 1);
	return true;
}

// Funciones CRUD para detalles de operación
export function addOperationDetail(detail: Omit<MockOperationDetail, 'id' | 'createdAt' | 'updatedAt'>): MockOperationDetail {
	const newDetail: MockOperationDetail = {
		id: generateUniqueId('detail'),
		...detail,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	mockOperationDetails.push(newDetail);
	return newDetail;
}

export function updateOperationDetail(id: string, updates: Partial<Omit<MockOperationDetail, 'id' | 'createdAt'>>): MockOperationDetail | null {
	const index = mockOperationDetails.findIndex(detail => detail.id === id);
	if (index === -1) return null;
	
	mockOperationDetails[index] = {
		...mockOperationDetails[index],
		...updates,
		updatedAt: new Date().toISOString()
	};
	return mockOperationDetails[index];
}

export function deleteOperationDetail(id: string): boolean {
	const index = mockOperationDetails.findIndex(detail => detail.id === id);
	if (index === -1) return false;
	
	mockOperationDetails.splice(index, 1);
	return true;
}
