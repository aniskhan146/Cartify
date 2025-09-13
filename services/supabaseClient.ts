import { createClient } from '@supabase/supabase-js';

// Environment variables are sourced directly from the environment.
// For production, these are set in the Netlify UI.
// For local development, you'll need to set them in your shell or using a .env file if your setup supports it.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided. Set them in your environment variables (e.g., in the Netlify UI).");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);