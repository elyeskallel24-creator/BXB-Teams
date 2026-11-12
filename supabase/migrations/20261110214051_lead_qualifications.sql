CREATE TABLE IF NOT EXISTS public.lead_qualifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    business_fit text,
    identified_problem text,
    decision_maker text,
    interest_level text,
    commercial_readiness text,
    score integer,
    missing_info text,
    recommended_action text,
    is_complete boolean DEFAULT false,
    review_status text NOT NULL DEFAULT 'Draft',
    reviewed_by uuid REFERENCES public.profiles(id),
    reviewed_at timestamptz,
    review_notes text,
    created_by uuid REFERENCES public.profiles(id) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(lead_id)
);

ALTER TABLE public.lead_qualifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.lead_qualifications TO authenticated;

CREATE POLICY "Team read qualifications" ON public.lead_qualifications
  FOR SELECT TO authenticated
  USING (
    lead_id IN (SELECT id FROM public.leads WHERE team_id = public.get_my_team_id())
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Team insert qualifications" ON public.lead_qualifications
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND lead_id IN (SELECT id FROM public.leads WHERE team_id = public.get_my_team_id()));

CREATE POLICY "Team update qualifications" ON public.lead_qualifications
  FOR UPDATE TO authenticated
  USING (
    lead_id IN (SELECT id FROM public.leads WHERE team_id = public.get_my_team_id())
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );
