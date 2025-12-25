-- Migration: Add withdrawals and phone requirement
-- Run this in Supabase SQL Editor

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 10000),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  notes TEXT,
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own withdrawals
CREATE POLICY "sellers_view_own_withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = auth.uid()
    )
  );

-- Sellers can insert withdrawals for their tenant
CREATE POLICY "sellers_insert_withdrawals" ON public.withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = auth.uid()
    )
  );

-- Admins can view all withdrawals
CREATE POLICY "admins_view_all_withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update withdrawals
CREATE POLICY "admins_update_withdrawals" ON public.withdrawals
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to process withdrawal approval
CREATE OR REPLACE FUNCTION public.approve_withdrawal(
  p_withdrawal_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_withdrawal RECORD;
  v_tenant_balance DECIMAL;
BEGIN
  -- Get withdrawal details
  SELECT * INTO v_withdrawal FROM public.withdrawals WHERE id = p_withdrawal_id;
  
  IF v_withdrawal IS NULL THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;
  
  IF v_withdrawal.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal already processed';
  END IF;
  
  -- Check tenant balance
  SELECT balance INTO v_tenant_balance FROM public.tenants WHERE id = v_withdrawal.tenant_id;
  
  IF v_tenant_balance < v_withdrawal.amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Deduct balance from tenant
  UPDATE public.tenants
  SET balance = balance - v_withdrawal.amount,
      updated_at = NOW()
  WHERE id = v_withdrawal.tenant_id;
  
  -- Update withdrawal status
  UPDATE public.withdrawals
  SET status = 'approved',
      admin_notes = p_admin_notes,
      processed_by = auth.uid(),
      processed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_withdrawal_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject withdrawal
CREATE OR REPLACE FUNCTION public.reject_withdrawal(
  p_withdrawal_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.withdrawals
  SET status = 'rejected',
      admin_notes = p_admin_notes,
      processed_by = auth.uid(),
      processed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_withdrawal_id AND status = 'pending';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add order status for delivery tracking
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'paid', 'processing', 'ready', 'delivered', 'completed', 'cancel'));

-- Enable realtime for withdrawals
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
