import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, OrderItemInsert, OrderUpdate } from '@/types/database';

export interface CartItem {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface CreateOrderParams {
    tenant_id: string;
    items: CartItem[];
    notes?: string;
    payment_method: 'midtrans' | 'cash';
    service_fee?: number;
}

/**
 * Check if user has pending order for the same tenant
 */
export async function getPendingOrder(tenantId: string): Promise<Order | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0];
}

/**
 * Create a new order with items
 */
export async function createOrder(params: CreateOrderParams): Promise<Order> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Calculate subtotal (items only)
    const subtotal = params.items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
    );

    // Total includes service fee for admin
    const serviceFee = params.service_fee || 0;
    const totalAmount = subtotal + serviceFee;

    // Generate unique Midtrans order ID
    const midtransOrderId = `DIGIBITE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: user.id,
            tenant_id: params.tenant_id,
            total_amount: totalAmount,
            service_fee: serviceFee,
            notes: params.notes,
            status: 'pending',
            payment_method: params.payment_method,
            midtrans_order_id: midtransOrderId,
        } as any)
        .select()
        .single();

    const order = orderData as Order | null;

    if (orderError || !order) throw orderError || new Error('Failed to create order');

    // Create order items
    const orderItems: OrderItemInsert[] = params.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_time: item.price,
        subtotal: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems as any);

    if (itemsError) {
        // Rollback: delete the order if items failed
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
    }

    return order as Order;
}

/**
 * Get Midtrans Snap token for payment
 */
export async function getSnapToken(orderId: string): Promise<{
    snap_token: string;
    redirect_url: string;
}> {
    const { data, error } = await supabase.functions.invoke('create-midtrans-transaction', {
        body: { order_id: orderId },
    });

    if (error) throw error;
    return data;
}

/**
 * Resume existing payment (get snap token from order)
 */
export async function resumePayment(orderId: string): Promise<{
    order: Order;
    snap_token: string | null;
}> {
    const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (error || !order) throw error || new Error('Order not found');

    // If order has snap_token, return it; otherwise get new one
    if ((order as any).snap_token) {
        return { order: order as Order, snap_token: (order as any).snap_token };
    }

    // Get new snap token
    const { snap_token } = await getSnapToken(orderId);
    return { order: order as Order, snap_token };
}

/**
 * Change payment method for pending order
 */
export async function changePaymentMethod(
    orderId: string,
    paymentMethod: 'midtrans' | 'cash'
): Promise<Order> {
    const { data, error } = await supabase
        .from('orders')
        .update({
            payment_method: paymentMethod,
            snap_token: null // Clear snap token when changing method
        } as OrderUpdate as unknown as never)
        .eq('id', orderId)
        .eq('status', 'pending')
        .select()
        .single();

    if (error) throw error;
    return data as Order;
}

/**
 * Create order and get Snap token in one call
 */
export async function checkoutOrder(params: CreateOrderParams): Promise<{
    order: Order;
    snap_token: string | null;
    redirect_url: string | null;
}> {
    // Create order
    const order = await createOrder(params);

    // If cash payment, no need for snap token
    if (params.payment_method === 'cash') {
        return { order, snap_token: null, redirect_url: null };
    }

    // Get Snap token for midtrans
    try {
        const { snap_token, redirect_url } = await getSnapToken(order.id);
        return { order, snap_token, redirect_url };
    } catch (error) {
        console.error('Failed to get snap token:', error);
        return { order, snap_token: null, redirect_url: null };
    }
}



/**
 * Get active orders (pending, paid, processing, ready)
 */
export async function getActiveOrders(): Promise<Order[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            tenants (name, image_url)
        `)
        .eq('user_id', user.id)
        .in('status', ['pending', 'paid', 'processing', 'ready'])
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to include tenant name in expected format if needed, 
    // but for now returning plain Order with joined data
    return (data || []).map((order: any) => ({
        ...order,
        tenant_name: order.tenants?.name
    })) as Order[];
}

/**
 * Get order history (completed, cancel)
 */
export async function getOrderHistory(): Promise<Order[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            tenants (name, image_url)
        `)
        .eq('user_id', user.id)
        .in('status', ['completed', 'cancel'])
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((order: any) => ({
        ...order,
        tenant_name: order.tenants?.name
    })) as Order[];
}

/**
 * Get order details with items
 */
export async function getOrderDetails(orderId: string): Promise<{
    order: Order;
    items: (OrderItem & { product_name: string; product_image: string })[];
}> {
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
      *,
      tenants (
        name, 
        image_url,
        profiles:owner_id (
            phone
        )
      )
    `)
        .eq('id', orderId)
        .single();


    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
      *,
      products (name, image_url)
    `)
        .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    return {
        order: order as Order,
        items: (items || []).map((item: any) => ({
            ...item,
            product_name: item.products?.name || 'Unknown Product',
            product_image: item.products?.image_url || '',
        })),
    };
}

/**
 * Cancel an order (only if pending)
 */
export async function cancelOrder(orderId: string): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .update({ status: 'cancel' } as unknown as never)
        .eq('id', orderId)
        .eq('status', 'pending');

    if (error) throw error;
}

/**
 * Subscribe to order status changes (realtime)
 */
export function subscribeToOrderStatus(
    orderId: string,
    callback: (order: Order) => void
) {
    const channel = supabase
        .channel(`order-${orderId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`,
            },
            (payload) => {
                callback(payload.new as Order);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Subscribe to seller's orders (realtime) - for new orders, updates, and deletions
 */
export async function subscribeToSellerOrders(
    callback: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', order: any) => void
): Promise<() => void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get seller's tenant
    const { data: tenantResult } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id);

    const tenants = tenantResult as { id: string }[] | null;
    if (!tenants || tenants.length === 0) {
        // Return empty unsubscribe function
        return () => { };
    }

    const tenantId = tenants[0].id;

    const channel = supabase
        .channel(`seller-orders-${tenantId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
                filter: `tenant_id=eq.${tenantId}`,
            },
            (payload) => {
                callback('INSERT', payload.new);
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `tenant_id=eq.${tenantId}`,
            },
            (payload) => {
                callback('UPDATE', payload.new);
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'orders',
                filter: `tenant_id=eq.${tenantId}`,
            },
            (payload) => {
                callback('DELETE', payload.old);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// ==================== SELLER FUNCTIONS ====================

/**
 * Get orders for seller's tenant
 */
export async function getSellerOrders(status?: string): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get seller's tenant
    const { data: tenantResult } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id);

    const tenants = tenantResult as { id: string }[] | null;

    if (!tenants || tenants.length === 0) return [];

    let query = supabase
        .from('orders')
        .select(`
      *,
      profiles!orders_user_id_fkey (name, phone),
      order_items (
        *,
        products (name, image_url)
      )
    `)
        .eq('tenant_id', tenants[0].id)
        .order('created_at', { ascending: false });

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((order: any) => ({
        ...order,
        user_name: order.profiles?.name || 'Unknown',
        user_phone: order.profiles?.phone || '-',
    }));
}

/**
 * Update order status (seller)
 * Balance update and paid_at is handled by database trigger
 */
export async function updateOrderStatus(
    orderId: string,
    status: 'pending' | 'paid' | 'processing' | 'completed' | 'cancel'
): Promise<void> {
    // Only send status update - trigger will handle paid_at and balance
    const { error } = await supabase
        .from('orders')
        .update({ status } as unknown as never)
        .eq('id', orderId);

    if (error) throw error;
    // Note: Balance update and paid_at are handled by database trigger (update_tenant_balance)
}

/**
 * Get seller order stats
 */
export async function getSellerOrderStats(): Promise<{
    pending: number;
    paid: number;
    completed: number;
    total_revenue: number;
}> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: tenantResult } = await supabase
        .from('tenants')
        .select('id, balance')
        .eq('owner_id', user.id);

    const tenant = tenantResult as { id: string; balance: number }[] | null;

    if (!tenant || tenant.length === 0) {
        return { pending: 0, paid: 0, completed: 0, total_revenue: 0 };
    }

    const tenantId = tenant[0].id;

    const { count: pending } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'pending');

    const { count: paid } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'paid');

    const { count: completed } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'completed');

    return {
        pending: pending || 0,
        paid: paid || 0,
        completed: completed || 0,
        total_revenue: tenant[0].balance || 0,
    };
}
