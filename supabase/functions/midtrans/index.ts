import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { method, url } = req
    const urlObj = new URL(url)
    const path = urlObj.pathname

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Midtrans configuration
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY')!
    const midtransClientKey = Deno.env.get('MIDTRANS_CLIENT_KEY')!
    const isProduction = Deno.env.get('NODE_ENV') === 'production'
    const midtransBaseUrl = isProduction 
      ? 'https://api.midtrans.com' 
      : 'https://api.sandbox.midtrans.com'

    console.log(`🔗 ${method} ${path}`)

    // Route: /create-token
    if (method === 'POST' && path.endsWith('/create-token')) {
      const body = await req.json()
      const { payment_id, amount, package_name, customer_name, customer_email, customer_phone } = body

      // Validate required fields
      if (!payment_id || !amount || !package_name || !customer_name || !customer_email) {
        return new Response(
          JSON.stringify({
            error: true,
            message: "Missing required fields",
            required: ["payment_id", "amount", "package_name", "customer_name", "customer_email"]
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      try {
        // Create Midtrans transaction
        const midtransPayload = {
          transaction_details: {
            order_id: payment_id,
            gross_amount: amount
          },
          item_details: [
            {
              id: payment_id,
              price: amount,
              quantity: 1,
              name: package_name
            }
          ],
          customer_details: {
            first_name: customer_name,
            email: customer_email,
            phone: customer_phone || ''
          },
          callbacks: {
            finish: `${urlObj.origin}/payment-success`,
            error: `${urlObj.origin}/payment-error`,
            pending: `${urlObj.origin}/payment-pending`
          }
        }

        // Call Midtrans API to create transaction
        const midtransResponse = await fetch(`${midtransBaseUrl}/v2/charge`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(midtransServerKey + ':')}`
          },
          body: JSON.stringify(midtransPayload)
        })

        if (!midtransResponse.ok) {
          const errorData = await midtransResponse.text()
          console.error('Midtrans API error:', errorData)
          throw new Error(`Midtrans API error: ${midtransResponse.status}`)
        }

        const midtransData = await midtransResponse.json()
        
        // Update payment record with Midtrans data
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            midtrans_order_id: midtransData.order_id,
            midtrans_token: midtransData.redirect_url,
            status: 'pending'
          })
          .eq('id', payment_id)

        if (updateError) {
          console.error('Error updating payment:', updateError)
        }

        return new Response(
          JSON.stringify({
            success: true,
            token: midtransData.redirect_url,
            order_id: midtransData.order_id,
            redirect_url: midtransData.redirect_url
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      } catch (error) {
        console.error('Error creating Midtrans transaction:', error)
        return new Response(
          JSON.stringify({
            error: true,
            message: `Failed to create transaction: ${error.message}`
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Route: /check-status
    if (method === 'POST' && path.endsWith('/check-status')) {
      const body = await req.json()
      const { order_id } = body

      if (!order_id) {
        return new Response(
          JSON.stringify({
            error: true,
            message: "Missing order_id"
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      try {
        // Check Midtrans transaction status
        const statusResponse = await fetch(`${midtransBaseUrl}/v2/${order_id}/status`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${btoa(midtransServerKey + ':')}`
          }
        })

        if (!statusResponse.ok) {
          throw new Error(`Midtrans status check failed: ${statusResponse.status}`)
        }

        const statusData = await statusResponse.json()
        
        // Update payment status in database
        let paymentStatus = 'pending'
        if (statusData.transaction_status === 'settlement' || statusData.transaction_status === 'capture') {
          paymentStatus = 'completed'
        } else if (statusData.transaction_status === 'deny' || statusData.transaction_status === 'expire') {
          paymentStatus = 'failed'
        }

        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: paymentStatus,
            midtrans_status: statusData.transaction_status,
            updated_at: new Date().toISOString()
          })
          .eq('midtrans_order_id', order_id)

        if (updateError) {
          console.error('Error updating payment status:', updateError)
        }

        return new Response(
          JSON.stringify({
            success: true,
            order_id: statusData.order_id,
            status: statusData.transaction_status,
            payment_status: paymentStatus,
            amount: statusData.gross_amount
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      } catch (error) {
        console.error('Error checking transaction status:', error)
        return new Response(
          JSON.stringify({
            error: true,
            message: `Failed to check status: ${error.message}`
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Route: /webhook (for Midtrans notifications)
    if (method === 'POST' && path.endsWith('/webhook')) {
      const body = await req.json()
      console.log('Webhook received:', body)

      try {
        const { order_id, transaction_status, gross_amount } = body

        // Verify webhook signature (you should implement this)
        // const signature = req.headers.get('x-signature-key')
        // if (!verifySignature(body, signature)) {
        //   throw new Error('Invalid signature')
        // }

        // Update payment status
        let paymentStatus = 'pending'
        if (transaction_status === 'settlement' || transaction_status === 'capture') {
          paymentStatus = 'completed'
        } else if (transaction_status === 'deny' || transaction_status === 'expire') {
          paymentStatus = 'failed'
        }

        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: paymentStatus,
            midtrans_status: transaction_status,
            updated_at: new Date().toISOString()
          })
          .eq('midtrans_order_id', order_id)

        if (updateError) {
          console.error('Error updating payment from webhook:', updateError)
          throw updateError
        }

        // If payment completed, grant package access
        if (paymentStatus === 'completed') {
          const { data: paymentData, error: paymentError } = await supabase
            .from('payments')
            .select('user_id, package_id')
            .eq('midtrans_order_id', order_id)
            .single()

          if (paymentError) {
            console.error('Error fetching payment data:', paymentError)
          } else if (paymentData) {
            // Check if user already has access
            const { data: existingAccess } = await supabase
              .from('user_package_access')
              .select('id')
              .eq('user_id', paymentData.user_id)
              .eq('package_id', paymentData.package_id)
              .single()

            if (!existingAccess) {
              // Grant package access
              const { error: accessError } = await supabase
                .from('user_package_access')
                .insert({
                  user_id: paymentData.user_id,
                  package_id: paymentData.package_id,
                  payment_id: paymentData.id,
                  is_active: true
                })

              if (accessError) {
                console.error('Error granting package access:', accessError)
              } else {
                console.log('Package access granted for user:', paymentData.user_id)
              }
            }
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Webhook processed' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      } catch (error) {
        console.error('Error processing webhook:', error)
        return new Response(
          JSON.stringify({
            error: true,
            message: `Webhook processing failed: ${error.message}`
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Default response for unknown routes
    return new Response(
      JSON.stringify({
        error: true,
        message: "Route not found",
        available_routes: [
          "POST /create-token",
          "POST /check-status", 
          "POST /webhook"
        ]
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        error: true,
        message: `Internal server error: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
