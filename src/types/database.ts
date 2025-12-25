export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    name: string
                    role: 'user' | 'seller' | 'admin'
                    phone: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    name: string
                    role?: 'user' | 'seller' | 'admin'
                    phone?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    role?: 'user' | 'seller' | 'admin'
                    phone?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            tenants: {
                Row: {
                    id: string
                    owner_id: string
                    name: string
                    description: string | null
                    image_url: string | null
                    category: string | null
                    rating: number
                    balance: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    owner_id: string
                    name: string
                    description?: string | null
                    image_url?: string | null
                    category?: string | null
                    rating?: number
                    balance?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    owner_id?: string
                    name?: string
                    description?: string | null
                    image_url?: string | null
                    category?: string | null
                    rating?: number
                    balance?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    description: string | null
                    price: number
                    image_url: string | null
                    category: string | null
                    stock: number
                    is_available: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    name: string
                    description?: string | null
                    price: number
                    image_url?: string | null
                    category?: string | null
                    stock?: number
                    is_available?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    description?: string | null
                    price?: number
                    image_url?: string | null
                    category?: string | null
                    stock?: number
                    is_available?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    user_id: string
                    tenant_id: string
                    midtrans_order_id: string | null
                    status: 'pending' | 'paid' | 'processing' | 'ready' | 'completed' | 'cancel'
                    payment_method: string | null
                    total_amount: number
                    service_fee: number
                    notes: string | null
                    snap_token: string | null
                    paid_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    tenant_id: string
                    midtrans_order_id?: string | null
                    status?: 'pending' | 'paid' | 'processing' | 'ready' | 'completed' | 'cancel'
                    payment_method?: string | null
                    total_amount: number
                    service_fee?: number
                    notes?: string | null
                    snap_token?: string | null
                    paid_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    tenant_id?: string
                    midtrans_order_id?: string | null
                    status?: 'pending' | 'paid' | 'processing' | 'ready' | 'completed' | 'cancel'
                    payment_method?: string | null
                    total_amount?: number
                    service_fee?: number
                    notes?: string | null
                    snap_token?: string | null
                    paid_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string
                    quantity: number
                    price_at_time: number
                    subtotal: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id: string
                    quantity: number
                    price_at_time: number
                    subtotal: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string
                    quantity?: number
                    price_at_time?: number
                    subtotal?: number
                    created_at?: string
                }
            }
        }
        Views: {
            orders_with_details: {
                Row: {
                    id: string
                    user_id: string
                    tenant_id: string
                    midtrans_order_id: string | null
                    status: 'pending' | 'paid' | 'processing' | 'ready' | 'completed' | 'cancel'
                    payment_method: string | null
                    total_amount: number
                    notes: string | null
                    snap_token: string | null
                    paid_at: string | null
                    created_at: string
                    updated_at: string
                    user_name: string
                    user_avatar: string | null
                    tenant_name: string
                    tenant_image: string | null
                }
            }
            products_with_tenant: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    description: string | null
                    price: number
                    image_url: string | null
                    category: string | null
                    stock: number
                    is_available: boolean
                    created_at: string
                    updated_at: string
                    tenant_name: string
                    tenant_image: string | null
                    tenant_active: boolean
                }
            }
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Tenant = Database['public']['Tables']['tenants']['Row']
export type TenantInsert = Database['public']['Tables']['tenants']['Insert']
export type TenantUpdate = Database['public']['Tables']['tenants']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update']

export type OrderWithDetails = Database['public']['Views']['orders_with_details']['Row']
export type ProductWithTenant = Database['public']['Views']['products_with_tenant']['Row']
