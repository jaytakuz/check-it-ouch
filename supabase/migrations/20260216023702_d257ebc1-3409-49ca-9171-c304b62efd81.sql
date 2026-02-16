-- Fix: Change public profile RLS policy from RESTRICTIVE to PERMISSIVE
-- Restrictive policies require ALL to pass; we need ANY to pass (own profile OR public)
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Anyone can view public profiles"
  ON public.profiles FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
