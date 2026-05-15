import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = 'https://rmuhtossltxbvszmfazb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdWh0b3NzbHR4YnZzem1mYXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MDE5NTUsImV4cCI6MjA5NDM3Nzk1NX0.wG4Dx5EMsf4EWnN5Fg6_ctzFMAN3fRb6nsihUhAdbog';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
