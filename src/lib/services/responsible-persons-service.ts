import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import { mockResponsiblePersons, addResponsiblePerson } from '$lib/db/catalog-mock-data';

export interface ResponsiblePerson {
	id: string;
	name: string;
	email: string;
	phone?: string;
	status: 'active' | 'inactive';
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
	
	// Si no hay base de datos (desarrollo local), usar datos mock
	if (!db) {
		console.log('Modo desarrollo: usando responsables mock');
		return mockResponsiblePersons as ResponsiblePerson[];
	}
	
	const results = await executeQuery<any>(
		db,
		'SELECT * FROM responsible_persons ORDER BY created_at_utc DESC'
	);
	
	// Mapear los campos de la BD a la interfaz ResponsiblePerson
	return results.map((row: any) => ({
		id: row.id,
		name: row.name,
		email: row.email,
		phone: row.phone,
		status: row.status,
		createdAt: row.created_at_utc,
		updatedAt: row.updated_at_utc
	}));
}

export async function createResponsiblePerson(
	platform: App.Platform,
	data: CreateResponsiblePersonData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando creación de responsable');
		const newPerson = addResponsiblePerson({
			name: data.name,
			email: data.email,
			phone: data.phone
		});
		return { success: true, id: newPerson.id };
	}
	
	const id = `person-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	const now = new Date().toISOString();
	
	return await executeMutation(
		db,
		'INSERT INTO responsible_persons (id, name, email, phone, status, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?, ?, ?)',
		[id, data.name, data.email, data.phone || null, 'active', now, now]
	);
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

	updates.push('updated_at_utc = ?');
	params.push(new Date().toISOString());
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
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('⚠️ deleteResponsiblePerson: No hay BD, simulando éxito');
		return { success: true };
	}
	
	console.log('🗑️ deleteResponsiblePerson: Eliminando responsable con ID:', id);
	
	const result = await executeMutation(
		db,
		'DELETE FROM responsible_persons WHERE id = ?',
		[id]
	);
	
	if (!result.success) {
		console.error('❌ deleteResponsiblePerson: Error eliminando responsable:', result.error);
		return result;
	}
	
	console.log('✅ deleteResponsiblePerson: Responsable eliminado exitosamente');
	return { success: true };
}
