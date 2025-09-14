// Fix: Updated the Deno types reference to a stable, versioned URL to resolve TypeScript errors related to the Deno runtime.
/// <reference types="https://esm.sh/v135/@deno/types@0.1.43/index.d.ts" />

// Follow this tutorial to get started with Supabase Edge Functions:
// https://supabase.com/docs/guides/functions

// Note: Ensure you have set the required environment variables in your Supabase project:
// `supabase secrets set BREVO_API_KEY YOUR_KEY_HERE`
// `supabase secrets set BREVO_TEMPLATE_ID YOUR_TEMPLATE_ID_HERE`
// The `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in the function environment.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Brevo API endpoint for sending transactional emails
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

// Interface defining the dynamic data your Brevo template expects.
// Customize this to match the variables you've set up in your Brevo template.
// For example, if your template uses `{{ ORDER_ID }}`, the key should be `ORDER_ID`.
// Brevo typically uses uppercase variables.
interface BrevoTemplateParams {
  ORDERID: string;
  CUSTOMER_NAME: string;
  TOTAL: string;
  ITEMS: Array<{ name: string; quantity: number; price: string }>;
  ORDER_DATE: string;
}

// The main Deno function that handles requests.
Deno.serve(async (req) => {
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extract orderId from the request body.
    const { orderId } = await req.json()
    if (!orderId) {
      throw new Error('Order ID is required.')
    }

    // 2. Retrieve necessary environment variables from Supabase secrets.
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    const brevoTemplateId = Deno.env.get('BREVO_TEMPLATE_ID')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!brevoApiKey || !brevoTemplateId || !supabaseUrl || !serviceRoleKey) {
      console.error('Missing one or more required environment variables.')
      throw new Error('Server configuration error. Please contact support.')
    }
    
    // 3. Create a Supabase admin client to securely fetch data.
    // We use the service_role_key for this to bypass RLS.
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // 4. Fetch the full order details from the database.
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        created_at,
        total,
        shipping_address,
        profiles ( email ),
        order_items (
          quantity,
          price,
          variants (
            title,
            products ( title )
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError
    if (!orderData) throw new Error(`Order with ID ${orderId} not found.`)

    // 5. Format the data to match the Brevo email template's parameters.
    const customerEmail = orderData.profiles.email
    const customerName = orderData.shipping_address.first_name || 'Valued Customer'
    
    const params: BrevoTemplateParams = {
      ORDERID: orderData.id.toString(),
      CUSTOMER_NAME: customerName,
      TOTAL: (orderData.total / 100).toFixed(2),
      ITEMS: orderData.order_items.map((item) => ({
        name: `${item.variants.products.title} - ${item.variants.title}`,
        quantity: item.quantity,
        price: (item.price / 100).toFixed(2),
      })),
      ORDER_DATE: new Date(orderData.created_at).toLocaleDateString(),
    }

    // 6. Prepare the payload for the Brevo API.
    const brevoPayload = {
      to: [{ email: customerEmail, name: customerName }],
      templateId: parseInt(brevoTemplateId, 10),
      params: params,
    }

    // 7. Send the request to the Brevo API to trigger the email.
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(brevoPayload),
    })
    
    // 8. Handle the response from the Brevo API.
    if (!response.ok) {
      const errorBody = await response.json()
      console.error('Brevo API Error:', errorBody)
      throw new Error('Failed to send email via Brevo.')
    }
    
    // 9. Return a success response to the frontend.
    return new Response(JSON.stringify({ message: `Confirmation email queued for order ${orderId}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // 10. Catch and handle any errors that occurred during the process.
    console.error('Function Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})