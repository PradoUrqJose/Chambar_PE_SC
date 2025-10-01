import { createServerClient } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';

export function createSupabaseServerClient(event: RequestEvent) {
	const supabaseUrl = 'https://odrwnelygjcvdhhtryzr.supabase.co';
	const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcnduZWx5Z2pjdmRoaHRyeXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNjg3MTEsImV4cCI6MjA3NDg0NDcxMX0.VvZjq_UxnG5UA0ZpbjxCDukyPOIJ0ul0yZqCpkr0yHQ';

	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			get: (key: string) => event.cookies.get(key),
			set: (key: string, value: string, options: any) => {
				event.cookies.set(key, value, options);
			},
			remove: (key: string, options: any) => {
				event.cookies.delete(key, options);
			}
		}
	});
}
