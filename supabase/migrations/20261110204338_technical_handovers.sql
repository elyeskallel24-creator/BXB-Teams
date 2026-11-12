CREATE TABLE IF NOT EXISTS public.technical_handovers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_by uuid REFERENCES public.profiles(id) NOT NULL,
    assigned_to uuid REFERENCES public.profiles(id),
    title text NOT NULL,
    client_problem text,
    current_solution text,
    expected_result text,
    desired_solution text,
    project_type text,
    existing_software text,
    existing_website text,
    integrations text,
    technical_restrictions text,
    budget_info text,
    timeline text,
    urgency text,
    competitors text,
    status text NOT NULL DEFAULT 'Draft',
    technical_notes text,
    feasibility text,
    estimated_complexity text,
    estimated_timeline text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.technical_handovers ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.technical_handovers TO authenticated;

CREATE POLICY "Own read handovers" ON public.technical_handovers
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Own insert handovers" ON public.technical_handovers
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Own update handovers" ON public.technical_handovers
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );
