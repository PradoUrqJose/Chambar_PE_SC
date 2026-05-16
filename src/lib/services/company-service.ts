
import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import type { Company, CreateCompanyData, UpdateCompanyData } from '$lib/types/company';

export async function getCompany(platform: App.Platform): Promise<Company | null> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	const companies = await executeQuery<Company>(
		db,
		'SELECT * FROM companies ORDER BY created_at_utc DESC LIMIT 1'
	);
	return companies[0] || null;
}

export async function getCompanies(platform: App.Platform): Promise<Company[]> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	return await executeQuery<Company>(
		db,
		'SELECT * FROM companies ORDER BY created_at_utc DESC'
	);
}

export async function createCompany(
	platform: App.Platform,
	data: CreateCompanyData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
	}
	
	const id = crypto.randomUUID();
	const result = await executeMutation(
		db,
		'INSERT INTO companies (id, razon_social, ruc, created_at_utc, updated_at_utc) VALUES (?, ?, ?, ?, ?)',
		[id, data.razonSocial, data.ruc, new Date().toISOString(), new Date().toISOString()]
	);
	return { ...result, id };
}

export async function updateCompany(
	platform: App.Platform,
	id: string,
	data: UpdateCompanyData
): Promise<{ success: boolean; error?: string }> {
	const db = getD1Database(platform);
	
	// Se requiere base de datos
	if (!db) {
		throw new Error('D1 database not found. Please ensure bindings are configured.');
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

	updates.push('updated_at_utc = CURRENT_TIMESTAMP');
	params.push(id);

	return await executeMutation(
		db,
		`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`,
		params
	);
}
