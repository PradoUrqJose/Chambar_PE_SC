import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = 'https://odrwnelygjcvdhhtryzr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcnduZWx5Z2pjdmRoaHRyeXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNjg3MTEsImV4cCI6MjA3NDg0NDcxMX0.VvZjq_UxnG5UA0ZpbjxCDukyPOIJ0ul0yZqCpkr0yHQ';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
