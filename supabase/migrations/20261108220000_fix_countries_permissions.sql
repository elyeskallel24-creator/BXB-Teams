-- Fix countries permissions: GRANT + RLS policies

-- 1. Table-level GRANTs (the actual cause of "permission denied")
GRANT SELECT, INSERT ON public.countries TO authenticated;

-- 2. SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read countries" ON public.countries;
CREATE POLICY "Authenticated users can read countries" ON public.countries
  FOR SELECT TO authenticated
  USING (true);

-- 3. INSERT policy (admin only)
DROP POLICY IF EXISTS "Admins can insert countries" ON public.countries;
CREATE POLICY "Admins can insert countries" ON public.countries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
