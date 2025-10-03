import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import { mockOperationDetails, addOperationDetail } from '$lib/db/catalog-mock-data';

export interface OperationDetail {
	id: string;
	name: string;
	description?: string;
	type: 'income' | 'expense';
	status: 'active' | 'inactive';
	createdAt: string;
	updatedAt: string;
}

export interface CreateOperationDetailData {
	name: string;
	description?: string;
	type: 'income' | 'expense';
}

export async function getOperationDetails(platform: App.Platform): Promise<OperationDetail[]> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), usar datos mock
	if (!db) {
		console.log('Modo desarrollo: usando detalles mock');
		return mockOperationDetails as OperationDetail[];
	}
	
	const results = await executeQuery<any>(
		db,
		'SELECT * FROM operation_details ORDER BY created_at_utc DESC'
	);
	
	// Mapear los campos de la BD a la interfaz OperationDetail
	return results.map((row: any) => ({
		id: row.id,
		name: row.name,
		description: row.description,
		type: row.type,
		status: row.status,
		createdAt: row.created_at_utc,
		updatedAt: row.updated_at_utc
	}));
}

export async function createOperationDetail(
	platform: App.Platform,
	data: CreateOperationDetailData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando creación de detalle de operación');
		const newDetail = addOperationDetail({
			name: data.name,
			type: data.type,
			description: data.description || 'General'
		});
		return { success: true, id: newDetail.id };
	}
	
	const id = `detail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	const now = new Date().toISOString();
	
	return await executeMutation(
		db,
		'INSERT INTO operation_details (id, name, description, type, status, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?, ?, ?)',
		[id, data.name, data.description || null, data.type, 'active', now, now]
	);
}

export async function updateOperationDetail(
	platform: App.Platform,
	id: string,
	data: Partial<CreateOperationDetailData>
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	const updates = [];
	const params = [];

	if (data.name !== undefined) {
		updates.push('name = ?');
		params.push(data.name);
	}
	if (data.description !== undefined) {
		updates.push('description = ?');
		params.push(data.description);
	}
	if (data.type !== undefined) {
		updates.push('type = ?');
		params.push(data.type);
	}

	if (updates.length === 0) {
		return { success: true };
	}

	updates.push('updated_at_utc = ?');
	params.push(new Date().toISOString());
	params.push(id);

	return await executeMutation(
		db,
		`UPDATE operation_details SET ${updates.join(', ')} WHERE id = ?`,
		params
	);
}

export async function deleteOperationDetail(
	platform: App.Platform,
	id: string
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('⚠️ deleteOperationDetail: No hay BD, simulando éxito');
		return { success: true };
	}
	
	console.log('🗑️ deleteOperationDetail: Eliminando detalle de operación con ID:', id);
	
	const result = await executeMutation(
		db,
		'DELETE FROM operation_details WHERE id = ?',
		[id]
	);
	
	if (!result.success) {
		console.error('❌ deleteOperationDetail: Error eliminando detalle de operación:', result.error);
		return result;
	}
	
	console.log('✅ deleteOperationDetail: Detalle de operación eliminado exitosamente');
	return { success: true };
}
