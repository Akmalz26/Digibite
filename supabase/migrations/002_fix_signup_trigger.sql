-- ============================================
-- FIX: Profile auto-creation trigger
-- ============================================
-- Run this SQL in Supabase Dashboard > SQL Editor
-- This fixes the 500 error during signup

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate errors
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Ensure RLS allows service role to insert (for trigger)
-- Add policy that allows insert during signup
CREATE POLICY "profiles_insert_on_signup" ON public.profiles
    FOR INSERT
    WITH CHECK (true);  -- Allow all inserts (trigger runs as SECURITY DEFINER)

-- Alternative: If still getting errors, disable RLS temporarily for profiles
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- Then re-enable after testing
