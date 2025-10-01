import type { D1Database } from '@cloudflare/workers-types';

export function getD1Database(platform: App.Platform): D1Database {
	if (!platform?.env?.DB) {
		// En desarrollo local, usar datos mock
		console.warn('D1 database not available, using mock data');
		return null as any;
	}
	return platform.env.DB;
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
		return {
			success: true,
			id: result.meta.last_row_id?.toString()
		};
	} catch (error) {
		console.error('Database mutation error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}
