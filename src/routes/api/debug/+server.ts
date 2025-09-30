// Endpoint de debug para verificar el estado de la base de datos
// ⚠️ SOLO USAR EN DESARROLLO

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getD1Database } from '$lib/server/db/d1';
import { 
	users, 
	operationDetails, 
	responsiblePersons, 
	stands, 
	companies, 
	cashBoxes, 
	operations 
} from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	try {
		const db = getD1Database(platform);
		
		// Obtener datos de todas las tablas
		const [allUsers, allOperationDetails, allResponsibles, allStands, allCompanies, allCashBoxes, allOperations] = await Promise.all([
			db.select().from(users),
			db.select().from(operationDetails),
			db.select().from(responsiblePersons),
			db.select().from(stands),
			db.select().from(companies),
			db.select().from(cashBoxes),
			db.select().from(operations)
		]);
		
		return json({
			success: true,
			summary: {
				users: allUsers.length,
				operationDetails: allOperationDetails.length,
				responsibles: allResponsibles.length,
				stands: allStands.length,
				companies: allCompanies.length,
				cashBoxes: allCashBoxes.length,
				operations: allOperations.length
			},
			data: {
				users: allUsers,
				operationDetails: allOperationDetails,
				responsibles: allResponsibles,
				stands: allStands,
				companies: allCompanies,
				cashBoxes: allCashBoxes,
				operations: allOperations
			}
		});
	} catch (error) {
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido'
		}, { status: 500 });
	}
};
