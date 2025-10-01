import { json } from '@sveltejs/kit';
import { getCompany, createCompany, updateCompany } from '$lib/services/company-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const company = await getCompany(platform);
		return json(company);
	} catch (error) {
		console.error('Error getting company:', error);
		return json({ error: 'Error al obtener los datos de la empresa' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		
		// Verificar si ya existe una empresa
		const existingCompany = await getCompany(platform);
		
		if (existingCompany) {
			// Actualizar empresa existente
			const result = await updateCompany(platform, existingCompany.id, data);
			if (result.success) {
				return json({ message: 'Empresa actualizada correctamente' });
			} else {
				return json({ error: result.error || 'Error al actualizar la empresa' }, { status: 500 });
			}
		} else {
			// Crear nueva empresa
			const result = await createCompany(platform, data);
			if (result.success) {
				return json({ message: 'Empresa creada correctamente' });
			} else {
				return json({ error: result.error || 'Error al crear la empresa' }, { status: 500 });
			}
		}
	} catch (error) {
		console.error('Error saving company:', error);
		return json({ error: 'Error al guardar la empresa' }, { status: 500 });
	}
};
