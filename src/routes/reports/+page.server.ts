import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	return {
		platform: {
			env: {
				CLOUDFLARE_ACCOUNT_HASH: platform?.env?.CLOUDFLARE_ACCOUNT_HASH
			}
		}
	};
};
