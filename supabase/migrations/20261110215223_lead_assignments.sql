CREATE TABLE IF NOT EXISTS public.lead_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    from_user uuid REFERENCES public.profiles(id),
    to_user uuid REFERENCES public.profiles(id),
    changed_by uuid REFERENCES public.profiles(id) NOT NULL,
    reason text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.lead_assignments TO authenticated;

CREATE POLICY "Team read assignments" ON public.lead_assignments
  FOR SELECT TO authenticated
  USING (
    lead_id IN (SELECT id FROM public.leads WHERE team_id = public.get_my_team_id())
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins insert assignments" ON public.lead_assignments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
