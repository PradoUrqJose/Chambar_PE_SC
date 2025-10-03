import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOperationDetails, createOperationDetail } from '$lib/services/operation-details-service';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		console.log('📋 API: Obteniendo detalles de operación...');
		const details = await getOperationDetails(platform);
		console.log('📋 API: Detalles obtenidos:', details.length);
		return json(details);
	} catch (error) {
		console.error('❌ API: Error getting operation details:', error);
		return json({ error: 'Error al obtener los detalles de operación' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		console.log('📋 API: Creando detalle de operación con data:', data);
		
		const result = await createOperationDetail(platform, {
			name: data.name,
			description: data.description,
			type: data.type
		});
		
		if (result.success && result.id) {
			// Obtener el detalle completo para retornarlo
			const details = await getOperationDetails(platform);
			const newDetail = details.find(d => d.id === result.id);
			
			console.log('✅ API: Detalle de operación creado:', newDetail);
			return json(newDetail, { status: 201 });
		} else {
			console.error('❌ API: Error al crear detalle:', result.error);
			return json({ error: result.error || 'Error al crear el detalle de operación' }, { status: 500 });
		}
	} catch (error) {
		console.error('💥 API: Error creating operation detail:', error);
		return json({ error: 'Error al crear el detalle de operación' }, { status: 500 });
	}
};