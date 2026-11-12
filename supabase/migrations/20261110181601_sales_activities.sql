-- Sales Activities
CREATE TABLE IF NOT EXISTS public.sales_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_by uuid REFERENCES public.profiles(id) NOT NULL,
    activity_type text NOT NULL,
    outcome text,
    notes text,
    next_action text,
    next_follow_up date,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.sales_activities TO authenticated;

CREATE POLICY "Team read activities" ON public.sales_activities
  FOR SELECT TO authenticated
  USING (lead_id IN (SELECT id FROM public.leads WHERE team_id = public.get_my_team_id()));

CREATE POLICY "Team insert activities" ON public.sales_activities
  FOR INSERT TO authenticated
  WITH CHECK (lead_id IN (SELECT id FROM public.leads WHERE team_id = public.get_my_team_id()));
