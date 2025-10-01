import { json } from '@sveltejs/kit';
import { getPendingBalance } from '$lib/services/cash-boxes-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const date = url.searchParams.get('date');
		if (!date) {
			return json({ error: 'Missing date parameter' }, { status: 400 });
		}

		const pending = await getPendingBalance(platform, date);
		if (!pending) {
			return json({ pending: null });
		}

		return json({ pending });
	} catch (error) {
		console.error('Error fetching pending balance:', error);
		return json({ error: 'Error fetching pending balance' }, { status: 500 });
	}
};
