import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import { mockCompanies, addCompany, updateCompany as updateMockCompany } from '$lib/db/catalog-mock-data';
import type { Company, CreateCompanyData, UpdateCompanyData } from '$lib/types/company';

export async function getCompany(platform: App.Platform): Promise<Company | null> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), usar datos mock
	if (!db) {
		return mockCompanies[0] as Company;
	}
	
	const results = await executeQuery<any>(
		db,
		'SELECT * FROM companies ORDER BY created_at_utc DESC LIMIT 1'
	);
	
	if (results.length === 0) return null;
	
	const row = results[0];
	return {
		id: row.id,
		razonSocial: row.razon_social,
		ruc: row.ruc,
		address: row.address,
		phone: row.phone,
		status: row.status,
		createdAt: row.created_at_utc,
		updatedAt: row.updated_at_utc
	};
}

export async function getCompanies(platform: App.Platform): Promise<Company[]> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), usar datos mock
	if (!db) {
		return mockCompanies as Company[];
	}
	
	const results = await executeQuery<any>(
		db,
		'SELECT * FROM companies ORDER BY created_at_utc DESC'
	);
	
	// Mapear los campos de la BD a la interfaz Company
	return results.map((row: any) => ({
		id: row.id,
		razonSocial: row.razon_social,
		ruc: row.ruc,
		address: row.address,
		phone: row.phone,
		status: row.status,
		createdAt: row.created_at_utc,
		updatedAt: row.updated_at_utc
	}));
}

export async function createCompany(
	platform: App.Platform,
	data: CreateCompanyData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando creación de empresa');
		const newCompany = addCompany({
			razonSocial: data.razonSocial,
			ruc: data.ruc
		});
		return { success: true, id: newCompany.id };
	}
	
	const id = `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	const now = new Date().toISOString();
	
	return await executeMutation(
		db,
		'INSERT INTO companies (id, razon_social, ruc, address, phone, status, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
		[id, data.razonSocial, data.ruc, data.address || null, data.phone || null, 'active', now, now]
	);
}

export async function updateCompany(
	platform: App.Platform,
	id: string,
	data: UpdateCompanyData
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando actualización de empresa');
		const updatedCompany = updateMockCompany(id, {
			razonSocial: data.razonSocial,
			ruc: data.ruc
		});
		return { success: updatedCompany !== null };
	}
	
	const updates = [];
	const params = [];

	if (data.razonSocial !== undefined) {
		updates.push('razon_social = ?');
		params.push(data.razonSocial);
	}
	if (data.ruc !== undefined) {
		updates.push('ruc = ?');
		params.push(data.ruc);
	}

	if (updates.length === 0) {
		return { success: true };
	}

	updates.push('updated_at_utc = ?');
	params.push(new Date().toISOString());
	params.push(id);

	return await executeMutation(
		db,
		`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`,
		params
	);
}

export async function deleteCompany(
	platform: App.Platform,
	id: string
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('⚠️ deleteCompany: No hay BD, simulando éxito');
		return { success: true };
	}
	
	console.log('🗑️ deleteCompany: Eliminando empresa con ID:', id);
	
	const result = await executeMutation(
		db,
		'DELETE FROM companies WHERE id = ?',
		[id]
	);
	
	if (!result.success) {
		console.error('❌ deleteCompany: Error eliminando empresa:', result.error);
		return result;
	}
	
	console.log('✅ deleteCompany: Empresa eliminada exitosamente');
	return { success: true };
}
