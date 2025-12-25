import { supabase } from '@/lib/supabase';
import type { Tenant } from '@/types/database';

// Simple types for insert/update
type TenantCreateData = {
    name: string;
    description?: string | null;
    image_url?: string | null;
    category?: string | null;
};

type TenantUpdateData = {
    name?: string;
    description?: string | null;
    image_url?: string | null;
    category?: string | null;
};

/**
 * Get all active tenants
 */
export async function getTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get tenant by ID
 */
export async function getTenantById(id: string): Promise<Tenant | null> {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

/**
 * Get tenants by category
 */
export async function getTenantsByCategory(category: string): Promise<Tenant[]> {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('rating', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Search tenants by name
 */
export async function searchTenants(query: string): Promise<Tenant[]> {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .order('rating', { ascending: false });

    if (error) throw error;
    return data || [];
}

// ==================== SELLER FUNCTIONS ====================

/**
 * Get current seller's tenant
 */
export async function getMyTenant(): Promise<Tenant | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', user.id);

    // Return null if no tenant found or error
    if (error) {
        console.error('Error fetching tenant:', error);
        return null;
    }

    // Return first tenant or null if array is empty
    return data && data.length > 0 ? data[0] : null;
}

/**
 * Create tenant for current seller
 */
export async function createTenant(tenantData: TenantCreateData): Promise<Tenant> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('tenants')
        .insert({
            owner_id: user.id,
            name: tenantData.name,
            description: tenantData.description || null,
            image_url: tenantData.image_url || null,
            category: tenantData.category || null,
        } as any)
        .select()
        .single();

    if (error) throw error;
    return data as Tenant;
}

/**
 * Update current seller's tenant
 */
export async function updateTenant(tenantId: string, updates: TenantUpdateData): Promise<Tenant> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('tenants')
        .update(updates as any)
        .eq('id', tenantId)
        .eq('owner_id', user.id)
        .select()
        .single();

    if (error) throw error;
    return data as Tenant;
}

/**
 * Get seller's revenue stats
 */
export async function getTenantRevenue(tenantId: string): Promise<{
    total_balance: number;
    total_orders: number;
    paid_orders: number;
    pending_orders: number;
}> {
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('balance')
        .eq('id', tenantId)
        .single();

    if (tenantError) throw tenantError;

    const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

    const { count: paidOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'paid');

    const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'pending');

    return {
        total_balance: tenant?.balance || 0,
        total_orders: totalOrders || 0,
        paid_orders: paidOrders || 0,
        pending_orders: pendingOrders || 0,
    };
}

// ==================== ADMIN FUNCTIONS ====================

/**
 * Get all tenants (admin only)
 */
export async function getAllTenants(): Promise<(Tenant & { owner_name: string })[]> {
    const { data, error } = await supabase
        .from('tenants')
        .select(`
      *,
      profiles!tenants_owner_id_fkey (name)
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((tenant: any) => ({
        ...tenant,
        owner_name: tenant.profiles?.name || 'Unknown',
    }));
}

/**
 * Update tenant status (admin only)
 */
export async function updateTenantStatus(tenantId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
        .from('tenants')
        .update({ is_active: isActive } as any)
        .eq('id', tenantId);

    if (error) throw error;
}
