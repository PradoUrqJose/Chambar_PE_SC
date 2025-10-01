import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import { mockCashBoxes, updateMockCashBoxStatus, addMockCashBox } from '$lib/db/mock-data';

// Enum unificado para estados de caja
export type CashBoxStatus = 'empty' | 'open' | 'closed' | 'reopened';

export interface CashBox {
	id: string;
	name: string;
	status: CashBoxStatus; // Estado unificado
	openingAmount: number;
	openedAt?: string | null;
	originalOpenedAt?: string | null; // Fecha original de apertura (antes de reapertura)
	closedAt?: string | null;
	reopenedAt?: string | null;
	businessDate?: string | null; // Business date en zona horaria de Perú
	createdAt: string;
	updatedAt: string;
}

export interface CreateCashBoxData {
	name: string;
}

export async function getCashBoxes(platform: App.Platform): Promise<CashBox[]> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), usar datos mock
	if (!db) {
		// Crear una copia fresca de los datos para asegurar que se devuelvan los datos actualizados
		const freshData = mockCashBoxes.map(cb => ({
			id: cb.id,
			name: cb.name,
			status: cb.status as CashBoxStatus,
			openingAmount: cb.openingAmount,
			openedAt: cb.openedAt,
			originalOpenedAt: cb.originalOpenedAt,
			closedAt: cb.closedAt,
			reopenedAt: cb.reopenedAt,
			businessDate: cb.businessDate,
			createdAt: cb.createdAt,
			updatedAt: cb.updatedAt
		}));
		
		console.log('🔍 getCashBoxes returning fresh mock data:', freshData.map(cb => ({
			id: cb.id,
			name: cb.name,
			openingAmount: cb.openingAmount,
			status: cb.status
		})));
		console.log('🔍 Caja Principal openingAmount:', freshData.find(cb => cb.id === '1')?.openingAmount);
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
		console.log('Modo desarrollo: simulando creación de caja');
		const newCashBox = addMockCashBox(data.name);
		return { success: true, id: newCashBox.id };
	}
	
	return await executeMutation(
		db,
		'INSERT INTO cash_boxes (name) VALUES (?)',
		[data.name]
	);
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
		console.log('Modo desarrollo: simulando apertura de caja');
		updateMockCashBoxStatus(id, 'open', openingAmount, openedAt, estado);
		
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
				console.log('💰 Opening operation created for amount:', openingAmount);
			}
		}
		
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
		console.log('Modo desarrollo: simulando cierre de caja');
		updateMockCashBoxStatus(id, 'closed', 0, undefined, 'cerrado');
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
	reopenedAt: string
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando reapertura de caja');
		updateMockCashBoxStatus(id, 'reopened', 0, reopenedAt);
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
