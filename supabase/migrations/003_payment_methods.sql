-- Migration: Add payment method and improve order flow
-- Run this in Supabase SQL Editor

-- Update orders table to support payment methods
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'midtrans' CHECK (payment_method IN ('midtrans', 'cash'));

-- Add completed status for cash payments confirmed by seller
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'paid', 'completed', 'cancel'));

-- Create function to add balance to tenant on successful payment
CREATE OR REPLACE FUNCTION public.add_tenant_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- When order status changes to 'paid' or 'completed', add balance to tenant
  IF (OLD.status = 'pending' AND (NEW.status = 'paid' OR NEW.status = 'completed')) THEN
    UPDATE public.tenants 
    SET balance = balance + NEW.total_amount,
        updated_at = NOW()
    WHERE id = NEW.tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for balance updates
DROP TRIGGER IF EXISTS on_order_paid ON public.orders;
CREATE TRIGGER on_order_paid
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.add_tenant_balance();

-- Update RLS policies for orders
DROP POLICY IF EXISTS "users_view_own_orders" ON public.orders;
CREATE POLICY "users_view_own_orders" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_orders" ON public.orders;
CREATE POLICY "users_insert_orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_orders" ON public.orders;
CREATE POLICY "users_update_own_orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Sellers can view orders for their tenant
DROP POLICY IF EXISTS "sellers_view_tenant_orders" ON public.orders;
CREATE POLICY "sellers_view_tenant_orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = auth.uid()
    )
  );

-- Sellers can update orders for their tenant
DROP POLICY IF EXISTS "sellers_update_tenant_orders" ON public.orders;
CREATE POLICY "sellers_update_tenant_orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE owner_id = auth.uid()
    )
  );

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Grant necessary permissions for realtime
GRANT SELECT ON public.orders TO authenticated;
GRANT UPDATE ON public.orders TO authenticated;
