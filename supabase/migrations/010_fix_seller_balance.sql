-- Migration: Fix Seller Balance Trigger (Complete Fix)
-- Run this in Supabase SQL Editor
-- This migration ensures seller balance is correctly updated for ALL payment methods

-- ==================== 1. Ensure admin_settings table exists ====================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial admin balance setting if not exists
INSERT INTO public.admin_settings (key, value) 
VALUES ('admin_balance', '{"balance": 0}')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists to avoid conflict
DROP POLICY IF EXISTS "admins_manage_settings" ON public.admin_settings;

-- Only admins can view/update settings
CREATE POLICY "admins_manage_settings" ON public.admin_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================== 2. Create function to get admin balance ====================
CREATE OR REPLACE FUNCTION public.get_admin_balance()
RETURNS DECIMAL AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  SELECT (value->>'balance')::DECIMAL INTO v_balance 
  FROM public.admin_settings 
  WHERE key = 'admin_balance';
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== 3. Create function to add to admin balance ====================
CREATE OR REPLACE FUNCTION public.add_admin_balance(p_amount DECIMAL)
RETURNS BOOLEAN AS $$
BEGIN
  -- First ensure the row exists
  INSERT INTO public.admin_settings (key, value)
  VALUES ('admin_balance', jsonb_build_object('balance', p_amount))
  ON CONFLICT (key) DO UPDATE
  SET value = jsonb_set(
    COALESCE(public.admin_settings.value, '{}'::jsonb), 
    '{balance}', 
    to_jsonb(COALESCE((public.admin_settings.value->>'balance')::DECIMAL, 0) + p_amount)
  ),
  updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== 4. Drop existing triggers to avoid conflicts ====================
DROP TRIGGER IF EXISTS on_order_paid ON public.orders;
DROP TRIGGER IF EXISTS on_paid_auto_advance ON public.orders;

-- ==================== 5. Create comprehensive balance update function ====================
CREATE OR REPLACE FUNCTION public.update_tenant_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    v_service_fee DECIMAL;
    v_seller_amount DECIMAL;
BEGIN
    -- CRITICAL: Only process balance update ONCE per order
    -- Conditions:
    -- 1. New status is a "paid-like" status (paid, completed, processing)
    -- 2. Old status was NOT a "paid-like" status (was pending or cancel)
    -- 3. paid_at was NULL (meaning balance hasn't been processed yet)
    
    IF (NEW.status IN ('paid', 'completed', 'processing')) 
       AND (OLD.status IS NULL OR OLD.status IN ('pending', 'cancel'))
       AND (OLD.paid_at IS NULL) THEN
        
        -- Get service fee (default to 0 if not set)
        v_service_fee := COALESCE(NEW.service_fee, 0);
        
        -- Calculate seller amount (total - service fee)
        v_seller_amount := NEW.total_amount - v_service_fee;

        -- Log for debugging (can be viewed in Supabase logs)
        RAISE NOTICE 'BALANCE UPDATE: tenant=%, seller_amount=%, service_fee=%', 
                     NEW.tenant_id, v_seller_amount, v_service_fee;

        -- Update tenant balance (seller gets amount minus service fee)
        UPDATE public.tenants
        SET 
            balance = balance + v_seller_amount,
            updated_at = NOW()
        WHERE id = NEW.tenant_id;
        
        -- Add service fee to admin balance
        IF v_service_fee > 0 THEN
           PERFORM public.add_admin_balance(v_service_fee);
        END IF;

        -- Set paid_at timestamp - THIS PREVENTS FUTURE DOUBLE PROCESSING
        NEW.paid_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$;

-- ==================== 6. Create trigger for UPDATE operations ====================
CREATE TRIGGER on_order_paid
    BEFORE UPDATE ON public.orders
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_tenant_balance();

-- ==================== 7. Create manual RPC function for fallback ====================
-- This can be called manually if trigger fails
CREATE OR REPLACE FUNCTION public.add_seller_balance_manual(
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_order RECORD;
    v_service_fee DECIMAL;
    v_seller_amount DECIMAL;
    v_already_processed BOOLEAN := FALSE;
BEGIN
    -- Get order details
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    
    -- Only process if order is in paid/completed/processing status
    IF v_order.status NOT IN ('paid', 'completed', 'processing') THEN
        RAISE EXCEPTION 'Order is not paid yet';
    END IF;
    
    -- Check if already processed (has paid_at set more than 5 seconds ago)
    -- This prevents double-processing
    IF v_order.paid_at IS NOT NULL AND v_order.paid_at < NOW() - INTERVAL '5 seconds' THEN
        RETURN FALSE; -- Already processed by trigger
    END IF;
    
    v_service_fee := COALESCE(v_order.service_fee, 0);
    v_seller_amount := v_order.total_amount - v_service_fee;
    
    -- Update tenant balance
    UPDATE public.tenants
    SET 
        balance = balance + v_seller_amount,
        updated_at = NOW()
    WHERE id = v_order.tenant_id;
    
    -- Add service fee to admin
    IF v_service_fee > 0 THEN
        PERFORM public.add_admin_balance(v_service_fee);
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== 8. Grant permissions ====================
GRANT SELECT ON public.admin_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_balance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_admin_balance(DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_seller_balance_manual(UUID) TO authenticated;

-- ==================== 9. Verify setup ====================
-- Run this to check if everything is set up correctly:
-- SELECT * FROM public.admin_settings WHERE key = 'admin_balance';
-- SELECT public.get_admin_balance();
