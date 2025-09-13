import { createClient } from '@supabase/supabase-js';

// These environment variables are expected to be set in the deployment environment (e.g., Netlify).
const supabaseUrl = 'https://nqivrqqiokqsrfmsjtnz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaXZycXFpb2txc3JmbXNqdG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MzQ2NjUsImV4cCI6MjA3MzMxMDY2NX0.SDg8MhGiVbDGrVzBvjtxvevBYOva5LorndWzBlgWyzg';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);