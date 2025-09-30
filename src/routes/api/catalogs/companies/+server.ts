// Endpoint para gestionar empresas
// GET /api/catalogs/companies - Obtener empresas
// POST /api/catalogs/companies - Crear empresa

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getD1Database } from '$lib/server/db/d1';
import { companies } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createCompany } from '$lib/server/catalogs/catalogs-service';
import { z } from 'zod';
import { mockData } from '$lib/server/dev-fallback';

// Esquema de validación para crear empresa
const companySchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	ruc: z.string().optional(),
	address: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email('Email inválido').optional().or(z.literal(''))
});

export const GET: RequestHandler = async ({ locals, platform }) => {
	// Verificar autenticación
	if (!locals.user) {
		return json({ success: false, error: 'No autorizado' }, { status: 401 });
	}
	
	// Fallback para desarrollo local - forzar modo desarrollo
	const isLocalDev = true; // Forzar modo desarrollo por ahora
	
	if (isLocalDev) {
		console.log('🔧 Modo desarrollo - retornando empresas mock');
		return json({ success: true, data: mockData.companies });
	}
	
	try {
		const db = getD1Database(platform);
		
		const companiesList = await db
			.select()
			.from(companies)
			.where(eq(companies.active, true));
		
		return json({
			success: true,
			data: companiesList
		});
		
	} catch (error) {
		console.error('Error obteniendo empresas:', error);
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
		const validationResult = companySchema.safeParse(body);
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
		
		// Crear empresa
		const result = await createCompany(platform, companyData);
		
		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 400 });
		}
		
	} catch (error) {
		console.error('Error en endpoint de empresas:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};