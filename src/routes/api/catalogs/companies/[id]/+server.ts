import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock data para empresas (en un proyecto real esto vendría de una base de datos)
let mockCompanies = [
	{ id: '1', razonSocial: 'Empresa Demo S.A.C.', ruc: '20123456789', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		const index = mockCompanies.findIndex(company => company.id === id);
		if (index === -1) {
			return json({ error: 'Empresa no encontrada' }, { status: 404 });
		}
		
		mockCompanies[index] = {
			...mockCompanies[index],
			...data,
			updatedAt: new Date().toISOString()
		};
		
		return json(mockCompanies[index]);
	} catch (error) {
		return json({ error: 'Error al actualizar la empresa' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		
		const index = mockCompanies.findIndex(company => company.id === id);
		if (index === -1) {
			return json({ error: 'Empresa no encontrada' }, { status: 404 });
		}
		
		mockCompanies.splice(index, 1);
		return json({ message: 'Empresa eliminada correctamente' });
	} catch (error) {
		return json({ error: 'Error al eliminar la empresa' }, { status: 500 });
	}
};
