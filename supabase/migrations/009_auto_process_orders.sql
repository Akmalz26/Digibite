-- Migration: Auto-process Paid Orders & Update Balance Trigger
-- Run this in Supabase SQL Editor

-- 1. Update balance trigger function to handle 'processing' status
-- Enables balance updates even if status skips 'paid' and goes straight to 'processing'
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
    -- Handle 'processing' as well, since we will auto-move to processing
    -- Check if status is Paid-like AND wasn't Paid-like before
    IF (NEW.status IN ('paid', 'completed', 'processing')) AND (OLD.status IS NULL OR OLD.status NOT IN ('paid', 'completed', 'processing')) THEN
        
        -- Get service fee (default to 0 if not set)
        v_service_fee := COALESCE(NEW.service_fee, 0);
        
        -- Calculate seller amount (total - service fee)
        v_seller_amount := NEW.total_amount - v_service_fee;

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

        -- Update paid_at timestamp if not set
        IF NEW.paid_at IS NULL THEN
            NEW.paid_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 2. Create trigger to auto-change 'paid' to 'processing'
-- This ensures 'paid' status is transient and immediately becomes 'processing'
CREATE OR REPLACE FUNCTION public.auto_advance_paid_to_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being set to 'paid', change it to 'processing' immediately
  IF NEW.status = 'paid' THEN
    NEW.status := 'processing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS on_paid_auto_advance ON public.orders;

CREATE TRIGGER on_paid_auto_advance
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_advance_paid_to_processing();
