-- STAGE C: Scope all SELECT policies to the user's team
-- Prevents users from one team reading data from another team.

-- 1. allowed_user_ids
DROP POLICY IF EXISTS "Authenticated users can read allowed_user_ids" ON public.allowed_user_ids;
CREATE POLICY "Authenticated users can read allowed_user_ids" ON public.allowed_user_ids
  FOR SELECT TO authenticated USING (team_id = public.get_my_team_id());

-- 2. profiles
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (team_id = public.get_my_team_id());

-- 3. resources
DROP POLICY IF EXISTS "Authenticated users can read resources" ON public.resources;
CREATE POLICY "Authenticated users can read resources" ON public.resources
  FOR SELECT TO authenticated USING (team_id = public.get_my_team_id());

-- 4. teams
DROP POLICY IF EXISTS "Authenticated users can read teams" ON public.teams;
CREATE POLICY "Authenticated users can read teams" ON public.teams
  FOR SELECT TO authenticated USING (id = public.get_my_team_id());

-- 5. updates
DROP POLICY IF EXISTS "Authenticated users can read updates" ON public.updates;
CREATE POLICY "Authenticated users can read updates" ON public.updates
  FOR SELECT TO authenticated USING (team_id = public.get_my_team_id());
