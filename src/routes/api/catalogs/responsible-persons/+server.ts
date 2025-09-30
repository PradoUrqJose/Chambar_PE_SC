// Endpoint para gestionar responsables
// GET /api/catalogs/responsible-persons - Obtener responsables
// POST /api/catalogs/responsible-persons - Crear responsable

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getD1Database } from '$lib/server/db/d1';
import { responsiblePersons } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createResponsiblePerson } from '$lib/server/catalogs/catalogs-service';
import { z } from 'zod';

// Esquema de validación para crear responsable
const responsiblePersonSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	email: z.string().email('Email inválido').optional().or(z.literal('')),
	phone: z.string().optional()
});

export const GET: RequestHandler = async ({ locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	try {
		const db = getD1Database(platform);
		
		const responsibles = await db
			.select()
			.from(responsiblePersons)
			.where(eq(responsiblePersons.active, true));
		
		return json({
			success: true,
			data: responsibles
		});
		
	} catch (error) {
		console.error('Error obteniendo responsables:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	// Verificar permisos (solo admin)
	if (locals.user.role !== 'admin') {
		return json({ success: false, error: 'Sin permisos' }, { status: 403 });
	}
	
	try {
		const body = await request.json();
		
		// Validar datos
		const validationResult = responsiblePersonSchema.safeParse(body);
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
		
		// Crear responsable
		const result = await createResponsiblePerson(platform, responsibleData);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error en endpoint de responsables:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};