-- ============================================================
-- MULTI-TEAM BXB SUPPORT
-- Expand team types, add team-level handover assignment
-- ============================================================

-- 1. Expand team_type — from 3 values to 10 + 'other'
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_team_type_check;
ALTER TABLE public.teams ADD CONSTRAINT teams_team_type_check
  CHECK (team_type IN (
    'sales', 'dev', 'design', 'ops', 'marketing',
    'support', 'finance', 'hr', 'mixed', 'other'
  ));

-- 2. Add team-level handover assignment
ALTER TABLE public.technical_handovers
  ADD COLUMN IF NOT EXISTS assigned_team_id uuid REFERENCES public.teams(id);
CREATE INDEX IF NOT EXISTS idx_handovers_team ON public.technical_handovers(assigned_team_id);

-- 3. Update handover RLS so assigned team members can read + update
DROP POLICY IF EXISTS "Own read handovers" ON public.technical_handovers;
CREATE POLICY "Own read handovers" ON public.technical_handovers
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR assigned_team_id = public.get_my_team_id()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Own update handovers" ON public.technical_handovers;
CREATE POLICY "Own update handovers" ON public.technical_handovers
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR assigned_team_id = public.get_my_team_id()
    OR public.is_admin()
  )
  WITH CHECK (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR assigned_team_id = public.get_my_team_id()
    OR public.is_admin()
  );

-- 4. Notify every member of the assigned team
CREATE OR REPLACE FUNCTION public.trg_handover_team_assigned_fn() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_member record;
BEGIN
  IF NEW.assigned_team_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.assigned_team_id IS NOT DISTINCT FROM NEW.assigned_team_id THEN RETURN NEW; END IF;
  FOR v_member IN SELECT id FROM public.profiles WHERE team_id = NEW.assigned_team_id LOOP
    PERFORM public.notify_user(
      v_member.id,
      'Handover assigned to your team',
      NEW.title,
      '/technical-handovers',
      'info'
    );
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.trg_handover_team_assigned_fn() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_handover_team_assigned ON public.technical_handovers;
CREATE TRIGGER trg_handover_team_assigned
  AFTER INSERT OR UPDATE OF assigned_team_id ON public.technical_handovers
  FOR EACH ROW EXECUTE FUNCTION public.trg_handover_team_assigned_fn();

-- 5. Leaderboard view: expose team_id + team_name for team filtering
DROP VIEW IF EXISTS public.global_leaderboard;
CREATE VIEW public.global_leaderboard AS
SELECT
    p.id,
    p.username,
    p.avatar_url,
    p.points,
    t.id   AS team_id,
    t.name AS team_name,
    t.team_type,
    c.name AS country_name,
    c.code AS country_code
FROM public.profiles p
JOIN public.teams t ON p.team_id = t.id
LEFT JOIN public.countries c ON t.country_id = c.id
WHERE p.role = 'member'
ORDER BY p.points DESC;

GRANT SELECT ON public.global_leaderboard TO authenticated;
