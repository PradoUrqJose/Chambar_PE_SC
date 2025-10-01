import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCompanies, createCompany } from '$lib/services/company-service';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const companies = await getCompanies(platform);
		return json(companies);
	} catch (error) {
		console.error('Error getting companies:', error);
		return json({ error: 'Error al obtener las empresas' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		const result = await createCompany(platform, data);
		
		if (result.success) {
			return json({ message: 'Empresa creada correctamente', id: result.id });
		} else {
			return json({ error: result.error || 'Error al crear la empresa' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error creating company:', error);
		return json({ error: 'Error al crear la empresa' }, { status: 500 });
	}
};
