// Servicio de reportes y estadísticas
// Contiene toda la lógica para generar reportes del sistema

import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getD1Database } from '../db/d1';
import { 
	operations, 
	cashBoxes, 
	operationDetails, 
	responsiblePersons, 
	stands, 
	companies 
} from '../db/schema';
import type { App } from '$lib/types/app';
import { isLocalDev, mockData, handleDevError } from '../dev-fallback';

// Interfaces para respuestas de reportes
export interface ReportResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface RealtimeMetrics {
	todayIncome: number;
	todayExpense: number;
	todayNet: number;
	openCashBoxes: number;
	totalOperations: number;
}

export interface DailySummary {
	totalIncome: number;
	totalExpense: number;
	netAmount: number;
	operations: Array<{
		id: string;
		type: 'income' | 'expense';
		amount: number;
		detailName: string;
		responsibleName: string;
		operationDate: Date;
	}>;
}

export interface OperationsReport {
	totalOperations: number;
	totalIncome: number;
	totalExpense: number;
	netAmount: number;
	operationsByType: Array<{
		type: string;
		count: number;
		total: number;
	}>;
	operationsByDetail: Array<{
		detailName: string;
		count: number;
		total: number;
	}>;
}

export interface CashBoxesReport {
	totalCashBoxes: number;
	openCashBoxes: number;
	closedCashBoxes: number;
	totalInitialAmount: number;
	totalFinalAmount: number;
	cashBoxes: Array<{
		id: string;
		date: string;
		status: string;
		initialAmount: number;
		finalAmount: number | null;
		openedBy: string;
		closedBy: string | null;
	}>;
}

/**
 * Obtiene métricas en tiempo real del sistema
 */
export async function getRealtimeMetrics(platform: App.Platform | undefined): Promise<RealtimeMetrics> {
	// Fallback para desarrollo local - forzar modo desarrollo
	const isLocalDev = true; // Forzar modo desarrollo por ahora
	
	if (isLocalDev) {
		console.log('🔧 Modo desarrollo - retornando métricas mock');
		return {
			todayIncome: 5000, // S/ 50.00
			todayExpense: 2000, // S/ 20.00
			todayNet: 3000, // S/ 30.00
			totalOperations: 2,
			openCashBoxes: 1,
			lastOperationTime: new Date(),
			topOperationDetail: 'Venta de productos',
			topStand: 'Stand Principal'
		};
	}
	
	const db = getD1Database(platform);
	const today = new Date().toISOString().split('T')[0];
	
	// Obtener operaciones de hoy
	const todayOperations = await db
		.select()
		.from(operations)
		.where(
			and(
				gte(operations.operationDate, new Date(today)),
				lte(operations.operationDate, new Date(today + 'T23:59:59.999Z')),
				eq(operations.active, true)
			)
		);
	
	// Calcular totales
	let todayIncome = 0;
	let todayExpense = 0;
	
	todayOperations.forEach(op => {
		if (op.type === 'income') {
			todayIncome += op.amount;
		} else {
			todayExpense += op.amount;
		}
	});
	
	// Obtener cajas abiertas
	const openCashBoxes = await db
		.select()
		.from(cashBoxes)
		.where(eq(cashBoxes.status, 'open'));
	
	// Obtener total de operaciones
	const totalOperations = await db
		.select()
		.from(operations)
		.where(eq(operations.active, true));
	
	return {
		todayIncome,
		todayExpense,
		todayNet: todayIncome - todayExpense,
		openCashBoxes: openCashBoxes.length,
		totalOperations: totalOperations.length
	};
}

/**
 * Obtiene el resumen diario de operaciones
 */
export async function getDailySummary(platform: App.Platform | undefined, date: string): Promise<DailySummary> {
	const db = getD1Database(platform);
	
	// Obtener operaciones del día
	const dayOperations = await db
		.select({
			id: operations.id,
			type: operations.type,
			amount: operations.amount,
			operationDate: operations.operationDate,
			detailName: operationDetails.name,
			responsibleName: responsiblePersons.name
		})
		.from(operations)
		.leftJoin(operationDetails, eq(operations.operationDetailId, operationDetails.id))
		.leftJoin(responsiblePersons, eq(operations.responsibleId, responsiblePersons.id))
		.where(
			and(
				gte(operations.operationDate, new Date(date)),
				lte(operations.operationDate, new Date(date + 'T23:59:59.999Z')),
				eq(operations.active, true)
			)
		)
		.orderBy(desc(operations.operationDate));
	
	// Calcular totales
	let totalIncome = 0;
	let totalExpense = 0;
	
	dayOperations.forEach(op => {
		if (op.type === 'income') {
			totalIncome += op.amount;
		} else {
			totalExpense += op.amount;
		}
	});
	
	return {
		totalIncome,
		totalExpense,
		netAmount: totalIncome - totalExpense,
		operations: dayOperations.map(op => ({
			id: op.id,
			type: op.type,
			amount: op.amount,
			detailName: op.detailName || 'N/A',
			responsibleName: op.responsibleName || 'N/A',
			operationDate: op.operationDate
		}))
	};
}

/**
 * Obtiene el reporte de operaciones por período
 */
export async function getOperationsReport(platform: App.Platform | undefined, startDate: string, endDate: string): Promise<OperationsReport> {
	const db = getD1Database(platform);
	
	// Obtener operaciones del período
	const periodOperations = await db
		.select({
			id: operations.id,
			type: operations.type,
			amount: operations.amount,
			detailName: operationDetails.name
		})
		.from(operations)
		.leftJoin(operationDetails, eq(operations.operationDetailId, operationDetails.id))
		.where(
			and(
				gte(operations.operationDate, new Date(startDate)),
				lte(operations.operationDate, new Date(endDate + 'T23:59:59.999Z')),
				eq(operations.active, true)
			)
		);
	
	// Calcular totales
	let totalIncome = 0;
	let totalExpense = 0;
	
	periodOperations.forEach(op => {
		if (op.type === 'income') {
			totalIncome += op.amount;
		} else {
			totalExpense += op.amount;
		}
	});
	
	// Agrupar por tipo
	const operationsByType = periodOperations.reduce((acc, op) => {
		const type = op.type;
		const existing = acc.find(item => item.type === type);
		if (existing) {
			existing.count++;
			existing.total += op.amount;
		} else {
			acc.push({ type, count: 1, total: op.amount });
		}
		return acc;
	}, [] as Array<{ type: string; count: number; total: number }>);
	
	// Agrupar por detalle
	const operationsByDetail = periodOperations.reduce((acc, op) => {
		const detailName = op.detailName || 'N/A';
		const existing = acc.find(item => item.detailName === detailName);
		if (existing) {
			existing.count++;
			existing.total += op.amount;
		} else {
			acc.push({ detailName, count: 1, total: op.amount });
		}
		return acc;
	}, [] as Array<{ detailName: string; count: number; total: number }>);
	
	return {
		totalOperations: periodOperations.length,
		totalIncome,
		totalExpense,
		netAmount: totalIncome - totalExpense,
		operationsByType,
		operationsByDetail
	};
}

/**
 * Obtiene el reporte de cajas por período
 */
export async function getCashBoxesReport(platform: App.Platform | undefined, startDate: string, endDate: string): Promise<CashBoxesReport> {
	const db = getD1Database(platform);
	
	// Obtener cajas del período
	const periodCashBoxes = await db
		.select({
			id: cashBoxes.id,
			date: cashBoxes.date,
			status: cashBoxes.status,
			initialAmount: cashBoxes.initialAmount,
			finalAmount: cashBoxes.finalAmount,
			openedBy: cashBoxes.openedBy,
			closedBy: cashBoxes.closedBy
		})
		.from(cashBoxes)
		.where(
			and(
				gte(cashBoxes.date, startDate),
				lte(cashBoxes.date, endDate)
			)
		)
		.orderBy(desc(cashBoxes.date));
	
	// Calcular estadísticas
	const openCashBoxes = periodCashBoxes.filter(cb => cb.status === 'open').length;
	const closedCashBoxes = periodCashBoxes.filter(cb => cb.status === 'closed').length;
	
	const totalInitialAmount = periodCashBoxes.reduce((sum, cb) => sum + cb.initialAmount, 0);
	const totalFinalAmount = periodCashBoxes
		.filter(cb => cb.finalAmount !== null)
		.reduce((sum, cb) => sum + (cb.finalAmount || 0), 0);
	
	return {
		totalCashBoxes: periodCashBoxes.length,
		openCashBoxes,
		closedCashBoxes,
		totalInitialAmount,
		totalFinalAmount,
		cashBoxes: periodCashBoxes
	};
}
