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
	currentAmount: number;
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
			currentAmount: cb.currentAmount || 0,
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
	
	const results = await executeQuery<any>(
		db,
		'SELECT * FROM cash_boxes ORDER BY created_at_utc DESC'
	);
	
	// Mapear los campos de la BD a la interfaz CashBox
	return results.map((row: any) => ({
		id: row.id,
		name: row.name,
		status: row.status as CashBoxStatus,
		openingAmount: row.opening_amount,
		currentAmount: row.current_amount || 0,
		openedAt: row.opened_at_utc,
		closedAt: row.closed_at_utc,
		reopenedAt: row.reopened_at_utc,
		businessDate: row.business_date, // Mapear business_date a businessDate
		createdAt: row.created_at_utc,
		updatedAt: row.updated_at_utc
	}));
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
	
	const id = `cashbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	const now = new Date().toISOString();
	
	return await executeMutation(
		db,
		'INSERT INTO cash_boxes (id, name, business_date, status, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?, ?)',
		[id, data.name, data.businessDate, 'empty', now, now]
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

	try {
		console.log('🔍 getPendingBalance D1: Buscando saldo pendiente para fecha:', currentDate);
		
		// Buscar el saldo pendiente más reciente anterior a la fecha actual
		const result = await db.prepare(`
			SELECT pb.*, cb.name as cashBoxName
			FROM pending_balances pb
			JOIN cash_boxes cb ON pb.cash_box_id = cb.id
			WHERE pb.date < ? 
				AND pb.status = 'pending'
			ORDER BY pb.date DESC, pb.created_at_utc DESC
			LIMIT 1
		`).bind(currentDate).first();

		if (!result) {
			console.log('🔍 getPendingBalance D1: No se encontró saldo pendiente');
			return null;
		}

		console.log('✅ getPendingBalance D1: Saldo pendiente encontrado:', result);
		
		return {
			id: result.id,
			cashBoxId: result.cash_box_id,
			amount: result.amount,
			date: result.date,
			status: result.status,
			notes: result.notes,
			handledAt: result.handled_at_utc,
			createdAt: result.created_at_utc,
			updatedAt: result.updated_at_utc
		};
	} catch (error) {
		console.error('❌ getPendingBalance D1: Error:', error);
		return null;
	}
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

	try {
		console.log('🔄 handlePendingBalanceAction D1: Procesando acción:', action, data);
		
		// Obtener el saldo pendiente
		const pendingBalance = await db.prepare(`
			SELECT pb.*, cb.name as cashBoxName
			FROM pending_balances pb
			JOIN cash_boxes cb ON pb.cash_box_id = cb.id
			WHERE pb.id = ? AND pb.status = 'pending'
		`).bind(data.pendingBalanceId).first();

		if (!pendingBalance) {
			return { success: false, error: 'Saldo pendiente no encontrado o ya procesado' };
		}

		const now = new Date().toISOString();
		const newStatus = action === 'transfer' ? 'transferred' : action === 'return' ? 'returned' : 'handled';

		if (action === 'transfer') {
			if (!data.currentCashBoxId) {
				return { success: false, error: 'currentCashBoxId es requerido para transferir' };
			}

			// Verificar que la caja destino existe
			const targetCashBox = await db.prepare(`
				SELECT id, name, opening_amount FROM cash_boxes WHERE id = ?
			`).bind(data.currentCashBoxId).first();

			if (!targetCashBox) {
				return { success: false, error: 'Caja destino no encontrada' };
			}

			// Actualizar el saldo pendiente
			await db.prepare(`
				UPDATE pending_balances 
				SET status = ?, handled_at_utc = ?, notes = ?, updated_at_utc = ?
				WHERE id = ?
			`).bind(newStatus, now, data.notes || `Transferido a ${targetCashBox.name}`, now, data.pendingBalanceId).run();

			// Actualizar el monto de apertura de la caja destino
			await db.prepare(`
				UPDATE cash_boxes 
				SET opening_amount = opening_amount + ?, updated_at_utc = ?
				WHERE id = ?
			`).bind(pendingBalance.amount, now, data.currentCashBoxId).run();

			// Crear operación de transferencia de salida en la caja original
			const transferOutId = `transfer-out-${Date.now()}`;
			await db.prepare(`
				INSERT INTO operations (id, cash_box_id, type, amount, description, business_date, created_at_utc, updated_at_utc)
				VALUES (?, ?, 'expense', ?, ?, ?, ?, ?)
			`).bind(
				transferOutId,
				pendingBalance.cash_box_id,
				pendingBalance.amount,
				`Transferencia de saldo a ${targetCashBox.name}`,
				pendingBalance.date,
				now,
				now
			).run();

			// Crear operación de transferencia de entrada en la caja destino
			const transferInId = `transfer-in-${Date.now()}`;
			await db.prepare(`
				INSERT INTO operations (id, cash_box_id, type, amount, description, business_date, created_at_utc, updated_at_utc)
				VALUES (?, ?, 'income', ?, ?, ?, ?, ?)
			`).bind(
				transferInId,
				data.currentCashBoxId,
				pendingBalance.amount,
				`Transferencia de saldo desde ${pendingBalance.cashBoxName}`,
				pendingBalance.date,
				now,
				now
			).run();

			console.log('✅ Transferencia D1 completada:', {
				amount: pendingBalance.amount,
				from: pendingBalance.cash_box_id,
				to: data.currentCashBoxId
			});

			return {
				success: true,
				amount: pendingBalance.amount,
				originalCashBoxId: pendingBalance.cash_box_id,
				currentCashBoxId: data.currentCashBoxId
			};
		} else {
			// Para 'return' y 'handle', solo actualizar el estado
			await db.prepare(`
				UPDATE pending_balances 
				SET status = ?, handled_at_utc = ?, notes = ?, updated_at_utc = ?
				WHERE id = ?
			`).bind(newStatus, now, data.notes, now, data.pendingBalanceId).run();

			console.log('✅ Acción D1 completada:', { action, pendingBalanceId: data.pendingBalanceId });
			return { success: true };
		}
	} catch (error) {
		console.error('❌ handlePendingBalanceAction D1: Error:', error);
		return { success: false, error: 'Error al procesar la acción del saldo pendiente' };
	}
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
	
	// Actualizar estado de la caja
	const updateResult = await executeMutation(
		db,
		'UPDATE cash_boxes SET status = ?, opening_amount = ?, opened_at_utc = ?, reopened_at_utc = ?, updated_at_utc = ? WHERE id = ?',
		['open', openingAmount, openTime, reopenedTime, new Date().toISOString(), id]
	);
	
	if (!updateResult.success) {
		return updateResult;
	}
	
	// Crear operación de apertura de caja si hay monto inicial
	if (openingAmount > 0) {
		console.log('💰 Creando operación de apertura con monto:', openingAmount);
		
		const operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const now = new Date().toISOString();
		const businessDate = openTime.split('T')[0]; // Extraer fecha YYYY-MM-DD
		
		const operationResult = await executeMutation(
			db,
			'INSERT INTO operations (id, cash_box_id, type, amount, description, operation_detail_id, responsible_person_id, stand_id, company_id, created_at_utc, updated_at_utc, business_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
			[operationId, id, 'income', openingAmount, 'Apertura de caja - Monto inicial', null, null, null, null, now, now, businessDate]
		);
		
		if (!operationResult.success) {
			console.error('❌ Error creando operación de apertura:', operationResult.error);
			// No fallar la apertura por esto, solo loggear
		} else {
			console.log('✅ Operación de apertura creada:', operationId);
		}
	}
	
	return updateResult;
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
	
	try {
		console.log('🔒 closeCashBox D1: Cerrando caja', id);
		
		// Obtener información de la caja
		const cashBox = await db.prepare(`
			SELECT cb.*, 
				COALESCE(SUM(CASE WHEN o.type='income' THEN o.amount ELSE 0 END), 0) as total_income,
				COALESCE(SUM(CASE WHEN o.type='expense' THEN o.amount ELSE 0 END), 0) as total_expense
			FROM cash_boxes cb
			LEFT JOIN operations o ON o.cash_box_id = cb.id
			WHERE cb.id = ?
			GROUP BY cb.id
		`).bind(id).first();

		if (!cashBox) {
			return { success: false, error: 'Caja no encontrada' };
		}

		// Calcular saldo final (solo operaciones, el opening_amount ya está incluido en las operaciones de apertura)
		const currentAmount = cashBox.total_income - cashBox.total_expense;
		console.log('💰 Saldo final calculado (solo operaciones):', currentAmount);

		const now = new Date().toISOString();

		// Cerrar la caja
		await db.prepare(`
			UPDATE cash_boxes 
			SET status = ?, closed_at_utc = ?, reopened_at_utc = NULL, updated_at_utc = ?
			WHERE id = ?
		`).bind('closed', now, now, id).run();

		// Si hay saldo positivo, crear saldo pendiente
		if (currentAmount > 0) {
			const pendingBalanceId = `pending-${id}-${Date.now()}`;
			await db.prepare(`
				INSERT INTO pending_balances (id, cash_box_id, amount, date, status, notes, created_at_utc, updated_at_utc)
				VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
			`).bind(
				pendingBalanceId,
				id,
				currentAmount,
				cashBox.business_date,
				`Saldo pendiente de ${cashBox.name}`,
				now,
				now
			).run();

			console.log('⚠️ Saldo pendiente creado:', { amount: currentAmount, id: pendingBalanceId });
		}

		console.log('✅ Caja cerrada exitosamente en D1');
		return { success: true };
	} catch (error) {
		console.error('❌ closeCashBox D1: Error:', error);
		return { success: false, error: 'Error al cerrar la caja' };
	}
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
	
	try {
		console.log('🔄 reopenCashBox D1: Reabriendo caja', { id, reopenedAt, options });
		
		// Verificar que la caja existe y está cerrada
		const cashBox = await db.prepare(`
			SELECT id, status, opening_amount FROM cash_boxes WHERE id = ? AND status = 'closed'
		`).bind(id).first();

		if (!cashBox) {
			return { success: false, error: 'Caja no encontrada o no está cerrada' };
		}

		const now = new Date().toISOString();
		let updateQuery = 'UPDATE cash_boxes SET status = ?, reopened_at_utc = ?, updated_at_utc = ?';
		let params = ['reopened', reopenedAt, now];

		// Si es update-balance, resetear el monto actual si se solicita
		if (options.resetCurrentAmount) {
			updateQuery += ', opening_amount = 0';
		}

		// Agregar notas de reapertura si se proporcionan
		if (options.allocationNote) {
			updateQuery += ', reopen_notes = ?';
			params.push(options.allocationNote);
		}

		updateQuery += ' WHERE id = ? AND status = ?';
		params.push(id, 'closed');

		await db.prepare(updateQuery).bind(...params).run();

		console.log('✅ Caja reabierta exitosamente en D1:', { id, reopenType: options.reopenReason });
		return { success: true };
	} catch (error) {
		console.error('❌ reopenCashBox D1: Error:', error);
		return { success: false, error: 'Error al reabrir la caja' };
	}
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
		'UPDATE cash_boxes SET current_amount = ?, updated_at_utc = CURRENT_TIMESTAMP WHERE id = ?',
		[amount, id]
	);
}
