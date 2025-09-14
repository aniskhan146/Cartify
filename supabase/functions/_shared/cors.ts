// This file contains the CORS headers for the Supabase Edge Functions.
// It's a standard practice to allow your frontend application to communicate
// with your functions.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}