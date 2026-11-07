-- Global scaling: add countries and multi-team support

-- ============================================================
-- 1. Create countries table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read countries" ON public.countries;
CREATE POLICY "Authenticated users can read countries" ON public.countries
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 2. Update teams table
-- ============================================================
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id),
  ADD COLUMN IF NOT EXISTS team_type text CHECK (team_type IN ('sales', 'dev', 'mixed'));

-- Update teams RLS so admins can read all, users read only their own team
DROP POLICY IF EXISTS "Authenticated users can read teams" ON public.teams;
DROP POLICY IF EXISTS "Users can read own team" ON public.teams;

CREATE POLICY "Users can read own team or admins all" ON public.teams
  FOR SELECT TO authenticated USING (
    id = public.get_my_team_id() OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- ============================================================
-- 3. Strict isolation on existing tables
-- ============================================================
-- NOTE: RLS on public.updates, public.resources, and public.profiles
-- already enforces team scoping via team_id = public.get_my_team_id()
-- from Stage C. No changes required here.
