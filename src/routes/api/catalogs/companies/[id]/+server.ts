// Endpoint para gestionar una empresa específica
// PUT /api/catalogs/companies/[id] - Actualizar empresa
// DELETE /api/catalogs/companies/[id] - Eliminar empresa

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateCompany, deleteCompany } from '$lib/server/catalogs/catalogs-service';
import { z } from 'zod';

// Esquema de validación para actualizar empresa
const updateCompanySchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').optional(),
	ruc: z.string().optional(),
	address: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email('Email inválido').optional().or(z.literal(''))
});

export const PUT: RequestHandler = async ({ params, request, locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	// Verificar permisos (solo admin)
	if (locals.user.role !== 'admin') {
		return json({ success: false, error: 'Sin permisos' }, { status: 403 });
	}
	
	try {
		const companyId = params.id;
		
		if (!companyId) {
			return json({
				success: false,
				error: 'ID de empresa requerido'
			}, { status: 400 });
		}
		
		const body = await request.json();
		
		// Validar datos
		const validationResult = updateCompanySchema.safeParse(body);
		if (!validationResult.success) {
			return json({
				success: false,
				error: 'Datos inválidos',
				details: validationResult.error.flatten().fieldErrors
			}, { status: 400 });
		}
		
		const companyData = validationResult.data;
		
		// Limpiar email vacío
		if (companyData.email === '') {
			companyData.email = undefined;
		}
		
		// Actualizar empresa
		const result = await updateCompany(platform, companyId, companyData);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error actualizando empresa:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	// Verificar permisos (solo admin)
	if (locals.user.role !== 'admin') {
		return json({ success: false, error: 'Sin permisos' }, { status: 403 });
	}
	
	try {
		const companyId = params.id;
		
		if (!companyId) {
			return json({
				success: false,
				error: 'ID de empresa requerido'
			}, { status: 400 });
		}
		
		// Eliminar empresa
		const result = await deleteCompany(platform, companyId);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error eliminando empresa:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};
