// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
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
			};
		}
	}
}

export {};