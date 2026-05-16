
import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import { deleteFile, type Attachment } from './attachments-service';
import { updateCashBoxAmount } from './cash-boxes-service';

export interface Operation {
	id: string;
	type: 'income' | 'expense';
	amount: number;
	description: string;
	cashBoxId: string;
	operationDetailId?: string;
	responsiblePersonId?: string;
	standId?: string;
	companyId?: string;
	attachments?: Attachment[];
	createdAt: string;
	updatedAt: string;
	businessDate: string; // Business date en zona horaria de Perú
	attachmentsJson?: string;
}

export interface CreateOperationData {
	type: 'income' | 'expense';
	amount: number;
	description: string;
	cashBoxId: string;
	operationDetailId?: string;
	responsiblePersonId?: string;
	standId?: string;
	companyId?: string;
	attachments?: Attachment[];
	reopenBatchId?: string;
	isReopenOperation?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export async function getOperations(platform: App.Platform, date?: string): Promise<Operation[]> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	let query = 'SELECT * FROM operations';
	let params: any[] = [];
	
	if (date) {
		query += ' WHERE business_date = ?';
		params.push(date);
	}
	
	query += ' ORDER BY created_at_utc DESC';
	
	const rows = await executeQuery<Operation>(db, query, params);
	return rows.map(mapOperationRow);
}

function mapOperationRow(row: any): Operation {
	const json = row.attachmentsJson || row.attachments_json;
	if (json && typeof json === 'string') {
		try {
			row.attachments = JSON.parse(json);
		} catch (e) {
			console.error('Error parsing attachmentsJson:', e);
			row.attachments = [];
		}
	} else if (!row.attachments) {
		row.attachments = [];
	}
	return row as Operation;
}

export async function createOperation(
	platform: App.Platform,
	data: CreateOperationData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	// Fetch business_date from cash_box
	const cashBoxRow = await executeQuery<{ businessDate: string }>(
		db,
		'SELECT business_date FROM cash_boxes WHERE id = ?',
		[data.cashBoxId]
	);
	
	if (!cashBoxRow || cashBoxRow.length === 0) {
		return { success: false, error: 'Cash box not found' };
	}
	const businessDate = cashBoxRow[0].businessDate;

	// Crear operación con blindaje para IDs
	const id = crypto.randomUUID();
	const isReopen = data.isReopenOperation ? 1 : 0;
	
	// Asegurar que capturamos los IDs sin importar el formato (camelCase o snake_case)
	const operationDetailId = data.operationDetailId || (data as any).operation_detail_id || null;
	const responsiblePersonId = data.responsiblePersonId || (data as any).responsible_person_id || null;
	const standId = data.standId || (data as any).stand_id || null;
	const companyId = data.companyId || (data as any).company_id || null;

	const attachmentsJson = data.attachments ? JSON.stringify(data.attachments) : null;
	
	const result = await executeMutation(
		db,
		'INSERT INTO operations (id, type, amount, description, cash_box_id, operation_detail_id, responsible_person_id, stand_id, company_id, is_reopen_operation, created_at_utc, updated_at_utc, business_date, attachments_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[id, data.type, data.amount, data.description, data.cashBoxId, operationDetailId, responsiblePersonId, standId, companyId, isReopen, new Date().toISOString(), new Date().toISOString(), businessDate, attachmentsJson]
	);

	if (result.success) {
		// Actualizar monto de caja
		const cashBoxResult = await updateCashBoxBalance(platform, data.cashBoxId, data.amount, data.type);
		if (!cashBoxResult.success) {
			console.error('Error updating cash box amount:', cashBoxResult.error);
		}
	}

	return { ...result, id };
}

// Función para actualizar monto de caja basado en una operación
async function updateCashBoxBalance(
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
	const currentBoxes = await executeQuery<{ currentAmount: number }>(
		db,
		'SELECT current_amount FROM cash_boxes WHERE id = ?',
		[cashBoxId]
	);
	
	if (currentBoxes.length === 0) {
		return { success: false, error: 'Cash box not found' };
	}
	
	// Usar camelCase porque executeQuery mapea automáticamente (snake_case -> camelCase)
	const currentAmount = currentBoxes[0].currentAmount || 0;
	const newAmount = type === 'income' 
		? currentAmount + amount 
		: currentAmount - amount;
	
	return await executeMutation(
		db,
		'UPDATE cash_boxes SET current_amount = ?, updated_at_utc = CURRENT_TIMESTAMP WHERE id = ?',
		[newAmount, cashBoxId]
	);
}

export async function getOperationById(
	platform: App.Platform,
	id: string
): Promise<Operation | null> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	const results = await executeQuery<Operation>(
		db,
		'SELECT * FROM operations WHERE id = ?',
		[id]
	);
	
	return results.length > 0 ? mapOperationRow(results[0]) : null;
}

export async function updateOperation(
	platform: App.Platform,
	id: string,
	data: Partial<CreateOperationData>
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
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
	if (data.operationDetailId !== undefined || (data as any).operation_detail_id !== undefined) {
		fields.push('operation_detail_id = ?');
		values.push(data.operationDetailId || (data as any).operation_detail_id || null);
	}
	if (data.responsiblePersonId !== undefined || (data as any).responsible_person_id !== undefined) {
		fields.push('responsible_person_id = ?');
		values.push(data.responsiblePersonId || (data as any).responsible_person_id || null);
	}
	if (data.standId !== undefined || (data as any).stand_id !== undefined) {
		fields.push('stand_id = ?');
		values.push(data.standId || (data as any).stand_id || null);
	}
	if (data.companyId !== undefined || (data as any).company_id !== undefined) {
		fields.push('company_id = ?');
		values.push(data.companyId || (data as any).company_id || null);
	}
	if (data.isReopenOperation !== undefined || (data as any).is_reopen_operation !== undefined) {
		fields.push('is_reopen_operation = ?');
		const val = data.isReopenOperation !== undefined ? data.isReopenOperation : (data as any).is_reopen_operation;
		values.push(val ? 1 : 0);
	}
	if (data.attachments !== undefined || (data as any).attachments_json !== undefined) {
		fields.push('attachments_json = ?');
		const val = data.attachments !== undefined 
			? JSON.stringify(data.attachments) 
			: (data as any).attachments_json;
		values.push(val);
	}
	
	if (fields.length === 0) {
		return { success: true };
	}
	
	fields.push('updated_at_utc = CURRENT_TIMESTAMP');
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
	
	if (!db) {
		throw new Error('D1 database not found.');
	}

	// 1. Obtener la operación para conocer el monto, tipo, caja y adjuntos
	const operation = await getOperationById(platform, id);
	if (!operation) {
		return { success: false, error: 'Operación no encontrada' };
	}

	// 2. Eliminar archivos de R2 si existen
	// Nota: en D1, attachmentsJson es el nombre que devuelve mapDbRowToCamelCase
	const attachmentsRaw = (operation as any).attachmentsJson;
	if (attachmentsRaw) {
		try {
			const attachments: Attachment[] = JSON.parse(attachmentsRaw);
			for (const attachment of attachments) {
				// El ID del attachment es la key en R2
				await deleteFile(platform, attachment.id);
			}
		} catch (e) {
			console.error('Error parsing attachments for deletion:', e);
		}
	}

	// 3. Revertir el monto en la caja
	// Si era ingreso, restamos. Si era egreso, sumamos.
	const amountDelta = operation.type === 'income' ? -operation.amount : operation.amount;
	
	// Obtener el monto actual de la caja
	const cashBoxQuery = await executeQuery<{ currentAmount: number }>(
		db,
		'SELECT current_amount FROM cash_boxes WHERE id = ?',
		[operation.cashBoxId]
	);

	if (cashBoxQuery.length > 0) {
		const newAmount = (cashBoxQuery[0].currentAmount || 0) + amountDelta;
		await updateCashBoxAmount(platform, operation.cashBoxId, newAmount);
	}

	// 4. Eliminar de la base de datos
	return await executeMutation(
		db,
		'DELETE FROM operations WHERE id = ?',
		[id]
	);
}


