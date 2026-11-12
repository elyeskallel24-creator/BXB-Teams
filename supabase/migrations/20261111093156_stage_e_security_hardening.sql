-- STAGE E: RLS hardening
-- Fixes 6 real security issues found in static RLS audit.
-- Also fixes admin cross-team profile reads (CommandCenter was broken).

-- ============================================================
-- 1. profiles: column-level grants + points protection
--    + admin cross-team read (needed for CommandCenter)
-- ============================================================
-- Revoke table-level UPDATE, re-grant only user-editable columns.
-- Points, role, team_id, user_id_code are now unreachable by users.
-- The award_points RPC uses SECURITY DEFINER, so admin point awards
-- still work through the function boundary.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (username, avatar_url) ON public.profiles TO authenticated;

-- Helper to safely check admin status without RLS recursion on profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Admins must see all profiles (needed for CommandCenter, TeamManagement).
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
CREATE POLICY "Users read own team, admins read all" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    team_id = public.get_my_team_id()
    OR public.is_admin()
  );

-- ============================================================
-- 2. notifications: insert restricted to self or admin
-- ============================================================
DROP POLICY IF EXISTS "Any authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Insert own or admin notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_admin()
  );

-- ============================================================
-- 3. deals: constrain team_id on insert/update
-- ============================================================
DROP POLICY IF EXISTS "Own insert deals" ON public.deals;
CREATE POLICY "Own insert deals" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (team_id IS NULL OR team_id = public.get_my_team_id())
  );

DROP POLICY IF EXISTS "Own update deals" ON public.deals;
CREATE POLICY "Own update deals" ON public.deals
  FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    (team_id IS NULL OR team_id = public.get_my_team_id())
    OR public.is_admin()
  );

-- ============================================================
-- 4. proposals: constrain assigned_to to same team
-- ============================================================
DROP POLICY IF EXISTS "Own insert proposals" ON public.proposals;
CREATE POLICY "Own insert proposals" ON public.proposals
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      assigned_to IS NULL
      OR assigned_to IN (SELECT id FROM public.profiles WHERE team_id = public.get_my_team_id())
      OR public.is_admin()
    )
  );

-- ============================================================
-- 5. tasks / meetings / technical_handovers: constrain assigned_to
-- ============================================================
DROP POLICY IF EXISTS "Own insert tasks" ON public.tasks;
CREATE POLICY "Own insert tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      assigned_to IN (SELECT id FROM public.profiles WHERE team_id = public.get_my_team_id())
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Own insert meetings" ON public.meetings;
CREATE POLICY "Own insert meetings" ON public.meetings
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      assigned_to IN (SELECT id FROM public.profiles WHERE team_id = public.get_my_team_id())
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Own insert handovers" ON public.technical_handovers;
CREATE POLICY "Own insert handovers" ON public.technical_handovers
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      assigned_to IS NULL
      OR assigned_to IN (SELECT id FROM public.profiles WHERE team_id = public.get_my_team_id())
      OR public.is_admin()
    )
  );

-- ============================================================
-- 6. businesses / leads: created_by = auth.uid() on insert
-- ============================================================
DROP POLICY IF EXISTS "Team insert businesses" ON public.businesses;
CREATE POLICY "Team insert businesses" ON public.businesses
  FOR INSERT TO authenticated
  WITH CHECK (
    team_id = public.get_my_team_id()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Team insert leads" ON public.leads;
CREATE POLICY "Team insert leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (
    team_id = public.get_my_team_id()
    AND created_by = auth.uid()
  );

-- ============================================================
-- 7. Defense in depth: revoke over-broad grants
-- ============================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;

-- ============================================================
-- 8. Backfill deals.team_id from assignee's team
--    (Deals.tsx never set team_id, so CommandCenter team metrics
--     were always 0 for won deals)
-- ============================================================
UPDATE public.deals d
SET team_id = p.team_id
FROM public.profiles p
WHERE d.team_id IS NULL
  AND d.assigned_to = p.id;
