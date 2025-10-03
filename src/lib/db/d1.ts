import type { D1Database } from '@cloudflare/workers-types';

export function getD1Database(platform: App.Platform): D1Database {
	console.log('🔍 getD1Database - platform:', !!platform);
	console.log('🔍 getD1Database - platform.env:', !!platform?.env);
	console.log('🔍 getD1Database - DB_PROD available:', !!platform?.env?.DB_PROD);
	console.log('🔍 getD1Database - DB available:', !!platform?.env?.DB);
	console.log('🔍 getD1Database - platform.env keys:', platform?.env ? Object.keys(platform.env) : 'no env');
	
	// Priorizar base de datos de producción si está disponible
	if (platform?.env?.DB_PROD) {
		console.log('✅ Using production database (DB_PROD)');
		console.log('🔍 DB_PROD type:', typeof platform.env.DB_PROD);
		return platform.env.DB_PROD;
	}
	
	if (platform?.env?.DB) {
		console.log('✅ Using development database (DB)');
		console.log('🔍 DB type:', typeof platform.env.DB);
		return platform.env.DB;
	}
	
	// En desarrollo local, usar datos mock
	console.warn('⚠️ D1 database not available, using mock data');
	return null as any;
}

export async function executeQuery<T = any>(
	db: D1Database,
	query: string,
	params: any[] = []
): Promise<T[]> {
	try {
		const result = await db.prepare(query).bind(...params).all();
		return result.results as T[];
	} catch (error) {
		console.error('Database query error:', error);
		throw error;
	}
}

export async function executeMutation(
	db: D1Database,
	query: string,
	params: any[] = []
): Promise<{ success: boolean; id?: string; error?: string }> {
	try {
		const result = await db.prepare(query).bind(...params).run();
		
		// Si es un INSERT, intentar obtener el ID del primer parámetro (que debería ser el ID)
		let id: string | undefined;
		if (query.toUpperCase().startsWith('INSERT') && params.length > 0) {
			// El ID debería ser el primer parámetro en nuestros INSERTs
			id = params[0]?.toString();
		} else {
			// Fallback al last_row_id si está disponible
			id = result.meta.last_row_id?.toString();
		}
		
		return {
			success: true,
			id
		};
	} catch (error) {
		console.error('Database mutation error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}
