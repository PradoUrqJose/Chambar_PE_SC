import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock data para empresas
let mockCompanies = [
	{ id: '1', razonSocial: 'Empresa Demo S.A.C.', ruc: '20123456789', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const GET: RequestHandler = async () => {
	return json(mockCompanies);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		const newCompany = {
			id: 'company-' + Date.now(),
			razonSocial: data.razonSocial,
			ruc: data.ruc,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		
		mockCompanies.push(newCompany);
		return json(newCompany, { status: 201 });
	} catch (error) {
		return json({ error: 'Error al crear la empresa' }, { status: 500 });
	}
};
