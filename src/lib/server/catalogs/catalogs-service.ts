// Servicio de gestión de catálogos
// Contiene toda la lógica de negocio para gestionar catálogos del sistema

import { eq, and, desc } from 'drizzle-orm';
import { generateId } from 'lucia';
import { getD1Database } from '../db/d1';
import type { App } from '$lib/types/app';
import { isDevelopment, mockData, handleDevError } from '../dev-fallback';
import { 
	operationDetails, 
	responsiblePersons, 
	stands, 
	companies 
} from '../db/schema';
import type { 
	OperationDetail, 
	NewOperationDetail,
	ResponsiblePerson,
	NewResponsiblePerson,
	Stand,
	NewStand,
	Company,
	NewCompany
} from '../db/schema';

// Interfaces para respuestas
export interface CatalogResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface CatalogListResponse<T> {
	success: boolean;
	data?: T[];
	error?: string;
}

// ===== DETALLES DE OPERACIÓN =====

export interface CreateOperationDetailData {
	name: string;
	description?: string;
	type: 'income' | 'expense';
}

export async function createOperationDetail(
	platform: App.Platform | undefined,
	data: CreateOperationDetailData
): Promise<CatalogResponse<OperationDetail>> {
	// Verificar si estamos en desarrollo
	const isLocalDev = isDevelopment(platform);
	
	if (isLocalDev) {
		console.log('🔧 Modo desarrollo - simulando creación de detalle de operación');
		const newDetail = {
			id: generateId(15),
			name: data.name,
			description: data.description || '',
			type: data.type,
			active: true,
			createdAt: new Date()
		};
		return {
			success: true,
			data: newDetail as OperationDetail
		};
	}
	
	try {
		const db = getD1Database(platform);
		
		// Verificar que no existe un detalle con el mismo nombre
		const existing = await db
			.select()
			.from(operationDetails)
			.where(eq(operationDetails.name, data.name))
			.limit(1);
		
		if (existing.length > 0) {
			return {
				success: false,
				error: 'Ya existe un detalle con ese nombre'
			};
		}
		
		const newDetail: NewOperationDetail = {
			id: generateId(15),
			name: data.name,
			description: data.description || null,
			type: data.type,
			active: true
		};
		
		await db.insert(operationDetails).values(newDetail);
		
		// Obtener el detalle creado
		const created = await db
			.select()
			.from(operationDetails)
			.where(eq(operationDetails.id, newDetail.id))
			.limit(1);
		
		return {
			success: true,
			data: created[0]
		};
		
	} catch (error) {
		console.error('Error creando detalle de operación:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

export async function updateOperationDetail(
	platform: App.Platform | undefined,
	id: string,
	data: Partial<CreateOperationDetailData>
): Promise<CatalogResponse<OperationDetail>> {
	try {
		const db = getD1Database(platform);
		
		// Verificar que existe
		const existing = await db
			.select()
			.from(operationDetails)
			.where(eq(operationDetails.id, id))
			.limit(1);
		
		if (existing.length === 0) {
			return {
				success: false,
				error: 'Detalle no encontrado'
			};
		}
		
		// Verificar nombre único si se está cambiando
		if (data.name && data.name !== existing[0].name) {
			const duplicate = await db
				.select()
				.from(operationDetails)
				.where(eq(operationDetails.name, data.name))
				.limit(1);
			
			if (duplicate.length > 0) {
				return {
					success: false,
					error: 'Ya existe un detalle con ese nombre'
				};
			}
		}
		
		// Actualizar
		await db
			.update(operationDetails)
			.set({
				...(data.name && { name: data.name }),
				...(data.description !== undefined && { description: data.description }),
				...(data.type && { type: data.type })
			})
			.where(eq(operationDetails.id, id));
		
		// Obtener el detalle actualizado
		const updated = await db
			.select()
			.from(operationDetails)
			.where(eq(operationDetails.id, id))
			.limit(1);
		
		return {
			success: true,
			data: updated[0]
		};
		
	} catch (error) {
		console.error('Error actualizando detalle de operación:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

export async function deleteOperationDetail(platform: App.Platform | undefined, id: string): Promise<CatalogResponse<null>> {
	try {
		const db = getD1Database(platform);
		
		// Soft delete - marcar como inactivo
		await db
			.update(operationDetails)
			.set({ active: false })
			.where(eq(operationDetails.id, id));
		
		return {
			success: true
		};
		
	} catch (error) {
		console.error('Error eliminando detalle de operación:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

// ===== RESPONSABLES =====

export interface CreateResponsiblePersonData {
	name: string;
	email?: string;
	phone?: string;
}

export async function createResponsiblePerson(
	platform: App.Platform | undefined,
	data: CreateResponsiblePersonData
): Promise<CatalogResponse<ResponsiblePerson>> {
	// Verificar si estamos en desarrollo
	const isLocalDev = isDevelopment(platform);
	
	if (isLocalDev) {
		console.log('🔧 Modo desarrollo - simulando creación de responsable');
		const newResponsible = {
			id: generateId(15),
			name: data.name,
			description: data.description || '',
			email: data.email || '',
			phone: data.phone || '',
			active: true,
			createdAt: new Date()
		};
		return {
			success: true,
			data: newResponsible as ResponsiblePerson
		};
	}
	
	try {
		const db = getD1Database(platform);
		
		// Verificar que no existe un responsable con el mismo nombre
		const existing = await db
			.select()
			.from(responsiblePersons)
			.where(eq(responsiblePersons.name, data.name))
			.limit(1);
		
		if (existing.length > 0) {
			return {
				success: false,
				error: 'Ya existe un responsable con ese nombre'
			};
		}
		
		const newResponsible: NewResponsiblePerson = {
			id: generateId(15),
			name: data.name,
			email: data.email || null,
			phone: data.phone || null,
			active: true
		};
		
		await db.insert(responsiblePersons).values(newResponsible);
		
		// Obtener el responsable creado
		const created = await db
			.select()
			.from(responsiblePersons)
			.where(eq(responsiblePersons.id, newResponsible.id))
			.limit(1);
		
		return {
			success: true,
			data: created[0]
		};
		
	} catch (error) {
		console.error('Error creando responsable:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

export async function updateResponsiblePerson(
	platform: App.Platform | undefined,
	id: string,
	data: Partial<CreateResponsiblePersonData>
): Promise<CatalogResponse<ResponsiblePerson>> {
	try {
		const db = getD1Database(platform);
		
		// Verificar que existe
		const existing = await db
			.select()
			.from(responsiblePersons)
			.where(eq(responsiblePersons.id, id))
			.limit(1);
		
		if (existing.length === 0) {
			return {
				success: false,
				error: 'Responsable no encontrado'
			};
		}
		
		// Verificar nombre único si se está cambiando
		if (data.name && data.name !== existing[0].name) {
			const duplicate = await db
				.select()
				.from(responsiblePersons)
				.where(eq(responsiblePersons.name, data.name))
				.limit(1);
			
			if (duplicate.length > 0) {
				return {
					success: false,
					error: 'Ya existe un responsable con ese nombre'
				};
			}
		}
		
		// Actualizar
		await db
			.update(responsiblePersons)
			.set({
				...(data.name && { name: data.name }),
				...(data.email !== undefined && { email: data.email }),
				...(data.phone !== undefined && { phone: data.phone })
			})
			.where(eq(responsiblePersons.id, id));
		
		// Obtener el responsable actualizado
		const updated = await db
			.select()
			.from(responsiblePersons)
			.where(eq(responsiblePersons.id, id))
			.limit(1);
		
		return {
			success: true,
			data: updated[0]
		};
		
	} catch (error) {
		console.error('Error actualizando responsable:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

export async function deleteResponsiblePerson(platform: App.Platform | undefined, id: string): Promise<CatalogResponse<null>> {
	try {
		const db = getD1Database(platform);
		
		// Soft delete - marcar como inactivo
		await db
			.update(responsiblePersons)
			.set({ active: false })
			.where(eq(responsiblePersons.id, id));
		
		return {
			success: true
		};
		
	} catch (error) {
		console.error('Error eliminando responsable:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

// ===== STANDS =====

export interface CreateStandData {
	name: string;
	description?: string;
	location?: string;
}

export async function createStand(
	platform: App.Platform | undefined,
	data: CreateStandData
): Promise<CatalogResponse<Stand>> {
	// Verificar si estamos en desarrollo
	const isLocalDev = isDevelopment(platform);
	
	if (isLocalDev) {
		console.log('🔧 Modo desarrollo - simulando creación de stand');
		const newStand = {
			id: generateId(15),
			name: data.name,
			description: data.description || '',
			location: data.location || '',
			active: true,
			createdAt: new Date()
		};
		return {
			success: true,
			data: newStand as Stand
		};
	}
	
	try {
		const db = getD1Database(platform);
		
		// Verificar que no existe un stand con el mismo nombre
		const existing = await db
			.select()
			.from(stands)
			.where(eq(stands.name, data.name))
			.limit(1);
		
		if (existing.length > 0) {
			return {
				success: false,
				error: 'Ya existe un stand con ese nombre'
			};
		}
		
		const newStand: NewStand = {
			id: generateId(15),
			name: data.name,
			description: data.description || null,
			location: data.location || null,
			active: true
		};
		
		await db.insert(stands).values(newStand);
		
		// Obtener el stand creado
		const created = await db
			.select()
			.from(stands)
			.where(eq(stands.id, newStand.id))
			.limit(1);
		
		return {
			success: true,
			data: created[0]
		};
		
	} catch (error) {
		console.error('Error creando stand:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

export async function updateStand(
	platform: App.Platform | undefined,
	id: string,
	data: Partial<CreateStandData>
): Promise<CatalogResponse<Stand>> {
	try {
		const db = getD1Database(platform);
		
		// Verificar que existe
		const existing = await db
			.select()
			.from(stands)
			.where(eq(stands.id, id))
			.limit(1);
		
		if (existing.length === 0) {
			return {
				success: false,
				error: 'Stand no encontrado'
			};
		}
		
		// Verificar nombre único si se está cambiando
		if (data.name && data.name !== existing[0].name) {
			const duplicate = await db
				.select()
				.from(stands)
				.where(eq(stands.name, data.name))
				.limit(1);
			
			if (duplicate.length > 0) {
				return {
					success: false,
					error: 'Ya existe un stand con ese nombre'
				};
			}
		}
		
		// Actualizar
		await db
			.update(stands)
			.set({
				...(data.name && { name: data.name }),
				...(data.description !== undefined && { description: data.description }),
				...(data.location !== undefined && { location: data.location })
			})
			.where(eq(stands.id, id));
		
		// Obtener el stand actualizado
		const updated = await db
			.select()
			.from(stands)
			.where(eq(stands.id, id))
			.limit(1);
		
		return {
			success: true,
			data: updated[0]
		};
		
	} catch (error) {
		console.error('Error actualizando stand:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

export async function deleteStand(platform: App.Platform | undefined, id: string): Promise<CatalogResponse<null>> {
	try {
		const db = getD1Database(platform);
		
		// Soft delete - marcar como inactivo
		await db
			.update(stands)
			.set({ active: false })
			.where(eq(stands.id, id));
		
		return {
			success: true
		};
		
	} catch (error) {
		console.error('Error eliminando stand:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

// ===== EMPRESAS =====

export interface CreateCompanyData {
	name: string;
	ruc?: string;
	address?: string;
	phone?: string;
	email?: string;
}

export async function createCompany(
	platform: App.Platform | undefined,
	data: CreateCompanyData
): Promise<CatalogResponse<Company>> {
	// Verificar si estamos en desarrollo
	const isLocalDev = isDevelopment(platform);
	
	if (isLocalDev) {
		console.log('🔧 Modo desarrollo - simulando creación de empresa');
		const newCompany = {
			id: generateId(15),
			name: data.name,
			description: data.description || '',
			ruc: data.ruc || '',
			address: data.address || '',
			phone: data.phone || '',
			email: data.email || '',
			active: true,
			createdAt: new Date()
		};
		return {
			success: true,
			data: newCompany as Company
		};
	}
	
	try {
		const db = getD1Database(platform);
		
		// Verificar que no existe una empresa con el mismo nombre
		const existing = await db
			.select()
			.from(companies)
			.where(eq(companies.name, data.name))
			.limit(1);
		
		if (existing.length > 0) {
			return {
				success: false,
				error: 'Ya existe una empresa con ese nombre'
			};
		}
		
		// Verificar RUC único si se proporciona
		if (data.ruc) {
			const existingRuc = await db
				.select()
				.from(companies)
				.where(eq(companies.ruc, data.ruc))
				.limit(1);
			
			if (existingRuc.length > 0) {
				return {
					success: false,
					error: 'Ya existe una empresa con ese RUC'
				};
			}
		}
		
		const newCompany: NewCompany = {
			id: generateId(15),
			name: data.name,
			ruc: data.ruc || null,
			address: data.address || null,
			phone: data.phone || null,
			email: data.email || null,
			active: true
		};
		
		await db.insert(companies).values(newCompany);
		
		// Obtener la empresa creada
		const created = await db
			.select()
			.from(companies)
			.where(eq(companies.id, newCompany.id))
			.limit(1);
		
		return {
			success: true,
			data: created[0]
		};
		
	} catch (error) {
		console.error('Error creando empresa:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

export async function updateCompany(
	platform: App.Platform | undefined,
	id: string,
	data: Partial<CreateCompanyData>
): Promise<CatalogResponse<Company>> {
	try {
		const db = getD1Database(platform);
		
		// Verificar que existe
		const existing = await db
			.select()
			.from(companies)
			.where(eq(companies.id, id))
			.limit(1);
		
		if (existing.length === 0) {
			return {
				success: false,
				error: 'Empresa no encontrada'
			};
		}
		
		// Verificar nombre único si se está cambiando
		if (data.name && data.name !== existing[0].name) {
			const duplicate = await db
				.select()
				.from(companies)
				.where(eq(companies.name, data.name))
				.limit(1);
			
			if (duplicate.length > 0) {
				return {
					success: false,
					error: 'Ya existe una empresa con ese nombre'
				};
			}
		}
		
		// Verificar RUC único si se está cambiando
		if (data.ruc && data.ruc !== existing[0].ruc) {
			const duplicateRuc = await db
				.select()
				.from(companies)
				.where(eq(companies.ruc, data.ruc))
				.limit(1);
			
			if (duplicateRuc.length > 0) {
				return {
					success: false,
					error: 'Ya existe una empresa con ese RUC'
				};
			}
		}
		
		// Actualizar
		await db
			.update(companies)
			.set({
				...(data.name && { name: data.name }),
				...(data.ruc !== undefined && { ruc: data.ruc }),
				...(data.address !== undefined && { address: data.address }),
				...(data.phone !== undefined && { phone: data.phone }),
				...(data.email !== undefined && { email: data.email })
			})
			.where(eq(companies.id, id));
		
		// Obtener la empresa actualizada
		const updated = await db
			.select()
			.from(companies)
			.where(eq(companies.id, id))
			.limit(1);
		
		return {
			success: true,
			data: updated[0]
		};
		
	} catch (error) {
		console.error('Error actualizando empresa:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

export async function deleteCompany(platform: App.Platform | undefined, id: string): Promise<CatalogResponse<null>> {
	try {
		const db = getD1Database(platform);
		
		// Soft delete - marcar como inactivo
		await db
			.update(companies)
			.set({ active: false })
			.where(eq(companies.id, id));
		
		return {
			success: true
		};
		
	} catch (error) {
		console.error('Error eliminando empresa:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}
