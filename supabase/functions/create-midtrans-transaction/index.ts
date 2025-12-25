// Supabase Edge Function: Create Midtrans Transaction
// Deploy: supabase functions deploy create-midtrans-transaction --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateTransactionRequest {
    order_id: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY')!;
        const midtransIsProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080';

        // Create Supabase client with service role (bypasses RLS)
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        // Verify user
        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );
        if (authError || !user) {
            throw new Error('Unauthorized');
        }

        // Parse request body
        const { order_id }: CreateTransactionRequest = await req.json();

        // Get order with items
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
        *,
        order_items (
          *,
          products (name, price)
        ),
        profiles!orders_user_id_fkey (name, phone),
        tenants (name)
      `)
            .eq('id', order_id)
            .eq('user_id', user.id)
            .single();

        if (orderError || !order) {
            console.error('Order error:', orderError);
            throw new Error('Order not found');
        }

        if (order.status !== 'pending') {
            throw new Error('Order is not pending');
        }

        // Calculate total from order_items to ensure accuracy
        const calculatedTotal = order.order_items.reduce((sum: number, item: any) => {
            return sum + (item.price_at_time * item.quantity);
        }, 0);

        // Use the calculated total or the stored total (whichever is correct)
        const grossAmount = Math.round(order.total_amount || calculatedTotal);

        console.log('Order total_amount:', order.total_amount);
        console.log('Calculated total:', calculatedTotal);
        console.log('Gross amount for Midtrans:', grossAmount);

        // Midtrans requires order_id to be unique, use the midtrans_order_id
        const midtransOrderId = order.midtrans_order_id || `DIGIBITE-${order.id.substring(0, 8)}-${Date.now()}`;

        // Update order with midtrans_order_id if not set
        if (!order.midtrans_order_id) {
            await supabase
                .from('orders')
                .update({ midtrans_order_id: midtransOrderId })
                .eq('id', order_id);
        }

        // Build Midtrans transaction payload
        const midtransUrl = midtransIsProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        // Build item details with correct prices
        const itemDetails = order.order_items.map((item: any) => ({
            id: item.product_id,
            name: item.products?.name || 'Product',
            price: Math.round(item.price_at_time),
            quantity: item.quantity,
        }));

        // Verify item total matches gross amount
        const itemTotal = itemDetails.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        console.log('Item total:', itemTotal);

        // Adjust if there's a mismatch (add adjustment item if needed)
        if (itemTotal !== grossAmount) {
            const diff = grossAmount - itemTotal;
            if (diff > 0) {
                itemDetails.push({
                    id: 'SERVICE_FEE',
                    name: 'Biaya Layanan',
                    price: diff,
                    quantity: 1,
                });
            }
        }

        const transactionPayload = {
            transaction_details: {
                order_id: midtransOrderId,
                gross_amount: grossAmount,
            },
            customer_details: {
                first_name: order.profiles?.name || 'Customer',
                phone: order.profiles?.phone || '',
                email: user.email,
            },
            item_details: itemDetails,
            callbacks: {
                finish: `${frontendUrl}/user/history`,
            },
        };

        console.log('Midtrans payload:', JSON.stringify(transactionPayload, null, 2));

        // Create Midtrans transaction
        const midtransResponse = await fetch(midtransUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Basic ' + btoa(midtransServerKey + ':'),
            },
            body: JSON.stringify(transactionPayload),
        });

        const responseText = await midtransResponse.text();
        console.log('Midtrans response:', responseText);

        if (!midtransResponse.ok) {
            console.error('Midtrans error:', responseText);
            throw new Error('Failed to create Midtrans transaction: ' + responseText);
        }

        const midtransData = JSON.parse(responseText);

        // Update order with snap token
        await supabase
            .from('orders')
            .update({ snap_token: midtransData.token })
            .eq('id', order_id);

        return new Response(
            JSON.stringify({
                snap_token: midtransData.token,
                redirect_url: midtransData.redirect_url,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
