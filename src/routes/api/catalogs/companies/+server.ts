import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCompanies, createCompany } from '$lib/services/company-service';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const companies = await getCompanies(platform!);
		return json(companies);
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al obtener las empresas' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		const result = await createCompany(platform!, data);
		
		if (result.success) {
			return json({ success: true, id: result.id }, { status: 201 });
		}
		return json({ error: result.error }, { status: 500 });
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al crear la empresa' }, { status: 500 });
	}
};
