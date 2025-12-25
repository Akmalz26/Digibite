import { supabase } from '@/lib/supabase';
import type { Product, ProductInsert, ProductUpdate, ProductWithTenant } from '@/types/database';

/**
 * Get all available products
 */
export async function getProducts(): Promise<Product[]> {
    // Try view first, fallback to regular table
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
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
 * Get products by tenant
 */
export async function getProductsByTenant(tenantId: string): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_available', true)
        .order('name');

    if (error) throw error;
    return data || [];
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string): Promise<ProductWithTenant[]> {
    const { data, error } = await supabase
        .from('products_with_tenant')
        .select('*')
        .eq('is_available', true)
        .eq('tenant_active', true)
        .eq('category', category)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Search products
 */
export async function searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

// ==================== SELLER FUNCTIONS ====================

/**
 * Get seller's products
 */
export async function getMyProducts(): Promise<Product[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get seller's tenant first
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!tenant) return [];

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Create product
 */
export async function createProduct(product: Omit<ProductInsert, 'tenant_id'>): Promise<Product> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get seller's tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id);

    if (!tenant || tenant.length === 0) throw new Error('Tenant not found');

    const { data, error } = await supabase
        .from('products')
        .insert({
            ...product,
            tenant_id: tenant[0].id,
        } as any)
        .select()
        .single();

    if (error) throw error;
    return data as Product;
}

/**
 * Update product
 */
export async function updateProduct(productId: string, updates: ProductUpdate): Promise<Product> {
    const { data, error } = await supabase
        .from('products')
        .update(updates as any)
        .eq('id', productId)
        .select()
        .single();

    if (error) throw error;
    return data as Product;
}

/**
 * Delete product
 */
export async function deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) throw error;
}

/**
 * Update product stock
 */
export async function updateStock(productId: string, stock: number): Promise<void> {
    const { error } = await supabase
        .from('products')
        .update({ stock } as any)
        .eq('id', productId);

    if (error) throw error;
}

/**
 * Toggle product availability
 */
export async function toggleProductAvailability(productId: string, isAvailable: boolean): Promise<void> {
    const { error } = await supabase
        .from('products')
        .update({ is_available: isAvailable } as any)
        .eq('id', productId);

    if (error) throw error;
}

// ==================== ADMIN FUNCTIONS ====================

/**
 * Get all products (admin only)
 */
export async function getAllProducts(): Promise<ProductWithTenant[]> {
    const { data, error } = await supabase
        .from('products_with_tenant')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}
