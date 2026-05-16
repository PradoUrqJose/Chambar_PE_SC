// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { D1Database, R2Bucket, R2ObjectBody } from '@cloudflare/workers-types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				email: string;
				role: string;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
				ATTACHMENTS: R2Bucket;
				R2_PUBLIC_DOMAIN?: string;
				CLOUDFLARE_ACCOUNT_HASH?: string;
				CACHE_MAX_SIZE?: string;
				CACHE_MAX_AGE?: string;
				COMPRESSION_ENABLED?: string;
				COMPRESSION_QUALITY?: string;
				COMPRESSION_MAX_WIDTH?: string;
				COMPRESSION_MAX_HEIGHT?: string;
				COMPRESSION_MAX_SIZE_KB?: string;
				THUMBNAIL_ENABLED?: string;
				THUMBNAIL_WIDTH?: string;
				THUMBNAIL_HEIGHT?: string;
				THUMBNAIL_QUALITY?: string;
				THUMBNAIL_FORMAT?: string;
				LAZY_LOADING_ENABLED?: string;
				LAZY_LOADING_ROOT_MARGIN?: string;
				LAZY_LOADING_THRESHOLD?: string;
				DEBUG_MODE?: string;
				LOG_COMPRESSION_STATS?: string;
				LOG_CACHE_STATS?: string;
				LOG_THUMBNAIL_GENERATION?: string;
			};
		}
	}
}

export { };