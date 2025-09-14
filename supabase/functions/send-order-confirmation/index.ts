import { createClient } from 'npm:@supabase/supabase-js@2';
import { serve } from 'npm:std/server';

// Utility to format currency, matching the frontend.
const formatCurrency = (amountInCents, currency = 'USD') => {
  const amount = (amountInCents || 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Main function to handle requests.
serve(async (req) => {
  // 1. Set up CORS headers for preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // 2. Extract orderId from the request body.
    const { orderId } = await req.json();
    if (!orderId) {
      throw new Error('Order ID is required.');
    }

    // 3. Create a Supabase admin client to fetch data securely.
    // The `SUPABASE_SERVICE_ROLE_KEY` is automatically available in the Edge Function environment.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 4. Fetch comprehensive order details from the database.
    const { data: order, error } = await supabaseAdmin
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
            products ( title, image )
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    // 5. Get the email service API token from secrets.
    const postmarkToken = Deno.env.get('POSTMARK_SERVER_TOKEN');
    if (!postmarkToken) {
        throw new Error("Postmark server token is not set in Supabase secrets.");
    }
    
    const customerEmail = order.profiles.email;
    const shippingAddress = order.shipping_address;

    // 6. Construct the HTML for the email body.
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h1 style="color: #8a2be2;">Thank you for your order!</h1>
        <p>Hi there, we've received your order #${order.id} and are getting it ready for you.</p>
        
        <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Summary</h2>
        ${order.order_items.map(item => `
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <img src="${item.variants.products.image}" alt="${item.variants.products.title}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 15px; border-radius: 8px;" />
            <div style="flex-grow: 1;">
              <strong>${item.variants.products.title}</strong><br>
              <span style="color: #666;">${item.variants.title}</span><br>
              <span>Qty: ${item.quantity}</span>
            </div>
            <div>${formatCurrency(item.price * item.quantity)}</div>
          </div>
        `).join('')}
        
        <div style="text-align: right; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee;">
          <strong>Total: ${formatCurrency(order.total)}</strong>
        </div>

        <h2 style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 30px;">Shipping Address</h2>
        <p>
          ${shippingAddress.first_name} ${shippingAddress.last_name}<br>
          ${shippingAddress.address}<br>
          ${shippingAddress.city}, ${shippingAddress.zip_code}
        </p>

        <p style="margin-top: 30px; color: #888; font-size: 12px;">
          If you have any questions, please reply to this email.
        </p>
        <p style="text-align: center; margin-top: 20px;"><strong>AYExpress</strong></p>
      </div>
    `;

    // 7. Send the email using the Postmark API.
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': postmarkToken,
      },
      body: JSON.stringify({
        From: 'orders@yourdomain.com', // Replace with your verified sender email in Postmark
        To: customerEmail,
        Subject: `Your AYExpress Order Confirmation #${order.id}`,
        HtmlBody: emailHtml,
        MessageStream: 'outbound',
      }),
    });
    
    if (!response.ok) {
        const errorBody = await response.json();
        console.error("Postmark API error:", errorBody);
        throw new Error(`Failed to send email: ${errorBody.Message}`);
    }

    // 8. Return a success response to the frontend client.
    return new Response(JSON.stringify({ success: true, message: `Confirmation email sent to ${customerEmail}` }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });

  } catch (err) {
    // Handle any errors that occurred during the process.
    console.error('Error in send-order-confirmation function:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
});
