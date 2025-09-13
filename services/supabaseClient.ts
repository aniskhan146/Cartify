import { createClient } from '@supabase/supabase-js';

// Environment variables are expected to be injected by the build process (e.g., Vite, Netlify).
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided. Check your environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) and build configuration.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);