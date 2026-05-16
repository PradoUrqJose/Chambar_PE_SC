import type { D1Database } from '@cloudflare/workers-types';

export function getD1Database(platform: App.Platform): D1Database {
	if (!platform?.env?.DB) {
		throw new Error('D1 binding DB not found. Ensure you are running with --remote or a valid local D1 binding.');
	}
	return platform.env.DB;
}

function mapDbRowToCamelCase(row: any): any {
	if (!row || typeof row !== 'object') return row;
	const result: Record<string, any> = {};
	for (const key of Object.keys(row)) {
		// Strip _utc suffix from timestamps
		const cleanKey = key.replace(/_utc$/, '');
		// Convert snake_case to camelCase
		const camelKey = cleanKey.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
		result[camelKey] = row[key];
	}
	return result;
}

export async function executeQuery<T = any>(
	db: D1Database,
	query: string,
	params: any[] = []
): Promise<T[]> {
	try {
		const result = await db.prepare(query).bind(...params).all();
		return result.results.map(mapDbRowToCamelCase) as T[];
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
