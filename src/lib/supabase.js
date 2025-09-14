import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_DATABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabase;

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    "Supabase URL or Anon Key is not set. The application will not be able to connect to the database. Please add VITE_SUPABASE_DATABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables."
  );

  const errorResponse = { data: null, error: { message: 'Supabase is not configured.' } };
  
  // This is the mock query builder that allows chaining.
  const mockQueryBuilder = {
    select: () => Promise.resolve(errorResponse),
    insert: () => Promise.resolve(errorResponse),
    update: () => Promise.resolve(errorResponse),
    delete: () => Promise.resolve(errorResponse),
    eq: () => mockQueryBuilder,
    in: () => mockQueryBuilder,
    order: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    single: () => Promise.resolve(errorResponse),
  };

  supabase = {
    from: () => mockQueryBuilder,
    auth: {
      onAuthStateChange: (_callback) => {
        // Run callback async to mimic real behavior and avoid issues with React render cycles
        setTimeout(() => _callback('INITIAL_SESSION', null), 0);
        return {
          data: { subscription: { unsubscribe: () => {} } },
        };
      },
      signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase is not configured.' } }),
      signUp: () => Promise.resolve({ error: { message: 'Supabase is not configured.' } }),
      signOut: () => Promise.resolve({ error: null }),
    },
  };
}

export { supabase };