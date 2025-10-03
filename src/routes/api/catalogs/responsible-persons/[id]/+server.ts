import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateResponsiblePerson, deleteResponsiblePerson } from '$lib/services/responsible-persons-service';

export const PUT: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		console.log('📝 API: Actualizando responsable con ID:', id);
		console.log('📝 API: Datos recibidos:', data);
		
		const result = await updateResponsiblePerson(platform, id, data);
		if (!result.success) {
			console.error('❌ API: Error actualizando responsable:', result.error);
			return json({ error: result.error || 'Error al actualizar el responsable' }, { status: 500 });
		}
		
		console.log('✅ API: Responsable actualizado exitosamente');
		return json(result.data);
	} catch (error) {
		console.error('💥 API: Error inesperado actualizando responsable:', error);
		return json({ error: 'Error al actualizar el responsable' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;
		
		console.log('🗑️ API: Eliminando responsable con ID:', id);
		
		const result = await deleteResponsiblePerson(platform, id);
		if (!result.success) {
			console.error('❌ API: Error eliminando responsable:', result.error);
			return json({ error: result.error || 'Error al eliminar el responsable' }, { status: 500 });
		}
		
		console.log('✅ API: Responsable eliminado exitosamente');
		return json({ message: 'Responsable eliminado correctamente' });
	} catch (error) {
		console.error('💥 API: Error inesperado eliminando responsable:', error);
		return json({ error: 'Error al eliminar el responsable' }, { status: 500 });
	}
};
