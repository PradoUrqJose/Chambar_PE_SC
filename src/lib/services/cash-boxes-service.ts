import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import {
	mockCashBoxes,
	updateMockCashBoxStatus,
	addMockCashBox,
	findLastPendingBalance,
	markPendingBalanceAsHandled,
	transferPendingBalanceToCurrentBox
} from '$lib/db/mock-data';

// Enum unificado para estados de caja
export type CashBoxStatus = 'empty' | 'open' | 'closed' | 'reopened';

export interface CashBox {
	id: string;
	name: string;
	status: CashBoxStatus;
	openingAmount: number;
	openedAt: string | null;
	closedAt: string | null;
	reopenedAt: string | null;
	businessDate: string; // Business date en zona horaria de Perú (YYYY-MM-DD)
	createdAt: string;
	updatedAt: string;
	reopenReason?: string;
	reopenNotes?: string;
}

export interface CreateCashBoxData {
	name: string;
	businessDate: string;
}

export interface PendingBalanceData {
	id: string;
	cashBoxId: string;
	amount: number;
	date: string;
	status: 'pending' | 'transferred' | 'returned' | 'handled';
	notes?: string;
	handledAt?: string;
}

export interface ReopenCashBoxOptions {
	resetCurrentAmount?: boolean;
	reopenReason?: string;
	allocationNote?: string;
}

export async function getCashBoxes(platform: App.Platform): Promise<CashBox[]> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), usar datos mock
	if (!db) {
		// Crear una copia fresca de los datos
		const freshData = mockCashBoxes.map(cb => ({
			id: cb.id,
			name: cb.name,
			status: cb.status as CashBoxStatus,
			openingAmount: cb.openingAmount,
			openedAt: cb.openedAt,
			closedAt: cb.closedAt,
			reopenedAt: cb.reopenedAt,
			businessDate: cb.businessDate,
			createdAt: cb.createdAt,
			updatedAt: cb.updatedAt
		}));
		
		console.log('🔍 getCashBoxes - mockCashBoxes.length:', mockCashBoxes.length);
		console.log('🔍 getCashBoxes - returning freshData:', freshData);
		return freshData;
	}
	
	return await executeQuery<CashBox>(
		db,
		'SELECT * FROM cash_boxes ORDER BY created_at DESC'
	);
}

export async function createCashBox(
	platform: App.Platform,
	data: CreateCashBoxData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('📦 Modo desarrollo: creando caja mock', data);
		const newCashBox = addMockCashBox(data.businessDate, data.name);
		console.log('✅ Caja mock creada:', newCashBox);
		return { success: true, id: newCashBox.id };
	}
	
	return await executeMutation(
		db,
		'INSERT INTO cash_boxes (name, business_date) VALUES (?, ?)',
		[data.name, data.businessDate]
	);
}

export async function getPendingBalance(
	platform: App.Platform,
	currentDate: string
): Promise<PendingBalanceData | null> {
	const db = getD1Database(platform);

	if (!db) {
		const pending = findLastPendingBalance(currentDate);
		return pending ? { ...pending } : null;
	}

	// TODO: Implementar consulta real a D1 cuando esté disponible
	return null;
}

export async function handlePendingBalanceAction(
	platform: App.Platform,
	action: 'transfer' | 'return' | 'handle',
	data: {
		pendingBalanceId: string;
		notes?: string;
		currentCashBoxId?: string;
	}
): Promise<{ success: boolean; error?: string; amount?: number; originalCashBoxId?: string; currentCashBoxId?: string }> {
	const db = getD1Database(platform);

	if (!db) {
		if (action === 'transfer') {
			if (!data.currentCashBoxId) {
				return { success: false, error: 'currentCashBoxId es requerido para transferir' };
			}
			return transferPendingBalanceToCurrentBox(data.pendingBalanceId, data.currentCashBoxId);
		}

		const result = markPendingBalanceAsHandled(
			data.pendingBalanceId,
			action === 'return' ? 'returned' : 'handled',
			data.notes
		);
		return result.success ? { success: true } : { success: false, error: result.error };
	}

	// TODO: Implementar lógica real contra D1
	return { success: false, error: 'Pending balance actions not implemented for D1 yet' };
}

export async function openCashBox(
	platform: App.Platform,
	id: string,
	openingAmount: number = 0,
	openedAt?: string,
	estado: 'abierto' | 'reaperturado' = 'abierto'
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('📦 Modo desarrollo: abriendo caja', { id, openingAmount, estado });
		updateMockCashBoxStatus(id, estado === 'reaperturado' ? 'reopened' : 'open', openingAmount, openedAt);
		
		// Crear operación de apertura de caja si hay monto inicial
		if (openingAmount > 0) {
			const { addMockOperation } = await import('$lib/db/mock-data');
			const cashBox = mockCashBoxes.find(cb => cb.id === id);
			if (cashBox) {
				// Crear operación de apertura de caja
				const description = `Apertura de caja - Monto inicial`;
				
				addMockOperation({
					type: 'income',
					amount: openingAmount,
					description: description,
					cashBoxId: id,
					companyId: null,
					operationDetailId: null,
					responsiblePersonId: null,
					standId: null
				});
				console.log('💰 Operación de apertura creada con monto:', openingAmount);
			}
		}
		
		console.log('✅ Caja abierta exitosamente');
		return { success: true };
	}
	
	const openTime = openedAt || new Date().toISOString();
	const reopenedTime = estado === 'reaperturado' ? new Date().toISOString() : null;
	
	return await executeMutation(
		db,
		'UPDATE cash_boxes SET status = ?, estado = ?, opening_amount = ?, current_amount = ?, opened_at = ?, reopened_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
		['open', estado, openingAmount, openingAmount, openTime, reopenedTime, id]
	);
}

export async function closeCashBox(
	platform: App.Platform,
	id: string
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('🔒 Modo desarrollo: cerrando caja', id);
		updateMockCashBoxStatus(id, 'closed');
		
		// Crear operación de cierre de caja
		const { addMockOperation, mockOperations } = await import('$lib/db/mock-data');
		const cashBox = mockCashBoxes.find(cb => cb.id === id);
		if (cashBox) {
			// Calcular el saldo final antes del cierre
			const operationsForBox = mockOperations.filter(op => op.cashBoxId === id);
			const currentAmount = operationsForBox.reduce((acc, op) => {
				return acc + (op.type === 'income' ? op.amount : -op.amount);
			}, 0);
			
			// Crear operación de cierre de caja
			const description = `Cierre de caja - Saldo final`;
			
			addMockOperation({
				type: 'expense',
				amount: currentAmount,
				description: description,
				cashBoxId: id,
				companyId: null,
				operationDetailId: null,
				responsiblePersonId: null,
				standId: null
			});
			console.log('💰 Operación de cierre creada con saldo:', currentAmount);
		}
		
		console.log('✅ Caja cerrada exitosamente');
		return { success: true };
	}
	
	return await executeMutation(
		db,
		'UPDATE cash_boxes SET status = ?, estado = ?, closed_at = CURRENT_TIMESTAMP, reopened_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
		['closed', 'cerrado', id]
	);
}

export async function reopenCashBox(
	platform: App.Platform,
	id: string,
	reopenedAt: string,
	options: ReopenCashBoxOptions = {}
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando reapertura de caja');
		updateMockCashBoxStatus(id, 'reopened', 0, reopenedAt);

		const cashBox = mockCashBoxes.find(cb => cb.id === id);
		if (cashBox) {
			cashBox.reopenedAt = reopenedAt;
			cashBox.updatedAt = new Date().toISOString();
			if (options.resetCurrentAmount) {
				cashBox.openingAmount = 0;
			}
			if (options.reopenReason) {
				cashBox.reopenReason = options.reopenReason;
			}
			if (options.allocationNote) {
				cashBox.reopenNotes = options.allocationNote;
			}
		}
		return { success: true };
	}
	
	return await executeMutation(
		db,
		'UPDATE cash_boxes SET status = ?, estado = ?, reopened_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?',
		['open', 'reaperturado', reopenedAt, id, 'closed']
	);
}

export async function updateCashBoxAmount(
	platform: App.Platform,
	id: string,
	amount: number
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando actualización de monto');
		return { success: true };
	}
	
	return await executeMutation(
		db,
		'UPDATE cash_boxes SET current_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
		[amount, id]
	);
}
