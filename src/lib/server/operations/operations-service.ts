// Servicio de gestión de operaciones (ingresos y egresos)
// Contiene toda la lógica de negocio para operaciones de caja

import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { generateId } from 'lucia';
import { getD1Database } from '../db/d1';
import { operations, cashBoxes, operationDetails, responsiblePersons, stands, companies } from '../db/schema';
import type { Operation, NewOperation } from '../db/schema';
import type { App } from '$lib/types/app';

// Interfaz para datos de nueva operación
export interface CreateOperationData {
	type: 'income' | 'expense';
	amount: number; // en centavos
	operationDetailId: string;
	responsibleId: string;
	standId: string;
	companyId?: string;
	description?: string;
	voucherNumber?: string;
	paymentMethod: 'cash' | 'card' | 'transfer' | 'check';
}

// Interfaz para respuesta de operación
export interface OperationResponse {
	success: boolean;
	data?: Operation;
	error?: string;
}

// Interfaz para respuesta de lista de operaciones
export interface OperationsListResponse {
	success: boolean;
	data?: Operation[];
	error?: string;
}

// Interfaz para respuesta de operaciones con detalles
export interface OperationsWithDetailsResponse {
	success: boolean;
	data?: {
		operations: Operation[];
		totalIncome: number;
		totalExpense: number;
		netAmount: number;
	};
	error?: string;
}

/**
 * Obtiene todas las operaciones de una caja específica
 * @param platform - Plataforma de Cloudflare
 * @param cashBoxId - ID de la caja
 * @returns Lista de operaciones
 */
export async function getOperationsByCashBox(platform: App.Platform | undefined, cashBoxId: string): Promise<Operation[]> {
	const db = getD1Database(platform);
	
	const result = await db
		.select()
		.from(operations)
		.where(eq(operations.cashBoxId, cashBoxId))
		.orderBy(desc(operations.operationDate));
	
	return result;
}

/**
 * Obtiene todas las operaciones con filtros
 * @param filters - Filtros a aplicar
 * @returns Lista de operaciones filtradas
 */
export async function getOperations(platform: App.Platform | undefined, filters?: {
	type?: 'income' | 'expense';
	date?: string;
	search?: string;
}): Promise<Operation[]> {
	const db = getD1Database(platform);
	
	let query = db.select().from(operations);
	
	// Aplicar filtros si existen
	if (filters) {
		const conditions = [];
		
		if (filters.type) {
			conditions.push(eq(operations.type, filters.type));
		}
		
		if (filters.date) {
			const startDate = new Date(filters.date);
			startDate.setHours(0, 0, 0, 0);
			const endDate = new Date(filters.date);
			endDate.setHours(23, 59, 59, 999);
			
			conditions.push(
				and(
					gte(operations.operationDate, startDate),
					lte(operations.operationDate, endDate)
				)
			);
		}
		
		if (conditions.length > 0) {
			query = query.where(and(...conditions));
		}
	}
	
	const result = await query.orderBy(desc(operations.operationDate));
	
	// Aplicar filtro de búsqueda si existe
	if (filters?.search) {
		const search = filters.search.toLowerCase();
		return result.filter(op => 
			op.description?.toLowerCase().includes(search) ||
			op.voucherNumber?.toLowerCase().includes(search)
		);
	}
	
	return result;
}

/**
 * Crea una nueva operación
 * @param data - Datos de la operación
 * @param userId - ID del usuario que crea la operación
 * @returns Resultado de la operación
 */
export async function createOperation(
	platform: App.Platform | undefined,
	data: CreateOperationData,
	userId: string
): Promise<OperationResponse> {
	try {
		const db = getD1Database(platform);
		
		// Verificar que existe una caja abierta para hoy
		const today = new Date().toISOString().split('T')[0];
		const todayCashBox = await db
			.select()
			.from(cashBoxes)
			.where(eq(cashBoxes.date, today))
			.limit(1);
		
		if (todayCashBox.length === 0) {
			return {
				success: false,
				error: 'No hay caja abierta para hoy'
			};
		}
		
		if (todayCashBox[0].status !== 'open') {
			return {
				success: false,
				error: 'La caja está cerrada'
			};
		}
		
		// Verificar que los catálogos existen
		const [operationDetail, responsible, stand] = await Promise.all([
			db.select().from(operationDetails).where(eq(operationDetails.id, data.operationDetailId)).limit(1),
			db.select().from(responsiblePersons).where(eq(responsiblePersons.id, data.responsibleId)).limit(1),
			db.select().from(stands).where(eq(stands.id, data.standId)).limit(1)
		]);
		
		if (operationDetail.length === 0) {
			return {
				success: false,
				error: 'Detalle de operación no encontrado'
			};
		}
		
		if (responsible.length === 0) {
			return {
				success: false,
				error: 'Responsable no encontrado'
			};
		}
		
		if (stand.length === 0) {
			return {
				success: false,
				error: 'Stand no encontrado'
			};
		}
		
		// Verificar que el tipo de operación coincide con el detalle
		if (operationDetail[0].type !== data.type) {
			return {
				success: false,
				error: 'El tipo de operación no coincide con el detalle seleccionado'
			};
		}
		
		// Verificar empresa si se proporciona
		if (data.companyId) {
			const company = await db
				.select()
				.from(companies)
				.where(eq(companies.id, data.companyId))
				.limit(1);
			
			if (company.length === 0) {
				return {
					success: false,
					error: 'Empresa no encontrada'
				};
			}
		}
		
		// Crear nueva operación
		const newOperation: NewOperation = {
			id: generateId(15),
			cashBoxId: todayCashBox[0].id,
			type: data.type,
			amount: Math.round(data.amount * 100), // Convertir a centavos
			currency: 'PEN',
			operationDetailId: data.operationDetailId,
			responsibleId: data.responsibleId,
			standId: data.standId,
			companyId: data.companyId || null,
			description: data.description || null,
			voucherNumber: data.voucherNumber || null,
			paymentMethod: data.paymentMethod,
			operationDate: new Date(),
			active: true
		};
		
		await db.insert(operations).values(newOperation);
		
		// Obtener la operación creada
		const createdOperation = await db
			.select()
			.from(operations)
			.where(eq(operations.id, newOperation.id))
			.limit(1);
		
		return {
			success: true,
			data: createdOperation[0]
		};
		
	} catch (error) {
		console.error('Error creando operación:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

/**
 * Obtiene una operación por ID
 * @param operationId - ID de la operación
 * @returns Operación o null si no existe
 */
export async function getOperationById(platform: App.Platform | undefined, operationId: string): Promise<Operation | null> {
	const db = getD1Database(platform);
	
	const result = await db
		.select()
		.from(operations)
		.where(eq(operations.id, operationId))
		.limit(1);
	
	return result.length > 0 ? result[0] : null;
}

/**
 * Elimina una operación (soft delete)
 * @param operationId - ID de la operación
 * @param userId - ID del usuario que elimina la operación
 * @returns Resultado de la operación
 */
export async function deleteOperation(
	platform: App.Platform | undefined,
	operationId: string,
	userId: string
): Promise<OperationResponse> {
	try {
		const db = getD1Database(platform);
		
		// Verificar que la operación existe
		const existingOperation = await getOperationById(operationId);
		if (!existingOperation) {
			return {
				success: false,
				error: 'Operación no encontrada'
			};
		}
		
		// Verificar que la caja está abierta
		const cashBox = await db
			.select()
			.from(cashBoxes)
			.where(eq(cashBoxes.id, existingOperation.cashBoxId))
			.limit(1);
		
		if (cashBox.length === 0 || cashBox[0].status !== 'open') {
			return {
				success: false,
				error: 'No se puede eliminar operaciones de cajas cerradas'
			};
		}
		
		// Soft delete - marcar como inactiva
		await db
			.update(operations)
			.set({ active: false })
			.where(eq(operations.id, operationId));
		
		return {
			success: true
		};
		
	} catch (error) {
		console.error('Error eliminando operación:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

/**
 * Obtiene el resumen de operaciones de una caja
 * @param cashBoxId - ID de la caja
 * @returns Resumen de operaciones
 */
export async function getOperationsSummary(platform: App.Platform | undefined, cashBoxId: string): Promise<{
	totalIncome: number;
	totalExpense: number;
	netAmount: number;
	operationCount: number;
}> {
	const db = getD1Database(platform);
	
	const operationsList = await getOperationsByCashBox(platform, cashBoxId);
	
	let totalIncome = 0;
	let totalExpense = 0;
	
	operationsList.forEach(op => {
		if (op.active) { // Solo contar operaciones activas
			if (op.type === 'income') {
				totalIncome += op.amount;
			} else {
				totalExpense += op.amount;
			}
		}
	});
	
	return {
		totalIncome,
		totalExpense,
		netAmount: totalIncome - totalExpense,
		operationCount: operationsList.filter(op => op.active).length
	};
}

/**
 * Verifica si se puede crear una operación
 * @param userId - ID del usuario
 * @returns true si se puede crear, false si no
 */
export async function canCreateOperation(platform: App.Platform | undefined, userId: string): Promise<boolean> {
	const db = getD1Database(platform);
	const today = new Date().toISOString().split('T')[0];
	
	const todayCashBox = await db
		.select()
		.from(cashBoxes)
		.where(eq(cashBoxes.date, today))
		.limit(1);
	
	return todayCashBox.length > 0 && todayCashBox[0].status === 'open';
}
