import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateCompany } from '$lib/services/company-service';
import { executeMutation } from '$lib/db/d1';

export const PUT: RequestHandler = async ({ params, request, platform }) => {
	try {
		const { id } = params;
		const data = await request.json();
		
		const result = await updateCompany(platform!, id, data);
		if (!result.success) {
			return json({ error: result.error || 'Error al actualizar la empresa' }, { status: 500 });
		}
		
		return json({ success: true });
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al actualizar la empresa' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
	try {
		const { id } = params;
		
		const result = await executeMutation(platform!.env.DB, 'DELETE FROM companies WHERE id = ?', [id]);
		if (!result.success) {
			return json({ error: result.error || 'Error al eliminar la empresa' }, { status: 500 });
		}
		
		return json({ message: 'Empresa eliminada correctamente' });
	} catch (error) {
		console.error(error);
		return json({ error: 'Error al eliminar la empresa' }, { status: 500 });
	}
};
