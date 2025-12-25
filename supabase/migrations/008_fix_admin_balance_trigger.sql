-- Migration: Fix Admin Balance Trigger Logic
-- Run this in Supabase SQL Editor

-- Overwrite the existing function used by the trigger 'on_order_paid'
-- This ensures the trigger uses the new logic with service fee splitting

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
    -- Only process if status changes to 'paid' (or completed) and wasn't paid before
    IF (NEW.status = 'paid' OR NEW.status = 'completed') AND (OLD.status IS NULL OR OLD.status NOT IN ('paid', 'completed')) THEN
        
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
           -- This function was created in migration 005
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
