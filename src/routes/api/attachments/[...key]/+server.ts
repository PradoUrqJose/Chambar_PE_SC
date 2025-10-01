import { getFile } from '$lib/services/attachments-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	try {
		const key = params.key;

		if (!key) {
			return new Response('Key not provided', { status: 400 });
		}

		const result = await getFile(platform, key);

		if (result.success && result.file) {
			return new Response(result.file.body, {
				headers: {
					'Content-Type': result.file.httpMetadata?.contentType || 'application/octet-stream',
					'Cache-Control': 'public, max-age=31536000, immutable',
				}
			});
		} else {
			return new Response(result.error || 'File not found', { status: 404 });
		}

	} catch (error) {
		console.error('Error getting file:', error);
		return new Response('Internal server error', { status: 500 });
	}
};

