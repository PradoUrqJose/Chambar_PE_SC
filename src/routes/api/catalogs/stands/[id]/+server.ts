import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateStand, deleteStand } from '$lib/services/stands-service';

export const PUT: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		console.log('📝 API: Actualizando stand con ID:', id);
		console.log('📝 API: Datos recibidos:', data);
		
		const result = await updateStand(platform, id, data);
		if (!result.success) {
			console.error('❌ API: Error actualizando stand:', result.error);
			return json({ error: result.error || 'Error al actualizar el stand' }, { status: 500 });
		}
		
		console.log('✅ API: Stand actualizado exitosamente');
		return json(result.data);
	} catch (error) {
		console.error('💥 API: Error inesperado actualizando stand:', error);
		return json({ error: 'Error al actualizar el stand' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;
		
		console.log('🗑️ API: Eliminando stand con ID:', id);
		
		const result = await deleteStand(platform, id);
		if (!result.success) {
			console.error('❌ API: Error eliminando stand:', result.error);
			return json({ error: result.error || 'Error al eliminar el stand' }, { status: 500 });
		}
		
		console.log('✅ API: Stand eliminado exitosamente');
		return json({ message: 'Stand eliminado correctamente' });
	} catch (error) {
		console.error('💥 API: Error inesperado eliminando stand:', error);
		return json({ error: 'Error al eliminar el stand' }, { status: 500 });
	}
};
