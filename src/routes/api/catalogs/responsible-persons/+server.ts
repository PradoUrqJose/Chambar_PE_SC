import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getResponsiblePersons, createResponsiblePerson } from '$lib/services/responsible-persons-service';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		console.log('📋 API: Obteniendo responsables...');
		const persons = await getResponsiblePersons(platform);
		console.log('📋 API: Responsables obtenidos:', persons.length);
		return json(persons);
	} catch (error) {
		console.error('❌ API: Error getting responsible persons:', error);
		return json({ error: 'Error al obtener los responsables' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const data = await request.json();
		console.log('📋 API: Creando responsable con data:', data);
		
		const result = await createResponsiblePerson(platform, {
			name: data.name,
			email: data.email,
			phone: data.phone
		});
		
		if (result.success && result.id) {
			// Obtener el responsable completo para retornarlo
			const persons = await getResponsiblePersons(platform);
			const newPerson = persons.find(p => p.id === result.id);
			
			console.log('✅ API: Responsable creado:', newPerson);
			return json(newPerson, { status: 201 });
		} else {
			console.error('❌ API: Error al crear responsable:', result.error);
			return json({ error: result.error || 'Error al crear el responsable' }, { status: 500 });
		}
	} catch (error) {
		console.error('💥 API: Error creating responsible person:', error);
		return json({ error: 'Error al crear el responsable' }, { status: 500 });
	}
};