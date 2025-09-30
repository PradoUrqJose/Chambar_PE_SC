// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
        // interface Error {}
        interface Locals {
            db: import('drizzle-orm/d1').D1Database | undefined;
            user: import('lucia').User | null;
            session: import('lucia').Session | null;
        }
		// interface PageData {}
		// interface PageState {}
        interface Platform {
            env: {
                DB: D1Database;
                R2_BUCKET: R2Bucket;
            };
            cf: CfProperties;
            ctx: ExecutionContext;
        }
	}
}

export {};
