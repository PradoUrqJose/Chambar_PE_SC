import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import { mockStands, addMockStand } from '$lib/db/mock-data';

export interface Stand {
	id: string;
	name: string;
	location: string;
	status: 'active' | 'inactive';
	createdAt: string;
	updatedAt: string;
}

export interface CreateStandData {
	name: string;
	location: string;
	status?: 'active' | 'inactive';
}

export async function getStands(platform: App.Platform): Promise<Stand[]> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), usar datos mock
	if (!db) {
		return mockStands as Stand[];
	}
	
	return await executeQuery<Stand>(
		db,
		'SELECT * FROM stands ORDER BY created_at DESC'
	);
}

export async function createStand(
	platform: App.Platform,
	data: CreateStandData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando creación de stand');
		const newStand = addMockStand(data.name, data.location);
		return { success: true, id: newStand.id };
	}
	
	return await executeMutation(
		db,
		'INSERT INTO stands (name, location, status) VALUES (?, ?, ?)',
		[data.name, data.location, data.status || 'active']
	);
}

export async function updateStand(
	platform: App.Platform,
	id: string,
	data: Partial<CreateStandData>
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	const updates = [];
	const params = [];

	if (data.name !== undefined) {
		updates.push('name = ?');
		params.push(data.name);
	}
	if (data.location !== undefined) {
		updates.push('location = ?');
		params.push(data.location);
	}
	if (data.status !== undefined) {
		updates.push('status = ?');
		params.push(data.status);
	}

	if (updates.length === 0) {
		return { success: true };
	}

	updates.push('updated_at = CURRENT_TIMESTAMP');
	params.push(id);

	return await executeMutation(
		db,
		`UPDATE stands SET ${updates.join(', ')} WHERE id = ?`,
		params
	);
}

export async function deleteStand(
	platform: App.Platform,
	id: string
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	return await executeMutation(
		db,
		'DELETE FROM stands WHERE id = ?',
		[id]
	);
}
