import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import { mockCashBoxes, updateMockCashBoxStatus, addMockCashBox } from '$lib/db/mock-data';

export interface CashBox {
	id: string;
	name: string;
	status: 'open' | 'closed';
	openingAmount: number;
	currentAmount: number;
	openedAt?: string;
	closedAt?: string;
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
		return mockCashBoxes as CashBox[];
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
	openingAmount: number = 0
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando apertura de caja');
		updateMockCashBoxStatus(id, 'open', openingAmount);
		return { success: true };
	}
	
	return await executeMutation(
		db,
		'UPDATE cash_boxes SET status = ?, opening_amount = ?, current_amount = ?, opened_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
		['open', openingAmount, openingAmount, id]
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
		updateMockCashBoxStatus(id, 'closed');
		return { success: true };
	}
	
	return await executeMutation(
		db,
		'UPDATE cash_boxes SET status = ?, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
		['closed', id]
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
