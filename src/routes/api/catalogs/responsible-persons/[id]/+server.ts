// Endpoint para gestionar un responsable específico
// PUT /api/catalogs/responsible-persons/[id] - Actualizar responsable
// DELETE /api/catalogs/responsible-persons/[id] - Eliminar responsable

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateResponsiblePerson, deleteResponsiblePerson } from '$lib/server/catalogs/catalogs-service';
import { z } from 'zod';

// Esquema de validación para actualizar responsable
const updateResponsiblePersonSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').optional(),
	email: z.string().email('Email inválido').optional().or(z.literal('')),
	phone: z.string().optional()
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
		const responsibleId = params.id;
		
		if (!responsibleId) {
			return json({
				success: false,
				error: 'ID de responsable requerido'
			}, { status: 400 });
		}
		
		const body = await request.json();
		
		// Validar datos
		const validationResult = updateResponsiblePersonSchema.safeParse(body);
		if (!validationResult.success) {
			return json({
				success: false,
				error: 'Datos inválidos',
				details: validationResult.error.flatten().fieldErrors
			}, { status: 400 });
		}
		
		const responsibleData = validationResult.data;
		
		// Limpiar email vacío
		if (responsibleData.email === '') {
			responsibleData.email = undefined;
		}
		
		// Actualizar responsable
		const result = await updateResponsiblePerson(platform, responsibleId, responsibleData);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error actualizando responsable:', error);
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
		const responsibleId = params.id;
		
		if (!responsibleId) {
			return json({
				success: false,
				error: 'ID de responsable requerido'
			}, { status: 400 });
		}
		
		// Eliminar responsable
		const result = await deleteResponsiblePerson(platform, responsibleId);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error eliminando responsable:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};
