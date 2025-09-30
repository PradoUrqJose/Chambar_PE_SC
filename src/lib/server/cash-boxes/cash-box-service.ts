// Servicio de gestión de cajas administrativas
// Contiene toda la lógica de negocio para abrir, cerrar y gestionar cajas

import { eq, and, desc } from 'drizzle-orm';
import { generateId } from 'lucia';
import { getD1Database } from '../db/d1';
import { cashBoxes, operations } from '../db/schema';
import type { CashBox, NewCashBox } from '../db/schema';
import type { App } from '$lib/types/app';

// Interfaz para datos de apertura de caja
export interface OpenCashBoxData {
	initialAmount: number; // en centavos
	notes?: string;
}

// Interfaz para datos de cierre de caja
export interface CloseCashBoxData {
	finalAmount: number; // en centavos
	notes?: string;
}

// Interfaz para respuesta de caja
export interface CashBoxResponse {
	success: boolean;
	data?: CashBox;
	error?: string;
}

// Interfaz para respuesta de operaciones
export interface CashBoxOperationsResponse {
	success: boolean;
	data?: {
		cashBox: CashBox;
		operations: any[];
		totalIncome: number;
		totalExpense: number;
		calculatedFinal: number;
	};
	error?: string;
}

/**
 * Obtiene la caja del día actual
 * @param platform - Plataforma de Cloudflare
 * @param date - Fecha en formato YYYY-MM-DD (opcional, por defecto hoy)
 * @returns Caja del día o null si no existe
 */
export async function getTodayCashBox(platform: App.Platform | undefined, date?: string): Promise<CashBox | null> {
	const db = getD1Database(platform);
	const targetDate = date || new Date().toISOString().split('T')[0];
	
	const result = await db
		.select()
		.from(cashBoxes)
		.where(eq(cashBoxes.date, targetDate))
		.limit(1);
	
	return result.length > 0 ? result[0] : null;
}

/**
 * Obtiene todas las cajas de un rango de fechas
 * @param platform - Plataforma de Cloudflare
 * @param startDate - Fecha de inicio (YYYY-MM-DD)
 * @param endDate - Fecha de fin (YYYY-MM-DD)
 * @returns Lista de cajas
 */
export async function getCashBoxesByDateRange(
	platform: App.Platform | undefined,
	startDate: string, 
	endDate: string
): Promise<CashBox[]> {
	const db = getD1Database(platform);
	
	const result = await db
		.select()
		.from(cashBoxes)
		.where(
			and(
				eq(cashBoxes.date, startDate), // Por simplicidad, solo una fecha por ahora
				eq(cashBoxes.date, endDate)
			)
		)
		.orderBy(desc(cashBoxes.createdAt));
	
	return result;
}

/**
 * Abre una nueva caja para el día
 * @param platform - Plataforma de Cloudflare
 * @param data - Datos de apertura de caja
 * @param userId - ID del usuario que abre la caja
 * @returns Resultado de la operación
 */
export async function openCashBox(
	platform: App.Platform | undefined,
	data: OpenCashBoxData, 
	userId: string
): Promise<CashBoxResponse> {
	try {
		const db = getD1Database(platform);
		const today = new Date().toISOString().split('T')[0];
		
		// Verificar que no exista una caja abierta para hoy
		const existingCashBox = await getTodayCashBox(platform, today);
		if (existingCashBox) {
			return {
				success: false,
				error: 'Ya existe una caja abierta para hoy'
			};
		}
		
		// Crear nueva caja
		const newCashBox: NewCashBox = {
			id: generateId(15),
			date: today,
			status: 'open',
			openedBy: userId,
			initialAmount: Math.round(data.initialAmount * 100), // Convertir a centavos
			openingNotes: data.notes || null,
			openedAt: new Date(),
			editedFlag: false
		};
		
		await db.insert(cashBoxes).values(newCashBox);
		
		// Obtener la caja creada
		const createdCashBox = await getTodayCashBox(platform, today);
		
		return {
			success: true,
			data: createdCashBox!
		};
		
	} catch (error) {
		console.error('Error abriendo caja:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

/**
 * Cierra la caja del día
 * @param platform - Plataforma de Cloudflare
 * @param data - Datos de cierre de caja
 * @param userId - ID del usuario que cierra la caja
 * @returns Resultado de la operación
 */
export async function closeCashBox(
	platform: App.Platform | undefined,
	data: CloseCashBoxData, 
	userId: string
): Promise<CashBoxResponse> {
	try {
		const db = getD1Database(platform);
		const today = new Date().toISOString().split('T')[0];
		
		// Obtener la caja del día
		const existingCashBox = await getTodayCashBox(platform, today);
		if (!existingCashBox) {
			return {
				success: false,
				error: 'No existe una caja abierta para hoy'
			};
		}
		
		if (existingCashBox.status !== 'open') {
			return {
				success: false,
				error: 'La caja ya está cerrada'
			};
		}
		
		// Actualizar la caja
		await db
			.update(cashBoxes)
			.set({
				status: 'closed',
				closedBy: userId,
				finalAmount: Math.round(data.finalAmount * 100), // Convertir a centavos
				closingNotes: data.notes || null,
				closedAt: new Date()
			})
			.where(eq(cashBoxes.id, existingCashBox.id));
		
		// Obtener la caja actualizada
		const updatedCashBox = await getTodayCashBox(platform, today);
		
		return {
			success: true,
			data: updatedCashBox!
		};
		
	} catch (error) {
		console.error('Error cerrando caja:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

/**
 * Obtiene el resumen de operaciones de una caja
 * @param platform - Plataforma de Cloudflare
 * @param cashBoxId - ID de la caja
 * @returns Resumen de operaciones
 */
export async function getCashBoxOperations(
	platform: App.Platform | undefined,
	cashBoxId: string
): Promise<CashBoxOperationsResponse> {
	try {
		const db = getD1Database(platform);
		
		// Obtener la caja
		const cashBox = await db
			.select()
			.from(cashBoxes)
			.where(eq(cashBoxes.id, cashBoxId))
			.limit(1);
		
		if (cashBox.length === 0) {
			return {
				success: false,
				error: 'Caja no encontrada'
			};
		}
		
		// Obtener operaciones de la caja
		const cashBoxOperations = await db
			.select()
			.from(operations)
			.where(eq(operations.cashBoxId, cashBoxId));
		
		// Calcular totales
		let totalIncome = 0;
		let totalExpense = 0;
		
		cashBoxOperations.forEach(op => {
			if (op.type === 'income') {
				totalIncome += op.amount;
			} else {
				totalExpense += op.amount;
			}
		});
		
		// Calcular monto final esperado
		const calculatedFinal = cashBox[0].initialAmount + totalIncome - totalExpense;
		
		return {
			success: true,
			data: {
				cashBox: cashBox[0],
				operations: cashBoxOperations,
				totalIncome,
				totalExpense,
				calculatedFinal
			}
		};
		
	} catch (error) {
		console.error('Error obteniendo operaciones de caja:', error);
		return {
			success: false,
			error: 'Error interno del servidor'
		};
	}
}

/**
 * Verifica si se puede abrir una caja para el día
 * @param platform - Plataforma de Cloudflare
 * @param date - Fecha a verificar (opcional, por defecto hoy)
 * @returns true si se puede abrir, false si no
 */
export async function canOpenCashBox(platform: App.Platform | undefined, date?: string): Promise<boolean> {
	const today = date || new Date().toISOString().split('T')[0];
	const existingCashBox = await getTodayCashBox(platform, today);
	return !existingCashBox || existingCashBox.status === 'closed';
}

/**
 * Verifica si se puede cerrar la caja del día
 * @param platform - Plataforma de Cloudflare
 * @param date - Fecha a verificar (opcional, por defecto hoy)
 * @returns true si se puede cerrar, false si no
 */
export async function canCloseCashBox(platform: App.Platform | undefined, date?: string): Promise<boolean> {
	const today = date || new Date().toISOString().split('T')[0];
	const existingCashBox = await getTodayCashBox(platform, today);
	return existingCashBox?.status === 'open';
}
