import { createServerClient } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export function createSupabaseServerClient(event: RequestEvent) {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key: string) => event.cookies.get(key),
			set: (key: string, value: string, options: any) => {
				event.cookies.set(key, value, { ...options, path: options.path || '/' });
			},
			remove: (key: string, options: any) => {
				event.cookies.delete(key, { ...options, path: options.path || '/' });
			}
		}
	});
}
