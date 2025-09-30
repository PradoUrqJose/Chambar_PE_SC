// Endpoint para gestionar stands
// GET /api/catalogs/stands - Obtener stands
// POST /api/catalogs/stands - Crear stand

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getD1Database } from '$lib/server/db/d1';
import { stands } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createStand } from '$lib/server/catalogs/catalogs-service';
import { z } from 'zod';
import { mockData } from '$lib/server/dev-fallback';

// Esquema de validación para crear stand
const standSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	description: z.string().optional(),
	location: z.string().optional()
});

export const GET: RequestHandler = async ({ locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	// Fallback para desarrollo local - forzar modo desarrollo
	const isLocalDev = true; // Forzar modo desarrollo por ahora
	
	if (isLocalDev) {
		console.log('🔧 Modo desarrollo - retornando stands mock');
		return json({ success: true, data: mockData.stands });
	}
	
	try {
		const db = getD1Database(platform);
		
		const standsList = await db
			.select()
			.from(stands)
			.where(eq(stands.active, true));
		
		return json({
			success: true,
			data: standsList
		});
		
	} catch (error) {
		console.error('Error obteniendo stands:', error);
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
		const validationResult = standSchema.safeParse(body);
		if (!validationResult.success) {
			return json({
				success: false,
				error: 'Datos inválidos',
				details: validationResult.error.flatten().fieldErrors
			}, { status: 400 });
		}
		
		const standData = validationResult.data;
		
		// Crear stand
		const result = await createStand(platform, standData);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error en endpoint de stands:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};