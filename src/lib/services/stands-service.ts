
import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';

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
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	return await executeQuery<Stand>(
		db,
		'SELECT * FROM stands ORDER BY created_at_utc DESC'
	);
}

export async function createStand(
	platform: App.Platform,
	data: CreateStandData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	const id = crypto.randomUUID();
	const result = await executeMutation(
		db,
		'INSERT INTO stands (id, name, location, status, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?, ?)',
		[id, data.name, data.location, data.status || 'active', new Date().toISOString(), new Date().toISOString()]
	);
	return { ...result, id };
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

	updates.push('updated_at_utc = CURRENT_TIMESTAMP');
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
