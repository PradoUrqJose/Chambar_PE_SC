import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import { mockOperations, addMockOperation, mockCashBoxes } from '$lib/db/mock-data';

export interface Operation {
	id: string;
	type: 'income' | 'expense';
	amount: number;
	description: string;
	cashBoxId: string;
	operationDetailId?: string;
	responsiblePersonId?: string;
	standId?: string;
	createdAt: string;
	updatedAt: string;
	businessDate: string; // Business date en zona horaria de Perú
}

export interface CreateOperationData {
	type: 'income' | 'expense';
	amount: number;
	description: string;
	cashBoxId: string;
	operationDetailId?: string;
	responsiblePersonId?: string;
	standId?: string;
	reopenBatchId?: string;
	isReopenOperation?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export async function getOperations(platform: App.Platform, date?: string): Promise<Operation[]> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), usar datos mock
	if (!db) {
		// Crear una copia fresca de mockOperations para asegurar datos actualizados
		let operations = [...mockOperations] as Operation[];
		
		console.log('🔍 getOperations - All mock operations:', operations.map(op => ({
			id: op.id,
			description: op.description,
			businessDate: op.businessDate,
			cashBoxId: op.cashBoxId,
			amount: op.amount
		})));
		
		// Filtrar por fecha si se proporciona (usando zona horaria de Perú)
		if (date) {
			console.log('🔍 getOperations - Filtering by date:', date);
			operations = operations.filter(op => op.businessDate === date);
			console.log('🔍 getOperations - Filtered operations:', operations.map(op => ({
				id: op.id,
				description: op.description,
				businessDate: op.businessDate,
				cashBoxId: op.cashBoxId,
				amount: op.amount
			})));
		}
		
		console.log('🔍 getOperations - Returning operations:', operations.length);
		
		return operations;
	}
	
	return await executeQuery<Operation>(
		db,
		'SELECT * FROM operations ORDER BY created_at DESC'
	);
}

export async function createOperation(
	platform: App.Platform,
	data: CreateOperationData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('💰 Modo desarrollo: creando operación para caja:', data.cashBoxId);
		
		// Validar que la caja existe
		const cashBox = mockCashBoxes.find(cb => cb.id === data.cashBoxId);
		if (!cashBox) {
			console.error('❌ Caja no encontrada:', data.cashBoxId);
			return { success: false, error: 'Caja no encontrada' };
		}
		
		// Validar que la caja está abierta o reabierta
		if (cashBox.status !== 'open' && cashBox.status !== 'reopened') {
			console.error('❌ La caja no está abierta. Estado actual:', cashBox.status);
			return { success: false, error: 'La caja no está abierta' };
		}
		
		const newOperation = addMockOperation(data, data.createdAt, data.updatedAt);
		
		// No necesitamos actualizar el monto de la caja manualmente
		// El currentAmount se calcula dinámicamente en el frontend usando computeCurrentAmount
		
		console.log('✅ Operación creada exitosamente:', newOperation.id);
		return { success: true, id: newOperation.id };
	}
	
	// Crear operación
	const result = await executeMutation(
		db,
		'INSERT INTO operations (type, amount, description, cash_box_id, operation_detail_id, responsible_person_id, stand_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
		[data.type, data.amount, data.description, data.cashBoxId, data.operationDetailId || null, data.responsiblePersonId || null, data.standId || null]
	);

	if (result.success) {
		// Actualizar monto de caja
		const cashBoxResult = await updateCashBoxAmount(platform, data.cashBoxId, data.amount, data.type);
		if (!cashBoxResult.success) {
			console.error('Error updating cash box amount:', cashBoxResult.error);
		}
	}

	return result;
}

// Función para actualizar monto de caja
async function updateCashBoxAmount(
	platform: App.Platform,
	cashBoxId: string,
	amount: number,
	type: 'income' | 'expense'
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	if (!db) {
		return { success: true };
	}
	
	// Obtener monto actual
	const currentBoxes = await executeQuery<{ current_amount: number }>(
		db,
		'SELECT current_amount FROM cash_boxes WHERE id = ?',
		[cashBoxId]
	);
	
	if (currentBoxes.length === 0) {
		return { success: false, error: 'Cash box not found' };
	}
	
	const currentAmount = currentBoxes[0].current_amount;
	const newAmount = type === 'income' 
		? currentAmount + amount 
		: currentAmount - amount;
	
	return await executeMutation(
		db,
		'UPDATE cash_boxes SET current_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
		[newAmount, cashBoxId]
	);
}

export async function getOperationById(
	platform: App.Platform,
	id: string
): Promise<Operation | null> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), buscar en mock
	if (!db) {
		return mockOperations.find(op => op.id === id) as Operation || null;
	}
	
	const results = await executeQuery<Operation>(
		db,
		'SELECT * FROM operations WHERE id = ?',
		[id]
	);
	
	return results.length > 0 ? results[0] : null;
}

export async function updateOperation(
	platform: App.Platform,
	id: string,
	data: Partial<CreateOperationData>
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando actualización de operación');
		return { success: true };
	}
	
	// Construir query dinámicamente
	const fields = [];
	const values = [];
	
	if (data.type !== undefined) {
		fields.push('type = ?');
		values.push(data.type);
	}
	if (data.amount !== undefined) {
		fields.push('amount = ?');
		values.push(data.amount);
	}
	if (data.description !== undefined) {
		fields.push('description = ?');
		values.push(data.description);
	}
	if (data.cashBoxId !== undefined) {
		fields.push('cash_box_id = ?');
		values.push(data.cashBoxId);
	}
	if (data.operationDetailId !== undefined) {
		fields.push('operation_detail_id = ?');
		values.push(data.operationDetailId);
	}
	if (data.responsiblePersonId !== undefined) {
		fields.push('responsible_person_id = ?');
		values.push(data.responsiblePersonId);
	}
	if (data.standId !== undefined) {
		fields.push('stand_id = ?');
		values.push(data.standId);
	}
	
	if (fields.length === 0) {
		return { success: true };
	}
	
	fields.push('updated_at = CURRENT_TIMESTAMP');
	values.push(id);
	
	return await executeMutation(
		db,
		`UPDATE operations SET ${fields.join(', ')} WHERE id = ?`,
		values
	);
}

export async function deleteOperation(
	platform: App.Platform,
	id: string
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando eliminación de operación');
		return { success: true };
	}
	
	return await executeMutation(
		db,
		'DELETE FROM operations WHERE id = ?',
		[id]
	);
}