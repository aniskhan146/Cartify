import { createClient } from '@supabase/supabase-js';
import * as config from '../config';

// Prioritize environment variables for production, but fall back to config file for local development.
// FIX: Added a check for SUPABASE_DATABASE_URL as it is a common alternative provided by hosting services.
const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL || config.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || config.SUPABASE_ANON_KEY;

// Check if the keys are missing or are still the placeholder values.
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
  const errorMessage = "Supabase URL and Anon Key must be provided. Set them in your environment variables (for production) or in the `config.ts` file (for local development).";
  
  // Display a more user-friendly error on the page itself to guide the developer.
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family: sans-serif; padding: 2rem; text-align: center; background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 0.5rem; margin: 2rem auto; max-width: 800px;">
        <h1 style="font-size: 1.5rem; font-weight: bold;">Configuration Error</h1>
        <p style="margin-top: 1rem;">${errorMessage}</p>
        <p style="margin-top: 0.5rem; font-size: 0.875rem;">Please open the <code>config.ts</code> file, add your keys, and then refresh the page. Refer to the <code>README.md</code> file for more details.</p>
      </div>
    `;
  }
  
  // Also throw an error to the console.
  throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);