import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCompanies, createCompany } from '$lib/services/company-service';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		console.log('📋 API: Obteniendo empresas...');
		const companies = await getCompanies(platform);
		console.log('📋 API: Empresas obtenidas:', companies.length);
		return json(companies);
	} catch (error) {
		console.error('❌ API: Error getting companies:', error);
		return json({ error: 'Error al obtener las empresas' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		console.log('📋 API: Creando empresa con data:', data);
		
		const result = await createCompany(platform, data);
		
		if (result.success && result.id) {
			// Obtener la empresa completa para retornarla
			const companies = await getCompanies(platform);
			const newCompany = companies.find(c => c.id === result.id);
			
			console.log('✅ API: Empresa creada:', newCompany);
			return json(newCompany, { status: 201 });
		} else {
			console.error('❌ API: Error al crear empresa:', result.error);
			return json({ error: result.error || 'Error al crear la empresa' }, { status: 500 });
		}
	} catch (error) {
		console.error('💥 API: Error creating company:', error);
		return json({ error: 'Error al crear la empresa' }, { status: 500 });
	}
};
