// Fix: Replace Deno-specific type reference with a manual declaration to support standard TypeScript tooling.
// This resolves "Cannot find name 'Deno'" and "Cannot find type definition file" errors.
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

// Follow this tutorial to get started with Supabase Edge Functions:
// https://supabase.com/docs/guides/functions

// Note: Ensure you have set the required environment variables in your Supabase project:
// `supabase secrets set BREVO_API_KEY YOUR_KEY_HERE`
// `supabase secrets set BREVO_TEMPLATE_ID YOUR_TEMPLATE_ID_HERE`
// `supabase secrets set SENDER_EMAIL your-verified-sender@example.com`
// `supabase secrets set SENDER_NAME "Your Store Name"`
// The `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in the function environment.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Brevo API endpoint for sending transactional emails
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

// The main Deno function that handles requests.
Deno.serve(async (req) => {
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('--- Order Confirmation Function Invoked ---');

  try {
    // 1. Improved body parsing to prevent "Unexpected end of JSON input" error.
    if (req.method !== 'POST') {
      throw new Error(`Invalid request method: ${req.method}. Must be POST.`);
    }

    const bodyText = await req.text();
    if (!bodyText) {
        console.error("Function received an empty request body.");
        throw new Error('Request body is required and cannot be empty.');
    }

    let payload;
    try {
        payload = JSON.parse(bodyText);
    } catch (e) {
        console.error("Failed to parse request body as JSON.", { bodyText });
        throw new Error('Invalid JSON format in request body.');
    }

    const { orderId } = payload;
    if (!orderId) {
      throw new Error('`orderId` is required in the JSON payload.');
    }
    console.log(`Processing orderId: ${orderId}`);

    // 2. Retrieve necessary environment variables from Supabase secrets.
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    const brevoTemplateId = Deno.env.get('BREVO_TEMPLATE_ID')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const senderEmail = Deno.env.get('SENDER_EMAIL')
    const senderName = Deno.env.get('SENDER_NAME') || 'AYExpress'

    if (!brevoApiKey || !brevoTemplateId || !supabaseUrl || !serviceRoleKey || !senderEmail) {
      console.error('Missing one or more required environment variables (BREVO_API_KEY, BREVO_TEMPLATE_ID, SENDER_EMAIL, etc).')
      throw new Error('Server configuration error. Please contact support.')
    }
    console.log(`Configuration loaded. Sending from: ${senderName} <${senderEmail}>. Using Template ID: ${brevoTemplateId}`);
    
    // 3. Create a Supabase admin client to securely fetch data.
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // 4. Fetch the full order details from the database.
    console.log('Fetching order details from Supabase...');
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
    console.log('Successfully fetched order data.');

    // 5. Validate and extract customer email.
    if (!orderData.profiles || !orderData.profiles.email) {
        // Fix: Corrected typo from `orderIdata` to `orderData`.
        console.error('CRITICAL: Customer email could not be found for this order.', { orderId: orderData.id, profileData: orderData.profiles });
        throw new Error(`Customer email not found for order ID ${orderId}. Cannot send confirmation.`);
    }
    
    const customerEmail = orderData.profiles.email;
    const customerName = orderData.shipping_address.first_name || 'Valued Customer';
    console.log(`Prepared recipient: ${customerEmail}`);

    // Calculate subtotal and tax to match template placeholders
    const subtotal = orderData.order_items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = orderData.total - subtotal;

    // 6. Format the data to match the Brevo email template's parameters.
    const params = {
      ORDERID: orderData.id.toString(),
      CUSTOMER_NAME: customerName,
      TOTAL: (orderData.total / 100).toFixed(2),
      ITEMS: orderData.order_items.map((item) => ({
        name: `${item.variants.products.title} - ${item.variants.title}`,
        quantity: item.quantity,
        price: (item.price / 100).toFixed(2),
      })),
      ORDER_DATE: new Date(orderData.created_at).toLocaleDateString(),
      SUBTOTAL: (subtotal / 100).toFixed(2),
      TAX: (tax / 100).toFixed(2),
    }

    // Sanitize and parse the template ID
    const numericTemplateId = parseInt(brevoTemplateId.replace(/[^0-9]/g, ''), 10);
    if (isNaN(numericTemplateId)) {
        throw new Error(`Invalid Brevo Template ID provided: ${brevoTemplateId}`);
    }

    // 7. Prepare the payload for the Brevo API.
    const brevoPayload = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: customerEmail, name: customerName }],
      templateId: numericTemplateId,
      params: params,
      headers: {
        'X-Mailin-Unsubscribe': 'https://ayexpress.netlify.app/profile'
      }
    }
    
    console.log('Sending request to Brevo API...');
    console.log('Payload details:', JSON.stringify({ 
        sender: brevoPayload.sender,
        to: brevoPayload.to.map(r => ({ email: '...hidden...', name: r.name })),
        templateId: brevoPayload.templateId 
    }));


    // 8. Send the request to the Brevo API to trigger the email.
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(brevoPayload),
    })
    
    // 9. Handle the response from the Brevo API.
    if (!response.ok) {
      const errorBody = await response.json()
      console.error('Brevo API Error:', errorBody)
      throw new Error(`Failed to send email via Brevo. Status: ${response.status}`)
    }
    
    console.log(`Successfully queued email for order ${orderId} to ${customerEmail}.`);
    
    // 10. Return a success response to the frontend.
    return new Response(JSON.stringify({ message: `Confirmation email queued for order ${orderId}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // 11. Catch and handle any errors.
    console.error('--- Function Error ---')
    console.error(error.message)
    console.error('----------------------')
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
