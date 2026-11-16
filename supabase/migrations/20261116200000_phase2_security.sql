-- Resources Storage Bucket
DROP POLICY IF EXISTS "Authenticated users can view resources" ON storage.objects;
CREATE POLICY "Team read resources" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resources' AND (storage.foldername(name))[1] = public.get_my_team_id()::text);

-- award_points
CREATE OR REPLACE FUNCTION public.award_points(target_user_id uuid, amount integer)
RETURNS void AS $$
BEGIN
  IF auth.uid() IN (SELECT id FROM public.profiles WHERE role::text = 'admin') THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id AND team_id = public.get_my_team_id()) THEN
      UPDATE public.profiles SET points = points + amount WHERE id = target_user_id;
    ELSE
      RAISE EXCEPTION 'Target user is not in your team';
    END IF;
  ELSE
    RAISE EXCEPTION 'Not authorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- audit_logs
DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Team read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (team_id = public.get_my_team_id() OR public.is_admin());

-- businesses
DROP POLICY IF EXISTS "Team update businesses" ON public.businesses;
CREATE POLICY "Team update businesses" ON public.businesses
  FOR UPDATE TO authenticated
  USING (team_id = public.get_my_team_id())
  WITH CHECK (team_id = public.get_my_team_id());

-- proposal approval RPC
CREATE OR REPLACE FUNCTION public.decide_proposal_approval(p_proposal_id uuid, p_decision text)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can approve proposals';
  END IF;
  UPDATE public.proposals SET approval_status = p_decision, approved_by = auth.uid(), approved_at = now() WHERE id = p_proposal_id;
  UPDATE public.proposal_approvals SET decision = p_decision, reviewed_by = auth.uid(), reviewed_at = now() WHERE proposal_id = p_proposal_id AND decision = 'Pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Team Leader RLS
DROP POLICY IF EXISTS "Team leader read tasks" ON public.tasks;
CREATE POLICY "Team leader read tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role::text = 'team_leader' AND team_id = public.get_my_team_id()));

DROP POLICY IF EXISTS "Team leader read meetings" ON public.meetings;
CREATE POLICY "Team leader read meetings" ON public.meetings
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role::text = 'team_leader' AND team_id = public.get_my_team_id()));
