import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// The app will no longer crash if the keys are missing.
// Instead, API calls will fail, and we can show a UI message.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);