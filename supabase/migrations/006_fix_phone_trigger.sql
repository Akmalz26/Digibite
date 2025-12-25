-- Migration: Fix Phone Number in Signup Trigger
-- Run this in Supabase SQL Editor

-- Drop existing function first
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved function that includes phone number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        NEW.raw_user_meta_data->>'phone'  -- Get phone from metadata
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
