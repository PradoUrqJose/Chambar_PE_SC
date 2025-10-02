import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mockCompanies, addCompany } from '$lib/db/catalog-mock-data';

export const GET: RequestHandler = async () => {
	return json(mockCompanies);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		const newCompany = addCompany({
			razonSocial: data.razonSocial,
			ruc: data.ruc,
			status: data.status || 'active'
		});
		
		return json(newCompany, { status: 201 });
	} catch (error) {
		return json({ error: 'Error al crear la empresa' }, { status: 500 });
	}
};
