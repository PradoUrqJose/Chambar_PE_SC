import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateOperationDetail, deleteOperationDetail } from '$lib/services/operation-details-service';

export const PUT: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		console.log('📝 API: Actualizando detalle de operación con ID:', id);
		console.log('📝 API: Datos recibidos:', data);
		
		const result = await updateOperationDetail(platform, id, data);
		if (!result.success) {
			console.error('❌ API: Error actualizando detalle de operación:', result.error);
			return json({ error: result.error || 'Error al actualizar el detalle de operación' }, { status: 500 });
		}
		
		console.log('✅ API: Detalle de operación actualizado exitosamente');
		return json(result.data);
	} catch (error) {
		console.error('💥 API: Error inesperado actualizando detalle de operación:', error);
		return json({ error: 'Error al actualizar el detalle de operación' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;
		
		console.log('🗑️ API: Eliminando detalle de operación con ID:', id);
		
		const result = await deleteOperationDetail(platform, id);
		if (!result.success) {
			console.error('❌ API: Error eliminando detalle de operación:', result.error);
			return json({ error: result.error || 'Error al eliminar el detalle de operación' }, { status: 500 });
		}
		
		console.log('✅ API: Detalle de operación eliminado exitosamente');
		return json({ message: 'Detalle de operación eliminado correctamente' });
	} catch (error) {
		console.error('💥 API: Error inesperado eliminando detalle de operación:', error);
		return json({ error: 'Error al eliminar el detalle de operación' }, { status: 500 });
	}
};
