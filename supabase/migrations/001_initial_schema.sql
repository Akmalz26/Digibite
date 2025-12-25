-- ============================================
-- DIGIBITE SUPABASE DATABASE SCHEMA
-- ============================================
-- Sistem kantin online multi-merchant
-- dengan Supabase Auth dan Midtrans integration
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Menyimpan data tambahan user dari Supabase Auth
-- Role: 'user' (default), 'seller', 'admin'

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk query berdasarkan role
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk profiles
-- 1. Semua user authenticated bisa melihat profiles (untuk display nama)
CREATE POLICY "profiles_select_authenticated" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

-- 2. User hanya bisa update profile sendiri
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. Admin bisa update semua profiles
CREATE POLICY "profiles_admin_all" ON public.profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 2. TENANTS TABLE
-- ============================================
-- Setiap seller memiliki 1 tenant
-- Balance bertambah otomatis saat order paid

CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category TEXT,
    rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Satu seller hanya boleh punya 1 tenant
    CONSTRAINT unique_owner UNIQUE (owner_id)
);

-- Indexes
CREATE INDEX idx_tenants_owner ON public.tenants(owner_id);
CREATE INDEX idx_tenants_active ON public.tenants(is_active);
CREATE INDEX idx_tenants_category ON public.tenants(category);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk tenants
-- 1. Semua orang bisa lihat tenant yang aktif (untuk browsing)
CREATE POLICY "tenants_select_public" ON public.tenants
    FOR SELECT TO authenticated
    USING (is_active = true OR owner_id = auth.uid());

-- 2. Seller hanya bisa insert tenant miliknya sendiri
CREATE POLICY "tenants_insert_seller" ON public.tenants
    FOR INSERT TO authenticated
    WITH CHECK (
        owner_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'seller'
        )
    );

-- 3. Seller hanya bisa update tenant miliknya sendiri
CREATE POLICY "tenants_update_own" ON public.tenants
    FOR UPDATE TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- 4. Admin bisa akses semua tenants
CREATE POLICY "tenants_admin_all" ON public.tenants
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
-- Produk dimiliki oleh tenant tertentu

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    category TEXT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE INDEX idx_products_available ON public.products(is_available);
CREATE INDEX idx_products_category ON public.products(category);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk products
-- 1. Semua orang bisa lihat produk yang available
CREATE POLICY "products_select_public" ON public.products
    FOR SELECT TO authenticated
    USING (
        is_available = true OR
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_id AND t.owner_id = auth.uid()
        )
    );

-- 2. Seller hanya bisa insert produk untuk tenant miliknya
CREATE POLICY "products_insert_seller" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_id AND t.owner_id = auth.uid()
        )
    );

-- 3. Seller hanya bisa update produk tenant miliknya
CREATE POLICY "products_update_seller" ON public.products
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_id AND t.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_id AND t.owner_id = auth.uid()
        )
    );

-- 4. Seller bisa delete produk tenant miliknya
CREATE POLICY "products_delete_seller" ON public.products
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_id AND t.owner_id = auth.uid()
        )
    );

-- 5. Admin bisa akses semua products
CREATE POLICY "products_admin_all" ON public.products
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 4. ORDERS TABLE
-- ============================================
-- Satu order hanya berisi produk dari satu tenant
-- Status: pending, paid, cancel

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    midtrans_order_id TEXT UNIQUE, -- Untuk tracking di Midtrans
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancel')),
    payment_method TEXT,
    total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount >= 0),
    notes TEXT,
    snap_token TEXT, -- Midtrans Snap token
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_tenant ON public.orders(tenant_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_midtrans ON public.orders(midtrans_order_id);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk orders
-- 1. User hanya bisa lihat order miliknya sendiri
CREATE POLICY "orders_select_user" ON public.orders
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 2. Seller bisa lihat order untuk tenant miliknya
CREATE POLICY "orders_select_seller" ON public.orders
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_id AND t.owner_id = auth.uid()
        )
    );

-- 3. User bisa insert order
CREATE POLICY "orders_insert_user" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'user'
        )
    );

-- 4. User bisa update order miliknya (untuk cancel)
CREATE POLICY "orders_update_user" ON public.orders
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 5. Seller bisa update order tenant miliknya (untuk status)
CREATE POLICY "orders_update_seller" ON public.orders
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_id AND t.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = tenant_id AND t.owner_id = auth.uid()
        )
    );

-- 6. Admin bisa akses semua orders
CREATE POLICY "orders_admin_all" ON public.orders
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 5. ORDER_ITEMS TABLE
-- ============================================
-- Detail item dalam sebuah order

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(12,2) NOT NULL CHECK (price_at_time >= 0),
    subtotal DECIMAL(15,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk order_items
-- 1. User bisa lihat order items dari order miliknya
CREATE POLICY "order_items_select_user" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND o.user_id = auth.uid()
        )
    );

-- 2. Seller bisa lihat order items dari tenant miliknya
CREATE POLICY "order_items_select_seller" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.tenants t ON t.id = o.tenant_id
            WHERE o.id = order_id AND t.owner_id = auth.uid()
        )
    );

-- 3. User bisa insert order items untuk order miliknya
CREATE POLICY "order_items_insert_user" ON public.order_items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND o.user_id = auth.uid()
        )
    );

-- 4. Admin bisa akses semua order_items
CREATE POLICY "order_items_admin_all" ON public.order_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 6. FUNCTIONS
-- ============================================

-- Function untuk auto create profile saat user register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$;

-- Trigger untuk auto create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function untuk update tenant balance saat order paid
CREATE OR REPLACE FUNCTION public.update_tenant_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Hanya proses jika status berubah menjadi 'paid'
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        UPDATE public.tenants
        SET 
            balance = balance + NEW.total_amount,
            updated_at = NOW()
        WHERE id = NEW.tenant_id;
        
        -- Update paid_at timestamp
        NEW.paid_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger untuk auto update saldo tenant
CREATE TRIGGER on_order_paid
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_tenant_balance();

-- Function untuk generate midtrans_order_id
CREATE OR REPLACE FUNCTION public.generate_midtrans_order_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NEW.midtrans_order_id IS NULL THEN
        NEW.midtrans_order_id = 'DIGIBITE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger untuk auto generate midtrans_order_id
CREATE TRIGGER on_order_created
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.generate_midtrans_order_id();

-- Function untuk update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Triggers untuk auto update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 7. HELPER VIEWS (Optional)
-- ============================================

-- View untuk order dengan detail
CREATE OR REPLACE VIEW public.orders_with_details AS
SELECT 
    o.*,
    p.name AS user_name,
    p.avatar_url AS user_avatar,
    t.name AS tenant_name,
    t.image_url AS tenant_image
FROM public.orders o
JOIN public.profiles p ON p.id = o.user_id
JOIN public.tenants t ON t.id = o.tenant_id;

-- View untuk product dengan tenant info
CREATE OR REPLACE VIEW public.products_with_tenant AS
SELECT 
    pr.*,
    t.name AS tenant_name,
    t.image_url AS tenant_image,
    t.is_active AS tenant_active
FROM public.products pr
JOIN public.tenants t ON t.id = pr.tenant_id;
