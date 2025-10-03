import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import { mockStands, addStand } from '$lib/db/catalog-mock-data';

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
	
	const results = await executeQuery<any>(
		db,
		'SELECT * FROM stands ORDER BY created_at_utc DESC'
	);
	
	// Mapear los campos de la BD a la interfaz Stand
	return results.map((row: any) => ({
		id: row.id,
		name: row.name,
		location: row.location,
		status: row.status,
		createdAt: row.created_at_utc,
		updatedAt: row.updated_at_utc
	}));
}

export async function createStand(
	platform: App.Platform,
	data: CreateStandData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando creación de stand');
		const newStand = addStand({
			name: data.name,
			location: data.location
		});
		return { success: true, id: newStand.id };
	}
	
	const id = `stand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	const now = new Date().toISOString();
	
	return await executeMutation(
		db,
		'INSERT INTO stands (id, name, location, status, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?, ?)',
		[id, data.name, data.location, data.status || 'active', now, now]
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

	updates.push('updated_at_utc = ?');
	params.push(new Date().toISOString());
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
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('⚠️ deleteStand: No hay BD, simulando éxito');
		return { success: true };
	}
	
	console.log('🗑️ deleteStand: Eliminando stand con ID:', id);
	
	const result = await executeMutation(
		db,
		'DELETE FROM stands WHERE id = ?',
		[id]
	);
	
	if (!result.success) {
		console.error('❌ deleteStand: Error eliminando stand:', result.error);
		return result;
	}
	
	console.log('✅ deleteStand: Stand eliminado exitosamente');
	return { success: true };
}
