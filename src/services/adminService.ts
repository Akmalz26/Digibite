import { supabase } from '@/lib/supabase';
import type { Profile, Order, Tenant, Product } from '@/types/database';

// ==================== USER MANAGEMENT ====================

/**
 * Get all users (profiles) - admin only
 */
export async function getAllUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: 'user' | 'seller' | 'admin'): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

    if (error) throw error;
}

/**
 * Delete user (cascades to profile)
 */
export async function deleteUser(userId: string): Promise<void> {
    // Note: This requires admin privileges in Supabase
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
}

// ==================== ORDER MANAGEMENT ====================

/**
 * Get all orders - admin only
 */
export async function getAllOrders(): Promise<(Order & { user_name: string; tenant_name: string })[]> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      profiles!orders_user_id_fkey (name),
      tenants (name)
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(order => ({
        ...order,
        user_name: (order.profiles as any)?.name || 'Unknown',
        tenant_name: (order.tenants as any)?.name || 'Unknown',
    }));
}

/**
 * Update order status - admin only
 */
export async function updateOrderStatus(orderId: string, status: 'pending' | 'paid' | 'cancel'): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) throw error;
}

// ==================== TENANT MANAGEMENT ====================

/**
 * Get all tenants with owner info - admin only
 */
export async function getAdminTenants(): Promise<(Tenant & { owner_name: string })[]> {
    const { data, error } = await supabase
        .from('tenants')
        .select(`
      *,
      profiles!tenants_owner_id_fkey (name)
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(tenant => ({
        ...tenant,
        owner_name: (tenant.profiles as any)?.name || 'Unknown',
    }));
}

/**
 * Toggle tenant active status
 */
export async function toggleTenantStatus(tenantId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
        .from('tenants')
        .update({ is_active: isActive })
        .eq('id', tenantId);

    if (error) throw error;
}

// ==================== PRODUCT MANAGEMENT ====================

/**
 * Get all products - admin only
 */
export async function getAdminProducts(): Promise<(Product & { tenant_name: string })[]> {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      tenants (name)
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(product => ({
        ...product,
        tenant_name: (product.tenants as any)?.name || 'Unknown',
    }));
}

// ==================== STATISTICS ====================

/**
 * Get dashboard statistics - admin only
 */
export async function getAdminStats(): Promise<{
    totalUsers: number;
    totalSellers: number;
    totalTenants: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    paidOrders: number;
}> {
    // Get users count
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');

    // Get sellers count
    const { count: totalSellers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller');

    // Get tenants count
    const { count: totalTenants } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true });

    // Get products count
    const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    // Get orders count
    const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

    // Get pending orders count
    const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    // Get paid/completed orders count
    const { count: paidOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['paid', 'completed']);

    // Get total revenue (paid + completed)
    const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .in('status', ['paid', 'completed']);

    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

    return {
        totalUsers: totalUsers || 0,
        totalSellers: totalSellers || 0,
        totalTenants: totalTenants || 0,
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        pendingOrders: pendingOrders || 0,
        paidOrders: paidOrders || 0,
    };
}

// ==================== SELLER ORDERS ====================

/**
 * Get orders for seller's tenant
 */
export async function getSellerOrders(): Promise<(Order & { user_name: string })[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get seller's tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!tenant) return [];

    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      profiles!orders_user_id_fkey (name)
    `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(order => ({
        ...order,
        user_name: (order.profiles as any)?.name || 'Unknown',
    }));
}

/**
 * Get seller revenue stats
 */
export async function getSellerStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    paidOrders: number;
    totalRevenue: number;
    balance: number;
}> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get seller's tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, balance')
        .eq('owner_id', user.id)
        .single();

    if (!tenant) {
        return {
            totalOrders: 0,
            pendingOrders: 0,
            paidOrders: 0,
            totalRevenue: 0,
            balance: 0,
        };
    }

    const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id);

    const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'pending');

    const { count: paidOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'paid');

    const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('tenant_id', tenant.id)
        .eq('status', 'paid');

    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

    return {
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        paidOrders: paidOrders || 0,
        totalRevenue,
        balance: tenant.balance,
    };
}

// ==================== ADMIN BALANCE & SERVICE FEE ====================

/**
 * Get admin balance from admin_settings
 * Falls back to calculating from orders if RPC fails
 */
export async function getAdminBalance(): Promise<number> {
    try {
        // Try RPC first
        const { data, error } = await supabase.rpc('get_admin_balance' as any);
        if (!error && data !== null) {
            return data || 0;
        }
    } catch (e) {
        console.log('RPC get_admin_balance not available, trying fallback');
    }

    // Fallback 1: Try to query admin_settings directly
    try {
        const { data: settingsData } = await supabase
            .from('admin_settings' as any)
            .select('value')
            .eq('key', 'admin_balance')
            .single();

        if (settingsData && (settingsData as any)?.value?.balance !== undefined) {
            return Number((settingsData as any).value.balance) || 0;
        }
    } catch (e) {
        console.log('admin_settings table not available, using service fee sum');
    }

    // Fallback 2: Calculate from service_fee in orders
    const { data: ordersData } = await supabase
        .from('orders')
        .select('service_fee')
        .in('status', ['paid', 'completed', 'processing']);

    if (ordersData) {
        return (ordersData as any[]).reduce((sum: number, order: any) => sum + (Number(order.service_fee) || 0), 0);
    }

    return 0;
}

/**
 * Get total service fee collected
 */
export async function getTotalServiceFee(): Promise<number> {
    const { data, error } = await supabase
        .from('orders')
        .select('service_fee')
        .in('status', ['paid', 'completed']);

    if (error) {
        console.error('Error getting service fees:', error);
        return 0;
    }

    return data?.reduce((sum, order) => sum + (order.service_fee || 0), 0) || 0;
}

/**
 * Admin withdraw balance
 */
export async function adminWithdraw(amount: number, notes?: string): Promise<void> {
    const { error } = await supabase.rpc('admin_withdraw', {
        p_amount: amount,
        p_notes: notes || null
    });

    if (error) throw error;
}

