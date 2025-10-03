import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateCompany, deleteCompany } from '$lib/services/company-service';

export const PUT: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		console.log('📝 API: Actualizando empresa con ID:', id);
		console.log('📝 API: Datos recibidos:', data);
		
		const result = await updateCompany(platform, id, data);
		if (!result.success) {
			console.error('❌ API: Error actualizando empresa:', result.error);
			return json({ error: result.error || 'Error al actualizar la empresa' }, { status: 500 });
		}
		
		console.log('✅ API: Empresa actualizada exitosamente');
		return json(result.data);
	} catch (error) {
		console.error('💥 API: Error inesperado actualizando empresa:', error);
		return json({ error: 'Error al actualizar la empresa' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;
		
		console.log('🗑️ API: Eliminando empresa con ID:', id);
		
		const result = await deleteCompany(platform, id);
		if (!result.success) {
			console.error('❌ API: Error eliminando empresa:', result.error);
			return json({ error: result.error || 'Error al eliminar la empresa' }, { status: 500 });
		}
		
		console.log('✅ API: Empresa eliminada exitosamente');
		return json({ message: 'Empresa eliminada correctamente' });
	} catch (error) {
		console.error('💥 API: Error inesperado eliminando empresa:', error);
		return json({ error: 'Error al eliminar la empresa' }, { status: 500 });
	}
};
