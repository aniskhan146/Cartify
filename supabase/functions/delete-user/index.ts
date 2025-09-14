// Add Deno types for compatibility
// deno-lint-ignore-file no-explicit-any
declare const Deno: any;

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // 1. Get the calling user from their JWT
    const authHeader = req.headers.get('Authorization')!
    const { data: { user: callingUser }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !callingUser) throw new Error("Authentication failed.")

    // 2. Check if the calling user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', callingUser.id)
        .single()
    if (profileError) throw profileError;
    if (profile.role !== 'admin') throw new Error("Permission denied: User is not an admin.")

    // 3. Get the target user ID from the request body
    const { userId: targetUserId } = await req.json()
    if (!targetUserId) throw new Error("`userId` is required in the request body.")
    if (targetUserId === callingUser.id) throw new Error("Admins cannot delete their own account.")


    // 4. Use the admin client to delete the target user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ message: `User ${targetUserId} deleted successfully.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
