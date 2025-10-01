import { json } from '@sveltejs/kit';
import { handlePendingBalanceAction } from '$lib/services/cash-boxes-service';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const { action, pendingBalanceId, currentCashBoxId, notes } = await request.json();

		if (!action || !pendingBalanceId) {
			return json({ error: 'Missing required parameters' }, { status: 400 });
		}

		const result = await handlePendingBalanceAction(platform, action, {
			pendingBalanceId,
			currentCashBoxId,
			notes
		});

		if (!result.success) {
			return json({ error: result.error || 'Error processing pending balance' }, { status: 500 });
		}

		return json({ success: true, ...result });
	} catch (error) {
		console.error('Error processing pending balance action:', error);
		return json({ error: 'Error processing pending balance' }, { status: 500 });
	}
};
