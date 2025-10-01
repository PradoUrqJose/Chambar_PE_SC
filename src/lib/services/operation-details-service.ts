import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import { mockOperationDetails, addMockOperationDetail } from '$lib/db/mock-data';

export interface OperationDetail {
	id: string;
	name: string;
	type: 'income' | 'expense';
	category: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateOperationDetailData {
	name: string;
	type: 'income' | 'expense';
	category: string;
}

export async function getOperationDetails(platform: App.Platform): Promise<OperationDetail[]> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), usar datos mock
	if (!db) {
		console.log('Modo desarrollo: usando detalles mock');
		return mockOperationDetails as OperationDetail[];
	}
	
	return await executeQuery<OperationDetail>(
		db,
		'SELECT * FROM operation_details ORDER BY created_at DESC'
	);
}

export async function createOperationDetail(
	platform: App.Platform,
	data: CreateOperationDetailData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando creación de detalle de operación');
		const newDetail = addMockOperationDetail(data.name, data.type, data.category);
		return { success: true, id: newDetail.id };
	}
	
	return await executeMutation(
		db,
		'INSERT INTO operation_details (name, type, category) VALUES (?, ?, ?)',
		[data.name, data.type, data.category]
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
	if (data.type !== undefined) {
		updates.push('type = ?');
		params.push(data.type);
	}
	if (data.category !== undefined) {
		updates.push('category = ?');
		params.push(data.category);
	}

	if (updates.length === 0) {
		return { success: true };
	}

	updates.push('updated_at = CURRENT_TIMESTAMP');
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
	return await executeMutation(
		db,
		'DELETE FROM operation_details WHERE id = ?',
		[id]
	);
}
