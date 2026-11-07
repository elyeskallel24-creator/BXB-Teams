-- STAGE B: Security hardening
-- 1. Lock claim_user_id to check auth BEFORE touching allowed_user_ids
-- 2. Add search_path to log_views
-- 3. Fix function permissions
-- 4. Lock profile columns so members cannot escalate role or change team

-- ============================================================
-- 1. Fix claim_user_id: check auth FIRST
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_user_id(p_user_id_code text, p_username text, p_avatar_url text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_allowed_id uuid;
  v_team_id uuid;
  v_role public.user_role;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or already used User ID.';
  END IF;

  SELECT id, team_id, role INTO v_allowed_id, v_team_id, v_role
  FROM public.allowed_user_ids
  WHERE user_id_code = p_user_id_code AND is_used = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already used User ID.';
  END IF;

  UPDATE public.allowed_user_ids SET is_used = true WHERE id = v_allowed_id;

  INSERT INTO public.profiles (id, team_id, user_id_code, username, avatar_url, role)
  VALUES (v_user_id, v_team_id, p_user_id_code, p_username, p_avatar_url, v_role);

  RETURN json_build_object('success', true);
END;
$function$;

-- ============================================================
-- 2. Fix log_views: add search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_views(p_update_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.update_views (update_id, user_id)
  SELECT unnest(p_update_ids), auth.uid()
  ON CONFLICT (update_id, user_id) DO NOTHING;
END;
$function$;

-- ============================================================
-- 3. Function permissions
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.claim_user_id(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_user_id(text, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.log_views(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_views(uuid[]) TO authenticated;

GRANT SELECT ON public.update_views TO authenticated;

-- ============================================================
-- 4. Lock profile columns via BEFORE UPDATE trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change role.';
  END IF;
  IF NEW.team_id IS DISTINCT FROM OLD.team_id THEN
    RAISE EXCEPTION 'Cannot change team.';
  END IF;
  IF NEW.user_id_code IS DISTINCT FROM OLD.user_id_code THEN
    RAISE EXCEPTION 'Cannot change User ID.';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();
