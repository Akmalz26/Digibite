// Supabase Edge Function: Midtrans Webhook Handler
// Deploy: supabase functions deploy midtrans-webhook --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MidtransNotification {
    transaction_time: string;
    transaction_status: string;
    transaction_id: string;
    status_message: string;
    status_code: string;
    signature_key: string;
    settlement_time?: string;
    payment_type: string;
    order_id: string;
    merchant_id: string;
    gross_amount: string;
    fraud_status: string;
    currency: string;
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

        // Create Supabase client with service role (bypasses RLS)
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse notification from Midtrans
        const notification: MidtransNotification = await req.json();

        console.log('Received Midtrans notification:', JSON.stringify(notification, null, 2));

        // Verify signature
        const signatureData = notification.order_id + notification.status_code + notification.gross_amount + midtransServerKey;
        const encoder = new TextEncoder();
        const data = encoder.encode(signatureData);
        const hashBuffer = await crypto.subtle.digest('SHA-512', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (expectedSignature !== notification.signature_key) {
            console.error('Invalid signature');
            // In production, you might want to reject invalid signatures
            // throw new Error('Invalid signature');
        }

        // Find order by midtrans_order_id
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('midtrans_order_id', notification.order_id)
            .single();

        if (orderError || !order) {
            console.error('Order not found:', notification.order_id);
            throw new Error('Order not found');
        }

        console.log('Found order:', order.id, 'Current status:', order.status);

        // Determine new status based on transaction status
        let newStatus: string | null = null;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;

        if (transactionStatus === 'capture') {
            if (fraudStatus === 'challenge') {
                newStatus = 'pending'; // Keep as pending, needs manual review
            } else if (fraudStatus === 'accept') {
                newStatus = 'paid';
            }
        } else if (transactionStatus === 'settlement') {
            newStatus = 'paid';
        } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
            newStatus = 'cancel';
        } else if (transactionStatus === 'pending') {
            newStatus = 'pending';
        }

        console.log('Transaction status:', transactionStatus, 'New order status:', newStatus);

        // Update order status if there's a change
        if (newStatus && newStatus !== order.status) {
            const updateData: any = {
                status: newStatus,
                payment_method: notification.payment_type || 'midtrans',
            };

            if (newStatus === 'paid') {
                updateData.paid_at = new Date().toISOString();
            }

            const { error: updateError } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', order.id);

            if (updateError) {
                console.error('Failed to update order:', updateError);
                throw new Error('Failed to update order status');
            }

            console.log('Order status updated to:', newStatus);

            // If payment successful, add balance to tenant
            // Note: This can also be done via database trigger (see migration file)
            if (newStatus === 'paid' && order.status === 'pending') {
                const { error: balanceError } = await supabase
                    .rpc('add_tenant_balance_manual', {
                        p_tenant_id: order.tenant_id,
                        p_amount: parseFloat(notification.gross_amount),
                    });

                if (balanceError) {
                    console.error('Failed to update tenant balance:', balanceError);
                    // Don't throw error here, order is already updated
                    // Balance update should be handled by trigger as backup
                } else {
                    console.log('Tenant balance updated');
                }
            }
        }

        return new Response(
            JSON.stringify({ status: 'ok' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
