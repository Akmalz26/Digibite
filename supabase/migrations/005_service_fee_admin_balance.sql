-- Migration: Add Service Fee to Admin Balance
-- Run this in Supabase SQL Editor

-- ==================== 1. Add service_fee column to orders ====================
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS service_fee DECIMAL(12,2) DEFAULT 0;

-- ==================== 2. Create admin_settings table for admin balance ====================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial admin balance setting
INSERT INTO public.admin_settings (key, value) 
VALUES ('admin_balance', '{"balance": 0}')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view/update settings
CREATE POLICY "admins_manage_settings" ON public.admin_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================== 3. Create function to get admin balance ====================
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

-- ==================== 4. Create function to add to admin balance ====================
CREATE OR REPLACE FUNCTION public.add_admin_balance(p_amount DECIMAL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.admin_settings 
  SET value = jsonb_set(
    COALESCE(value, '{}'::jsonb), 
    '{balance}', 
    to_jsonb(COALESCE((value->>'balance')::DECIMAL, 0) + p_amount)
  ),
  updated_at = NOW()
  WHERE key = 'admin_balance';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== 5. Update the balance trigger to split service fee ====================
CREATE OR REPLACE FUNCTION public.add_tenant_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_service_fee DECIMAL;
  v_seller_amount DECIMAL;
BEGIN
  -- When order status changes to 'paid' or 'completed', process balance
  IF (OLD.status = 'pending' AND (NEW.status = 'paid' OR NEW.status = 'completed')) THEN
    -- Get service fee (default to 0 if not set)
    v_service_fee := COALESCE(NEW.service_fee, 0);
    
    -- Calculate seller amount (total - service fee)
    v_seller_amount := NEW.total_amount - v_service_fee;
    
    -- Add balance to tenant (excluding service fee)
    UPDATE public.tenants 
    SET balance = balance + v_seller_amount,
        updated_at = NOW()
    WHERE id = NEW.tenant_id;
    
    -- Add service fee to admin balance
    IF v_service_fee > 0 THEN
      PERFORM public.add_admin_balance(v_service_fee);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== 6. Create function for admin to withdraw balance ====================
CREATE OR REPLACE FUNCTION public.admin_withdraw(
  p_amount DECIMAL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance DECIMAL;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admin can withdraw';
  END IF;
  
  -- Get current balance
  v_current_balance := public.get_admin_balance();
  
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient admin balance';
  END IF;
  
  -- Deduct balance
  UPDATE public.admin_settings 
  SET value = jsonb_set(
    value, 
    '{balance}', 
    to_jsonb(v_current_balance - p_amount)
  ),
  updated_at = NOW()
  WHERE key = 'admin_balance';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== 7. Grant permissions ====================
GRANT SELECT ON public.admin_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_balance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_admin_balance(DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_withdraw(DECIMAL, TEXT) TO authenticated;
