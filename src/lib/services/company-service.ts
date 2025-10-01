import { getD1Database, executeQuery, executeMutation } from '$lib/db/d1';
import { mockCompanies, addMockCompany, updateMockCompany } from '$lib/db/mock-data';
import type { Company, CreateCompanyData, UpdateCompanyData } from '$lib/types/company';

export async function getCompany(platform: App.Platform): Promise<Company | null> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), usar datos mock
	if (!db) {
		return mockCompanies[0] as Company;
	}
	
	const companies = await executeQuery<Company>(
		db,
		'SELECT * FROM companies ORDER BY created_at DESC LIMIT 1'
	);
	return companies[0] || null;
}

export async function getCompanies(platform: App.Platform): Promise<Company[]> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), usar datos mock
	if (!db) {
		return mockCompanies as Company[];
	}
	
	return await executeQuery<Company>(
		db,
		'SELECT * FROM companies ORDER BY created_at DESC'
	);
}

export async function createCompany(
	platform: App.Platform,
	data: CreateCompanyData
): Promise<{ success: boolean; id?: string; error?: string }> {
	const db = getD1Database(platform);
	
	// Si no hay base de datos (desarrollo local), simular éxito
	if (!db) {
		console.log('Modo desarrollo: simulando creación de empresa');
		const newCompany = addMockCompany(data.razonSocial, data.ruc);
		return { success: true, id: newCompany.id };
	}
	
	return await executeMutation(
		db,
		'INSERT INTO companies (razon_social, ruc) VALUES (?, ?)',
		[data.razonSocial, data.ruc]
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
		updateMockCompany(id, data.razonSocial, data.ruc);
		return { success: true };
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

	updates.push('updated_at = CURRENT_TIMESTAMP');
	params.push(id);

	return await executeMutation(
		db,
		`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`,
		params
	);
}
