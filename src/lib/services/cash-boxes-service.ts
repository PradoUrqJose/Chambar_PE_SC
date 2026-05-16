
import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
// Removed mock data imports

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
	originalOpenedAt: string | null;
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
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	return await executeQuery<CashBox>(
		db,
		'SELECT * FROM cash_boxes ORDER BY created_at_utc DESC'
	);
}

export async function createCashBox(
	platform: App.Platform,
	data: CreateCashBoxData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	const id = crypto.randomUUID();
	const result = await executeMutation(
		db,
		'INSERT INTO cash_boxes (id, name, status, business_date, created_at_utc, updated_at_utc) VALUES (?, ?, \'empty\', ?, ?, ?)',
		[id, data.name, data.businessDate, new Date().toISOString(), new Date().toISOString()]
	);
	return { ...result, id };
}

export async function getPendingBalance(
	platform: App.Platform,
	currentDate: string
): Promise<PendingBalanceData | null> {
	const db = getD1Database(platform);

	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}

	const results = await executeQuery<PendingBalanceData>(
		db,
		'SELECT * FROM pending_balances WHERE status = ? AND date < ? ORDER BY date DESC LIMIT 1',
		['pending', currentDate]
	);
	return results.length > 0 ? results[0] : null;
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
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}

	const pendingQuery = await executeQuery<{ amount: number; cashBoxId: string }>(
		db,
		'SELECT amount, cash_box_id FROM pending_balances WHERE id = ?',
		[data.pendingBalanceId]
	);

	if (pendingQuery.length === 0) {
		return { success: false, error: 'Pending balance not found' };
	}

	const pendingInfo = pendingQuery[0];
	const targetStatus = action === 'transfer' ? 'transferred' : (action === 'return' ? 'returned' : 'handled');

	await executeMutation(
		db,
		'UPDATE pending_balances SET status = ?, notes = ?, handled_at_utc = CURRENT_TIMESTAMP, updated_at_utc = CURRENT_TIMESTAMP WHERE id = ?',
		[targetStatus, data.notes || null, data.pendingBalanceId]
	);

	if (action === 'transfer' && data.currentCashBoxId) {
		const opId = crypto.randomUUID();
		await executeMutation(
			db,
			'INSERT INTO operations (id, type, amount, description, cash_box_id, created_at_utc, updated_at_utc, business_date) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT business_date FROM cash_boxes WHERE id = ?))',
			[opId, 'income', pendingInfo.amount, `Transferencia de caja: ${data.notes || ''}`, data.currentCashBoxId, data.currentCashBoxId]
		);
		await executeMutation(
			db,
			'UPDATE cash_boxes SET current_amount = current_amount + ?, opening_amount = opening_amount + ? WHERE id = ?',
			[pendingInfo.amount, pendingInfo.amount, data.currentCashBoxId]
		);
	}

	return { 
		success: true, 
		amount: pendingInfo.amount, 
		originalCashBoxId: pendingInfo.cashBoxId, 
		currentCashBoxId: data.currentCashBoxId 
	};
}

export async function openCashBox(
	platform: App.Platform,
	id: string,
	openingAmount: number = 0,
	openedAt?: string,
	estado: 'abierto' | 'reaperturado' = 'abierto'
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	const openTime = openedAt || new Date().toISOString();
	const reopenedTime = estado === 'reaperturado' ? new Date().toISOString() : null;
	
	return await executeMutation(
		db,
		'UPDATE cash_boxes SET status = ?, opening_amount = ?, current_amount = ?, opened_at_utc = ?, reopened_at_utc = ?, original_opened_at_utc = COALESCE(original_opened_at_utc, ?), updated_at_utc = CURRENT_TIMESTAMP WHERE id = ?',
		['open', openingAmount, openingAmount, openTime, reopenedTime, openTime, id]
	);
}

export async function closeCashBox(
	platform: App.Platform,
	id: string
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	const boxQuery = await executeQuery<{ currentAmount: number; businessDate: string }>(
		db,
		'SELECT current_amount, business_date FROM cash_boxes WHERE id = ?',
		[id]
	);
	
	if (boxQuery.length > 0 && boxQuery[0].currentAmount > 0) {
		const amount = boxQuery[0].currentAmount;
		const date = boxQuery[0].businessDate;
		const pendingId = crypto.randomUUID();
		await executeMutation(
			db,
			'INSERT INTO pending_balances (id, cash_box_id, amount, date, status, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?, ?, ?)',
			[pendingId, id, amount, date, 'pending', new Date().toISOString(), new Date().toISOString()]
		);
	}

	return await executeMutation(
		db,
		'UPDATE cash_boxes SET status = ?, closed_at_utc = CURRENT_TIMESTAMP, reopened_at_utc = NULL, updated_at_utc = CURRENT_TIMESTAMP WHERE id = ?',
		['closed', id]
	);
}

export async function reopenCashBox(
	platform: App.Platform,
	id: string,
	reopenedAt: string,
	options: ReopenCashBoxOptions = {}
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	const notes = options.allocationNote || options.reopenReason || null;
	return await executeMutation(
		db,
		'UPDATE cash_boxes SET status = ?, reopened_at_utc = ?, reopen_notes = ?, updated_at_utc = CURRENT_TIMESTAMP WHERE id = ? AND status = ?',
		['reopened', reopenedAt, notes, id, 'closed']
	);
}

export async function updateCashBoxAmount(
	platform: App.Platform,
	id: string,
	amount: number
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	return await executeMutation(
		db,
		'UPDATE cash_boxes SET current_amount = ?, updated_at_utc = CURRENT_TIMESTAMP WHERE id = ?',
		[amount, id]
	);
}

export async function getOpenCashBoxes(platform: App.Platform): Promise<CashBox[]> {
	const db = getD1Database(platform);
	if (!db) return [];
	
	return await executeQuery<CashBox>(
		db,
		'SELECT * FROM cash_boxes WHERE status IN (\'open\', \'reopened\') ORDER BY updated_at_utc DESC'
	);
}
