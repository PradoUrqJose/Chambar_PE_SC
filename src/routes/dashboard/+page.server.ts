import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOpenCashBoxes } from '$lib/services/cash-boxes-service';
import { getOperations } from '$lib/services/operations-service';

export const load: PageServerLoad = async ({ locals, platform }) => {
	// Verificar si el usuario está autenticado
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (!platform) {
		return {
			user: locals.user,
			stats: { incomeToday: 0, expenseToday: 0, openBoxesCount: 0, totalBalance: 0 },
			recentOperations: []
		};
	}

	// 1. Obtener cajas abiertas para el saldo total
	const openBoxes = await getOpenCashBoxes(platform);
	const totalBalance = openBoxes.reduce((sum, box) => sum + (box.currentAmount || 0), 0);
	const openBoxesCount = openBoxes.length;

	// 2. Obtener operaciones de hoy (o fecha actual de negocio)
	// Para simplificar hoy, usamos la fecha local de Perú (UTC-5)
	const now = new Date();
	const peruDate = new Date(now.getTime() - (5 * 60 * 60 * 1000)).toISOString().split('T')[0];
	
	const allOperations = await getOperations(platform);
	const todayOps = allOperations.filter(op => (op.businessDate || op.createdAt.split('T')[0]) === peruDate);
	
	const incomeToday = todayOps.filter(op => op.type === 'income').reduce((sum, op) => sum + op.amount, 0);
	const expenseToday = todayOps.filter(op => op.type === 'expense').reduce((sum, op) => sum + op.amount, 0);

	// 3. Últimas 5 operaciones
	const recentOperations = allOperations.slice(0, 5);

	return {
		user: locals.user,
		stats: {
			incomeToday,
			expenseToday,
			openBoxesCount,
			totalBalance,
			totalOperationsToday: todayOps.length
		},
		recentOperations,
		openBoxes: openBoxes.slice(0, 3) // Mostrar solo algunas
	};
};