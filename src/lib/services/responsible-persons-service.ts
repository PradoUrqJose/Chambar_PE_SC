
import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';

export interface ResponsiblePerson {
	id: string;
	name: string;
	email: string;
	phone?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateResponsiblePersonData {
	name: string;
	email: string;
	phone?: string;
}

export async function getResponsiblePersons(platform: App.Platform): Promise<ResponsiblePerson[]> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	return await executeQuery<ResponsiblePerson>(
		db,
		'SELECT * FROM responsible_persons ORDER BY created_at_utc DESC'
	);
}

export async function createResponsiblePerson(
	platform: App.Platform,
	data: CreateResponsiblePersonData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	const id = crypto.randomUUID();
	const result = await executeMutation(
		db,
		'INSERT INTO responsible_persons (id, name, email, phone, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?, ?)',
		[id, data.name, data.email, data.phone || null, new Date().toISOString(), new Date().toISOString()]
	);
	return { ...result, id };
}

export async function updateResponsiblePerson(
	platform: App.Platform,
	id: string,
	data: Partial<CreateResponsiblePersonData>
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	const updates = [];
	const params = [];

	if (data.name !== undefined) {
		updates.push('name = ?');
		params.push(data.name);
	}
	if (data.email !== undefined) {
		updates.push('email = ?');
		params.push(data.email);
	}
	if (data.phone !== undefined) {
		updates.push('phone = ?');
		params.push(data.phone);
	}

	if (updates.length === 0) {
		return { success: true };
	}

	updates.push('updated_at_utc = CURRENT_TIMESTAMP');
	params.push(id);

	return await executeMutation(
		db,
		`UPDATE responsible_persons SET ${updates.join(', ')} WHERE id = ?`,
		params
	);
}

export async function deleteResponsiblePerson(
	platform: App.Platform,
	id: string
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	return await executeMutation(
		db,
		'DELETE FROM responsible_persons WHERE id = ?',
		[id]
	);
}
