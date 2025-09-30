import { drizzle } from 'drizzle-orm/better-sqlite3';

export function getDb(database: any) {
	// En desarrollo, database es una instancia de better-sqlite3
	// En producción, será D1Database
	return drizzle(database);
}


